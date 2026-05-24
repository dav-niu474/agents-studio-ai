/**
 * Provider Adapter 接口定义
 *
 * 灵感来源：huobao-drama backend/src/services/adapters/types.ts
 *
 * 这是 Agents Studio 多供应商接入的核心抽象。
 * 新增一个供应商 = 实现一个 Adapter + 在 registry.ts 中注册一行。
 *
 * 为什么不抄整个 ArcReel 的 lib/image_backends/：
 *  - ArcReel 的 backend 接口耦合了 Project / VersionManager / UsageTracker
 *  - huobao 的接口最干净，可以作为 starter，等业务长出来再扩展
 */

// ============ 通用类型 ============

export interface AIConfig {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  /** 项目级覆盖配置（如分辨率、采样器等供应商特有参数） */
  extras?: Record<string, unknown>;
}

export interface ProviderRequest {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers: Record<string, string>;
  body?: unknown;
}

// ============ 图像生成 ============

export interface ImageGenerationRecord {
  id: string;
  model?: string | null;
  prompt: string;
  negativePrompt?: string | null;
  size?: string | null; // "1024x1024" / "1080x1920"
  /** 关键帧类型：start / end / grid_4 / grid_6 / grid_9 / standalone */
  frameType?: string | null;
  /** IPAdapter 参考图（角色定妆、场景图、道具图等） */
  referenceImages?: string[] | null;
  /** 角色 / 场景 / 道具的 6 层锚点（仅在角色相关任务中有值） */
  identityAnchors?: Record<string, string> | null;
  /** 自定义其他参数 */
  extras?: Record<string, unknown>;
}

export interface ImageGenResponse {
  isAsync: boolean;
  taskId?: string;
  /** 同步模式下的图片 URL */
  imageUrl?: string;
}

export interface ImagePollResponse {
  status: "pending" | "processing" | "completed" | "failed";
  imageUrl?: string;
  error?: string;
}

export interface ImageProviderAdapter {
  provider: string;

  /** 构建图片生成请求 */
  buildGenerateRequest(config: AIConfig, record: ImageGenerationRecord): ProviderRequest;

  /** 解析生成响应（同步 or 异步） */
  parseGenerateResponse(result: unknown): ImageGenResponse;

  /** 构建轮询请求 */
  buildPollRequest(config: AIConfig, taskId: string): ProviderRequest;

  /** 解析轮询响应 */
  parsePollResponse(result: unknown): ImagePollResponse;

  /** 从响应提取 URL，null 表示需要走 base64 路径 */
  extractImageUrl(result: unknown): string | null;

  /** 从响应提取 base64（Gemini 等） */
  extractImageBase64(result: unknown): { data: string; mimeType: string } | null;
}

// ============ 视频生成 ============

export interface VideoGenerationRecord {
  id: string;
  model?: string | null;
  prompt: string;
  /** 视频生成模式 */
  generationMode: "image2video" | "first_last" | "grid" | "reference_video" | "multi_shot";
  imageUrl?: string | null;          // image2video: 单张
  firstFrameUrl?: string | null;     // first_last
  lastFrameUrl?: string | null;      // first_last
  referenceImageUrls?: string[] | null;  // reference_video / multi_shot
  referenceVideoUrls?: string[] | null;
  referenceAudioUrls?: string[] | null;
  duration?: number | null;          // 秒
  aspectRatio?: string | null;       // "9:16" / "16:9"
  resolution?: string | null;        // "1080p" / "720p"
  /** 角色对白（用于唇形同步） */
  lipSyncDialogue?: { character: string; line: string }[] | null;
  extras?: Record<string, unknown>;
}

export interface VideoGenResponse {
  isAsync: boolean;
  taskId?: string;
  videoUrl?: string;
}

export interface VideoPollResponse {
  status: "pending" | "processing" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
  /** 进度（0-100），不支持时为 undefined */
  progress?: number;
}

export interface VideoProviderAdapter {
  provider: string;

  /** 此 adapter 支持哪些 generationMode */
  supportedModes: VideoGenerationRecord["generationMode"][];

  buildGenerateRequest(config: AIConfig, record: VideoGenerationRecord): ProviderRequest;
  parseGenerateResponse(result: unknown): VideoGenResponse;
  buildPollRequest(config: AIConfig, taskId: string): ProviderRequest;
  parsePollResponse(result: unknown): VideoPollResponse;
  extractVideoUrl(result: unknown): string | null;

  /** 把通用 prompt 转为该供应商的 prompt 风格（@ 引用转换等） */
  composePrompt(record: VideoGenerationRecord): string;
}

// ============ 文本生成 ============

export interface TextGenerationRecord {
  systemPrompt?: string;
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  /** 期望的结构化输出 schema（JSON Schema） */
  responseSchema?: Record<string, unknown>;
  temperature?: number;
  maxTokens?: number;
  /** 视觉理解：传入图片 URL */
  imageInputs?: string[];
}

export interface TextProviderAdapter {
  provider: string;
  /** 是否支持视觉输入 */
  supportsVision: boolean;
  /** 是否支持原生 JSON Schema */
  supportsStructuredOutput: boolean;

  buildRequest(config: AIConfig, record: TextGenerationRecord): ProviderRequest;
  parseResponse(result: unknown): { text: string; usage?: { promptTokens: number; completionTokens: number } };
}

// ============ TTS ============

export interface TTSGenerationRecord {
  voiceId: string;
  text: string;
  emotion?: string;
  speed?: number;       // 0.5 - 2.0
  /** 声音克隆参考音频（如有） */
  clonedVoicePath?: string;
  format?: "wav" | "mp3" | "flac";
  sampleRate?: number;  // Hz
}

export interface TTSResponse {
  /** hex / base64 编码的音频数据 */
  audioData: string;
  encoding: "hex" | "base64" | "url";
  audioUrl?: string;     // 当 encoding === "url"
  durationSec: number;
  sampleRate: number;
  format: string;
}

export interface TTSProviderAdapter {
  provider: string;
  /** 是否支持声音克隆 */
  supportsVoiceCloning: boolean;
  /** 是否支持显式情感参数 */
  supportsEmotion: boolean;

  buildGenerateRequest(config: AIConfig, record: TTSGenerationRecord): ProviderRequest;
  parseResponse(result: unknown): TTSResponse;
  /** 列出可用音色 */
  buildListVoicesRequest(config: AIConfig): ProviderRequest;
  parseListVoicesResponse(result: unknown): VoiceInfo[];
}

export interface VoiceInfo {
  voiceId: string;
  name: string;
  gender: "male" | "female" | "neutral";
  ageGroup?: "child" | "teen" | "young_adult" | "adult" | "elder";
  language: string;       // "zh-CN" / "en-US" / ...
  styleTags?: string[];   // ["温柔", "甜美"]
  previewUrl?: string;
}
