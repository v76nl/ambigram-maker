#!/usr/bin/env node
/**
 * スライドビルド用プリプロセッサ & ビルドスクリプト (scripts/build.js)
 * 
 * 1. .env（slides/.env または ルート/.env）から環境変数を読み込む
 * 2. slides.md 内の {{VARIABLE}} プレースホルダー（氏名・学籍番号等）を展開
 * 3. 一時ファイル _slides.built.md を生成して Marp CLI でビルド
 * 4. 完了後に一時ファイルを確実に削除（機密・個人情報の漏洩防止）
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const mode = process.argv[2] || 'html'; // 'html', 'pdf', 'pptx', 'all'
const slidesDir = path.resolve(__dirname, '..');
const sourceFile = path.join(slidesDir, 'slides.md');
const tmpFile = path.join(slidesDir, '_slides.built.md');

// デフォルトのフォールバック値
const defaultEnv = {
  STUDENT_NAME: '氏名',
  STUDENT_ID: '学籍番号',
  AFFILIATION: '所属組織名 / 専攻名',
  PRESENTATION_DATE: '2026年XX月XX日',
};

function parseEnvFile(filePath) {
  const result = {};
  if (!fs.existsSync(filePath)) return result;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      result[key] = val;
    }
  }
  return result;
}

function loadConfig() {
  const envCandidates = [
    path.join(slidesDir, '..', '.env'),
    path.join(slidesDir, '.env'),
  ];

  let loaded = { ...defaultEnv };

  for (const p of envCandidates) {
    if (fs.existsSync(p)) {
      const parsed = parseEnvFile(p);
      loaded = { ...loaded, ...parsed };
    }
  }

  // 実行時環境変数での上書き
  for (const key of Object.keys(defaultEnv)) {
    if (process.env[key]) {
      loaded[key] = process.env[key];
    }
  }

  return loaded;
}

function build() {
  const config = loadConfig();

  if (!fs.existsSync(sourceFile)) {
    console.error(`[build.js] エラー: ソーススライドが見つかりません: ${sourceFile}`);
    process.exit(1);
  }

  let content = fs.readFileSync(sourceFile, 'utf-8');

  // {{KEY}} を置換
  for (const [key, val] of Object.entries(config)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    content = content.replace(regex, val);
  }

  // 一時ファイルに書き込み
  fs.writeFileSync(tmpFile, content, 'utf-8');

  // 静止画・印刷・PPTX用の一時ファイル（アニメーション完了・回転状態のスタイルを注入）
  const staticTmpFile = path.join(slidesDir, '_slides.static.built.md');
  const staticStyleOverride = `\n\n<style>\n/* PDF/PPTX静止出力用: 180度回転・左右分離・バッジ表示の完成状態で静止キャプチャ */\n.anim-left, .anim-right { transform: translateX(0) !important; animation: none !important; }\n.anim-rotate-img { transform: rotate(180deg) !important; animation: none !important; }\n.split-card .rel-badge:not(.is-hidden) { opacity: 1 !important; transform: none !important; animation: none !important; }\n</style>\n`;
  fs.writeFileSync(staticTmpFile, content + staticStyleOverride, 'utf-8');

  try {
    if (mode === 'html' || mode === 'all') {
      console.log('[build.js] Converting markdown to HTML...');
      execSync(`npx --yes @marp-team/marp-cli --no-stdin --allow-local-files "_slides.built.md" -o slides.html`, {
        cwd: slidesDir,
        stdio: 'inherit',
        shell: true,
      });

      // HTML 版にスライド5のアニメーション起動スクリプトを安全に注入（チラつき防止）
      const htmlPath = path.join(slidesDir, 'slides.html');
      if (fs.existsSync(htmlPath)) {
        let html = fs.readFileSync(htmlPath, 'utf-8');
        const animScript = `\n<script>
(() => {
  const setupAnimation = () => {
    const sec5 = document.getElementById('5') || document.querySelector('section[id="5"]');
    if (!sec5) return false;
    const stage = sec5.querySelector('.split-ambigram-stage');
    if (!stage) return false;
    const slideWrapper = sec5.closest('.bespoke-marp-slide') || sec5.closest('svg') || sec5;

    let prevActive = false;
    const update = () => {
      const hasActiveCls = slideWrapper.classList.contains('bespoke-marp-active') || !!slideWrapper.closest('.bespoke-marp-active');
      const isHash5 = window.location.hash === '#5' || window.location.hash.startsWith('#5:') || window.location.hash.startsWith('#5?');
      const isActive = hasActiveCls || isHash5;

      if (isActive && !prevActive) {
        stage.classList.remove('is-animated');
        void stage.offsetWidth;
        requestAnimationFrame(() => {
          stage.classList.add('is-animated');
        });
      } else if (!isActive && prevActive) {
        stage.classList.remove('is-animated');
      }
      prevActive = isActive;
    };

    const obs = new MutationObserver(update);
    obs.observe(slideWrapper, { attributes: true, attributeFilter: ['class'] });
    if (slideWrapper !== sec5) {
      obs.observe(sec5, { attributes: true, attributeFilter: ['class'] });
    }

    window.addEventListener('hashchange', update);
    window.addEventListener('popstate', update);
    window.addEventListener('keydown', () => setTimeout(update, 50));
    window.addEventListener('click', () => setTimeout(update, 50));

    update();
    return true;
  };

  const tryInit = () => {
    if (setupAnimation()) return;
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (setupAnimation() || attempts > 50) {
        clearInterval(interval);
      }
    }, 50);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInit);
  } else {
    tryInit();
  }
})();
</script>\n`;
        if (html.includes('</body>')) {
          html = html.replace('</body>', `${animScript}</body>`);
          fs.writeFileSync(htmlPath, html, 'utf-8');
          console.log('[build.js] Injected slide 5 animation controller into slides.html');
        }
      }
    }

    if (mode === 'pdf' || mode === 'all') {
      console.log('[build.js] Converting markdown to PDF...');
      execSync(`npx --yes @marp-team/marp-cli --no-stdin --allow-local-files --pdf "_slides.static.built.md" -o slides.pdf`, {
        cwd: slidesDir,
        stdio: 'inherit',
        shell: true,
      });
    }

    if (mode === 'pptx' || mode === 'all') {
      console.log('[build.js] Converting markdown to PPTX...');
      execSync(`npx --yes @marp-team/marp-cli --no-stdin --allow-local-files --pptx "_slides.static.built.md" -o slides.pptx`, {
        cwd: slidesDir,
        stdio: 'inherit',
        shell: true,
      });

      console.log('[build.js] Enhancing PPTX with native slide transition animation...');
      try {
        execSync(`python scripts/enhance_pptx.py slides.pptx`, {
          cwd: slidesDir,
          stdio: 'inherit',
          shell: true,
        });
      } catch (e) {
        console.warn('[build.js] 警告: enhance_pptx.py の実行中に問題が発生しました:', e.message);
      }
    }
  } catch (err) {
    console.error('[build.js] ビルド中にエラーが発生しました:', err.message);
    process.exit(1);
  } finally {
    // 一時ファイルのクリーンアップ
    for (const f of [tmpFile, staticTmpFile]) {
      if (fs.existsSync(f)) {
        try {
          fs.unlinkSync(f);
        } catch (e) {
          // ignore unlink error
        }
      }
    }
  }
}

build();
