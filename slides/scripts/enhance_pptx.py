#!/usr/bin/env python3
"""
PowerPoint (.pptx) スライド切り替えアニメーション付与スクリプト (scripts/enhance_pptx.py)

Marp CLI によって生成された slides.pptx のスライド5に対し、
中央から左右に開くスプリットトランジション（<p:split orient="vert" dir="out"/>）を付与します。
これにより、PowerPoint のスライドショー実行時にスライド4からスライド5へ進む際、
中央から左右にスーッと分裂・展開するアニメーションがネイティブに動作します。
"""

import sys
import os
import zipfile
import shutil
import tempfile

def enhance_pptx(pptx_path: str):
    if not os.path.exists(pptx_path):
        print(f"[enhance_pptx] ファイルが見つかりません: {pptx_path}", file=sys.stderr)
        return False

    temp_fd, temp_path = tempfile.mkstemp(suffix=".pptx")
    os.close(temp_fd)

    # PowerPoint のスプリット画面切り替えトランジション
    transition_xml = '<p:transition spd="med"><p:split orient="vert" dir="out"/></p:transition>'

    injected = False
    with zipfile.ZipFile(pptx_path, 'r') as zin:
        with zipfile.ZipFile(temp_path, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                content = zin.read(item.filename)
                if item.filename == 'ppt/slides/slide5.xml':
                    xml_str = content.decode('utf-8')
                    if '<p:transition' not in xml_str:
                        # </p:sld> の直前に挿入
                        xml_str = xml_str.replace('</p:sld>', f'{transition_xml}</p:sld>')
                        content = xml_str.encode('utf-8')
                        injected = True
                zout.writestr(item, content)

    if injected:
        shutil.move(temp_path, pptx_path)
        print("[enhance_pptx] スライド5にネイティブ・スプリットトランジションを付与しました！")
    else:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        print("[enhance_pptx] トランジションは既に設定されているか対象外です。")

    return True

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else 'slides.pptx'
    enhance_pptx(target)
