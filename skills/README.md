# Agents Studio · Skills

> 一套 11 个 Markdown SKILL.md，把"小说 → 短剧成片"的全流程拆成可并行调度的 Subagent。
>
> **现在就能用**：把整个 `skills/` 目录拷进任意支持 Skill 协议的 Agent Runtime（Claude Agent SDK / Cursor / Cline / Kiro），不需要后端就能跑通 70% 的流程。

## Skill 列表

| 序号 | Skill | 类型 | 何时使用 | 关键参考 |
|---|---|---|---|---|
| **00** | [orchestrator](./00-orchestrator/SKILL.md) | Orchestrator | 任何短剧/漫剧创作请求的入口；状态机检测 + dispatch | ArcReel `manga-workflow` |
| **01** | [script-writer](./01-script-writer/SKILL.md) | Subagent | 把原著或大纲改写为格式化剧本 | huobao `script_rewriter` |
| **02** | [asset-extractor](./02-asset-extractor/SKILL.md) | Subagent | 从剧本抽取角色/场景/道具/线索 | huobao `extractor` + ArcReel "全局角色/线索提取" |
| **03** | [art-director](./03-art-director/SKILL.md) | Subagent | 画风定调（生成或选择 art-style） | lumenx Step 2 + Toonflow art_skills |
| **04** | [character-designer](./04-character-designer/SKILL.md) | Subagent | 角色一致性定妆（全身→三视图→头像→衣橱→6层身份锚点） | lumenx Step 3 + moyin 6 层锚点 |
| **05** | [storyboard-breaker](./05-storyboard-breaker/SKILL.md) | Subagent | 把剧本拆为分镜序列 | huobao `storyboard_breaker` |
| **06** | [keyframe-generator](./06-keyframe-generator/SKILL.md) | Subagent | 生成 Start/End/宫格关键帧 | BigBanana 关键帧驱动 + huobao 宫格图 |
| **07** | [video-generator](./07-video-generator/SKILL.md) | Subagent | 调视频模型生成片段 | huobao multi-adapter + ArcReel |
| **08** | [voice-assigner](./08-voice-assigner/SKILL.md) | Subagent | 为角色分配 TTS 音色 | huobao `voice_assigner` |
| **09** | [tts-synthesizer](./09-tts-synthesizer/SKILL.md) | Subagent | 合成对白配音 | huobao MiniMax + Pixelle Edge-TTS |
| **10** | [video-composer](./10-video-composer/SKILL.md) | Utility | FFmpeg 拼接 + 转场 + BGM | ArcReel `compose-video` |

## 状态机：Orchestrator 怎么调度它们

详见 [`00-orchestrator/SKILL.md`](./00-orchestrator/SKILL.md)。简版：

```
project.json 检测                                         → Dispatch
─────────────────────────────────────────────────────────────────
源文件已上传 + 章节未切分                                → 02-asset-extractor (peek + split)
章节已切分 + 剧本未生成                                   → 01-script-writer
剧本已生成 + 角色/场景未提取                             → 02-asset-extractor (extract)
资产已提取 + 画风未确定                                   → 03-art-director
画风已确定 + 角色定妆未生成                              → 04-character-designer
所有资产就位 + 分镜未拆                                   → 05-storyboard-breaker
分镜就位 + 关键帧未生成                                   → 06-keyframe-generator
关键帧就位 + 视频未生成                                   → 07-video-generator
视频就位 + 音色未分配                                     → 08-voice-assigner
音色已分配 + 配音未合成                                   → 09-tts-synthesizer
全部就位                                                  → 10-video-composer
```

## Skill 编写约定

每个 Skill 目录约定为：

```
<skill-id>/
  SKILL.md           # 必需，YAML frontmatter + 指南内容
  scripts/           # 可选，可被 Skill 直接调用的脚本
  reference/         # 可选，被 SKILL.md 引用的子模板
  examples/          # 可选，输入输出示例
```

**SKILL.md 头部必须包含**：

```yaml
---
name: <skill-id>
description: <一句话+触发词，给上层 LLM 做语义路由>
agent_type: orchestrator | subagent | utility
content_modes: [drama, narration]   # 可选，限定模式
required_tools:                       # 必需的 MCP/Tool
  - tool_name_1
  - tool_name_2
---
```

> 详见 [`docs/ARCHITECTURE.md` § 4](../docs/ARCHITECTURE.md#4-skill-体系)。

## 工具（Tool）实现说明

本仓库的 Skill **只描述"做什么"**，不内嵌"怎么做"。具体的 MCP / Tool 实现需要后端接管。当前阶段的 4 种使用方式：

1. **Mock 模式**：Agent 用占位输出（`# TODO: implement read_storyboard_context`），快速验证流程编排
2. **Local Tool**：在 Cursor/Cline/Kiro 中把 tool 实现为本地 Python/TS 函数
3. **MCP Server**：未来 M1+ 阶段提供 `studio-mcp-server`，按 [`packages/asset-spec/`](../packages/asset-spec/) 实现所有 tool
4. **真后端调用**：M2 阶段 FastAPI server 暴露 `/api/v1/tools/*` 路由

## 试用

```bash
# 在任何支持 Skill 的 Agent 中
# 示例：Cursor / Claude Code / Kiro

# 1. 把整个 skills/ 目录指向 .claude/skills/ 或等价位置
ln -s skills .claude/skills

# 2. 跟 Agent 对话
> 我有一篇 5000 字短篇小说，想做一个 2 分钟的国风短剧，主题是仙侠

# Orchestrator 会自动：
# - 检测到无 project.json → 引导创建项目
# - 检测到无剧本 → dispatch 01-script-writer
# - 逐步走完 11 个步骤
# - 在每个步骤之间向你确认
```
