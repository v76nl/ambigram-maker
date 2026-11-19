from typing import Any, Optional
import cv2
import numpy as np

def extract_skeleton_u8(img: np.ndarray) -> np.ndarray:
    """画像の細線化スケルトン（1px中心線）を抽出"""
    u8 = (img > 100).astype(np.uint8) * 255
    try:
        return (cv2.ximgproc.thinning(u8) > 0).astype(np.uint8)
    except Exception:
        element = cv2.getStructuringElement(cv2.MORPH_CROSS, (3, 3))
        temp = u8.copy()
        skel = np.zeros_like(temp)
        while True:
            eroded = cv2.erode(temp, element)
            opened = cv2.morphologyEx(eroded, cv2.MORPH_OPEN, element)
            subset = cv2.subtract(eroded, opened)
            skel = cv2.bitwise_or(skel, subset)
            temp = eroded.copy()
            if cv2.countNonZero(temp) == 0:
                break
        return (skel > 0).astype(np.uint8)

WARP_METHODS = ("gaussian", "tps")
DEFAULT_WARP_METHOD = "gaussian"

# 生成工程の表示に使う、変形方式ごとの説明
WARP_STEP_TEXT = {
    "gaussian": {
        "title": "近接ストローク吸引 (ガウシアン平滑化)",
        "description": "近接するストロークの骨格に、相手の骨格へ向かう変位を与え、ガウシアン平滑化で周囲へ滑らかに広げて引き寄せる",
    },
    "tps": {
        "title": "Thin Plate Spline (薄板スプライン非剛体変形)",
        "description": "近接するストロークの骨格を制御点とし、曲げエネルギーを最小化する薄板スプライン(Thin Plate Spline)で変形場を解いて、ストローク同士を中心対称軸へ引き寄せて一体化",
    },
}


def normalize_warp_method(method: Optional[str]) -> str:
    """変形方式を正規化する。未指定は互換性のため従来方式 (gaussian) とする。"""
    if method is None or method == "":
        return DEFAULT_WARP_METHOD
    if method not in WARP_METHODS:
        raise ValueError(f"未対応の変形方式です: {method} (gaussian または tps)")
    return method


def _tps_kernel(r: np.ndarray) -> np.ndarray:
    """薄板スプラインの基底関数 U(r) = r^2 log r (U(0) = 0)。"""
    out = np.zeros_like(r)
    positive = r > 0
    out[positive] = r[positive] ** 2 * np.log(r[positive])
    return out


def _bin_points(
    ys: np.ndarray, xs: np.ndarray, values: np.ndarray, cell: int
) -> tuple[np.ndarray, np.ndarray]:
    """点群を cell 画素の格子ごとに平均し、制御点を間引く。"""
    if ys.size == 0:
        return np.zeros((0, 2), dtype=np.float64), np.zeros((0, values.shape[1]), dtype=np.float64)
    keys = (ys // cell).astype(np.int64) * 1_000_003 + (xs // cell).astype(np.int64)
    _, inverse, counts = np.unique(keys, return_inverse=True, return_counts=True)
    points = np.zeros((counts.size, 2), dtype=np.float64)
    np.add.at(points, inverse, np.stack([xs, ys], axis=1).astype(np.float64))
    averaged = np.zeros((counts.size, values.shape[1]), dtype=np.float64)
    np.add.at(averaged, inverse, values.astype(np.float64))
    return points / counts[:, None], averaged / counts[:, None]


class StrokeSnapWarper:
    """
    近接ストローク吸引・局所非剛体変形エンジン
    先行研究:
    - 魏・山口 (2023)「中心線表現に基づくひらがなアンビグラムの自動生成」
    - 石崎ほか (2024)「ひらがな~る: 非剛体局所変形」
    - Bookstein (1989)「Principal Warps: Thin-Plate Splines and the Decomposition of Deformations」
    平仮名の「の」「き」「さ」等において、外周の対称性を崩すことなく、
    オフセットした内側ストロークを磁石のように中間回転対称軸へスナップ（1本化）させる。

    変形方式:
    - "gaussian": 骨格上の変位をガウシアン平滑化で周囲へ広げる従来方式
    - "tps": 骨格上の変位を制御点とし、薄板スプライン (TPS) で曲げエネルギー最小の変形場を解く方式
    """
    def __init__(
        self,
        tps_regularization: float = 1e-2,
        tps_grid_divisions: int = 64,
        tps_anchor_clearance_ratio: float = 1 / 32,
    ):
        # tps_regularization: TPSの平滑化係数 λ (0で制御点を厳密に通る。大きいほど滑らか)
        # tps_grid_divisions: 変形場を評価する格子の分割数。間の画素は線形補間する
        # tps_anchor_clearance_ratio: 吸引する骨格から画像サイズ×この比率以内の固定点を除き、急な変形を防ぐ
        self.tps_regularization = tps_regularization
        self.tps_grid_divisions = tps_grid_divisions
        self.tps_anchor_clearance_ratio = tps_anchor_clearance_ratio

    def _sparse_snap_vectors(
        self,
        img1: np.ndarray,
        img2_rot: np.ndarray,
        max_distance: int,
        snap_strength: float,
    ) -> dict[str, Any]:
        """正反2画像の骨格上で、相手の骨格へ向かう疎な変位ベクトルを求める。"""
        h, w = img1.shape[:2]

        skel1 = extract_skeleton_u8(img1)
        skel2 = extract_skeleton_u8(img2_rot)

        # 共通部分（すでに一致しているストローク等の固定アンカー）
        overlap = cv2.bitwise_and((img1 > 100).astype(np.uint8), (img2_rot > 100).astype(np.uint8))
        overlap_dilated = cv2.dilate(overlap, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))

        # 距離変換場と最近傍骨格への勾配ベクトルの算出
        d2 = cv2.distanceTransform((skel2 == 0).astype(np.uint8), cv2.DIST_L2, 5)
        d1 = cv2.distanceTransform((skel1 == 0).astype(np.uint8), cv2.DIST_L2, 5)

        grad2_x = cv2.Sobel(d2, cv2.CV_32F, 1, 0, ksize=3)
        grad2_y = cv2.Sobel(d2, cv2.CV_32F, 0, 1, ksize=3)
        mag2 = np.sqrt(grad2_x**2 + grad2_y**2) + 1e-5
        grad2_x /= mag2
        grad2_y /= mag2

        grad1_x = cv2.Sobel(d1, cv2.CV_32F, 1, 0, ksize=3)
        grad1_y = cv2.Sobel(d1, cv2.CV_32F, 0, 1, ksize=3)
        mag1 = np.sqrt(grad1_x**2 + grad1_y**2) + 1e-5
        grad1_x /= mag1
        grad1_y /= mag1

        # 変位マップと重みマップの初期化
        vx1 = np.zeros((h, w), dtype=np.float32)
        vy1 = np.zeros((h, w), dtype=np.float32)
        w1 = np.zeros((h, w), dtype=np.float32)

        vx2 = np.zeros((h, w), dtype=np.float32)
        vy2 = np.zeros((h, w), dtype=np.float32)
        w2 = np.zeros((h, w), dtype=np.float32)

        # 1. skel1 のうち、skel2 に近接しているストロークを中間対称軸へ吸引
        mask_snap1 = (skel1 > 0) & (d2 > 1.5) & (d2 <= max_distance) & (overlap_dilated == 0)
        snap_count1 = int(np.sum(mask_snap1))
        if snap_count1 > 0:
            shift_amount1 = d2[mask_snap1] * snap_strength
            vx1[mask_snap1] = -grad2_x[mask_snap1] * shift_amount1
            vy1[mask_snap1] = -grad2_y[mask_snap1] * shift_amount1
            w1[mask_snap1] = 1.0

        # 2. skel2 のうち、skel1 に近接しているストロークを中間対称軸へ吸引
        mask_snap2 = (skel2 > 0) & (d1 > 1.5) & (d1 <= max_distance) & (overlap_dilated == 0)
        snap_count2 = int(np.sum(mask_snap2))
        if snap_count2 > 0:
            shift_amount2 = d1[mask_snap2] * snap_strength
            vx2[mask_snap2] = -grad1_x[mask_snap2] * shift_amount2
            vy2[mask_snap2] = -grad1_y[mask_snap2] * shift_amount2
            w2[mask_snap2] = 1.0

        return {
            "skel1": skel1, "skel2": skel2, "overlap_dilated": overlap_dilated,
            "mask_snap1": mask_snap1, "mask_snap2": mask_snap2,
            "vx1": vx1, "vy1": vy1, "w1": w1, "vx2": vx2, "vy2": vy2, "w2": w2,
            "total_snaps": snap_count1 + snap_count2,
        }

    def compute_snap_displacement_fields(
        self,
        img1: np.ndarray,
        img2_rot: np.ndarray,
        max_distance: int = 40,
        snap_strength: float = 0.75,
        smooth_sigma: float = 14.0,
    ) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, int]:
        """
        正反2画像の骨格から中間対称軸への局所変位ベクトル場 (dx, dy) を算出する (従来方式)。
        - max_distance: スナップを適用する最大近接ストローク距離 (px)
        - snap_strength: 中間軸への引き寄せ係数 (0.0: 無変形, 0.5: 中間線で完全一致, 0.75: 強力吸引)
        - smooth_sigma: 変形場の滑らかさ (ガウシアン平滑化の標準偏差)
        """
        sparse = self._sparse_snap_vectors(img1, img2_rot, max_distance, snap_strength)
        overlap_dilated = sparse["overlap_dilated"]
        vx1, vy1, w1 = sparse["vx1"], sparse["vy1"], sparse["w1"]
        vx2, vy2, w2 = sparse["vx2"], sparse["vy2"], sparse["w2"]
        total_snaps = sparse["total_snaps"]
        if total_snaps == 0:
            return vx1, vy1, vx2, vy2, 0

        # 3. ガウシアン正規化畳み込みによる変位場の拡散 (従来方式)
        # 変位値の希釈を防ぎ、ストローク本来の移動量を保持して周囲へ滑らかに伝播
        ksize = int(round(smooth_sigma * 4)) // 2 * 2 + 1
        vx1_b = cv2.GaussianBlur(vx1, (ksize, ksize), smooth_sigma)
        vy1_b = cv2.GaussianBlur(vy1, (ksize, ksize), smooth_sigma)
        w1_b = cv2.GaussianBlur(w1, (ksize, ksize), smooth_sigma)

        vx2_b = cv2.GaussianBlur(vx2, (ksize, ksize), smooth_sigma)
        vy2_b = cv2.GaussianBlur(vy2, (ksize, ksize), smooth_sigma)
        w2_b = cv2.GaussianBlur(w2, (ksize, ksize), smooth_sigma)

        # 正規化: 疎な変位マスクによる局所平均希釈を解消 (ストローク骨格上の変位を100%保持)
        vld1 = w1_b > 1e-5
        vx1_out = np.zeros_like(vx1)
        vy1_out = np.zeros_like(vy1)
        att1 = np.clip(w1_b[vld1] * 50.0, 0.0, 1.0)
        vx1_out[vld1] = (vx1_b[vld1] / w1_b[vld1]) * att1
        vy1_out[vld1] = (vy1_b[vld1] / w1_b[vld1]) * att1

        vld2 = w2_b > 1e-5
        vx2_out = np.zeros_like(vx2)
        vy2_out = np.zeros_like(vy2)
        att2 = np.clip(w2_b[vld2] * 50.0, 0.0, 1.0)
        vx2_out[vld2] = (vx2_b[vld2] / w2_b[vld2]) * att2
        vy2_out[vld2] = (vy2_b[vld2] / w2_b[vld2]) * att2

        # 4. 固定アンカー領域（既に重なっている部分）の変位をゼロに制限
        anchor_mask = overlap_dilated.astype(np.float32) / 255.0
        vx1_out *= (1.0 - anchor_mask)
        vy1_out *= (1.0 - anchor_mask)
        vx2_out *= (1.0 - anchor_mask)
        vy2_out *= (1.0 - anchor_mask)

        return vx1_out, vy1_out, vx2_out, vy2_out, total_snaps

    def _tps_backward_map(
        self,
        control_points: np.ndarray,
        displacements: np.ndarray,
        shape: tuple[int, int],
    ) -> tuple[np.ndarray, np.ndarray]:
        """
        制御点 (移動後の位置) と、そこから元画像を参照する変位から、
        薄板スプラインで全画素の逆写像用変位 (dx, dy) を求める。
        """
        h, w = shape
        scale = float(max(h, w))
        pts = control_points / scale
        n = pts.shape[0]

        dist = np.sqrt(((pts[:, None, :] - pts[None, :, :]) ** 2).sum(axis=2))
        system = np.zeros((n + 3, n + 3), dtype=np.float64)
        system[:n, :n] = _tps_kernel(dist) + self.tps_regularization * np.eye(n)
        system[:n, n] = 1.0
        system[:n, n + 1:] = pts
        system[n, :n] = 1.0
        system[n + 1:, :n] = pts.T
        rhs = np.zeros((n + 3, 2), dtype=np.float64)
        rhs[:n] = displacements / scale
        coeffs = np.linalg.lstsq(system, rhs, rcond=None)[0]

        # 粗い格子で評価して全画素へ補間する (cv2.resize と同じ画素中心の対応をとる)
        step = max(1, int(round(max(h, w) / self.tps_grid_divisions)))
        gh, gw = max(2, -(-h // step)), max(2, -(-w // step))
        gy = ((np.arange(gh) + 0.5) * h / gh - 0.5) / scale
        gx = ((np.arange(gw) + 0.5) * w / gw - 0.5) / scale
        grid = np.stack(np.meshgrid(gx, gy), axis=-1).reshape(-1, 2)
        r = np.sqrt(((grid[:, None, :] - pts[None, :, :]) ** 2).sum(axis=2))
        field = _tps_kernel(r) @ coeffs[:n] + coeffs[n] + grid @ coeffs[n + 1:]
        field = (field * scale).reshape(gh, gw, 2).astype(np.float32)
        dx = cv2.resize(field[..., 0], (w, h), interpolation=cv2.INTER_LINEAR)
        dy = cv2.resize(field[..., 1], (w, h), interpolation=cv2.INTER_LINEAR)
        return dx, dy

    def _tps_controls(
        self,
        skel: np.ndarray,
        mask_snap: np.ndarray,
        vx: np.ndarray,
        vy: np.ndarray,
        overlap_dilated: np.ndarray,
        shape: tuple[int, int],
        max_points: int = 600,
    ) -> tuple[np.ndarray, np.ndarray]:
        """
        TPSの制御点を作る。
        - 吸引する骨格点: 移動後の位置に置き、元の位置を参照させる
        - 吸引しない骨格点と、すでに重なっている部分: 動かさない
        - 画像の外周: 動かさない
        """
        h, w = shape
        cell = max(2, int(round(max(h, w) / 64)))
        while True:
            ys, xs = np.nonzero(mask_snap)
            moved = np.stack([vx[ys, xs], vy[ys, xs]], axis=1)
            snap_pts, snap_vec = _bin_points(ys, xs, moved, cell)
            targets = snap_pts + snap_vec

            fixed_mask = ((skel > 0) & ~mask_snap) | (overlap_dilated > 0)
            clearance_px = self.tps_anchor_clearance_ratio * max(h, w)
            if clearance_px > 0:
                clearance = cv2.distanceTransform((~mask_snap).astype(np.uint8), cv2.DIST_L2, 5)
                fixed_mask &= clearance > clearance_px
            fy, fx = np.nonzero(fixed_mask)
            fixed_pts, _ = _bin_points(fy, fx, np.zeros((fy.size, 1)), cell * 2)

            ring = np.linspace(0, 1, 17)
            border = np.concatenate([
                np.stack([ring * (w - 1), np.zeros_like(ring)], axis=1),
                np.stack([ring * (w - 1), np.full_like(ring, h - 1)], axis=1),
                np.stack([np.zeros_like(ring), ring * (h - 1)], axis=1),
                np.stack([np.full_like(ring, w - 1), ring * (h - 1)], axis=1),
            ])

            points = np.concatenate([targets, fixed_pts, border])
            disp = np.concatenate([-snap_vec, np.zeros((fixed_pts.shape[0] + border.shape[0], 2))])
            if points.shape[0] <= max_points:
                break
            cell *= 2

        # 同じ位置の制御点は1つにまとめる (連立方程式の退化を防ぐ)
        _, unique_index = np.unique(np.round(points, 3), axis=0, return_index=True)
        unique_index.sort()
        return points[unique_index], disp[unique_index]

    def compute_tps_displacement_fields(
        self,
        img1: np.ndarray,
        img2_rot: np.ndarray,
        max_distance: int = 40,
        snap_strength: float = 0.75,
    ) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, int]:
        """
        近接ストロークの変位を制御点とし、薄板スプライン (Bookstein, 1989) で
        曲げエネルギー最小の変形場を解く。返り値は cv2.remap 用の逆写像変位 (元座標 = 座標 + 変位)。
        """
        h, w = img1.shape[:2]
        sparse = self._sparse_snap_vectors(img1, img2_rot, max_distance, snap_strength)
        zeros = np.zeros((h, w), dtype=np.float32)
        if sparse["total_snaps"] == 0:
            return zeros, zeros.copy(), zeros.copy(), zeros.copy(), 0

        fields = []
        for skel, mask_snap, vx, vy in (
            (sparse["skel1"], sparse["mask_snap1"], sparse["vx1"], sparse["vy1"]),
            (sparse["skel2"], sparse["mask_snap2"], sparse["vx2"], sparse["vy2"]),
        ):
            if not mask_snap.any():
                fields.append((zeros.copy(), zeros.copy()))
                continue
            points, disp = self._tps_controls(skel, mask_snap, vx, vy, sparse["overlap_dilated"], (h, w))
            fields.append(self._tps_backward_map(points, disp, (h, w)))

        (dx1, dy1), (dx2, dy2) = fields
        return dx1, dy1, dx2, dy2, sparse["total_snaps"]

    def snap_and_warp(
        self,
        img1: np.ndarray,
        img2_rot: np.ndarray,
        max_distance: int = 40,
        snap_strength: float = 0.75,
        guide_img1: Any = None,
        guide_img2: Any = None,
        warp_method: Optional[str] = None,
    ) -> tuple[np.ndarray, np.ndarray, dict[str, Any]]:
        """
        正位置画像と反転画像を受け取り、近接ストロークを中間対称軸へワープさせた2画像を返却。
        warp_method: "gaussian" (従来方式・既定) または "tps" (薄板スプライン)
        guide_img1, guide_img2 が指定された場合、骨格・変位場の算出にそれら（元の細ストローク）を使用し、
        算出された変形場を img1, img2_rot (太らせ後画像など) に適用する。
        """
        h, w = img1.shape[:2]
        calc_img1 = guide_img1 if guide_img1 is not None else img1
        calc_img2 = guide_img2 if guide_img2 is not None else img2_rot

        method = normalize_warp_method(warp_method)

        if method == "tps":
            dx1, dy1, dx2, dy2, snap_count = self.compute_tps_displacement_fields(
                calc_img1, calc_img2, max_distance=max_distance, snap_strength=snap_strength
            )
        else:
            vx1, vy1, vx2, vy2, snap_count = self.compute_snap_displacement_fields(
                calc_img1, calc_img2, max_distance=max_distance, snap_strength=snap_strength
            )

        if snap_count == 0:
            return img1.copy(), img2_rot.copy(), {"snapped": False, "snap_points": 0, "warp_method": method}

        # cv2.remap 用のマッピンググリッド作成
        grid_y, grid_x = np.mgrid[0:h, 0:w].astype(np.float32)

        if method == "tps":
            # TPSは逆写像の変位を直接求めている (元座標 = 座標 + 変位)
            map1_x = grid_x + dx1
            map1_y = grid_y + dy1
            map2_x = grid_x + dx2
            map2_y = grid_y + dy2
        else:
            # サンプリング座標 (元座標 - 変位)
            map1_x = grid_x - vx1
            map1_y = grid_y - vy1

            map2_x = grid_x - vx2
            map2_y = grid_y - vy2

        warped1 = cv2.remap(img1, map1_x, map1_y, interpolation=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        warped2 = cv2.remap(img2_rot, map2_x, map2_y, interpolation=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)

        return warped1, warped2, {
            "snapped": True,
            "snap_points": snap_count,
            "max_distance": max_distance,
            "snap_strength": snap_strength,
            "warp_method": method,
        }

snap_warper = StrokeSnapWarper()
