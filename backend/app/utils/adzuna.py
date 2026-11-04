"""Fetching job adverts from Adzuna (https://developer.adzuna.com)."""

import html
import logging
import re

import requests
import time

from app.config import ADZUNA_APP_ID, ADZUNA_APP_KEY

logger = logging.getLogger(__name__)

SEARCH_URL = "https://api.adzuna.com/v1/api/jobs/gb/search/1"
RESULTS_PER_SEARCH = 20
MAX_DAYS_OLD = 30
RETRY_STATUSES = {429, 502, 503, 504}
RETRY_DELAY_SECONDS = 2


class JobBoardError(Exception):
    """Adzuna could not be reached or refused the request. The message is safe to show to the user."""


def clean(text):
    """Adzuna wraps matched words in <strong> tags; remove tags and decode entities like &amp;."""
    return html.unescape(re.sub(r"<[^>]+>", "", text or "")).strip()


def search_place(place):
    """'anywhere in Scotland' -> 'Scotland'; 'anywhere in the UK', 'UK' or 'remote' -> None (no place filter)."""
    place = re.sub(r"(?i)^anywhere in (the )?", "", place or "").strip()
    return None if place.lower() in ("", "uk", "united kingdom", "remote") else place


def to_job(advert, searched_for):
    """Adzuna's advert in the shape the rest of the app uses."""
    return {
        "id": str(advert["id"]),
        "title": clean(advert.get("title")),
        "company": (advert.get("company") or {}).get("display_name", "Unknown"),
        "location": (advert.get("location") or {}).get("display_name", ""),
        "description": clean(advert.get("description")),
        "salary_min": advert.get("salary_min"),
        "salary_max": advert.get("salary_max"),
        # "1" when Adzuna guessed the salary because the advert didn't state one
        "salary_is_predicted": advert.get("salary_is_predicted") == "1",
        "contract_time": advert.get("contract_time"),  # "full_time", "part_time" or None
        "url": advert.get("redirect_url"),
        "posted_at": advert.get("created"),
        "searched_for": searched_for,
    }


def search(role, place=None):
    """One search: a role, optionally in one place. Returns a list of jobs."""
    params = {
        "app_id": ADZUNA_APP_ID,
        "app_key": ADZUNA_APP_KEY,
        "what": role,
        "results_per_page": RESULTS_PER_SEARCH,
        "max_days_old": MAX_DAYS_OLD,
        "sort_by": "relevance",
        "content-type": "application/json",
    }
    if place:
        params["where"] = place
    for attempt in range(2):
        response = requests.get(SEARCH_URL, params=params, timeout=30)
        if response.status_code not in RETRY_STATUSES or attempt == 1:
            break
        time.sleep(RETRY_DELAY_SECONDS)  # a busy or briefly unavailable board usually recovers within seconds
    response.raise_for_status()
    return [to_job(advert, role) for advert in response.json().get("results", [])]

def describe_error(error):
    """A safe description of a failed request: the status code or error type, never the URL (it holds the API key)."""
    response = getattr(error, "response", None)
    if response is not None:
        return f"HTTP {response.status_code}"
    return type(error).__name__  # e.g. ConnectTimeout, ConnectionError

def search_all(roles, places):
    """Every role in every place, with each advert once. A failed search is logged and skipped."""
    if not (ADZUNA_APP_ID and ADZUNA_APP_KEY):
        raise JobBoardError("Job search isn't set up yet.")

    places = {search_place(place) for place in places} or {None}
    found_by_id, failures = {}, 0
    for role in roles:
        for place in places:
            try:
                jobs = search(role, place)
            except requests.RequestException as error:
                failures += 1
                logger.warning("Job search failed for %s in %s: %s", role, place or "the UK", describe_error(error))
                continue
            logger.info("Job search: %s in %s -> %d jobs", role, place or "the UK", len(jobs))
            for job in jobs:
                found_by_id.setdefault(job["id"], job)

    if not found_by_id and failures:
        raise JobBoardError("We couldn't reach the job board. Please try again in a moment.")
    return list(found_by_id.values())