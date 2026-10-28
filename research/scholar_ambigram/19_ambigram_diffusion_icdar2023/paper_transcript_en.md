## Page 1

Ambigram Generation by A Diffusion Model
Takahiro Shirakawa1 and Seiichi Uchida1[0000−0001−8592−7566]
Kyushu University, Fukuoka, Japan
uchida@ait.kyushu-u.ac.jp
Abstract. Ambigrams are graphical letter designs that can be read not
only from the original direction but also from a rotated direction (espe-
cially with 180 degrees). Designing ambigrams is difficult even for human
experts because keeping their dual readability from both directions is of-
ten difficult. This paper proposes an ambigram generation model. As its
generation module, we use a diffusion model, which has recently been
used to generate high-quality photographic images. By specifying a pair
of letter classes, such as ‘A’ and ‘B,’ the proposed model generates various
ambigram images which can be read as ‘A’ from the original direction
and ‘B’ from a direction rotated 180 degrees. Quantitative and quali-
tative analyses of experimental results show that the proposed model
can generate high-quality and diverse ambigrams. In addition, we define
ambigramability, an objective measure of how easy it is to generate am-
bigrams for each letter pair. For example, the pair of ‘A’ and ‘V’ shows
a high ambigramability (that is, it is easy to generate their ambigrams),
and the pair of ‘D’ and ‘K’ shows a lower ambigramability. The am-
bigramability gives various hints of the ambigram generation not only
for computers but also for human experts. The code can be found at
https://github.com/univ-esuty/ambifusion.
Keywords: Ambigram generation · Diffusion model · Ambigramability
1
Introduction
Ambigrams are graphical letter designs that can be read not only from the orig-
inal direction but also from a rotated direction (especially with 180 degrees).
Fig. 1 shows several examples of ambigram letters designed by human experts.
The leftmost example in Fig 1 is an ambigram for ‘A’ and ‘Y.’ Hereafter, we
denote such an ambigram as A↕Y. The middle and rightmost samples are B↕E
and C↕D, respectively.
Designing ambigrams is difficult even for human experts due to the following
two reasons. First, we must deform letter shapes to realize the dual readability
from two directions. Moreover, the deformations for ambigrams are very different
from those for general font styles. This means there is no standard way to design
ambigrams. Second, creating their ambigrams is inherently difficult for many
letter class pairs. For example, it will be almost impossible to design an ambigram
D↕K, although it is easy for A↕V.
Designing ambigrams is also difficult for computers. One might think that
generative adversarial networks (GANs) can generate new ambigrams by using
arXiv:2306.12049v1  [cs.CV]  21 Jun 2023


---

## Page 2

2
T. Shirakawa et al.
rotate 180°
rotate 180°
rotate 180°
rotate 180°
rotate 180°
rotate 180°
Fig. 1. Examples of ambigram letters designed by human experts. According to our
notation, they are A↕Y, B↕E, and C↕D, respectively. These ambigrams are provided by
the website MakeAmbigrams (https://makeambigrams.com/).
classes 
&
time step
proposed reverse process
by diffusion model
180 rotation
reverse process
by diffusion model
(a)
(b)
class &
time step
180 rotation
Fig. 2. Overview of (a) the standard diffusion model for image generation and (b) the
proposed model for ambigram generation.
ambigrams by human experts as “real” image samples. However, there is no large
“real” ambigram dataset with sufficient style variations. Therefore, conventional
font generation methodologies by GANs[1,5,27] cannot be used for ambigrams.
Furthermore, computers will suffer from the above two difficulties, like human
experts.
This paper proposes a diffusion model for this challenging task of generating
ambigrams. Fig. 2 shows an overview of (a) the standard diffusion model for
image generation and (b) the proposed model for ambigram generation. The
standard diffusion model generates a letter image x0 of the class c by an iterative
process called reverse process. In contrast, the proposed model generates a letter
image x0 for class c and its 180◦-rotated version x′
0 for class c′. For example,
suppose two classes c =‘A’ and c′ =‘Y’ are specified as conditions for the original
and rotated directions, respectively. Then, the diffusion model is expected to
produce an image x0 of ‘A’ such that the 180◦-rotated image x′
0 is ‘Y.’
An important property of the proposed model is that it does not need to
have any real ambigram samples made by human experts. Instead, it needs
just standard letter images of all classes. After learning from those images what
shapes are readable as each letter class, the proposed model generates ambigrams
with dual readability for c and c′. This property effectively generates a variety of
unique and unexpected ambigrams, even in the current situation where reference
ambigrams by human experts are not readily available enough.
In the experiments, we first observe that the proposed model can generate
high-quality and various ambigrams. In addition to this qualitative observation,
we conduct a quantitative evaluation by using the recognition accuracy of a


---

## Page 3

Ambigram Generation by A Diffusion Model
3
(a)
(b)
conditional
U-Net 
class 
time step
estimation
rule
diffusion
rule
conditional
U-Net 
class 
time step
L2 loss
reverse process
Fig. 3. Diffusion Denoising Probabilistic Model (DDPM). (a) The reverse process to
estimate xt−1 from xt. (b) The training process of the conditional U-Net.
letter classifier. If we achieve high accuracy, the generated ambigrams will have
sufficient readability. The ambigrams obtained from the proposed model are then
compared with those obtained from human experts and a GAN-based generator.
The above letter classification results reveal ambigramability, which is newly
introduced in this paper for evaluating how easy to generate ambigrams for each
class pair. As noted above, generating ambigrams of A↕V will be easy, whereas
D↕K is difficult. Therefore, the former has a higher ambigramability and the latter
has a lower ambigramability. It is useful to know the ambigramability when we
design a word or a phrase by ambigrams. When we find a word ambigram that
needs a letter pair with low ambigramability, it will be better to think of another
word or phrase (or use the capital letter instead of the lower case or vice versa).
The ambigramability can be automatically evaluated by recognizing generated
ambigrams by a letter classifier.
The main contributions of this paper are summarized as follows.
– To the authors’ best knowledge, it is the first attempt to generate ambigrams
automatically.
– We propose a new diffusion model for generating ambigrams in various styles
without any real ambigram examples.
– We also propose “ambigramability” to measure the easiness of ambigram
generation of each class pair objectively and automatically.
– Comparative studies reveal that ambigrams by the proposed model have
more diversity while keeping their readability.
2
Related Work
2.1
Diffusion Denoising Probabilistic Model (DDPM)
Diffusion Denoising Probabilistic Model (DDPM) [7] is one of the most popular
diffusion models [29]. DDPM assumes that a noise image xT is derived by adding


---

## Page 4

4
T. Shirakawa et al.
a small amount of Gaussian noise to the original (clean) image x0 T times.
(This iterative noise addition process is called diffusion process.) The highlight
of DDPM is its reverse process to recover x0 from xT by iterating noise removal
T times. Fig. 3 (a) shows the reverse process. A conditional U-Net (with the
weight parameter set denoted by θ) estimates the noise ϵθ(xt | t, c) of xt under
the condition that xt is an image from class c after t times of noise addition.
Then, xt−1 is estimated from xt and ϵθ(xt | t, c) by an estimation rule1. By
iterating this reverse process from t = T to 1, we have x0 as a generated image.
Note that the generated image x0 varies even from the same xT because of the
stochastic behavior of the estimation rule.
Training DDPM is equivalent to training the conditional U-Net θ. As shown
in Fig. 3 (b), the U-Net is trained to output ϵθ(xt | t, c) ∼ϵ, where ϵ ∼N(0, I)
is the noise to prepare xt from x0 according to the diffusion rule defined in [7].
The conditions t and c are fed to the U-Net using an embedding technique like
position embedding [26].
2.2
Letter Image Generation
For generating letter images (or font images), various image generation mod-
els, especially GANs[19,9,2,11,14], have been used. The GAN-based models can
also generate letter images with conditions, such as class labels[16,5,12,10] or
texts[28,18]. Recently, diffusion models have achieved high-quality photographic
image generation [20,21,23]. All the above methods cannot be used for the am-
bigram generation directly; this is simply because i) they need real ambigrams
as their training samples and ii) they have no mechanism to realize the dual
readability as ambigrams. Consequently, to the authors’ best knowledge, there
has been no past attempt to generate ambigrams by computers. Note again that
our model does not need any reference ambigram examples.
3
Ambigram Generation by A Diffusion Model
3.1
Outline
Fig. 4 shows the proposed reverse process to generate ambigrams. Inputs to
the process are a noisy image xt and its 180◦-rotated version x′
t. If we aim to
generate ambigrams of c↕c′, two class labels c and c′ are given as conditions.
Then, the reverse process will generate xt−1 with less noise than xt. We expect
1 Precisely speaking, the following equation [7] is used as the estimation rule in
Fig. 3 (a):
xt−1 =
1
√αt

xt −1 −αt
√1 −¯αt
ϵθ(xt | t, c)

+ σtz,
where ¯αt = α1 · · · αt, αt = 1 −βt, and βt is a constant defined by (βT −β1)(t −
1)/(T −1)+β1 with hyperparameters β1 and βT . σt is also a time-dependent constant
determined by βt and z is a random vector from N(0, I). For more details, please
refer to the original DDPM paper [7].


---

## Page 5

Ambigram Generation by A Diffusion Model
5
conditional
U-Net
estimation
rule
proposed reverse process
class (=‘A’)
time step
conditional
U-Net
+
-180 rotation
180 rotation
class 
(=‘Y’)
time step
Fig. 4. The proposed reverse process for the ambigram generation.
that xt−1 becomes more readable as class c, whereas its 180◦-rotated version
(i.e., x′
t−1) does c′. Preparing a noise image xT and then repeating this reverse
process until t = 0, we will have noise-free x0 and x′
0 (as shown in the rightmost
part of Fig. 2(b)) that form an ambigram c↕c′.
The main difference between the proposed model of Fig. 4 and the standard
DDPM of Fig. 3 (a) is that the former estimates two noise images ϵθ(xt | t, c)
and ϵθ(x′
t | t, c′) by applying the same U-Net θ to xt and x′
t. Then, these noise
images are simply averaged to have a single noise image ϵθ(xt, x′
t | t, c, c′):
ϵθ(xt, x′
t | t, c, c′) =

ϵθ(xt | t, c) + Rot
−180◦[ϵθ(x′
t | t, c′)]

/2.
(1)
Note that ϵθ(x′
t | t, c′) is rotated with −180◦(by the operator Rot[ ]) before
taking average, for having the original direction as ϵθ(xt | t, c). The averaged
noise image is useful to generate xt−1 with an appearance of c and (rotated) c′,
that is, useful to generate an ambigram c↕c′.
Training the proposed model of Fig. 4 is rather straightforward. We use the
training process of the standard DDPM, shown in Fig. 3(b), for the proposed
model. Only the difference from Fig. 3(b) is that the proposed model uses the
averaged noise image ϵθ(xt, x′
t | t, c, c′) instead of ϵθ(xt | t, c). The averaged noise
image guides xt−1 to the intermediate direction between c and c′. Before this
training, we also perform a pretraining step, as will explain below. As already
emphasized, we use ordinary font images as x0 and do not use any ambigram
examples.
3.2
Details
Pretraining for Ordinary Letter Image Generation Before generating
ambigrams by the model of Fig. 4, its conditional U-Net θ is pretrained to
generate ordinary (i.e., non-ambigram) letter images. In other words, we first
train the U-Net θ in the standard DDPM scheme of Fig. 3 (b). We also use an
ordinary font dataset for pretraining. The pretrained U-Net can produce various
ordinary fonts with the reverse process of Fig. 3 (a).


---

## Page 6

6
T. Shirakawa et al.
Classifier-free Guidance In the reverse process, we employ classifier-free guid-
ance [8]. In our ambigram generation task, this technique can control the trade-
off between the readability and diversity of the generated ambigrams. By setting
its guidance strength parameter s larger, the generated ambigrams become more
readable with less diversity. In the later experiment, we will observe the effect
of the parameter value s.
Re-spacing Technique Re-spacing [17,4] is a technique to accelerate the re-
verse process by skipping some time steps t. In general, diffusion models (includ-
ing DDPM) need to set T at a large value (say, 1,000) for appropriate results.
This means we must repeat the reverse process 1,000 times to generate just one
image. The re-spacing technique allows t to decrease with ∆interval, and there-
fore the total repetition time is reduced from T to T/∆. In [4], it is reported
that this technique keeps the quality of generated images.
Data Augmentation by Horizontal Shift A simple but effective technique
to generate more readable and diverse ambigrams is data augmentation by hor-
izontal shift. The augmented image of x0 is just a horizontally-shifted version of
x0. Roughly speaking, without this technique, ambigrams E↕P will become like
‘E
P
,’ that is, ‘E’ and ‘
P
’ will completely overlap. In contrast, with the technique,
we will have an ambigram like ‘
P
E.’ Such designs are highly readable and common
in ambigram designs by human experts. In the experiment, we will observe the
actual effect of the data augmentation.
4
Evaluation of Ambigrams and Ambigramability
4.1
Evaluating Ambigrams by A Classifier
For evaluating the generated ambigram x0 of c↕c′, we will check the readability
of x0 as c, as well as that of x′
0 as c′. For example, we can treat an ambigram x0
of C↕D as readable when x0 and its 180◦-rotated version x′
0 are readable as ‘C’
and ‘D,’ respectively. This readability is objectively and automatically evaluated
by a conditional binary classifier C(x, c) ∈{True, False}. The classifier returns
True when the input image x is acceptable as the input class label c and returns
False otherwise. Consequently, if C(x0, c) = True and C(x′
0, c′) = True, it is a
successful ambigram of c↕c′ with dual readability.
The classifier is an MLP whose input is a concatenation of two vectors: one
from a standard CNN [24] for the image input x0 and the other from a fixed
random vector pre-assigned to the class c. The CNN for x0 is pre-trained with
the standard letter image classification task, and the final layer is discarded to
use the CNN as a feature extractor.
4.2
Ambigramability
One of the highlights of this paper is to introduce ambigramability, which eval-
uates how each alphabet letter pair is easy to generate ambigrams. As noted


---

## Page 7

Ambigram Generation by A Diffusion Model
7
in Section 1, ambigramability heavily depends on class pairs; for example, A↕V
will have a higher ambigramability, and D↕K have a lower ambigramability. De-
termining the pair-wise ambigramability automatically and objectively will help
further ambigram designs.
Ambigramability for the pair of c and c′ is calculated by a sufficient number
N of ambigrams c↕c′ and the classifier in Section 4.1. Specifically, ambigrama-
bility is defined as the number of successful ambigrams among N ambigrams.
For simplicity, we use N = 100 in the later experiment. Note that the ambi-
gramability values for c↕c′ and c′↕c will be similar but not the same due to the
stochastic behavior of the diffusion model.
5
Experimental Results
5.1
Experiment Setup
Dataset As described in Section 3, it is enough to prepare a standard (i.e., non-
ambigram) font image dataset to train the proposed model. In the following ex-
periment, we use 52 letter images of Latin alphabet classes (‘A,’· · · ,‘Z,’‘a,’· · · ,‘z’)
from MyFonts dataset [3]. The MyFonts dataset contains about 20,000 fonts,
and we remove illegible, collapsed, or excessively decorated fonts before train-
ing. Consequently, 11,991 fonts were used to train the model. Each image is
binary and 64 × 64 pixels. We apply the data augmentation to all 52 classes of
alphabets (A-z, a-z) while using 40% of training data. The amount of horizontal
shifts is randomly determined within 25% of the image size.
Implementation Details The model of the conditional U-Net is similar to a
model used in [4]. This U-Net is more elaborated from the original U-Net [22]
and consists of a stack of residual layers with an attention mechanism. We use
an adaptive group normalization[4] for embedding time step t and class condi-
tions c, c′.The model was trained end-to-end with 500K iterations and batch size
64. As an optimizer, Adam[13,15] is used with its learning rate 10−4. As the
parameters specific to DDPM, we use T = 1, 000, β1 = 10−4, and βT = 0.02
for the pretraining step and the ambigram generation step. We also set ∆= 20
for re-spacing and s = 5.0 for classifier-free guidance. A preliminary experiment
sets these parameters.
Evaluation Metrics Using the trained classifier C(x, c) and N = 100 gener-
ated ambigrams for each class pair, the ambigramability score (↑) is calculated
for the quality evaluation. The binary classifier C(x, c) is trained by the My-
Fonts dataset. After training, its test accuracy was 98.70%. Similar to the past
attempts to generate letter images by GANs, we also use Frechet Inception Dis-
tance (FID↓) [6] for evaluating the quality and diversity of the generated ambi-
grams. The FID score of the generated ambigrams is calculated by comparing
their feature distribution with that of the MyFonts dataset on the Inception-
V3[25].


---

## Page 8

8
T. Shirakawa et al.
A↕V
(99)
d↕p
(98)
a↕B
(96)
t↕t
(92)
C↕D
(88)
B↕J
(80)
B↕Q
(74)
G↕Q
(72)
h↕k
(59)
R↕e
(47)
S↕Y
(45)
T↕T
(35)
A↕b
(32)
O↕T
(23)
D↕y
(7)
D↕K
(7)
n↕g
(6)
D↕P
(6)
Fig. 5. Ambigrams generated by the proposed model. The parenthesized number is the
ambigramability score (↑) of the letter pair. The upper three rows are rather easy class
pairs (with higher ambigramability scores), and the lower three are not. Note that all
these ambigrams are successful ones.
5.2
Qualitative Evaluations
Examples of Generated Ambigrams Fig. 5 shows the ambigrams generated
by the proposed model. Four ambigram examples are shown for each class pair
c↕c′. The lower samples (x′
0) are 180◦-rotated versions of the upper samples
(x0). We expect that the upper samples are readable as c and the lower c′. The
parenthesized number is the ambigramability score ∈[0, N(= 100)] of the letter
pair. Note that all ambigrams in this figure were successful ones by the classifier
C.
The upper three rows of Fig. 5 show the ambigrams for easy pairs with
higher ambigramability scores. These ambigrams realize their dual readability
from both directions. For the pair A↕V, the generated images of ‘A’ have a thin
or no horizontal stroke; consequently, their 180◦-rotated versions are readable as
‘V.’ Similarly, for the pair C↕D, the generated images of ‘C’ have a thin or short
vertical stroke to make their 180◦-rotated versions readable as ‘D’. For t↕t, the


---

## Page 9

Ambigram Generation by A Diffusion Model
9
E↕P
E↕L
A↕A
w/ DA
w/o DA
Fig. 6. Effect of data augmentation by horizontal shift.
horizontal stroke often comes in the middle of the ambigrams, even though such
a style is not common in the non-ambigram fonts used for training.
An important observation of those successful cases is that the proposed model
based on a diffusion model can generate various ambigrams. For d↕p, one of the
easiest class pairs, the generated ambigrams have various styles, i.e., calligraphic,
pixel art, slab-serif, and outlined. Other ambigrams, such as a↕B and B↕Q, also
have wide variations in their styles. The stochastic property of the diffusion
model helps to have those variations.
The lower three rows of Fig. 5 show the ambigrams for rather difficult class
pairs (with lower ambigramability scores). Although these ambigrams were still
successful ones according to the computer classifier C, they have low readability
for humans. For example, ‘e’s by R↕e are difficult to be read as ‘e.’
On the other hand, it is also true that the generated ambigrams give various
inspirations to humans, even when they have low ambigramability scores. For
example, the examples of S↕Y and D↕K show that there are still possibilities
to design ambigrams for these pairs by using heavy but careful deformations.
The ambigrams T↕T are also inspiring; our model discovers that having a short
serifed horizontal stroke and a long straight horizontal stroke can realize the
dual readability of T↕T.
Effect of Data Augmentation by Horizontal Shift Fig. 6 shows the ab-
lation study for the data augmentation by horizontal shift. As expected, this
data augmentation increases the degree of freedom in ambigram design. For ex-
ample, the generated ambigrams of E↕P suggest that the data augmentation is
effective in having more readable ambigrams. (Later in Fig 10, we will observe
that the ambigrams of E↕P by human experts also look like ‘
P
E,’ instead of ‘
P
E.’)
Similar positive effects are found in E↕L and A↕A. Note that even with data aug-
mentation, the model can generate ambigrams that would be generated without
data augmentation. (The model can generate ‘
P
E’ if it has dual readability.) In
other words, the model automatically chooses the better one. Consequently, the
data augmentation helps to increase the readability and diversity of generated
ambigrams.


---

## Page 10

10
T. Shirakawa et al.
(a)
E↕W
(97)
A↕C
(66)
H↕H
(61)
(b)
Q↕Q
(99)
D↕G
(91)
E↕L
(15)
(c)
C↕G
(99)
B↕R
(90)
L↕P
(72)
(d)
B↕D
(62)
A↕B
(26)
O↕X
(0)
Fig. 7. Ambigrams for (a) 90◦-rotation, (b) horizontal flip, (c) vertical flip, and
(d) overlay.
Generating Different Types of Ambigrams Our model can generate differ-
ent types of ambigrams by replacing the ±180◦-rotation module in Fig. 4 with
another transformation module. Fig. 7 shows the ambigram examples of four
different types. Ambigrams of (a), (b), and (c) are generated by ±90◦-rotation,
horizontal flip, and vertical flip, respectively, instead of ±180◦-rotation. Con-
sequently, they become readable as another letter after the transformations.
Samples of Fig. 7 (d) are generated without any transformation — therefore,
they seem like overlaid letters (rather than ambigrams) and keep readability as
two letters from their original direction.
5.3
Quantitative Evaluations
Ambigramability Scores Fig. 8 shows the ambigramability scores for all pairs
of 52 Latin alphabet letters. Since N = 100, the score will range in [0, 100]. If the
score at the (c, c′)-th element is high, generation of ambigrams of c↕c′ is easy.
First, Fig. 8 proves that successful ambigrams are available for most class
pairs. Almost all pairs have non-zero ambigramability, and most have more than
30. In fact, the average score is about 37. Several pairs, such as b↕q, f↕J, and H↕H,
have the highest score of 100. Moreover, we often find unexpectedly-high cases.
For example, although generating B↕Q and G↕Q seems difficult, they have rather
high scores of 74 and 72, respectively. These positive results suggest that our
model will be useful to give inspiration to human experts for creating ambigrams.
We also find that several pairs, such as n↕P, O↕X, and y↕y, have the lowest
score of zero. Such negative information is also useful for designing word am-
bigrams. For example, the zero ambigramability of n↕P suggests that designing
a word ambigram of Pen↕Pen is difficult and better to be avoided. Note that
Fig. 7 (d) shows a possible remedy for O↕X; it is not an ambigram but has dual
readability as ‘O’ and ‘X’ without rotation.


---

## Page 11

Ambigram Generation by A Diffusion Model
11
Fig. 8. Ambigramability score of each letter pair c↕c′. A pair with a darker cell has a
higher ambigramability score; that is, generating their ambigrams is rather easy.
In ambigrams designed by human experts, capital and small letters are used
interchangeably. For example 2, a word ambigram caNDy↕caNDy is used instead
of candy↕candy. This is because ambigrams a↕D (88) and N↕N (94) are easier
than a↕d (21) and n↕n (44), respectively. (The parenthesized number is the
corresponding ambigramability score.) Fig 5 shows other prominent examples,
such as d↕p (98) and D↕P (6). By referring to these differences, we can design
various word-wise ambigrams with appropriately chosen capital and small letters.
Trade-off between Readability and Diversity As described in Section 3.2,
we introduce the classifier-free guidance to control the trade-off between read-
ability and diversity. Fig. 9 shows that the guidance strength s can control the
trade-off. As s increases, both the average ambigramability and FID increase;
2 https://www.basilemorin.com/ambigrams.html


---

## Page 12

12
T. Shirakawa et al.
0
10
20
30
40
50
60
70
80
90
0
10
20
30
40
50
1
2
3
4
5
6
7
8
9
10
FID
average ambigramability
guidance strength (s)
average ambigramability
FID
Fig. 9. The trade-off between the readability and diversity of generated ambigrams by
controlling the guidance strength parameter s.
(a)
B↕E
(88)
C↕D
(88)
E↕P
(43)
A↕y
(87)
b↕q
(100)
H↕Q
(18)
h↕q
(62)
h↕Q
(31)
(b)
B↕E
C↕D
E↕P
A↕y
b↕q
H↕Q
B↕Q
(74)
B↕q
(76)
Fig. 10. Qualitative comparison of ambigrams by (a) the proposed model and (b) hu-
man experts. Since we could not find a sufficient number of ambigrams by human
experts, we do not show the ambigramability scores for (b).
this means that the readability of the generated ambigrams increases, but their
diversity decreases. We, therefore, use s = 5 in the above experiments as the
best compromise for the trade-off.
5.4
Comparative Studies
Comparison with Ambigrams by Human Experts Fig. 10 compares am-
bigrams by (a) the proposed model and (b) human experts. The latter samples


---

## Page 13

Ambigram Generation by A Diffusion Model
13
class 
class 
G
D
180 rotation
Real/Fake
D
Real/Fake
Fig. 11. A GAN-based ambigram generator.
(a) GAN-based model.
(b) The proposed model.
Fig. 12. Ambigramability scores by the proposed model and the GAN-based model.
were collected from the website MakeAmbigrams3, where eight types of man-made
ambigram fonts are provided.
For B↕E, C↕D, E↕P, and A↕y, the proposed model generates ambigrams some-
what similar to human experts. However, especially C↕D and E↕P, we can find
different types of ambigrams between our model and humans. These facts imply
that human experts and our models can work complementary to design readable
and diverse ambigrams.
It is interesting to note that the class pairs are often limited in the ambigrams
by human experts. For example, B↕Q is not prepared, and therefore, we need to
use b↕q instead. (Recall the discussion on interchangeability between capitals and
small letters in Section 5.3.) This might be because the design of B↕Q was not
straightforward for human experts. In contrast, for our model, the ambigrams of
B↕Q and B↕q are rather easy because these ambigramability scores are 74 and 76,
respectively. Fig. 5, as well as Fig. 10, shows the examples of B↕Q generated by
the proposed model. A similar observation can be done for h↕q, which is difficult
for human experts (and therefore only H↕Q is designed) but not for our model.
3 https://makeambigrams.com/


---

## Page 14

14
T. Shirakawa et al.
(a)
A↕V
(98)
C↕D
(11)
H↕K
(34)
A↕B
(0)
E↕I
(92)
B↕Y
(77)
(b)
A↕V
(100)
C↕D
(83)
H↕K
(64)
A↕B
(50)
E↕I
(73)
B↕Y
(16)
Fig. 13. Comparison of ambigrams by (a) the GAN-based model and (b) the proposed
model. Ambigramability scores in red indicate whether (a) or (b) is the winner for a
certain c↕c′.
Comparison with Ambigrams by GAN To the authors’ best knowledge,
there has been no past attempt to generate ambigrams by computers. Therefore,
there are neither baselines nor state-of-the-art methods which are comparable
with our model. Considering this fact, we prepare our own comparative model,
using GAN instead of DDPM, to validate the proposed model.
Fig. 11 shows the GAN-based model. This model consists of one image gen-
erator and two discriminators. The generator is trained (i.e., updated) especially
when the discriminator does not determine the generated image as a real sample
of class c and/or the 180◦-rotated version as c′. The discriminator is trained
when it cannot discriminate a generated image and its rotated image from a real
image of a class c and c′. The model structures of the generator and discrimina-
tor are the same as StyleGAN2 [12]. This GAN-based model also can be trained
end-to-end.
In this comparative study, we use Google Fonts4 instead of the MyFonts
dataset. This is because the GAN-based model trained by the MyFonts dataset
tends to generate hardly-readable noisy images. The MyFonts dataset contains
various fonts, including heavily decorative fonts. These variations are beneficial
to train the model for the ambigrams generation. However, GAN (especially its
generator) cannot deal with the scattered distribution due to the variations. In
contrast, Google Fonts contains about 3,000 fonts, most of which have standard
shapes and higher legibility. The GAN-based model could perform much better
with Google Fonts datasets than the MyFont. Another treatment is to limit the
number of classes to 26 (i.e., ‘A’-‘Z’) instead of 52. This limitation also helped
the GAN-based model.
4 https://fonts.google.com/


---

## Page 15

Ambigram Generation by A Diffusion Model
15
Fig. 12 shows the ambigramability scores evaluated by the same classifier.
The GAN-based model has very low scores for many pairs. In contrast, the
proposed model achieves higher scores for many pairs. These results show that
the proposed model can generate successful ambigrams more than the GAN-
based model.
Fig. 13 shows the ambigrams generated by (a) the GAN-based model and
(b) the proposed model. As indicated by the ambigramability scores of Fig. 12,
the ambigrams by the GAN-based model are often inferior to the proposed
model. Moreover, it is more prominent that the generated ambigrams by the
GAN-based model show fewer variations. In E↕I and B↕Y, this limited variation
results in a higher ambigramability score than the proposed model. Of course,
it does not mean the success of the GAN-based model.
This is similar to a situation called mode collapse, which is specific to GAN.
In the standard (i.e., non-ambigram) letter generation scenario, we confirmed
that the same generator and discriminator could generate letter images in suf-
ficient style variations. (Again, they are the models used in StyleGAN2, which
is famous for good image generation performance.) However, if we use them in
the framework of Fig. 11 for ambigram generation, variations in the generated
images decrease drastically. This might be because it is difficult for the gen-
erator to find the narrow distributions of ambigrams, which must satisfy dual
readability. In other words, DDPM could avoid the mode collapse problem and
thus generate not only readable but also diverse images.
6
Conclusion
In this paper, we tackled a novel image generation task, i.e., ambigram genera-
tion, and proposed a diffusion model. The proposed model generates high-quality
and diverse ambigrams. For example, if we specify two letter classes, ‘B’ and ‘a’,
as conditions, the proposed model generates ambigrams that can be read as ‘B’
in their original direction and as ‘a’ from a direction rotated 180◦degrees. An
important property of the proposed model is that it does not require any refer-
ence ambigrams; it generates ambigrams only using the readability of standard
letter images.
Qualitative and quantitative evaluations show that the proposed model can
generate ambigrams with sufficient readabilities and variations for many class
pairs. At the same time, we also reveal that the ambigrams for specific class
pairs, such as ‘D’ and ‘K’, are difficult. We proposed ambigramability as a metric
to automatically and objectively evaluate how easy it is to generate readable
ambigrams for individual class pairs.
A limitation of the current model is that it does not generate word-wise am-
bigrams. Although they can be realized by arranging the letter-wise ambigrams
generated by the current model, it would be more efficient to generate word-wise
ambigrams at once. Applying the proposed model to non-Latin alphabets will
be another future work.


---

## Page 16

16
T. Shirakawa et al.
References
1. Azadi, S., Fisher, M., Kim, V.G., Wang, Z., Shechtman, E., Darrell, T.: Multi-
content gan for few-shot font style transfer. In: CVPR (2018)
2. Brock, A., Donahue, J., Simonyan, K.: Large scale GAN training for high fidelity
natural image synthesis. arXiv preprint arXiv:1809.11096 (2018)
3. Chen, T., Wang, Z., Xu, N., Jin, H., Luo, J.: Large-scale tag-based font retrieval
with generative feature learning. In: ICCV (2019)
4. Dhariwal, P., Nichol, A.: Diffusion models beat gans on image synthesis. In:
NeurIPS (2021)
5. Hayashi, H., Abe, K., Uchida, S.: GlyphGAN: Style-consistent font generation
based on generative adversarial networks. Knowledge-Based Systems 186 (2019)
6. Heusel, M., Ramsauer, H., Unterthiner, T., Nessler, B., Hochreiter, S.: Gans trained
by a two time-scale update rule converge to a local nash equilibrium. In: NeurIPS
(2017)
7. Ho, J., Jain, A., Abbeel, P.: Denoising diffusion probabilistic models. In: NeurIPS
(2020)
8. Ho,
J.,
Salimans,
T.:
Classifier-free
diffusion
guidance.
arXiv
preprint
arXiv:2207.12598 (2022)
9. Karras, T., Aila, T., Laine, S., Lehtinen, J.: Progressive growing of gans for im-
proved quality, stability, and variation. In: ICLR (2018)
10. Karras, T., Aittala, M., Laine, S., H¨ark¨onen, E., Hellsten, J., Lehtinen, J., Aila,
T.: Alias-free generative adversarial networks. In: NeurIPS (2021)
11. Karras, T., Laine, S., Aila, T.: A style-based generator architecture for generative
adversarial networks. In: CVPR (2019)
12. Karras, T., Laine, S., Aittala, M., Hellsten, J., Lehtinen, J., Aila, T.: Analyzing
and improving the image quality of stylegan. In: CVPR (2020)
13. Kingma, D.P., Ba, J.: Adam: A method for stochastic optimization. arXiv preprint
arXiv:1412.6980 (2014)
14. Lee, K., Chang, H., Jiang, L., Zhang, H., Tu, Z., Liu, C.: Vitgan: Training gans
with vision transformers. arXiv preprint arXiv:2107.04589 (2021)
15. Loshchilov, I., Hutter, F.: Decoupled weight decay regularization. arXiv preprint
arXiv:1711.05101 (2017)
16. Mirza, M., Osindero, S.: Conditional generative adversarial nets. arXiv preprint
arXiv:1411.1784 (2014)
17. Nichol, A.Q., Dhariwal, P.: Improved denoising diffusion probabilistic models. In:
ICML (2021)
18. Patashnik, O., Wu, Z., Shechtman, E., Cohen-Or, D., Lischinski, D.: StyleCLIP:
Text-Driven Manipulation of StyleGAN Imagery. In: ICCV (2021)
19. Radford, A., Metz, L., Chintala, S.: Unsupervised representation learning with deep
convolutional generative adversarial networks. arXiv preprint arXiv:1511.06434
(2015)
20. Ramesh, A., Dhariwal, P., Nichol, A., Chu, C., Chen, M.: Hierarchical text-
conditional image generation with clip latents. arXiv preprint arXiv:2204.06125
(2022)
21. Rombach, R., Blattmann, A., Lorenz, D., Esser, P., Ommer, B.: High-resolution
image synthesis with latent diffusion models. In: CVPR (2022)
22. Ronneberger, O., Fischer, P., Brox, T.: U-Net: Convolutional Networks for Biomed-
ical Image Segmentation. In: MICCAI (2015)


---

## Page 17

Ambigram Generation by A Diffusion Model
17
23. Saharia, C., Chan, W., Saxena, S., Li, L., Whang, J., Denton, E., Ghasemipour,
S.K.S., Ayan, B.K., Mahdavi, S.S., Lopes, R.G., et al.: Photorealistic text-
to-image diffusion models with deep language understanding. arXiv preprint
arXiv:2205.11487 (2022)
24. Simonyan, K., Zisserman, A.: Very deep convolutional networks for large-scale
image recognition. arXiv preprint arXiv:1409.1556 (2014)
25. Szegedy, C., Vanhoucke, V., Ioffe, S., Shlens, J., Wojna, Z.: Rethinking the incep-
tion architecture for computer vision. In: CVPR (2016)
26. Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A.N., Kaiser,
 L., Polosukhin, I.: Attention is all you need. In: NeurIPS (2017)
27. Xie, Y., Chen, X., Sun, L., Lu, Y.: Dg-font: Deformable generative networks for
unsupervised font generation. In: CVPR (2021)
28. Xu, T., Zhang, P., Huang, Q., Zhang, H., Gan, Z., Huang, X., He, X.: Attngan:
Fine-grained text to image generation with attentional generative adversarial net-
works. In: CVPR (2018)
29. Yang, L., Zhang, Z., Song, Y., Hong, S., Xu, R., Zhao, Y., Shao, Y., Zhang, W.,
Cui, B., Yang, M.H.: Diffusion models: A comprehensive survey of methods and
applications. arXiv preprint arXiv:2209.00796 (2022)
