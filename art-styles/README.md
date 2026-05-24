# 画风包（Art Styles）

> **画风是 Agents Studio 的一等公民**。每个画风是一个热插拔的目录包，包含完整的提示词模板、风格示例图、负向词、画质锁定词。
>
> 这套结构 **完全照搬 [Toonflow-app `data/skills/art_skills/<style>/`](https://github.com/HBAI-Ltd/Toonflow-app/tree/main/data/skills/art_skills)**，因为它是 9 个参考项目里 **唯一** 把画风做成可扩展包的最佳实践。

---

## 内置画风（建议）

| ID | 中文名 | 适用 | 推荐图像模型 | 推荐视频模型 |
|---|---|---|---|---|
| `2D-chinese-anime` | 国风二次元 | 仙侠/古装/玄幻 | Seedream 5.0 / Nano Banana Pro | Seedance 2.0 / Veo 3.1 |
| `2D-90s-japanese-anime` | 90 年代日漫 | 校园/日常/轻喜 | Nano Banana / Seedream | Seedance / Veo |
| `2D-flat-design` | 扁平插画 | 治愈/科普/亲子 | GPT Image / Flux | Veo Lite |
| `3D-pixar` | 三维卡通 | 合家欢/儿童 | GPT Image | Veo / Sora |
| `2D-mature-urban-romance` | 都市言情 | 现代爱情/职场 | Seedream / GPT Image | Seedance / Kling |
| `photorealistic-cinema` | 写实电影感 | 悬疑/犯罪/纪实 | Seedream / GPT Image / Flux | Veo 3.1 / Sora 2 |

> **MVP 阶段建议先做 1-2 个**（如 `2D-chinese-anime` + `2D-90s-japanese-anime`），其他从 Toonflow 直接搬运。

---

## 画风包结构

```
art-styles/<style-id>/
  README.md                       # 画风介绍 + 适用场景
  prefix.md                       # 画风锚点词（所有图都拼上的前缀）
  style_meta.yaml                 # 元信息（标签 / 推荐模型 / 锚点词）
  images/
    preview.png                   # 风格示例图（800x1422 推荐尺寸）
    01.png, 02.png, ...           # 参考图集（用于 IPAdapter）
  art_prompt/
    art_character.md              # 角色定妆词模板
    art_character_derivative.md   # 角色衍生（多服装/多动作）
    art_scene.md                  # 场景词模板
    art_scene_derivative.md       # 场景衍生（不同时间/天气）
    art_prop.md                   # 道具词模板
    art_prop_derivative.md        # 道具衍生
    art_storyboard_video.md       # 视频提示词风格约束
  director_skills/
    director_planning_style.md    # 该画风的拍摄/构图规划要点
    director_storyboard.md        # 该画风专属的分镜技法（情绪→面容词、光影词库）
    director_storyboard_table_style.md  # 表格化风格摘要
```

详见样例：[`2D-chinese-anime/`](./2D-chinese-anime/README.md)

---

## 加载机制

```python
# 06-character-designer / 08-keyframe-generator 在拼 prompt 时：

art_style = load_art_style(project.art_style_id)

prompt = "\n".join([
    art_style.prefix.get_text(),
    art_style.art_prompt.character.format(**character_meta),
    *character.identity_anchors_as_prompt_lines(),
    art_style.art_prompt.character.quality_lock_words,
    art_style.art_prompt.character.negative_words,
])
```

---

## 自定义画风

如果用户提供自己的参考图，运行时通过 05-art-director 的"模式 C 自定义画风"创建：

```
art-styles/custom/<user_id>__<style_name>/
  prefix.md           # LLM 自动从参考图分析出的锚点词
  art_prompt/...      # 自动复制最近邻预设画风的模板，再根据参考图调整
  style_meta.yaml
  images/preview.png  # 第一张测试生成
```

---

## 双语策略

每个 `art_prompt/*.md` 都必须给出：

- **模式 A（中文 prompt）** — 适合 Seedream / 通义万相等中国厂商
- **模式 B（英文 prompt）** — 适合 GPT Image / Gemini / Nano Banana 等国际厂商

下游 Skill 会按所选 image_backend 自动切换。

---

## 参考实现

直接抄 Toonflow 的画风包：

```bash
# 假设你已经 clone 了 Toonflow-app
cp -r ../Toonflow-app/data/skills/art_skills/* ./art-styles/

# 重命名以符合本仓库约定（kebab-case + 描述性 ID）
mv art-styles/2D_chinese_guofeng art-styles/2D-chinese-anime
mv art-styles/2D_90s_japanese_anime art-styles/2D-90s-japanese-anime
# ... 以此类推
```

Toonflow 的所有画风包都是 Apache-2.0 协议，可直接借用。请在仓库 `NOTICES.txt` 中保留致谢。
