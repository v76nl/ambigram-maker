# Principal Warps: Thin-Plate Splines and the Decomposition of Deformations

## 書誌情報
- **ID**: 17
- **著者**: Fred L. Bookstein
- **発行年**: 1989
- **掲載誌/会議**: IEEE Transactions on Pattern Analysis and Machine Intelligence (IEEE TPAMI), Vol. 11, No. 6, pp. 567-585
- **DOI**: [10.1109/34.24792](https://doi.org/10.1109/34.24792)
- **URL**: [https://doi.org/10.1109/34.24792](https://doi.org/10.1109/34.24792)
- **検索クエリマッチ**: Thin Plate Spline, Principal Warps, 非剛体変形
- **全文PDF**: 入手済み (`paper.pdf`) (1,653,944 bytes)

## 概要と数理的背景
1次元の三次スプライン曲線を2次元へ自然に拡張した「薄板スプライン（Thin-Plate Spline: TPS）」を用いて、ランドマーク（特徴点）対の対応付けに基づく滑らかな非剛体座標変換（Warping）を実現した金字塔的論文。

物理的に「薄い弾性金属板（Thin Plate）をランドマーク位置でピン留めして持ち上げたときに、板全体の曲げエネルギー（Bending Energy）が最小化される平衡状態」を偏微分方程式で解き、画像全体の滑らかな2次元変形場を導出する。

### 基本定式化（2D TPS）
点 $\boldsymbol{p}_i = (x_i, y_i)$ から $\boldsymbol{q}_i = (u_i, v_i)$ へのマッピング関数 $f(x, y)$ は以下で与えられる：
$$f(x, y) = a_1 + a_x x + a_y y + \sum_{i=1}^n w_i U(\|\boldsymbol{p}_i - (x, y)\|)$$
ここで放射基底関数（RBF）は薄板の曲げエネルギー最小化解である：
$$U(r) = r^2 \ln r^2 \quad (\text{または } r^2 \ln r)$$

### 本プロジェクトにおける活用
- **アンビグラムへの応用**: 「の」「き」「さ」などにおいて、一次アフィン変換（剛体回転・せん断）では内側の近接ストロークがオフセットして二重線になってしまう問題に対し、文字の外周輪郭（一致領域）をピン留めアンカー（固定境界条件）とし、内部ストロークのみを中心対称軸へ滑らかに引き寄せる弾性引力場（`snap_warper.py`）の数理基盤として導入。
