# API contract and known limitations

Reference for connecting the frontend to the real FastAPI backend. See the [README](../README.md) for how to run the app.

## Switching from mock to the real backend
Set `VITE_USE_MOCK=false` and `VITE_API_BASE_URL` to your FastAPI server. Every call goes through `src/lib/api.ts`, which sends JSON and `Authorization: Bearer <token>`. Non-2xx responses throw `ApiError` and show a toast. Mock data lives in `src/mocks/`; the in-memory store is `src/mocks/store.ts`.

## API contract
```
POST   /api/auth/signup                 {name,email,password} → {token,user}
POST   /api/auth/login                  {email,password} → {token,user}
GET    /api/profile                     → Profile
PUT    /api/profile                     Profile → Profile
POST   /api/profile/parse-cv            multipart file → Partial<Profile>
POST   /api/career-options/generate     → CareerOption[]
POST   /api/career-options/{id}/select  → CareerOption
POST   /api/career-options/{id}/reject  {reason} → CareerOption[]
GET    /api/gaps?careerOptionId=        → GapAnalysis
PATCH  /api/next-steps/{id}             {done} → NextStep
GET    /api/jobs?careerOptionId=&minMatch=&maxDistance= → Vacancy[]
GET    /api/jobs/{id}                   → Vacancy
POST   /api/applications/draft          {jobId,docType,tone} → ApplicationDraft
PUT    /api/applications/draft/{id}     {paragraphs} → ApplicationDraft
POST   /api/applications/{draftId}/approve → Application
POST   /api/applications/{id}/submit    → Application (status "applied")
PATCH  /api/applications/{id}/status    {status,notes?} → Application
GET    /api/applications                → Application[]
POST   /api/applications/save           {jobId} → Application (status "saved")
POST   /api/interview/session           {jobId,language} → InterviewSession
POST   /api/interview/feedback          {sessionId,jobId,transcript,language} → InterviewFeedback
GET    /api/interviews                  → InterviewFeedback[]
GET    /api/dashboard                   → DashboardStats
GET    /api/recommendations             → Recommendation[]
```

## Known limitations
- Mock state lives in the browser session only; closing the tab resets it.
- Logging in (mock) loads the demo persona "Amira Haddad"; signing up starts empty.
- CV parsing, AI drafts, feedback and translations are simulated in mock mode.
- There is no endpoint to fetch an existing draft in real mode; drafts are kept in the page cache after creation.
- Browser speech recognition works only in some browsers (e.g. Chrome); otherwise type answers.
- Follow-up reminders are shown as a confirmation only — no notifications are sent.
