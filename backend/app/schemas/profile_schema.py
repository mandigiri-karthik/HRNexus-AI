"""Simplified profile: what the job search and applications actually need."""
import re
from typing import Literal
from pydantic import BaseModel, Field

DATE = "YYYY-MM, 'present' for ongoing, or null if not stated"


class Basics(BaseModel):
    headline: str | None = Field(
        None, description="The CV's one-line headline or professional title, as written, e.g. 'MSc AI student | Python, LangChain'"
    )
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = Field(None, description="Where the person lives now, e.g. 'Glasgow, UK'")
    work_authorization: str | None = Field(None, description="Visa or right to work, as stated")


class Experience(BaseModel):
    title: str | None = None
    company: str | None = None
    start: str | None = Field(None, description=DATE)
    end: str | None = Field(None, description=DATE)
    highlights: list[str] = Field(default_factory=list, description="One entry per bullet point, word for word")


class Project(BaseModel):
    name: str | None = None
    highlights: list[str] = Field(default_factory=list, description="One entry per bullet point, word for word")
    skills_used: list[str] = Field(default_factory=list)


class Education(BaseModel):
    degree: str | None = None
    institution: str | None = None
    end: str | None = Field(None, description="Graduation or expected graduation, " + DATE)


class Preferences(BaseModel):
    target_roles: list[str] = Field(
        default_factory=list,
        description="Job titles or fields they want, e.g. 'AI Engineer', 'Data Analyst'. Not seniority or contract type.",
    )
    job_types: list[str] = Field(
        default_factory=list,
        description="Seniority and contract type, e.g. internship, graduate, entry-level, full-time, part-time, contract. Not remote or hybrid.",
    )
    locations: list[str] = Field(
        default_factory=list,
        description="Every place they named, including broad ones such as 'anywhere in the UK'",
    )
    work_modes: list[Literal["remote", "hybrid", "on-site"]] = Field(
        default_factory=list, description="Every work mode they would accept. All three if they don't mind."
    )
    min_salary: str | None = Field(None, description="As stated, including currency")
    needs_visa_sponsorship: bool | None = None


class Profile(BaseModel):
    basics: Basics
    skills: list[str] = Field(default_factory=list, description="Skills written in the resume")
    experience: list[Experience] = Field(default_factory=list)
    projects: list[Project] = Field(default_factory=list)
    education: list[Education] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    preferences: Preferences = Field(default_factory=Preferences)

# What the job search needs. The Jobs page stays locked until all of these are filled.
REQUIRED_FOR_SEARCH = ["target_roles", "locations", "work_modes", "needs_visa_sponsorship"]
EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

def missing_for_search(profile):
    """The required fields still empty: the search preferences and a valid email. A visa answer of False counts as filled."""
    profile = profile or {}
    preferences = profile.get("preferences") or {}
    missing = [name for name in REQUIRED_FOR_SEARCH if preferences.get(name) in (None, "", [])]
    email = (profile.get("basics") or {}).get("email") or ""
    if not EMAIL_PATTERN.match(email.strip()):
        missing.append("email")
    return missing