# Freight Email Agent

Agentic pipeline that reads a freight carrier email and extracts structured data (classification, carrier info, load fields, confidence) using Anthropic Claude and LangGraph.

**Status:** Phase 1 build — WIP, filled in as the day progresses.

## Monorepo layout

```
freight-email-agent/
├── api/   # Python FastAPI + LangGraph agent (Vercel project)
└── ui/    # Next.js + TypeScript frontend (Vercel project)
```

## Running locally

Instructions added once `api/` and `ui/` are scaffolded.

## Architecture

ASCII diagram to be added.

## What's next (post phase 1)

- Multi-type emails (rate updates, ETA updates, exceptions, invoices)
- Gmail OAuth + inbox watcher
- Google Sheets / TMS webhook writer
- Eval harness (golden set + LLM-as-judge + regression suite)
- Multi-tenancy
- Hosted observability
