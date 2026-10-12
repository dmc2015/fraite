# Freight Email Agent

Agentic pipeline that reads a freight carrier email and extracts structured data (load details, carrier verification, confidence, full trace) using **LangGraph**, **Claude**, **FastAPI**, and **Next.js**.

Built as a focused one-day phase 1 — small enough to walk through, honest about its edges, structured to scale.

---

## 30-second pitch

Small freight brokers and 3PLs get hundreds of carrier emails daily — load confirmations, rate updates, ETAs, exceptions, invoices — all unstructured text. Enterprise visibility platforms (project44, FourKites) solve this for the top of the market; the bottom still runs on spreadsheets and copy-paste.

This agent reads a single carrier email, classifies its type, extracts the relevant structured fields, calls a carrier-lookup tool when it finds an MC number, self-verifies the extraction, and routes high-confidence results to a downstream sink while flagging low-confidence ones for human review.

---

## Architecture

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ parse_eml        │─►│ classify (LLM)   │─►│ extract (LLM     │
│ (deterministic)  │  │                  │  │  + tool use)     │
└──────────────────┘  └──────────────────┘  └────────┬─────────┘
                                                     ▼
                            ┌────────────────────────┐
                            │ verify (LLM self-check)│
                            │ returns confidence     │
                            └────┬───────────────┬───┘
                                 │ pass          │ low conf
                                 ▼               ▼
                        ┌──────────────┐  ┌──────────────────┐
                        │ emit_record  │  │ flag_for_review  │
                        └──────┬───────┘  └────────┬─────────┘
                               └────────┬─────────┘
                                        ▼
                                       END
```

**Design choices worth defending in conversation:**

- **Deterministic/LLM split.** Only `classify`, `extract`, and `verify` call the LLM. Parsing, routing, and sinks are pure functions. Non-determinism is isolated, which makes evals and retries sane.
- **Pydantic as the single contract.** Same schemas on the agent, the FastAPI boundary, and (mirrored) the TypeScript frontend.
- **Tool use with a bounded loop.** `lookup_carrier(mc_number)` is a real tool the LLM calls when it finds an MC number. Loop is bounded by `MAX_TOOL_CALLS=4` to cap cost and failure modes.
- **Verifier is a first-class node, not a prompt flourish.** Low confidence routes to `flag_for_review` — HITL is a design choice, not an afterthought.
- **Full trace surfaced.** Every node emits a `TraceStep` (summary + duration + inputs/outputs). The UI renders the trajectory as a timeline so the agent isn't a black box.

---

## Monorepo layout

```
freight-email-agent/
├── api/                  # Python FastAPI + LangGraph agent (Vercel project)
│   ├── app.py            # FastAPI entrypoint — Vercel auto-detects `app`
│   ├── agent/
│   │   ├── graph.py      # LangGraph StateGraph wiring
│   │   ├── nodes.py      # parse/classify/extract/verify/emit/flag
│   │   ├── tools.py      # lookup_carrier tool schema + dispatch
│   │   └── schemas.py    # Pydantic models (API + agent contract)
│   ├── data/
│   │   ├── sample.eml    # synthetic load confirmation
│   │   └── carriers.json # synthetic carrier directory
│   └── requirements.txt
└── ui/                   # Next.js + TypeScript (Vercel project)
    ├── src/
    │   ├── app/page.tsx  # composes components, handles state
    │   ├── components/   # EmailInput, ClassificationBadge, ...
    │   └── lib/
    │       ├── api.ts    # typed fetch client
    │       ├── types.ts  # mirrors Pydantic schemas
    │       ├── mock.ts   # offline preview response
    │       └── sample.ts # sample .eml payload
    └── package.json
```

Two separate Vercel projects (one per subfolder) via Vercel's **Root Directory** setting.

---

## Running locally

### Backend

```
cd api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # add ANTHROPIC_API_KEY
uvicorn app:app --reload --port 8000
```

Smoke-test the deterministic parts (no API key needed):

```
python -c "from agent.tools import lookup_carrier; print(lookup_carrier('823456'))"
```

Hit the full pipeline (requires `ANTHROPIC_API_KEY` with credits):

```
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d "$(python -c 'import json; print(json.dumps({\"raw\": open(\"data/sample.eml\").read()}))')"
```

### Frontend

```
cd ui
npm install
cp .env.example .env.local      # set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Open `http://localhost:3000`. Click **Load sample** to populate the textarea, then **Analyze**. The **Load mock result** link renders the UI with a canned response if the backend isn't live yet.

---

## Deployment

Both subfolders deploy to Vercel as separate projects:

1. Push the monorepo to GitHub.
2. In Vercel: new project → import the repo → set **Root Directory** to `api/` → deploy. Set `ANTHROPIC_API_KEY` and `ALLOWED_ORIGINS` env vars.
3. Repeat for `ui/`. Set `NEXT_PUBLIC_API_URL` to the backend's deployed URL.

The Python runtime is detected automatically from `requirements.txt` + `pyproject.toml`. Next.js is detected automatically.

---

## What's next (post phase 1)

The gaps are intentional for a one-day scope. Honest about where this goes:

- **Multi-type extraction.** Add rate_update, eta_update, exception, invoice schemas. Current structure makes this scale-out, not redesign.
- **Eval loop.** Golden dataset + LLM-as-judge + schema-correctness checks + per-type accuracy. The eval loop is the moat; the LLM is the commodity.
- **Observability.** Arize Phoenix / LangSmith for traces. Current trace is in-process only; production needs a persistent store.
- **Inbox integration.** Gmail OAuth or IMAP inbox watcher. Right now the payload is passed in as `.eml` text.
- **Downstream sinks.** Google Sheets writer, TMS webhook, carrier TMS API.
- **Multi-tenancy.** Workspace-scoped carrier directory, config, and secrets.
- **Review UI.** Dedicated queue for `flag_for_review` records, side-by-side with the source email, inline edit + confirm.
- **Guardrails & cost caps.** Current `MAX_TOOL_CALLS=4` is per request; also need per-tenant daily caps + model-cost accounting.
- **Indirect prompt injection defenses.** Carrier emails are untrusted input and the agent takes real actions downstream — this is a real risk surface, not a theoretical one.

---

## Stack

| Layer | Choice | Reason |
|---|---|---|
| Agent framework | **LangGraph** | State graph fits the deterministic/LLM split cleanly; explicit nodes + edges beat hidden chaining |
| LLM | **Anthropic Claude (Sonnet 4.6)** | Strong structured output + tool-use reliability |
| Schemas | **Pydantic 2** | Shared contract for agent + API; discriminated unions when we add more email types |
| Backend | **FastAPI** | Pydantic-native, auto-OpenAPI, Vercel zero-config |
| Frontend | **Next.js (TypeScript, App Router)** | Known-ground framework; mobile-friendly by default via Tailwind |
| Hosting | **Vercel (two projects)** | Zero-config Python detection; same account, same CLI, same domain pattern |

---

## Status

Phase 1 build — intentionally scoped. Load confirmation is the first email type working end-to-end; the architecture handles the rest without redesign.
