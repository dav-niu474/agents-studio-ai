# 角色定妆词模板 · 国风二次元

> 由 06-character-designer 加载。详细字段被替换为角色 meta 的具体内容。

---

## 模式 A · 中文

```
[画风 prefix.md]，
{appearance.gender}，{appearance.age_range}，
{appearance.body_type}，{appearance.facial}，
{appearance.hair}，{appearance.clothing}，
{appearance.distinguishing_features}，
{personality_tags 转化为气质词}，

【6 层身份锚点】
脸型：{identity_anchors.face_shape}
发型签名：{identity_anchors.hair_signature}
主色调：{identity_anchors.color_palette}
剪影特征：{identity_anchors.silhouette}
标志性道具：{identity_anchors.signature_prop}

全身正面，T-pose，纯中性背景，无背景干扰，无其他角色，
[质量锁定词来自 style_meta.yaml.quality_lock_zh]
```

### 负向词

参考 style_meta.yaml.negative_anchors_zh + 「写实摄影、3D渲染、低多边形、模糊画质、塑料质感、西方奇幻、赛博朋克、现代元素、无国风韵味、文字、水印、字幕」

> ⚠️ Seedream（模式A）**不支持负向提示词**，负向词仅适用于模式 B。模式 A 通过正向词中的"赛璐璐平涂感"和"国风二次元"等锚点反向规避。

---

## 模式 B · 英文

```
[prefix.md mode B],
{gender}, {age_range},
{body_type}, {facial}, {hair}, {clothing},
{distinguishing_features},
{personality_tags as temperament adjectives},

[6-Layer Identity Anchors]
Face shape: {identity_anchors.face_shape}
Hair signature: {identity_anchors.hair_signature}
Color palette: {identity_anchors.color_palette}
Silhouette: {identity_anchors.silhouette}
Signature prop: {identity_anchors.signature_prop}

Full body, neutral T-pose, plain neutral background,
no background distractions, no other characters,
[quality_lock_en from style_meta.yaml]
```

### Negative

```
photorealistic, realistic photography, 3D render, low-poly, plastic texture,
western fantasy, cyberpunk, modern elements, generic anime,
no subtitles, no captions, no watermark, no text overlay
```

---

## 衍生模板（multi-pose / multi-outfit）

详见 `art_character_derivative.md`。要点：
- 必须以基础 reference.png 为图生图参考
- 6 层锚点必须**完整重复**，不要简化
- 只替换 `clothing` 或 `pose`，其他字段保留
