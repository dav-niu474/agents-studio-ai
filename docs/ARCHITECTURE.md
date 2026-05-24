# Agents Studio AI · 平台架构设计

> 本文是 Agents Studio AI 平台的架构蓝图。它不是一份"未来某天才会实现"的设计稿，而是 **从第 0 天就指导每一行代码该放在哪里** 的工程契约。
>
> 设计目标：**先把 Skill 跑通，再用最少的代码长出后端，最后再加 UI。**

---

## 1. 设计原则（10 条）

> 详见 [`INSIGHTS.md` § 7](INSIGHTS.md#7-给-agents-studio-的-10-条核心设计判断)。这里再压缩一遍：

1. **Skill First**：第一版必须是 Skill 集合 + Adapter 抽象，无后端无 UI 也能跑。
2. **Markdown SKILL**：用 `huobao-drama` 风格的 YAML frontmatter + Markdown，不用 JSON、不嵌数据库。
3. **Orchestrator + Subagent**：用 `ArcReel` 的「编排 Skill + 聚焦 Subagent」模式。
4. **资产中央化**：character/scene/prop/costume/clue 用统一 Spec 驱动，参照 `ArcReel/lib/asset_types.py`。
5. **关键帧一等公民**：Start/End Frame 与宫格图是平台核心模型，不是附加功能。
6. **Adapter + Registry**：Image/Video/Text/TTS 各自一个 Adapter 接口和注册表。
7. **任务双通道**：Image / Video 各自独立 worker pool 与 RPM 通道。
8. **画风热插拔**：画风是 `art-styles/<style>/` 包，运行时加载。
9. **Generation Mode 对 LLM 隐藏**：image2video / first_last / grid / reference_video 由编排层注入。
10. **SessionActor 从 Day 1**：每个会话一个 asyncio task，避免后期重构。

---

## 2. 总体架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Agents Studio AI                                  │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                     L1 · UI / Client                                │ │
│  │   Web SPA (React)  ·  CLI (uv run)  ·  MCP-as-a-tool (OpenClaw 风) │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                  ↕  REST / SSE / MCP                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                L2 · Server (FastAPI / Hono)                         │ │
│  │   /api/v1/{projects,assistant,generate,assets,tasks,events,…}      │ │
│  │                                                                      │ │
│  │   ┌──────────────────┐   ┌────────────────────────────────┐        │ │
│  │   │ AssistantService │   │ AssetService / GenerationSvc   │        │ │
│  │   │ (Agent Runtime)  │   │ (业务编排)                     │        │ │
│  │   └────────┬─────────┘   └────────┬───────────────────────┘        │ │
│  └────────────┼──────────────────────┼─────────────────────────────────┘ │
│               ↓                      ↓                                    │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │              L3 · Agent Runtime (Claude Agent SDK / Mastra)         │ │
│  │                                                                      │ │
│  │   ┌────────────┐  ┌────────────────┐  ┌──────────────┐             │ │
│  │   │ Skill      │  │ Subagent       │  │ SessionActor │             │ │
│  │   │ Loader     │  │ Pool           │  │ (asyncio)    │             │ │
│  │   └────────────┘  └────────────────┘  └──────────────┘             │ │
│  │                                                                      │ │
│  │   ┌────────────┐  ┌────────────────┐  ┌──────────────┐             │ │
│  │   │ Tool MCP   │  │ Sandbox        │  │ Profile      │             │ │
│  │   │ Server     │  │ (bwrap/降级)   │  │ Manifest     │             │ │
│  │   └────────────┘  └────────────────┘  └──────────────┘             │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│               ↓                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                       L4 · Core Library                             │ │
│  │                                                                      │ │
│  │   ┌──────────────┐  ┌─────────────────┐  ┌───────────────────┐    │ │
│  │   │ Project      │  │ Asset Spec      │  │ Prompt Compiler   │    │ │
│  │   │ Manager      │  │ (asset_types)   │  │ (画风注入/锚点)    │    │ │
│  │   └──────────────┘  └─────────────────┘  └───────────────────┘    │ │
│  │                                                                      │ │
│  │   ┌──────────────┐  ┌─────────────────┐  ┌───────────────────┐    │ │
│  │   │ Generation   │  │ Version         │  │ Usage / Cost      │    │ │
│  │   │ Queue        │  │ Manager         │  │ Tracker           │    │ │
│  │   └──────────────┘  └─────────────────┘  └───────────────────┘    │ │
│  │                                                                      │ │
│  │   ┌──────────────┐  ┌─────────────────┐  ┌───────────────────┐    │ │
│  │   │ ImageBackend │  │ VideoBackend    │  │ TextBackend       │    │ │
│  │   │ Registry     │  │ Registry        │  │ Registry          │    │ │
│  │   └──────────────┘  └─────────────────┘  └───────────────────┘    │ │
│  │                                                                      │ │
│  │   ┌──────────────┐  ┌─────────────────┐  ┌───────────────────┐    │ │
│  │   │ TTS Backend  │  │ FFmpeg Compose  │  │ Custom Provider   │    │ │
│  │   │ Registry     │  │ + Jianying Exp. │  │ (auto discovery)  │    │ │
│  │   └──────────────┘  └─────────────────┘  └───────────────────┘    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│               ↓                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                       L5 · Persistence                              │ │
│  │   SQLite (default) / PostgreSQL (prod)  ·  File System  ·  OSS     │ │
│  │   (projects/<name>/  ·  output/  ·  uploads/  ·  versions/)        │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 数据模型（核心实体）

### 3.1 容器层级（仿 BigBanana）

```
Project (剧目)
  └─ Season (季)
       └─ Episode (集)
            └─ Scene (场)
                 └─ Shot (分镜)
                      └─ Asset References (角色/场景/道具/服饰/线索)
                      └─ Generated Media (image / video / audio)
                      └─ Versions[]
```

### 3.2 资产 Spec（仿 ArcReel `asset_types.py`）

所有资产用统一 spec 描述：

```yaml
# packages/asset-spec/character.yaml
asset_type: character
storage_bucket: characters
sheet_fields:
  - name: { required: true, unique_per_project: true }
  - role_type: { enum: [protagonist, supporting, extra] }
  - appearance: { type: text, min_length: 300, max_length: 500 }
  - personality: { type: tags }
  - identity_anchors: { type: object }   # ← moyin 的 6 层身份锚点
visual:
  reference_image: { required: true }
  three_views: { optional: true }       # ← lumenx 的三视图
  avatar: { optional: true }
  wardrobe: { type: array }              # ← lumenx 的衣橱
patch_whitelist: [appearance, personality, identity_anchors, wardrobe]
```

新增资产类型只需添加一个 yaml，路由 / 数据库 / 前端表单都自动适配。

### 3.3 Generation Mode（仿 ArcReel）

```yaml
generation_modes:
  image2video:    # 默认：图生视频
    inputs: [shot.start_frame_image]
  first_last:     # 首尾帧插值
    inputs: [shot.start_frame_image, shot.end_frame_image]
  grid:           # 宫格图生视频
    inputs: [shot.grid_image, shot.grid_layout]
    layouts: [grid_4, grid_6, grid_9]
  reference_video: # 参考生视频（跳过分镜）
    inputs: [character_refs[], scene_ref, prop_refs[]]
  multi_shot:     # moyin Seedance 2.0 多镜头合并
    inputs: [shots[].assets]
    constraints: { images_max: 9, videos_max: 3, audios_max: 3, prompt_max: 5000 }
```

### 3.4 Content Mode（仿 ArcReel）

```yaml
content_modes:
  drama:
    schema: lib/script_models.DramaScene
    decomposition: 场景 → 分镜 → 对白
  narration:
    schema: lib/script_models.NarrationSegment
    decomposition: 段落 → 朗读节奏 → 配图
```

---

## 4. Skill 体系

### 4.1 Skill 文件规范

每个 Skill 是一个目录：

```
skills/<skill-id>/
  SKILL.md              # YAML frontmatter + Markdown 主体（仿 huobao）
  scripts/              # 可选：可被 Skill 直接调用的脚本（仿 ArcReel compose-video）
    *.py / *.ts
  reference/            # 可选：被 SKILL.md 引用的子模板
    *.md
  examples/             # 可选：典型输入输出示例
    *.json
```

**SKILL.md 头部规范**：

```yaml
---
name: storyboard-breaker
description: 把单集剧本拆解为分镜序列。当用户说"拆分镜"、"做storyboard"或"生成镜头表"时使用。
agent_type: subagent          # orchestrator | subagent | utility
content_modes: [drama]         # 限制在哪些 content_mode 下可用，缺省全部
generation_modes: any          # 限制在哪些 generation_mode 下可用
required_tools:                 # 必需的 MCP/Tool 名称
  - read_storyboard_context
  - save_storyboards
  - update_storyboard
input_schema: ./reference/input.schema.json  # 可选
output_schema: ./reference/output.schema.json
---

# 分镜拆解指南
...
```

### 4.2 Skill 路由表（Orchestrator 怎么决定调谁）

Orchestrator Skill (`00-orchestrator`) 会按下表的 **状态机** 检测项目当前阶段并 dispatch：

```
项目状态检测                          → Dispatch 到的 Skill
────────────────────────────────────────────────────────────────
源文件已上传 + 章节未切分             → 02-asset-extractor  (peek + 切章)
章节已切分 + 剧本未生成               → 01-script-writer
剧本已生成 + 角色/场景未提取          → 02-asset-extractor
资产已提取 + 画风未确定               → 03-art-director
画风已确定 + 角色定妆图未生成         → 04-character-designer
角色定妆完 + 场景/道具图未生成        → 04-character-designer (extend)
所有资产就位 + 分镜未拆               → 05-storyboard-breaker
分镜就位 + 关键帧未生成               → 06-keyframe-generator
关键帧就位 + 视频未生成               → 07-video-generator
视频就位 + 音色未分配                 → 08-voice-assigner
音色已分配 + 配音未合成               → 09-tts-synthesizer
全部就位                              → 10-video-composer (拼接成片)
```

详见 `skills/00-orchestrator/SKILL.md`。

### 4.3 Skill 与 Tool 的边界

| 类型 | 职责 | 示例 |
|---|---|---|
| **Skill (Markdown)** | 提示词 / 规则 / 流程指引 | `02-asset-extractor/SKILL.md` 写"如何抽取角色" |
| **Subagent** | 需要多步推理的复杂任务 | `02-asset-extractor` 是个 subagent，主 Agent 只收摘要 |
| **Tool (MCP)** | 确定性操作 | `save_dedup_characters` 是一个 MCP tool |
| **Script (Python/TS)** | 纯计算/IO | `scripts/compose_video.py` 调 ffmpeg |

> 准则：**会失败、会变化、会需要解释 → Skill；总是成功、参数清晰、无需解释 → Tool/Script。**

---

## 5. Adapter 系统（多供应商）

### 5.1 接口（仿 huobao-drama）

```typescript
// packages/adapters/types.ts
export interface ImageProviderAdapter {
  provider: string
  buildGenerateRequest(config: AIConfig, record: ImageGenerationRecord): ProviderRequest
  parseGenerateResponse(result: any): ImageGenResponse  // { isAsync, taskId?, imageUrl? }
  buildPollRequest(config: AIConfig, taskId: string): ProviderRequest
  parsePollResponse(result: any): ImagePollResponse
  extractImageUrl(result: any): string | null
  extractImageBase64(result: any): { data: string; mimeType: string } | null
}

// 类似的 VideoProviderAdapter / TTSProviderAdapter / TextProviderAdapter
```

### 5.2 注册表

```typescript
export const imageAdapters: Record<string, ImageProviderAdapter> = {
  openai: new OpenAIImageAdapter(),
  gemini: new GeminiImageAdapter(),
  volcengine: new VolcEngineImageAdapter(),  // Seedream
  ali: new AliImageAdapter(),                  // Wanx
  minimax: new MiniMaxImageAdapter(),
  vidu: new ViduImageAdapter(),
  // 自定义供应商在运行时注入
}
```

### 5.3 Custom Provider 自动发现（仿 ArcReel）

用户在 Web/CLI 添加一个自定义供应商：

```yaml
custom_provider:
  base_url: https://api.example.com/v1
  api_key: sk-...
  compatibility: openai   # openai | google
```

系统会：
1. 调用 `GET /v1/models` 自动发现可用模型
2. 按模型名前缀推断媒体类型（image / video / text）
3. 复用对应 Compatibility 适配器（`OpenAICompatAdapter` 或 `GoogleCompatAdapter`）

### 5.4 Provider Resolution（解析优先级）

```
用户主动选择 > 项目默认 > 全局默认 > 系统兜底
```

仿 ArcReel `lib/config/resolver.py`。

---

## 6. 任务队列设计

### 6.1 双通道（仿 ArcReel `GenerationQueue`）

```
GenerationQueue
├── image_channel   (并发度 N1, RPM=R1)
├── video_channel   (并发度 N2, RPM=R2)
└── shared_dlq      (失败任务死信)
```

**Lease-based 调度**：每次取任务给一个租约，worker 必须在租期内完成或续约，避免死任务。

### 6.2 任务种类

| 种类 | 通道 | 典型耗时 |
|---|---|---|
| character_design | image | 30s |
| scene_design | image | 30s |
| prop_design | image | 30s |
| storyboard_image | image | 30s |
| grid_image | image | 60s |
| video_clip | video | 2-5min |
| reference_video | video | 3-8min |
| tts_audio | image (轻量) 或独立 | 5-15s |

### 6.3 状态机

```
pending → leased → running → (succeeded | failed → retry?)
                              ↓
                          exhausted → dlq
```

### 6.4 SSE 事件流（仿 ArcReel）

```
GET /api/v1/projects/<name>/events/stream
  → event: task.update         { task_id, status, progress }
  → event: asset.created       { asset_id, type }
  → event: shot.ready          { shot_id }
  → event: episode.composed    { episode_id, output_path }
```

---

## 7. 项目文件系统布局

每个 Project 在磁盘上是一个目录，**`project.json` 是单一真相源**（仿 ArcReel）：

```
projects/<project_name>/
  project.json                  # 项目元数据 + 容器层级
  CLAUDE.md                     # 该项目的 Agent 系统提示词（按 content_mode 注入）
  .agents/                      # 项目级 Agent profile（manifest+sha256 校验，仿 ArcReel）
    skills/
    agents/
  source/                       # 原著/输入文件
    novel.txt
  scripts/                      # 剧本 JSON
    episode_1.json
    episode_2.json
  characters/                   # 角色资产（图 + meta）
    <character_id>/
      reference.png
      three_views.png
      avatar.png
      wardrobe/
        casual.png
        formal.png
      meta.json
  scenes/                       # 场景资产
  props/                        # 道具资产
  storyboards/                  # 分镜
    episode_1/
      shot_001/
        start_frame.png
        end_frame.png
        grid.png                # 宫格图（如启用）
        clip.mp4
        audio.wav
        meta.json
  versions/                     # 每次重生成自动留档
  output/                       # 拼接后的成片
    episode_1_final.mp4
    episode_1.jianying.zip      # 剪映草稿
  .arcreel.db -> ../.arcreel.db # 轻量元数据
```

**为什么这样设计**：
- **单一真相**：`project.json` 是 truth，UI 是镜像
- **整目录拷贝即迁移**：把整个 `projects/<name>/` 打包就是项目导出
- **版本化友好**：可以用 git/dvc 管理素材
- **避免数据库膨胀**：媒体文件不进数据库

---

## 8. Agent Runtime 关键设计

### 8.1 SessionActor（仿 ArcReel）

```python
class SessionActor:
    """每个会话一个专属 asyncio.Task，串行化所有 LLM 调用"""
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.queue: asyncio.Queue = asyncio.Queue()
        self.task = asyncio.create_task(self._run())

    async def submit(self, message: UserMessage) -> AsyncIterator[Event]:
        future = asyncio.Future()
        await self.queue.put((message, future))
        async for event in await future:
            yield event   # SSE-friendly

    async def _run(self):
        while True:
            message, future = await self.queue.get()
            stream = self._call_agent(message)   # 调 Claude Agent SDK
            future.set_result(stream)
            await stream  # 等当前轮完成再处理下一条
```

### 8.2 Profile Manifest（仿 ArcReel `lib/profile_manifest.py`）

防止本地脏改污染项目：

```yaml
# .agents/manifest.yaml
version: 1
files:
  - path: skills/00-orchestrator/SKILL.md
    sha256: abc123...
  - path: skills/05-storyboard-breaker/SKILL.md
    sha256: def456...
```

每次启动时校验 sha256，不一致拒绝运行（除非显式 `--force`）。

### 8.3 Sandbox（仿 ArcReel bwrap 集成）

```python
# server/sandbox.py
def check_sandbox_available() -> bool:
    """Linux/macOS 检测 bwrap，Windows 自动降级到命令前缀白名单"""
```

工具调用默认在沙箱内：fs 白名单（仅项目目录）+ 网络白名单（仅供应商 API）+ subprocess 白名单（仅 ffmpeg/python）。

---

## 9. 模板与画风系统

### 9.1 画风包（仿 Toonflow）

```
art-styles/
  2D-chinese-anime/
    README.md
    prefix.md                              # 风格前缀
    images/preview.png                     # 风格示例
    art_prompt/
      art_character.md
      art_scene.md
      art_prop.md
      art_storyboard_video.md
    director_skills/
      director_planning_style.md
      director_storyboard.md
    style_meta.yaml                        # 元信息（标签 / 适用模型 / 锚点词）
```

**运行时**：Skill 通过 `ART_STYLE_ID` 加载对应 prefix.md 与 art_prompt/*.md，注入到当前提示词。

### 9.2 视频版式模板（仿 Pixelle）

```
templates/
  1080x1920/         # 竖屏短剧
    drama_default.html
    narration_book.html
  1920x1080/         # 横屏短剧
    cinematic_drama.html
  1080x1080/         # 方形（社交平台）
    square_default.html
```

模板是 HTML（含 CSS 动画），后期由 ffmpeg 渲染成视频帧。

---

## 10. 安全 / 合规 / 多租户

### 10.1 数据隔离
- 项目目录与数据库表都按 `project_id` 隔离
- API Key 使用 SHA-256 哈希 + 用户级 ACL
- Vendor API Key 加密存 Credential 表（仿 ArcReel）

### 10.2 内容安全
- 内置敏感词过滤（剧本/Prompt 入口）
- 提供商默认开 NSFW 过滤（图像/视频）
- 输出水印/数字签名可选

### 10.3 审计
- `usage_tracker` 记录每次 LLM/Image/Video 调用（含 prompt 哈希、token、费用、时间）
- `audit_log` 记录用户级写操作

---

## 11. 技术选型推荐

| 层 | 推荐 | 理由 |
|---|---|---|
| 后端语言 | **Python 3.12+** | ML/AI 生态最强，仿 ArcReel/lumenx；如团队是 TS 优先则选 Hono+Drizzle 仿 huobao-drama |
| Web 框架 | **FastAPI** | 异步、Pydantic、SSE、OpenAPI 自动生成 |
| Agent SDK | **Claude Agent SDK** | 唯一原生支持 Skill+Subagent 概念 |
| ORM | **SQLAlchemy 2.0 (Async)** + Alembic | 仿 ArcReel；中小项目可换 Drizzle + better-sqlite3 |
| 数据库 | SQLite (默认) / PostgreSQL (生产) | 双轨制，仿 ArcReel `deploy/` vs `deploy/production/` |
| 队列 | **自研 Lease-based** (基于 SQLAlchemy) | 仿 ArcReel；不引入 Redis/RabbitMQ 降低运维 |
| 前端 | React 19 + TypeScript + Tailwind 4 + zustand + wouter | 仿 ArcReel 主流栈 |
| 视频处理 | **FFmpeg** (subprocess) | 业界标准 |
| 媒体存储 | 本地优先 + OSS 镜像（可选） | 仿 lumenx |
| 国际化 | i18next (前) + 自研 Translator (后) | 仿 ArcReel zh/en/vi |
| 测试 | pytest (后) + vitest (前) | 仿 ArcReel |
| 类型 | basedpyright (后) + tsc (前) | 仿 ArcReel |
| Lint | ruff + eslint | 仿 ArcReel |
| 部署 | Docker Compose（默认 + production 双 profile） | 仿 ArcReel |

---

## 12. 与外部生态的接口

| 集成 | 形式 | 借鉴 |
|---|---|---|
| ComfyUI | 作为可选后端，通过 ComfyUI API 调工作流 | 仿 Pixelle |
| OpenClaw / 外部 Agent 平台 | 暴露 MCP Tool（Bearer Token + 同步对话端点） | 仿 ArcReel |
| 剪映 / DaVinci Resolve | 导出草稿 ZIP 让用户在专业工具继续后期 | 仿 ArcReel `jianying_draft_service` |
| Jianying / CapCut | 同上 | 仿 ArcReel |
| OSS / S3 | 媒体镜像 + 签名 URL | 仿 lumenx |

---

## 13. 反模式（不要做）

❌ 把提示词硬编码在代码里（Jellyfish 部分文件）  
❌ 单 Agent + 长 Tool 列表（huobao 是 MVP 选择，但不可持续）  
❌ 让 LLM 直接看 `generation_mode` 字段（容易乱选）  
❌ 同步阻塞调用视频生成 API（必须走队列）  
❌ 把媒体文件存进数据库 BLOB  
❌ 项目目录与数据库不一致（必须以 project.json 为单一真相）  
❌ 一个文件超过 1500 行（lumenx pipeline.py 反例）  
❌ 闭源镜像分发（BigBanana 反例）

---

## 14. 路径选择决策树

```
用户故事："我想从一本小说做一集 2 分钟的短剧"
  │
  ├─ 1. 上传小说 → ProjectManager 创建项目
  ├─ 2. 对话："帮我做第 1 集"
  │       └─ Orchestrator 检测 → 02-asset-extractor (章节切分 + 资产提取)
  │       └─ Orchestrator 检测 → 01-script-writer (生成剧本)
  │       └─ Orchestrator 检测 → 03-art-director (画风定调)
  │       └─ Orchestrator 检测 → 04-character-designer (角色定妆)
  │       └─ Orchestrator 检测 → 05-storyboard-breaker (拆分镜)
  │       └─ Orchestrator 检测 → 06-keyframe-generator (生成关键帧)
  │       └─ Orchestrator 检测 → 07-video-generator (视频片段)
  │       └─ Orchestrator 检测 → 08-voice-assigner + 09-tts-synthesizer
  │       └─ Orchestrator 检测 → 10-video-composer (FFmpeg 拼接)
  ├─ 3. 用户在每个阶段后确认
  └─ 4. 输出 episode_1_final.mp4 + 剪映草稿
```

每个步骤都可以**单独发起**（"重新生成第 5 镜的视频"），Orchestrator 仍能正确路由。

---

## 15. 与 INSIGHTS.md 的呼应

> 本设计是 [`INSIGHTS.md`](INSIGHTS.md) 全部分析的工程落地：

- INSIGHTS § 1 项目对比 → 此处 § 11 技术选型，选了 ArcReel 风格的 Python+FastAPI+Claude SDK 主路径
- INSIGHTS § 3 模块拆解 → 此处 § 2 总体架构 5 层
- INSIGHTS § 4 复用模块 → 此处分散在每个章节标注"仿 X"
- INSIGHTS § 5.2 Agent 编排 → 此处 § 4 Skill 体系（采纳 ArcReel 模式）
- INSIGHTS § 5.3 多供应商 → 此处 § 5 Adapter 系统（采纳 huobao 接口）
- INSIGHTS § 5.4 资产一致性 → 此处 § 3 数据模型（融合 lumenx + moyin + ArcReel）
- INSIGHTS § 5.5 视频策略 → 此处 § 3.3 Generation Mode（采纳 ArcReel 设计）
- INSIGHTS § 6 独家亮点 → 此处 § 9 画风系统（Toonflow） + § 8 SessionActor（ArcReel）
