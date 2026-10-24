/**
 * Paper & Code Reader Controller
 * - 論文⑤（魏・山口 2023）/ 論文②（井上・高橋 2020）/ アプリ実装コードのシームレス読解
 * - アクロニム解説、概念図解インフォグラフィック、原本図表ライトボックス拡大対応
 * - KaTeX数式自動レンダリング、目次スクロールスパイ、用語習得トラッキング
 */

(function () {
  let currentPaperId = "paper05"; // デフォルトは論文⑤から
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
      progressPill.textContent = `習得 ${understood.length}/${totalTerms}`;
    }
  }

  // KaTeX 数式自動レンダリング
  function renderMath(targetElement) {
    if (!targetElement) return;
    const run = () => {
      if (window.renderMathInElement) {
        window.renderMathInElement(targetElement, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false }
          ],
          throwOnError: false
        });
      }
    };
    if (window.renderMathInElement) {
      run();
    } else {
      window.addEventListener("load", run, { once: true });
      setTimeout(run, 200);
      setTimeout(run, 600);
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
          <span>${paper.source}</span>
          <span>•</span>
          <span>${paper.badge}</span>
        </div>
      </div>
    `;

    // 本文レンダリング
    const sheetEl = document.getElementById("paper-sheet");
    sheetEl.innerHTML = metaHeader + paper.html;

    // KaTeX 数式自動レンダリング
    renderMath(sheetEl);

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
        <h1 class="paper-main-title">システム・アーキテクチャ</h1>
        <div class="paper-authors">フォント骨格の手順的変形に基づく180度回転型日本語アンビグラム制作支援システム</div>
        <div class="paper-source-info">
          <span>先行研究数理とコード実装の対応</span>
          <span>•</span>
          <span>AST自動抽出連動</span>
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
              <div class="arch-label">設計意図</div>
              <p>${mod.why}</p>
            </div>
            <div class="arch-paper-card">
              <div class="arch-label">先行研究エビデンス</div>
              <p>${mod.related_paper}</p>
            </div>
          </div>

          <div class="arch-symbols-container">
            <div class="arch-label">抽出シンボル</div>
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
      <span class="tooltip-click-hint">クリックして詳細を表示</span>
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
          <div class="block-label">本システムでの実装</div>
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

    let acronymsHtml = "";
    if (data.acronyms && data.acronyms.length > 0) {
      acronymsHtml = `
        <div class="inspector-block">
          <div class="block-label">略語の正式名称と直訳 (Acronyms)</div>
          <div class="acronym-list">
            ${data.acronyms
              .map(
                (a) => `
              <div class="acronym-card">
                <div class="acronym-head">
                  <span class="acronym-abbr">${escapeHtml(a.abbr)}</span>
                  <span class="acronym-expansion">${escapeHtml(a.expansion)}</span>
                </div>
                <div class="acronym-literal">直訳: <strong>${escapeHtml(a.literalTranslation)}</strong></div>
                ${a.note ? `<div class="acronym-literal" style="margin-top:0.15rem;font-size:0.74rem;">${escapeHtml(a.note)}</div>` : ""}
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `;
    }

    let diagramSectionHtml = "";
    if (data.diagram) {
      diagramSectionHtml = `
        <div class="inspector-block">
          <div class="block-label">💡 概念図解 (Infographic Explainer)</div>
          <div class="concept-diagram-card">
            <div class="concept-diagram-wrapper">
              <img src="${data.diagram.src}" alt="${escapeHtml(data.diagram.title)}" class="figure-zoomable" data-zoom-src="${data.diagram.src}" data-caption="${escapeHtml(data.diagram.title + ' — ' + data.diagram.caption)}">
              <button class="figure-expand-btn" title="拡大表示" aria-label="拡大表示" data-zoom-src="${data.diagram.src}" data-caption="${escapeHtml(data.diagram.title + ' — ' + data.diagram.caption)}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
              </button>
            </div>
            <div class="concept-diagram-title">${escapeHtml(data.diagram.title)}</div>
            <div class="concept-diagram-caption">${escapeHtml(data.diagram.caption)}</div>
          </div>
        </div>
      `;
    }

    const stars = (data.difficulty.match(/★/g) || []).length;
    const levelText = stars ? `Lv.${stars}` : data.difficulty;

    inspectorArea.innerHTML = `
      <div class="inspector-card">
        <div class="inspector-header-box">
          <div class="term-tag-row">
            <span class="term-category-badge">${data.category}</span>
            <span class="term-difficulty-badge">難易度 ${levelText}</span>
          </div>
          <h2 class="term-heading">${data.term}</h2>
          <div class="term-reading">${data.reading || ""}</div>
        </div>

        ${acronymsHtml}

        ${diagramSectionHtml}

        <div class="inspector-block">
          <div class="block-label">直感的解説</div>
          <div class="analogy-box">${data.intuitiveAnalogy}</div>
        </div>

        <div class="inspector-block">
          <div class="block-label">論文での役割</div>
          <div class="role-box">${data.paperRole}</div>
        </div>

        ${codeSectionHtml}

        <button id="toggle-understood-btn" class="check-understood-btn ${isUnderstood ? "checked" : ""}">
          <svg class="btn-check-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>${isUnderstood ? "習得済み（記録中）" : "習得済みにする"}</span>
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

  // ライトボックス（画像拡大モーダル）
  let lightboxEl = null;

  function initLightbox() {
    if (lightboxEl) return;
    lightboxEl = document.createElement("div");
    lightboxEl.id = "lightbox-modal";
    lightboxEl.className = "lightbox-modal";
    lightboxEl.innerHTML = `
      <div class="lightbox-overlay"></div>
      <div class="lightbox-content">
        <button class="lightbox-close-btn" title="閉じる (Esc)" aria-label="閉じる">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        <div class="lightbox-image-wrap">
          <img class="lightbox-img" src="" alt="拡大表示">
        </div>
        <div class="lightbox-caption"></div>
      </div>
    `;
    document.body.appendChild(lightboxEl);

    lightboxEl.querySelector(".lightbox-overlay").addEventListener("click", closeLightbox);
    lightboxEl.querySelector(".lightbox-close-btn").addEventListener("click", closeLightbox);
  }

  function openLightbox(src, captionHtml) {
    initLightbox();
    const imgEl = lightboxEl.querySelector(".lightbox-img");
    const capEl = lightboxEl.querySelector(".lightbox-caption");
    imgEl.src = src;
    capEl.innerHTML = captionHtml || "";
    lightboxEl.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lightboxEl) return;
    lightboxEl.classList.remove("active");
    document.body.style.overflow = "";
  }

  // イベントリスナーのセットアップ
  function setupEvents() {
    initLightbox();

    // 画像クリックによる拡大表示の委任
    document.addEventListener("click", (e) => {
      const zoomTarget = e.target.closest(".figure-zoomable, .figure-expand-btn");
      if (zoomTarget) {
        e.preventDefault();
        e.stopPropagation();

        const fig = zoomTarget.closest(".paper-figure, .concept-diagram-card");
        let src = zoomTarget.dataset.zoomSrc;
        if (!src && zoomTarget.tagName === "IMG") {
          src = zoomTarget.src;
        } else if (!src && fig) {
          const img = fig.querySelector("img");
          if (img) src = img.dataset.zoomSrc || img.src;
        }

        let captionHtml = zoomTarget.dataset.caption;
        if (!captionHtml && fig) {
          const capEl = fig.querySelector(".paper-figcaption, .concept-diagram-caption");
          if (capEl) captionHtml = capEl.innerHTML;
        }

        if (src) {
          openLightbox(src, captionHtml);
        }
      }
    });

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

    // 目次クリック時のスムーズスクロールとアクティブ更新
    if (tocListEl) {
      tocListEl.addEventListener("click", (e) => {
        const link = e.target.closest("a");
        if (!link) return;
        const targetId = link.getAttribute("href");
        if (!targetId || !targetId.startsWith("#")) return;

        e.preventDefault();
        const targetSec = document.querySelector(targetId);
        if (targetSec) {
          targetSec.scrollIntoView({ behavior: "smooth", block: "start" });
          document.querySelectorAll(".toc-item a").forEach((a) => a.classList.remove("active"));
          link.classList.add("active");
        }
      });
    }

    // スクロールスパイ: 閲覧中のセクションを目次でハイライト
    let scrollTimeout = null;
    contentArea.addEventListener("scroll", () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        scrollTimeout = null;
        const sections = document.querySelectorAll(".paper-section");
        const scrollPos = contentArea.scrollTop + 80;
        let activeSectionId = null;

        sections.forEach((sec) => {
          if (sec.offsetTop <= scrollPos) {
            activeSectionId = sec.id;
          }
        });

        if (activeSectionId) {
          document.querySelectorAll(".toc-item a").forEach((a) => {
            const href = a.getAttribute("href");
            a.classList.toggle("active", href === `#${activeSectionId}`);
          });
        }
      }, 100);
    });

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
        loadPaper("paper09");
      } else if (e.key === "4") {
        loadPaper("paper17");
      } else if (e.key === "5") {
        loadPaper("app_code");
      } else if (e.key === "Escape") {
        hideTooltip();
        closeLightbox();
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
