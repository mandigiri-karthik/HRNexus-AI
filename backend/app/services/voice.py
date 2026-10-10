"""Turns a voice recording into English text using ElevenLabs."""

import logging

import requests

from app.config import ELEVENLABS_API_KEY

logger = logging.getLogger(__name__)

SPEECH_TO_TEXT_URL = "https://api.elevenlabs.io/v1/speech-to-text"
TRANSLATE_INSTRUCTION = (
    "You are a professional translator. Rewrite the entire transcript in natural, fluent English. "
    "Translate every sentence, whatever language it was spoken in, and keep the full meaning, "
    "including names, places, job titles, dates and numbers. "
    "Do not summarise, shorten, explain or add anything. "
    "Output only the English translation, with no notes and none of the original-language text. "
    "If the transcript is already entirely in English, return it exactly as it is."
)

TIMEOUT_SECONDS = 120

UNAVAILABLE = "The voice service is not available right now. Please try again."


class VoiceError(Exception):
    """The recording could not be processed. The message is safe to show to the user."""

    def __init__(self, message, status_code):
        super().__init__(message)
        self.status_code = status_code


def transcribe_to_english(audio, filename, content_type):
    """Returns {"language", "original_text", "text"}, where "text" is in English."""
    try:
        response = requests.post(
            SPEECH_TO_TEXT_URL,
            headers={"xi-api-key": ELEVENLABS_API_KEY},
            data={"model_id": "scribe_v2", "transcript_edit": TRANSLATE_INSTRUCTION},
            files={"file": (filename or "recording", audio, content_type or "application/octet-stream")},
            timeout=TIMEOUT_SECONDS,
        )
    except requests.RequestException:
        logger.exception("Could not reach ElevenLabs")
        raise VoiceError(UNAVAILABLE, 503)

    if response.status_code in (400, 422):
        logger.warning("ElevenLabs rejected the recording: %s", response.text[:500])
        raise VoiceError("We could not understand that recording. Please record it again.", 422)
    if not response.ok:
        # 401 here means our API key is wrong; 429 means we hit a usage limit.
        logger.error("ElevenLabs error %s: %s", response.status_code, response.text[:500])
        raise VoiceError(UNAVAILABLE, 503)

    try:
        result = response.json()
    except ValueError:
        logger.error("ElevenLabs sent a reply that is not JSON")
        raise VoiceError(UNAVAILABLE, 503)

    original_text = (result.get("text") or "").strip()
    if not original_text:
        raise VoiceError("We could not hear any speech in that recording.", 422)

    edited = result.get("edited_transcript") or {}
    english_text = (edited.get("edited_text") or "").strip()
    if not english_text:
        logger.warning("ElevenLabs did not return a translation: %s", edited)
        english_text = original_text

    return {
        "language": result.get("language_code"),
        "original_text": original_text,
        "text": english_text,
    }
