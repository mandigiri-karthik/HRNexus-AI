import Icon from "./Icon";

const AGENTS = {
  supervisor: { icon: "sparkle", label: "Supervisor" },
  scout: { icon: "search", label: "Scout" },
  writer: { icon: "pencil", label: "Writer" },
  you: { icon: "user", label: "You" },
};

export default function AgentAvatar({ agent, size }) {
  const { icon, label } = AGENTS[agent];
  const sizeClass = size === "sm" ? " agent-avatar--sm" : "";
  return (
    <span className={`agent-avatar agent-avatar--${agent}${sizeClass}`} role="img" aria-label={label}>
      <Icon name={icon} size={16} />
    </span>
  );
}