"""Scout, the job search: finds adverts for the user's target roles and ranks them by fit.
Each run costs money (job board + scoring calls), so each user can run it once; afterwards the saved results are returned."""

import logging

from fastapi import APIRouter, Depends, HTTPException

from app.agents.job_matcher import JobMatchError, find_jobs
from app.schemas.profile_schema import missing_for_search
from app.utils import store
from app.utils.adzuna import JobBoardError
from app.utils.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

# Each role is one job board search per location, so cap them to keep the search fast and cheap.
MAX_ROLES = 5


def search_response(row):
    """Scout's saved results, or status 'not_run' when the user hasn't searched yet."""
    if not row:
        return {"status": "not_run"}
    return {
        "status": row["status"],
        "jobs": row["jobs"] or [],
        "searched_roles": row["roles"] or [],
        "searched_at": row["searched_at"],
    }


@router.get("")
def get_jobs(user=Depends(get_current_user)):
    """The jobs Scout found for this user. Free: nothing is searched or scored."""
    return search_response(store.find_job_search(user["id"]))


@router.post("/search")
def run_scout(user=Depends(get_current_user)):
    """Run Scout once: search the job board and score every job against the saved profile (about 10-20 seconds)."""
    saved = store.find_profile(user["id"])
    if not saved:
        raise HTTPException(409, "Build your search profile first.")
    profile = saved["data"]

    missing = missing_for_search(profile)
    if missing:
        names = ", ".join(name.replace("_", " ") for name in missing)
        raise HTTPException(409, f"Fill in these fields in your search profile first: {names}.")

    # Claim the user's one search before spending anything, so two clicks can't run it twice.
    if not store.claim_job_search(user["id"]):
        raise HTTPException(403, "Scout has already searched for jobs on your account. It can run once.")

    roles = profile["preferences"]["target_roles"][:MAX_ROLES]
    try:
        jobs = find_jobs(profile, roles)
    except (JobBoardError, JobMatchError) as error:
        store.release_job_search(user["id"])  # a failed run doesn't use up the user's one search
        raise HTTPException(503, str(error))
    except Exception:
        store.release_job_search(user["id"])
        raise

    row = store.finish_job_search(user["id"], roles, jobs)
    logger.info("Scout ran for user %s: %d jobs ranked", user["id"], len(jobs))
    return search_response(row)
