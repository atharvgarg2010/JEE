"use client";

import { useState } from "react";
import { Bell, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface NotifyTeacherButtonProps {
  questionId: string;
}

export function NotifyTeacherButton({ questionId }: NotifyTeacherButtonProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function send() {
    if (!message.trim()) return;
    setSending(true);
    const res = await fetch("/api/student/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ questionId, message: message.trim() }),
    });
    const data = await res.json();
    setSending(false);
    if (data.success) {
      setDone(true);
      setMessage("");
      setTimeout(() => {
        setOpen(false);
        setDone(false);
      }, 2000);
    }
  }

  if (!open) {
    return (
      <Button
        variant="secondary"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        <Bell className="h-4 w-4" />
        Notify teacher
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-violet-500/30 bg-violet-950/20 p-3">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Describe your doubt for the teacher..."
        className="min-h-[80px] text-sm"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1"
          onClick={send}
          disabled={sending || !message.trim()}
        >
          <Send className="h-4 w-4" />
          {sending ? "Sending..." : done ? "Sent!" : "Send"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
