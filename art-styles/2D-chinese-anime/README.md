# 国风二次元（2D Chinese Anime）

> 一个完整的画风包样例。运行时被 03-art-director / 04-character-designer / 06-keyframe-generator / 07-video-generator 加载。

## 适用题材

- ✅ 仙侠 / 修真 / 玄幻
- ✅ 古装言情
- ✅ 武侠 / 江湖
- ✅ 国风奇幻
- ✅ 神话传说

## 不适用

- ❌ 写实电影感
- ❌ 赛博朋克 / 科幻
- ❌ 现代写实题材
- ❌ 西方魔幻

## 推荐模型

| 类型 | 推荐 | 备选 |
|---|---|---|
| 图像 | Seedream 5.0 / Nano Banana Pro | GPT Image 2 / Wanx 2.5 |
| 视频 | Seedance 2.0 / Veo 3.1 | Wan 2.6 / Kling v3 |

## 风格关键词

**正向锚点**：国风二次元、新国潮美学、日式动画渲染、赛璐璐平涂、细腻笔触、电影质感

**负向锚点**：写实摄影、3D渲染、西方奇幻、赛博朋克、过度现代元素、模糊画质

## 文件清单

| 文件 | 用途 | 谁加载 |
|---|---|---|
| `prefix.md` | 全局风格前缀 | 所有图像/视频生成 |
| `style_meta.yaml` | 元信息 | 03-art-director 推荐时读取 |
| `art_prompt/art_character.md` | 角色定妆词模板 | 04-character-designer |
| `art_prompt/art_scene.md` | 场景词模板 | 04-character-designer |
| `art_prompt/art_prop.md` | 道具词模板 | 04-character-designer |
| `art_prompt/art_storyboard_video.md` | 视频提示词风格约束 | 07-video-generator |
| `director_skills/director_storyboard.md` | 分镜技法（情绪→面容词、光影词库） | 06-keyframe-generator / 07-video-generator |

## 致谢

本画风包参考 [Toonflow-app](https://github.com/HBAI-Ltd/Toonflow-app) 的 `2D_chinese_guofeng` 设计。
