import React, { useMemo, useState } from "react";

/**
 * OnboardingGoalsSurvey.jsx
 * Short multi-select survey + import/export to a JSON profile file
 * so your chatbot and the rest of the app can use/update the same data.
 *
 * Usage:
 * <OnboardingGoalsSurvey
 *   persistKey="budgeteer:goals-survey:v1" // optional localStorage key
 *   userId={authUser?.sub}
 *   userEmail={authUser?.email}
 *   onSubmit={(answers, profile) => {
 *     // Send to backend / chatbot context
 *     // fetch('/api/onboarding/goals', { method:'POST', body: JSON.stringify(profile) })
 *   }}
 * />
 */
export default function OnboardingGoalsSurvey({ onSubmit, persistKey, userId, userEmail, profileFileName = "budgeteer_profile.json" }) {
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
          { id: "merchant_insights", label: "Insights by merchant (e.g., Starbucks)" },
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

  const [answers, setAnswers] = useState(() => {
    if (!persistKey) return {};
    try {
      const raw = localStorage.getItem(persistKey);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggle = (qId, optId) => {
    setAnswers((prev) => {
      const next = { ...prev };
      const current = new Set(prev[qId] || []);
      if (current.has(optId)) current.delete(optId); else current.add(optId);
      next[qId] = Array.from(current);
      return next;
    });
  };

  const validate = () => {
    const hasGoals = (answers?.goals || []).length > 0;
    if (!hasGoals) {
      setError("Pick at least one budgeting goal to continue.");
      return false;
    }
    setError("");
    return true;
  };

  const buildProfile = (overrides) => ({
    schema: "budgeteer.profile",
    version: 1,
    updatedAt: new Date().toISOString(),
    user: {
      id: userId || null,
      email: userEmail || null,
    },
    survey: { ...answers, ...(overrides?.survey || {}) },
  });

  const persistLocal = (obj) => {
    if (!persistKey) return;
    try {
      localStorage.setItem(persistKey, JSON.stringify(obj.survey || {}));
    } catch (_) {}
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!validate()) return;
    const profile = buildProfile();
    try {
      setSubmitting(true);
      persistLocal(profile);
      await Promise.resolve();
      onSubmit?.(answers, profile);
      setNotice("Saved your preferences.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Import / Export helpers ---
  const fileInputRef = React.useRef(null);

  const triggerUpload = () => fileInputRef.current?.click();

  const validateImported = (json) => {
    // Accept either full profile (with survey) or raw survey object
    if (json && typeof json === "object") {
      if (json.schema === "budgeteer.profile" && json.survey && typeof json.survey === "object") return { type: "profile", survey: json.survey };
      if (json.goals || json.focus_categories || json.nudges || json.time_horizon) return { type: "survey", survey: json };
    }
    return null;
  };

  const mergeSurveys = (a = {}, b = {}) => {
    const keys = new Set(["goals", "focus_categories", "nudges", "time_horizon"]);
    const out = { ...a };
    for (const k of keys) {
      const merged = new Set([...(a[k] || []), ...(b[k] || [])]);
      if (merged.size) out[k] = Array.from(merged);
    }
    return out;
  };

  const onFileChosen = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const parsed = validateImported(json);
      if (!parsed) throw new Error("Not a valid Budgeteer profile/survey JSON.");

      const shouldReplace = window.confirm("Import profile found. OK = Replace current answers. Cancel = Merge with current answers.");
      const incoming = parsed.survey;
      const nextSurvey = shouldReplace ? incoming : mergeSurveys(answers, incoming);

      setAnswers(nextSurvey);
      const profile = buildProfile({ survey: nextSurvey });
      persistLocal(profile);
      onSubmit?.(nextSurvey, profile);
      setNotice(shouldReplace ? "Profile imported (replaced)." : "Profile imported (merged).");
    } catch (err) {
      setError(err.message || "Failed to import file.");
    } finally {
      // reset input to allow re-selecting the same file
      e.target.value = "";
    }
  };

  const downloadJson = (obj, name) => {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    const profile = buildProfile();
    downloadJson(profile, profileFileName);
    setNotice("Profile downloaded.");
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-3xl bg-white shadow-xl rounded-2xl border border-gray-100 p-6 md:p-8"
      >
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Let’s tailor Budgeteer to your goals</h1>
          <p className="text-gray-600 mt-2">Answer a few quick questions to personalize budgets, alerts, and insights.</p>
        </header>

        <div className="space-y-8">
          {QUESTIONS.map((q) => (
            <section key={q.id}>
              <h2 className="text-lg font-semibold">{q.title}</h2>
              <p className="text-sm text-gray-500 mb-4">{q.subtitle}</p>

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
                      }`}
                    >
                      <input
                        id={inputId}
                        type="checkbox"
                        className="mt-1 h-4 w-4 accent-blue-600"
                        checked={checked}
                        onChange={() => toggle(q.id, opt.id)}
                      />
                      <span className="text-sm md:text-[15px] text-gray-800">{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {error && (
          <div className="mt-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </div>
        )}
        {notice && !error && (
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
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={triggerUpload}
            >
              Upload profile (.json)
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={handleExport}
            >
              Download profile
            </button>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={() => {
                setAnswers({});
                if (persistKey) localStorage.removeItem(persistKey);
                setNotice("Cleared current selections.");
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={() => onSubmit?.(answers, buildProfile())}
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Continue"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
