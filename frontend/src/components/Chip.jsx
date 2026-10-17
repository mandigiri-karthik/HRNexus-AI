// tone: "accent" applied/approved, "amber" needs review, "red" rejected/gap, "blue" interview, "neutral" metadata
export default function Chip({ tone = "neutral", children }) {
  return <span className={`chip chip--${tone}`}>{children}</span>;
}