# ⚡ aibench

### Stop guessing which AI model is best. Test them on YOUR tasks.

**aibench** is an open-source LLM benchmarking CLI that lets you run any prompt against every major model (GPT-4o, Claude Sonnet, Gemini, Llama, Mistral, DeepSeek) simultaneously and compare quality, speed, cost, and accuracy side-by-side. No more vibes-based model selection. Data-driven decisions in 60 seconds.

Built entirely with Claude Code (Opus 4.6). Zero human-written code.

---

## The Problem

"Which model should I use?"

Every AI developer asks this. Nobody has a real answer. You read benchmarks on MMLU and HumanEval — but those don't tell you which model is best for YOUR specific use case. Is Claude better at summarizing your legal docs? Is GPT-4o faster for your chatbot? Is DeepSeek cheaper for your code generation pipeline?

**aibench answers this in 60 seconds.** Run your actual prompts against every model. Get a ranked comparison with quality scores, latency, cost, and token usage.

---

## Usage

```bash
# Install
npm install -g aibench

# Benchmark a single prompt across all models
aibench run "Summarize this contract in 3 bullet points: {paste contract}"

# Benchmark from a file of prompts
aibench run --file my-prompts.jsonl

# Compare specific models only
aibench run "Explain quantum computing" --models gpt-4o,claude-sonnet,deepseek-v3

# Output:
⚡ aibench — 6 models tested in 8.2s

  ┌──────────────────┬────────┬─────────┬──────────┬───────┐
  │ Model            │ Score  │ Latency │ Cost     │ Tokens│
  ├──────────────────┼────────┼─────────┼──────────┼───────┤
  │ 🥇 claude-sonnet │ 9.2/10 │ 1.4s    │ $0.0034  │ 847   │
  │ 🥈 gpt-4o        │ 8.8/10 │ 2.1s    │ $0.0089  │ 1,203 │
  │ 🥉 deepseek-v3   │ 8.5/10 │ 1.8s    │ $0.0008  │ 956   │
  │    gemini-2.0    │ 8.1/10 │ 1.2s    │ $0.0012  │ 789   │
  │    llama-3.3     │ 7.4/10 │ 3.2s    │ $0.0000  │ 1,102 │
  │    mistral-large │ 7.9/10 │ 2.5s    │ $0.0024  │ 934   │
  └──────────────────┴────────┴─────────┴──────────┴───────┘

  🏆 WINNER: claude-sonnet (best quality/cost ratio)
  💰 CHEAPEST: llama-3.3 (local, free)
  ⚡ FASTEST: gemini-2.0 (1.2s)

  Full report: aibench-report.html
```

---

## Features

- 🏎️ **Parallel Execution** — Runs all models simultaneously. Results in seconds, not minutes.
- 📊 **Quality Scoring** — AI-judged quality score (1-10) using a separate evaluator model. Or bring your own scoring function.
- 💰 **Cost Tracking** — Exact per-request cost for every provider. Know what you're paying.
- ⏱️ **Latency Profiling** — Time-to-first-token (TTFT) and total latency. Stream vs batch comparison.
- 🔄 **Batch Mode** — Run hundreds of prompts from a JSONL file. Statistical analysis across all runs.
- 📈 **Trend Tracking** — Save results over time. See how models improve/degrade across versions.
- 🎯 **Custom Evaluators** — Write your own scoring functions. Regex match, JSON validation, code execution, or LLM-as-judge.
- 🌐 **12+ Providers** — OpenAI, Anthropic, Google, Mistral, Groq, Together, Fireworks, DeepSeek, Ollama, and more.
- 📋 **Export** — HTML reports, CSV, JSON. Share with your team.

---

## Benchmark Modes

### Quick Compare
```bash
# Single prompt, all models
aibench run "Write a Python function to merge two sorted lists"
```

### Batch Benchmark
```bash
# Prompts file (JSONL)
# {"prompt": "Summarize: ...", "expected": "..."}
# {"prompt": "Translate: ...", "expected": "..."}
aibench batch my-prompts.jsonl --models gpt-4o,claude-sonnet,deepseek-v3
```

### Category Benchmark
```bash
# Test models on specific task categories
aibench category coding --models all       # Coding tasks
aibench category writing --models all      # Creative writing
aibench category reasoning --models all    # Logic & reasoning
aibench category extraction --models all   # Data extraction
aibench category translation --models all  # Translation quality
```

### Stress Test
```bash
# Concurrent request performance
aibench stress --model gpt-4o --concurrency 50 --duration 60s
```

### Cost Optimizer
```bash
# Find the cheapest model that meets your quality bar
aibench optimize --file my-prompts.jsonl --min-score 8.0

# Output:
⚡ Cost Optimization Report

  Quality threshold: 8.0/10
  ┌──────────────────┬────────┬──────────────┬──────────┐
  │ Model            │ Score  │ Monthly Cost │ Savings  │
  ├──────────────────┼────────┼──────────────┼──────────┤
  │ gpt-4o (current) │ 8.8    │ $2,400/mo    │ baseline │
  │ claude-sonnet    │ 9.2    │ $1,100/mo    │ -54%     │
  │ deepseek-v3      │ 8.5    │ $260/mo      │ -89%     │
  │ gemini-2.0       │ 8.1    │ $380/mo      │ -84%     │
  └──────────────────┴────────┴──────────────┴──────────┘

  💡 RECOMMENDATION: Switch to deepseek-v3
     Saves $2,140/month with only 0.3 point quality drop
```

---

## Custom Evaluators

```typescript
// evaluators/json-validator.ts
export default {
  name: 'json-validator',
  score: (response: string, expected?: string) => {
    try {
      const parsed = JSON.parse(response);
      if (expected) {
        const exp = JSON.parse(expected);
        // Check all expected keys exist
        const keys = Object.keys(exp);
        const matched = keys.filter(k => parsed[k] !== undefined);
        return (matched.length / keys.length) * 10;
      }
      return 10; // Valid JSON = full score
    } catch {
      return 0; // Invalid JSON = zero
    }
  }
};
```

```bash
aibench run --evaluator ./evaluators/json-validator.ts \
  "Extract name, email, phone from: John Smith john@example.com 555-1234"
```

---

## Architecture

```
aibench/
├── cli/
│   ├── index.ts            # CLI entry point
│   ├── run.ts              # Single prompt benchmark
│   ├── batch.ts            # Batch benchmark from file
│   ├── category.ts         # Category-based benchmarks
│   ├── stress.ts           # Concurrency stress test
│   ├── optimize.ts         # Cost optimization
│   └── report.ts           # Report generation
├── providers/
│   ├── base.ts             # Provider interface
│   ├── openai.ts           # OpenAI (GPT-4o, GPT-4o-mini, o1)
│   ├── anthropic.ts        # Anthropic (Claude Opus, Sonnet, Haiku)
│   ├── google.ts           # Google (Gemini 2.0, 1.5)
│   ├── mistral.ts          # Mistral (Large, Medium, Small)
│   ├── groq.ts             # Groq (Llama, Mixtral)
│   ├── together.ts         # Together AI
│   ├── deepseek.ts         # DeepSeek (V3, Coder)
│   ├── fireworks.ts        # Fireworks AI
│   └── ollama.ts           # Ollama (local models)
├── evaluators/
│   ├── llm-judge.ts        # LLM-as-judge scoring
│   ├── regex.ts            # Pattern matching evaluator
│   ├── json.ts             # JSON structure validation
│   ├── code.ts             # Code execution evaluator
│   └── custom.ts           # Custom evaluator loader
├── pricing/
│   ├── registry.ts         # Model pricing database
│   └── updater.ts          # Auto-update prices from APIs
├── reports/
│   ├── html.ts             # Interactive HTML report
│   ├── csv.ts              # CSV export
│   ├── json.ts             # JSON export
│   └── templates/          # Report templates
├── benchmarks/
│   ├── coding.jsonl        # Built-in coding benchmarks
│   ├── writing.jsonl       # Built-in writing benchmarks
│   ├── reasoning.jsonl     # Built-in reasoning benchmarks
│   └── extraction.jsonl    # Built-in extraction benchmarks
└── lib/
    ├── parallel.ts         # Parallel execution engine
    ├── tokenizer.ts        # Token counting per provider
    └── stats.ts            # Statistical analysis
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| CLI | TypeScript, Commander.js, Chalk, Ora |
| Providers | Native HTTP clients per API |
| Evaluation | LLM-as-judge + custom functions |
| Pricing | Auto-updated registry + tiktoken |
| Reports | HTML (Recharts), CSV, JSON |
| Parallelism | Promise.allSettled with concurrency limits |
| Storage | SQLite for historical results |

---

## Supported Models

| Provider | Models | API Key Env |
|----------|--------|------------|
| OpenAI | gpt-4o, gpt-4o-mini, o1, o1-mini | `OPENAI_API_KEY` |
| Anthropic | claude-opus, claude-sonnet, claude-haiku | `ANTHROPIC_API_KEY` |
| Google | gemini-2.0-flash, gemini-2.0-pro | `GOOGLE_API_KEY` |
| DeepSeek | deepseek-v3, deepseek-coder | `DEEPSEEK_API_KEY` |
| Mistral | mistral-large, mistral-medium | `MISTRAL_API_KEY` |
| Groq | llama-3.3-70b, mixtral-8x7b | `GROQ_API_KEY` |
| Together | llama-3.3-70b, qwen-2.5-72b | `TOGETHER_API_KEY` |
| Ollama | Any local model | None (local) |

---

## Roadmap

- [x] Parallel multi-model execution
- [x] LLM-as-judge quality scoring
- [x] Cost tracking with auto-updated pricing
- [x] Batch benchmarking from JSONL
- [x] HTML/CSV/JSON reports
- [x] Built-in benchmark suites (coding, writing, reasoning)
- [ ] Web dashboard for historical trends
- [ ] GitHub Action (benchmark on PR)
- [ ] Prompt optimization suggestions
- [ ] Vision model benchmarking (image inputs)
- [ ] Agent benchmarking (multi-step tool use)
- [ ] Team mode with shared results
- [ ] Public leaderboard for community benchmarks

---

## Contributing

MIT licensed. PRs welcome — especially new providers and evaluators.

```bash
npm run dev          # Development
npm run test         # Test suite
npm run bench:self   # Benchmark the benchmarker
```

---

**Built with [Claude Code](https://claude.ai) (Opus 4.6) — zero human-written code.**

Made by [@krishnashahane](https://github.com/krishnashahane)
