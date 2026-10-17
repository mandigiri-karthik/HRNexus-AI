"""Logs the profile extracted from a PDF resume."""

import json
import logging
import sys
from pathlib import Path

from app.agents.profile_extractor_agent import extract_profile
from app.utils.resume_helpers import extract_pdf_text

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

resume_text = extract_pdf_text(Path(sys.argv[1]).read_bytes())
profile = extract_profile(resume_text)
logger.info("Extracted profile:\n%s", json.dumps(profile, indent=2, ensure_ascii=False))
