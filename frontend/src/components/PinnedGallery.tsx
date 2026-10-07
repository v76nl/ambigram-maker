import React, { useState } from "react";
import { Pin, Trash2, RotateCw, ExternalLink, Sparkles } from "lucide-react";
import type { PinnedAmbigram } from "../types/pinned";

interface PinnedGalleryProps {
  pinnedList: PinnedAmbigram[];
  onRemovePinned: (id: string) => void;
  onClearAll: () => void;
  onApplyPinned: (item: PinnedAmbigram) => void;
}

export const PinnedGallery: React.FC<PinnedGalleryProps> = ({
  pinnedList,
  onRemovePinned,
  onClearAll,
  onApplyPinned,
}) => {
  // 各カードごとの反転状態 (id => boolean)
  const [rotatedMap, setRotatedMap] = useState<Record<string, boolean>>({});

  const toggleRotate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRotatedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getEngineBadgeLabel = (engine: string) => {
    switch (engine) {
      case "morphology":
        return "手法A (論理積)";
      case "skeleton":
        return "手法B (骨格)";
      case "vector":
        return "原案 (ベクター)";
      case "bitmap":
        return "手法2 (ビットマップ)";
      case "gemini":
        return "AI (Gemini)";
      default:
        return engine;
    }
  };

  return (
    <div className="pinned-gallery-card swiss-card">
      <div className="pinned-gallery-header">
        <div className="pinned-gallery-title">
          <Pin size={14} className="pinned-icon" />
          <span>固定した比較結果</span>
          <span className="pinned-count-badge">{pinnedList.length}</span>
        </div>

        {pinnedList.length > 0 && (
          <button
            className="swiss-btn swiss-btn-subtle swiss-btn-xs"
            onClick={onClearAll}
            title="固定した結果をすべて消去"
          >
            <Trash2 size={11} />
            <span>すべて解除</span>
          </button>
        )}
      </div>

      {pinnedList.length === 0 ? (
        <div className="pinned-empty-state">
          <Sparkles size={16} className="pinned-empty-icon" />
          <p className="pinned-empty-text">
            上のビューワーで「<strong>この結果を固定</strong>」ボタンを押すと、
            文字やフォントを切り替えながら複数のレンダリング結果を横並びで比較できます。
          </p>
        </div>
      ) : (
        <div className="pinned-grid">
          {pinnedList.map((item) => {
            const isRotated = !!rotatedMap[item.id];

            return (
              <div key={item.id} className="pinned-item-card">
                {/* カード上部メタデータ */}
                <div className="pinned-item-meta">
                  <div className="pinned-item-word" title={item.word}>
                    {item.word}
                  </div>
                  <button
                    className="pinned-item-del-btn"
                    onClick={() => onRemovePinned(item.id)}
                    title="この固定を削除"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div className="pinned-item-tags">
                  <span className="pinned-tag-font" title={item.fontName}>
                    {item.fontName}
                  </span>
                  <span className="pinned-tag-engine">
                    {getEngineBadgeLabel(item.engine)}
                  </span>
                  {item.score !== undefined && item.score !== null && (
                    <span className="pinned-tag-score" title="回転対称性スコア">
                      ★ {item.score.toFixed(1)}
                    </span>
                  )}
                </div>

                {/* プレビュー表示領域 (クリックで180°反転) */}
                <div
                  className="pinned-preview-box"
                  onClick={(e) => toggleRotate(item.id, e)}
                  title="クリックで180°反転プレビュー"
                >
                  <div
                    className="pinned-preview-inner"
                    style={{
                      transform: isRotated ? "rotate(180deg)" : "none",
                    }}
                  >
                    {item.result.type === "svg" ? (
                      <div
                        className="pinned-svg-wrap"
                        dangerouslySetInnerHTML={{ __html: item.result.data }}
                      />
                    ) : item.result.type === "png" ? (
                      <img
                        src={item.result.data}
                        alt={item.word}
                        className="pinned-img"
                      />
                    ) : (
                      <span className="pinned-error-msg">プレビュー不可</span>
                    )}
                  </div>

                  <button
                    className="pinned-rotate-pill"
                    onClick={(e) => toggleRotate(item.id, e)}
                    title="180°回転"
                  >
                    <RotateCw size={11} />
                    <span>{isRotated ? "180°" : "0°"}</span>
                  </button>
                </div>

                {/* カード下部アクション */}
                <div className="pinned-item-actions">
                  <button
                    className="swiss-btn swiss-btn-outline swiss-btn-xs pinned-apply-btn"
                    onClick={() => onApplyPinned(item)}
                    title="この単語・フォント・エンジンをメインビューワーに適用"
                  >
                    <ExternalLink size={11} />
                    <span>メインに適用</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
