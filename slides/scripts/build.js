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

  try {
    if (mode === 'html' || mode === 'all') {
      console.log('[build.js] Converting markdown to HTML...');
      execSync(`npx --yes @marp-team/marp-cli --no-stdin --allow-local-files "_slides.built.md" -o slides.html`, {
        cwd: slidesDir,
        stdio: 'inherit',
        shell: true,
      });
    }

    if (mode === 'pdf' || mode === 'all') {
      console.log('[build.js] Converting markdown to PDF...');
      execSync(`npx --yes @marp-team/marp-cli --no-stdin --allow-local-files --pdf "_slides.built.md" -o slides.pdf`, {
        cwd: slidesDir,
        stdio: 'inherit',
        shell: true,
      });
    }

    if (mode === 'pptx' || mode === 'all') {
      console.log('[build.js] Converting markdown to PPTX...');
      execSync(`npx --yes @marp-team/marp-cli --no-stdin --allow-local-files --pptx "_slides.built.md" -o slides.pptx`, {
        cwd: slidesDir,
        stdio: 'inherit',
        shell: true,
      });
    }
  } catch (err) {
    console.error('[build.js] ビルド中にエラーが発生しました:', err.message);
    process.exit(1);
  } finally {
    // 一時ファイルのクリーンアップ
    if (fs.existsSync(tmpFile)) {
      try {
        fs.unlinkSync(tmpFile);
      } catch (e) {
        // ignore unlink error
      }
    }
  }
}

build();
