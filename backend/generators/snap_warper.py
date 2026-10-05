from typing import Any
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

class StrokeSnapWarper:
    """
    近接ストローク吸引・局所非剛体変形エンジン (Skeleton Attraction & TPS Warper)
    先行研究:
    - 魏・山口 (2023)「中心線表現に基づくひらがなアンビグラムの自動生成」
    - 石崎ほか (2024)「ひらがな~る: 非剛体局所変形」
    平仮名の「の」「き」「さ」等において、外周の対称性を崩すことなく、
    オフセットした内側ストロークを磁石のように中間回転対称軸へスナップ（1本化）させる。
    """
    def __init__(self):
        pass

    def compute_snap_displacement_fields(
        self,
        img1: np.ndarray,
        img2_rot: np.ndarray,
        max_distance: int = 18,
        snap_strength: float = 0.5,
        smooth_sigma: float = 9.0,
    ) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, int]:
        """
        正反2画像の骨格から中間対称軸への局所変位ベクトル場 (dx, dy) を算出。
        - max_distance: スナップを適用する最大近接ストローク距離 (px)
        - snap_strength: 中間軸への引き寄せ係数 (0.0: 無変形, 0.5: 中間線で完全一致)
        - smooth_sigma: 変形場の滑らかさ (Thin Plate Spline的な平滑拡散)
        """
        h, w = img1.shape[:2]

        skel1 = extract_skeleton_u8(img1)
        skel2 = extract_skeleton_u8(img2_rot)

        # 共通部分（すでに一致している外周ループ等の固定アンカー）
        overlap = cv2.bitwise_and((img1 > 100).astype(np.uint8), (img2_rot > 100).astype(np.uint8))
        overlap_dilated = cv2.dilate(overlap, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))

        # 距離変換場と最近傍勾配の算出
        d2, labels2 = cv2.distanceTransformWithLabels(
            (skel2 == 0).astype(np.uint8), cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL
        )
        d1, labels1 = cv2.distanceTransformWithLabels(
            (skel1 == 0).astype(np.uint8), cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL
        )

        # Sobelフィルタによる距離場の勾配ベクトル（最近傍骨格への向き）
        grad2_x = cv2.Sobel(d2, cv2.CV_32F, 1, 0, ksize=3)
        grad2_y = cv2.Sobel(d2, cv2.CV_32F, 0, 1, ksize=3)
        mag2 = np.sqrt(grad2_x**2 + grad2_y**2) + 1e-6
        grad2_x /= mag2
        grad2_y /= mag2

        grad1_x = cv2.Sobel(d1, cv2.CV_32F, 1, 0, ksize=3)
        grad1_y = cv2.Sobel(d1, cv2.CV_32F, 0, 1, ksize=3)
        mag1 = np.sqrt(grad1_x**2 + grad1_y**2) + 1e-6
        grad1_x /= mag1
        grad1_y /= mag1

        # 変位マップの初期化
        vx1 = np.zeros((h, w), dtype=np.float32)
        vy1 = np.zeros((h, w), dtype=np.float32)
        vx2 = np.zeros((h, w), dtype=np.float32)
        vy2 = np.zeros((h, w), dtype=np.float32)

        # 1. skel1 のうち、skel2 に近接しているストロークを中間点へ吸引
        mask_snap1 = (skel1 > 0) & (d2 > 1.0) & (d2 <= max_distance) & (overlap_dilated == 0)
        snap_count = int(np.sum(mask_snap1))

        if snap_count > 0:
            shift_amount1 = d2[mask_snap1] * snap_strength
            # 距離勾配の逆方向（skel2に向かう方向）へ移動
            vx1[mask_snap1] = -grad2_x[mask_snap1] * shift_amount1
            vy1[mask_snap1] = -grad2_y[mask_snap1] * shift_amount1

        # 2. skel2 のうち、skel1 に近接しているストロークを中間点へ吸引
        mask_snap2 = (skel2 > 0) & (d1 > 1.0) & (d1 <= max_distance) & (overlap_dilated == 0)
        if np.sum(mask_snap2) > 0:
            shift_amount2 = d1[mask_snap2] * snap_strength
            vx2[mask_snap2] = -grad1_x[mask_snap2] * shift_amount2
            vy2[mask_snap2] = -grad1_y[mask_snap2] * shift_amount2

        # 3. 固定アンカー領域（外周ループ等）は変位をゼロに固定
        vx1[overlap_dilated > 0] = 0.0
        vy1[overlap_dilated > 0] = 0.0
        vx2[overlap_dilated > 0] = 0.0
        vy2[overlap_dilated > 0] = 0.0

        # 4. Thin Plate Spline 的な滑らかな連続変形場への拡散
        ksize = int(round(smooth_sigma * 4)) // 2 * 2 + 1
        if snap_count > 0:
            vx1 = cv2.GaussianBlur(vx1, (ksize, ksize), smooth_sigma)
            vy1 = cv2.GaussianBlur(vy1, (ksize, ksize), smooth_sigma)
            vx2 = cv2.GaussianBlur(vx2, (ksize, ksize), smooth_sigma)
            vy2 = cv2.GaussianBlur(vy2, (ksize, ksize), smooth_sigma)

            # アンカー領域での変位ゼロを再強制
            vx1 *= (1.0 - overlap_dilated.astype(np.float32) / 255.0)
            vy1 *= (1.0 - overlap_dilated.astype(np.float32) / 255.0)
            vx2 *= (1.0 - overlap_dilated.astype(np.float32) / 255.0)
            vy2 *= (1.0 - overlap_dilated.astype(np.float32) / 255.0)

        return vx1, vy1, vx2, vy2, snap_count

    def snap_and_warp(
        self,
        img1: np.ndarray,
        img2_rot: np.ndarray,
        max_distance: int = 18,
        snap_strength: float = 0.5,
    ) -> tuple[np.ndarray, np.ndarray, dict[str, Any]]:
        """
        正位置画像と反転画像を受け取り、近接ストロークを中間対称軸へワープさせた2画像を返却
        """
        h, w = img1.shape[:2]
        vx1, vy1, vx2, vy2, snap_count = self.compute_snap_displacement_fields(
            img1, img2_rot, max_distance=max_distance, snap_strength=snap_strength
        )

        if snap_count == 0:
            return img1.copy(), img2_rot.copy(), {"snapped": False, "snap_points": 0}

        # cv2.remap 用のマッピンググリッド作成
        grid_y, grid_x = np.mgrid[0:h, 0:w].astype(np.float32)

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
        }

snap_warper = StrokeSnapWarper()
