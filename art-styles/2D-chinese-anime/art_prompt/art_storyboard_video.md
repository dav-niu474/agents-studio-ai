# 视频提示词风格约束 · 国风二次元

> 由 09-video-generator 加载，提供视频生成时的风格锚点。

---

## 必加风格标签

| 模式 | 标签 |
|---|---|
| **通用多参模式（英文）** | `Chinese style anime, cel-shaded, neo-chic oriental aesthetic, cinematic, vivid colors, detailed brushwork` |
| **通用首尾帧模式（英文）** | `Chinese style anime, cel-shaded, neo-chic oriental aesthetic, cinematic, vivid colors, detailed brushwork, shallow depth of field` |
| **Seedance 2.0（中文）** | `国风二次元动画，赛璐璐平涂，新国潮东方美学，电影风格，色彩鲜明，细腻笔触` |
| **Veo 3.1（英文）** | `Chinese style anime aesthetic, traditional Chinese animation rendering, cel-shaded character models, cinematic camera movement` |

---

## 运动风格

国风二次元的运动倾向：

- 飘逸（衣袂、长发、薄雾）
- 节制（不要过快的镜头切换）
- 留白（适当静帧 / 慢推 / 摇景）
- 优雅（角色动作连贯、不僵硬）

避免：
- 快速 zoom（破坏国风氛围）
- 强硬剪辑（与新国潮气质不符）
- 过度抖动 / 手持感（除非武侠打斗段落）

---

## 唇形同步

如果视频模型支持 lip sync（Seedance 2.0、Vidu Q3）：

```
[lip sync] "对白内容"
```

并在 dialogue 字段把情绪 emotion 也注入：

```
0-3秒：{动作描述}，{情绪}，[lip sync] "对白"。
```
