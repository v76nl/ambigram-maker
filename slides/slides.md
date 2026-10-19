---
marp: true
theme: default
paginate: true
size: 16:9
style: |
  @import url('https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&family=Inter:wght@400;500;600;700&display=swap');

  section {
    font-family: 'Inter', 'BIZ UDPGothic', 'BIZ UDGothic', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;
    padding: 34px 52px;
    background-color: #FFFFFF;
    color: #1A1A1A;
    font-size: 28px;
    letter-spacing: 0.02em;
    display: flex !important;
    flex-direction: column !important;
    justify-content: flex-start !important;
    align-items: stretch !important;
  }

  /* 表紙レイアウト */
  section.title-slide {
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    align-items: flex-start !important;
    padding: 80px 88px !important;
  }

  section.title-slide h1 {
    font-size: 40px;
    font-weight: 700;
    line-height: 1.35;
    letter-spacing: 0.03em;
    color: #1A1A1A;
    margin-bottom: 24px;
    border: none;
    padding: 0;
  }

  section.title-slide .accent-bar {
    width: 72px;
    height: 6px;
    background-color: #D84315;
    margin-bottom: 36px;
  }

  section.title-slide .meta-info {
    font-size: 28px;
    color: #4A5568;
    line-height: 1.6;
    letter-spacing: 0.02em;
    font-variant-numeric: tabular-nums;
  }

  section.title-slide h1::after {
    display: none;
  }

  /* ページ番号: スライド右下に見切れる四角形バッジ & 白抜き文字 */
  section::after {
    content: attr(data-marpit-pagination);
    position: absolute;
    right: 0;
    bottom: 0;
    min-width: 68px;
    height: 52px;
    padding: 0 16px;
    background-color: #D84315;
    color: #FFFFFF !important;
    font-size: 28px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    display: flex !important;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    z-index: 10;
    line-height: 1;
    pointer-events: none;
  }

  section:not([data-marpit-pagination])::after,
  section.title-slide::after {
    display: none !important;
  }

  /* 一般スライドの見出し (進捗インジケーター付き区切り線) */
  h1 {
    font-size: 38px;
    font-weight: 700;
    color: #1A1A1A;
    margin: 0 0 16px 0;
    padding-bottom: 8px;
    line-height: 1.3;
    letter-spacing: 0.025em;
    flex-shrink: 0;
    border-bottom: none;
    position: relative;
  }

  h1::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: linear-gradient(
      to right,
      #D84315 0%,
      #D84315 var(--progress, 0%),
      #CBD5E1 var(--progress, 0%),
      #CBD5E1 100%
    );
  }

  /* スライドごとの進捗率 (全8ページ構成) */
  section:nth-of-type(1), section[id="1"] { --progress: 12.5%; }
  section:nth-of-type(2), section[id="2"] { --progress: 25.0%; }
  section:nth-of-type(3), section[id="3"] { --progress: 37.5%; }
  section:nth-of-type(4), section[id="4"] { --progress: 50.0%; }
  section:nth-of-type(5), section[id="5"] { --progress: 62.5%; }
  section:nth-of-type(6), section[id="6"] { --progress: 75.0%; }
  section:nth-of-type(7), section[id="7"] { --progress: 87.5%; }
  section:nth-of-type(8), section[id="8"] { --progress: 100.0%; }

  /* 2カラムレイアウト (縦中央揃え) */
  .slide-grid {
    display: grid;
    grid-template-columns: 1fr 370px;
    gap: 28px;
    align-items: center;
    flex: 1;
    min-height: 0;
  }

  .main-col {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  /* 箇条書きスタイル */
  ul.points {
    margin: 0;
    padding-left: 28px;
    list-style-type: square;
  }

  ul.points > li {
    font-size: 28px;
    line-height: 1.5;
    margin-bottom: 14px;
    color: #2D3748;
  }

  ul.points > li:last-child {
    margin-bottom: 0;
  }

  ul.points > li strong {
    color: #1A1A1A;
    font-weight: 700;
  }

  /* Quantity Queries (項目数に応じた自動スケール) */
  ul.points:has(> li:nth-child(4)) > li {
    font-size: 25px;
    line-height: 1.42;
    margin-bottom: 10px;
  }
  ul.points:has(> li:nth-child(5)) > li {
    font-size: 22px;
    line-height: 1.35;
    margin-bottom: 8px;
  }

  .cite {
    display: inline-block;
    color: #D84315;
    font-weight: 700;
    margin-right: 4px;
  }

  /* 右側ダイアグラム/プレースホルダーボックス */
  .diag-box {
    background: transparent;
    border: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: 100%;
    gap: 12px;
  }

  .placeholder-card {
    width: 100%;
    border: 2px dashed #CBD5E1;
    border-radius: 8px;
    padding: 24px 16px;
    text-align: center;
    background-color: #F8FAFC;
    color: #64748B;
    font-size: 20px;
    box-sizing: border-box;
  }

  .rel-badge {
    position: relative;
    z-index: 2;
    background-color: #FFFFFF !important;
    border: 3px solid #CBD5E1;
    border-radius: 8px;
    font-size: 26px;
    font-weight: 700;
    color: #1A1A1A;
    padding: 10px 18px;
    text-align: center;
    line-height: 1.35;
    box-sizing: border-box;
    width: 90%;
  }

  .rel-badge.accent {
    border-color: #D84315;
    color: #D84315;
    background-color: #FFFFFF !important;
  }

  /* 中央配置レイアウト */
  .center-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    text-align: center;
    min-height: 0;
  }

  .ambigram-header-area {
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    box-sizing: border-box;
  }

  .question-text {
    font-size: 38px;
    font-weight: 700;
    color: #1A1A1A;
    margin: 0;
    letter-spacing: 0.02em;
    line-height: 1.3;
  }

  .ambigram-footer-area {
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 20px;
    box-sizing: border-box;
  }

  .caption-text {
    font-size: 26px;
    color: #2D3748;
    line-height: 1.5;
    margin: 0;
  }

  /* 分裂 & 180度回転ステージ */
  .split-ambigram-stage {
    display: flex;
    justify-content: center;
    align-items: stretch;
    gap: 48px;
    width: 100%;
    max-width: 960px;
    margin: 0;
    position: relative;
    box-sizing: border-box;
  }

  .split-ambigram-stage.single-stage {
    justify-content: center;
  }

  .split-ambigram-stage.single-stage .split-card {
    flex: 0 0 456px;
    width: 456px;
    max-width: 456px;
  }

  .split-card {
    flex: 1;
    max-width: 456px;
    background-color: #FFFFFF;
    border: 2px solid #CBD5E1;
    border-radius: 14px;
    padding: 24px 20px 20px 20px;
    box-sizing: border-box;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .split-card img {
    max-width: 95%;
    max-height: 230px;
    object-fit: contain;
    display: block;
  }

  /* アニメーション: 中央状態から左へスムーズに移動 (等倍平行移動) */
  @keyframes slide-to-left {
    0% {
      transform: translateX(calc(50% + 24px));
      z-index: 1;
    }
    15% {
      transform: translateX(calc(50% + 24px));
      z-index: 1;
    }
    100% {
      transform: translateX(0);
      z-index: 1;
    }
  }

  /* アニメーション: 中央状態から右へスムーズに移動 (等倍平行移動) */
  @keyframes slide-to-right {
    0% {
      transform: translateX(calc(-50% - 24px));
      z-index: 2;
    }
    15% {
      transform: translateX(calc(-50% - 24px));
      z-index: 2;
    }
    100% {
      transform: translateX(0);
      z-index: 2;
    }
  }

  /* 画像の180度回転アニメーション (ease-in-out) */
  @keyframes img-spin-180 {
    0% {
      transform: rotate(0deg);
    }
    15% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(180deg);
    }
  }

  /* ラベルバッジのフェードインアニメーション */
  @keyframes badge-reveal {
    0% {
      opacity: 0;
      transform: translateY(8px);
    }
    20% {
      opacity: 0;
      transform: translateY(8px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .is-hidden {
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }

  /* 初期状態（スライド5読み込み時・待機時）: スライド4と1pxの狂いもなく中央・重なり・0度で待機 (チラつき防止) */
  .anim-left {
    transform: translateX(calc(50% + 24px));
    transform-origin: center center;
    animation: none;
  }

  .anim-right {
    transform: translateX(calc(-50% - 24px));
    transform-origin: center center;
    animation: none;
  }

  .anim-rotate-img {
    transform: rotate(0deg);
    transform-origin: center center;
    animation: none;
  }

  .split-card .rel-badge {
    margin-top: 14px;
    font-size: 22px;
    padding: 6px 16px;
    opacity: 0;
    transform: translateY(8px);
    width: auto;
    min-width: 140px;
  }

  .split-card .rel-badge.is-hidden {
    visibility: hidden !important;
    opacity: 0 !important;
  }

  /* .is-animated が付与された瞬間にアニメーション開始 */
  .is-animated .anim-left {
    animation: slide-to-left 1.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .is-animated .anim-right {
    animation: slide-to-right 1.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .is-animated .anim-rotate-img {
    animation: img-spin-180 1.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .is-animated .split-card .rel-badge:not(.is-hidden) {
    animation: badge-reveal 1.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  /* 目次スライド */
  section.toc-slide {
    display: flex !important;
    flex-direction: column !important;
    justify-content: flex-start !important;
  }

  /* 研究の3要素カードグリッド */
  .three-elements-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 22px;
    width: 100%;
    margin-top: 14px;
    align-items: stretch;
    flex: 1;
  }

  .element-card {
    background-color: #FFFFFF;
    border: 2px solid #CBD5E1;
    border-radius: 14px;
    padding: 24px 20px;
    box-sizing: border-box;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }

  .element-card.accent-card {
    border-color: #D84315;
    background: #FFFDFB;
  }

  .element-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #F1F5F9;
    padding-bottom: 12px;
    margin-bottom: 14px;
  }

  .element-title {
    font-size: 30px;
    font-weight: 700;
    color: #1A1A1A;
  }

  .status-badge {
    font-size: 19px;
    font-weight: 700;
    padding: 4px 14px;
    border-radius: 6px;
    border: 2px solid #CBD5E1;
    background: #FFFFFF;
    color: #1A1A1A;
  }

  .status-badge.accent {
    border-color: #D84315;
    color: #D84315;
    background: #FFF3E0;
  }

  .status-badge.warn {
    border-color: #3078C5;
    color: #3078C5;
    background: #F0F7FF;
  }

  .status-badge.info {
    border-color: #3078C5;
    color: #3078C5;
    background: #F0F7FF;
  }

  .element-content {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  /* 研究の3要素カード内のテキスト & リスト (Marpサニタイズ対策クラス) */
  .element-lead {
    font-size: 25px;
    font-weight: 700;
    line-height: 1.4;
    margin: 0 0 12px 0;
    color: #1A1A1A;
  }

  .element-lead.accent {
    color: #D84315;
    font-size: 26px;
    margin-bottom: 14px;
  }

  .element-lead.info {
    color: #3078C5;
  }

  .element-list {
    font-size: 20px;
    line-height: 1.5;
    padding-left: 20px;
    color: #4A5568;
    margin: 0;
  }

  .element-list > li {
    margin-bottom: 8px;
  }

  .element-list > li:last-child {
    margin-bottom: 0;
  }

  .element-action-box {
    margin-top: 14px;
    background: #F0F7FF;
    border: 1.5px dashed #B2D9FE;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 18px;
    line-height: 1.35;
    color: #3078C5;
    font-weight: 700;
    text-align: center;
  }

  .toc-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
    padding-bottom: 8px;
  }

  .toc-container {
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  .toc-item {
    display: flex;
    align-items: baseline;
    width: 100%;
    font-size: 28px;
    line-height: 1.4;
    margin-bottom: 12px;
    color: #1A1A1A;
  }

  .toc-sub-item {
    display: flex;
    align-items: baseline;
    width: 100%;
    font-size: 26px;
    line-height: 1.35;
    margin-bottom: 9px;
    padding-left: 36px;
    box-sizing: border-box;
    color: #334155;
  }

  .toc-text {
    flex-shrink: 0;
  }

  .toc-leader {
    flex-grow: 1;
    border-bottom: 2px dotted #94A3B8;
    margin: 0 16px 5px 16px;
  }

  .toc-sub-item .toc-leader {
    border-bottom: 2px dotted #CBD5E1;
  }

  .toc-page {
    flex-shrink: 0;
    font-weight: 700;
    font-size: 28px;
    color: #D84315;
    font-variant-numeric: tabular-nums;
    min-width: 32px;
    text-align: right;
  }

  .toc-sub-item .toc-page {
    font-size: 26px;
    color: #64748B;
    font-weight: 600;
  }

  .toc-num {
    color: #D84315;
    font-weight: 700;
    margin-right: 8px;
    font-variant-numeric: tabular-nums;
  }

  .toc-accent {
    color: #D84315;
    font-weight: 700;
    margin-right: 6px;
  }

  footer {
    font-size: 16px;
    color: #A0AEC0;
  }
---

<!-- _class: title-slide -->
<!-- _paginate: false -->

# フォント骨格の手順的変形に基づく<br>180度回転型日本語アンビグラム制作支援システム

<div class="accent-bar"></div>

<div class="meta-info">
{{AFFILIATION}}<br>
{{STUDENT_NAME}}（{{STUDENT_ID}}）<br>
{{PRESENTATION_DATE}}
</div>

---

<!-- _class: toc-slide -->

# 目次

<div class="toc-wrapper">
  <div class="toc-container">
    <div class="toc-item">
      <span class="toc-text"><span class="toc-num">1.</span><strong>はじめに</strong></span>
      <span class="toc-leader"></span>
      <span class="toc-page">3</span>
    </div>
    <div class="toc-item">
      <span class="toc-text"><span class="toc-num">2.</span><strong>アンビグラムとは？</strong></span>
      <span class="toc-leader"></span>
      <span class="toc-page">4</span>
    </div>
    <div class="toc-item">
      <span class="toc-text"><span class="toc-num">3.</span><strong>システムのデモ</strong></span>
      <span class="toc-leader"></span>
      <span class="toc-page">6</span>
    </div>
    <div class="toc-item">
      <span class="toc-text"><span class="toc-num">4.</span><strong>研究の3要素確認</strong></span>
      <span class="toc-leader"></span>
      <span class="toc-page">7</span>
    </div>
    <div class="toc-item">
      <span class="toc-text"><span class="toc-num">5.</span><strong>まとめと今後の展望</strong></span>
      <span class="toc-leader"></span>
      <span class="toc-page">8</span>
    </div>
  </div>
</div>

---

# 1. はじめに

<div class="main-col" style="justify-content: center; flex: 1;">
  <ul class="points" style="font-size: 30px; line-height: 1.6;">
    <li>11月29日のHCD学会でポスター発表を予定</li>
    <li>調査・実装にAIエージェントを活用して進めた</li>
    <div style="margin-left: 28px; margin-top: 8px;">→ 見落としや論理の穴があるかも</div>
    <div style="margin-left: 28px; margin-top: 8px;">→ 気になった点・疑問点・改善アイデア等あれば教えてください</div>
  </ul>
</div>

---

# 2. アンビグラムとは？

<div class="center-content">
  <div class="ambigram-header-area">
    <div class="question-text">読める？</div>
  </div>

  <div class="split-ambigram-stage single-stage">
    <div class="split-card">
      <img src="images/ambigram_saiaku.png" alt="最悪 アンビグラム">
      <div class="rel-badge is-hidden">0°</div>
    </div>
  </div>

  <div class="ambigram-footer-area">
    <div class="caption-text is-hidden">
      逆さにしても同じ<strong>「最悪」</strong>と読めるタイポグラフィ（=180度回転同一型アンビグラム）
    </div>
  </div>
</div>

---

# 2. アンビグラムとは？

<div class="center-content">
  <div class="ambigram-header-area">
    <div class="question-text is-hidden">読める？</div>
  </div>

  <div class="split-ambigram-stage" id="ambigram-stage">
    <!-- 左：正位置（中央から左へ移動） -->
    <div class="split-card anim-left">
      <img src="images/ambigram_saiaku.png" alt="最悪 正位置">
      <div class="rel-badge">0°</div>
    </div>
    <!-- 右：180度回転（中央から回転しながら右へ移動） -->
    <div class="split-card anim-right">
      <img src="images/ambigram_saiaku.png" class="anim-rotate-img" alt="最悪 180度回転">
      <div class="rel-badge accent">180°回転</div>
    </div>
  </div>

  <div class="ambigram-footer-area">
    <div class="caption-text">
      逆さにしても同じ<strong>「最悪」</strong>と読めるタイポグラフィ（=180度回転同一型アンビグラム）
    </div>
  </div>
</div>

---

# 2. アンビグラムとは？

<div class="slide-grid">
  <div class="main-col">
  <strong>
    Xに上がっている作例を確認
    </strong>
  </div>
</div>

---

# 3. システムのデモ

<div class="slide-grid">
  <div class="main-col">
    <strong>実際のソフトをデモンストレーション</strong>
  </div>
</div>

---

# 4. 研究の3要素確認

<div class="three-elements-grid">
  <!-- 新規性 -->
  <div class="element-card accent-card">
    <div class="element-header">
      <span class="element-title">新規性</span>
      <span class="status-badge accent">◎ あり</span>
    </div>
    <div class="element-content">
      <p class="element-lead accent">Google Scholar等で調べ、このアプローチは無さそうなので新規性あり <br>※要再調査</p>
      <ul class="element-list">
        <li>辞書ベースの対称性探索・骨格の手続き的変形</li>
        <li>アンビグラム作家の職人芸に依存しない制作支援</li>
      </ul>
    </div>
  </div>

  <!-- 信頼性 -->
  <div class="element-card">
    <div class="element-header">
      <span class="element-title">信頼性</span>
      <span class="status-badge">◯ あり？</span>
    </div>
    <div class="element-content">
      <p class="element-lead">実際に読めている時点であり？</p>
      <ul class="element-list">
        <li>実際、180度回転後も「最悪」と判読できる</li>
        <li>AI判定による客観的可読性評価</li>
      </ul>
    </div>
  </div>

  <!-- 有効性 -->
  <div class="element-card" style="border-color: #E2E8F0;">
    <div class="element-header">
      <span class="element-title">有効性</span>
      <span class="status-badge warn">△ 微妙</span>
    </div>
    <div class="element-content">
      <p class="element-lead info">微妙！ どう活用するかが未定</p>
      <ul class="element-list">
        <li>「何のために使うのか？」「誰が喜ぶか？」</li>
        <li>実社会・デザイン現場での価値を模索中</li>
      </ul>
      <div class="element-action-box">
        → 活用アイデアがあれば教えてください
      </div>
    </div>
  </div>
</div>

---

# 5. まとめと今後の展望

<div class="slide-grid">
  <div class="main-col">
    <ul class="points">
      <li>
        <strong>本研究のまとめ</strong><br>
        フォント骨格の手続き的変形による、職人芸に依存しない180度回転型アンビグラム制作支援を実現
      </li>
      <li>
        <strong>HCD学会 (11/29) ポスター発表に向けた課題</strong><br>
      </li>
      <li>
        <strong>フィードバックのお願い</strong><br>
        見落としの指摘やアドバイスなど、気になった点は気軽に教えてください
      </li>
    </ul>
  </div>
</div>
