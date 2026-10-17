import { useCallback, useEffect, useState } from "react";
import { answerIntake, getIntake, uploadCv } from "../services/api";

let nextId = 0;
const message = (from, fields) => ({ id: ++nextId, from, ...fields });

// The CV intake conversation. The page only draws what this returns.
export default function useIntake(token, onUnauthorized) {
  const [status, setStatus] = useState("loading"); // loading | not_started | question | complete | retry
  const [question, setQuestion] = useState(null); // { field, text, options, multiSelect }
  const [profile, setProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Applies a reply from the backend. On the first load the chat is replaced, not added to.
  const apply = useCallback((data, { replace = false } = {}) => {
    setStatus(data.status);
    setProfile(data.profile ?? null);

    let reply = null;
    if (data.status === "question") {
      setQuestion({ field: data.field, text: data.question, options: data.options, multiSelect: data.multi_select });
      reply = message("supervisor", { text: data.question });
    } else {
      setQuestion(null);
      if (data.status === "complete") {
        reply = message("supervisor", { text: "Your search profile is ready. Check it on the right." });
      }
    }
    if (replace) {
      const history = (data.messages || []).map(({ from, ...fields }) => message(from, fields));
      setMessages(data.status === "complete" && reply ? [...history, reply] : history);
    } else if (reply) {
      setMessages((list) => [...list, reply]);
    }
  }, []);

  // Runs one backend call: shows the user's message, waits, applies the reply, handles errors.
  const run = useCallback(
    async (call, { userMessage, replace } = {}) => {
      setBusy(true);
      setError("");
      if (userMessage) setMessages((list) => [...list, userMessage]);
      try {
        apply(await call(), { replace });
      } catch (err) {
        if (err.status === 401) return onUnauthorized();
        if (err.status === 409) setStatus("not_started"); // the conversation was lost; upload again
        setError(err.message);
      } finally {
        setBusy(false);
      }
    },
    [apply, onUnauthorized],
  );

  // Where were we? Runs when the page opens, e.g. after a refresh.
  useEffect(() => {
    let cancelled = false;
    getIntake(token)
      .then((data) => {
        if (!cancelled) apply(data, { replace: true });
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 401) return onUnauthorized();
        setStatus("not_started");
        setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [token, apply, onUnauthorized]);

  const upload = (file) => {
    setMessages([]); // a new CV starts the conversation again
    return run(() => uploadCv(token, file), {
      userMessage: message("you", { file: { name: file.name, size: file.size } }),
    });
  };

  const answer = (reply) => {
    const text = reply.skip ? "Skip for now" : reply.selected ? reply.selected.join(", ") : reply.text;
    return run(() => answerIntake(token, reply), { userMessage: message("you", { text }) });
  };

  // After a "retry" status: continues the conversation from where the error stopped it.
  const retry = () => run(() => answerIntake(token, { text: "" }));

  return { status, question, profile, messages, busy, error, upload, answer, retry };
}