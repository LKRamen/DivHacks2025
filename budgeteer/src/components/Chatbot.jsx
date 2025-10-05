// src/components/Chatbot.js
import React, { useEffect, useMemo, useRef, useState } from "react";

export default function Chatbot({ context = {}, userName = "there", profile = {} }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hey ${userName}, I’m your budgeting assistant. Ask me anything about your spending, set goals, or get quick ideas to save more.`,
    },
  ]);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  const systemPrompt = useMemo(() => {
    const cats = (context.categories || [])
      .map((c) => `${c.name}:${c.value}`)
      .join(", ");
    const month = context.month || "this month";
    const balance = typeof context.balance === "number" ? context.balance : "unknown";
    const goal = typeof context.goal === "number" ? context.goal : null;

    // Extract profile preferences
    const userGoals = profile?.survey?.goals || [];
    const focusCategories = profile?.survey?.focus_categories || [];
    const nudges = profile?.survey?.nudges || [];
    const timeHorizon = profile?.survey?.time_horizon || [];

    return [
      "You are a helpful, concise budgeting assistant.",
      "Speak in short, direct sentences. Give concrete suggestions that are practical for students.",
      `Data snapshot: categories=[${cats}] month=${month} balance=${balance}${goal !== null ? ` goal=${goal}` : ""}`,
      userGoals.length > 0 ? `User's goals: ${userGoals.join(", ")}` : "",
      focusCategories.length > 0 ? `Focus on: ${focusCategories.join(", ")}` : "",
      nudges.length > 0 ? `User wants: ${nudges.join(", ")}` : "",
      timeHorizon.length > 0 ? `Planning for: ${timeHorizon.join(", ")}` : "",
      "Tailor advice to their stated goals and focus categories.",
      "Give 3 quick, specific actions with estimated monthly impact when asked for ideas.",
    ].filter(Boolean).join("\n");
  }, [context, profile]);

  const send = async () => {
    const content = input.trim();
    if (!content || busy) return;

    const newMsgs = [...messages, { role: "user", content }];
    setMessages(newMsgs);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: systemPrompt,
          context,
          messages: newMsgs.slice(-10),
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || `Chat error: ${res.status}`);

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error from server: ${err.message}` },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 rounded-full shadow-lg bg-emerald-600 text-white px-5 py-3 text-sm font-semibold hover:bg-emerald-700"
      >
        {open ? "Close Chat" : "Chat"}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-[360px] h-[520px] bg-[#1f1f24] border border-gray-700 rounded-2xl shadow-xl flex flex-col text-gray-100">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
            <div className="font-semibold text-emerald-400">Budgeteer Assistant</div>
            <div className="text-xs text-gray-400">{busy ? "thinking…" : "online"}</div>
          </div>

          {/* Messages */}
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ml-10 bg-emerald-600 text-white rounded-xl px-3 py-2 max-w-[80%] self-end"
                    : "mr-10 bg-gray-800 text-gray-100 rounded-xl px-3 py-2 max-w-[85%]"
                }
              >
                {m.content}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-gray-700 p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={2}
              placeholder="Ask about your spending, goals, or savings ideas…"
              className="w-full resize-none border border-gray-600 bg-[#2a2a30] rounded-lg p-2 outline-none focus:ring focus:ring-emerald-500 text-gray-100 placeholder-gray-500"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={send}
                disabled={busy || !input.trim()}
                className="bg-emerald-600 disabled:opacity-60 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
