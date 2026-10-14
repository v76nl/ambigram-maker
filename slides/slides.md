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

  /* 中央配置レイアウト */
  .center-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    text-align: center;
  }

  .question-text {
    font-size: 38px;
    font-weight: 700;
    color: #1A1A1A;
    margin-bottom: 28px;
    letter-spacing: 0.02em;
  }

  .single-ambigram-box {
    width: 520px;
    background-color: #FFFFFF;
    border: 2px solid #CBD5E1;
    border-radius: 14px;
    padding: 24px;
    box-sizing: border-box;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .single-ambigram-box img {
    max-width: 100%;
    max-height: 260px;
    object-fit: contain;
    display: block;
  }

  /* 分裂 & 180度回転ステージ */
  .split-ambigram-stage {
    display: flex;
    justify-content: center;
    align-items: stretch;
    gap: 48px;
    width: 100%;
    max-width: 960px;
    margin: 8px 0 16px 0;
    position: relative;
  }

  .split-card {
    flex: 1;
    background-color: #FFFFFF;
    border: 2px solid #CBD5E1;
    border-radius: 14px;
    padding: 16px;
    box-sizing: border-box;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .split-card img {
    max-width: 95%;
    max-height: 220px;
    object-fit: contain;
    display: block;
  }

  /* アニメーション: 中央から左へ移動 (ease-in-out) */
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

  /* アニメーション: 中央から右へ移動 (ease-in-out) */
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

  .anim-left {
    animation: slide-to-left 1.4s ease-in-out 0.2s forwards;
  }

  .anim-right {
    animation: slide-to-right 1.4s ease-in-out 0.2s forwards;
  }

  .anim-rotate-img {
    transform: rotate(180deg);
    animation: img-spin-180 1.4s ease-in-out 0.2s forwards;
    transform-origin: center center;
  }

  /* 印刷・PDF時は回転した静止状態で確定 */
  @media print {
    .anim-left,
    .anim-right,
    .anim-rotate-img {
      animation: none !important;
    }
    .anim-rotate-img {
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

<div class="center-content">
  <div class="question-text">この文字、何と読めますか？</div>
  <div class="single-ambigram-box">
    <img src="images/ambigram_saiaku.png" alt="最悪 アンビグラム">
  </div>
</div>

---

# 2. 180度回転型アンビグラム

<div class="center-content">
  <div class="split-ambigram-stage">
    <!-- 左：正位置（中央から左へ移動） -->
    <div class="split-card anim-left">
      <img src="images/ambigram_saiaku.png" alt="最悪 正位置">
      <div class="rel-badge" style="margin-top: 14px; font-size: 22px; padding: 6px 16px;">0°（正位置）</div>
    </div>
    <!-- 右：180度回転（中央から回転しながら右へ移動） -->
    <div class="split-card anim-right">
      <img src="images/ambigram_saiaku.png" class="anim-rotate-img" alt="最悪 180度回転">
      <div class="rel-badge accent" style="margin-top: 14px; font-size: 22px; padding: 6px 16px;">180°回転</div>
    </div>
  </div>
  <div style="font-size: 26px; color: #2D3748; line-height: 1.5; margin-top: 10px;">
    逆さにしても同じ<strong>「最悪」</strong>と読めるタイポグラフィ（自己対称型アンビグラム）
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
