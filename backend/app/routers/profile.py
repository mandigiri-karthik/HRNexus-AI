"""The user's profile: build it from a CV, edit it, and see what the job search still needs."""

import logging
from datetime import date

from botocore.exceptions import BotoCoreError, ClientError
from fastapi import APIRouter, Depends, HTTPException, UploadFile

from app.agents.profile_extractor_agent import ExtractionError, NotAResumeError, extract_profile
from app.schemas.profile_schema import Profile, missing_for_search
from app.utils import store
from app.utils.dependencies import get_current_user
from app.utils.resume_helpers import CvError, extract_pdf_text

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/profile", tags=["profile"])

MAX_CV_BYTES = 5 * 1024 * 1024  # 5 MB


def profile_response(row):
    """The saved profile, plus which required fields the job search still needs."""
    data = row["data"] if row else None
    return {
        "profile": data,
        "source": row["source"] if row else None,
        "missing": missing_for_search(data),
        "updated_at": row["updated_at"] if row else None,
    }

def is_filled(value):
    return value not in (None, "", [])

@router.get("")
def get_profile(user=Depends(get_current_user)):
    return profile_response(store.find_profile(user["id"]))

@router.post("/cv")
def upload_cv(file: UploadFile, user=Depends(get_current_user)):
    """Build the profile from a CV. The preferences and tagline the user already set are kept."""
    # Read one byte more than the limit, so an oversized file is detected
    # without loading all of it into memory.
    data = file.file.read(MAX_CV_BYTES + 1)
    if len(data) > MAX_CV_BYTES:
        raise HTTPException(413, "That file is too large. The limit is 5 MB.")
    try:
        profile = extract_profile(extract_pdf_text(data))
    except (CvError, NotAResumeError) as error:
        raise HTTPException(422, str(error))
    except ExtractionError as error:
        raise HTTPException(502, str(error))
    except (BotoCoreError, ClientError):
        logger.exception("Bedrock call failed while reading a CV for user %s", user["id"])
        raise HTTPException(503, "The assistant is unavailable right now. Please try again in a moment.")

    saved = store.find_profile(user["id"])
    if saved:
        kept = {name: value for name, value in (saved["data"].get("preferences") or {}).items() if is_filled(value)}
        profile["preferences"] = {**profile["preferences"], **kept}
        # The tagline and email the user typed win over the new CV (the extractor never keeps an email).
        basics = saved["data"].get("basics") or {}
        for name in ("headline", "email"):
            if basics.get(name):
                profile["basics"][name] = basics[name]

    row = store.save_profile(user["id"], "cv", profile)
    logger.info("Profile built from a CV for user %s", user["id"])
    return profile_response(row)

@router.put("")
def update_profile(body: Profile, user=Depends(get_current_user)):
    """Save the profile as edited in the form. The fields the job search needs must be filled."""
    missing = missing_for_search(body.model_dump())
    if missing:
        names = ", ".join(name.replace("_", " ") for name in missing)
        raise HTTPException(422, f"Please fill in the required fields: {names}.")

    saved = store.find_profile(user["id"])
    data = {"last_updated": date.today().isoformat(), **body.model_dump()}
    row = store.save_profile(user["id"], saved["source"] if saved else "manual", data)
    return profile_response(row)