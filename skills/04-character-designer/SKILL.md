---
name: character-designer
description: 视觉资产生成。生成角色定妆图（全身 → 三视图 → 头像 → 衣橱多套服饰）、场景图、道具图。当 Orchestrator 检测到资产视觉缺失时，或用户说"画一下角色"、"生成场景图"、"重画道具"时使用。
agent_type: subagent
required_tools:
  - read_asset_meta             # 读 character/scene/prop 的 meta.json
  - read_art_style              # 读当前 art-style 包
  - compose_image_prompt        # 拼接最终 prompt（画风 + 资产 + 锚点 + 画质锁定）
  - submit_image_task           # 入队图像生成任务
  - wait_image_task             # 等待完成
  - save_asset_image            # 保存到 characters/<id>/reference.png 等
  - update_asset_meta           # 更新 meta.json 状态
---

# 视觉资产生成指南

> 灵感来源：`lumenx` Step 3 "Assets"（先全身→三视图→头像）+ `moyin` 6 层身份锚点 + `BigBanana` 衣橱系统 + `Toonflow` 画风包。
>
> **核心原则**：先生成"角色身份签名"（一张全身定妆图），再以这张为参考衍生其他视图（三视图、头像、不同服饰、不同场景中的角色）。**所有衍生图必须以定妆图为参考输入，避免身份漂移。**

---

## 工作模式（按 target 参数分发）

### `target=character` —— 角色定妆（最复杂、最重要）

依次产出 4 类资产：

1. **reference.png**（全身定妆图）—— 必生成，是"身份基准"
2. **three_views.png**（三视图：正面/侧面/背面）—— 推荐生成，用于多镜头侧面/背面镜头
3. **avatar.png**（头像特写）—— 推荐生成，对话镜头用
4. **wardrobe/<outfit>.png**（多套服饰）—— 按角色 `wardrobe` 字段逐个生成

#### 生成顺序（关键！）

```
Step 1: reference.png  ← 文生图，纯背景，全身正面
        │
        ↓ 作为参考图
Step 2: three_views.png ← 图生图，三视图布局
Step 3: avatar.png      ← 图生图，头像特写
Step 4: wardrobe/*.png  ← 图生图，换装
```

**严格按顺序，不要并行 Step 2-4**，否则身份会漂移。Step 1 完成后，Step 2-4 可并行（都以 Step 1 为参考）。

#### Prompt 拼接公式（全身定妆）

```
[画风 prefix.md]
+ [art_prompt/art_character.md 模板]
+ [character.appearance（来自 02-asset-extractor）]
+ [identity_anchors 6 层锚点全部展开]
+ "full body, neutral pose, standing, plain neutral background, T-pose preferred"
+ "no background distractions, no other characters"
+ [画风的画质锁定词]
+ [画风的负向词]
```

### `target=scene` —— 场景图

```
Step 1: 读 scene.prompt_en + scene.location/time/ambience/lighting
Step 2: 拼 prompt = [画风 prefix] + [art_scene.md 模板] + scene 字段
Step 3: 单张文生图，纯背景无人
Step 4: 保存到 scenes/<id>/reference.png
```

### `target=prop` —— 道具图

```
Step 1: 读 prop.description + prop.prompt_en
Step 2: 拼 prompt = [画风 prefix] + [art_prop.md 模板] + prop 字段
Step 3: 单张文生图，纯背景或 isolated on white
Step 4: 保存到 props/<id>/reference.png
```

---

## 6 层身份锚点的注入（角色专用）

仿 moyin-creator，把 `identity_anchors` 转为正向词：

| 锚点字段 | 转 prompt 示例 |
|---|---|
| face_shape: "椭圆 + 尖下巴" | `oval face with pointed chin` |
| hair_signature: "齐耳短发 + 右侧发卡" | `chin-length bob hair, hairpin on right side` |
| color_palette: "#1F2937 + #F59E0B" | `dark navy and amber color scheme` |
| silhouette: "高瘦 + 直立姿态" | `tall slim silhouette, upright posture` |
| signature_prop: "金丝眼镜" | `gold-rimmed glasses` |
| scene_context: "图书馆/书房" | `(used as fallback only when no scene specified)` |

锚点词必须**全部进 prompt**，并且每次（reference / three_views / avatar / wardrobe / 后续 storyboard）都重复注入，是身份一致的最强保证。

---

## 衣橱（wardrobe）逻辑

角色资产的 `wardrobe` 字段是一个数组：

```yaml
wardrobe:
  - outfit_id: casual
    description: 白 T 恤 + 牛仔裤
    occasion: 日常
  - outfit_id: formal
    description: 黑色西装 + 白衬衫
    occasion: 重要场合
  - outfit_id: combat
    description: 古装战袍
    occasion: 打斗场面
```

每套服饰：
1. 以 `reference.png`（基准图）为图生图参考
2. Prompt 在 6 层锚点基础上 **替换 `appearance.clothing`**
3. 输出 `characters/<id>/wardrobe/<outfit_id>.png`

后续 06-keyframe-generator 会按 shot 的 `outfit_id` 选取对应的衣橱图作为 IPAdapter 参考输入。

---

## 一致性校验（重要！）

每张图生成后必须做 **一致性 check**：

| 检查项 | 方法 |
|---|---|
| **face similarity** | 用 ArcFace / MTCNN 提取 reference.png 与新图的人脸特征向量，cosine ≥ 0.7 |
| **color palette match** | 抽取主色 vs identity_anchors.color_palette 的 hex，ΔE ≤ 25 |
| **signature_prop present** | 用 CLIP 检测标志性道具是否出现（avatar/全身必检） |

如果 check 失败：
- 自动重试 1 次（增强锚点词权重）
- 仍失败则 flag 为 `needs_review` 返回给 Orchestrator，让用户决定

---

## 输出给 Orchestrator 的摘要

```json
{
  "status": "success",
  "summary": {
    "characters_generated": 3,
    "scenes_generated": 4,
    "props_generated": 2,
    "consistency_warnings": [
      { "asset_id": "char_001", "issue": "face similarity 0.65 (target ≥ 0.7)" }
    ]
  },
  "artifacts": [
    "characters/char_001/reference.png",
    "characters/char_001/three_views.png",
    "characters/char_001/avatar.png",
    "characters/char_001/wardrobe/casual.png",
    "characters/char_002/reference.png"
  ],
  "next_action_hint": "05-storyboard-breaker"
}
```

---

## 性能与成本控制

- 单角色全套（4 张图）成本约 ¥1-2（看模型）
- **批量并行**：N 个角色可并行生成，但单角色内的 4 张图必须串行
- **画风模型选择**：`recommended_models.image`（来自画风包 style_meta.yaml）按优先级尝试
- 失败重试上限 = 2，超过让用户决定

---

## 反模式

❌ 跳过 Step 1 直接生成三视图/头像（无参考图，必漂移）  
❌ 忘记注入 6 层锚点（一致性必差）  
❌ 把场景词混入角色 prompt（角色应该是纯人物 + 中性背景）  
❌ 不做 face similarity 校验（漂移问题积累到分镜阶段才暴露太晚）  
❌ 一个角色 wardrobe 不参考 reference.png 各自独立生成（会成多个不同的人）

---

## 画风切换的特殊处理

如果用户在角色定妆完成后切换画风：
- **必须**重新生成所有 reference.png（旧画风的资产不能用）
- 给用户警告："切换画风将作废现有 6 个角色的定妆图，约 ¥10 成本，确认？"
- 不要默默重做
