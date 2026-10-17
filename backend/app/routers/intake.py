import logging

from botocore.exceptions import BotoCoreError, ClientError
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from langgraph.types import Command

from app.agents.intake_graph import intake_graph
from app.agents.profile_extractor_agent import ExtractionError
from app.schemas.signInOut_schema import IntakeResponse, TextIntakeRequest
from app.utils import store
from app.utils.dependencies import get_current_user
from app.utils.resume_helpers import CvError, extract_pdf_text

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/intake", tags=["intake"])

MAX_CV_BYTES = 5 * 1024 * 1024  # 5 MB

@router.post("/text", response_model=IntakeResponse)
def submit_text(body: TextIntakeRequest, user=Depends(get_current_user)):
    logger.info("Text intake from user %s:\n%s", user["id"], body.text)
    return {"source": "text", "text": body.text}

@router.post("/cv")
def cv_intake(
    file: UploadFile | None = File(None),
    text: str | None = Form(None),
    selected: list[str] | None = Form(None),
    skip: bool = Form(False),
    user=Depends(get_current_user),
):
    """Send `file` to start with a CV, then answer each question with `selected`, `text` or `skip`."""
    config = {"configurable": {"thread_id": user["id"]}}
    try:
        if file is not None:
            # Read one byte more than the limit, so an oversized file is detected
            # without loading all of it into memory.
            data = file.file.read(MAX_CV_BYTES + 1)
            if len(data) > MAX_CV_BYTES:
                raise HTTPException(413, "That file is too large. The limit is 5 MB.")
            resume_text = extract_pdf_text(data)
            # A new CV starts the conversation again.
            intake_graph.checkpointer.delete_thread(user["id"])
            result = intake_graph.invoke({"resume_text": resume_text}, config)
        else:
            if not intake_graph.get_state(config).next:
                raise HTTPException(409, "Please upload your CV first.")
            reply = {"skip": skip, "selected": selected or [], "text": text or ""}
            result = intake_graph.invoke(Command(resume=reply), config)
    except CvError as error:
        raise HTTPException(422, str(error))
    except ExtractionError as error:
        # Nothing was extracted, so there is no conversation to continue: answers now get
        # "Please upload your CV first." instead of silently retrying the extraction.
        intake_graph.checkpointer.delete_thread(user["id"])
        raise HTTPException(502, str(error))
    except (BotoCoreError, ClientError):
        # Bedrock is throttling, unreachable or refused the call. The conversation is kept,
        # so sending the same request again carries on from the same point.
        logger.exception("Bedrock call failed during CV intake for user %s", user["id"])
        raise HTTPException(503, "The assistant is unavailable right now. Please try again in a moment.")

    if "__interrupt__" in result:
        return {"status": "question", **result["__interrupt__"][0].value}
    store.save_profile(user["id"], "cv", result["profile"])
    logger.info("CV intake complete for user %s", user["id"])
    return {"status": "complete", "profile": result["profile"]}
