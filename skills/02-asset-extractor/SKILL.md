---
name: asset-extractor
description: 多用途资产提取器，包含：(a) peek_chapters - 章节切分探测；(b) split_chapters - 物理切分章节；(c) extract_assets - 从剧本抽取角色/场景/道具/线索。当用户上传小说/原著或剧本生成后使用。
agent_type: subagent
content_modes: [drama, narration]
required_tools:
  - read_source_text          # 读小说原文
  - peek_chapter_breakpoints  # LLM 探测章节断点
  - split_source_to_chapters  # 物理切分（确定性操作）
  - read_episode_script       # 读已生成的剧本
  - read_existing_assets      # 读项目级已有资产，用于去重
  - save_dedup_characters
  - save_dedup_scenes
  - save_dedup_props
  - save_dedup_clues          # 跨镜追踪的关键道具/场景元素（仿 ArcReel）
---

# 资产提取指南

> 三合一 Subagent，包含三种工作模式。Orchestrator 通过 `mode` 参数指定本次干哪一个：
>
> - **`peek_chapters`** —— 渐进式分集规划（仿 ArcReel）：探测章节断点 → 给用户建议 → 用户确认 → 物理切分
> - **`extract_assets`** —— 从单集剧本抽取角色/场景/道具/线索（仿 huobao `extractor` + ArcReel "全局角色/线索提取"）
> - **`split_chapters`** —— 已知断点情况下纯执行切分（确定性，可不走 LLM）

---

## Mode A · peek_chapters（章节切分探测）

适用于刚上传小说但还没切分集的项目。

### 步骤

1. 调用 `read_source_text` 读取小说全文（如果太长，分段读 head/middle/tail）。
2. 让 LLM 推断合理的章节/集断点：
   - 默认每集对应 1500–3000 字原文（约可改写出 90–180 秒成片）
   - 倾向于在以下位置切：
     - 自然章节标题
     - 时间/地点显著切换
     - 主要冲突的小高潮
     - 人物视角切换
3. 输出建议的断点列表：
   ```json
   {
     "suggested_breakpoints": [
       { "char_offset": 1832, "title": "第1集：相遇", "rationale": "完成主角初相识" },
       { "char_offset": 4501, "title": "第2集：误会", "rationale": "误会爆发与离别" },
       ...
     ],
     "total_episodes_estimate": 6,
     "concerns": ["第3集稍长，可能需要拆分"]
   }
   ```
4. **必须**让 Orchestrator 把这个建议给用户确认 —— 不要直接 split。

---

## Mode B · split_chapters（执行切分）

用户确认断点后，执行：

1. 调用 `split_source_to_chapters` 传入断点列表
2. 在 `projects/<name>/source/chapters/` 下生成 `chapter_001.txt`, `chapter_002.txt`, ...
3. 写回 `project.json.episodes[N].chapters = [...]`

**这一步不需要 LLM**，是纯确定性操作。Orchestrator 可以直接调用 `split_source_to_chapters` 工具，跳过 Subagent。

---

## Mode C · extract_assets（资产提取）

剧本生成后，从剧本中识别角色/场景/道具/线索。这是本 Skill 最常用的模式。

### 提取类别

#### 1) 角色（character）
```yaml
fields:
  name: 全名（如有别名记入 aliases）
  aliases: [字符串列表]
  role_type: protagonist | supporting | extra
  appearance:               # 300–500 字外貌描述
    gender: male | female | other
    age_range: child | teen | young_adult | adult | elder
    body_type: slim | average | muscular | plump
    facial: 面部特征（脸型、五官、肤色、特殊标记）
    hair: 发型 + 发色
    clothing: 默认服装
    distinguishing_features: 显著辨识特征（疤痕、眼镜、纹身等）
  personality_tags: [3–5 个性格标签]
  identity_anchors:         # ← moyin 6 层身份锚点（关键！）
    face_shape: ...
    hair_signature: ...
    color_palette: ...      # 主色调（建议 2-3 色 hex）
    silhouette: ...
    signature_prop: ...     # 标志性道具
    scene_context: ...      # 角色常出现的环境
  background: 角色背景与关系
```

#### 2) 场景（scene）
```yaml
fields:
  location: 具体地点
  time_of_day: 时间段
  ambience: 氛围描述
  lighting: 光线（自然光/灯光/混合）
  era: 时代背景（如清朝/民国/现代/未来）
  prompt_en: 用于图像模型的英文提示词（纯背景，不含人物）
```

#### 3) 道具（prop）
```yaml
fields:
  name: 道具名
  prop_type: daily | weapon | vehicle | decoration | symbolic
  description: 外观与用途
  importance: low | medium | high
  prompt_en: 英文提示词
```

#### 4) 线索（clue）— 仿 ArcReel "Clues"
跨镜追踪的关键视觉元素，**和道具的区别**：
- prop 是"可以多次出现的物件"（咖啡杯）
- clue 是"必须保持视觉连续的关键元素"（带血手帕、定情信物、刻字怀表）

```yaml
fields:
  name: 线索名
  trace_episodes: [出现的集数]
  visual_anchor: 必须保持一致的视觉特征
  reference_image: （第一次出现后留档）
```

---

### 提取流程（Mode C）

```
1. read_episode_script(episode_id)
2. read_existing_assets(project_id)        ← 跨剧本去重
3. analyze_with_llm(script, existing)
4. classify candidates:
     - 已存在 → 关联到本集
     - 新角色/场景/道具/线索 → 入库
5. save_dedup_*()
6. 返回摘要
```

### 去重规则（关键）

| 情形 | 处理 |
|---|---|
| 同名角色（"小红" == "林小红"） | 用 LLM 判断是否同一人，是则合并 + 加 alias |
| 同地点同时间的场景（"咖啡厅 黄昏" 与已有 "Cafe 黄昏"） | 视为重复，复用已有 |
| 道具名称相似但用途不同（"剑" 与 "短剑"） | 保留为两个独立 |
| 线索：第一次出现已入库，后续集再次出现 | **必须**关联到 trace_episodes，不要重复创建 |

> ⚠️ 项目可能跨多集，**不要重扫整个项目**重新生成资产，只补齐当前集需要的。

---

## 输出格式

提取结束后调用 `save_dedup_*` 保存，并返回给 Orchestrator：

```json
{
  "status": "success",
  "summary": {
    "characters": { "new": 2, "reused": 1 },
    "scenes": { "new": 4, "reused": 0 },
    "props": { "new": 3, "reused": 1 },
    "clues": { "new": 1, "reused": 0 }
  },
  "highlights": [
    "新角色：林小红 (主角)",
    "新场景：海边小屋 (黄昏)",
    "新线索：刻字怀表 (将出现在 ep1, ep3, ep5)"
  ],
  "next_action_hint": "03-art-director"
}
```

---

## 关键质量要求

### 角色 appearance 字段
- **必须 300–500 字**（少了画不出来，多了浪费 token）
- 必须覆盖：性别、年龄、体型、面部、发型、服装、辨识特征
- **避免**：抽象形容词（"美丽"、"邪恶"），具体词代替（"圆脸杏眼"、"刀疤左颊"）

### 6 层身份锚点（重要！）
仿 moyin-creator，每个角色必须填齐 6 个锚点字段。这是后续保持视觉一致性的关键：

| 锚点 | 含义 | 示例 |
|---|---|---|
| face_shape | 脸型基础几何 | "椭圆 + 尖下巴" |
| hair_signature | 发型识别签名 | "齐耳短发 + 右侧发卡" |
| color_palette | 主色调 hex | "#1F2937 + #F59E0B" |
| silhouette | 整体剪影特征 | "高瘦 + 直立姿态" |
| signature_prop | 标志性道具 | "金丝眼镜" |
| scene_context | 常出现的环境 | "图书馆/书房" |

### 提示词（prompt_en）
- 用英文（多数图像模型对英文 prompt 更敏感）
- **不要包含人物**（场景图就是纯背景）
- **不要包含画风**（画风由 03-art-director 单独注入）
- 包含：location + time + lighting + atmosphere + camera hint

---

## 反模式

❌ 把每个一闪而过的群演都建档（noise）  
❌ 漏掉关键线索（怀表、信物等）  
❌ 角色 appearance 写"美丽的女子"（过于抽象）  
❌ 跨集重新提取已存在的角色（应去重）  
❌ 把"画风词"写进 scene.prompt_en（污染画风系统）

---

## 配套工具实现要点（提示给后端实现者）

```python
# tools/asset_extraction.py 大致需要实现：

def read_episode_script(episode_id: int) -> dict: ...
def read_existing_assets(project_id: str) -> dict: ...

def save_dedup_characters(project_id, episode_id, candidates: list[dict]) -> dict:
    """
    1. 加载 project.json.assets.characters
    2. 对每个 candidate，用 LLM 判断是否与已有重复（语义匹配）
    3. 重复则关联到 episode；不重复则新建
    4. 写回 project.json，并把第一参考图槽位预留
    """
```
