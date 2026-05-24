/**
 * Provider Adapter 注册表
 *
 * 灵感来源：huobao-drama backend/src/services/adapters/registry.ts
 *
 * 使用约定：
 *  - 所有 adapter 在启动时注册
 *  - 自定义供应商（custom_provider）在用户保存配置后动态注册
 *  - 解析顺序：用户主动选择 > 项目默认 > 全局默认 > 系统兜底
 */

import type {
  ImageProviderAdapter,
  VideoProviderAdapter,
  TextProviderAdapter,
  TTSProviderAdapter,
} from "./types";

// ============ 注册表（运行时填充） ============

export const imageAdapters: Record<string, ImageProviderAdapter> = {
  // openai: new OpenAIImageAdapter(),
  // gemini: new GeminiImageAdapter(),
  // volcengine: new VolcengineImageAdapter(),  // Seedream
  // ali: new AliImageAdapter(),                 // Wanx
  // minimax: new MiniMaxImageAdapter(),
  // vidu: new ViduImageAdapter(),
};

export const videoAdapters: Record<string, VideoProviderAdapter> = {
  // volcengine_seedance: new SeedanceVideoAdapter(),
  // gemini_veo: new VeoVideoAdapter(),
  // grok: new GrokVideoAdapter(),
  // openai_sora: new SoraVideoAdapter(),
  // vidu_q3: new ViduQ3VideoAdapter(),
  // ali_wan: new WanVideoAdapter(),
  // minimax: new MiniMaxVideoAdapter(),
  // kling: new KlingVideoAdapter(),
};

export const textAdapters: Record<string, TextProviderAdapter> = {
  // openai_compat: new OpenAICompatibleAdapter(),  // GPT / Claude / Qwen / DeepSeek
  // gemini: new GeminiTextAdapter(),
  // anthropic: new AnthropicTextAdapter(),
  // volcengine_doubao: new DoubaoTextAdapter(),
};

export const ttsAdapters: Record<string, TTSProviderAdapter> = {
  // minimax: new MiniMaxTTSAdapter(),
  // index: new IndexTTSAdapter(),
  // edge: new EdgeTTSAdapter(),
  // openai: new OpenAITTSAdapter(),
  // volcengine: new VolcengineTTSAdapter(),
};

// ============ 注册 / 注销（用于 custom_provider 运行时注入） ============

export function registerImageAdapter(provider: string, adapter: ImageProviderAdapter): void {
  imageAdapters[provider.toLowerCase()] = adapter;
}

export function registerVideoAdapter(provider: string, adapter: VideoProviderAdapter): void {
  videoAdapters[provider.toLowerCase()] = adapter;
}

export function registerTextAdapter(provider: string, adapter: TextProviderAdapter): void {
  textAdapters[provider.toLowerCase()] = adapter;
}

export function registerTTSAdapter(provider: string, adapter: TTSProviderAdapter): void {
  ttsAdapters[provider.toLowerCase()] = adapter;
}

// ============ 解析（带兜底） ============

const FALLBACK_IMAGE = "openai";
const FALLBACK_VIDEO = "volcengine_seedance";
const FALLBACK_TEXT = "openai_compat";
const FALLBACK_TTS = "edge";

export function getImageAdapter(provider?: string): ImageProviderAdapter {
  if (!provider) return imageAdapters[FALLBACK_IMAGE];
  return imageAdapters[provider.toLowerCase()] || imageAdapters[FALLBACK_IMAGE];
}

export function getVideoAdapter(provider?: string): VideoProviderAdapter {
  if (!provider) return videoAdapters[FALLBACK_VIDEO];
  return videoAdapters[provider.toLowerCase()] || videoAdapters[FALLBACK_VIDEO];
}

export function getTextAdapter(provider?: string): TextProviderAdapter {
  if (!provider) return textAdapters[FALLBACK_TEXT];
  return textAdapters[provider.toLowerCase()] || textAdapters[FALLBACK_TEXT];
}

export function getTTSAdapter(provider?: string): TTSProviderAdapter {
  if (!provider) return ttsAdapters[FALLBACK_TTS];
  return ttsAdapters[provider.toLowerCase()] || ttsAdapters[FALLBACK_TTS];
}

// ============ 列出可用 ============

export function listAvailableProviders() {
  return {
    image: Object.keys(imageAdapters),
    video: Object.keys(videoAdapters),
    text: Object.keys(textAdapters),
    tts: Object.keys(ttsAdapters),
  };
}
