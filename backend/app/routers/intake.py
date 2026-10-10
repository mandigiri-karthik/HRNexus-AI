import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile

from app.dependencies import get_current_user
from app.schemas import IntakeResponse, TextIntakeRequest
from app.services.cv import CvError, extract_pdf_text
from app.services.voice import VoiceError, transcribe_to_english


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/intake", tags=["intake"])

MAX_CV_BYTES = 5 * 1024 * 1024  # 5 MB
MAX_VOICE_BYTES = 25 * 1024 * 1024  # 25 MB

@router.post("/text", response_model=IntakeResponse)
def submit_text(body: TextIntakeRequest, user=Depends(get_current_user)):
    logger.info("Text intake from user %s:\n%s", user["id"], body.text)
    return {"source": "text", "text": body.text}

@router.post("/cv", response_model=IntakeResponse)
def upload_cv(file: UploadFile, user=Depends(get_current_user)):
    # Read one byte more than the limit, so an oversized file is detected
    # without loading all of it into memory.
    data = file.file.read(MAX_CV_BYTES + 1)
    if len(data) > MAX_CV_BYTES:
        raise HTTPException(413, "That file is too large. The limit is 5 MB.")
    try:
        text = extract_pdf_text(data)
    except CvError as error:
        raise HTTPException(422, str(error))
    logger.info("CV from user %s (%s):\n%s", user["id"], file.filename, text)
    return {"source": "cv", "text": text}

@router.post("/voice", response_model=IntakeResponse)
def upload_voice(file: UploadFile, user=Depends(get_current_user)):
    audio = file.file.read(MAX_VOICE_BYTES + 1)
    if len(audio) > MAX_VOICE_BYTES:
        raise HTTPException(413, "That recording is too large. The limit is 25 MB.")
    if not audio:
        raise HTTPException(422, "That recording is empty. Please record it again.")
    try:
        result = transcribe_to_english(audio, file.filename, file.content_type)
    except VoiceError as error:
        raise HTTPException(error.status_code, str(error))
    logger.info(
        "Voice from user %s (language %s):\nOriginal: %s\nEnglish: %s",
        user["id"],
        result["language"],
        result["original_text"],
        result["text"],
    )
    return {"source": "voice", **result}

