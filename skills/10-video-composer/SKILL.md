---
name: video-composer
description: 把已生成的视频片段按剧本顺序拼接为单集成片，处理转场（cut/fade/dissolve/wipe）、混入对白音轨与可选 BGM，输出 mp4 与剪映草稿。当所有 shot 完成时使用。
agent_type: utility
content_modes: [drama]
required_tools: []                # 这是 utility skill，所有逻辑都在 scripts/compose_video.py 内完成，可不依赖 LLM tool
---

# 视频拼接 / 成片合成指南

> 灵感来源（强烈推荐看原文件）：[`ArcReel/agent_runtime_profile/.claude/skills/compose-video/SKILL.md`](https://github.com/ArcReel/ArcReel)。
>
> 本 Skill 是 **utility 类**（确定性脚本，不需要 LLM 推理），可由 Orchestrator 直接调用对应 Python/TS 脚本，无需走 Subagent 路径。

---

## 适用范围（重要）

- ✅ **drama 模式** —— 顶层 `scenes[]` / `shots[]`，按剧本顺序拼接
- ❌ **narration 模式** —— 走单独的 narration composer（按朗读节奏拼）
- ❌ **多集合并** —— 不支持，每集独立拼接

如果只是想做 narration 内容，请用 `narration-composer.py`（同目录，待 M1 阶段实现）。

---

## CLI 用法（基本与 ArcReel 对齐）

脚本必须在含 `project.json` 的项目 cwd 内运行：

```bash
# 默认：按剧本顺序拼接 + 自动转场（按 transition_to_next）
python scripts/compose_video.py scripts/episode_1.json

# 混入 BGM
python scripts/compose_video.py scripts/episode_1.json --music background_music.mp3

# 关闭转场（一律 cut）
python scripts/compose_video.py scripts/episode_1.json --no-transitions

# 自定义输出文件名（始终落到 output/）
python scripts/compose_video.py scripts/episode_1.json --output ep1_director_cut.mp4

# 同时导出剪映草稿
python scripts/compose_video.py scripts/episode_1.json --emit-jianying
```

### 完整参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `script` | 位置参数（必填） | 剧本文件路径，相对项目 cwd |
| `--output OUTPUT` | 可选 | 输出文件名，默认按 `episode_<N>.mp4` |
| `--music MUSIC` | 可选 | BGM 文件路径，必须位于项目目录内 |
| `--no-transitions` | flag | 全部用 cut 拼接，忽略 `transition_to_next` |
| `--emit-jianying` | flag | 同时输出剪映草稿 ZIP |
| `--quality {low,med,high}` | 可选 | 输出质量预设（CRF 26/22/18） |
| `--resolution WxH` | 可选 | 强制输出分辨率（默认按第一个 shot） |

---

## 工作流程

```
1. 加载并校验 script JSON（drama schema）
2. 收集 video_clip + audio 文件路径，校验存在
3. Normalize：所有 clip 转码为统一编码 (H.264 / AAC, 30fps)
4. 拼接：按 transition_to_next 加 xfade 滤镜或 cut
5. 混音：把 shot 级 audio 拼成 dialogue track，可选混入 BGM
6. 输出：mp4 → output/episode_<N>.mp4
7. （可选）剪映草稿生成：output/episode_<N>.jianying.zip
```

---

## 转场映射（仿 ArcReel）

| `transition_to_next` | ffmpeg 命令 |
|---|---|
| `cut` 或缺省 | concat 直接拼接 |
| `fade` | `xfade=transition=fade:duration=0.5` |
| `dissolve` | `xfade=transition=dissolve:duration=0.5` |
| `wipe` | `xfade=transition=wipeleft:duration=0.5` |

xfade 滤镜对编码一致性敏感。Step 3 的 normalize 是必需的（否则 xfade 会报"timestamp differs"）。

---

## BGM 混音逻辑

```
final_audio = mix(
    dialogue_track,    # 0 dB
    bgm_track,         # auto-ducking: 对白时 -18 dB, 其他 -10 dB
    sfx_track,         # 已在 09-tts-synthesizer 阶段混入 dialogue_track
)
```

Auto-ducking 用 `sidechaincompress` 滤镜：dialogue 出现时 BGM 自动降低音量。

---

## 剪映草稿导出（--emit-jianying）

仿 ArcReel `lib/jianying_draft_service.py`：

输出 ZIP 包含：
```
episode_1.jianying/
  draft_content.json        # 时间线
  draft_meta_info.json
  manifest.json
  resources/
    video_001.mp4
    video_002.mp4
    ...
    audio_001.wav
    bgm.mp3
```

支持剪映 5.x / 6+ 双版本格式（按用户配置选择）。

---

## 前置检查（脚本会自动跑）

- [ ] 当前 cwd 是项目根（含 `project.json`）
- [ ] 剧本 content_mode == "drama"
- [ ] 每个 shot 的 video_clip 存在
- [ ] 每个有 dialogue 的 shot 有 audio
- [ ] `ffmpeg` / `ffprobe` 在 PATH
- [ ] 如指定 `--music`，BGM 文件存在且位于项目目录内（防路径越界）

---

## 输出给 Orchestrator 的摘要

由于这是 utility 类 Skill，直接通过脚本退出码与 stdout 报告：

```json
{
  "status": "success",
  "output_path": "output/episode_1.mp4",
  "duration_sec": 124.5,
  "resolution": "1080x1920",
  "shots_used": 11,
  "transitions_used": { "cut": 7, "fade": 3, "dissolve": 1 },
  "jianying_draft_path": "output/episode_1.jianying.zip",
  "file_size_mb": 18.7
}
```

---

## 缺失能力（明确不支持）

如果用户需要以下能力，建议导出剪映草稿继续后期：

- ❌ narration / reference_video 模式（本脚本只识别 drama）
- ❌ 多集合并 / 单集分片裁剪
- ❌ 字幕渲染（让用户在剪映加，可视化更友好）
- ❌ 片头片尾 intro/outro
- ❌ BGM 多轨道与精细的音量自动化
- ❌ 转场之外的 VFX（粒子/光效）

---

## 反模式

❌ 跳过 normalize 直接 xfade（编码不一致会失败）  
❌ BGM 不做 ducking（盖住对白）  
❌ 输出文件不固定路径（output/ 是约定，不要写到 cwd 根目录）  
❌ 项目目录外的 BGM 路径（路径越界，安全风险）  
❌ 把转场 duration 写得太长（> 1s 节奏崩坏）

---

## 实现参考

`scripts/compose_video.py` 的 skeleton（伪代码，待 M1 实现）：

```python
import argparse, ffmpeg, json
from pathlib import Path

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("script")
    parser.add_argument("--output")
    parser.add_argument("--music")
    parser.add_argument("--no-transitions", action="store_true")
    parser.add_argument("--emit-jianying", action="store_true")
    args = parser.parse_args()

    project_root = find_project_root()
    script = json.load(open(project_root / args.script))
    assert script["content_mode"] == "drama", "only drama supported"

    clips = []
    for scene in script["scenes"]:
        for shot in scene["shots"]:
            clip_path = project_root / "storyboards" / f"ep{script['episode_id']}" / shot["shot_id"] / "clip.mp4"
            assert clip_path.exists(), f"missing {clip_path}"
            clips.append((clip_path, shot["transition_to_next"], shot.get("audio_path")))

    # 1. normalize
    normalized = [normalize_clip(c) for c, _, _ in clips]
    # 2. concat with transitions
    if args.no_transitions:
        video = concat_cut(normalized)
    else:
        video = concat_with_xfade(normalized, [t for _, t, _ in clips])
    # 3. mix audio
    audio = mix_dialogue([a for _, _, a in clips])
    if args.music:
        audio = mix_bgm(audio, project_root / args.music)
    # 4. output
    out = project_root / "output" / (args.output or f"episode_{script['episode_id']}.mp4")
    ffmpeg.output(video, audio, str(out), vcodec="libx264", crf=22, acodec="aac").run()
    # 5. jianying
    if args.emit_jianying:
        emit_jianying_draft(script, normalized, audio, out.with_suffix(".jianying.zip"))
```
