---
name: script-writer
description: 把原著小说或故事大纲改写为格式化剧本（场景头 + 动作描写 + 对白）。当用户说"写剧本"、"改编"、"改写为剧本"或 Orchestrator 检测到剧本未生成时使用。
agent_type: subagent
content_modes: [drama, narration]
required_tools:
  - read_episode_source       # 读取本集对应的章节内容
  - read_project_settings     # 获取目标语言/时长/风格
  - rewrite_to_screenplay     # 调用 LLM 完成改写
  - validate_script_schema    # 校验产出的 JSON
  - save_script
---

# 剧本改写指南

> 灵感来源：`huobao-drama` `script_rewriter` skill。本指南合并了短剧节奏控制 + drama/narration 双模 + 角色语言一致性的关键准则。

## 改写原则

1. **保留核心情节**：不改变主线故事和主要角色关系。
2. **增强画面感**：把叙述性文字转为可视化场景（动作 + 表情 + 环境）。
3. **对话驱动**：用对白推动情节，减少旁白；旁白超过 30% 视为偏离。
4. **节奏紧凑**：每场戏 30–60 秒，单集总时长按用户输入约束。
5. **不写镜头语言**：不涉及景别/角度/运镜（这些属于 [05-storyboard-breaker](../05-storyboard-breaker/SKILL.md)）。
6. **角色语言一致**：每个角色保持固定语气；先在第一次出场时定型。

---

## 输出 Schema（drama 模式）

```json
{
  "episode_id": 1,
  "content_mode": "drama",
  "target_duration_sec": 120,
  "scenes": [
    {
      "scene_id": "S01",
      "indoor_outdoor": "indoor",
      "location": "咖啡厅",
      "time_of_day": "黄昏",
      "stage_direction": "黄昏光线透过落地窗洒进咖啡厅，吧台上咖啡杯热气升腾。小明坐在角落卡座，低头看手机，神情焦虑。",
      "dialogue": [
        { "character": "小红", "emotion": "微笑", "line": "等很久了吗？" },
        { "character": "小明", "emotion": "抬头", "line": "还好，刚到。" }
      ],
      "transition_to_next": "cut",
      "estimated_duration_sec": 12
    }
  ]
}
```

### 输出 Schema（narration 模式）

```json
{
  "episode_id": 1,
  "content_mode": "narration",
  "target_duration_sec": 90,
  "segments": [
    {
      "segment_id": "N01",
      "narration_text": "这是一个发生在 1990 年代北方小城的故事。",
      "visual_hint": "1990 年代北方小城街景，旧式自行车，灰蓝色调",
      "estimated_duration_sec": 8
    }
  ]
}
```

---

## 改写步骤

1. **调用 `read_project_settings`**，获取：
   - `target_language`（默认 zh-CN）
   - `target_duration_sec`（用户指定的本集目标时长）
   - `art_style`（影响台词文风，如"国风"vs"现代都市"）
   - `content_mode`（drama / narration）

2. **调用 `read_episode_source`**，读取本集对应的章节原文（**只读本集需要的章节**，不要把整本小说塞进上下文）。

3. **分析原文结构**：
   - 对白比例 / 心理描写比例 / 叙述比例
   - 主要角色及其语言风格
   - 情节关键节点

4. **改写为目标 schema**：
   - drama 模式：先列场景骨架，再填动作描写，最后落对白
   - narration 模式：按朗读节奏拆段落（每段 5–15 秒可朗读完）

5. **调用 `validate_script_schema`** 校验产出。

6. **调用 `save_script`** 保存到 `projects/<name>/scripts/episode_<N>.json`。

7. **返回摘要**给 Orchestrator：
   ```
   ✅ episode_1.json 已生成
   - 6 个场景, 预估 2 分 04 秒
   - 主要角色：小红, 小明, 老板
   - 对白比例 68%（健康）
   ```

---

## 关键工程约束

### 时长估算
- 中文对白：约 4 字/秒
- 英文对白：约 2.5 词/秒
- 动作镜头无对白：默认 3 秒
- 单场景估算 = 对白时长 + 动作时长 + 转场缓冲 (1s)

### 场景头格式（drama）
```
{indoor|outdoor} · {location} · {time_of_day}
```
- 例："indoor · 咖啡厅 · 黄昏"
- 不要把"白天"作为 time_of_day，要具体（清晨/正午/黄昏/深夜）

### 角色姓名规范
- 第一次出场用全名（"林小红"），之后保持一致
- 不要混用"小红"和"林小红"
- 如有多个同名角色，用"林小红 (大学生)"区分

### 对白风格
- 保留原著的语气词（"嘛"、"呗"、"诶"）
- 不要把所有人都改成普通话标准语
- emotion 字段用一个动词或形容词（"微笑"、"愤怒"、"哽咽"）

### 节奏检查
- 单场景 ≤ 60 秒（超过时拆分）
- 单场景对白 ≤ 6 轮（超过时拆分或并入动作）
- 全集 scenes 数：10–25 之间（少了张力不够，多了节奏散）

---

## 常见错误

| ❌ 错误做法 | ✅ 正确做法 |
|---|---|
| 把心理活动直接写出来 | 转化为表情/动作或画外音 |
| 用 `（旁白）` 大段叙述 | 用动作描写 + 简短对白替代 |
| 一场戏 5 分钟 | 拆成 3-5 场 |
| 加镜头语言 "近景"/"特写" | 留给 storyboard-breaker |
| 改主角名字让"更现代" | 严格保留原著姓名 |
| 大量改造剧情 | 只做画面化、对话化改写 |

---

## 多语言支持

如果 `target_language` 不是 zh-CN：
- 先用源语言（中文）生成完整 JSON
- 再调用一次 LLM 把 `dialogue.line` 和 `stage_direction` / `narration_text` 翻译为目标语言
- character/location 保持原文（避免 storyboard 阶段角色名错乱）

---

## 返回给 Orchestrator 的摘要格式

```json
{
  "status": "success",
  "artifact_path": "projects/xx/scripts/episode_1.json",
  "summary": {
    "scenes_count": 6,
    "estimated_duration_sec": 124,
    "characters": ["小红", "小明", "老板"],
    "dialogue_ratio": 0.68,
    "warnings": []
  },
  "next_action_hint": "02-asset-extractor (extract_assets)"
}
```

不要把整个 script JSON 内容回传给 Orchestrator，让它通过 artifact_path 自取。
