import React, { useMemo, useRef, useState } from "react";

export default function OnboardingGoalsSurvey({
  onSubmit,           // called on Confirm (upload in App)
  onSkip,             // called on Skip (no upload)
  userId,
  userEmail,
  profileFileName = "budgeteer_profile.json",
}) {
  const QUESTIONS = useMemo(() => [
    {
      id: "goals",
      title: "What are your top budgeting goals?",
      subtitle: "Choose all that apply",
      options: [
        { id: "emergency_fund", label: "Build an emergency fund" },
        { id: "debt_paydown", label: "Pay down credit card debt" },
        { id: "stick_budget", label: "Stick to a monthly budget" },
        { id: "cut_spending", label: "Cut discretionary spending" },
        { id: "save_purchase", label: "Save for a big purchase" },
        { id: "track_subs", label: "Track & reduce subscriptions" },
      ],
    },
    {
      id: "focus_categories",
      title: "Which categories should we watch closely?",
      subtitle: "Pick the areas you care most about",
      options: [
        { id: "food_dining", label: "Food & Dining" },
        { id: "groceries", label: "Groceries" },
        { id: "transport", label: "Transport / Rideshare" },
        { id: "shopping", label: "Shopping" },
        { id: "entertainment", label: "Entertainment" },
        { id: "travel", label: "Travel" },
        { id: "utilities", label: "Housing & Utilities" },
      ],
    },
    {
      id: "nudges",
      title: "How should Budgeteer help?",
      subtitle: "We’ll tailor reminders and insights",
      options: [
        { id: "weekly_summary", label: "Weekly spend summaries" },
        { id: "over_budget_alerts", label: "Alerts if a category is over budget" },
        { id: "merchant_insights", label: "Insights by merchant" },
        { id: "bill_reminders", label: "Upcoming bill reminders" },
        { id: "roundup_savings", label: "Round-up to savings suggestions" },
      ],
    },
    {
      id: "time_horizon",
      title: "What time horizon are you planning for?",
      subtitle: "Select one or more",
      options: [
        { id: "this_month", label: "This month" },
        { id: "quarter", label: "Next 3 months" },
        { id: "year", label: "This year" },
      ],
    },
  ], []);

  const [answers, setAnswers] = useState({});
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const toggle = (qId, optId) => {
    setAnswers((prev) => {
      const next = { ...prev };
      const sel = new Set(prev[qId] || []);
      sel.has(optId) ? sel.delete(optId) : sel.add(optId);
      next[qId] = Array.from(sel);
      return next;
    });
  };

  const buildProfile = (surveyOverride) => ({
    schema: "budgeteer.profile",
    version: 1,
    updatedAt: new Date().toISOString(),
    user: { id: userId || null, email: userEmail || null },
    meta: { completed: true }, // mark completed for both Confirm & Skip
    survey: surveyOverride || answers,
  });

  const handleConfirm = async (e) => {
    e?.preventDefault?.();
    try {
      setSubmitting(true);
      const profile = buildProfile();
      await Promise.resolve(); // nothing here; App handles upload in onSubmit
      onSubmit?.(answers, profile); // <-- App will upload + persist
      setNotice("Saved your preferences.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    const profile = buildProfile(answers); // completed=true, possibly empty
    onSkip?.(answers, profile);            // <-- App will persist locally only
    setNotice("You can set preferences later in Edit preferences.");
  };

  // (Optional) import/export helpers kept minimal
  const onFileChosen = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const json = JSON.parse(await file.text());
      const incoming = json?.schema === "budgeteer.profile" && json?.survey ? json.survey : json;
      if (!incoming || typeof incoming !== "object") throw new Error("Not a valid profile/survey JSON.");
      setAnswers(incoming);
      setNotice("Profile imported. Review and Confirm to save.");
    } catch (err) {
      setNotice(err.message || "Failed to import file.");
    } finally {
      e.target.value = "";
    }
  };

  const downloadJson = (obj, name) => {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
  };

  const handleExport = () => downloadJson(buildProfile(), profileFileName);

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-6 text-gray-900">
      <form
        onSubmit={handleConfirm}
        className="w-full max-w-3xl bg-white shadow-xl rounded-2xl border border-gray-100 p-6 md:p-8"
      >
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
            Let’s tailor Budgeteer to your goals
          </h1>
          <p className="text-gray-600 mt-2">Answer a few quick questions (or skip for now).</p>
        </header>

        <div className="space-y-8">
          {QUESTIONS.map((q) => (
            <section key={q.id}>
              <h2 className="text-lg font-semibold text-gray-900">{q.title}</h2>
              <p className="text-sm text-gray-700 mb-4">{q.subtitle}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {q.options.map((opt) => {
                  const checked = (answers[q.id] || []).includes(opt.id);
                  const inputId = `${q.id}-${opt.id}`;
                  return (
                    <label
                      key={opt.id}
                      htmlFor={inputId}
                      className={`group rounded-xl border p-3 cursor-pointer transition shadow-sm hover:shadow-md flex items-start gap-3 ${
                        checked ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white"
                      } text-gray-900`}
                    >
                      <input
                        id={inputId}
                        type="checkbox"
                        className="mt-1 h-4 w-4 accent-blue-600"
                        checked={checked}
                        onChange={() => toggle(q.id, opt.id)}
                      />
                      <span className="text-sm md:text-[15px]">{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {notice && (
          <div className="mt-6 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            {notice}
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={onFileChosen}
            />
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload profile (.json)
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50"
              onClick={handleExport}
            >
              Download profile
            </button>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50"
              onClick={handleSkip}   // ← closes survey, no upload
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Confirm"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
