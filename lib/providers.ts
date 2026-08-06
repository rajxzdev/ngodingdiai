export type ProviderKind = "openai" | "anthropic" | "google";

export interface ProviderDef {
  id: string;
  name: string;
  kind: ProviderKind;
  base: string;
  docs: string;
  keyLabel: string;
  placeholder: string;
  hint: string;
  /** Model murah/cepat untuk uji koneksi key (tanpa perlu model dari role) */
  testModel: string;
  /** Provider butuh Base URL manual (custom) */
  needsBase?: boolean;
  /** Bisa dipanggil langsung dari browser (CORS terbuka). Kalau false → lewat proxy server. */
  browserSafe: boolean;
}

export const PROVIDERS: ProviderDef[] = [
  {
    id: "openrouter",
    name: "OpenRouter",
    kind: "openai",
    base: "https://openrouter.ai/api/v1",
    docs: "https://openrouter.ai/keys",
    keyLabel: "OpenRouter API Key",
    placeholder: "sk-or-v1-••••••••••••••••",
    hint: "Satu key untuk ratusan model (OpenAI, Anthropic, Google, DeepSeek, dll).",
    testModel: "openai/gpt-oss-20b",
    browserSafe: true,
  },
  {
    id: "openai",
    name: "OpenAI",
    kind: "openai",
    base: "https://api.openai.com/v1",
    docs: "https://platform.openai.com/api-keys",
    keyLabel: "OpenAI API Key",
    placeholder: "sk-••••••••••••••••",
    hint: "GPT-5.6, GPT-5.5, GPT-5.4, o-series, dst.",
    testModel: "gpt-4o-mini",
    browserSafe: false,
  },
  {
    id: "anthropic",
    name: "Anthropic",
    kind: "anthropic",
    base: "https://api.anthropic.com",
    docs: "https://console.anthropic.com/settings/keys",
    keyLabel: "Anthropic API Key",
    placeholder: "sk-ant-••••••••••••••••",
    hint: "Claude Opus 5, Sonnet 5, Haiku 4.5, dst.",
    testModel: "claude-haiku-4-5",
    browserSafe: false,
  },
  {
    id: "google",
    name: "Google AI Studio",
    kind: "google",
    base: "https://generativelanguage.googleapis.com/v1beta",
    docs: "https://aistudio.google.com/apikey",
    keyLabel: "Google API Key",
    placeholder: "AIza••••••••••••••••••",
    hint: "Gemini 3.6 Flash, 3.1 Pro, 2.5 Flash-Lite, dst.",
    testModel: "gemini-2.5-flash-lite",
    browserSafe: true,
  },
  {
    id: "groq",
    name: "Groq",
    kind: "openai",
    base: "https://api.groq.com/openai/v1",
    docs: "https://console.groq.com/keys",
    keyLabel: "Groq API Key",
    placeholder: "gsk_••••••••••••••••",
    hint: "Inference super cepat (Llama, Qwen, GPT-OSS) di LPU.",
    testModel: "llama-3.1-8b-instant",
    browserSafe: true,
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    kind: "openai",
    base: "https://api.deepseek.com/v1",
    docs: "https://platform.deepseek.com/api_keys",
    keyLabel: "DeepSeek API Key",
    placeholder: "sk-••••••••••••••••",
    hint: "DeepSeek V4, V3.2, R1 — murah & performa tinggi.",
    testModel: "deepseek-chat",
    browserSafe: true,
  },
  {
    id: "mistral",
    name: "Mistral AI",
    kind: "openai",
    base: "https://api.mistral.ai/v1",
    docs: "https://console.mistral.ai/api-keys/",
    keyLabel: "Mistral API Key",
    placeholder: "••••••••••••••••",
    hint: "Mistral Large, Medium 3, Small 3.2, Codestral.",
    testModel: "mistral-small-3.2",
    browserSafe: true,
  },
  {
    id: "xai",
    name: "xAI (Grok)",
    kind: "openai",
    base: "https://api.x.ai/v1",
    docs: "https://console.x.ai/",
    keyLabel: "xAI API Key",
    placeholder: "xai-••••••••••••••••",
    hint: "Grok 4, Grok 4 Fast, Grok 3.",
    testModel: "grok-4-fast",
    browserSafe: true,
  },
  {
    id: "custom",
    name: "Custom (OpenAI-compatible)",
    kind: "openai",
    base: "",
    docs: "",
    keyLabel: "Custom API Key",
    placeholder: "sk-••••••••••••••••",
    hint: "Endpoint OpenAI-compatible apa pun (Ollama, vLLM, LM Studio, gateway sendiri). Isi Base URL juga.",
    testModel: "",
    browserSafe: true,
    needsBase: true,
  },
];

export function getProvider(id: string): ProviderDef {
  const p = PROVIDERS.find((p) => p.id === id);
  if (!p) throw new Error(`Provider tidak ditemukan: ${id}`);
  return p;
}

export function providerKind(id: string): ProviderKind {
  return getProvider(id).kind;
}
