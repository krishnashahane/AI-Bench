"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  type Provider,
  type ApiKeys,
  type BenchmarkTask,
  type BenchmarkResult,
  type ModelConfig,
  PROVIDERS,
  PRESET_TASKS,
} from "@/lib/types";

// ─── Helpers ────────────────────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function formatMs(ms: number) {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
}

function formatCost(usd: number) {
  if (usd === 0) return "$0.00";
  if (usd < 0.001) return `$${usd.toFixed(6)}`;
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(3)}`;
}

function getProviderBadge(provider: Provider) {
  return PROVIDERS[provider]?.badgeClass || "badge-blue";
}

function computeCost(provider: Provider, modelId: string, inputTokens: number, outputTokens: number): number {
  const models = PROVIDERS[provider]?.models || [];
  const model = models.find((m) => m.id === modelId);
  if (!model) return 0;
  return (inputTokens / 1000) * model.costPer1kInput + (outputTokens / 1000) * model.costPer1kOutput;
}

// ─── Storage helpers ────────────────────────────────────────────────────────
function loadKeys(): ApiKeys {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem("aibench_keys") || "{}");
  } catch {
    return {};
  }
}
function saveKeys(keys: ApiKeys) {
  localStorage.setItem("aibench_keys", JSON.stringify(keys));
}

// ─── Icons (inline SVG) ────────────────────────────────────────────────────
const Icons = {
  key: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  ),
  play: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  share: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  ),
  download: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  copy: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  zap: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  eye: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeOff: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  chevDown: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  image: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
    </svg>
  ),
};

// ─── Main Component ────────────────────────────────────────────────────────
export default function Home() {
  // State
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [showKeys, setShowKeys] = useState(false);
  const [selectedModels, setSelectedModels] = useState<ModelConfig[]>([]);
  const [tasks, setTasks] = useState<BenchmarkTask[]>([]);
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [activeTab, setActiveTab] = useState<"setup" | "results" | "compare">("setup");
  const [showApiPanel, setShowApiPanel] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [customTaskName, setCustomTaskName] = useState("");
  const [customSystemPrompt, setCustomSystemPrompt] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setApiKeys(loadKeys());
  }, []);

  // API Key management
  const updateKey = useCallback((provider: Provider, value: string) => {
    setApiKeys((prev) => {
      const next = { ...prev, [provider]: value || undefined };
      saveKeys(next);
      return next;
    });
  }, []);

  // Model selection
  const toggleModel = useCallback((provider: Provider, modelId: string, modelName: string) => {
    setSelectedModels((prev) => {
      const key = `${provider}:${modelId}`;
      const exists = prev.find((m) => m.id === key);
      if (exists) return prev.filter((m) => m.id !== key);
      return [...prev, { id: key, name: modelName, provider, modelId }];
    });
  }, []);

  const isModelSelected = (provider: Provider, modelId: string) =>
    selectedModels.some((m) => m.id === `${provider}:${modelId}`);

  // Task management
  const addPresetTask = useCallback((task: BenchmarkTask) => {
    setTasks((prev) => (prev.find((t) => t.id === task.id) ? prev : [...prev, task]));
  }, []);

  const addCustomTask = useCallback(() => {
    if (!customPrompt.trim()) return;
    const task: BenchmarkTask = {
      id: `custom-${uid()}`,
      name: customTaskName.trim() || "Custom Task",
      prompt: customPrompt.trim(),
      systemPrompt: customSystemPrompt.trim() || undefined,
      category: "Custom",
    };
    setTasks((prev) => [...prev, task]);
    setCustomPrompt("");
    setCustomTaskName("");
    setCustomSystemPrompt("");
  }, [customPrompt, customTaskName, customSystemPrompt]);

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Run benchmark
  const runBenchmark = useCallback(async () => {
    if (selectedModels.length === 0 || tasks.length === 0) return;

    setRunning(true);
    setResults([]);
    setActiveTab("results");
    const total = selectedModels.length * tasks.length;
    setProgress({ done: 0, total });

    const newResults: BenchmarkResult[] = [];

    for (const task of tasks) {
      const promises = selectedModels.map(async (model) => {
        const key = apiKeys[model.provider];
        if (!key) {
          const errResult: BenchmarkResult = {
            taskId: task.id,
            modelId: model.id,
            modelName: model.name,
            provider: model.provider,
            output: "",
            latencyMs: 0,
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            costUsd: 0,
            error: `No API key for ${PROVIDERS[model.provider].name}`,
            timestamp: Date.now(),
          };
          newResults.push(errResult);
          setResults((prev) => [...prev, errResult]);
          setProgress((prev) => ({ ...prev, done: prev.done + 1 }));
          return;
        }

        try {
          const res = await fetch("/api/benchmark", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider: model.provider,
              modelId: model.modelId,
              prompt: task.prompt,
              systemPrompt: task.systemPrompt,
              apiKey: key,
            }),
          });

          const data = await res.json();

          if (data.error) {
            const errResult: BenchmarkResult = {
              taskId: task.id,
              modelId: model.id,
              modelName: model.name,
              provider: model.provider,
              output: "",
              latencyMs: 0,
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0,
              costUsd: 0,
              error: data.error,
              timestamp: Date.now(),
            };
            newResults.push(errResult);
            setResults((prev) => [...prev, errResult]);
          } else {
            const cost = computeCost(model.provider, model.modelId, data.inputTokens, data.outputTokens);
            const r: BenchmarkResult = {
              taskId: task.id,
              modelId: model.id,
              modelName: model.name,
              provider: model.provider,
              output: data.output,
              latencyMs: data.latencyMs,
              inputTokens: data.inputTokens,
              outputTokens: data.outputTokens,
              totalTokens: data.totalTokens,
              costUsd: cost,
              timestamp: Date.now(),
            };
            newResults.push(r);
            setResults((prev) => [...prev, r]);
          }
        } catch (err) {
          const errResult: BenchmarkResult = {
            taskId: task.id,
            modelId: model.id,
            modelName: model.name,
            provider: model.provider,
            output: "",
            latencyMs: 0,
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            costUsd: 0,
            error: err instanceof Error ? err.message : "Network error",
            timestamp: Date.now(),
          };
          newResults.push(errResult);
          setResults((prev) => [...prev, errResult]);
        }

        setProgress((prev) => ({ ...prev, done: prev.done + 1 }));
      });

      await Promise.all(promises);
    }

    setRunning(false);
  }, [selectedModels, tasks, apiKeys]);

  // Rating
  const setRating = useCallback((taskId: string, modelId: string, rating: number) => {
    setResults((prev) =>
      prev.map((r) => (r.taskId === taskId && r.modelId === modelId ? { ...r, rating } : r))
    );
  }, []);

  // Copy output
  const copyOutput = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // Export as image
  const exportAsImage = useCallback(async () => {
    if (!resultsRef.current) return;
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(resultsRef.current, {
        backgroundColor: "#0a0a0f",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `aibench-results-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      alert("Failed to export image. Try again.");
    }
  }, []);

  // Export as Markdown
  const exportAsMarkdown = useCallback(() => {
    if (results.length === 0) return;

    const taskIds = [...new Set(results.map((r) => r.taskId))];
    const modelIds = [...new Set(results.map((r) => r.modelId))];

    let md = "# AI Bench Results\n\n";

    for (const taskId of taskIds) {
      const task = tasks.find((t) => t.id === taskId);
      md += `## ${task?.name || taskId}\n`;
      md += `> ${task?.prompt || ""}\n\n`;

      md += "| Model | Latency | Tokens | Cost | Rating |\n";
      md += "|-------|---------|--------|------|--------|\n";

      for (const modelId of modelIds) {
        const r = results.find((res) => res.taskId === taskId && res.modelId === modelId);
        if (!r) continue;
        const stars = r.rating ? "★".repeat(r.rating) + "☆".repeat(5 - r.rating) : "—";
        md += `| ${r.modelName} | ${r.error ? "ERROR" : formatMs(r.latencyMs)} | ${r.totalTokens} | ${formatCost(r.costUsd)} | ${stars} |\n`;
      }
      md += "\n";
    }

    md += "\n*Generated by [AI Bench](https://github.com/ai-bench)*\n";

    navigator.clipboard.writeText(md);
    alert("Markdown copied to clipboard!");
  }, [results, tasks]);

  // ─── Computed values ──────────────────────────────────────────────────
  const configuredProviders = Object.entries(apiKeys).filter(([, v]) => v).map(([k]) => k as Provider);
  const canRun = selectedModels.length > 0 && tasks.length > 0 && !running;
  const taskCategories = [...new Set(PRESET_TASKS.map((t) => t.category))];

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          background: "rgba(10,10,15,0.8)",
          backdropFilter: "blur(20px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "var(--gradient-1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {Icons.zap}
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px" }}>AI Bench</h1>
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>Benchmark any LLM on YOUR tasks</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-secondary" onClick={() => setShowApiPanel(!showApiPanel)}>
              {Icons.key}
              <span>API Keys</span>
              {configuredProviders.length > 0 && (
                <span className="badge badge-green" style={{ marginLeft: 4 }}>{configuredProviders.length}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* API Keys Panel */}
      {showApiPanel && (
        <div className="animate-fade-in" style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>API Keys</h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
                  Keys are stored locally in your browser. Never sent to our servers.
                </p>
              </div>
              <button className="btn-icon" onClick={() => setShowKeys(!showKeys)} title={showKeys ? "Hide keys" : "Show keys"}>
                {showKeys ? Icons.eyeOff : Icons.eye}
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {(Object.entries(PROVIDERS) as [Provider, typeof PROVIDERS[Provider]][]).map(([key, info]) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
                    <span className={`badge ${info.badgeClass}`} style={{ marginRight: 6 }}>{info.name}</span>
                    {apiKeys[key] ? Icons.check : null}
                  </label>
                  <input
                    type={showKeys ? "text" : "password"}
                    className="input-field"
                    placeholder={`${info.name} API key...`}
                    value={apiKeys[key] || ""}
                    onChange={(e) => updateKey(key, e.target.value)}
                    style={{ fontSize: 13 }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px", display: "flex", gap: 0 }}>
          {(["setup", "results", "compare"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "14px 24px",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab ? "2px solid var(--accent-blue)" : "2px solid transparent",
                color: activeTab === tab ? "var(--text-primary)" : "var(--text-muted)",
                fontWeight: activeTab === tab ? 600 : 400,
                fontSize: 14,
                cursor: "pointer",
                transition: "all 0.2s",
                textTransform: "capitalize",
              }}
            >
              {tab === "setup" ? "Setup" : tab === "results" ? `Results${results.length > 0 ? ` (${results.length})` : ""}` : "Compare"}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "24px" }}>
        {/* ──── SETUP TAB ──── */}
        {activeTab === "setup" && (
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {/* Model Selection */}
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Select Models</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {(Object.entries(PROVIDERS) as [Provider, typeof PROVIDERS[Provider]][]).map(([providerKey, info]) => {
                  const hasKey = !!apiKeys[providerKey as Provider];
                  return (
                    <div key={providerKey} className="glass-card" style={{ padding: 20, opacity: hasKey ? 1 : 0.5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                        <span className={`badge ${info.badgeClass}`}>{info.name}</span>
                        {!hasKey && (
                          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Add API key to enable</span>
                        )}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {info.models.map((model) => {
                          const selected = isModelSelected(providerKey as Provider, model.id);
                          return (
                            <button
                              key={model.id}
                              onClick={() => hasKey && toggleModel(providerKey as Provider, model.id, model.name)}
                              disabled={!hasKey}
                              style={{
                                padding: "8px 16px",
                                borderRadius: 10,
                                border: selected ? "1px solid var(--accent-blue)" : "1px solid var(--border)",
                                background: selected ? "rgba(79,143,255,0.1)" : "var(--bg-primary)",
                                color: selected ? "var(--accent-blue)" : "var(--text-secondary)",
                                fontWeight: selected ? 600 : 400,
                                fontSize: 13,
                                cursor: hasKey ? "pointer" : "not-allowed",
                                transition: "all 0.2s",
                              }}
                            >
                              {model.name}
                              <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                                ${model.costPer1kInput}/1K in · ${model.costPer1kOutput}/1K out
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Task Selection */}
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Select Tasks</h2>

              {/* Preset tasks */}
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 12 }}>Preset Tasks</h3>
                {taskCategories.map((cat) => (
                  <div key={cat} style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {cat}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {PRESET_TASKS.filter((t) => t.category === cat).map((task) => {
                        const isAdded = tasks.some((t) => t.id === task.id);
                        return (
                          <button
                            key={task.id}
                            onClick={() => (isAdded ? removeTask(task.id) : addPresetTask(task))}
                            style={{
                              padding: "8px 14px",
                              borderRadius: 8,
                              border: isAdded ? "1px solid var(--accent-green)" : "1px solid var(--border)",
                              background: isAdded ? "rgba(16,185,129,0.1)" : "var(--bg-tertiary)",
                              color: isAdded ? "var(--accent-green)" : "var(--text-secondary)",
                              fontSize: 13,
                              cursor: "pointer",
                              transition: "all 0.2s",
                              fontWeight: isAdded ? 600 : 400,
                            }}
                          >
                            {isAdded ? "✓ " : ""}{task.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom task */}
              <div className="glass-card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 12 }}>
                  {Icons.plus} Add Custom Task
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <input
                    className="input-field"
                    placeholder="Task name (optional)"
                    value={customTaskName}
                    onChange={(e) => setCustomTaskName(e.target.value)}
                  />
                  <input
                    className="input-field"
                    placeholder="System prompt (optional)"
                    value={customSystemPrompt}
                    onChange={(e) => setCustomSystemPrompt(e.target.value)}
                  />
                  <textarea
                    className="input-field"
                    placeholder="Enter your prompt here... This is where you test what matters to YOU."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    style={{ minHeight: 100 }}
                  />
                  <button className="btn-primary" onClick={addCustomTask} disabled={!customPrompt.trim()} style={{ alignSelf: "flex-start" }}>
                    {Icons.plus} Add Task
                  </button>
                </div>
              </div>

              {/* Selected tasks */}
              {tasks.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                    Selected Tasks ({tasks.length})
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 16px",
                          background: "var(--bg-tertiary)",
                          borderRadius: 10,
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span className={`badge ${task.category === "Custom" ? "badge-purple" : "badge-cyan"}`}>
                              {task.category}
                            </span>
                            <span style={{ fontWeight: 500, fontSize: 14 }}>{task.name}</span>
                          </div>
                          <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {task.prompt}
                          </p>
                        </div>
                        <button className="btn-icon" onClick={() => removeTask(task.id)} style={{ flexShrink: 0, marginLeft: 8 }}>
                          {Icons.trash}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Run Button */}
            <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
              <button className="btn-primary" onClick={runBenchmark} disabled={!canRun} style={{ padding: "16px 48px", fontSize: 17 }}>
                {running ? (
                  <>
                    <span className="spinner" /> Running...
                  </>
                ) : (
                  <>
                    {Icons.play} Run Benchmark
                    {selectedModels.length > 0 && tasks.length > 0 && (
                      <span style={{ opacity: 0.7, fontSize: 13, marginLeft: 4 }}>
                        ({selectedModels.length} models × {tasks.length} tasks)
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ──── RESULTS TAB ──── */}
        {activeTab === "results" && (
          <div className="animate-fade-in">
            {/* Progress */}
            {running && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>Running benchmark...</span>
                  <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                    {progress.done}/{progress.total}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`,
                      background: "var(--gradient-1)",
                    }}
                  />
                </div>
              </div>
            )}

            {results.length === 0 && !running && (
              <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-muted)" }}>
                <p style={{ fontSize: 16 }}>No results yet. Set up your benchmark and hit Run!</p>
              </div>
            )}

            {results.length > 0 && (
              <>
                {/* Export buttons */}
                <div style={{ display: "flex", gap: 8, marginBottom: 20, justifyContent: "flex-end" }}>
                  <button className="btn-secondary" onClick={exportAsImage}>
                    {Icons.image} Export PNG
                  </button>
                  <button className="btn-secondary" onClick={exportAsMarkdown}>
                    {Icons.copy} Copy Markdown
                  </button>
                </div>

                <div ref={resultsRef} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {[...new Set(results.map((r) => r.taskId))].map((taskId) => {
                    const task = tasks.find((t) => t.id === taskId);
                    const taskResults = results.filter((r) => r.taskId === taskId);
                    const bestLatency = Math.min(...taskResults.filter((r) => !r.error).map((r) => r.latencyMs));
                    const bestCost = Math.min(...taskResults.filter((r) => !r.error && r.costUsd > 0).map((r) => r.costUsd));

                    return (
                      <div key={taskId} className="glass-card animate-slide-up" style={{ padding: 24, overflow: "hidden" }}>
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span className={`badge ${task?.category === "Custom" ? "badge-purple" : "badge-cyan"}`}>
                              {task?.category}
                            </span>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{task?.name}</h3>
                          </div>
                          <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>{task?.prompt}</p>
                        </div>

                        {/* Results grid */}
                        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(taskResults.length, 3)}, 1fr)`, gap: 12 }}>
                          {taskResults.map((r) => {
                            const isExpanded = expandedResult === `${r.taskId}-${r.modelId}`;
                            const isBestLatency = r.latencyMs === bestLatency && !r.error;
                            const isBestCost = r.costUsd === bestCost && !r.error && r.costUsd > 0;

                            return (
                              <div
                                key={r.modelId}
                                style={{
                                  background: "var(--bg-primary)",
                                  borderRadius: 12,
                                  border: "1px solid var(--border)",
                                  padding: 16,
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 12,
                                }}
                              >
                                {/* Model header */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span className={`badge ${getProviderBadge(r.provider)}`} style={{ fontSize: 11 }}>
                                      {PROVIDERS[r.provider].name}
                                    </span>
                                    <span style={{ fontWeight: 600, fontSize: 14 }}>{r.modelName}</span>
                                  </div>
                                </div>

                                {r.error ? (
                                  <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.1)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)" }}>
                                    <p style={{ margin: 0, fontSize: 13, color: "var(--accent-red)" }}>{r.error}</p>
                                  </div>
                                ) : (
                                  <>
                                    {/* Metrics */}
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                                      <div style={{ textAlign: "center" }}>
                                        <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Latency</p>
                                        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: isBestLatency ? "var(--accent-green)" : "var(--text-primary)" }}>
                                          {formatMs(r.latencyMs)}
                                          {isBestLatency && <span style={{ fontSize: 10, marginLeft: 3 }}>FAST</span>}
                                        </p>
                                      </div>
                                      <div style={{ textAlign: "center" }}>
                                        <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Tokens</p>
                                        <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{r.totalTokens.toLocaleString()}</p>
                                      </div>
                                      <div style={{ textAlign: "center" }}>
                                        <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Cost</p>
                                        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: isBestCost ? "var(--accent-green)" : "var(--text-primary)" }}>
                                          {formatCost(r.costUsd)}
                                          {isBestCost && <span style={{ fontSize: 10, marginLeft: 3 }}>CHEAP</span>}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Output */}
                                    <div style={{ position: "relative" }}>
                                      <div
                                        className="model-output"
                                        style={{
                                          maxHeight: isExpanded ? "none" : 160,
                                          overflow: "hidden",
                                          padding: 12,
                                          background: "var(--bg-secondary)",
                                          borderRadius: 8,
                                          fontSize: 13,
                                        }}
                                      >
                                        {r.output}
                                      </div>
                                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                                        <button
                                          className="btn-icon"
                                          onClick={() => setExpandedResult(isExpanded ? null : `${r.taskId}-${r.modelId}`)}
                                          style={{ width: "auto", padding: "4px 10px", fontSize: 12 }}
                                        >
                                          {isExpanded ? "Collapse" : "Expand"}
                                        </button>
                                        <button
                                          className="btn-icon"
                                          onClick={() => copyOutput(r.output, `${r.taskId}-${r.modelId}`)}
                                          style={{ width: "auto", padding: "4px 10px", fontSize: 12 }}
                                        >
                                          {copiedId === `${r.taskId}-${r.modelId}` ? Icons.check : Icons.copy}
                                          {copiedId === `${r.taskId}-${r.modelId}` ? " Copied" : " Copy"}
                                        </button>
                                      </div>
                                    </div>

                                    {/* Rating */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Quality:</span>
                                      <div className="star-rating">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <button
                                            key={star}
                                            className={star <= (r.rating || 0) ? "active" : ""}
                                            onClick={() => setRating(r.taskId, r.modelId, star)}
                                          >
                                            ★
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ──── COMPARE TAB ──── */}
        {activeTab === "compare" && (
          <div className="animate-fade-in">
            {results.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-muted)" }}>
                <p style={{ fontSize: 16 }}>Run a benchmark first to see comparisons.</p>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", gap: 8, marginBottom: 20, justifyContent: "flex-end" }}>
                  <button className="btn-secondary" onClick={exportAsImage}>
                    {Icons.image} Export PNG
                  </button>
                  <button className="btn-secondary" onClick={exportAsMarkdown}>
                    {Icons.share} Share Markdown
                  </button>
                </div>

                {/* Summary Table */}
                <div className="glass-card" style={{ padding: 24, marginBottom: 24, overflowX: "auto" }} ref={resultsRef}>
                  <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>Model Comparison</h3>

                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: 14,
                    }}
                  >
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--border)" }}>
                        <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600, fontSize: 12, textTransform: "uppercase" }}>Model</th>
                        <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-muted)", fontWeight: 600, fontSize: 12, textTransform: "uppercase" }}>Avg Latency</th>
                        <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-muted)", fontWeight: 600, fontSize: 12, textTransform: "uppercase" }}>Total Tokens</th>
                        <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-muted)", fontWeight: 600, fontSize: 12, textTransform: "uppercase" }}>Total Cost</th>
                        <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-muted)", fontWeight: 600, fontSize: 12, textTransform: "uppercase" }}>Avg Rating</th>
                        <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--text-muted)", fontWeight: 600, fontSize: 12, textTransform: "uppercase" }}>Errors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const modelIds = [...new Set(results.map((r) => r.modelId))];
                        const rows = modelIds.map((modelId) => {
                          const modelResults = results.filter((r) => r.modelId === modelId);
                          const successResults = modelResults.filter((r) => !r.error);
                          const avgLatency = successResults.length > 0 ? successResults.reduce((a, r) => a + r.latencyMs, 0) / successResults.length : 0;
                          const totalTokens = successResults.reduce((a, r) => a + r.totalTokens, 0);
                          const totalCost = successResults.reduce((a, r) => a + r.costUsd, 0);
                          const ratedResults = successResults.filter((r) => r.rating);
                          const avgRating = ratedResults.length > 0 ? ratedResults.reduce((a, r) => a + (r.rating || 0), 0) / ratedResults.length : 0;
                          const errors = modelResults.filter((r) => r.error).length;
                          const model = modelResults[0];

                          return { modelId, model, avgLatency, totalTokens, totalCost, avgRating, errors, ratedCount: ratedResults.length };
                        });

                        const bestLatency = Math.min(...rows.filter((r) => r.avgLatency > 0).map((r) => r.avgLatency));
                        const bestCost = Math.min(...rows.filter((r) => r.totalCost > 0).map((r) => r.totalCost));
                        const bestRating = Math.max(...rows.filter((r) => r.avgRating > 0).map((r) => r.avgRating));

                        return rows.map((row) => (
                          <tr key={row.modelId} style={{ borderBottom: "1px solid var(--border)" }}>
                            <td style={{ padding: "12px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span className={`badge ${getProviderBadge(row.model.provider)}`} style={{ fontSize: 11 }}>
                                  {PROVIDERS[row.model.provider].name}
                                </span>
                                <span style={{ fontWeight: 600 }}>{row.model.modelName}</span>
                              </div>
                            </td>
                            <td style={{ padding: "12px", textAlign: "center", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: row.avgLatency === bestLatency && row.avgLatency > 0 ? "var(--accent-green)" : "var(--text-primary)" }}>
                              {row.avgLatency > 0 ? formatMs(row.avgLatency) : "—"}
                            </td>
                            <td style={{ padding: "12px", textAlign: "center", fontFamily: "'JetBrains Mono', monospace" }}>
                              {row.totalTokens.toLocaleString()}
                            </td>
                            <td style={{ padding: "12px", textAlign: "center", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: row.totalCost === bestCost && row.totalCost > 0 ? "var(--accent-green)" : "var(--text-primary)" }}>
                              {formatCost(row.totalCost)}
                            </td>
                            <td style={{ padding: "12px", textAlign: "center" }}>
                              {row.avgRating > 0 ? (
                                <span style={{ color: row.avgRating === bestRating ? "var(--accent-amber)" : "var(--text-primary)", fontWeight: 600 }}>
                                  {"★".repeat(Math.round(row.avgRating))}{"☆".repeat(5 - Math.round(row.avgRating))}
                                  <span style={{ marginLeft: 4, fontSize: 12, color: "var(--text-muted)" }}>({row.avgRating.toFixed(1)})</span>
                                </span>
                              ) : (
                                <span style={{ color: "var(--text-muted)" }}>Not rated</span>
                              )}
                            </td>
                            <td style={{ padding: "12px", textAlign: "center" }}>
                              {row.errors > 0 ? (
                                <span className="badge badge-red">{row.errors}</span>
                              ) : (
                                <span className="badge badge-green">0</span>
                              )}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Per-task breakdown */}
                <div className="glass-card" style={{ padding: 24 }}>
                  <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>Per-Task Breakdown</h3>
                  {[...new Set(results.map((r) => r.taskId))].map((taskId) => {
                    const task = tasks.find((t) => t.id === taskId);
                    const taskResults = results.filter((r) => r.taskId === taskId && !r.error);

                    if (taskResults.length === 0) return null;

                    const maxLatency = Math.max(...taskResults.map((r) => r.latencyMs));

                    return (
                      <div key={taskId} style={{ marginBottom: 24 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "var(--text-secondary)" }}>
                          {task?.name}
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {taskResults
                            .sort((a, b) => a.latencyMs - b.latencyMs)
                            .map((r, i) => (
                              <div key={r.modelId} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <span style={{ width: 24, textAlign: "center", fontSize: 14, fontWeight: 700, color: i === 0 ? "var(--accent-amber)" : "var(--text-muted)" }}>
                                  #{i + 1}
                                </span>
                                <span style={{ width: 140, fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {r.modelName}
                                </span>
                                <div style={{ flex: 1, height: 24, display: "flex", alignItems: "center" }}>
                                  <div
                                    style={{
                                      height: 8,
                                      borderRadius: 4,
                                      background: i === 0 ? "var(--gradient-2)" : "var(--gradient-1)",
                                      width: `${maxLatency > 0 ? (r.latencyMs / maxLatency) * 100 : 0}%`,
                                      minWidth: 8,
                                      transition: "width 0.5s ease",
                                    }}
                                  />
                                </div>
                                <span style={{ width: 80, textAlign: "right", fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                                  {formatMs(r.latencyMs)}
                                </span>
                                <span style={{ width: 60, textAlign: "right", fontSize: 12, color: "var(--text-muted)" }}>
                                  {formatCost(r.costUsd)}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "20px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
        AI Bench — Benchmark any LLM on your actual tasks. Keys stored locally. Open source.
      </footer>
    </div>
  );
}
