// src/App.js
import React, { useState, useCallback, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useProfile } from "./context/ProfileContext";
import OnboardingGoalsSurvey from "./components/OnboardingGoalsSurvey";

import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

import Chatbot from "./components/Chatbot";
import { useSpendingContext } from "./hooks/useSpendingContext";

import DonutChart from "./components/DonutChart";
import HorizontalBarChart from "./components/HorizontalBarChart";
import SummaryBlock from "./components/SummaryBlock";
import AuthButtons from "./components/AuthButtons";
import useNessieSpending from "./hooks/useNessieSpending"; // Import the hook
import TransactionStatement from "./components/TransactionStatement";
import BudgetingTips from "./components/BudgetingTips";

// ---------------- Dashboard ----------------
function DashboardContent({ user, onEdit, spendingData, spendingLoading, spendingError, profile }) {
  const aiSummary = "";
  
  // Build chatbot context here with profile access
  const categories = spendingData?.categoryTotals 
    ? Object.entries(spendingData.categoryTotals).map(([name, value]) => ({ name, value }))
    : [];
    
  const chatbotContext = useSpendingContext({
    categories,
    balance: spendingData?.totalSpending,
    goal: 900,
    month: "October",
  });

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

      {/* Show loading state while fetching spending data */}
      {spendingLoading && (
        <div className="text-center py-8">
          <p className="text-lg text-gray-600">Loading your spending data...</p>
        </div>
      )}

      {/* Show error if there's an issue */}
      {spendingError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
          <p className="font-bold">Error loading spending data:</p>
          <p>{spendingError}</p>
        </div>
      )}

      {/* Show charts when data is loaded */}
      {!spendingLoading && !spendingError && spendingData && (
        <div className="grid grid-cols-2 gap-8 mb-8">
          <DonutChart data={spendingData} />
          <HorizontalBarChart data={spendingData} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-8 mb-8 items-stretch">
        <div className="flex flex-col gap-8 h-full">
          <SummaryBlock 
            summary={aiSummary} 
            profile={profile} 
            spendingData={spendingData} 
          />
          <BudgetingTips 
            profile={profile} 
            spendingData={spendingData} 
          />
        </div>
        <TransactionStatement transactions={spendingData?.rawPurchases} merchantMap={spendingData?.merchantMap}/>
      </div>

      <Chatbot context={chatbotContext} profile={profile} userName={user?.given_name || user?.name || "there"} />
    </div>
  );
}

// ---------------- App ----------------
export default function App() {
  const { isAuthenticated, isLoading, loginWithRedirect, user } = useAuth0();
  
  // Fetch spending data using the hook
  const { data: spendingData, loading: spendingLoading, error: spendingError } = useNessieSpending(user);
  
  const { profile, hasSurvey, setProfile } = useProfile();
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!user?.sub) return;
    
    console.log("Attempting to fetch profile for:", user.sub);
    
    fetch(`/api/profile/${encodeURIComponent(user.sub)}`)
      .then(res => {
        console.log("Response status:", res.status);
        return res.ok ? res.json() : null;
      })
      .then(data => {
        console.log("Profile data received:", data);
        if (data) {
          console.log("Setting profile from backend");
          setProfile(data);
        } else {
          console.log("No profile found on backend");
        }
      })
      .catch(err => console.error("Fetch error:", err));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.sub]); // setProfile is stable from context, safe to omit
  // Particles init
  const particlesInit = useCallback(async (engine) => {
    await loadFull(engine);
  }, []);

  // Build chatbot context (replace with live values when you have them)
  const categories = [
    { name: "Shopping", value: 63 },
    { name: "Food & Dining", value: 46 },
    { name: "Savings & Investment", value: 25 },
    { name: "Entertainment", value: 20 },
    { name: "Miscellaneous", value: 20 },
    { name: "Bills & Subscriptions", value: 15 },
    { name: "Health & Fitness", value: 10 },
    { name: "Transportation", value: 2.9 },
  ];
  const chatbotContext = useSpendingContext({
    categories,
    balance: spendingData?.totalSpending,  // replace with live balance (e.g., from useNessieSpending)
    goal: 900,      // example monthly goal
    month: "October",
  });

  // Backend uploader for Confirm (uses CRA proxy /api → :3001)
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

  // 1) Not logged in → login page
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

  // 2) Survey gate: show first-time OR when editing
  const needsSurvey = editing || (!hasSurvey && !profile?.meta?.completed);
  if (needsSurvey) {
    return (
      <OnboardingGoalsSurvey
        userId={user?.sub}
        userEmail={user?.email}
        initialAnswers={profile?.survey} // Add this line
        onSkip={(_, builtProfile) => {
          setProfile(builtProfile);
          setEditing(false);
        }}
        onSubmit={async (_, builtProfile) => {
          const profileWithUser = { ...builtProfile, userId: user?.sub };
          await uploadProfile(profileWithUser);
          setProfile(profileWithUser);
          setEditing(false);
        }}
      />
    );
  }
      
  // 3) Authenticated + survey complete → dashboard
return <DashboardContent 
  user={user} 
  onEdit={() => setEditing(true)} 
  chatbotContext={chatbotContext}
  spendingData={spendingData}
  spendingLoading={spendingLoading}
  spendingError={spendingError}
  profile={profile}
/>;}
