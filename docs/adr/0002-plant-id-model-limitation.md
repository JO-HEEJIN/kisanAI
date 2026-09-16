# 0002 Plant ID model limitation

Date: 2026-09-17

## Context

Plant identification in `src/plant-recognition.js` ran entirely in the browser. It classified a camera frame with a pretrained MobileNet (ImageNet, 1000 classes) and turned the top class name into a crop through keyword matching (`corn`, `ear`, `wheat`, `rice`, `tomato`, `potato`, `soy`) plus a `plantMapping` table. Anything that did not match became `generic_plant`.

ImageNet had no classes for growing wheat, rice, soybean, tomato, or potato plants. Its only directly relevant classes were `corn` and `ear, spike, capitulum`. So keyword matching could not identify most target crops, no matter how it was tuned. `plantMapping` also had a `corn_cob` key that was not an ImageNet class name. Meanwhile, an automatic `generic_plant` result was shown with the scientific name "Unknown Plant", a percentage labeled as AI confidence (really the ImageNet class probability), and a computed health score. That looked like a confident crop analysis.

## Decision

The client-side MobileNet approach stayed in place. Its output was presented honestly instead:

- The invalid `corn_cob` key was removed. The `ear` synonym and direct `corn` keyword matching were kept.
- An automatic prediction that fell back to `generic_plant` said it "could not confidently identify a specific crop", showed an "Unidentified" badge instead of an AI confidence percentage, and showed no health score. The raw ImageNet class and its probability stayed visible as debugging information. The existing non-plant detection for such results was kept.
- Manual plant selection and the `runModelPrediction(videoElement)` interface were unchanged.

Two replacement options were recorded, and neither was implemented:

1. A custom classifier trained by transfer learning (for example a Teachable Machine export) on the target crops, loaded behind the same `runModelPrediction` interface.
2. A call to a server-side vision-capable model in place of the client-side classifier.

## Consequences

- Users were no longer shown crop identity or crop health for frames the model could not map to a target crop.
- In practice, automatic identification still recognized only corn-like classes. Most scans of other target crops came back unidentified.
- Keyword matching still used substring checks, so some unrelated ImageNet classes could map to a crop (for example "acorn" or bear classes containing "ear" mapped to corn, and "paddy wagon" mapped to rice). A replacement classifier removes this.
- Choosing and implementing option 1 or 2 remained open.
