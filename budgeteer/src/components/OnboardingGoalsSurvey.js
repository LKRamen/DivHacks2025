// src/components/OnboardingGoalsSurvey.js
import React, { useMemo, useRef, useState } from "react";

export default function OnboardingGoalsSurvey({
  onSubmit,
  onSkip,
  userId,
  userEmail,
  profileFileName = "budgeteer_profile.json",
  initialAnswers = {}, // Add this prop
}) {
  const QUESTIONS = useMemo(
    () => [
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
    ],
    []
  );

  const [answers, setAnswers] = useState(initialAnswers); // Use initialAnswers instead of {}
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
    meta: { completed: true },
    survey: surveyOverride || answers,
  });

  const handleConfirm = async (e) => {
    e?.preventDefault?.();
    try {
      setSubmitting(true);
      const profile = buildProfile();
      await Promise.resolve();
      onSubmit?.(answers, profile);
      setNotice("Saved your preferences.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    const profile = buildProfile(answers);
    onSkip?.(answers, profile);
    setNotice("You can set preferences later in Edit preferences.");
  };

  const onFileChosen = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const json = JSON.parse(await file.text());
      const incoming =
        json?.schema === "budgeteer.profile" && json?.survey
          ? json.survey
          : json;
      if (!incoming || typeof incoming !== "object")
        throw new Error("Not a valid profile/survey JSON.");
      setAnswers(incoming);
      setNotice("Profile imported. Review and Confirm to save.");
    } catch (err) {
      setNotice(err.message || "Failed to import file.");
    } finally {
      e.target.value = "";
    }
  };

  const downloadJson = (obj, name) => {
    const blob = new Blob([JSON.stringify(obj, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = () => downloadJson(buildProfile(), profileFileName);

  return (
    <div className="min-h-screen w-full bg-[#1f1f24] flex items-center justify-center p-6 text-gray-100">
      <form
        onSubmit={handleConfirm}
        className="w-full max-w-3xl bg-[#2a2a30] shadow-xl rounded-2xl border border-gray-700 p-6 md:p-8"
      >
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Let’s tailor Budgeteer to your goals
          </h1>
          <p className="text-gray-400 mt-2">
            Answer a few quick questions (or skip for now).
          </p>
        </header>

        <div className="space-y-8">
          {QUESTIONS.map((q) => (
            <section key={q.id}>
              <h2 className="text-lg font-semibold text-white">{q.title}</h2>
              <p className="text-sm text-gray-400 mb-4">{q.subtitle}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {q.options.map((opt) => {
                  const checked = (answers[q.id] || []).includes(opt.id);
                  const inputId = `${q.id}-${opt.id}`;
                  return (
                   <label
  key={opt.id}
  htmlFor={inputId}
  className={`group relative rounded-xl border p-3 cursor-pointer transition shadow-sm hover:shadow-md flex items-start gap-3 ${
    checked
      ? "border-emerald-500 bg-emerald-900/30"
      : "border-gray-700 bg-[#1f1f24]"
  } text-gray-100`}
>
                    {/* Hidden native checkbox */}
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(q.id, opt.id)}
                      className="sr-only"
                    />

                    {/* Custom box */}
                    <div
                      className={`mt-1 flex h-4 w-4 items-center justify-center rounded border transition ${
                        checked
                          ? "bg-emerald-600 border-emerald-500"
                          : "bg-[#2a2a30] border-gray-600"
                      }`}
                    >
                      {checked && (
                        <svg
                          className="h-3 w-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    {/* Label text */}
                    <span className="text-sm md:text-[15px]">{opt.label}</span>
                  </label>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {notice && (
          <div className="mt-6 text-sm text-emerald-400 bg-emerald-900/30 border border-emerald-600 rounded-lg p-3">
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
              className="px-4 py-2 rounded-lg border border-gray-600 text-gray-200 hover:bg-gray-800"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload profile (.json)
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-gray-600 text-gray-200 hover:bg-gray-800"
              onClick={handleExport}
            >
              Download profile
            </button>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-gray-600 text-gray-200 hover:bg-gray-800"
              onClick={handleSkip}
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Confirm"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
