export default function ComingSoonPage({ title }) {
  return (
    <div style={{ padding: "var(--space-48)" }}>
      <h1 className="text-display-l">{title}</h1>
      <p className="text-body-m sidebar__muted">Coming soon.</p>
    </div>
  );
}