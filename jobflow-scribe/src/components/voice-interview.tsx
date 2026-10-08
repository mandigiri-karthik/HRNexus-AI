import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { InterviewSession, TranscriptTurn } from "@/lib/types";

interface Props {
  session: InterviewSession;
  vars: { job_title: string; employer: string; job_description: string; candidate_name: string };
  onEnd: (t: TranscriptTurn[]) => void;
}

export default function VoiceInterview(props: Props) {
  return (
    <ConversationProvider>
      <Live {...props} />
    </ConversationProvider>
  );
}

function Live({ session, vars, onEnd }: Props) {
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const turnsRef = useRef<TranscriptTurn[]>([]);
  const [muted, setMuted] = useState(false);
  const started = useRef(false);

  const conv = useConversation({
    micMuted: muted,
    onMessage: ({ message, source }: { message: string; source: string }) => {
      const t: TranscriptTurn = {
        role: source === "user" ? "candidate" : "interviewer",
        text: message,
        timestamp: new Date().toISOString(),
      };
      turnsRef.current = [...turnsRef.current, t];
      setTurns(turnsRef.current);
    },
    onError: () => toast.error("The voice connection had a problem."),
  });

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        if (session.signedUrl)
          conv.startSession({ signedUrl: session.signedUrl, dynamicVariables: vars });
        else if (session.agentId)
          conv.startSession({
            agentId: session.agentId,
            connectionType: "webrtc",
            dynamicVariables: vars,
          });
      } catch {
        toast.error("We need microphone access for the voice interview.");
      }
    })();
  }, [conv, session, vars]);

  const end = () => {
    conv.endSession();
    onEnd(turnsRef.current);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-8">
        <div
          className={`flex size-36 items-center justify-center rounded-full bg-primary text-primary-foreground ${conv.isSpeaking ? "animate-orb" : ""}`}
        >
          <Mic className="size-12" aria-hidden />
        </div>
        <p className="mt-6 font-medium" aria-live="polite">
          {conv.status !== "connected"
            ? "Connecting…"
            : conv.isSpeaking
              ? "Interviewer is speaking"
              : "Listening"}
        </p>
        <div className="mt-6 flex gap-2">
          <Button
            variant="outline"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Unmute microphone" : "Mute microphone"}
          >
            {muted ? <MicOff className="size-4" /> : <Mic className="size-4" />}{" "}
            {muted ? "Unmute" : "Mute"}
          </Button>
          <Button variant="destructive" onClick={end}>
            <PhoneOff className="size-4" /> End interview
          </Button>
        </div>
      </div>
      <div
        className="max-h-[28rem] overflow-y-auto rounded-xl border bg-background p-4"
        aria-label="Live transcript"
      >
        <p className="mb-3 text-sm font-medium text-muted-foreground">Live transcript</p>
        {turns.map((t, i) => (
          <p
            key={i}
            className={`mb-2 rounded-lg p-2 text-sm ${t.role === "candidate" ? "ml-8 bg-primary-soft" : "mr-8 bg-muted"}`}
          >
            <span className="font-medium">{t.role === "candidate" ? "You" : "Interviewer"}:</span>{" "}
            {t.text}
          </p>
        ))}
      </div>
    </div>
  );
}
