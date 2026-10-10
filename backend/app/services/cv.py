"""Reads the text out of an uploaded CV."""

from io import BytesIO

from pypdf import PdfReader

MAX_PAGES = 20


class CvError(Exception):
    """The file cannot be used. The message is safe to show to the user."""


def extract_pdf_text(data):
    if not data.startswith(b"%PDF-"):
        raise CvError("That file is not a PDF.")
    try:
        reader = PdfReader(BytesIO(data))
        if reader.is_encrypted:
            raise CvError("That PDF is password-protected. Please upload one without a password.")
        if len(reader.pages) > MAX_PAGES:
            raise CvError(f"That PDF has too many pages. The limit is {MAX_PAGES}.")
        pages = [page.extract_text() or "" for page in reader.pages]
    except CvError:
        raise
    except Exception:
        # pypdf raises many different errors on damaged files; treat them all the same.
        raise CvError("We could not read that PDF. Please try saving it again.")
    text = "\n\n".join(page.strip() for page in pages if page.strip())
    if not text:
        raise CvError("We could not find any text in that PDF. It may be a scan or a photo.")
    return text
