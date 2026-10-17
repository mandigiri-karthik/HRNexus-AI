// Scout's fit score out of 100. High ≥ 80, Mid 60–79, Low < 60.
function levelOf(score) {
  if (score >= 80) return "high";
  if (score >= 60) return "mid";
  return "low";
}

export default function FitScore({ score }) {
  return (
    <span className={`fit-score fit-score--${levelOf(score)}`} aria-label={`Fit score ${score} out of 100`}>
      {score}
    </span>
  );
}