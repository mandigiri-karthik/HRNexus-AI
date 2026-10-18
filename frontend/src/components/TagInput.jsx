import { useState } from "react";
import Icon from "./Icon";

// A list of short values: type one and press Enter (or a comma) to add it, click × to remove it.
export default function TagInput({ values, onChange, placeholder, label }) {
  const [text, setText] = useState("");

  const add = () => {
    const value = text.trim();
    if (value && !values.includes(value)) onChange([...values, value]);
    setText("");
  };

  const onKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add();
    } else if (event.key === "Backspace" && !text && values.length) {
      onChange(values.slice(0, -1));
    }
  };

  return (
    <div className="tag-input">
      {values.map((value) => (
        <span key={value} className="tag">
          {value}
          <button type="button" aria-label={`Remove ${value}`} onClick={() => onChange(values.filter((item) => item !== value))}>
            <Icon name="x" size={14} />
          </button>
        </span>
      ))}
      <input
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={add}
        placeholder={values.length ? "" : placeholder}
        aria-label={label}
      />
    </div>
  );
}
