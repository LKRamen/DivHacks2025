// src/App.js
import React, { useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useProfile } from "./context/ProfileContext";
import OnboardingGoalsSurvey from "./components/OnboardingGoalsSurvey";

import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

import DonutChart from "./components/DonutChart";
import HorizontalBarChart from "./components/HorizontalBarChart";
import SummaryBlock from "./components/SummaryBlock";
import AuthButtons from "./components/AuthButtons";
import TransactionStatement from "./components/TransactionStatement";
import transactionsData from "./data/transactions.json";
import BudgetingTips from "./components/BudgetingTips";

// ---------- Dashboard UI ----------
function DashboardContent({ user, onEdit }) {
  const aiSummary = "";

  return (
    <div className="p-10 bg-[#1f1f24] min-h-screen text-white">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Budgeteer Dashboard 💰</h1>
        <div className="flex items-center gap-3">
          <button
            className="px-4 py-2 rounded-lg border border-gray-500 text-gray-100 hover:bg-white/10"
            onClick={onEdit}
          >
            Edit preferences
          </button>
          <AuthButtons />
        </div>
      </header>

      <h2 className="text-2xl mb-8">Welcome, {user?.name || "User"}!</h2>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <DonutChart />
        <HorizontalBarChart />
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8 items-stretch">
        <div className="flex flex-col gap-8 h-full">
          <SummaryBlock summary={aiSummary} />
          <BudgetingTips tips={["Cut dining expenses by 10%", "Increase savings to 25%"]} />
        </div>
        <TransactionStatement transactions={transactionsData.results} />
      </div>
    </div>
  );
}

// ---------- App ----------
export default function App() {
  const { isAuthenticated, isLoading, loginWithRedirect, user } = useAuth0();
  const { profile, hasSurvey, setProfile } = useProfile();  // <-- need profile for .meta.completed
  const [editing, setEditing] = useState(false);

  // particles init
  const particlesInit = useCallback(async (engine) => {
    await loadFull(engine);
  }, []);

  // --- Backend uploader for Confirm ---
  const uploadProfile = async (p) => {
    try {
      const res = await fetch("/api/profile/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });

      if (res.ok) return { uploaded: true };

      const errorText = await res.text();
      const message = errorText || `HTTP ${res.status}`;
      const looksLikeProxyFailure =
        res.status >= 500 && /proxy error|ECONNREFUSED/i.test(message);

      if (looksLikeProxyFailure) {
        console.warn("Skipping remote profile save; backend unavailable:", message);
        return { uploaded: false, reason: message };
      }

      throw new Error(`HTTP ${res.status}: ${message}`);
    } catch (err) {
      if (err && typeof err.message === "string" && /ECONNREFUSED|Failed to fetch/i.test(err.message)) {
        console.warn("Skipping remote profile save; backend unreachable:", err.message);
        return { uploaded: false, reason: err.message };
      }
      throw err;
    }
  };

  if (isLoading) return <div className="p-10 text-xl">Loading...</div>;

  // Not logged in → login screen with particles bg
  if (!isAuthenticated) {
    return (
      <div className="relative h-screen w-screen flex items-center justify-center">
        <Particles
          id="tsparticles"
          init={particlesInit}
          className="absolute inset-0"
          options={{
            background: { color: "#1f1f24" },
            particles: {
              number: { value: 10, density: { enable: true, area: 200 } },
              color: { value: ["#16a34a", "#22c55e", "#facc15"] },
              move: { enable: true, speed: 0.5, random: false },
              opacity: { value: { min: 0.6, max: 0.8 } },
              size: { value: { min: 10, max: 16 } },
              links: { enable: true, color: "#22c55e", distance: 300, opacity: 0.3, width: 2 },
              shape: {
                type: "char",
                character: { value: ["$", "€", "¥", "£"], font: "Arial", style: "", weight: "400" },
              },
            },
            detectRetina: true,
          }}
        />

        <div className="relative z-10 text-center text-white">
          <h1 className="text-4xl font-bold mb-6 drop-shadow-xl">Welcome to Budgeteer 💸</h1>
          <button
            onClick={() => loginWithRedirect()}
            style={{ backgroundColor: "#107c38" }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-md"
          >
            Log in to continue
          </button>
        </div>
      </div>
    );
  }

  // --- SURVEY GATE ---
  // Show survey the first time (no selections) OR whenever editing is toggled.
  // Skip should work because profile.meta.completed will be true even with empty answers.
  if (editing || (!hasSurvey && !profile?.meta?.completed)) {
  return (
    <OnboardingGoalsSurvey
      userId={user?.sub}
      userEmail={user?.email}
      onSkip={(_, builtProfile) => {
        // no upload on skip
        setProfile(builtProfile);
        setEditing(false);
      }}
      onSubmit={async (_, builtProfile) => {
        try {
          await uploadProfile(builtProfile); // ← uploads to backend when available
          setProfile(builtProfile);
          setEditing(false);
        } catch (err) {
          console.error(err);
          alert("Failed to save preferences: " + err.message);
        }
      }}
    />
  );
}

  // Authenticated + survey complete → dashboard
  return <DashboardContent user={user} onEdit={() => setEditing(true)} />;
}
