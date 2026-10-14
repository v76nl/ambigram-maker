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

  /* スライドごとの進捗率 (全5ページ構成) */
  section:nth-of-type(1), section[id="1"] { --progress: 20.0%; }
  section:nth-of-type(2), section[id="2"] { --progress: 40.0%; }
  section:nth-of-type(3), section[id="3"] { --progress: 60.0%; }
  section:nth-of-type(4), section[id="4"] { --progress: 80.0%; }
  section:nth-of-type(5), section[id="5"] { --progress: 100.0%; }

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

  /* 目次スライド */
  section.toc-slide {
    display: flex !important;
    flex-direction: column !important;
    justify-content: flex-start !important;
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
      <span class="toc-text"><span class="toc-num">2.</span><strong>研究背景と課題（仮）</strong></span>
      <span class="toc-leader"></span>
      <span class="toc-page">4</span>
    </div>
    <div class="toc-item">
      <span class="toc-text"><span class="toc-num">3.</span><strong>提案システム・アプローチ（仮）</strong></span>
      <span class="toc-leader"></span>
      <span class="toc-page">5</span>
    </div>
  </div>
</div>

---

# 1. はじめに

<div class="slide-grid">
  <div class="main-col">
    <ul class="points">
      <li>
        <strong>11/29 HCD-Net 学会でポスター発表予定</strong><br>
        本研究は、人間中心設計推進機構（HCD-Net）の研究発表会にてポスター発表を予定している。
      </li>
      <li>
        <strong>AIエージェントを活用した研究・開発</strong><br>
        アルゴリズム設計や実装にAIエージェントを活用して進めたため、見落としや論理の穴があるかもしれない。
      </li>
      <li>
        <strong>忌憚のないご意見・フィードバックを歓迎</strong><br>
        発表の完成度を高めるため、気になった点や疑問点、改善アイデアがあればぜひ教えてほしい。
      </li>
    </ul>
  </div>
  <div class="diag-box">
    <div class="rel-badge accent">11/29 HCD-Net<br>ポスター発表</div>
    <div style="font-size: 24px; color: #D84315; font-weight: bold;">×</div>
    <div class="rel-badge">AIエージェント<br>共創研究</div>
    <div class="placeholder-card" style="padding: 16px; font-size: 19px; line-height: 1.4;">
      <strong>ご意見募集中</strong><br>
      気になった点は<br>ぜひ教えてください！
    </div>
  </div>
</div>

---

# 第2章：提案手法・アプローチ（仮）

<div class="slide-grid">
  <div class="main-col">
    <ul class="points">
      <li>
        <strong>手法の全体フロー（仮）</strong><br>
        処理の流れやアルゴリズムの主要ステップについての解説文が入ります。
      </li>
      <li>
        <strong>特徴的な仕組み（仮）</strong><br>
        他の手法と比較したときの工夫点や優位性について記述します。
      </li>
      <li>
        <strong>実装と検証方針（仮）</strong><br>
        どのような指標・基準で評価を行うかについて説明します。
      </li>
    </ul>
  </div>
  <div class="diag-box">
    <div class="placeholder-card" style="padding: 40px 16px;">
      システム構成図 /<br>処理フロー図<br>（配置予定）
    </div>
    <div class="rel-badge">出力結果（仮）</div>
  </div>
</div>

---

# 第3章：まとめと今後の展望（仮）

<div class="main-col">
  <ul class="points">
    <li>
      <strong>本研究のまとめ（仮）</strong><br>
      発表全体を通じて明らかになったことや達成された成果を箇条書きで整理します。
    </li>
    <li>
      <strong>得られた示唆・貢献（仮）</strong><br>
      提案手法がもたらす意義や実用性についての総括をここに記述します。
    </li>
    <li>
      <strong>今後の課題と発展（仮）</strong><br>
      現時点での制約事項や、今後取り組むべき拡張方針について述べます。
    </li>
  </ul>
</div>
