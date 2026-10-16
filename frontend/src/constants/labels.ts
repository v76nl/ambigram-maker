/**
 * 生成パラメータの呼称・ガイドヒントの一元管理定数
 * 呼称や説明を変更する際はこのファイルを1箇所修正するだけで反映されます。
 */
export const PARAM_LABELS = {
  // 手法A (モルフォロジー)
  dilationSize: {
    title: "ストローク太さ (Dilation)",
    hint: "▲増: 線が細く読みにくいとき / ▼減: 線が潰れて黒く詰まるとき",
  },
  smoothness: {
    title: "輪郭の滑らかさ (Smoothing)",
    hint: "▲増: ジャギーや微小ノイズを消したいとき / ▼減: 漢字の角や払いを残したいとき",
  },

  // 手法B (スケルトン)
  strokeThickness: {
    title: "骨格線幅 (Stroke Width)",
    hint: "▲増: 線が細く読みにくいとき / ▼減: 線が潰れて黒く詰まるとき",
  },
  brushStyle: {
    title: "ブラシ描画スタイル (井上・高橋 §5)",
    calligraphic: "毛筆・楕円筆 (45°)",
    uniform: "均一丸ペン",
  },
  strokeModulation: {
    title: "筆致の強弱",
  },

  // 手法A / B 共通ストローク補正
  preBold: {
    title: "事前太らせ (Pre-Bold)",
    hint: "▲増: 細字フォントで線が消えるのを防ぐ / ▼減: 太字で骨格同士が近接しすぎるとき",
  },
  diffBlend: {
    title: "異文字パーツ保持 (Diff Blend)",
    hint: "▲増: 各文字の個別形状を尊重したいとき / ▼減: 共通骨格に寄せて対称性を高めたいとき",
  },
  enableSnap: {
    title: "Thin Plate Spline 近接吸引スナップ",
    hint: "薄板スプライン(Thin Plate Spline)弾性変形により、近接ストローク同士を中間の回転対称軸へ滑らかに吸着・一本化",
  },

  // ベクター合成
  blendRatio: {
    title: "合成比率 (Blend Ratio)",
    hint: "▲増: 180°反転文字を強く / ▼減: 正位置文字を強く",
  },

  // ビットマップ
  blendWeight: {
    title: "合成重み (Weight)",
    hint: "▲増: 180°反転文字を強く / ▼減: 正位置文字を強く",
  },
  bitmapSmoothness: {
    title: "平滑化 (Smoothness)",
    hint: "▲増: エッジを丸く滑らかにしたいとき / ▼減: 輪郭をシャープに保ちたいとき",
  },
  thresholdVal: {
    title: "二値化閾値 (Threshold)",
    hint: "▲増: 線を細く絞り込むとき / ▼減: かすれた線を拾って太くするとき",
  },
} as const;
