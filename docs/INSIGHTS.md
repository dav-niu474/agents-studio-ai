# 9 个 AI 短剧/漫剧仓库深度洞察分析

> 基于对 `Toonflow-app / huobao-drama / ArcReel / Jellyfish / moyin-creator / waoowaoo / BigBanana-AI-Director / lumenx / Pixelle-Video` 的源码级阅读，外加 MovieFlo.AI / Google Flow 的功能调研。
>
> 阅读目标：**找出做得最好的部分，挑出可以直接复用的代码，提炼出值得抄进 Agents Studio 的设计模式。**

---

## 1. 一图看清楚这 9 个项目的取向

| # | 项目 | 定位 | 技术栈 | 形态 | 是否开源 | 最值得抄 |
|---|---|---|---|---|---|---|
| 1 | **Toonflow-app** | AI 短剧无限画布工作台 | TS + Express + Electron + SQLite + Vercel AI SDK | 桌面客户端 | ✅ Apache-2.0 | **画风 Skill 包**、三层 Agent(决策/执行/监督)、可编程供应商、章节事件图谱 |
| 2 | **huobao-drama** | AI 短剧自动化生产平台 | TS + Hono + Drizzle + Mastra Agent + Vue/Nuxt | Web 全栈 | ✅ CC-BY-NC-SA | **最简洁标准的 SKILL.md 形式**、Provider Adapter 接口、5 个核心 Agent |
| 3 | **ArcReel** | 小说 → 短视频 AI Agent 工作台 | Python + FastAPI + React 19 + Claude Agent SDK | Web/Docker | ✅ AGPL-3.0 | **编排 Skill + 聚焦 Subagent 模式**、SessionActor 串行化、bwrap 沙箱、Backend Registry |
| 4 | **Jellyfish** | AI 短剧端到端工作台 | Python + FastAPI + React + MySQL/Redis/RustFS | Web 全栈 | ✅ Apache-2.0 | **Shot-Readiness 状态机**、全局 Task Center、资产实体共享模型 |
| 5 | **moyin-creator** | AI 影视生产级桌面工具 | Electron 30 + React 18 + Zustand + Tailwind | 桌面客户端 | ✅ AGPL-3.0 | **6 层身份锚点角色一致性**、@Image/@Video/@Audio 多模态引用、Seedance 2.0 多镜头合并 |
| 6 | **waoowaoo** | AI 影视 Studio | Next.js 15 + Prisma + MySQL + BullMQ | Web 全栈 | ✅ 自定义协议 | **BullMQ 任务队列工程化**、SSE 流式 |
| 7 | **BigBanana-AI-Director** | AI 漫剧工场 | 仅 Docker | 闭源 Docker | ❌ 仅镜像 | **关键帧驱动 (Start/End Frame 插值)**、Project→Season→Episode 三级、内置 CutOS 粗剪 |
| 8 | **lumenx** | AI 短漫剧一站式平台 (阿里) | Python + FastAPI + Next.js 14 | Web 全栈 | ✅ MIT | **6 阶段 SOP 流程模型**、资产先全身图再衍生三视图、Vendor-Direct 接入模式 |
| 9 | **Pixelle-Video** | AI 全自动短视频引擎 | Python + ComfyUI | Streamlit Web | ✅ Apache-2.0 | **Pipeline 抽象 + ComfyUI 工作流可替换**、模板引擎 (HTML 按尺寸分组) |

> **取向分布**：4 个走「短剧/漫剧 IP 改编」（Toonflow / huobao / ArcReel / lumenx / BigBanana / moyin），2 个偏「短视频原子能力」（Pixelle / waoowaoo），1 个聚焦「资产工程化」（Jellyfish）。

### 1.1 工程成熟度排名（综合源码质量、测试覆盖、CI、文档完备度）

```
ArcReel  >  lumenx  >  Pixelle-Video  >  Jellyfish  >  Toonflow  >  huobao-drama  >  moyin  >  waoowaoo  >  BigBanana(闭源)
```

**ArcReel 是综合最强参考**：基于 Claude Agent SDK 把 Skill / Subagent / Sandbox / Session / 多供应商 Adapter 全部做完，且有 AGENTS.md / CONTRIBUTING.md / 完整 alembic 迁移 / pre-commit hooks / pytest + basedpyright + ruff。

---

## 2. AI 短剧创作平台的核心需求 —— 提炼自 9 个项目的共性

把 9 个项目对外宣传的核心能力做关键词聚类，可以归纳出 **8 个真正不可缺的核心需求**：

### 2.1 关键需求矩阵

| 核心需求 | 含义 | 在哪些项目里出现 | 重要程度 |
|---|---|---|---|
| **R1. 长文本结构化** | 小说/原著 → 章节 → 单集 → 场景 → 分镜，逐级拆解，且能精确切片 | 全部 9 个 | ⭐⭐⭐⭐⭐ |
| **R2. 资产一致性管理** | 角色/场景/道具/服饰跨镜头身份一致，不漂移 | Toonflow / ArcReel / Jellyfish / lumenx / moyin / BigBanana | ⭐⭐⭐⭐⭐ |
| **R3. 多供应商能力调度** | 文本/图像/视频/TTS 模型可热切换，无单点依赖 | huobao / ArcReel / Toonflow / lumenx | ⭐⭐⭐⭐⭐ |
| **R4. 关键帧驱动视频生成** | 精控起止画面，避免「抽卡式」失控 | BigBanana / Toonflow / huobao(宫格图) / ArcReel | ⭐⭐⭐⭐⭐ |
| **R5. 异步任务编排** | 视频生成是分钟级长任务，必须有队列、重试、断点续传 | ArcReel / Jellyfish / waoowaoo / moyin | ⭐⭐⭐⭐⭐ |
| **R6. 画风/视觉风格统一** | 全片统一 LUT/风格锚点，支持快速切换 | Toonflow / lumenx / Pixelle | ⭐⭐⭐⭐ |
| **R7. 配音 + 音效 + BGM** | 多角色 TTS、音色匹配、唇形同步、BGM 混音 | huobao / ArcReel / moyin / Pixelle | ⭐⭐⭐⭐ |
| **R8. 成片导出 + 二次编辑** | 直接出 mp4，或导剪映/PR 草稿继续后期 | ArcReel / BigBanana / Pixelle / Toonflow | ⭐⭐⭐ |

### 2.2 8 个项目都还不够好的地方（Agents Studio 的机会窗口）

| 痛点 | 现状 | Agents Studio 的机会 |
|---|---|---|
| **Skill 与 UI 强耦合** | 大部分项目把提示词锁死在代码里（lumenx/Jellyfish），或把 SKILL 散落在 frontmatter/数据库（Toonflow） | 用 **huobao-drama 风格的 Markdown SKILL + ArcReel 风格的 manifest** 做"可外编辑、可热加载" |
| **多智能体调度无标准** | huobao 是单 agent + tool list；Toonflow 是三层 agent；ArcReel 是 Skill+Subagent；其他多数没有 | 直接采纳 **ArcReel 的"编排 Skill 调度聚焦 Subagent"模式**，最干净 |
| **资产 Schema 各异** | character/scene/prop 各家字段都不一样，难以跨项目复用 | 用 **ArcReel 的 `asset_types.py` 思路**做统一 spec |
| **关键帧驱动碎片化** | BigBanana 闭源、Toonflow 提了概念但实现散乱、huobao 的宫格图独立 | 把 **关键帧 (Start/End/宫格)** 作为一等公民统一建模 |
| **画风扩展机制薄弱** | 大部分要改代码加画风；只有 Toonflow 有完整 art_skills 目录 | 直接抄 **Toonflow 的 `art_skills/<style>/` 包结构** |
| **缺乏可对话编排** | 大部分还是「填表单 → 点按钮」的 UI 流；只有 ArcReel 真的能「直接对话生成短剧」 | 把 **整个流程做成 Agent 对话可驱动**，UI 是次要的 |
| **跨集复用差** | 资产/世界观难跨集继承（除 BigBanana 的 Project→Season→Episode） | 显式建模 **三级容器**：Project/Season/Episode + 全局 Asset Library |

---

## 3. 核心模块拆解 —— Agents Studio 应该有哪些模块

> 把 9 个项目的模块做并集，再去掉重复和冗余，得到 **6 大核心域 + 22 个核心模块**。

```
┌────────────────────────────────────────────────────────────────────┐
│                       Agents Studio AI                              │
│                                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────────┐ │
│  │ A. 内容域   │  │ B. 资产域    │  │ C. 制作域                 │ │
│  │             │  │              │  │                           │ │
│  │ A1 项目管理 │  │ B1 角色库    │  │ C1 关键帧/分镜图生成     │ │
│  │ A2 章节切分 │  │ B2 场景库    │  │ C2 视频片段生成           │ │
│  │ A3 剧本生成 │  │ B3 道具库    │  │ C3 配音 (TTS)             │ │
│  │ A4 分镜拆解 │  │ B4 服饰库    │  │ C4 BGM/音效               │ │
│  │ A5 章节事件 │  │ B5 画风包    │  │ C5 视频拼接 + 转场        │ │
│  │    图谱     │  │ B6 世界观    │  │ C6 剪映/PR 草稿导出      │ │
│  └─────────────┘  └──────────────┘  └───────────────────────────┘ │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ D. Agent 域                                                  │  │
│  │  D1 Skill Loader (Markdown SKILL.md 热加载)                 │  │
│  │  D2 Agent Orchestrator (编排 Skill)                         │  │
│  │  D3 Focused Subagents (单一任务、收摘要返回)                │  │
│  │  D4 Session Actor (会话级 asyncio task 串行化)              │  │
│  │  D5 Tool Sandbox (bwrap/Windows 降级)                       │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────┐  ┌──────────────────────────────────┐ │
│  │ E. 模型域               │  │ F. 基础设施域                    │ │
│  │  E1 Image Backend Reg.  │  │  F1 Async Task Queue             │ │
│  │  E2 Video Backend Reg.  │  │  F2 Project File Manager         │ │
│  │  E3 Text Backend Reg.   │  │  F3 Version Manager              │ │
│  │  E4 TTS Backend Reg.    │  │  F4 Usage Tracker / Cost Calc.   │ │
│  │  E5 Custom Provider     │  │  F5 SSE Event Bus                │ │
│  │  E6 Prompt Compiler     │  │                                  │ │
│  └─────────────────────────┘  └──────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

### 3.1 模块来源映射（每个模块从哪个项目最值得抄）

| 模块 | 主参考 | 备选参考 | 复用难度 |
|---|---|---|---|
| **A1 项目管理** | ArcReel `lib/project_manager.py` | BigBanana 三级模型 | 低 |
| **A2 章节切分** | ArcReel "渐进式分集规划"（peek → 建议断点 → 用户确认） | Toonflow 章节事件图谱 | 中 |
| **A3 剧本生成** | huobao `script_rewriter` Agent | Toonflow scriptAgent | 低 |
| **A4 分镜拆解** | huobao `storyboard_breaker`（最完整字段定义） | ArcReel split-narration / drama-script subagent | 低 |
| **A5 章节事件图谱** | Toonflow（独有，结构化抽取章节事件） | — | 高 |
| **B1-B4 资产库** | ArcReel `asset_types.py` 统一 Spec | Jellyfish 资产实体 | 低 |
| **B5 画风包** | Toonflow `data/skills/art_skills/<style>/` | — | 低 |
| **B6 世界观** | BigBanana（地图/区域/地点/音乐风格） | — | 中 |
| **C1 关键帧生成** | BigBanana 关键帧驱动 + huobao 宫格图（grid_4/6/9） | ArcReel `lib/grid/` | 中 |
| **C2 视频生成** | huobao 多 Adapter | ArcReel `video_backends/` | 低 |
| **C3 TTS** | huobao MiniMax adapter | Pixelle TTS pipeline | 低 |
| **C4 BGM/音效** | huobao（分镜级 bgm_prompt + sound_effect） | Pixelle bgm/ 目录 | 低 |
| **C5 拼接+转场** | ArcReel `compose-video` skill (xfade) | Pixelle `pipelines/standard.py` | 低 |
| **C6 剪映导出** | ArcReel `jianying_draft_service.py` | — | 中 |
| **D1 Skill Loader** | huobao `agents/skills.ts` (~30 行) | ArcReel profile manifest | 低 |
| **D2 Orchestrator** | ArcReel `manga-workflow` 编排 Skill | Toonflow 三层 Agent | 中 |
| **D3 Subagent** | ArcReel `.claude/agents/` | — | 中 |
| **D4 SessionActor** | ArcReel `session_actor.py` | — | 中 |
| **D5 Sandbox** | ArcReel bwrap 集成 | — | 高 |
| **E1-E4 Backend Reg.** | huobao `services/adapters/registry.ts` + `types.ts` | ArcReel `lib/image_backends/` | 低 |
| **E5 Custom Provider** | ArcReel `lib/custom_provider/`（自动 `/v1/models` 发现） | Toonflow 可编程供应商 | 中 |
| **E6 Prompt Compiler** | moyin `@opencut/ai-core`（含角色圣经） | Toonflow art_storyboard_video.md | 中 |
| **F1 Task Queue** | ArcReel `GenerationQueue` (lease-based, image/video 双通道) | waoowaoo BullMQ | 低 |
| **F2 File Manager** | ArcReel `ProjectManager` + `_safe_subpath` | — | 低 |
| **F3 Version Manager** | ArcReel `VersionManager`（每次重生成自动留档+回滚） | — | 中 |
| **F4 Usage / Cost** | ArcReel `UsageTracker` + `CostCalculator`（按供应商分策略） | — | 中 |
| **F5 SSE Event Bus** | ArcReel `/events/stream` + Jellyfish task center | waoowaoo SSE | 低 |

---

## 4. 直接可复用代码模块 —— 抄一行少一行

> 以下条目按「**复用价值 × 代码就绪度**」排序，每条都标注源文件路径与改造工作量。

### 🥇 Tier-1：直接搬运，几乎无需改

#### (a) huobao-drama 的 SKILL.md 规范（最重要）
- **源**：`huobao-drama/skills/<agent>/SKILL.md`
- **形式**：YAML frontmatter (`name` + `description`) + 角色提取规范 + 使用步骤 + 工具调用 + 校验规则
- **价值**：这是 9 个项目里**最干净、最像 Anthropic Skill 协议**的写法。完全可以一字不改用作 Agents Studio 的 Skill 标准。
- **复用方式**：拷贝目录结构 + 内容，把工具名（如 `read_script_for_extraction`）映射到自己的 MCP/Tool 实现即可。
- **改造工作量**：⭐ (零)

#### (b) huobao-drama 的 Provider Adapter 接口
- **源**：`huobao-drama/backend/src/services/adapters/types.ts` + `registry.ts`
- **形式**：四个接口（`ImageProviderAdapter` / `VideoProviderAdapter` / `TTSProviderAdapter` / `AIConfig`）+ 一个 `Record<string, Adapter>` 注册表
- **价值**：~120 行 TS 接口 + 注册表 + 10 个具体 adapter 文件，**已经覆盖了 OpenAI / Gemini / MiniMax / 火山 / 阿里 / Vidu**，完全够用。
- **复用方式**：直接拷 `services/adapters/*` 整个目录，删除 `huobao` 业务字段后即可作为 Agents Studio 的 `packages/adapters` 起点。
- **改造工作量**：⭐ (零，最多 1 小时)

#### (c) ArcReel 的 compose-video Skill（FFmpeg 拼接）
- **源**：`ArcReel/agent_runtime_profile/.claude/skills/compose-video/`
- **形式**：完整的 SKILL.md + `scripts/compose_video.py`，支持按 `transition_to_next` 走 xfade、混 BGM、关闭转场
- **价值**：这是**真正可执行的 Skill 范例**，含 CLI 用法 / 适用范围 / 转场映射表 / 限制说明。Agents Studio 的 `skills/12-video-composer/` 可以照抄。
- **改造工作量**：⭐⭐ (~半天)

#### (d) Toonflow 的画风包结构
- **源**：`Toonflow-app/data/skills/art_skills/<style>/`
- **目录结构**：
  ```
  <style>/
    README.md
    prefix.md                                   # 风格前缀，所有图都拼上
    images/1.png                                # 风格示例图
    art_prompt/
      art_character.md / art_character_derivative.md
      art_scene.md     / art_scene_derivative.md
      art_prop.md      / art_prop_derivative.md
      art_storyboard_video.md
    director_skills/
      director_planning_style.md
      director_storyboard.md
      director_storyboard_table_style.md
  ```
- **价值**：这是 9 个项目里**唯一**把"画风"做成可热插拔扩展包的，且每个画风包内都有完整的 character/scene/prop/storyboard 提示词模板和「情绪→面容词映射」「光影氛围词库」「美学禁止项」。
- **复用方式**：直接拷整套 art_skills 目录到 `art-styles/`，按需保留 2-3 个常用画风（如 2D_chinese_guofeng / 2D_90s_japanese_anime / 3D_pixar）。
- **改造工作量**：⭐ (零)

### 🥈 Tier-2：按业务改造后复用，主体结构保留

#### (e) ArcReel 的 GenerationQueue + Worker
- **源**：`ArcReel/lib/generation_queue.py` + `generation_worker.py`
- **特点**：基于 SQLAlchemy ORM 的 lease-based 任务队列，**image / video 两条独立并发通道**（避免互相饿死），支持断点续传、RPM 限速、SSE 状态推送
- **改造**：把 ArcReel 里耦合的 Project/Episode 字段抽出来用泛型；如要替换为 BullMQ（waoowaoo 风格）也只需重写持久层
- **改造工作量**：⭐⭐⭐ (~2-3 天)

#### (f) ArcReel 的 SessionActor 模式
- **源**：`ArcReel/server/agent_runtime/session_actor.py`
- **特点**：每个会话一个专属 `asyncio.Task`，串行化所有 Claude SDK 调用，避免 race condition；支持 SSE 订阅
- **价值**：解决了「多用户并发对话不要互相串台」「同一会话内工具调用要串行」两个真问题
- **改造工作量**：⭐⭐⭐ (~2 天)

#### (g) huobao-drama 的 5 个核心 Agent（Mastra 实现）
- **源**：`huobao-drama/backend/src/agents/index.ts` + `tools/`
- **覆盖**：`script_rewriter` / `extractor` / `storyboard_breaker` / `voice_assigner` / `grid_prompt_generator`
- **价值**：每个 Agent 都有清晰的 tool 列表 + Skill 注入逻辑（见 `agents/skills.ts`，仅 30 行）；如果用 Mastra 框架可直接搬运
- **改造工作量**：⭐⭐ (~1-2 天，主要是切框架到自家 Agent SDK)

#### (h) Pixelle 的 Pipeline 抽象
- **源**：`Pixelle-Video/pixelle_video/pipelines/base.py`
- **特点**：`BasePipeline` 抽象类 + `progress_callback` + 共享 `core` 服务（llm/tts/media/video）
- **价值**：如果想做"非短剧"的旁路 pipeline（比如自动剪辑 / 数字人口播 / 动作迁移），这个抽象非常合适
- **改造工作量**：⭐⭐ (~1 天)

#### (i) ArcReel 的 lib/asset_types.py（资产 Spec 中央化）
- **特点**：character/scene/prop 三类资产的统一 spec（`ASSET_SPECS`），驱动路由工厂、bucket key、sheet 字段、PATCH 白名单
- **价值**：**新增资产类型时只需在 spec 注册**，不用改路由/数据库/前端逐个改
- **改造工作量**：⭐⭐ (~1 天)

### 🥉 Tier-3：思路/接口可借鉴，代码主要重写

| 模块 | 项目 | 借鉴点 |
|---|---|---|
| Custom Provider 自动发现 | ArcReel `lib/custom_provider/` | OpenAI/Google 兼容接口 + `/v1/models` 自动发现 + 媒体类型推断 |
| 6 层身份锚点 | moyin `@opencut/ai-core` | 角色一致性的 6 个维度（脸型/发型/配色/服饰/标志物/场景嵌入） |
| 章节事件图谱 | Toonflow | 自动从原著章节抽取事件并结构化存储 |
| Shot Readiness 状态机 | Jellyfish | `script_breakdown → shot_prep → candidate_confirm → ready → generation` |
| 多模态引用 @ 语法 | moyin Seedance 2.0 | `@Image:character/小红` 在视频 prompt 内引用资产 |
| 项目导出 ZIP | ArcReel `project_archive.py` + Jellyfish | 整项目打包归档 |

---

## 5. 架构模式对比 —— 9 种做法摆在一起看

### 5.1 部署形态

| 模式 | 项目 | 优点 | 缺点 |
|---|---|---|---|
| **桌面客户端** (Electron) | Toonflow / moyin | 数据本地、零运维 | 用户拉新成本高、跨设备难 |
| **Docker 单容器** | huobao / waoowaoo / Pixelle / ArcReel(默认) | 部署最简单 | 多用户场景需要前置 LB |
| **前后端分离 + DB** | Jellyfish / lumenx / ArcReel(production) | 工程化 / 多用户 | 部署复杂 |
| **闭源 SaaS + 镜像** | BigBanana / MovieFlo.AI | 商业化路径清晰 | 失去开源信任 |

> 推荐 Agents Studio 走 **「Docker 单容器（默认 SQLite）+ 可升级到 Postgres + 前后端分离」**，对齐 ArcReel 的 `deploy/` vs `deploy/production/` 双目录结构。

### 5.2 Agent 编排范式

| 模式 | 代表 | 形态 | 适合 |
|---|---|---|---|
| **单 Agent + 长 Tool 列表** | huobao-drama | 一个 Mastra Agent 持有 20+ tools，按对话分发 | 流程线性、工具有限 |
| **角色化多 Agent** | Toonflow（决策/执行/监督） | 三层 Agent 协作，含审阅与修订 | 强调质量稳定 |
| **编排 Skill + 聚焦 Subagent** | **ArcReel** | 一个 Orchestrator Skill 检测项目状态，dispatch 到只做一件事的 Subagent | **可中断、可恢复、上下文小** |
| **Pipeline 函数式** | Pixelle / lumenx | 一条 `text → narration → frame → video` 的纯函数 pipeline | 流程固定、自动化高 |

> **强推「编排 Skill + 聚焦 Subagent」模式**。原因：
> 1. **上下文经济**：小说原文等大量上下文留在 Subagent 内部，主 Agent 只收摘要
> 2. **可中断**：每个 Subagent 完成后向用户确认，符合短剧创作"边走边看"的本能
> 3. **状态自检测**：Orchestrator Skill 读 `project.json` 就能判断走到哪一步，天然支持任意阶段进入
> 4. **Skill vs Subagent 边界清晰**：Skill 做确定性脚本（拼视频、拷文件），Subagent 做需要推理的任务（提取角色、改写剧本）

### 5.3 多供应商接入策略

| 策略 | 代表 | 评价 |
|---|---|---|
| **Adapter 接口 + 注册表** | huobao-drama / ArcReel | ✅ 推荐：新增供应商只需写一个文件 |
| **运行时 TS 逻辑可编辑** | Toonflow（设置中心写代码即生效） | 🤔 创新但有安全风险 |
| **OpenAI 兼容统一中转** | huobao chatfire / Pixelle RunningHub | ⚠️ 简单但不利用各家特色能力 |
| **Vendor-Direct 切换** | lumenx (DashScope-only / +OSS / +Kling vendor) | ✅ 推荐：按模型家族切默认 |
| **MCP 工具桥** | ArcReel + OpenClaw | 🆕 新趋势，可组合外部 Agent |

> **推荐采用：Adapter 接口为主 + Vendor-Direct 切换为辅 + 自定义供应商兜底（OpenAI/Google 兼容自动 `/v1/models` 发现）**。

### 5.4 资产一致性策略对比

| 策略 | 项目 | 实现方式 | 一致性强度 |
|---|---|---|---|
| **角色定妆照 + 文本描述** | huobao | 一张主参考图 + appearance 字段 | ⭐⭐⭐ |
| **三视图 + 头像 + 衣橱** | lumenx / BigBanana | 全身图 → 三视图 → 头像 + 多套服饰 | ⭐⭐⭐⭐ |
| **6 层身份锚点** | moyin | 脸型/发型/配色/服饰/标志物/场景嵌入 | ⭐⭐⭐⭐⭐ |
| **角色圣经 (Character Bible)** | moyin / Toonflow | 结构化档案 + 跨集继承 | ⭐⭐⭐⭐ |
| **线索追踪 (Clues)** | ArcReel | 跨镜保持视觉连贯的"道具/场景元素" | ⭐⭐⭐⭐ |
| **风格参考图** | ArcReel | 上传后 AI 自动分析并应用到全片 | ⭐⭐⭐ |

> **推荐组合**：**lumenx 的"全身→三视图→头像→多服饰"** 流水线 + **moyin 的"6 层身份锚点"** 校验 + **ArcReel 的"线索追踪"** 跨镜继承。

### 5.5 视频生成策略对比

| 策略 | 项目 | 控制力 | 算力消耗 | 适合 |
|---|---|---|---|---|
| **纯文生视频** | Pixelle 部分 pipeline | 低 | 低 | 旁白/BGM 主导内容 |
| **图生视频（首帧驱动）** | huobao / lumenx 默认 | 中 | 中 | 通用短剧 |
| **首尾帧插值** | **BigBanana / huobao 首尾帧模式** | **高** | 中 | 精控运镜 |
| **宫格图生视频** | huobao / ArcReel grid_4/6/9 | 高 | 中 | 多分镜并行生图 |
| **参考生视频** | ArcReel reference_video / moyin Seedance | 中-高 | 高 | 跳过分镜直出 |
| **多镜头合并叙事** | moyin Seedance 2.0 | 高 | 高 | 长镜头连贯叙事 |

> **推荐**：把 **图生视频（默认）+ 首尾帧（精控）+ 宫格生视频（批量）+ 参考生视频（资产驱动）** 都做成 generation_mode 枚举，对 LLM 隐藏，由编排层注入。

---

## 6. 各项目的独特亮点 —— 不要错过的 N 个小创新

| 项目 | 独家亮点 | 为什么值得抄 |
|---|---|---|
| Toonflow | **可编程供应商**（在设置中心直接写 TypeScript 适配逻辑） | 极致灵活，私有化场景必杀 |
| Toonflow | **持久化 Agent 记忆**（ONNX 向量检索） | 跨会话连续创作 |
| Toonflow | **章节事件图谱**（结构化抽取章节事件） | 长文本忠于原著的关键 |
| Toonflow | **无限画布 UI** | 摆脱线性流程，支持并行回溯 |
| huobao-drama | **15 字段分镜模板**（含 image_prompt/video_prompt/bgm_prompt/sound_effect 分离） | 提示词工程的最佳实践 |
| ArcReel | **OpenClaw MCP 集成**（用 Bearer Token + 同步 Agent 端点暴露成 MCP 工具） | 把自己变成别人的 Agent 工具 |
| ArcReel | **bwrap 沙箱**（按白名单授权 fs/network/subprocess） | 工业级 Agent 安全 |
| ArcReel | **agent_runtime_profile/ 与 .claude/ 物理分离 + manifest+sha256 同步** | 防止本地脏改污染项目 |
| ArcReel | **Pre-flight 全自动方案审阅**（LLM 给出方案，用户逐镜头确认走九宫格还是首尾帧） | 控制成本与质量平衡 |
| Jellyfish | **Shot Readiness 状态机**（preparing 与 generating 解耦） | 工程上避免「生成中改剧本」混乱 |
| moyin | **N×N 首帧网格拼接 + Seedance 2.0 提示词三层融合**（动作 + 镜头语言 + 对白唇形） | 多镜头连贯叙事的工程化方案 |
| moyin | **多模态引用 @Image / @Video / @Audio** | Prompt 可携带资产，对接 Seedance 必备 |
| BigBanana | **关键帧驱动 + 项目→季→集** | 长篇连续剧的工程基础 |
| BigBanana | **CutOS 内置粗剪** | 不出工具就能做时间线编辑 |
| lumenx | **6 阶段 SOP 强引导**（Script → ArtDirection → Assets → StoryBoard → Motion → Assembly） | 给新手用户的最佳引导 |
| lumenx | **抽卡机制（多 Batch Size 生成 → Assembly 阶段择优）** | 「批生成 + 择优」是降低成本的关键 |
| Pixelle | **HTML 模板按尺寸分组**（1080x1920 / 1920x1080 / 1080x1080） | 短视频版式工程化 |
| Pixelle | **ComfyUI 工作流可替换** | 把生成能力交给 ComfyUI 生态 |
| waoowaoo | **BullMQ 任务队列** | Node 生态最成熟的队列方案 |

### 6.1 最值得直接抄进 Agents Studio 的 7 个

1. **huobao-drama 的 SKILL.md 形式**（已抄进 `skills/`）
2. **ArcReel 的 Skill+Subagent 模式 + manga-workflow Orchestrator**（已对应到 `skills/00-orchestrator/`）
3. **huobao-drama 的 Provider Adapter 接口**（已对应到 `packages/adapters/types.ts`）
4. **Toonflow 的 art_skills 画风包**（已对应到 `art-styles/`）
5. **lumenx 的 6 阶段 SOP**（已对应到 `skills/05-09` 的编号，并在前面加了 01-04 的"内容关卡"扩展）
6. **BigBanana 的关键帧驱动**（已对应到 `skills/08-keyframe-generator/`）
7. **moyin 的 6 层身份锚点 + @ 引用语法**（已对应到 `skills/06-character-designer/` 的"身份锚点"章节）

---

## 7. 给 Agents Studio 的 10 条核心设计判断

> 把上面所有分析压缩成 10 条可执行的设计原则。

1. **先 Skill 后后端**。整个项目的第一版必须是「Skill 集合 + Adapter 抽象」，无后端、无 UI 也能跑通流程。Skill 是 1st-class，UI 是 2nd-class。
2. **Skill 使用 huobao-drama 风格的 Markdown + YAML frontmatter**。不要用 JSON、不要嵌入数据库。
3. **采用 ArcReel 的「编排 Skill + 聚焦 Subagent」模式**，不要用单 Agent + 长 tools。
4. **资产 Schema 中央化**，仿 ArcReel `asset_types.py` 用一个 spec 驱动所有 CRUD。
5. **关键帧 (Start/End Frame + 宫格图)** 作为一等公民建模，不是单独功能。
6. **Image/Video/Text/TTS 后端用 Adapter 接口 + 注册表**，仿 huobao-drama，新增供应商只写一个文件。
7. **任务队列必须分通道**：image / video 至少两条并发通道，参照 ArcReel 的 lease-based 实现。
8. **画风作为热插拔扩展包**，仿 Toonflow `art_skills/<style>/`，不要写死在 prompt 里。
9. **生成模式（image2video / first_last / grid / reference_video）对 LLM 隐藏**，由编排层注入，参照 ArcReel 的设计。
10. **从一开始就引入 SessionActor**，每个对话会话一个专属 asyncio task，避免后期重构。

---

## 8. 各项目的"踩坑/缺陷"汇总 —— 不要重蹈覆辙

| 项目 | 已知问题 | Agents Studio 应规避 |
|---|---|---|
| Toonflow | 桌面端 + 内置前端导致前后端紧耦合，前端仓库需单独维护 | 默认 Web 优先，Electron 作为可选打包 |
| huobao-drama | TypeScript 全栈但 LLM 工程偏简单（单 Agent + tool 列表） | 上 Skill+Subagent 多智能体 |
| ArcReel | 体量大（uv.lock 530KB），新人上手陡 | 先做 MVP 子集 |
| Jellyfish | 资产 schema 写在 schemas/skills 里，与 SKILL.md 不是一个东西，容易混淆 | 严格区分 Skill (Markdown) vs Schema (Pydantic/Zod) |
| moyin | 桌面端依赖 npm 全装、缺少 Docker 部署 | 默认 Docker，Electron 后置 |
| waoowaoo | 闭源细节、单人维护、版本不兼容（升级要清库） | 长期维护、向后兼容承诺 |
| BigBanana | 撤回开源、仅镜像分发 | 坚持开源 |
| lumenx | 代码量大但单文件偏长（pipeline.py 13 万字符） | 文件粒度控制，单文件 < 1000 行 |
| Pixelle | 流程相对短视频化、不擅长多角色对白短剧 | 把"短剧/漫剧"作为最重要场景 |

---

## 9. 一句话结论

> **9 个项目里，没有任何一个能完整覆盖「短剧/漫剧 IP 改编」全流程的最佳实践 —— 但把它们的最强模块拼起来，恰好可以拼出一个理想的 AI Agent Studio。**
>
> 这个理想形态是：
> - **形似 ArcReel** 的工程框架（FastAPI + React + Claude Agent SDK + 多 Backend）
> - **神似 Toonflow** 的画风包/可编程供应商/无限画布
> - **快似 huobao-drama** 的 Skill 形式简洁性
> - **稳似 lumenx** 的 6 阶段 SOP 流程引导
> - **细似 moyin** 的 6 层身份锚点 + 多模态引用
> - **强似 BigBanana** 的关键帧驱动 + Project/Season/Episode 三级
>
> 这就是 Agents Studio AI 的设计目标。

---

## 10. 短剧行业专业流程认知（v1 → v2 修正）

> 第一版 Skill 设计借鉴了 9 个开源项目的工程模式，但忽略了 **短剧作为一个商业内容品类** 自身的工作流。
> 经过专业用户反馈，我们做了如下重要修正。这些修正不只影响 Skill 编号，更影响整个 Orchestrator 状态机的本质形态。

### 10.1 修正核心：从"按集走"到"全本理解 + 商业协商 + 全集出剧本"

**v1 错误流程（已废弃）**：

```
上传小说 → 切章节 → 单集改写剧本 → 单集提资产 → 单集分镜 → ...
```

这个流程的根本问题：
- ❌ 切章节这件事本身需要参考集数、单集时长、付费节点等参数 —— 但这些参数还没确定
- ❌ 单集逐集改写无法管理跨集节奏曲线、CP 互动节奏、付费集卡点
- ❌ 单集提资产会出现同一角色在不同集描述漂移
- ❌ 没有"全本理解"步骤，制作方无法做投资决策

**v2 正确流程**：

```
上传小说
   ↓
01-novel-analyst         全本理解（不切章不改写，只输出可改编潜力分析）
   ↓
02-show-planner          商业协商（集数 / 横竖屏 / 付费节点 / 平台 / 预算 7 参数）
   ↓
03-script-writer         一次性出全集剧本（先大纲再扩写，含章节映射）
   ↓
04-asset-extractor       全集一次性资产提取
   ↓
... 后续按集制作循环
```

### 10.2 7 项关键商业参数（必须前置协商）

```yaml
1. coverage              # 改编章节范围（不是从头改到尾）
2. episode_format        # 集数 + 单集时长 + 格式类型（vertical_micro / horizontal_short / horizontal_long）
3. aspect_ratio          # 横竖屏（决定所有下游图像/视频尺寸）
4. genre + tone          # 类型（题材）+ 风格（调性）— 不要混
5. paywall               # 付费节点（free_episodes / paywall_at_episode / hook_episodes）
6. target_platform       # 抖音/快手/优酷/腾讯/西瓜
7. budget_constraints    # 总预算 + 模型偏好 + 质量优先级
```

**这 7 项决定了后续每一个 Skill 的输入、约束、输出形态**：

| 参数 | 影响范围 |
|---|---|
| aspect_ratio | 06-character-designer 定妆图比例、08-keyframe 宫格布局、09-video 模型参数、12-composer 模板 |
| episode_format | 03-script-writer 集数和单集时长目标、07-storyboard 镜头节奏 |
| paywall | 03 付费集 cliffhanger 强度、12 付费集封面与转化文案 |
| genre + tone | 05-art-director 画风推荐、07 镜头节奏曲线、整剧 BGM 风格 |
| budget_constraints | 09 视频模型选择、所有 Skill 的并发上限 |

### 10.3 短剧"爆款公式"识别（写进 01-novel-analyst）

01 在分析原著时，必须主动识别以下"爆款元素"并标注章节位置：

| 元素 | 短剧用途 |
|---|---|
| **逆袭起点**（屌丝/废柴/重生开局） | 1-2 集开篇钩子 |
| **打脸高潮**（被低估者反杀） | 付费集首选位置 |
| **身份反转**（隐藏 boss / 神秘人物揭示真身） | 第 8、20、40 集大节点 |
| **CP 拉扯**（误会 → 互动 → 心动 → 误解 → 和解） | 整剧情感主线 |
| **金手指/系统/超能力** | 爽点放大器 |
| **金句台词** | 标记下来供推广用 |

### 10.4 类型 / 风格 / 题材 / 短剧标签 —— 不能混

| 维度 | 含义 | 示例 |
|---|---|---|
| **题材**（era） | 故事发生的世界 | 古代 / 现代 / 民国 / 未来 / 架空 |
| **类型**（genre） | 叙事范式 | 言情 / 武侠 / 玄幻 / 悬疑 / 战争 |
| **风格**（tone） | 情感色彩与节奏感 | 爽剧 / 正剧 / 甜宠 / 虐恋 / 喜剧 / 悲剧 |
| **短剧标签**（micro_drama_tags） | 行业内套路化标签 | 重生 / 打脸 / 扮猪吃虎 / 总裁 / 复仇 / 系统流 / 双男主cp |

**v1 的错误**：把这四个维度混在一起当一个"风格"字段。
**v2 的修正**：02-show-planner 必须四个维度分别确认。

### 10.5 付费章节是核心商业模型（不可省略）

短剧（特别是竖屏微短剧）的商业模型 **完全依赖付费章节卡点**：

```
第 1-7 集免费（引流，钩子最强）
第 8 集开始付费（首付费 = 超级反转 / 大型打脸）
第 8 集后每 10-20 集一个大反转维持续看付费意愿
末 5 集可选限免促分享
```

**v1 没有这个概念**。**v2 把它做成 02-show-planner 的必填参数**，并贯穿到：
- 03 给付费集生成"超级钩子" cliffhanger
- 07 给付费集设计"翻天反转"镜头序列
- 12 给付费集生成转化文案与封面帧

### 10.6 横竖屏不是装饰

| 影响维度 | 9:16 竖屏 | 16:9 横屏 |
|---|---|---|
| 06 角色定妆图 | 全身竖图 | 全身横图 + 三视图 |
| 07 镜头偏好 | 中景/特写/近景多 | 中景/全景多 |
| 08 宫格图 | 1×N 或 2×3 竖排 | N×1 或 3×2 横排 |
| 09 视频模型参数 | 1080×1920 | 1920×1080 |
| 12 输出模板 | templates/1080x1920/ | templates/1920x1080/ |

**v1 的错误**：把 aspect_ratio 当下游运行时参数。**v2 的修正**：作为 02 的必填字段，所有下游 Skill 在拼 prompt / 生成时都引用它。

### 10.7 全集一次性资产提取

资产提取（角色 / 场景 / 道具 / 线索）应该在 **全部剧本生成后一次性完成**，而不是逐集做：

| 维度 | 错误做法（v1） | 正确做法（v2） |
|---|---|---|
| 提取时机 | 单集剧本后立刻提 | 全集剧本完成后一次提 |
| 角色描述 | 各集独立提，事后去重 | 全集统一抽，一次性建库 |
| 戏份权重 | 无概念 | 按全集出现频次/对白量算 weight 1-10 |
| 角色合并 | 凭后期判断 | 02-show-planner 已锁定 can_merge_characters |
| 跨集追踪 | 无机制 | 线索（clue）单独建库，含 state_changes |

### 10.8 修正影响的 Skill 编号（13 个）

| 旧编号（v1 / 11 个） | 新编号（v2 / 13 个） | 变更 |
|---|---|---|
| 00-orchestrator | 00-orchestrator | 状态机重写为 13 步 |
| — | **01-novel-analyst** | ✨ 新增 |
| — | **02-show-planner** | ✨ 新增 |
| 01-script-writer | **03-script-writer** | 重写：一次性全集 + 章节映射 + 付费节点 |
| 02-asset-extractor | **04-asset-extractor** | 重写：去掉 peek/split mode，仅做全集资产 |
| 03-art-director | 05-art-director | 编号顺延 +2 |
| 04-character-designer | 06-character-designer | 编号顺延 +2 |
| 05-storyboard-breaker | 07-storyboard-breaker | 编号顺延 +2 |
| 06-keyframe-generator | 08-keyframe-generator | 编号顺延 +2 |
| 07-video-generator | 09-video-generator | 编号顺延 +2 |
| 08-voice-assigner | 10-voice-assigner | 编号顺延 +2 |
| 09-tts-synthesizer | 11-tts-synthesizer | 编号顺延 +2 |
| 10-video-composer | 12-video-composer | 编号顺延 +2 |
