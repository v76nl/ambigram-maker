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

  /* スライドごとの進捗率 (全7ページ構成) */
  section:nth-of-type(1), section[id="1"] { --progress: 14.3%; }
  section:nth-of-type(2), section[id="2"] { --progress: 28.6%; }
  section:nth-of-type(3), section[id="3"] { --progress: 42.9%; }
  section:nth-of-type(4), section[id="4"] { --progress: 57.1%; }
  section:nth-of-type(5), section[id="5"] { --progress: 71.4%; }
  section:nth-of-type(6), section[id="6"] { --progress: 85.7%; }
  section:nth-of-type(7), section[id="7"] { --progress: 100.0%; }

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

  /* アンビグラム展示用カード & アニメーション */
  .ambigram-card {
    width: 100%;
    background-color: #FFFFFF;
    border: 2px solid #E2E8F0;
    border-radius: 12px;
    padding: 16px 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .ambigram-card img {
    max-width: 96%;
    max-height: 200px;
    object-fit: contain;
    display: block;
  }

  /* 180度回転アニメーション */
  @keyframes spinTo180 {
    0% {
      transform: rotate(0deg);
    }
    20% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(180deg);
    }
  }

  .rotate-180-anim {
    display: inline-block;
    transform: rotate(180deg);
    animation: spinTo180 1.5s cubic-bezier(0.25, 1, 0.5, 1) 0.4s forwards;
    transform-origin: center center;
  }

  @media print {
    .rotate-180-anim {
      animation: none !important;
      transform: rotate(180deg) !important;
    }
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
      <span class="toc-text"><span class="toc-num">2.</span><strong>アンビグラムとは？</strong></span>
      <span class="toc-leader"></span>
      <span class="toc-page">4</span>
    </div>
    <div class="toc-sub-item">
      <span class="toc-text"><span class="toc-accent">▶</span>180度回転の驚きと制作の難しさ</span>
      <span class="toc-leader"></span>
      <span class="toc-page">5</span>
    </div>
    <div class="toc-item">
      <span class="toc-text"><span class="toc-num">3.</span><strong>制作支援システムの実演</strong></span>
      <span class="toc-leader"></span>
      <span class="toc-page">6</span>
    </div>
    <div class="toc-item">
      <span class="toc-text"><span class="toc-num">4.</span><strong>まとめと今後の展望</strong></span>
      <span class="toc-leader"></span>
      <span class="toc-page">7</span>
    </div>
  </div>
</div>

---

# 1. はじめに

<div class="main-col" style="justify-content: center; flex: 1;">
  <ul class="points" style="font-size: 30px; line-height: 1.6;">
    <li>本研究は、11月29日のHCD-Net (学会) でポスター発表を予定しています</li>
    <li>アルゴリズム設計や実装にAIエージェントを活用して進めたため、見落としや論理の穴があるかもしれません</li>
    <li style="list-style-type: none; margin-left: -28px; margin-top: 20px;">
      <strong style="color: #D84315;">→ 気になった点や疑問点、改善アイデアがあれば教えてください！</strong>
    </li>
  </ul>
</div>

---

# 2. アンビグラムとは？

<div class="slide-grid">
  <div class="main-col">
    <ul class="points">
      <li>
        <strong>Q. この文字、何と読めますか？</strong><br>
        少し不思議な形をしていますが、ある日本語の2文字の言葉として読むことができます。
      </li>
      <li>
        <strong>パッと見の印象</strong><br>
        「最悪……？」と読めたでしょうか。一見すると、少し崩した個性的な筆文字のようにも見えます。
      </li>
      <li>
        <strong>では、この文字を逆さにしてみると……？</strong><br>
        次のスライドで、この文字を<strong>180度ひっくり返して</strong>みます。
      </li>
    </ul>
  </div>
  <div class="diag-box">
    <div class="ambigram-card">
      <img src="images/ambigram_saiaku.png" alt="最悪 アンビグラム 正位置">
    </div>
    <div class="rel-badge">正位置（0°）</div>
  </div>
</div>

---

# 2. 180度回転型アンビグラム

<div class="slide-grid">
  <div class="main-col">
    <ul class="points">
      <li>
        <strong>逆さにしても同じ「最悪」と読める！</strong><br>
        180度回転させても元の単語と同じ文字列として成立するタイポグラフィ（自己対称型アンビグラム）。
      </li>
      <li>
        <strong>人間の文字認識の不思議さ</strong><br>
        完全な幾何学的対称でなくても、脳が前後の文脈や知識から「最悪」と補完（トップダウン認知）。
      </li>
      <li>
        <strong>しかし、作るのが極めて難しい（工学的課題）</strong><br>
        どの単語なら成立するか（探索）、どう骨格を変形させるか（変形）、他人に読めるか（客観評価）が職人芸に依存。
      </li>
    </ul>
  </div>
  <div class="diag-box">
    <div class="ambigram-card">
      <img src="images/ambigram_saiaku.png" class="rotate-180-anim" alt="最悪 アンビグラム 180度回転">
    </div>
    <div class="rel-badge accent">180°回転（点対称）</div>
  </div>
</div>

---

# 3. 制作支援システムの実演

<div class="slide-grid">
  <div class="main-col">
    <ul class="points">
      <li>
        <strong>作り手の3つの課題を解決するシステム</strong><br>
        直感的なWebインターフェースで、誰でもアンビグラムを探索・制作・微調整できる環境を開発。
      </li>
      <li>
        <strong>実演の3大ハイライト</strong><br>
        ① <strong>高速探索</strong>：20万語の辞書から正規表現と対称性で単語推薦<br>
        ② <strong>骨格変形</strong>：近接ストローク吸引で自然に一本化・変形<br>
        ③ <strong>AI可読性判定</strong>：双方向の認識確率をリアルタイム評価
      </li>
      <li>
        <strong>実際のソフトウェア画面をデモ実演します</strong>
      </li>
    </ul>
  </div>
  <div class="diag-box">
    <div class="rel-badge accent">探索 ➜ 変形 ➜ 評価</div>
    <div class="placeholder-card" style="padding: 24px 16px;">
      <strong>実演デモ</strong><br>
      実際のWeb画面へ<br>切り替えます
    </div>
    <div class="rel-badge">リアルタイム支援</div>
  </div>
</div>

---

# 4. まとめと今後の展望

<div class="slide-grid">
  <div class="main-col">
    <ul class="points">
      <li>
        <strong>本研究のまとめ</strong><br>
        フォント骨格の手順的変形とAI可読性評価を統合し、職人芸に依存しない180度回転型アンビグラム制作支援を実現。
      </li>
      <li>
        <strong>11/29 HCD-Net ポスター発表に向けた検証課題</strong><br>
        実際のユーザーによる制作実験（難易度・作業時間の変化）や、AI可読性スコアと人間の主観評価の相関検証。
      </li>
      <li>
        <strong>フィードバックのお願い</strong><br>
        AI共創研究だからこその見落としや、実験設計へのアドバイスなど、気になった点はぜひ忌憚なく教えてください！
      </li>
    </ul>
  </div>
  <div class="diag-box">
    <div class="rel-badge accent">11/29 HCD-Net</div>
    <div style="font-size: 24px; color: #D84315; font-weight: bold;">↓</div>
    <div class="rel-badge">ポスター発表へ</div>
    <div class="placeholder-card" style="padding: 16px; font-size: 18px; line-height: 1.4;">
      <strong>ご意見・アドバイスを<br>お待ちしています！</strong>
    </div>
  </div>
</div>
