# Agents Studio AI

> 一个面向 **AI 短剧 / 漫剧全流程创作** 的 Agent Studio 平台 —— 从小说一键到成片。

本仓库目前是 **设计与原型阶段**，不是可运行产品。它由三块组成：

1. **洞察分析** — `docs/INSIGHTS.md`：对 9 个一线开源项目（Toonflow / huobao-drama / ArcReel / Jellyfish / moyin-creator / waoowaoo / BigBanana / lumenx / Pixelle-Video）做了深度拆解、对比和复用建议。
2. **平台架构** — `docs/ARCHITECTURE.md` + `docs/ROADMAP.md`：给出推荐的核心模块、技术栈、目录结构、分阶段开发计划。
3. **Agent Skills 原型** — `skills/`：可立即放进任何 Claude Agent SDK / Mastra / 自研 Agent Runtime 的 SKILL.md 集合。一套 11 个 Skill 串起从「小说 → 剧本 → 资产 → 分镜 → 关键帧 → 视频片段 → 配音 → 成片」的完整流水线，无需后端就能先在 Agent 端把流程跑通。

## 项目定位

| 维度 | 取向 |
|---|---|
| 形态 | **Agent-Native Studio** —— 不是传统的「按钮 + 工作流」工具，而是「编排 Skill + 聚焦 Subagent + 多供应商 Adapter」的可对话生产平台 |
| 用户 | 短剧 / 漫剧 / 小说改编 / MCN 批量生产 / 个人创作者 |
| 输出 | 单集 30s–3min 的短剧成片 + 剪映草稿 + 工程文件可二次创作 |
| 模型 | 多供应商可切换：文本（GPT / Claude / Gemini / Qwen / DeepSeek / 豆包）+ 图像（Nano Banana / Seedream / GPT Image / Flux / 通义万相）+ 视频（Sora / Veo / Kling / Seedance / Vidu / Wan）+ TTS（MiniMax / Index / Edge） |

## 怎么读这个仓库

- **想理解为什么这么设计** → 先读 [`docs/INSIGHTS.md`](docs/INSIGHTS.md)，再读 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- **想立刻试用 Skills** → 直接看 [`skills/README.md`](skills/README.md)，把整个 `skills/` 目录拷进任何 Claude Agent SDK / Cursor / Cline / Kiro 项目即可生效
- **想看开发顺序** → 读 [`docs/ROADMAP.md`](docs/ROADMAP.md)
- **想扩展画风** → 参考 [`art-styles/`](art-styles/) 目录的样例

## 一句话总结

> **不要先写后端再加 Agent，而是先把 Skill 写对、把流程跑通，再用最少的代码长出后端。**
> 这正是 ArcReel / Toonflow / huobao-drama 这类领先项目的共同选择。

## 致谢

本设计深度参考了以下开源项目（按字母序）：[ArcReel](https://github.com/ArcReel/ArcReel)、[BigBanana-AI-Director](https://github.com/shuyu-labs/BigBanana-AI-Director)、[huobao-drama](https://github.com/chatfire-AI/huobao-drama)、[Jellyfish](https://github.com/Forget-C/Jellyfish)、[lumenx](https://github.com/alibaba/lumenx)、[moyin-creator](https://github.com/MemeCalculate/moyin-creator)、[Pixelle-Video](https://github.com/AIDC-AI/Pixelle-Video)、[Toonflow-app](https://github.com/HBAI-Ltd/Toonflow-app)、[waoowaoo](https://github.com/saturndec/waoowaoo)。

每个项目的具体借鉴点见 [`docs/INSIGHTS.md`](docs/INSIGHTS.md)。
