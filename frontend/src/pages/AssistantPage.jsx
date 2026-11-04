import { useSearchParams } from "react-router-dom";
import AgentAvatar from "../components/AgentAvatar";
import Chip from "../components/Chip";
import Icon from "../components/Icon";
import SearchProfileTab from "../components/SearchProfileTab";

const TABS = [
  { id: "profile", label: "Search profile", icon: "user" },
  { id: "assistant", label: "Assistant", icon: "message" },
];

// Tab 2 for now: a placeholder for the chat assistant.
function AssistantComingSoon() {
  return (
    <div className="empty-card">
      <AgentAvatar agent="supervisor" />
      <p className="text-heading-m">Your job hunt assistant is coming soon</p>
      <p className="text-body-m chat-muted">
        Soon you'll be able to ask things like "Which jobs did I apply for, and where do they stand?" and update them by chatting.
      </p>
      <Chip tone="amber">Coming soon</Chip>
    </div>
  );
}

export default function AssistantPage() {
  const [params, setParams] = useSearchParams();
  const active = params.get("tab") === "assistant" ? "assistant" : "profile";

  // The active tab lives in the URL, so a refresh or a shared link opens the same tab.
  const select = (id) => setParams(id === "profile" ? {} : { tab: id }, { replace: true });

  // Left and right arrow keys move between tabs, as screen-reader users expect.
  const onKeyDown = (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const index = TABS.findIndex((tab) => tab.id === active);
    const next = TABS[(index + (event.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length];
    select(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  };

  return (
    <div className="assistant-page">
      <header className="assistant-page__header">
        <h1 className="text-heading-m">Onboarding</h1>
        <div className="tabs" role="tablist" aria-label="Assistant sections" onKeyDown={onKeyDown}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              type="button"
              role="tab"
              className="tab"
              aria-selected={active === tab.id}
              aria-controls={`panel-${tab.id}`}
              tabIndex={active === tab.id ? 0 : -1}
              onClick={() => select(tab.id)}
            >
              <Icon name={tab.icon} size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div id={`panel-${active}`} role="tabpanel" aria-labelledby={`tab-${active}`} className="assistant-page__panel">
        {active === "profile" ? <SearchProfileTab /> : <AssistantComingSoon />}
      </div>
    </div>
  );
}
