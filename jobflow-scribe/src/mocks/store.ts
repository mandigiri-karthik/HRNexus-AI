import type {
  Application,
  ApplicationDraft,
  CareerOption,
  GapAnalysis,
  InterviewFeedback,
  InterviewSession,
  Profile,
  User,
  Vacancy,
} from "@/lib/types";
import { demoProfile, emptyProfile } from "./persona";
import { careerOptions } from "./careerOptions";
import { vacancies } from "./vacancies";
import { demoApplications } from "./applications";
import { pastInterviews } from "./interviews";
import { buildGaps } from "./gaps";

/** In-memory mock database, mirrored to sessionStorage so a refresh keeps state. */
export interface MockState {
  profile: Profile | null;
  careerOptions: CareerOption[];
  gaps: Record<string, GapAnalysis>;
  vacancies: Vacancy[];
  applications: Application[];
  drafts: ApplicationDraft[];
  sessions: InterviewSession[];
  interviews: InterviewFeedback[];
  rejectionReasons: string[];
  activity: { text: string; date: string }[];
  seq: number;
}

const KEY = "ca_mock_store";
let state: MockState | null = null;

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

export function seedDemo(): MockState {
  const opts = clone(careerOptions);
  opts[0].selected = true;
  return {
    profile: clone(demoProfile),
    careerOptions: opts,
    gaps: { co1: buildGaps("co1") },
    vacancies: clone(vacancies),
    applications: clone(demoApplications),
    drafts: [],
    sessions: [],
    interviews: clone(pastInterviews),
    rejectionReasons: ["Needed forklift licence."],
    activity: [
      {
        text: "Saved Project Support Officer at Blackdown Housing Trust",
        date: "2026-10-03T09:00:00Z",
      },
      {
        text: "Applied to Logistics Supervisor at Parrett Distribution Co",
        date: "2026-09-30T15:00:00Z",
      },
      { text: "Practice interview scored 6.8/10", date: "2026-09-28T16:30:00Z" },
      {
        text: "Applied to Operations Administrator at Levels Healthcare Services",
        date: "2026-09-26T11:00:00Z",
      },
    ],
    seq: 100,
  };
}

export function seedEmpty(user: User): MockState {
  return {
    profile: emptyProfile(user),
    careerOptions: [],
    gaps: {},
    vacancies: clone(vacancies),
    applications: [],
    drafts: [],
    sessions: [],
    interviews: [],
    rejectionReasons: [],
    activity: [],
    seq: 100,
  };
}

export function getStore(): MockState {
  if (state) return state;
  if (typeof window !== "undefined") {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw) {
      state = JSON.parse(raw) as MockState;
      return state;
    }
  }
  state = seedDemo();
  return state;
}

export function setStore(next: MockState) {
  state = next;
  persist();
}

export function persist() {
  if (state && typeof window !== "undefined")
    window.sessionStorage.setItem(KEY, JSON.stringify(state));
}

export function nextId(prefix: string) {
  const s = getStore();
  s.seq += 1;
  return `${prefix}${s.seq}`;
}

export function logActivity(text: string) {
  getStore().activity.unshift({ text, date: new Date().toISOString() });
}
