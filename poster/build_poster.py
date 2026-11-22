"""2026年度冬季HCD研究発表会 ポスター (A0縦) を python-pptx で組み立てる。

実行: uv run --project backend --with python-pptx --with qrcode python poster/build_poster.py
先に poster/prepare_assets.py で素材を作っておく。
"""

from __future__ import annotations

import json
from pathlib import Path

import qrcode
from lxml import etree
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Emu, Mm, Pt

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "build" / "assets"
OUT = ROOT / "build" / "poster.pptx"

FONT = "BIZ UDPGothic"
INK = RGBColor(0x23, 0x18, 0x15)
SUB = RGBColor(0x5C, 0x55, 0x52)
RED = RGBColor(0xE6, 0x2E, 0x1E)
PANEL = RGBColor(0xFB, 0xEF, 0xEC)  # カードと工程画像の下地。朱に寄せたごく淡い桃色
BAND = RGBColor(0xFD, 0xF5, 0xF2)  # 最下段の帯。PANEL より淡くする
LINE = RGBColor(0xD6, 0xD1, 0xCD)  # セクションのあいだに引く薄いグレーの線
HEAD_FG = RGBColor(0xFF, 0xFF, 0xFF)  # 朱のヘッダーに白抜きで載せる文字
HEAD_SUB = RGBColor(0xFA, 0xD9, 0xD3)  # ヘッダーの補足 (会名、英題、所属)
PAD = 6  # 枠と中身のあいだ (mm)
SEC_GAP = 7  # 枠どうしのあいだ (mm)
HEAD_INK = 3.6  # 見出し (50pt) の字面の上端は、文字枠の上端からこれだけ下にある (PDF で実測)
TEXT_SLACK = 3.5  # 本文 (35pt) の最終行の字面の下端は、行送りの下端からこれだけ上にある
SMALL_SLACK = 1.2  # 30pt の最終行の場合
WHITE = RGBColor(0xFF, 0xFF, 0xFF)

W, H = 841, 1189
M = 32
GAP = 19  # 列どうしのあいだ。枠の外側どうしの間隔が縦横とも SEC_GAP になるよう 2 * PAD + SEC_GAP にする
COL = (W - 2 * M - GAP) / 2

SITE_URL = "https://v76nl.github.io/ambigram-maker/"
REPO_URL = "https://github.com/v76nl/ambigram-maker"

# 著者名と連絡先は git に入れない。poster/author.local.json (.gitignore 済み) から読み、
# なければ poster/author.example.json の仮の値を使う
_author_file = ROOT / "author.local.json"
if not _author_file.exists():
    _author_file = ROOT / "author.example.json"
AUTHOR = json.loads(_author_file.read_text(encoding="utf-8"))

manifest = json.loads((ASSETS / "manifest.json").read_text(encoding="utf-8"))
prs = Presentation()
prs.slide_width, prs.slide_height = Mm(W), Mm(H)
slide = prs.slides.add_slide(prs.slide_layouts[6])
shapes = slide.shapes


def set_font(run, size: float, bold: bool = False, color: RGBColor = INK) -> None:
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = FONT
    rpr = run._r.get_or_add_rPr()
    for tag in ("a:ea", "a:cs"):
        el = rpr.find(qn(tag))
        if el is None:
            el = etree.SubElement(rpr, qn(tag))
        el.set("typeface", FONT)


def text(x, y, w, h, paragraphs, size=26, bold=False, color=INK, align=PP_ALIGN.LEFT,
         spacing=1.35, anchor=MSO_ANCHOR.TOP, space_after=0, name=None):
    """paragraphs: 文字列、または (文字列, {size, bold, color}) の列の列。"""
    box = shapes.add_textbox(Mm(x), Mm(y), Mm(w), Mm(h))
    if name:
        box.name = name
    tf = box.text_frame
    tf.word_wrap = True
    tf.auto_size = None
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = anchor
    if isinstance(paragraphs, str):
        paragraphs = [paragraphs]
    for i, para in enumerate(paragraphs):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.line_spacing = spacing
        p.space_after = Pt(space_after)
        runs = [(para, {})] if isinstance(para, str) else para
        for content, opts in runs:
            r = p.add_run()
            r.text = content
            set_font(r, opts.get("size", size), opts.get("bold", bold), opts.get("color", color))
            if "baseline" in opts:
                r._r.get_or_add_rPr().set("baseline", str(opts["baseline"]))
    return box


def rect(x, y, w, h, color, shape=MSO_SHAPE.RECTANGLE, name=None):
    s = shapes.add_shape(shape, Mm(x), Mm(y), Mm(w), Mm(h))
    s.fill.solid()
    s.fill.fore_color.rgb = color
    s.line.fill.background()
    s.shadow.inherit = False
    if name:
        s.name = name
    return s


def picture(key_or_item, x, y, w=None, h=None, name=None):
    """枠 (w, h) に縦横比を保って収める。片方だけ指定したときはその幅か高さに合わせる。"""
    item = key_or_item if isinstance(key_or_item, dict) else manifest[key_or_item]
    ratio = item["height"] / item["width"]
    if w is not None and h is not None:
        pw, ph = (w, w * ratio) if w * ratio <= h else (h / ratio, h)
        x, y = x + (w - pw) / 2, y + (h - ph) / 2
    elif w is not None:
        pw, ph = w, w * ratio
    else:
        pw, ph = h / ratio, h
    pic = shapes.add_picture(str(ASSETS / item["file"]), Mm(x), Mm(y), Mm(pw), Mm(ph))
    if name:
        pic.name = name
    return pic, pw, ph


SECTIONS: dict[str, tuple[float, float, float, float]] = {}


def frame(x0, y0, x1, y1, name):
    """セクションの中身の字面の範囲 (x0, y0)-(x1, y1) を覚えておく。区切り線はあとでこの範囲のあいだに引く。"""
    SECTIONS[name] = (x0, y0, x1, y1)


def rule(x0, y0, x1, y1, name):
    """区切りの直線 (水平か垂直)。コネクタは PowerPoint の PDF 書き出しで画像になるので、細い長方形で描く。"""
    t = 0.6
    if y0 == y1:
        rect(x0, y0 - t / 2, x1 - x0, t, LINE, name=name)
    else:
        rect(x0 - t / 2, y0, t, y1 - y0, LINE, name=name)


NUM_BOX = 16.8  # 見出しの番号を白抜きにする朱の正方形の一辺 (mm)。見出しの字面の高さに合わせる
NUM_BOX_Y = HEAD_INK  # 正方形の上端を見出しの字面の上端にそろえる


def heading(x, y, number, title, w=COL):
    """番号を朱の正方形に白抜きで入れ、その右に見出しを置く。"""
    rect(x, y + NUM_BOX_Y, NUM_BOX, NUM_BOX, RED, name=f"HeadingNumber{number}")
    # 数字の字面は文字枠の中央より下に出るので、上へずらして正方形の上下の中央にそろえる (PDF で実測)
    # 「1」は字面が左に寄るので、右へずらして左右の中央にそろえる
    dx = 1.1 if number == "1" else 0
    text(x + dx, y + NUM_BOX_Y - 1.1, NUM_BOX, NUM_BOX, number, size=44, bold=True, color=WHITE,
         align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE, spacing=1.0)
    text(x + NUM_BOX + 5, y, w - NUM_BOX - 5, 24, title, size=50, bold=True, spacing=1.0)


def qr(x, y, size, url, name):
    code = qrcode.QRCode(border=0, error_correction=qrcode.constants.ERROR_CORRECT_M)
    code.add_data(url)
    code.make(fit=True)
    matrix = code.get_matrix()
    cell = size / len(matrix)
    group = shapes.add_group_shape()
    group.name = name
    for row, line in enumerate(matrix):
        col = 0
        while col < len(line):
            if line[col]:
                start = col
                while col < len(line) and line[col]:
                    col += 1
                s = group.shapes.add_shape(MSO_SHAPE.RECTANGLE, Mm(x + start * cell), Mm(y + row * cell),
                                           Mm((col - start) * cell + 0.05), Mm(cell + 0.05))
                s.fill.solid()
                s.fill.fore_color.rgb = INK
                s.line.fill.background()
                s.shadow.inherit = False
            else:
                col += 1


def email_width(s: str, size: float) -> float:
    """BIZ UDPGothic で組んだ文字列の幅 (mm)。右寄せした連絡先の左にアイコンを置くために使う。"""
    from PIL import ImageFont

    font = ImageFont.truetype("BIZ-UDGothicR.ttc", 1000, index=1)
    return font.getlength(s) / 1000 * size * 0.3528


def mail_icon(x, y, w, h, color=HEAD_FG, flap=RED, name="MailIcon"):
    """封筒の形のメールアイコン。塗りの長方形に、背景色の V 字の帯を重ねてふたを表す。"""
    rect(x, y, w, h, color, name=name)
    t = h * 0.13
    pts = [(x, y), (x + w / 2, y + h * 0.55), (x + w, y), (x + w, y + t),
           (x + w / 2, y + h * 0.55 + t * 1.4), (x, y + t)]
    fb = shapes.build_freeform(Mm(pts[0][0]), Mm(pts[0][1]), scale=1.0)
    fb.add_line_segments([(Mm(px), Mm(py)) for px, py in pts[1:]], close=True)
    shp = fb.convert_to_shape()
    shp.fill.solid()
    shp.fill.fore_color.rgb = flap
    shp.line.fill.background()
    shp.shadow.inherit = False
    shp.name = name + "Flap"


# 文字の大きさ (pt)。A0 を少し離れて読む前提で、本文は BODY を基準にする
BODY = 35
SMALL = 30
CAPTION = 27
REF = 25
SP = 1.12  # 本文の行間 (PowerPoint の倍率。実際の行送りは文字の大きさの約1.37倍)


def cite(n: int, size: float = 30) -> tuple[str, dict]:
    """本文中の参考文献番号。本文より小さい灰色の上付きにする。"""
    return (f"[{n}]", {"size": size, "color": SUB, "baseline": 35000})


def lh(size: float, spacing: float = SP) -> float:
    """PowerPoint で BIZ UDPGothic を組んだときの1行の高さ (mm)。書き出した PDF で実測した係数を使う。"""
    return size * 0.3528 * spacing * 1.22


def block(x, y, w, lines, size=BODY, spacing=SP, **kw) -> float:
    """手で改行した段落を置き、下端の y を返す。"""
    text(x, y, w, len(lines) * lh(size, spacing) + 2, lines, size=size, spacing=spacing, **kw)
    return y + len(lines) * lh(size, spacing)


# 見出し。上端から連絡先の下までを朱の帯にし、文字は白抜きにする
HEAD_BAND_H = 133
rect(0, 0, W, HEAD_BAND_H, RED, name="HeaderBand")
text(M, 16.5, 600, 12, "2026年度 冬季HCD研究発表会  ポスター発表 C04", size=34, color=HEAD_SUB, spacing=1.0)
text(M - 1.5, 30.8, W - 2 * M, 42, "180度回転型アンビグラム制作支援システム", size=104, bold=True, color=HEAD_FG, spacing=1.0, name="Title")
text(M, 76.3, W - 2 * M, 14, "Point Symmetry (180-Degree Rotational) Ambigram Design Support System", size=34, color=HEAD_SUB)
author_runs = []
for k, a in enumerate(AUTHOR["authors"]):
    author_runs += [(("      " if k else "") + a["name"], {"size": 44, "bold": True, "color": HEAD_FG}),
                    ("  " + a["note"], {"size": 28, "color": HEAD_SUB})]
text(M, 96.4, W - 2 * M, 18, [author_runs], spacing=1.0)
text(M, 98.4, W - 2 * M, 14, AUTHOR["email"], size=34, color=HEAD_FG, align=PP_ALIGN.RIGHT, spacing=1.0, name="Contact")
mail_icon(W - M - email_width(AUTHOR["email"], 34) - 4 - 12, 102.3, 12, 8.4)  # 数字の上端と基準線の中央にそろえる

# 主役の作例と要旨
HERO_Y = 140
HERO_W = 300
_, hero_w, hero_h = picture("hero", M, HERO_Y, w=HERO_W, name="Hero")
text(M, HERO_Y + hero_h + 2, HERO_W + 30, 12, "システムで生成した「長寿」",
     size=CAPTION, color=SUB, spacing=1.0)
RX = M + HERO_W + 36
RW = W - M - RX
text(RX, HERO_Y + 2, RW, 32, "点対称な文字デザイン", size=80, bold=True, spacing=1.0)
lead_end = block(RX, HERO_Y + 38, RW, [
    "漢字を含む日本語の単語を、180度回転しても",
    "同じ単語として読めるデザインに仕上げる",
    "制作支援システムを開発した。 辞書探索、",
    "フォント骨格の変形、毛筆調の再描画を組み合わせ、",
    "人が見ながら微調整できる。",
], size=38)

# 1 背景
Y1 = HERO_Y + hero_h + 2 + lh(CAPTION, 1.0) + 6 + PAD
heading(M, Y1, "1", "背景", w=W - 2 * M)
CARD_W = (W - 2 * M - 2 * GAP) / 3
cards = [
    ("アンビグラムとは", ["見る角度や方向を変えても", "文字として読める", "タイポグラフィ。"]),
    ("漢字の難しさ", ["日本語は文字種が混在し、", "漢字は画数が多く部首の構造も",
                      "複雑である。 アンビグラム制作は、", "現状デザイナーの属人的な", "技術に頼っている。"]),
    ("先行研究", ["欧文では、GAN などの", "深層生成モデルによる生成が", [("研究されている", {}), cite(1), ("。 日本語では", {})],
                  [("ひらがなが中心で", {}), cite(2), ("、漢字を", {})], "含む制作支援はほとんど例がない。"]),
]
CARD_TOP = 18  # カード見出しの帯の高さ
CARD_H = CARD_TOP + 7 + max(len(b) for _, b in cards) * lh(BODY) + 7
for i, (title, body) in enumerate(cards):
    cx = M + i * (CARD_W + GAP)
    cy = Y1 + 28
    rect(cx, cy, CARD_W, CARD_H, PANEL, name=f"BackgroundCard{i}")
    rect(cx, cy, CARD_W, CARD_TOP, RED, name=f"BackgroundCardHead{i}")
    text(cx + 12, cy - 1.1, CARD_W - 24, CARD_TOP, title, size=40, bold=True, color=WHITE, spacing=1.0,
         anchor=MSO_ANCHOR.MIDDLE)
    tw = CARD_W - 24 - (54 if i == 0 else 0)
    block(cx + 12, cy + CARD_TOP + 7, tw, body)
    if i == 0:
        picture("fig1", cx + CARD_W - 58, cy + CARD_TOP + 5, w=50, h=64, name="Fig1")
        block(cx + CARD_W - 61, cy + CARD_TOP + 70, 58, ["線対称の例", "(第二著者作)"], size=24, spacing=1.0,
              color=SUB, align=PP_ALIGN.CENTER)
frame(M, Y1 + HEAD_INK, W - M, Y1 + 28 + CARD_H, "Section1Frame")

# 2 処理過程 (実装の処理順。番号は予稿の5段階に合わせる)
Y2 = Y1 + 28 + CARD_H + 2 * PAD + SEC_GAP - HEAD_INK
heading(M, Y2, "2", "アンビグラム作成の処理過程", w=W - 2 * M)
legend = [("正立の文字", RGBColor(0xB2, 0xB2, 0xB2)), ("倒立の文字", RED), ("両者の重なり", INK)]
lx = W - M - 256
for j, (label, color) in enumerate(legend):
    rect(lx, Y2 + 7, 7, 7, color, name=f"LegendSwatch{j}")
    text(lx + 10, Y2 + 4, 80, 13, label, size=28, color=SUB, spacing=1.0)
    lx += 10 + [64, 64, 74][j] + 12
steps = [
    ("単語の選定", ["JMdict の語を", "線・骨格・余白の", "重なりで評価して", "並べる"], None),
    ("フォントの選定", ["正立と倒立の", "文字を重ね、", "書体と位置を", "グリッドサーチする"], "align"),
    ("近い線の引き寄せ", ["近い線どうしを、", "相手の骨格の", "いちばん近い点へ", "向けて寄せる"], "attract"),
    ([("TPS 変形", {}), cite(3, 28)], ["寄せる点と", "固定する点から、", "曲げエネルギー", "最小の変形を解く"], "tps"),
    ("共通部分の強調", ["両方の輪郭までの", "距離の調和平均で、", "両方の線の内側", "だけを強く残す"], "field"),
    ("中心線の抽出", ["強く残った領域を", "外側から1画素ずつ", "削り、中心線を", "取り出す"], "skeleton"),
    ("毛筆調の再描画", ["重なる部分は太く、", "片方だけの線は", "細く、楕円の筆で", "描き直す"], "result"),
]
STEP_GAP = 8
SW = (W - 2 * M - (len(steps) - 1) * STEP_GAP) / len(steps)
step_end = 0.0
for i, (title, body, key) in enumerate(steps):
    sx = M + i * (SW + STEP_GAP)
    rect(sx, Y2 + 28, SW, 56, PANEL, name=f"StepImageArea{i}")
    if key:
        picture(manifest["steps"][key], sx + 2, Y2 + 30, w=SW - 4, h=52, name=f"Step{i}")
    else:
        words = ["長寿", "日曜日", "奥歯", "垂直", "蜘蛛", "気の毒"]
        chip_w = (SW - 18) / 2
        for j, word in enumerate(words):
            wx = sx + 6 + (j % 2) * (chip_w + 6)
            wy = Y2 + 32 + (j // 2) * 17
            rect(wx, wy, chip_w, 14, WHITE, name=f"WordChip{j}")
            text(wx, wy, chip_w, 14, word, size=28, bold=j == 0, color=RED if j == 0 else INK,
                 align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE, spacing=1.0)
    text(sx, Y2 + 88, SW, 13, [title] if isinstance(title, list) else title, size=32, bold=True, spacing=1.0)
    step_end = block(sx, Y2 + 101, SW, body, size=SMALL, spacing=1.0)

# 3 システム画面 (左列)。画面の下端の空いた部分は切り落とす
frame(M, Y2 + HEAD_INK, W - M, step_end - SMALL_SLACK, "Section2Frame")
Y3 = step_end - SMALL_SLACK + 2 * PAD + SEC_GAP - HEAD_INK
heading(M, Y3, "3", "システム画面")
from PIL import Image  # noqa: E402

with Image.open(ASSETS / manifest["screenshot"]["file"]) as im:
    crop = im.crop((0, 0, im.width, round(im.height * 0.82)))
    crop.save(ASSETS / "screenshot-crop.png")
    shot = {"file": "screenshot-crop.png", "width": crop.width, "height": crop.height}
_, _, shot_h = picture(shot, M, Y3 + 28, w=COL, name="Screenshot")
y = block(M, Y3 + 30 + shot_h, COL, ["左: 単語の候補   中央: 生成結果と工程   右: 書体の候補と文字ごとの位置調整"],
          size=CAPTION - 1, spacing=1.0, color=SUB)
left_end = block(M, y + 3, COL, [
    "XY 座標の移動量、TPS の引き寄せ強度、中心線の太さ、",
    "筆圧の抑揚等をスライダーで調整し、完成した作品画像を、",
    "情報を記録した JSON ファイル付きで書き出せる。",
])

# 下の2列: 上段に 3 と 4、下段に 5 と 6 を並べる。上段と下段の境目は1本の水平線で全幅を区切る
RX2 = M + COL + GAP
sec3_end = left_end - TEXT_SLACK

# 作例の画像の高さは、4 の下端が 3 の下端にそろうように決める
LABEL_ROW = 3 + lh(30, 1.0) + 5
IMG_H = min((sec3_end + 5.6 - Y3 - 28) / 3 - LABEL_ROW, 72)
ROW = IMG_H + LABEL_ROW
print(f"gallery image height {IMG_H:.1f} mm")
sec4_end = Y3 + 28 + 3 * ROW - 5 - 0.6
Y56 = max(sec3_end, sec4_end) + 2 * PAD + SEC_GAP - HEAD_INK

# 5 有用性と価値 (下段の左)
Y5 = Y56
heading(M, Y5, "5", "有用性と価値")
values = [
    ("制作支援", ["単語探しと初期形状の提示をコンピューターが担い、", "試行錯誤の時間を短くする"]),
    ("認知的驚き", ["見慣れた漢字が逆さでも読める驚きと、", "試作する面白さを提供する"]),
    ("人間との協調", ["探索と補間はコンピューター、", "読みやすさと美しさの判断は人が担う"]),
]
LABEL_W, VAL_GAP = 92, 2
y = Y5 + 28
for label, body in values:
    block(M, y, LABEL_W, [label], bold=True, color=RED)
    y = block(M + LABEL_W, y, COL - LABEL_W, body) + VAL_GAP
left_ink_end = y - VAL_GAP - TEXT_SLACK

s6_lines = (["3,082 字種の文字認識モデルで可読性を測る仕組みを用意した。",
             "試作例の目視では、中心線の抽出と毛筆調の処理により",
             "可読性が高まる傾向が見られた。"],
            ["一方で、細かいドット模様や不自然な歪みが残り、",
             "デザイン的に美しくない。",
             "被験者実験も未実施であり、品質向上と検証が今後の課題である。"])

# 4 作例 (上段の右)
heading(RX2, Y3, "4", "作例")
cell_w = (COL - 16) / 2
GALLERY_ORDER = ["日曜日", "奥歯", "垂直", "気の毒", "留置場", "蜘蛛"]
by_word = {item["word"]: item for item in manifest["gallery"]}
for i, item in enumerate(by_word[w] for w in GALLERY_ORDER):
    gx = RX2 + (i % 2) * (cell_w + 16)
    gy = Y3 + 28 + (i // 2) * ROW
    picture(item, gx, gy, w=cell_w, h=IMG_H, name=f"Work{i}")
    text(gx, gy + IMG_H + 3, cell_w, 12, item["word"], size=30, bold=True, align=PP_ALIGN.CENTER, spacing=1.0)

# 6 評価と限界 (下段の右)
Y6 = Y56
heading(RX2, Y6, "6", "評価と限界")
# 予稿に合わせ、傾向は認識器の計測ではなく目視での観察として書く
y = block(RX2, Y6 + 28, COL, s6_lines[0])
right_ink_end = block(RX2, y + 3, COL, s6_lines[1]) - TEXT_SLACK

bottom = max(left_ink_end, right_ink_end)
left_end, right_end = left_ink_end + TEXT_SLACK, right_ink_end + TEXT_SLACK + 5  # 下の print 用
frame(M, Y3 + HEAD_INK, M + COL, sec3_end, "Section3Frame")
frame(M, Y5 + HEAD_INK, M + COL, left_ink_end, "Section5Frame")
frame(RX2, Y3 + HEAD_INK, W - M, sec4_end, "Section4Frame")
frame(RX2, Y6 + HEAD_INK, W - M, right_ink_end, "Section6Frame")

# 区切り線: 隣り合うセクションの字面のあいだの中央に、1本ずつ引く
HERO_INK_END = HERO_Y + hero_h + 2 + lh(CAPTION, 1.0) - 2.5
s1, s2, s3, s4, s5, s6 = (SECTIONS[f"Section{i}Frame"] for i in range(1, 7))
rule(M, (HERO_INK_END + s1[1]) / 2, W - M, (HERO_INK_END + s1[1]) / 2, "RuleHero1")
rule(M, (s1[3] + s2[1]) / 2, W - M, (s1[3] + s2[1]) / 2, "Rule12")
rule(M, (s2[3] + s3[1]) / 2, W - M, (s2[3] + s3[1]) / 2, "Rule2Cols")
# 上段と下段の境目は全幅の水平線にし、列の境目の垂直線はそこで上下に分ける
ROW_Y = (max(s3[3], s4[3]) + s5[1]) / 2
VX = M + COL + GAP / 2
rule(M, ROW_Y, W - M, ROW_Y, "Rule34to56")
rule(VX, s3[1], VX, ROW_Y - GAP / 2, "RuleColumnsUpper")
rule(VX, ROW_Y + GAP / 2, VX, bottom, "RuleColumnsLower")

# 最下段: 参考文献、QRコード、ロゴ、イラスト
refs = [
    "[1] 魏延輝, 山口裕: 多目的最適化 GAN によるアンビグラム生成; 2023年度電気関係学会九州支部連合大会講演論文集, p.39 (2023)",
    "[2] 井上和輝, 高橋裕樹: 文字構造特徴を用いたひらがなアンビグラムの生成; 画像電子学会誌, Vol.49, No.4, pp.301-314 (2020)",
    "[3] Bookstein, F. L.: Principal Warps: Thin-Plate Splines and the Decompositions of Deformations; IEEE TPAMI, Vol.11, No.6, pp.567-585 (1989)",
]
YF = H - M - 6 * lh(REF, 1.0) - 2 * 1.2
FOOT_BAND_Y = YF - 12
rect(0, FOOT_BAND_Y, W, H - FOOT_BAND_Y, BAND, name="FooterBand")
text(M, YF, 430, H - M - YF, refs, size=REF, color=SUB, spacing=1.0, space_after=3)
QX = M + 446


def render_github_mark(px: int = 1200) -> dict:
    """poster/icons/github-mark.svg (primer/octicons の mark-github-24) を黒の透過 PNG にする。"""
    import re

    from PIL import ImageDraw
    from svg.path import parse_path

    svg = (ROOT / "icons" / "github-mark.svg").read_text(encoding="utf-8")
    pts = []
    for seg in parse_path(re.search(r' d="([^"]+)"', svg).group(1)):
        n = 1 if type(seg).__name__ in ("Line", "Move", "Close") else 24
        pts += [(seg.point(k / n).real, seg.point(k / n).imag) for k in range(n + 1)]
    x0, y0 = min(x for x, _ in pts), min(y for _, y in pts)
    ext = max(max(x for x, _ in pts) - x0, max(y for _, y in pts) - y0)
    big = px * 4
    mask = Image.new("L", (big, big), 0)
    ImageDraw.Draw(mask).polygon([((x - x0) / ext * (big - 1), (y - y0) / ext * (big - 1)) for x, y in pts], fill=255)
    out = Image.new("RGBA", (px, px), (0, 0, 0, 0))
    out.putalpha(mask.resize((px, px), Image.LANCZOS))
    out.save(ASSETS / "github-mark.png")
    return {"file": "github-mark.png", "width": px, "height": px}


github_mark = render_github_mark()
for i, (label, url) in enumerate([("解説サイト", SITE_URL), ("GitHub", REPO_URL)]):
    qx = QX + i * 84  # QR どうしは 38mm あける
    rect(qx - 3, H - M - 63, 52, 52, WHITE, name=f"QRBack{i}")  # 読み取りやすいよう QR の周りは白にする
    qr(qx, H - M - 60, 46, url, f"QR{i}")
    if label == "GitHub":
        # GitHub のロゴの使用規定に従い、黒・無加工のまま、自分の名前より小さく置く
        ICON, GH_W = 9, 42  # GH_W は「GitHub」(30pt 太字) の幅。PDF で実測
        lx0 = qx + 23 - (ICON + 2.5 + GH_W) / 2
        picture(github_mark, lx0, H - M - 6.3, w=ICON, name="GitHubMark")
        text(lx0 + ICON + 2.5, H - M - 9, GH_W + 8, 12, label, size=SMALL, bold=True, spacing=1.0)
    else:
        text(qx - 6, H - M - 9, 58, 12, label, size=SMALL, bold=True, align=PP_ALIGN.CENTER, spacing=1.0)

# ロゴは白地の不透明な画像なので、白を透明に置き換えて帯の色になじませる
with Image.open(ASSETS / manifest["logo"]["file"]) as im:
    import numpy as np  # noqa: E402

    rgb = np.asarray(im.convert("RGB")).astype(np.float32)
    alpha = 255 - rgb.min(axis=2)
    a = np.maximum(alpha, 1)[..., None] / 255
    color = np.clip((rgb - 255 * (1 - a)) / a, 0, 255)
    clear = np.dstack([color, alpha]).astype(np.uint8)
    Image.fromarray(clear, "RGBA").save(ASSETS / "logo-clear.png")
    logo = {"file": "logo-clear.png", "width": im.width, "height": im.height}
picture(logo, W - M - 58 - 14 - 72, H - M - 40, w=72, name="Logo")
picture("illustration", W - M - 58, H - M - 62, w=58, name="Illustration")

print(f"frames end {bottom + PAD:.0f} mm, footer band starts {FOOT_BAND_Y:.0f} mm")
print(f"left column ends {left_end:.0f} mm, right column ends {right_end:.0f} mm, "
      f"footer text starts {YF:.0f} mm, QR starts {H - M - 60:.0f} mm")

OUT.parent.mkdir(parents=True, exist_ok=True)
prs.save(OUT)
print("saved", OUT)
