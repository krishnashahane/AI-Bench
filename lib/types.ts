export interface ModelConfig {
  id: string;
  name: string;
  provider: Provider;
  modelId: string;
}

export type Provider = "openai" | "anthropic" | "google" | "groq" | "mistral" | "deepseek";

export interface ProviderInfo {
  name: string;
  color: string;
  badgeClass: string;
  models: { id: string; name: string; costPer1kInput: number; costPer1kOutput: number }[];
}

export interface ApiKeys {
  openai?: string;
  anthropic?: string;
  google?: string;
  groq?: string;
  mistral?: string;
  deepseek?: string;
}

export interface BenchmarkTask {
  id: string;
  name: string;
  prompt: string;
  systemPrompt?: string;
  category: string;
}

export interface BenchmarkResult {
  taskId: string;
  modelId: string;
  modelName: string;
  provider: Provider;
  output: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
  rating?: number;
  error?: string;
  timestamp: number;
}

export interface BenchmarkRun {
  id: string;
  name: string;
  tasks: BenchmarkTask[];
  models: ModelConfig[];
  results: BenchmarkResult[];
  createdAt: number;
}

export const PROVIDERS: Record<Provider, ProviderInfo> = {
  openai: {
    name: "OpenAI",
    color: "#10a37f",
    badgeClass: "badge-green",
    models: [
      { id: "gpt-4o", name: "GPT-4o", costPer1kInput: 0.0025, costPer1kOutput: 0.01 },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", costPer1kInput: 0.00015, costPer1kOutput: 0.0006 },
      { id: "gpt-4-turbo", name: "GPT-4 Turbo", costPer1kInput: 0.01, costPer1kOutput: 0.03 },
      { id: "o1", name: "o1", costPer1kInput: 0.015, costPer1kOutput: 0.06 },
      { id: "o1-mini", name: "o1-mini", costPer1kInput: 0.003, costPer1kOutput: 0.012 },
      { id: "o3-mini", name: "o3-mini", costPer1kInput: 0.0011, costPer1kOutput: 0.0044 },
    ],
  },
  anthropic: {
    name: "Anthropic",
    color: "#d4a574",
    badgeClass: "badge-amber",
    models: [
      { id: "claude-opus-4-6", name: "Claude Opus 4.6", costPer1kInput: 0.015, costPer1kOutput: 0.075 },
      { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", costPer1kInput: 0.003, costPer1kOutput: 0.015 },
      { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", costPer1kInput: 0.0008, costPer1kOutput: 0.004 },
    ],
  },
  google: {
    name: "Google",
    color: "#4285f4",
    badgeClass: "badge-blue",
    models: [
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", costPer1kInput: 0.0001, costPer1kOutput: 0.0004 },
      { id: "gemini-2.0-pro", name: "Gemini 2.0 Pro", costPer1kInput: 0.00125, costPer1kOutput: 0.005 },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", costPer1kInput: 0.00125, costPer1kOutput: 0.005 },
    ],
  },
  groq: {
    name: "Groq",
    color: "#f55036",
    badgeClass: "badge-red",
    models: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", costPer1kInput: 0.00059, costPer1kOutput: 0.00079 },
      { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B", costPer1kInput: 0.00005, costPer1kOutput: 0.00008 },
      { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", costPer1kInput: 0.00024, costPer1kOutput: 0.00024 },
    ],
  },
  mistral: {
    name: "Mistral",
    color: "#ff7000",
    badgeClass: "badge-amber",
    models: [
      { id: "mistral-large-latest", name: "Mistral Large", costPer1kInput: 0.002, costPer1kOutput: 0.006 },
      { id: "mistral-small-latest", name: "Mistral Small", costPer1kInput: 0.0002, costPer1kOutput: 0.0006 },
      { id: "codestral-latest", name: "Codestral", costPer1kInput: 0.0003, costPer1kOutput: 0.0009 },
    ],
  },
  deepseek: {
    name: "DeepSeek",
    color: "#4f8fff",
    badgeClass: "badge-blue",
    models: [
      { id: "deepseek-chat", name: "DeepSeek V3", costPer1kInput: 0.00027, costPer1kOutput: 0.0011 },
      { id: "deepseek-reasoner", name: "DeepSeek R1", costPer1kInput: 0.00055, costPer1kOutput: 0.0022 },
    ],
  },
};

export const PRESET_TASKS: BenchmarkTask[] = [
  {
    id: "code-fizzbuzz",
    name: "FizzBuzz in Rust",
    prompt: "Write a FizzBuzz implementation in Rust that handles numbers 1 to 100. Use idiomatic Rust patterns. Only output code, no explanation.",
    category: "Coding",
  },
  {
    id: "code-api",
    name: "REST API Design",
    prompt: "Design a REST API for a todo app with users, lists, and items. Provide the endpoint structure with HTTP methods, paths, request/response bodies in JSON. Be concise.",
    category: "Coding",
  },
  {
    id: "reason-logic",
    name: "Logic Puzzle",
    prompt: "Alice, Bob, and Charlie each have a different pet (cat, dog, fish). Alice doesn't have the cat. Bob doesn't have the dog or the fish. Who has which pet? Show your reasoning step by step.",
    category: "Reasoning",
  },
  {
    id: "reason-math",
    name: "Math Problem",
    prompt: "A train leaves Station A at 9:00 AM traveling at 60 mph. Another train leaves Station B (300 miles away) at 10:00 AM traveling toward Station A at 90 mph. At what time do they meet? Show work.",
    category: "Reasoning",
  },
  {
    id: "write-email",
    name: "Professional Email",
    prompt: "Write a professional email declining a meeting invitation while suggesting an alternative time. Keep it under 100 words, warm but firm tone.",
    category: "Writing",
  },
  {
    id: "write-summary",
    name: "Text Summarization",
    prompt: "Summarize the concept of blockchain technology in exactly 3 sentences. Each sentence should cover: 1) What it is, 2) How it works, 3) Why it matters.",
    category: "Writing",
  },
  {
    id: "creative-story",
    name: "Micro Story",
    prompt: "Write a complete story in exactly 50 words about a robot discovering music for the first time.",
    category: "Creative",
  },
  {
    id: "analysis-compare",
    name: "Pros/Cons Analysis",
    prompt: "Compare microservices vs monolithic architecture. Give exactly 3 pros and 3 cons for each in a structured format. Be specific, not generic.",
    category: "Analysis",
  },
];
