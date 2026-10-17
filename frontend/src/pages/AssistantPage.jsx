import { useEffect, useRef, useState } from "react";
import AgentAvatar from "../components/AgentAvatar";
import Button from "../components/Button";
import Chip from "../components/Chip";
import Icon from "../components/Icon";
import { useAuth } from "../context/AuthContext";
import useIntake from "../hooks/useIntake";
import QuestionCard from "../components/QuestionCard";
import { useNavigate } from "react-router-dom";
import ProfilePanel from "../components/ProfilePanel";

function formatSize(bytes) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function Message({ message }) {
  if (message.from === "supervisor") {
    return (
      <div className="chat-message">
        <AgentAvatar agent="supervisor" />
        <div className="chat-message__body">
          <span className="text-label-s">Supervisor</span>
          <p className="text-body-m">{message.text}</p>
        </div>
      </div>
    );
  }
  if (message.file) {
    return (
      <div className="chat-file">
        <span className="chat-file__icon">
          <Icon name="file-text" />
        </span>
        <div>
          <p className="text-body-m-medium">{message.file.name}</p>
          <p className="text-body-s chat-muted">PDF{message.file.size ? ` · ${formatSize(message.file.size)}` : ""}</p>
        </div>
      </div>
    );
  }
  return <p className="chat-bubble text-body-m">{message.text}</p>;
}

export default function AssistantPage() {
  const { session, endSession } = useAuth();
  const intake = useIntake(session.token, endSession);
  const navigate = useNavigate();
  const { status, messages, busy, error } = intake;
  const [draft, setDraft] = useState("");
  const fileInput = useRef(null);
  const chatEnd = useRef(null);
  const firstName = session.user.name.split(" ")[0];
  const canAnswer = status === "question" && !busy;

  // Keep the newest message in view.
  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const chooseFile = () => fileInput.current.click();

  const pickFile = (event) => {
    const file = event.target.files[0];
    event.target.value = ""; // lets the same file be picked again
    if (file) intake.upload(file);
  };

  const send = (event) => {
    event.preventDefault();
    if (!canAnswer || !draft.trim()) return;
    intake.answer({ text: draft.trim() });
    setDraft("");
  };

  // Enter sends; Shift + Enter makes a new line.
  const onKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) send(event);
  };

  const lastIsFile = messages.at(-1)?.file;

    return (
    <div className="assistant-layout">
      <div className="assistant">
        <header className="assistant__header">
          <h1 className="text-heading-m">Assistant</h1>
          <Chip>Onboarding</Chip>
          <Button variant="secondary" className="assistant__new" onClick={chooseFile} disabled={busy}>
            New session
          </Button>
        </header>

        <div className="assistant__chat">
          <div className="assistant__thread">
            {status === "loading" && <p className="text-body-s chat-muted">Loading…</p>}
            {status === "not_started" && (
              <Message
                message={{
                  from: "supervisor",
                  text: `Hi ${firstName} — I'm your job hunt supervisor. Attach your CV and I'll turn it into a search profile.`,
                }}
              />
            )}
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            {status === "question" && !busy && intake.question && (
              <QuestionCard
                key={messages.at(-1)?.id}
                question={intake.question}
                busy={busy}
                onAnswer={intake.answer}
              />
            )}
            {busy && (
              <p className="text-body-s chat-muted">{lastIsFile ? "Reading your CV…" : "Supervisor is thinking…"}</p>
            )}
            {status === "retry" && !busy && (
              <div className="chat-notice">
                <p className="text-body-m chat-muted">Something interrupted the conversation.</p>
                <Button variant="secondary" onClick={intake.retry}>
                  Try again
                </Button>
              </div>
            )}
            {error && (
              <p className="chat-error text-body-s" role="alert">
                {error}
              </p>
            )}
            <div ref={chatEnd} />
          </div>
        </div>

        <form className="assistant__composer" onSubmit={send}>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={
              canAnswer
                ? "Reply to Supervisor in your own words…"
                : status === "complete"
                  ? "Your profile is done. Attach a new CV to start over."
                  : "Attach your CV to start"
            }
            disabled={!canAnswer}
            aria-label="Your reply"
          />
          <div className="assistant__composer-actions">
            <Button variant="ghost" icon="paperclip" onClick={chooseFile} disabled={busy}>
              Attach CV
            </Button>
            <button type="submit" className="assistant__send" disabled={!canAnswer || !draft.trim()} aria-label="Send">
              <Icon name="arrow-up" />
            </button>
          </div>
        </form>
        <input ref={fileInput} type="file" accept="application/pdf" hidden onChange={pickFile} />
      </div>

      {intake.profile && (
        <ProfilePanel
          profile={intake.profile}
          askingField={intake.question?.field}
          complete={status === "complete"}
          onConfirm={() => navigate("/jobs")}
        />
      )}
    </div>
  );
}