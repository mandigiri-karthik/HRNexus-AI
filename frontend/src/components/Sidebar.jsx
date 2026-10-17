import { useAuth } from "../context/AuthContext";
import AgentAvatar from "./AgentAvatar";
import Icon from "./Icon";
import NavItem from "./NavItem";

const NAV = [
  { to: "/", icon: "message", label: "Assistant" },
  { to: "/jobs", icon: "briefcase", label: "Jobs" },
  { to: "/review", icon: "inbox", label: "Review" },
  { to: "/tracker", icon: "kanban", label: "Tracker" },
  { to: "/profile", icon: "user", label: "Profile" },
];

// Placeholder statuses until Scout and Writer exist in the backend.
// dot: "active" (pine), "idle" (grey), "busy" (amber)
const AGENTS = [
  { agent: "supervisor", name: "Supervisor", status: "Ready", dot: "active" },
  { agent: "scout", name: "Scout", status: "Not set up yet", dot: "idle" },
  { agent: "writer", name: "Writer", status: "Not set up yet", dot: "idle" },
];

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export default function Sidebar() {
  const { session } = useAuth();
  const { user } = session;

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo">
          <Icon name="sparkle" size={16} />
        </span>
        <span className="sidebar__name">Job Hunter</span>
      </div>

      <p className="text-overline sidebar__section">Workspace</p>
      <nav className="sidebar__nav" aria-label="Main">
        {NAV.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      <section className="sidebar__agents" aria-label="Agents">
        <p className="text-overline sidebar__section">Agents</p>
        {AGENTS.map(({ agent, name, status, dot }) => (
          <div key={agent} className="sidebar__row">
            <AgentAvatar agent={agent} size="sm" />
            <div className="sidebar__row-text">
              <span className="text-label-s">{name}</span>
              <span className="text-body-s sidebar__muted">{status}</span>
            </div>
            <span className={`sidebar__dot sidebar__dot--${dot}`} />
          </div>
        ))}
      </section>

      <div className="sidebar__row sidebar__user">
        <span className="sidebar__initials" aria-hidden="true">{initials(user.name)}</span>
        <div className="sidebar__row-text">
          <span className="text-label-s">{user.name}</span>
          <span className="text-body-s sidebar__muted">{user.email}</span>
        </div>
      </div>
    </aside>
  );
}