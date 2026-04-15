export type ModelProvider =
  | "MiniMax"
  | "Meta"
  | "Google"
  | "Alibaba"
  | "Mistral"
  | "OpenAI"
  | "Anthropic"
  | "Cohere"
  | "xAI"
  | "DeepSeek";

export type ModelStatus = "Active" | "Deprecated";

export interface AIModel {
  id: string;
  name: string;
  provider: ModelProvider;
  status: ModelStatus;
  contextLength: string;
  pricePerMTokens: string;
  isFree: boolean;
  apiType: string;
  description: string;
  tagline: string;
  badge: "featured" | "new" | "free" | "premium";
}

export const PROVIDER_META: Record<
  ModelProvider,
  { color: string; bg: string; textColor: string; abbr: string }
> = {
  MiniMax:  { color: "#4F46E5", bg: "#EEF2FF", textColor: "#3730A3", abbr: "MX" },
  Meta:     { color: "#1877F2", bg: "#EFF6FF", textColor: "#1D4ED8", abbr: "M" },
  Google:   { color: "#EA4335", bg: "#FEF2F2", textColor: "#B91C1C", abbr: "G" },
  Alibaba:  { color: "#F97316", bg: "#FFF7ED", textColor: "#C2410C", abbr: "A" },
  Mistral:  { color: "#10B981", bg: "#ECFDF5", textColor: "#065F46", abbr: "Mi" },
  OpenAI:   { color: "#10A37F", bg: "#ECFDF5", textColor: "#065F46", abbr: "OA" },
  Anthropic:{ color: "#DC6B19", bg: "#FFF7ED", textColor: "#9A3412", abbr: "An" },
  Cohere:   { color: "#5B21B6", bg: "#F5F3FF", textColor: "#4C1D95", abbr: "Co" },
  xAI:      { color: "#1F2937", bg: "#F9FAFB", textColor: "#111827", abbr: "xA" },
  DeepSeek: { color: "#0891B2", bg: "#ECFEFF", textColor: "#155E75", abbr: "DS" },
};

export const MODELS: AIModel[] = [
  {
    id: "minimax-m2.7",
    name: "MiniMax M2.7",
    provider: "MiniMax",
    status: "Active",
    contextLength: "1M",
    pricePerMTokens: "Free",
    isFree: true,
    apiType: "API",
    description: "MiniMax's flagship multimodal model with massive context window.",
    tagline: "Massive context, zero cost",
    badge: "featured",
  },
  {
    id: "llama-3.1-405b",
    name: "Llama 3.1 405B",
    provider: "Meta",
    status: "Active",
    contextLength: "128K",
    pricePerMTokens: "Free",
    isFree: true,
    apiType: "API",
    description: "Meta's largest open-source model, ideal for fine-tuning and research.",
    tagline: "Open-source frontier scale",
    badge: "free",
  },
  {
    id: "gemma-3-27b",
    name: "Gemma 3 27B",
    provider: "Google",
    status: "Active",
    contextLength: "128K",
    pricePerMTokens: "Free",
    isFree: true,
    apiType: "API",
    description: "Google's efficient open model family with strong reasoning.",
    tagline: "Efficient open intelligence",
    badge: "free",
  },
  {
    id: "qwen-2.5-72b",
    name: "Qwen 2.5 72B",
    provider: "Alibaba",
    status: "Active",
    contextLength: "32K",
    pricePerMTokens: "Free",
    isFree: true,
    apiType: "API",
    description: "Alibaba's most capable open multilingual model.",
    tagline: "Multilingual mastery, open access",
    badge: "free",
  },
  {
    id: "mistral-small-3",
    name: "Mistral Small 3",
    provider: "Mistral",
    status: "Active",
    contextLength: "32K",
    pricePerMTokens: "Free",
    isFree: true,
    apiType: "API",
    description: "Mistral's compact model with excellent instruction following.",
    tagline: "Lightweight, yet powerful",
    badge: "free",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    status: "Active",
    contextLength: "128K",
    pricePerMTokens: "$2.50",
    isFree: false,
    apiType: "API",
    description: "OpenAI's omni model — vision, audio, and text in one unified model.",
    tagline: "The omni frontier",
    badge: "premium",
  },
  {
    id: "claude-3.7-sonnet",
    name: "Claude 3.7 Sonnet",
    provider: "Anthropic",
    status: "Active",
    contextLength: "200K",
    pricePerMTokens: "$3.00",
    isFree: false,
    apiType: "API",
    description: "Anthropic's longest-context model with class-leading reasoning.",
    tagline: "Extended thought, extended context",
    badge: "premium",
  },
  {
    id: "command-r-plus",
    name: "Command R+",
    provider: "Cohere",
    status: "Active",
    contextLength: "128K",
    pricePerMTokens: "$3.00",
    isFree: false,
    apiType: "API",
    description: "Cohere's enterprise-grade RAG-optimized model.",
    tagline: "Built for retrieval-augmented generation",
    badge: "premium",
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    status: "Active",
    contextLength: "1M",
    pricePerMTokens: "Free",
    isFree: true,
    apiType: "API",
    description: "Google's fastest model with a 1M token context window.",
    tagline: "Speed meets scale",
    badge: "new",
  },
  {
    id: "grok-2",
    name: "Grok 2",
    provider: "xAI",
    status: "Active",
    contextLength: "131K",
    pricePerMTokens: "Free",
    isFree: true,
    apiType: "API",
    description: "xAI's real-time aware model with a rebellious streak.",
    tagline: "Real-time reasoning, real personality",
    badge: "free",
  },
  {
    id: "deepseek-v3",
    name: "DeepSeek V3",
    provider: "DeepSeek",
    status: "Active",
    contextLength: "64K",
    pricePerMTokens: "Free",
    isFree: true,
    apiType: "API",
    description: "DeepSeek's MoE model with competitive reasoning at zero cost.",
    tagline: "Mixture-of-experts, maximum value",
    badge: "free",
  },
  {
    id: "o3",
    name: "o3",
    provider: "OpenAI",
    status: "Active",
    contextLength: "200K",
    pricePerMTokens: "$10.00",
    isFree: false,
    apiType: "API",
    description: "OpenAI's most powerful reasoning model for complex tasks.",
    tagline: "The reasoning benchmark",
    badge: "premium",
  },
  {
    id: "o4-mini",
    name: "o4 Mini",
    provider: "OpenAI",
    status: "Active",
    contextLength: "200K",
    pricePerMTokens: "$1.10",
    isFree: false,
    apiType: "API",
    description: "OpenAI's efficient reasoning model — fast, capable, affordable.",
    tagline: "Reasoning without the premium",
    badge: "premium",
  },
  {
    id: "o4-mini-high",
    name: "o4 Mini High",
    provider: "OpenAI",
    status: "Active",
    contextLength: "200K",
    pricePerMTokens: "$3.00",
    isFree: false,
    apiType: "API",
    description: "o4 Mini's higher-intelligence sibling with deeper reasoning.",
    tagline: "Upgraded reasoning power",
    badge: "premium",
  },
];
