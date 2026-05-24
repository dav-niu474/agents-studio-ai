# Adapter 包

> 多供应商接入的核心抽象。**直接复用 huobao-drama 的接口设计**。

## 文件

| 文件 | 内容 |
|---|---|
| `types.ts` | 4 类 Provider Adapter 接口 + 通用类型 |
| `registry.ts` | 注册表 + 注册/解析函数 |

## 当前状态

仅类型定义，**还没有具体实现**。M1 阶段会逐步落地：

| 优先级 | 待实现 |
|---|---|
| P0 | OpenAI 兼容（覆盖 GPT/Qwen/DeepSeek/Claude） |
| P0 | Volcengine Seedream / Seedance |
| P0 | MiniMax TTS |
| P1 | Gemini Image / Veo |
| P1 | Vidu Q3 |
| P1 | Ali Wanx / Wan |
| P2 | Grok / Sora / Kling |
| P2 | Edge-TTS / Index-TTS |

## 实现方式

直接抄 [`huobao-drama/backend/src/services/adapters/`](https://github.com/chatfire-AI/huobao-drama/tree/main/backend/src/services/adapters) 的 10 个具体 adapter，按 Apache-2.0 协议保留致谢即可。

## 自定义供应商动态注入

仿 ArcReel `lib/custom_provider/`：

```typescript
// 用户在设置页保存自定义供应商配置后：
const adapter = await createCompatAdapter({
  baseUrl: "https://api.example.com/v1",
  apiKey: "sk-...",
  compatibility: "openai",  // 或 "google"
});
registerImageAdapter(`custom_${userId}_${slug}`, adapter);
```
