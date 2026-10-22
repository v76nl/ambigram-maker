/**
 * Paper & Code Reader Controller
 */

(function () {
  let currentPaperId = "paper05"; // デフォルトはコンパクトな論文⑤から
  let selectedTermId = null;
  let codeOnlyFilter = false;

  const tooltipEl = document.getElementById("floating-tooltip");
  const contentArea = document.getElementById("content-scroll-area");
  const inspectorArea = document.getElementById("inspector-sidebar");
  const tocListEl = document.getElementById("toc-list");
  const progressPill = document.getElementById("progress-pill");

  // LocalStorageから理解済み用語リストを取得
  function getUnderstoodTerms() {
    try {
      return JSON.parse(localStorage.getItem("understood_terms") || "[]");
    } catch {
      return [];
    }
  }

  function setTermUnderstood(termId, understood) {
    let list = getUnderstoodTerms();
    if (understood) {
      if (!list.includes(termId)) list.push(termId);
    } else {
      list = list.filter((id) => id !== termId);
    }
    localStorage.setItem("understood_terms", JSON.stringify(list));
    updateProgressDisplay();
  }

  function updateProgressDisplay() {
    const understood = getUnderstoodTerms();
    const totalTerms = Object.keys(window.PAPER_ANNOTATIONS || {}).length;
    if (progressPill) {
      progressPill.textContent = `理解済み: ${understood.length} / ${totalTerms} 用語`;
    }
  }

  // 論文・コードの読み込みとレンダリング
  function loadPaper(paperId) {
    currentPaperId = paperId;

    // タブのアクティブ更新
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.paperId === paperId);
    });

    if (paperId === "app_code") {
      loadCodeArchitecture();
      return;
    }

    const paper = window.PAPERS_CONTENT[paperId];
    if (!paper) return;

    // メタ情報ヘッダー
    const metaHeader = `
      <div class="paper-meta-header">
        <h1 class="paper-main-title">${paper.title}</h1>
        <div class="paper-authors">${paper.authors} (${paper.year})</div>
        <div class="paper-source-info">
          <span>📚 ${paper.source}</span>
          <span>•</span>
          <span>${paper.badge}</span>
        </div>
      </div>
    `;

    // 本文レンダリング
    const sheetEl = document.getElementById("paper-sheet");
    sheetEl.innerHTML = metaHeader + paper.html;

    // TOCの更新
    if (tocListEl) {
      tocListEl.innerHTML = paper.toc;
      setupTocSmoothScroll();
    }

    // 各アノテーションのマークにクラスと属性を同期
    const allMarks = sheetEl.querySelectorAll(".annotated-term");
    allMarks.forEach((mark) => {
      const termId = mark.dataset.termId;
      const data = window.PAPER_ANNOTATIONS[termId];
      if (data && data.appImplementation) {
        mark.classList.add("has-app-code");
      }
      if (termId === selectedTermId) {
        mark.classList.add("selected");
      }
    });

    // 初期選択: まだ未選択なら最初のキーワードをインスペクターに自動表示
    if (allMarks.length > 0 && !selectedTermId) {
      const firstTermId = allMarks[0].dataset.termId;
      openInspector(firstTermId);
    } else if (selectedTermId) {
      openInspector(selectedTermId);
    }

    // スクロールトップ
    contentArea.scrollTop = 0;
  }

  // アプリ実装コード読解ビューのレンダリング
  function loadCodeArchitecture() {
    const modules = window.APP_CODE_MODULES || [];
    const sheetEl = document.getElementById("paper-sheet");

    const metaHeader = `
      <div class="paper-meta-header">
        <h1 class="paper-main-title">💻 ambigram-maker アーキテクチャ読解</h1>
        <div class="paper-authors">フォント骨格の手順的変形に基づく180度回転型日本語アンビグラム制作支援システム</div>
        <div class="paper-source-info">
          <span>⚙️ 実装コード ↔ 先行研究数理の完全対応マップ</span>
          <span>•</span>
          <span>sync_code.py 自動抽出連動</span>
        </div>
      </div>
      <div class="architecture-intro-card">
        <p>
          本アプリのバックエンド実装コード（<code>backend/</code>）と、先行研究（論文② 井上・高橋 2020 / 論文⑤ 魏・山口 2023）の数理理論が
          どのように具現化されているかを解読するワークスペースです。<br>
          コードが変更されても、<code>python research/reader/sync_code.py</code> により最新の関数シグネチャ・Docstringが自動同期されます。
        </p>
      </div>
    `;

    let tocHtml = "";
    let contentHtml = "";

    modules.forEach((mod, idx) => {
      tocHtml += `<li class="toc-item"><a href="#${mod.id}">${idx + 1}. ${mod.title}</a></li>`;

      let symbolsHtml = "";
      if (mod.symbols && mod.symbols.length > 0) {
        mod.symbols.forEach((sym) => {
          symbolsHtml += `
            <div class="arch-symbol-box">
              <div class="arch-symbol-header">
                <span class="symbol-type-pill">${sym.type}</span>
                <span class="symbol-name">${sym.name}</span>
                <span class="symbol-line">L${sym.line}</span>
              </div>
              ${sym.docstring ? `<p class="arch-symbol-doc">${escapeHtml(sym.docstring)}</p>` : ""}
              <pre class="code-pre"><code>${escapeHtml(sym.snippet)}</code></pre>
            </div>
          `;
        });
      }

      contentHtml += `
        <section id="${mod.id}" class="paper-section arch-module-section">
          <div class="arch-module-header">
            <span class="arch-file-badge">${mod.file}</span>
            <h2 class="section-title arch-title">${mod.title}</h2>
          </div>

          <div class="arch-meta-grid">
            <div class="arch-why-card">
              <div class="arch-label">🎯 なぜこのコードが必要か (設計意図・Why)</div>
              <p>${mod.why}</p>
            </div>
            <div class="arch-paper-card">
              <div class="arch-label">📖 対応する先行研究エビデンス</div>
              <p>${mod.related_paper}</p>
            </div>
          </div>

          <div class="arch-symbols-container">
            <div class="arch-label">🔍 抽出された最新シンボル・シグネチャ</div>
            ${symbolsHtml || '<div class="empty-hint">シンボル抽出なし</div>'}
          </div>
        </section>
      `;
    });

    sheetEl.innerHTML = metaHeader + contentHtml;

    if (tocListEl) {
      tocListEl.innerHTML = tocHtml;
      setupTocSmoothScroll();
    }

    contentArea.scrollTop = 0;
  }

  // TOCのスムーススクロール
  function setupTocSmoothScroll() {
    tocListEl.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = link.getAttribute("href").replace("#", "");
        const targetSec = document.getElementById(targetId);
        if (targetSec) {
          targetSec.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  // ツールチップの制御
  function showTooltip(e, termId) {
    const data = window.PAPER_ANNOTATIONS[termId];
    if (!data || !tooltipEl) return;

    tooltipEl.innerHTML = `
      <span class="tooltip-title">${data.term}</span>
      <span>${data.shortSummary}</span>
      <span class="tooltip-click-hint">👉 クリックでアプリコード対応と詳細解説</span>
    `;

    positionTooltip(e);
    tooltipEl.classList.add("visible");
  }

  function positionTooltip(e) {
    if (!tooltipEl) return;
    const padding = 14;
    let x = e.clientX + padding;
    let y = e.clientY + padding;

    // 画面外はみ出し防止
    const rect = tooltipEl.getBoundingClientRect();
    if (x + 320 > window.innerWidth) {
      x = e.clientX - 320 - padding;
    }
    if (y + 120 > window.innerHeight) {
      y = e.clientY - 120 - padding;
    }

    tooltipEl.style.left = `${Math.max(10, x)}px`;
    tooltipEl.style.top = `${Math.max(10, y)}px`;
  }

  function hideTooltip() {
    if (tooltipEl) {
      tooltipEl.classList.remove("visible");
    }
  }

  // インスペクター（右サイドパネル）の表示
  function openInspector(termId) {
    selectedTermId = termId;
    const data = window.PAPER_ANNOTATIONS[termId];
    if (!data || !inspectorArea) return;

    // 全ての選択ハイライトを更新
    document.querySelectorAll(".annotated-term").forEach((m) => {
      m.classList.toggle("selected", m.dataset.termId === termId);
    });

    const understoodList = getUnderstoodTerms();
    const isUnderstood = understoodList.includes(termId);

    let codeSectionHtml = "";
    if (data.appImplementation) {
      codeSectionHtml = `
        <div class="inspector-block">
          <div class="block-label">
            <span>⚙️ このアプリ (ambigram-maker) での実装</span>
          </div>
          <div class="code-integration-card">
            <div class="code-header">
              <span class="code-file-badge">${data.appImplementation.filePath}</span>
              <span class="code-fn-name">${data.appImplementation.functionName}</span>
            </div>
            <div class="code-description">${data.appImplementation.description}</div>
            ${
              data.appImplementation.codeSnippet
                ? `<pre class="code-pre"><code>${escapeHtml(data.appImplementation.codeSnippet)}</code></pre>`
                : ""
            }
          </div>
        </div>
      `;
    }

    inspectorArea.innerHTML = `
      <div class="inspector-card">
        <div class="inspector-header-box">
          <div class="term-tag-row">
            <span class="term-category-badge">${data.category}</span>
            <span class="term-difficulty-badge">${data.difficulty}</span>
          </div>
          <h2 class="term-heading">${data.term}</h2>
          <div class="term-reading">${data.reading || ""}</div>
        </div>

        <div class="inspector-block">
          <div class="block-label">💡 中学生でもわかる直感的たとえ</div>
          <div class="analogy-box">${data.intuitiveAnalogy}</div>
        </div>

        <div class="inspector-block">
          <div class="block-label">📖 論文における役割・選定理由</div>
          <div class="role-box">${data.paperRole}</div>
        </div>

        ${codeSectionHtml}

        <button id="toggle-understood-btn" class="check-understood-btn ${isUnderstood ? "checked" : ""}">
          <span>${isUnderstood ? "✓ 理解できた！（記録済み）" : "◯ 理解したらクリック（チェックをつける）"}</span>
        </button>
      </div>
    `;

    // 理解チェックボタンのイベントリスナー
    const checkBtn = document.getElementById("toggle-understood-btn");
    if (checkBtn) {
      checkBtn.addEventListener("click", () => {
        const currentlyUnderstood = getUnderstoodTerms().includes(termId);
        setTermUnderstood(termId, !currentlyUnderstood);
        openInspector(termId); // 再描画
      });
    }
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // イベントリスナーのセットアップ
  function setupEvents() {
    // タブ切り替え
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        loadPaper(btn.dataset.paperId);
      });
    });

    // コード連動フィルター
    const filterBtn = document.getElementById("toggle-code-filter-btn");
    if (filterBtn) {
      filterBtn.addEventListener("click", () => {
        codeOnlyFilter = !codeOnlyFilter;
        document.body.classList.toggle("filter-code-only", codeOnlyFilter);
        filterBtn.classList.toggle("active", codeOnlyFilter);
      });
    }

    // マウスホバーとクリックのデリゲーション
    contentArea.addEventListener("mouseover", (e) => {
      const termEl = e.target.closest(".annotated-term");
      if (termEl) {
        showTooltip(e, termEl.dataset.termId);
      }
    });

    contentArea.addEventListener("mousemove", (e) => {
      if (tooltipEl && tooltipEl.classList.contains("visible")) {
        positionTooltip(e);
      }
    });

    contentArea.addEventListener("mouseout", (e) => {
      const termEl = e.target.closest(".annotated-term");
      if (termEl) {
        hideTooltip();
      }
    });

    contentArea.addEventListener("click", (e) => {
      const termEl = e.target.closest(".annotated-term");
      if (termEl) {
        hideTooltip();
        openInspector(termEl.dataset.termId);
      }
    });

    // キーボードショートカット
    window.addEventListener("keydown", (e) => {
      if (e.key === "1") {
        loadPaper("paper05");
      } else if (e.key === "2") {
        loadPaper("paper02");
      } else if (e.key === "3") {
        loadPaper("app_code");
      } else if (e.key === "Escape") {
        hideTooltip();
      }
    });
  }

  // 初期化実行
  document.addEventListener("DOMContentLoaded", () => {
    setupEvents();
    loadPaper(currentPaperId);
    updateProgressDisplay();
  });
})();
