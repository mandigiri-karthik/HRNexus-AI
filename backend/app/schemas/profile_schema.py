"""Simplified profile: what the job search and applications actually need."""
from typing import Literal
from pydantic import BaseModel, Field

DATE = "YYYY-MM, 'present' for ongoing, or null if not stated"


class Basics(BaseModel):
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = Field(None, description="Where the person lives now, e.g. 'Glasgow, UK'")
    work_authorization: str | None = Field(None, description="Visa or right to work, as stated")


class Experience(BaseModel):
    title: str
    company: str
    start: str | None = Field(None, description=DATE)
    end: str | None = Field(None, description=DATE)
    highlights: list[str] = Field(description="One entry per bullet point, word for word")


class Project(BaseModel):
    name: str
    highlights: list[str] = Field(description="One entry per bullet point, word for word")
    skills_used: list[str] = Field(default_factory=list)


class Education(BaseModel):
    degree: str
    institution: str
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