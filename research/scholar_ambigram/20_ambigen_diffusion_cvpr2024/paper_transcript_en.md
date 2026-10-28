## Page 1

AmbiGen: Generating Ambigrams from Pre-trained Diffusion Model
Boheng Zhao1
Rana Hanocka2
Raymond A. Yeh1
1Dept. of CS, Purdue University
2Dept. of CS, University of Chicago
“Ask” ↔ “Ask” 
 
“Water” ↔ “Water”
“Back” ↔“Back”
Figure 1. Ambigrams designed by our proposed method. Observe that the words can be read the same after a rotation of 180 degrees. The
words are shown with color gradients to better visualize the correspondence before and after the rotation.
Abstract
Ambigrams are calligraphic designs that have different
meanings depending on the viewing orientation. Creating
ambigrams is a challenging task even for skilled artists, as it
requires maintaining the meaning under two different view-
points at the same time. In this work, we propose to generate
ambigrams by distilling a large-scale vision and language
diffusion model, namely DeepFloyd IF, to optimize the let-
ters’ outline for legibility in the two viewing orientations.
Empirically, we demonstrate that our approach outperforms
existing ambigram generation methods. On the 500 most
common words in English, our method achieves more than
an 11.6% increase in word accuracy and at least a 41.9%
reduction in edit distance.
1. Introduction
Through meticulously designed fonts, ambigrams are words
that can be viewed from different orientations. The most
common are “rotational ambigrams" which can be viewed
after a 180-degree rotation, e.g., the word “SWIMS" natu-
rally reads the same when viewed both right-side up and
upside down.
Designing ambigrams is challenging and time-consuming
as it requires the “designer to solve a visual puzzle” [27].
While there are tutorials on how to design ambigrams [27,
33], the instructions only contain general guidelines and
many tedious details need to be implemented by a designer.
Ultimately, making high-quality and effective ambigrams
depends on a designer’s understanding of calligraphy, sym-
metry patterns, and how to trade off the legibility of words
for different orientations.
Existing generators [1, 26] construct ambigrams using
a letter-to-letter approach. That is, each glyph in a word
needs to look like two letters from different orientations.
For rotational ambigrams, the font contains 26 × 26 = 676
glyphs which map between all pairs of letters in the alpha-
bet. Conventionally, these ambigram fonts are designed by
artists [1, 26]. More recently, AmbiDream [6] and AmbiFu-
sion [34] leverage deep neural networks to aid the generation
of ambigrams in the pixel space. However, they are limited
to only designing ambigrams at a letter level and did not
benchmark the performance at the word level.
In this work, we propose a method to generate ambi-
grams by leveraging recent developments in text-to-image
foundation models. We formulate the design process of an
ambigram as an optimization problem where we directly op-
timize the control points of the Bezier curves representing an
ambigram. At a high level, to maintain the generation’s legi-
bility, the objective function is based on DeepFloyd IF [2],
which employs a T5-XXL [9] text encoder to better capture
information from the input text prompt. We also incorporate
a style loss to control the font styles. In Fig. 1, we show the
results of rotational ambigrams designed by our method.
To validate our approach, we use Optical Character
Recognition (OCR) [18] to evaluate the legibility of the
generated ambigrams under the two viewing (rotated by 180
degrees) orientations. Furthermore, we provide qualitative
results and conduct a user study. Overall, we observe that
our proposed method convincingly outperforms, both quan-
1
arXiv:2312.02967v1  [cs.CV]  5 Dec 2023


---

## Page 2

Pairwise Alignment
Designing an Ambigram of “GAVE”↔“GAVE”
Stage 2. Word-Level Opt. (Sec. 4.2)
G
E
G A V
Output
(
,
,
(
,
“A blank paper with the 
text “GA” written on it”
“A blank paper with the 
text “AV” written on it”
“A blank paper with the 
text “VE” written on it”
minG LLetr(G, a, b) + LStyle(G)
minG LWord(G, a, b)
Prompts 𝒄
Optimization
Optimization
Stage 1. Letter-Level Opt. (Sec. 4.1)
Initialization of Glyphs 
Style 
Predictor 𝐴
“An image of the uppercase letter G”
“An image of the uppercase letter E”
⋮
Prompts
T5 XXL
E
E
T5 XXL
DeepFloyd IF 
𝑝!
DeepFloyd IF 
𝑝!
Figure 2. Illustration of the overall approach for designing an ambigram of “GAVE” ↔“GAVE”. Our approach first performs letter-level
optimization to design the individual glyphs (See Sec. 4.1). Next, we optimize the legibility between pairs of glyphs from the first stage
(See Sec. 4.2) leading to the final ambigram output. Note: the colors in the initialization are only for illustration purposes.
titative and qualitatively, the existing ambigram generation
baselines.
Our contributions are as follows:
• We propose an optimization framework, based on a pre-
trained diffusion model, for ambigram generation.
• To the best of our knowledge, we are the first to benchmark
word-level ambigrams and generate them via deep neural
networks.
• Our method achieves more than 11.2% absolute increase
in word accuracy on the generated ambigrams compared
to the existing ambigram generations, including ones de-
signed by artists.
2. Related work
Diffusion models and applications. Vision and language
diffusion models, e.g., Stable Diffusion [31], DALL-E 2 [29],
Imagen [32], have achieved impressive capabilities in lan-
guage conditioned image generation. With these advance-
ments, many applications have arisen by using a trained dif-
fusion model as a prior term, e.g., generation of 3D models
[28, 38], and vector art [15], image restoration [16, 24, 41],
shape reconstruction [20], etc. This work investigates how to
use a pre-trained diffusion model for generating ambigrams.
Font generation with AI. Many works have studied how to
generate fonts using generative AI, commonly formulated as
a probabilistic generative model in pixel space [3, 10, 11, 38]
or the space of vector fonts [4, 5, 7, 21–23, 30, 37, 40]. Be-
yond fonts synthesis, Wang et al. [39] studied how to gener-
ate text logos focusing on glyph placements. More closely
related to this work, WordAsImage by Iluz et al. [14] uses
score distillation of StableDiffusion on vector fonts to de-
sign semantic typography. While this work also distills a
pre-trained diffusion model, we focus on ambigram gen-
eration. For this, we introduce several novel components
tailored for ambigram generation, including how to initialize
the optimization, which pre-trained diffusion model to use,
and how to perform word-level optimization.
Ambigram generation with AI. Ambidream [6] proposed to
generate ambigrams by distilling a pre-trained letter classifier
to update the pixel values. Differently, we distill a large-
scale diffusion model to update the outline of each glyph.
Very recently, Ambifusion [34] proposed to train a diffusion
model for ambigram generation by preparing a dataset of
images containing individual alphabets manually cleaned
from the MyFonts dataset [8]. In contrast, our method does
not require the training of a text-specific diffusion model.
Finally, both Ambidream and Ambifusion are limited to
generating single-letter ambigrams and do not consider word-
level interaction in their method or evaluation.
3. Preliminaries
We review the necessary concepts to understand our ap-
proach and to establish the notation.
Glyph representation. Glyphs are commonly stored in vec-
tor form, e.g., via Bézier curves that capture the outline, as
the representation can be scaled to an arbitrary resolution
without losing details. In more detail, a glyph G = {gi}
is denoted as a set of control points gi ∈R2 of the Bézier
2


---

## Page 3

curves. Using DiffVG, a differentiable rasterizer R, by Li
et al. [19], the vector form glyph is rasterizer into an im-
age x = R(G) that allows for backpropagation through the
image, i.e.,
∂x
∂gi can be computed. This allows for the use
of gradient-based methods for updating the glyph’s control
points. The choice of the objective function dictates how the
glyph will turn out after optimization. We will next review
how to use a pre-trained diffusion model as the objective.
Diffusion models and score distillation. Text-to-image dif-
fusion models [31] aim to learn a conditional distribution
p(x|c) of the image x given the embedding c of a high-level
concept described in natural language. The high-level idea
behind a diffusion model is to learn to reverse the process
of corrupting the input data with additive Gaussian noise at
different levels of σ, i.e., learning a denoiser D(x; σ). Prior
works [13, 35] have shown that the denoiser can be inter-
preted as the score function, i.e., the gradient field of the data
log-likelihood
∇x log pσ(x|c) ≈(D(x; σ) −x)/σ2.
(1)
Seminal works, DreamFusion [28] and Score Jacobian
Chanining (SJC) [36] proposed to distill the score function
for the task of generating 3D assets. The high-level idea is to
apply “chain rule” to the score function and backpropagate
through a differentiable renderer to generate 3D assets. Given
an image x = R(θ) that is rendered from 3D parameters θ,
the gradient of the conditional distribution w.r.t. θ is
∂pσ(x|c)
∂θ
= ∂pσ(x|c)
∂x
score
∂x
∂θ .
(2)
In other words, a pre-trained diffusion model can be used
to update any image representation when provided with a
differentiable renderer. In practice, Wang et al. [36] found
that the rendered image x leads to an out-of-distribution
issue as the images are not noisy but the denoiser is trained
on noisy images. Hence, instead of Eq. (1), they propose to
use the Perturb-and-Average Scoring (PAAS):
PAAS(x, σ) = En∼N(0,I)(D(x + σn; σ) −x)/σ2.
(3)
We note that Eq. (3) is equivalent to score distillation [28],
albeit derived from a different mathematical perspective.
4. Approach
Our goal is to design ambigrams, i.e., a composition of
glyphs that can be read from different orientations. While we
describe our approach using rotational ambigrams, we note
that the framework is easily generalizable to other types of
ambigrams. The overview of the approach is shown in Fig. 2.
Problem formulation. We aim to construct an ambigram
that reads to be the word a in the up-right orientation
and read b with rotated by 180 degrees. We denote rota-
tion using the transformation T. We assume the two words
a = (a1, . . . , aN) and b = (b1, . . . , bN) have equal length
N with an, bn denoting letters in the English alphabet.
We formulate the design process of ambigrams as an
optimization problem:
G⋆= arg min
G
LAmbi(G, a, b) + LStyle(G),
(4)
where G⋆=
 G(1), . . . , G(N)
denotes a sequence of control
point sets G(n) representing the nth glyph of the designed
ambigram.
The objective consists of two terms: LAmbi encourages
the composition of glyphs form an ambigram and LStyle
encourages the glyphs to have the style of a given font. We
now describe each of the objectives in more detail.
Ambigram loss. The ambigram loss is further decomposed
into letter-level loss and word-level loss, i.e.,
LAmbi(G, a, b) = LLetr(G, a, b) + LWord(G, a, b).
(5)
The letter-level loss LLetr encourages that each letter in the
ambigram can be viewed from a different orientation.
LLetr(G, a, b) = −
N
X
n=1
"
λLetr log

pσ(x(n)|c(an))

+(1 −λLetr) log

pσ(T(x(n))|c(bN−n+1))
 #
,
(6)
where pσ(x|c) denotes the conditional probability from a
pre-trained diffusion model, x(n) = R(G(n)) denotes the
rasterized image using DiffVG [19], T denotes the rotation
transformation, c(an) corresponds to the embedding con-
structed using a text-prompt given the input letter an, and
λLetr ∈[0, 1] denotes the weight balancing between the
two orientations. Intuitively, the first term encourages the
nth glyph to look like the letter an, and the second term
encourages it to look like the letter bn when rotated.
Next, the word-level loss Lword aims for the entire word
to form an ambigram. To model dependencies between let-
ters, the word-level loss is a total loss among all pairs of
consecutive letters, i.e., LWord(G, a, b) =
−
N−1
X
n=1
"
log

pσ(x(n:n+1)|c(an, an+1))

+ log

pσ(T(x(n:n+1))|c(bN−n, bN−n+1))
 #
,
(7)
where x(n:n+1) = [R(G(n)), R(G(n+1))] denotes the con-
catenation of the rasterized image for glyphs G(n) and
G(n+1), c(an, an+1) corresponds to the embedding con-
structed using a text prompt given the two letters an and
3


---

## Page 4

‘B’ ↔‘D’
‘C’ ↔‘E’
Initial
Optimized
Initial
Optimized
Naive
Max Overlap
Contact (L)
Contact (R)
Figure 3. Illustration of the proposed alignment strategies. We
show the effect of each proposed initialize scheme before and
after optimization. Observe that, depending on the initialization the
design varies.
an+1. This loss encourages pairs of glyphs to form an ambi-
gram.
Style loss. We propose to include additional losses to encour-
age different font styles. We propose the style loss LStyle(G)
to control the style aspect of the glyphs that do not depend
on the word letters. Specifically, the style loss consists of the
font loss and a self-consistency loss:
LStyle(G) = (λFontLFont(G) + λConstLConst(G)) .
(8)
The font loss LFont(G) encourages the generated glyph
to be closer. We use a trained font attribute predictor A
by Wang et al. [38] and minimize the ℓ2 difference between
the predicted attribute for all glyphs G(n) and the attribute
vectors v of a chosen font. Formally,
Lfont(G) =
N
X
n=1
Ev
v −A(R(G(n)))

2
2 ,
(9)
where v is uniformly sampled from the set of attribute vec-
tors of a desirable font extracted using the same attribute
predictor A.
Next, for ambigrams where a and b are the same words,
we further impose a self-consistent loss LConst encourages
self-similarity after the transformation, i.e.,
X
n
Blur(x(N−n)) −Blur(T(x(n))))

2
2 ,
(10)
where x(n) = R(G(n)). We perform Blurring with a 3 × 3
Gaussian filter to ensure the overall shape matches.
Gradient-based optimization. To solve the minimization
program in Eq. (5), we use the Adam [17] optimizer to
update the Berizer curves’ control points. For computing
the gradient through the diffusion model, we use PAAS as
‘A‘ ↔‘g‘
‘C‘ ↔‘W‘
‘S‘ ↔‘Z‘
‘B‘ ↔‘B‘
Before
After
Figure 4. Illustration of before and after post-processing of median
filter and image sharpening. Observe the reduction in floaters and
smoother contours.
reviewed in Eq. (3). In practice, we perform stage-wise op-
timization. We first optimize for individual letters, then we
jointly tune all letters together using the word loss. We now
discuss additional algorithmic details when performing the
letter-level and word-level optimization, including initializa-
tion, hyperparameters, and post-processing procedures.
4.1. Letter-level optimization
Glyph initialization and alignment. To solve the optimiza-
tion in Eq. (4), we need to initialize the control points for the
glyphs G = (G(1), . . . G(N)). We propose to initialize the
control points by overlaying existing fonts. Given the words
a = (a1, . . . , aN) and b = (b1, . . . , bN), the glyph G(n)
will be initialized with the control points from a pre-defined
font of an and bN−n+1 but rotated.
One of the key challenges is how to align the two existing
fonts. Different alignment generates very different designs
after optimization. We propose to align the letters using
horizontal and vertical shifts based on four different schemes
• Naive: Directly overlap the two letters.
• Max Overlap: We align the two letters to have the maxi-
mum number of overlapping pixels.
• Contact (Left): We find the leftmost shift such that the two
letters are still in contact, and then we multiply this shift
amount by 0.7 to ensure the letters overlap.
• Contact (Right): The same as left contact, but for the right-
most shift.
The effects of these alignment schemes, before and after
optimization, are visualized in Fig. 3. We observe that differ-
ent alignment strategies lead to different designs that would
otherwise be difficult to generate with another initialization
scheme. The choice of the alignment scheme is treated as a
hyperparameter.
Optimization details. To compute the gradient through the
diffusion model, we need to provide the embedding c(an)
and c(bN−n+1). We use the text prompt of “An image
of the letter {} in lower/upper case.”
where {} is replaced with the letter of an and bN−n+1.
Next, we perform random perspective as data augmenta-
tion on the rasterized image. The augmented images form a
4


---

## Page 5

Method
“THE”
“AREA”
“AMONG”
“BEAUTY”
Ambigramania
Ambimaticv2
DsmonoHD
Ambidream
Ambifusion
Ours (Font 1)
Ours (Font 2)
Figure 5. Qualitative comparison across baselines. Methods above the horizontal line are designed by artists. The generations of Ambigra-
mania are from ambigramania.com, Ambimaticv2, DsmonoHD, and Ambidream are from makeambigrams.com. Ambifusion’s
samples are generated using the official code from github.com/univ-esuty/ambifusion.
batch size of five for which we perform one gradient update
step. In total, we perform 500 gradient steps using the Adam
optimizer [17] with an exponentially decayed learning rate.
We also decay the style weight λStyle exponentially.
Automatic design selection and post-processing. The pro-
posed optimization involves several hyperparameters, e.g.,
the initialize scheme and the λs to weigh the losses. Instead
of manually inspecting all the generated designs, we rank
the promising designs by sorting based on the cross-entropy
loss of a trained character classifier; see appendix for de-
tails. The classifier judges whether the design can be viewed
correctly as the given letter, and thus can quickly filter out
unpromising designs. To form an ambigram font, we select
26 × 26 design one for each pair of letters in the alphabet.
Next, while the optimization procedure generates a
promising design with correct shapes, the edges may be
jagged and contain thin artifacts. To have a more robust selec-
tion, we use image processing techniques as post-processing
to eliminate floaters in the generated glyph. This includes
a sequence of median filters and image sharpening on the
rasterized image. See Fig. 4 where we visualize the before
and after post-processing. Overall, the post-processed results
exhibit a smoother and aesthetically more pleasing glyph.
We will next describe how we can further improve the design
by considering word-level semantics.
4.2. Word-level optimization
With the N individual glyphs designed, we perform joint
optimization over pairs of letters as formulated in Eq. (5). To
do so, we would need to align the designed glyphs.
Word initialization and alignment. Given the designed
sequence of glyphs from Sec. 4.1, we would need to scale
and align them to form an ambigram. To align the individ-
ual letters into a word, we created a template consisting of
N equally spaced rectangles. Next, we center each of the
glyphs inside the rectangle. We then linearly scale the glyph
until its height or width matches the rectangle while main-
taining the aspect ratio. This sequence of glyphs is used as
the initialization to perform word-level optimization, which
we describe next.
Optimization details. To compute the gradient through
the
diffusion
model,
we
need
to
specify
the
em-
bedding c(a) and c(b). For this, we use the text
prompt of “A blank paper with the text “{}”
written on it.” where {} is replaced with a pair of
letters, e.g., an, an+1. As in the letter-level stage, we per-
form random perspective with a distortion scale of 0.2 on the
paired letter and optimize the Adam optimizer for 110 steps.
Additionally, we introduce a regularization that prevents the
glyphs from deviating too much from the designs from the
letter-level optimization; see appendix for details.
5. Experiments
We conduct both quantitative and qualitative studies compar-
ing existing methods for generating ambigrams. We report
quantitative metrics for evaluating the legibility of the ambi-
grams in both orientations and show ample qualitative results.
Finally, we conduct detailed ablation studies to analyze the
design choices in our method, demonstrating the necessity
of each component.
Baselines. For baselines, we consider five ambigram fonts,
including DsmonoHD, Ambimaticv2, Ambigramania, Am-
bidream, and Ambifusion. The first three fonts were man-
5


---

## Page 6

Method
“AND”
“BASE”
“DRIVE”
“CORRECT”
Ambigramania
Ambimaticv2
DsmonoHD
Ambidream
Ambifusion
Ours (Font 1)
Ours (Font 2)
Figure 6. Additional qualitative comparison across baselines. Methods above the horizontal line are designed by artists. We observe that
generations from Ours and DsmonoHD are the most legible while Ambidream’s generation is the most difficult to read.
Method
Accuracy↑
Edit Distance↓
Ambigramania [1]
6.2%
8.112
Ambimaticv2 [26]
7.2%
7.670
DsmonoHD [26]
9.2%
7.042
Ambidream [6]
6.8%
7.212
Ambifusion [34]
3.6%
8.726
Ours (Font 1)
24.2%
3.634
Ours (Font 2)
20.8%
4.088
Table 1. Quantitative results. Methods above the horizontal line are
designed by artists. Both of our fonts outperform baseline methods
in accuracy and edit distance metrics.
ually designed by artists obtained from online generation
sites [1, 26]. Next, Ambidream [26] and Ambifusion [34]
were generated using AI techniques as reviewed in Sec. 2.
For Ambifusion, we use the code released by Shirakawa
and Uchida [34]. We note that Ambifusion only generates
rotational ambigram of a single letter directly in the pixel
space. To generate an ambigram with multiple letters, we hor-
izontally concatenated the individual letter images generated
from their method.
Experiment setup. For evaluation, we consider generating
rotational ambigrams with a = b, i.e., the ambigram should
read the same under a 180-degree rotation. We chose this
setting as it is supported by all the aforementioned baselines.
To construct a benchmark, we use the 500 most common
words in English that are longer than two characters [25]. As
our method can generate multiple designs, we generated two
sets of ambigram fonts for evaluation.
5.1. Quantitative comparisons
Evaluation metrics. To evaluate the legibility of the gener-
ated words, we use TrOCR[18] a transformer-based Optical
Character Recognition (OCR) model to see if it can cor-
rectly recognize the generated ambigrams. We report two
evaluation metrics:
• Accuracy↑: An ambigram is considered “correct”, if
TrOCR recognizes all letters in the word correctly for
both viewing orientations.
• Edit Distance↓: We consider the Levenshtein edit distance
between the ground truth and the predicted word from
TrOCR summed over both orientations averaged over the
dataset. Levenshtein distance counts the number of inser-
tions, substitutions, and deletions to make the two strings
identical.
To our knowledge, we are the first to benchmark am-
bigrams at the word-level. Prior work [34] only considers
single letter accuracy by training a ResNet [12] classifier on
the MyFonts dataset [8]. We believe using TrOCR [18] and
evaluating ambigrams at the word-level is more appropriate
as it considers the relationship between the letters. We chose
TrOCR as it has open-sourced the code and released the
model weights.
Results. We report the quantitative results in Tab. 1. We
observe that both of the fonts for our approach achieved
better results with the highest accuracy of 24.2% and the
lowest edit distance of 3.634 out of all the methods. The best
baseline, DsmonoHD (a font designed by an artist), achieved
an accuracy of 9.2% and an edit distance of 7.0. The other
two AI-based methods achieved 6.8% and 3.6% in accuracy
which is comparable to the artist-designed ambigrams.
5.2. Qualitative comparisons
In Fig. 5 and 6, we provide ambigram designs drawn by
artists and generated by AI-based methods. We observe that
6


---

## Page 7

Ours over…
Figure 7. User study results, where we ask the participant to select
between generations from our method vs. baselines’. A higher
selection rate indicates that our method is more favorable.
generations from our approach are readable and aestheti-
cally pleasing, comparable to the artist-designed fonts. For
symmetric letters, e.g., the ‘H’ in “the” of Fig. 5 our ap-
proach maintains the symmetry as done by the artist, while
Ambidream and Ambifusion do not.
Next, we observe that our approach generates designs
that are similar in spirit to the ones designed by artists, e.g.,
the ‘B’ ↔‘E’ of the “Base” ambigram in Fig. 5, which
leaves the left side of the “B” open such that it can be viewed
as an ‘E’ when rotated. Our method also has the flexibility
of automatically choosing between upper/lower cases, e.g.,
the middle two ‘R’s in "Correct" of Fig. 6 which made the
overall ambigram more legible.
Finally, we observe that Ambidream generates ambigrams
that are difficult to read, yet, it achieves a competitive accu-
racy in Tab. 1. We suspect that because Ambidream is dis-
tilling from a letter classifier, which biases it towards higher
accuracy but does not correlate with human perception. This
motivates us to conduct a user study to compare the quality
of the generations instead relying solely on TrOCR.
User study results. To quantify the qualitative comparison,
we conducted a user study by asking the participants to select
between pairs of generations that they find more aestheti-
cally pleasing and legible to the reference word. Specifically,
we show them the referenced word, a generation from our
method (Font 1), and a generation from one of the baselines.
All the choices and order of the words are shuffled for each
user. For each ambigram font, we show 20 comparisons. In
total, 30 people participated in the survey and the result is
summarized in Fig. 7. We observe that our approach is more
favorable when compared to the baselines, with Dsmono
being the most competitive against ours and Ambidream
being the least. Overall, the ranking of the baselines is con-
sistent with the quantitative results from TrOCR, except for
Ambidream which distills from a letter classifier.
Diversity of our approach. Our approach is capable of
generating diverse designs. The different design arises from
‘A’ ↔‘G’
‘A’ ↔‘Q’
‘B’ ↔‘Q’
Figure 8. Illustration of diverse generations. Our method generates
diverse fonts for a given pair of inputs. Notice that the fonts contain
a mix of lower or upper case letters that is determined automatically
depending on the legibility.
‘a’ ↔‘a’
‘e’ ↔‘q’
‘s’ ↔‘e’
Figure 9. Directly optimizing pixel intensities. As pixel space has
more degree of freedom, we observe that extra letters are placed
at the corners of the image. Additionally, the background is noisy,
and thus the generations are not readily usable as fonts.
changing the initial font, the reference font style that guides
the generation process, the alignment strategy, and the ran-
domness from the diffusion model. In Fig. 8, we show exam-
ples illustrating the multiple designs for ambigrams between
single letters. We observe variations across the style of the
generated font, as well as, the choice of using lower or upper
case letters.
5.3. Ablation studies
We conducted several ablation studies validating the impor-
tance of the choices made in our proposed method.
Ablating vector representation. To ablate the choice of
using a vector representation, we instead directly optimize
the pixel intensities using our method. In Fig. 9, we show
the generated results. We observe that the generation leads
to multiple duplicated letters that are not centered and have
noisy backgrounds. We believe that using a vector represen-
tation reduces the space of what can be generated, which in
turn improves the quality.
Ablating word-level optimization. Our method performs
letter-level optimization (LLetr in Eq. (6)), followed by an
word-level optimization (LWord in Eq. (7)). In Fig. 10, we
show the result after letter-level optimization, after post-
processing, and the final result. As can be seen, the results in
row (c) have the highest quality, validating the effectiveness
of the word-level optimization.
Ablating style loss LStyle. In Fig. 11, we provide genera-
tions with different reference fonts using the style loss. As
can be observed, different input reference fonts lead to dif-
7


---

## Page 8

“LETTER” ↔“LETTER”
“ROOM” ↔“ROOM”
(a)
(b)
(c)
Figure 10. Illustration of generations at different stages of the
method. (a) Only letter-level optimization (b) after post-processing,
(c) after word-level optimization. The quality of the ambigrams
improves after each step.
None
Typewriter Quarterly
Genzsch
‘a’ ↔‘E’
‘C’ ↔‘E’
Figure 11. Ablation of style loss with different reference font.
λ 1.0 0.9 0.8 0.7 0.6 0.5 0.4 0.3 0.2 0.1 0.0
Figure 12. Sweep across λLetter in Eq. (6) which balances the
legibility of each letter in the upright and rotated orientation.
ferent styles across the same ambigram.
Importance of selecting loss weights λLetr. The loss LLetr
in Eq. (6) based DeepFloyd IF has an imbalance between the
letters, i.e., it favors certain letters over others. This causes
difficulties when choosing λLetr. In Fig. 12, we show the
generation at different LLetr. Consider the first row between
‘A’ ↔‘e’, the two viewing orientations are both legible at
λLetr = 0.2. On the other hand, the sweet spot for ‘H’ ↔
‘Y’ is with λLetr = 0.6. This emphasizes the need to auto-
matically select λLetr as proposed in our method.
Choice of pre-trained diffusion model. We have also ex-
perimented with using other pre-trained diffusion models
other than Deep Floyd IF. We provide results from StableD-
iffusion [31] v1-5 and v2-1 in Fig. 13. Overall, we found
that StableDiffusion models struggle to understand/generate
ambigrams. This is consistent with the observation that Sta-
bleDiffusion has difficulties generating text when prompted.
On the other hand, DeepFloyde IF uses a different text en-
coder which is found to improve text understanding [2].
Ver.
‘a’ ↔‘a’
‘a’ ↔‘b’
‘a’ ↔‘c’
‘a’ ↔‘d’
v1-5
v2-1
Figure 13. Results when distilling with StableDiffusion. Observe
that both v1-5 and v2-1 version of StableDiffusion is unable to
produce a coherent letter.
“Stir” ↔“Sup”
“Fight” ↔“Easy”
Figure 14. Proof of concept for unequal length ambigrams, i.e., the
number of letters in one orientation differs from the other. This
setting is not possible from existing methods due to the one-to-one
mapping assumption during their design process.
5.4. Proof of concept for unequal length ambigrams
Thus far in the paper, we have shown ambigrams a ↔b
where the words a and b have the same length. This is
because existing methods use a letter-to-letter design process
and therefore are unable to support unequal lengths. We
now showcase that our method can generalize to designing
ambigrams of unequal lengths by encouraging, via LLetr
in Eq. (6), a glyph to be read as one letter and two letters
in the other orientation through modifying the text prompt.
In Fig. 14, we show examples of ambigrams “Stir” ↔“Sup”,
and “Fight” ↔“Easy”. We note that these results are a
proof of concept. The optimization currently involves manual
tuning on the alignment and balancing of the loss terms for
each ambigram. We aim to tackle this very challenging task
of unequal length generation in future work.
6. Conclusion
In this paper, we propose a novel method for ambigram gen-
eration by distilling DeepFloyd IF, a pre-trained diffusion
model. Unlike existing methods that only consider designs
at the letter level, our approach considers the quality of the
ambigram at both the letter and word levels. To our knowl-
edge, we are also the first to consider word-level evaluation
of ambigrams. Experimental results show our method’s supe-
rior performance, achieving more than an 11.2% increase in
accuracy and at least a 41.9% reduction in edit distance over
the baselines. These quantitative results are also supported
by a user study.
8


---

## Page 9

References
[1] Ambigramania. Online ambigram generator - create tattoo
ambigram free. www.ambigramania.com/. Accessed:
2023. 1, 6
[2] DeepFloyd Lab at StabilityAI. DeepFloyd IF. https://
www.deepfloyd.ai/deepfloyd-if, 2023. 1, 8
[3] Samaneh Azadi, Matthew Fisher, Vladimir G Kim, Zhaowen
Wang, Eli Shechtman, and Trevor Darrell. Multi-content gan
for few-shot font style transfer. In Proc. CVPR, 2018. 2
[4] Defu Cao, Zhaowen Wang, Jose Echevarria, and Yan Liu.
Svgformer: Representation learning for continuous vector
graphics using transformers. In Proc. CVPR, 2023. 2
[5] Alexandre Carlier, Martin Danelljan, Alexandre Alahi, and
Radu Timofte. Deepsvg: A hierarchical generative network
for vector graphics animation. In Proc. NeurIPS, 2020. 2
[6] Kartik Chandra.
Words that do handstands — dreaming
ambigrams by gradient descent. hardmath123.github.
io/ambigrams.html. Accessed: 2023. 1, 2, 6
[7] Chia-Hao Chen, Ying-Tian Liu, Zhifei Zhang, Yuan-Chen
Guo, and Song-Hai Zhang. Joint implicit neural represen-
tation for high-fidelity and compact vector fonts. In Proc.
ICCV, 2023. 2
[8] Tianlang Chen, Zhaowen Wang, Ning Xu, Hailin Jin, and
Jiebo Luo. Large-scale tag-based font retrieval with genera-
tive feature learning. In Proc. ICCV, 2019. 2, 6
[9] Hyung Won Chung, Le Hou, Shayne Longpre, Barret Zoph,
Yi Tay, William Fedus, Yunxuan Li, Xuezhi Wang, Mostafa
Dehghani, Siddhartha Brahma, et al. Scaling instruction-
finetuned language models. arXiv preprint arXiv:2210.11416,
2022. 1
[10] Yue Gao, Yuan Guo, Zhouhui Lian, Yingmin Tang, and Jian-
guo Xiao. Artistic glyph image synthesis via one-stage few-
shot learning. ACM TOG, 2019. 2
[11] Hideaki Hayashi, Kohtaro Abe, and Seiichi Uchida. Glyph-
gan: Style-consistent font generation based on generative
adversarial networks. Knowledge-Based Systems, 2019. 2
[12] Kaiming He, Xiangyu Zhang, Shaoqing Ren, and Jian Sun.
Deep residual learning for image recognition. In Proc. CVPR,
2016. 6
[13] Aapo Hyvärinen. Estimation of non-normalized statistical
models by score matching. J. Mach. Learn. Res, 2005. 3
[14] Shir Iluz, Yael Vinker, Amir Hertz, Daniel Berio, Daniel
Cohen-Or, and Ariel Shamir. Word-as-image for semantic
typography. ACM TOG, 2023. 2
[15] Ajay Jain, Amber Xie, and Pieter Abbeel. Vectorfusion: Text-
to-svg by abstracting pixel-based diffusion models. In Proc.
CVPR, 2023. 2
[16] Bahjat Kawar, Michael Elad, Stefano Ermon, and Jiaming
Song.
Denoising diffusion restoration models.
In Proc.
NeurIPS, 2022. 2
[17] Diederik P Kingma and Jimmy Ba. Adam: A method for
stochastic optimization. In Proc. ICLR, 2015. 4, 5
[18] Minghao Li, Tengchao Lv, Jingye Chen, Lei Cui, Yijuan
Lu, Dinei Florencio, Cha Zhang, Zhoujun Li, and Furu Wei.
Trocr: Transformer-based optical character recognition with
pre-trained models, 2022. 1, 6
[19] Tzu-Mao Li, Michal Lukáˇc, Michaël Gharbi, and Jonathan
Ragan-Kelley. Differentiable vector graphics rasterization for
editing and learning. ACM TOG, 2020. 3
[20] Ruoshi Liu, Rundi Wu, Basile Van Hoorick, Pavel Tokmakov,
Sergey Zakharov, and Carl Vondrick. Zero-1-to-3: Zero-shot
one image to 3d object. In Proc. CVPR, 2023. 2
[21] Ying-Tian Liu, Yuan-Chen Guo, Yi-Xiao Li, Chen Wang, and
Song-Hai Zhang. Learning implicit glyph shape representa-
tion. IEEE TVCG, 2022. 2
[22] Ying-Tian Liu, Zhifei Zhang, Yuan-Chen Guo, Matthew
Fisher, Zhaowen Wang, and Song-Hai Zhang. Dualvector: Un-
supervised vector font synthesis with dual-part representation.
In Proc. CVPR, 2023.
[23] Raphael Gontijo Lopes, David Ha, Douglas Eck, and Jonathon
Shlens. A learned representation for scalable vector graphics.
In Proc. ICCV, 2019. 2
[24] Andreas Lugmayr, Martin Danelljan, Andres Romero, Fisher
Yu, Radu Timofte, and Luc Van Gool. Repaint: Inpainting us-
ing denoising diffusion probabilistic models. In Proc. CVPR,
2022. 2
[25] David Norman.
1,000 most common us english words.
https://gist.github.com/deekayen/4148741.
Accessed: 2023. 6
[26] Admins of Makeambigrams. Free online ambigram genera-
tor. makeambigrams.com/ambigram-generator/.
Accessed: 2023. 1, 6
[27] Arnold Pander and Robin Casey. Create ambigrams for ty-
pography logo art. www.adobe.com/creativecloud/
design/discover/ambigram.html. Accessed: 2023.
1
[28] Ben Poole, Ajay Jain, Jonathan T. Barron, and Ben Mildenhall.
Dreamfusion: Text-to-3d using 2d diffusion. In Proc. ICLR,
2023. 2, 3
[29] Aditya Ramesh, Prafulla Dhariwal, Alex Nichol, Casey Chu,
and Mark Chen. Hierarchical text-conditional image genera-
tion with clip latents. arXiv preprint arXiv:2204.06125, 2022.
2
[30] Pradyumna Reddy, Zhifei Zhang, Zhaowen Wang, Matthew
Fisher, Hailin Jin, and Niloy Mitra. A multi-implicit neural
representation for fonts. In Proc. NeurIPS, 2021. 2
[31] Robin Rombach, Andreas Blattmann, Dominik Lorenz,
Patrick Esser, and Björn Ommer.
High-resolution image
synthesis with latent diffusion models. In Proc. CVPR, 2022.
2, 3, 8
[32] Chitwan Saharia, William Chan, Saurabh Saxena, Lala Li,
Jay Whang, Emily L Denton, Kamyar Ghasemipour, Raphael
Gontijo Lopes, Burcu Karagol Ayan, Tim Salimans, et al. Pho-
torealistic text-to-image diffusion models with deep language
understanding. In Proc. NeurIPS, 2022. 2
[33] Roland Scheil.
Tutorial: Designing an ambigram in 5
steps.
www.onlineprinters.co.uk/magazine/
tutorial- ambigram- design- 5- steps/.
Ac-
cessed: 2023. 1
[34] Takahiro Shirakawa and Seiichi Uchida. Ambigram gener-
ation by a diffusion model. In Proc. ICDAR, 2023. 1, 2,
6
9


---

## Page 10

[35] Yang Song and Stefano Ermon. Generative modeling by
estimating gradients of the data distribution. In Proc. NeurIPS,
2019. 3
[36] Haochen Wang, Xiaodan Du, Jiahao Li, Raymond A Yeh,
and Greg Shakhnarovich. Score jacobian chaining: Lifting
pretrained 2d diffusion models for 3d generation. In Proc.
CVPR, 2023. 3
[37] Yizhi Wang and Zhouhui Lian. Deepvecfont: Synthesizing
high-quality vector fonts via dual-modality learning. ACM
TOG, 2021. 2
[38] Yizhi Wang, Yue Gao, and Zhouhui Lian. Attribute2font:
Creating fonts you want from attributes. ACM TOG, 2020. 2,
4
[39] Yizhi Wang, Guo Pu, Wenhan Luo, Yexin Wang, Pengfei
Xiong, Hongwen Kang, and Zhouhui Lian. Aesthetic text
logo synthesis via content-aware layout inferring. In Proc.
CVPR, 2022. 2
[40] Yuqing Wang, Yizhi Wang, Longhui Yu, Yuesheng Zhu, and
Zhouhui Lian. Deepvecfont-v2: Exploiting transformers to
synthesize vector fonts with higher quality. In Proc. CVPR,
2023. 2
[41] Shaoan Xie, Zhifei Zhang, Zhe Lin, Tobias Hinz, and Kun
Zhang. Smartbrush: Text and shape guided object inpainting
with diffusion model. In Proc. CVPR, 2023. 2
10


---

