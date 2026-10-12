"""FastAPI entrypoint — Vercel auto-detects `app` as the ASGI handler.

Endpoints:
  GET  /api/health         -> liveness check
  POST /api/analyze        -> run the freight-email agent on an EmailInput
"""
from __future__ import annotations

import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(override=True)

from agent.graph import build_graph
from agent.schemas import AgentOutput, EmailInput

app = FastAPI(title="Freight Email Agent API", version="0.1.0")

_allowed = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _allowed.split(",") if o.strip()],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

_graph = build_graph()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/analyze", response_model=AgentOutput)
def analyze(email: EmailInput) -> dict:
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")

    try:
        result = _graph.invoke({"email_input": email.model_dump(), "trace": []})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"agent error: {type(e).__name__}: {e}")

    return {
        "parsed": result["parsed"],
        "classification": result["classification"],
        "extracted": result.get("extracted", {}),
        "carrier": result.get("carrier"),
        "verifier": result["verifier"],
        "trace": result.get("trace", []),
        "final_action": result.get("final_action", "flag_for_review"),
    }
