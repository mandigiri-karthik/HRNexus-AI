"""Reading the text out of an uploaded CV."""

import logging

import pymupdf

logger = logging.getLogger(__name__)

MAX_PAGES = 20


class CvError(Exception):
    """The file cannot be used. The message is safe to show to the user."""


def extract_pdf_text(data):
    if not data.startswith(b"%PDF-"):
        raise CvError("That file is not a PDF.")
    try:
        with pymupdf.open(stream=data, filetype="pdf") as document:
            if document.needs_pass:
                raise CvError("That PDF is password-protected. Please upload one without a password.")
            if document.page_count > MAX_PAGES:
                raise CvError(f"That PDF has too many pages. The limit is {MAX_PAGES}.")
            pages = [page.get_text() for page in document]
    except CvError:
        raise
    except Exception:
        # PyMuPDF raises many different errors on damaged files; treat them all the same.
        logger.exception("PDF could not be read")
        raise CvError("We could not read that PDF. Please try saving it again.")
    text = "\n\n".join(page.strip() for page in pages if page.strip())
    if not text:
        raise CvError("We could not find any text in that PDF. It may be a scan or a photo.")
    return text
