"""LangGraph state machine wiring.

Shape:
    parse_eml -> classify -> extract -> verify -> (emit_record | flag_for_review) -> END
"""
from __future__ import annotations

from langgraph.graph import END, StateGraph

from .nodes import (
    AgentState,
    classify_node,
    emit_record_node,
    extract_node,
    flag_for_review_node,
    parse_eml_node,
    route_after_verify,
    verify_node,
)


def build_graph():
    g = StateGraph(AgentState)
    g.add_node("parse_eml", parse_eml_node)
    g.add_node("classify", classify_node)
    g.add_node("extract", extract_node)
    g.add_node("verify", verify_node)
    g.add_node("emit_record", emit_record_node)
    g.add_node("flag_for_review", flag_for_review_node)

    g.set_entry_point("parse_eml")
    g.add_edge("parse_eml", "classify")
    g.add_edge("classify", "extract")
    g.add_edge("extract", "verify")
    g.add_conditional_edges(
        "verify",
        route_after_verify,
        {"emit_record": "emit_record", "flag_for_review": "flag_for_review"},
    )
    g.add_edge("emit_record", END)
    g.add_edge("flag_for_review", END)

    return g.compile()
