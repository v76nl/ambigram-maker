# Ambigram Generation by a Diffusion Model

## 書誌情報
- **ID**: 19
- **著者**: Takahiro Shirakawa, Seiichi Uchida (九州大学 内田誠一教授ら)
- **発行年**: 2023
- **掲載誌/会議**: Document Analysis and Recognition – ICDAR 2023, Lecture Notes in Computer Science (LNCS), vol. 14189, pp. 314–330, Springer (2023)
- **DOI**: [10.1007/978-3-031-41676-7_20](https://doi.org/10.1007/978-3-031-41676-7_20)
- **arXiv**: [arXiv:2306.12049](https://arxiv.org/abs/2306.12049)
- **全文PDF**: **あり** (`paper.pdf`, 3.6MB)
- **英語抽出テキスト**: [paper_transcript_en.md](./paper_transcript_en.md)
- **日本語全訳**: [paper_translation_ja.md](./paper_translation_ja.md)

## 抄録 (Abstract)
An ambigram is a calligraphic design that has multiple interpretations when viewed from different directions, such as upside down (i.e., 180-degree rotation). Designing ambigrams is a creative and difficult task, even for professional calligraphers and type designers. In this paper, we propose a novel framework for generating ambigrams using a diffusion model. By specifying a pair of letter classes, the proposed model generates an image that represents the first letter in the normal orientation and the second letter in the upside-down orientation. We also propose an objective metric called 'ambigramability' to evaluate how easily a pair of letters can form an ambigram.

## 核心的貢献と本プロジェクトへの示唆
1. **Ambigramability（アンビグラム成立可能性指標）の提唱**:
   - 任意の文字ペア $(c_1, c_2)$ に対し、アンビグラムとして両立・成立しやすい度合いを定量化する客観指標を導入。
   - 本システムの「4つの幾何的特徴に基づく類似度評価モデル（事前スクリーニング）」の設計思想を国際最高峰学会の知見として直接裏付ける。
2. **文字認識モデルによる客観的可読性評価**:
   - 生成されたアンビグラムの正立・倒立の双方に対する認識信頼度を用いた客観評価パイプラインを確立。
   - 本研究の「CNN客観的可読性評価（調和平均）」と完全に直結する国際標準アプローチ。
