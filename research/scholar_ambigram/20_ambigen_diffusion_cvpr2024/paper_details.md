# AmbiGen: Generating Ambigrams from Pre-trained Diffusion Model

## 書誌情報
- **ID**: 20
- **著者**: Boheng Zhao, Rana Hanocka, Raymond A. Yeh (University of Chicago / Purdue University)
- **発行年**: 2024
- **掲載誌/会議**: Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR 2024)
- **arXiv**: [arXiv:2311.17112](https://arxiv.org/abs/2311.17112)
- **プロジェクトページ**: [https://ambigen.github.io/](https://ambigen.github.io/)
- **全文PDF**: **あり** (`paper.pdf`, 1.68MB)

## 抄録 (Abstract)
An ambigram is a visual art form of calligraphy that can be viewed and read from multiple perspectives, typically under a 180-degree rotation. Creating ambigrams requires both artistic creativity and immense manual effort to satisfy the dual readability constraints. In this paper, we propose AmbiGen, an automated approach to generate calligraphic ambigrams by distilling knowledge from pre-trained diffusion models. Specifically, we optimize character outlines to balance readability and aesthetic quality across dual views.

## 核心的貢献と本プロジェクトへの示唆
1. **文字アウトライン（ベクター輪郭）の直接最適化**:
   - ピクセル単位の生成ではなく、ストロークのアウトライン制御点を可変形状として最適化し、幾何学的整合性と文字としての可読性を両立。
2. **文字骨格とタイポグラフィの美しさの維持**:
   - 単なる変形ではなく、カリグラフィ（書道・筆致）としての整合性を制約条件として導入。
   - 本研究の「モルフォロジー細線化」＋「毛筆調抑揚変調」によるタイポグラフィ昇華アプローチを強く支持する国際先端知見。
