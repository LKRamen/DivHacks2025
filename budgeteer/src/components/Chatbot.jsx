import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Chatbot widget
 * - Props:
 *   - context: { categories: [{name, value}], month?: string, balance?: number, goal?: number }
 *   - userName?: string
 */
export default function Chatbot({ context = {}, userName = "there" }) {
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

  // Auto scroll to newest
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  const systemPrompt = useMemo(() => {
    // Build a compact snapshot of current data for the bot
    const cats = (context.categories || [])
      .map((c) => `${c.name}:${c.value}`)
      .join(", ");
    const month = context.month || "this month";
    const balance = typeof context.balance === "number" ? context.balance : "unknown";
    const goal = typeof context.goal === "number" ? context.goal : null;

    return [
      "You are a helpful, concise budgeting assistant.",
      "Speak in short, direct sentences. Give concrete suggestions that are practical for students.",
      `Data snapshot: categories=[${cats}] month=${month} balance=${balance}${goal !== null ? ` goal=${goal}` : ""}`,
      "If user asks for ideas: give 3 quick, specific actions with estimated monthly impact.",
      "If the user asks for comparisons, compute category percentages and show top 3 categories.",
      "If there’s not enough data, ask one clarifying question and still give one actionable tip.",
    ].join("\n");
  }, [context]);

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

        if (!res.ok) {
            const msg = data?.error || `Chat error: ${res.status}`;
            throw new Error(msg);
        }

        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    }   catch (err) {
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
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 rounded-full shadow-lg bg-blue-600 text-white px-5 py-3 text-sm font-semibold hover:bg-blue-700"
      >
        {open ? "Close Chat" : "Chat"}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-[360px] h-[520px] bg-white border rounded-2xl shadow-xl flex flex-col">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="font-semibold">Budgeteer Assistant</div>
            <div className="text-xs text-gray-500">{busy ? "thinking…" : "online"}</div>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ml-10 bg-blue-100 text-gray-900 rounded-xl px-3 py-2 max-w-[80%] self-end"
                    : "mr-10 bg-gray-100 text-gray-900 rounded-xl px-3 py-2 max-w-[85%]"
                }
              >
                {m.content}
              </div>
            ))}
          </div>

          <div className="border-t p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={2}
              placeholder="Ask about your spending, goals, or savings ideas…"
              className="w-full resize-none border rounded-lg p-2 outline-none focus:ring focus:ring-blue-200 text-gray-900"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={send}
                disabled={busy || !input.trim()}
                className="bg-blue-600 disabled:opacity-60 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
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
