import { useState } from "react";
import Button from "./Button";

// The answer options under a question: click to answer, or pick several and Continue.
export default function QuestionCard({ question, busy, onAnswer }) {
  const { options, multiSelect } = question;
  const [picked, setPicked] = useState([]);

  const choose = (label) => {
    if (!multiSelect) return onAnswer({ selected: [label] });
    setPicked((list) => (list.includes(label) ? list.filter((item) => item !== label) : [...list, label]));
  };

  return (
    <div className="question-card">
      <div className="question-card__options" role="group" aria-label="Answer options">
        {options.map(({ label }) => (
          <button
            key={label}
            type="button"
            className="option"
            aria-pressed={multiSelect ? picked.includes(label) : undefined}
            disabled={busy}
            onClick={() => choose(label)}
          >
            {label}
          </button>
        ))}
        <button type="button" className="option option--skip" disabled={busy} onClick={() => onAnswer({ skip: true })}>
          Skip for now
        </button>
      </div>
      {multiSelect && picked.length > 0 && (
        <div>
          <Button icon="check" disabled={busy} onClick={() => onAnswer({ selected: picked })}>
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}