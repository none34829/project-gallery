# Broken hero images

The hero image on each project card comes from Airtable's `graphic_link`, which is a
**hotlink to a third-party site**. Those links rot. The page no longer *looks* broken -
a dead link now falls back to the project's subject gradient - but the images are still
missing and the real fix is repointing them in Airtable.

No code change is needed to fix these: update `graphic_link` in Airtable and the next
`./reloadWebsite.sh` picks them up.

Regenerate this list any time with `python audit_images.py`.

## 34 of 188 hero images fail to load

| Project | Student | Dead URL |
| --- | --- | --- |
|  Is GPT-3 smarter than a sixth-grader? | Anitej S. | `https://decemberlabs.com/wp-content/uploads/2021/02/768_2zpph46r1elg.jpg` |
| A Comprehensive Review on Deep Learning Architectures for Im | Madhurima M. | `https://www.carierista.com/storage/company-posts/82/266769da4e5df45ec3a5d6947aba04dc.jpg` |
| Analysis of Trending YouTube Videos: Finding Patterns in Vir | Vincent P. | `https://www.cnet.com/a/img/resize/55f2ab60e25d1ec7e18c4290c93e6e27300c8cc6/hub/2020/01/01/30159` |
| Art Intel - Making AI your Ally in the Creative Process | Satvi M. | `https://www.adobe.com/products/firefly/features/media_179810889bf1ef34a453137e0387dd9e0f4e43f05` |
| Biased News Detection Using Artificial Intelligence | Arianna H. | `https://www.usnews.com/object/image/00000185-f52e-d39b-a98f-ff6e7bdf0000/gettyimages-1239793196` |
| Brain Cancer Detection | Rohan T. | `https://medicine.wustl.edu/wp-content/uploads/GlioblastomaBranScans.jpg` |
| Brightness helps CNN classify a subset of the images from Go | Serena F. | `https://www.labnol.org/images/2023/google-drive-drawings.jpg` |
| Cardiac Auscultation: Metrics of Smartphones and Digital Ste | Nicholas T. | `https://riester.de/media/pages/en/products/stethoscopes/advanced-digital-auscultation/modules/i` |
| Classifying AI-Generated Music with AI Models  | Siddharth M. | `https://kentwired.com/wp-content/uploads/2023/08/AIPhotoAlton-1200x873.png` |
| Classifying Non-Gaussian Transient Noise in LIGO  | Maanya M. | `https://community.cadence.com/resized-image/__size/1280x960/__key/communityserver-discussions-c` |
| DeepSolar Bangladesh: A Novel Convolutional Neural Network ( | Khondoker F. | `https://www.pv-magazine.com/wp-content/uploads/2021/04/Bild1-1-1200x563.jpg` |
| Developing a novel 3D GNN and Random Forest Regression model | Stanley C. | `https://u4d2z7k9.rocketcdn.me/wp-content/uploads/2023/07/Untitled-683-%C3%97-1024px-1024-%C3%97` |
| Differences in predicted rates of vaginal births after cesar | Anjali S. | `https://www.verywellfamily.com/thmb/m5vCHw2YW_zteiIwmYXmJ2QRosE=/1500x0/filters:no_upscale():ma` |
| Enhancement of Autonomous Vehicles During Extreme Weather | Pandian A. | `https://cms.accuweather.com/wp-content/uploads/2016/10/650x366_10101621_650x366_10080011_fordna` |
| Fake news detection, methods and data processing | Soham P. | `https://static.vecteezy.com/system/resources/thumbnails/006/299/370/original/world-breaking-new` |
| Investigating Data Augmentation Strategies for Computer Visi | Jack L. | `https://149695847.v2.pressablecdn.com/wp-content/uploads/2020/04/Learn-Facial-Recognition-scale` |
| Machine Learning Models for Cardiovascular Disease: A Holist | Anirudh C. | `https://media.licdn.com/dms/image/D4D12AQGTaolbDut09g/article-cover_image-shrink_720_1280/0/170` |
| Multi-Label Prediction of Protein Subcellular Localizations  | Alfred B. | `https://www.researchgate.net/publication/343240378/figure/fig1/AS:928762371788803@1598445613852` |
| Optimizing Stroke Detection with Machine Learning Techniques | Neil S. | `https://www.cnet.com/a/img/resize/e84274d0e20b455830c300382bf63baec528b594/hub/2015/01/22/ecb2e` |
| Predicting Climate Change Using an Autoregressive Long Short | Seokhyun C. | `https://ca-times.brightspotcdn.com/dims4/default/06cdef8/2147483647/strip/true/crop/2696x1664+0` |
| Predicting Mental Health Conditions Using Student Demographi | Ashwith Y. | `https://onlinecounselingprograms.com/wp-content/uploads/sites/52/2021/04/9646_OCP_Managing-Your` |
| Predicting Recidivism in the United States Criminal Justice  | Alexander F. | `https://www.povertyactionlab.org/media/image/20170505-recidivismjpg` |
| Predicting Repeat Purchases in E-Commerce | Ayrton S. | `https://store.hp.com/app/assets/images/uploads/prod/ecommerce-vs-online-marketplace160398374872` |
| Predicting Running Injuries with Machine Learning Models | Elgin V. | `https://www.runtastic.com/blog/wp-content/uploads/2021/05/thumbnail_1200x800-2.jpg` |
| SaShiMi: Adapted for Google Colab | Leo R. | `https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcSYY6n1fYadsaidY0V8tPq6vomWkb8qu9y5lME7SKy` |
| Sign Language Recognition In Deep Learning: A Comparative St | Vanessa H. | `https://techcrunch.com/wp-content/uploads/2019/08/handtracking_shot.png` |
| Skin Cancer Detection  | Jaida G. | `https://www.cnet.com/a/img/resize/003ff7bf85a1a57a2a57fcf043b9160f6a47a9d7/hub/2019/06/26/b2b04` |
| Stellar Classification based on Numerous Characteristics usi | Roberto T. | `https://www.universetoday.com/wp-content/uploads/2008/11/tarantula.jpg` |
| The Differentiation of Viral and Bacterial Pneumonia using D | Arnav D. | `https://thorax.bmj.com/content/thoraxjnl/57/5/438/F1.large.jpg` |
| The Impact of the Covid-19 Pandemic on the Test Scores of Va | Deniz G. | `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTu1QsK4minVxl1ddZ7leeN_hYkVq4-EHb6QFg1A1_` |
| The Utilization of Artificial Intelligence in Enabling the E | Shanzeh H. | `https://scopeblog.stanford.edu/wp-content/uploads/2022/10/Scope-Arami-Nanostars-1024x578.jpg` |
| Understanding Object Detection’s Role in Decision-Making for | Shishir B. | `https://www.datasciencecentral.com/wp-content/uploads/2021/10/9456892854.jpeg` |
| Using Machine Learning for Calculus | Paul N. | `https://online.stanford.edu/sites/default/files/styles/embedded_large/public/2018-09/computer-s` |
| Using Machine Learning to Detect Parkinson’s Disease Through | Katie Y. | `https://static.vecteezy.com/system/resources/previews/002/613/988/non_2x/parkinson-disease-cart` |

## By host

- **www.cnet.com** - 3
- **static.vecteezy.com** - 2
- **www.universetoday.com** - 1
- **www.runtastic.com** - 1
- **thorax.bmj.com** - 1
- **www.verywellfamily.com** - 1
- **scopeblog.stanford.edu** - 1
- **149695847.v2.pressablecdn.com** - 1
- **ca-times.brightspotcdn.com** - 1
- **decemberlabs.com** - 1
- **www.povertyactionlab.org** - 1
- **encrypted-tbn3.gstatic.com** - 1
- **www.pv-magazine.com** - 1
- **www.usnews.com** - 1
- **encrypted-tbn0.gstatic.com** - 1
- **www.labnol.org** - 1
- **store.hp.com** - 1
- **medicine.wustl.edu** - 1
- **riester.de** - 1
- **techcrunch.com** - 1
- **www.researchgate.net** - 1
- **u4d2z7k9.rocketcdn.me** - 1
- **onlinecounselingprograms.com** - 1
- **kentwired.com** - 1
- **community.cadence.com** - 1
- **media.licdn.com** - 1
- **www.datasciencecentral.com** - 1
- **www.carierista.com** - 1
- **online.stanford.edu** - 1
- **www.adobe.com** - 1
- **cms.accuweather.com** - 1
