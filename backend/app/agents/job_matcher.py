"""Matching job adverts to a profile: filter in code, then score each job with TypeSafe's Jev model."""

import logging
import re
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from functools import lru_cache

from typesafe_sdk import Noul, TypeSafeClient

from app.config import JEV_MODEL, TYPESAFE_API_KEY
from app.utils import adzuna

logger = logging.getLogger(__name__)

MAX_TO_SCORE = 40  # keeps one search's cost predictable (about a third of a cent)
PARALLEL_CALLS = 8
JEV_PRICE_PER_TOKEN = 0.042 / 1_000_000  # input tokens; output tokens are free
SETTLED_WORDS = ("british", "citizen", "settled", "indefinite leave", "ilr")
MAX_PLACES = 3 


class JobMatchError(Exception):
    """Job matching cannot run. The message is safe to show to the user."""


@lru_cache
def get_typesafe():
    if not TYPESAFE_API_KEY:
        raise JobMatchError("Job matching isn't set up yet.")
    return TypeSafeClient(api_key=TYPESAFE_API_KEY, model=JEV_MODEL, timeout=60)


# --- What Jev reads about the person ---

def months_of_experience(profile):
    """Total months across jobs and internships, from their YYYY-MM dates ('present' = today)."""
    total = 0
    for job in profile.get("experience") or []:
        start, end = job.get("start"), job.get("end")
        if not start or not re.match(r"\d{4}-\d{2}", start):
            continue
        end = date.today().strftime("%Y-%m") if (not end or end == "present") else end
        if not re.match(r"\d{4}-\d{2}", end):
            continue
        (start_year, start_month), (end_year, end_month) = map(int, start[:7].split("-")), map(int, end[:7].split("-"))
        total += max(0, (end_year - start_year) * 12 + (end_month - start_month))
    return total


def profile_summary(profile, max_bullets=3):
    """What a recruiter would read. No name, email or phone: matching doesn't need them."""
    basics = profile.get("basics") or {}
    lines = [f"Total work experience: about {months_of_experience(profile)} months."]
    if basics.get("headline"):
        lines.append(f"Headline: {basics['headline']}")
    if basics.get("location"):
        lines.append(f"Lives in: {basics['location']}")
    if basics.get("work_authorization"):
        lines.append(f"Right to work: {basics['work_authorization']}")
    lines.append("Skills: " + ", ".join(profile.get("skills") or []))
    for job in profile.get("experience") or []:
        lines.append(f"Experience: {job.get('title')} at {job.get('company')} ({job.get('start') or '?'} to {job.get('end') or '?'})")
        lines += [f"  - {bullet}" for bullet in (job.get("highlights") or [])[:max_bullets]]
    for project in profile.get("projects") or []:
        lines.append(f"Project: {project.get('name')}")
        lines += [f"  - {bullet}" for bullet in (project.get("highlights") or [])[:max_bullets]]
    for edu in profile.get("education") or []:
        lines.append(f"Education: {edu.get('degree')}, {edu.get('institution')} ({edu.get('end') or '?'})")
    return "\n".join(lines)


def is_settled(profile):
    """True when the stated right to work is British citizenship or settled status (needed for most clearance)."""
    stated = ((profile.get("basics") or {}).get("work_authorization") or "").lower()
    return any(word in stated for word in SETTLED_WORDS)


# --- Filters: plain facts, decided in code ---

def salary_floor(text):
    """'£30k' or '£30,000' -> 30000. None if there is no number."""
    match = re.search(r"(\d[\d,]*(?:\.\d+)?)\s*(k)?", (text or "").lower())
    if not match:
        return None
    value = float(match.group(1).replace(",", ""))
    return value * 1000 if match.group(2) else value


def filter_jobs(jobs, preferences):
    """Drop duplicates, unwanted part-time jobs and jobs paying below the minimum. Returns (kept, dropped counts)."""
    wants_part_time = any("part" in job_type.lower() for job_type in preferences.get("job_types") or [])
    floor = salary_floor(preferences.get("min_salary"))
    kept, dropped, seen = [], Counter(), set()
    for job in jobs:
        key = (job["title"].lower(), job["salary_min"], job["salary_max"])  # one job posted by two agencies
        if key in seen:
            dropped["duplicate"] += 1
            continue
        seen.add(key)
        if job["contract_time"] == "part_time" and not wants_part_time:
            dropped["part-time"] += 1
            continue
        if floor and job["salary_max"] and not job["salary_is_predicted"] and job["salary_max"] < floor:
            dropped["below minimum salary"] += 1
            continue
        kept.append(job)
    return kept, dropped


# --- Scoring: small yes/no questions for Jev, combined in code ---

def build_questions(needs_sponsorship):
    questions = {
        "skills_match": Noul(
            instructions="Does the candidate have the main skills and experience this job asks for?",
            criteria={
                "true": "The candidate's skills, projects or experience cover most of the job's main requirements.",
                "false": "The candidate is missing several of the job's main required skills.",
            },
        ),
        "level_match": Noul(
            instructions="Is this job at the right level for the candidate's experience?",
            criteria={
                "true": "The job suits someone with the candidate's years and type of experience, e.g. a graduate or junior role for a recent graduate.",
                "false": "The job asks for clearly more years or seniority than the candidate has.",
            },
        ),
        "too_senior": Noul(
            instructions="Does the job ask for clearly more experience than the candidate's total work experience?",
            criteria={
                "true": "The advert asks for several more years than the candidate has, or is a senior, lead, principal or contractor role.",
                "false": "The advert suits the candidate's experience, or doesn't say how much experience it needs.",
            },
        ),
        "needs_clearance": Noul(
            instructions="Does the job require UK security clearance (SC, DV or eDV) or British nationality?",
            criteria={
                "true": "The advert asks for SC, DV, eDV or similar security clearance, or says applicants must be British nationals.",
                "false": "The advert does not mention security clearance or a nationality requirement.",
            },
        ),
    }
    if needs_sponsorship:
        questions["no_sponsorship"] = Noul(
            instructions="Does the advert say the employer cannot sponsor a work visa?",
            criteria={
                "true": "The advert says sponsorship is not available, or that applicants must already have the right to work.",
                "false": "The advert says nothing about visas, or offers sponsorship.",
            },
        )
    return questions


def above(value, threshold):
    """How far a probability is past a threshold, from 0 (at or below it) to 1 (certain)."""
    return max(0.0, (value - threshold) / (1 - threshold))


def fit_score(nouls, needs_sponsorship, settled):
    """Combine Jev's answers into one 0-100 score. The weights live here, in code, so they're easy to tune."""
    fit = 0.6 * nouls["skills_match"] + 0.4 * nouls["level_match"]
    fit *= 1 - 0.6 * above(nouls["too_senior"], 0.3)
    if not settled:
        fit *= 1 - 0.8 * above(nouls["needs_clearance"], 0.5)
    if needs_sponsorship:
        fit *= 1 - 0.5 * nouls["no_sponsorship"]
    return round(fit * 100)


def fit_level(fit):
    return "high" if fit >= 80 else "mid" if fit >= 60 else "low"  # the Figma Fit score bands


def why(nouls, needs_sponsorship, settled):
    skills, level = nouls["skills_match"], nouls["level_match"]
    parts = [
        "Strong skills match" if skills >= 0.7 else "Some skills missing" if skills >= 0.4 else "Missing key skills",
        "right level" if level >= 0.7 else "level may be high" if level >= 0.4 else "too senior",
    ]
    if not settled and nouls["needs_clearance"] >= 0.6:
        parts.append("needs security clearance")
    if needs_sponsorship and nouls["no_sponsorship"] >= 0.6:
        parts.append("may not sponsor visas")
    return " · ".join(parts)


def score_jobs(profile, jobs):
    """One Jev call per job (all questions in it), run in parallel. Returns the jobs with scores, best first."""
    preferences = profile.get("preferences") or {}
    needs_sponsorship = bool(preferences.get("needs_visa_sponsorship"))
    settled = is_settled(profile)
    summary = profile_summary(profile)
    questions = build_questions(needs_sponsorship)
    client = get_typesafe()

    def score(job):
        state = {
            "candidate_profile": summary,
            "job_advert": {field: job[field] for field in ("title", "company", "location", "description")},
        }
        try:
            result = client.system_one(state, questions)
        except Exception as error:
            logger.warning("Could not score job %s: %s", job["id"], error)
            return None
        return {name: answer.noul for name, answer in result.nouls.items()}, result.usage.input_tokens or 0

    with ThreadPoolExecutor(max_workers=PARALLEL_CALLS) as pool:
        outcomes = list(pool.map(score, jobs))

    scored, tokens = [], 0
    for job, outcome in zip(jobs, outcomes):
        if outcome is None:
            continue
        nouls, used = outcome
        tokens += used
        fit = fit_score(nouls, needs_sponsorship, settled)
        scored.append({
            **job,
            "fit": fit,
            "fit_level": fit_level(fit),
            "why": why(nouls, needs_sponsorship, settled),
            "signals": {name: round(value, 2) for name, value in nouls.items()},
        })

    logger.info("Scored %d of %d jobs: %d input tokens ($%.4f)", len(scored), len(jobs), tokens, tokens * JEV_PRICE_PER_TOKEN)
    if jobs and not scored:
        raise JobMatchError("We couldn't score the jobs right now. Please try again in a moment.")
    return sorted(scored, key=lambda job: -job["fit"])


def find_jobs(profile, roles=None):
    """The whole search: fetch adverts for the roles and places, filter them, score them, rank them."""
    get_typesafe()  # fail fast, before calling the job board, if matching isn't set up
    preferences = profile.get("preferences") or {}
    roles = roles or preferences.get("target_roles") or []
    jobs = adzuna.search_all(roles, (preferences.get("locations") or [])[:MAX_PLACES])
    kept, dropped = filter_jobs(jobs, preferences)
    if dropped:
        logger.info("Filtered out: %s", dict(dropped))
    return score_jobs(profile, kept[:MAX_TO_SCORE])