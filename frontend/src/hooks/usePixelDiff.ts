import { useState, useEffect } from "react";
import type { EngineResult } from "../services/api";

export interface DiffStats {
  overlapRatio: number;
  diffRatio: number;
  posDiffRatio: number;
  rotDiffRatio: number;
}

export function usePixelDiff(activeResult: EngineResult | null) {
  const [diffImageUrl, setDiffImageUrl] = useState<string | null>(null);
  const [diffStats, setDiffStats] = useState<DiffStats | null>(null);
  const [isDiffLoading, setIsDiffLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!activeResult || activeResult.type === "error" || !activeResult.data) {
      queueMicrotask(() => {
        setDiffImageUrl(null);
        setDiffStats(null);
      });
      return;
    }

    queueMicrotask(() => {
      setIsDiffLoading(true);
    });

    let isMounted = true;
    const img = new Image();

    const runDiffCalculation = () => {
      try {
        const w = img.naturalWidth || img.width || 600;
        const h = img.naturalHeight || img.height || 300;

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0);

        const srcData = ctx.getImageData(0, 0, w, h);
        const src = srcData.data;

        const outData = ctx.createImageData(w, h);
        const out = outData.data;

        // 文字ストローク判定 (白背景に対し、輝度 < 210 を文字とする)
        const isDark = (x: number, y: number) => {
          const i = (y * w + x) * 4;
          const a = src[i + 3];
          if (a < 30) return false;
          const lum = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
          return lum < 210;
        };

        let overlapCount = 0;
        let posOnlyCount = 0;
        let rotOnlyCount = 0;

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const rx = w - 1 - x;
            const ry = h - 1 - y;

            const p0 = isDark(x, y);
            const p180 = isDark(rx, ry);

            const i = (y * w + x) * 4;

            if (p0 && p180) {
              // 共通対称核 (墨黒)
              out[i] = 24;
              out[i + 1] = 24;
              out[i + 2] = 27;
              out[i + 3] = 255;
              overlapCount++;
            } else if (p0 && !p180) {
              // 正位置のみ固有差分 (朱赤)
              out[i] = 225;
              out[i + 1] = 59;
              out[i + 2] = 25;
              out[i + 3] = 255;
              posOnlyCount++;
            } else if (!p0 && p180) {
              // 180°反転位置のみ固有差分 (コバルトブルー)
              out[i] = 37;
              out[i + 1] = 99;
              out[i + 2] = 235;
              out[i + 3] = 255;
              rotOnlyCount++;
            } else {
              // 背景 (白)
              out[i] = 255;
              out[i + 1] = 255;
              out[i + 2] = 255;
              out[i + 3] = 255;
            }
          }
        }

        ctx.putImageData(outData, 0, 0);
        const totalUnion = overlapCount + posOnlyCount + rotOnlyCount;
        const overlapRatio = totalUnion > 0 ? (overlapCount / totalUnion) * 100 : 0;
        const diffRatio = totalUnion > 0 ? ((posOnlyCount + rotOnlyCount) / totalUnion) * 100 : 0;

        if (isMounted) {
          setDiffStats({
            overlapRatio: Math.round(overlapRatio * 10) / 10,
            diffRatio: Math.round(diffRatio * 10) / 10,
            posDiffRatio: totalUnion > 0 ? Math.round((posOnlyCount / totalUnion) * 1000) / 10 : 0,
            rotDiffRatio: totalUnion > 0 ? Math.round((rotOnlyCount / totalUnion) * 1000) / 10 : 0,
          });
          setDiffImageUrl(canvas.toDataURL("image/png"));
          setIsDiffLoading(false);
        }
      } catch (err) {
        console.error("ピクセル差分計算エラー:", err);
        if (isMounted) setIsDiffLoading(false);
      }
    };

    img.onload = runDiffCalculation;
    img.onerror = () => {
      if (isMounted) setIsDiffLoading(false);
    };

    if (activeResult.type === "png") {
      img.src = activeResult.data;
    } else if (activeResult.type === "svg") {
      const blob = new Blob([activeResult.data], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      img.src = url;
    }

    return () => {
      isMounted = false;
    };
  }, [activeResult]);

  return { diffImageUrl, diffStats, isDiffLoading };
}
