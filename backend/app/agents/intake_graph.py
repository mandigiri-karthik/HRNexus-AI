"""The resume intake graph: extract the profile, then ask the user about every empty field."""

import logging
from typing import Annotated, TypedDict

from langchain_core.messages import AIMessage, HumanMessage
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from langgraph.types import interrupt
from pydantic import BaseModel, Field

from app.agents.llm import get_llm
from app.agents.profile_extractor_agent import extract_profile
from app.db.db import checkpointer
from app.utils.resume_helpers import (
    empty_value,
    field_annotation,
    field_description,
    field_key,
    find_next_missing,
    fixed_options,
    match_options,
    parse_free_text,
    profile_summary,
    set_field,
    transcript,
    value_from_choices,
)

logger = logging.getLogger(__name__)

QUESTION_PROMPT = """You are the onboarding assistant in a job-search app, chatting with a job seeker to finish their search profile.
Write the next message: one short, natural question about the field given.
The user can click an option or answer in their own words, so ask an open question, not a yes/no about one option.
- Never say you've read their CV or profile, and never greet them; the app adds that to the first question itself.
- If "Their last answer" is not none, you may acknowledge it in a few words. Acknowledge only that answer, never details from the profile.
- Use the profile to make the question specific, e.g. mention their degree.
- Follow the "Options" line exactly. When it says to suggest options, you must return 2-4 options; never return an empty list then.
- Each option is 1-4 words and fits this person's profile.
- Do not list possible answers inside the question; the app shows them as buttons.
- Do not mention skipping; the app shows a Skip button.
- Ask only about the given field.

Examples:
- Last answer: none. Field: preferences.target_roles. Options: suggest 2-4.
  -> question: "Which roles should I look for?" options: ["AI Engineer", "ML Engineer", "Python Developer"]
- Last answer: "London, Edinburgh". Field: preferences.work_modes. Options: the app shows Remote, Hybrid, On-site.
  -> question: "Two good cities for AI roles. How would you like to work?" options: []
- Last answer: "Hybrid". Field: preferences.min_salary. Options: suggest 2-4.
  -> question: "One quick question — what's the lowest salary you'd accept?" options: ["£25k", "£30k", "£35k+"]"""

FIRST_QUESTION_INTRO = "Thanks — I've read your CV."


class Question(BaseModel):
    question: str = Field(description="The message to show: an optional few-word acknowledgement, then one question")
    options: list[str] = Field(description="2-4 short button labels when told to suggest options, otherwise an empty list")


class IntakeState(TypedDict):
    resume_text: str
    cv_name: str | None
    profile: dict
    field_status: dict[str, str]
    attempts: dict[str, int]
    section: str | None
    missing: list[str]
    prompt: dict | None
    messages: Annotated[list, add_messages]


def extract(state):
    return {"profile": extract_profile(state["resume_text"]), "field_status": {}, "attempts": {}}


def pick_next(state):
    found = find_next_missing(state["profile"], state["field_status"], state["attempts"])
    if found is None:
        logger.info("Profile complete")
        return {"section": None, "missing": []}
    section, open_fields = found
    logger.info("Next gap: %s %s (also open: %s)", section, open_fields[:1], open_fields[1:])
    return {"section": section, "missing": open_fields[:1]}


def route(state):
    return "write_question" if state["section"] else END


def write_question(state):
    section, name = state["section"], (state["missing"] or [None])[0]
    key = field_key(section, name)
    options, multi = fixed_options(field_annotation(section, name))

    messages = state.get("messages", [])
    last_answer = messages[-1].content if messages else "none"
    if options is None:
        options_line = "suggest 2-4. You must return 2-4 options based on the profile."
    elif options:
        options_line = "the app shows " + ", ".join(o["label"] for o in options) + ". Return an empty list."
    else:
        options_line = "the user types the answer. Return an empty list."

    structured = get_llm().with_structured_output(Question, include_raw=True)
    result = structured.invoke([
        ("system", QUESTION_PROMPT),
        ("user", f"Their last answer: {last_answer}\n"
                 f"Field: {key} ({field_description(section, name)})\n"
                 f"Options: {options_line}\n"
                 f"Profile: {profile_summary(state['profile'])}\n"
                 f"Conversation so far:\n{transcript(messages)}"),
    ])

    parsed = result["parsed"]
    question = parsed.question if parsed else f"Could you tell me about your {(name or section).replace('_', ' ')}?"
    # The intro is added here rather than by the model, so it appears on the first question only.
    if not messages:
        question = f"{FIRST_QUESTION_INTRO} {question}"
    if options is None:
        options = [{"label": label, "value": label} for label in (parsed.options if parsed else [])]
        if not options:
            logger.warning("No options suggested for %s", key)

    prompt = {"field": key, "question": question, "options": options, "multi_select": multi}
    return {"prompt": prompt, "messages": [AIMessage(content=question)]}


def ask_user(state):
    prompt = state["prompt"]
    reply = interrupt(prompt)

    section, name = state["section"], (state["missing"] or [None])[0]
    key = field_key(section, name)
    annotation = field_annotation(section, name)
    text = (reply.get("text") or "").strip()
    # Labels that aren't among the options (e.g. Swagger's "string" placeholder) are ignored,
    # so a typed answer sent alongside them still counts.
    by_label = {o["label"]: o["value"] for o in prompt["options"]}
    clicked = [label for label in reply.get("selected") or [] if label in by_label]
    picked = clicked or match_options(text, prompt) or []

    # Three ways to answer: Skip, pick options (or type an option's exact label), or write in your own words.
    if reply.get("skip"):
        status, value, via, said = "declined", empty_value(annotation), "skip", "Skip for now"
    elif picked:
        chosen = [by_label[label] for label in picked]
        status, value = "answered", value_from_choices(annotation, chosen, prompt["multi_select"])
        via, said = "options", ", ".join(picked)
    elif text:
        status, value = parse_free_text(section, name, prompt, text)
        via, said = "own words", text
    else:
        status, value, via, said = "not_mentioned", None, "empty reply", ""

    logger.info("%s -> %s (via %s)", key, status, via)
    update = {
        "attempts": {**state["attempts"], key: state["attempts"].get(key, 0) + 1},
        "messages": [HumanMessage(content=said)],
    }
    if status == "not_mentioned":
        return update
    update["profile"] = set_field(state["profile"], section, name, value)
    update["field_status"] = {**state["field_status"], key: status}
    return update


builder = StateGraph(IntakeState)
builder.add_node("extract", extract)
builder.add_node("pick_next", pick_next)
builder.add_node("write_question", write_question)
builder.add_node("ask_user", ask_user)

builder.add_edge(START, "extract")
builder.add_edge("extract", "pick_next")
builder.add_conditional_edges("pick_next", route, ["write_question", END])
builder.add_edge("write_question", "ask_user")
builder.add_edge("ask_user", "pick_next")

# Paused conversations are stored in Postgres (see app/db/db.py), one per user.
intake_graph = builder.compile(checkpointer=checkpointer)
