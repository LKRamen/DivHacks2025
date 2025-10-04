import React, { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useProfile } from "./context/ProfileContext";
import OnboardingGoalsSurvey from "./components/OnboardingGoalsSurvey";

import DonutChart from "./components/DonutChart";
import HorizontalBarChart from "./components/HorizontalBarChart";
import SummaryBlock from "./components/SummaryBlock";
import AuthButtons from "./components/AuthButtons";

function DashboardContent({ user }) {
  const aiSummary = "";
  const [editing, setEditing] = useState(false);
  const { setProfile, persistKey } = useProfile();

  if (editing) {
    return (
      <OnboardingGoalsSurvey
        persistKey={persistKey}
        userId={user?.sub}
        userEmail={user?.email}
        onSubmit={(_, builtProfile) => { setProfile(builtProfile); setEditing(false); }}
      />
    );
  }

  return (
    <div className="p-10 bg-gray-50 min-h-screen">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Budgeteer Dashboard 💰</h1>
        <div className="flex items-center gap-3">
          <button
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={() => setEditing(true)}
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

      <SummaryBlock summary={aiSummary} />
    </div>
  );
}

export default function App() {
  const { isAuthenticated, isLoading, loginWithRedirect, user } = useAuth0();
  const { hasSurvey, setProfile, persistKey } = useProfile();

  if (isLoading) return <div className="p-10 text-xl">Loading...</div>;

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <h1 className="text-4xl font-bold mb-6">Welcome to Budgeteer 💸</h1>
        <p className="text-lg mb-8">Track your spending and make smarter decisions.</p>
        <button
          onClick={() => loginWithRedirect()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
        >
          Log in to continue
        </button>
      </div>
    );
  }

  // ➜ Show survey FIRST until at least one selection exists
  if (!hasSurvey) {
    return (
      <OnboardingGoalsSurvey
        persistKey={persistKey}
        userId={user?.sub}
        userEmail={user?.email}
        onSubmit={(_, builtProfile) => { setProfile(builtProfile); }}
      />
    );
  }

  return <DashboardContent user={user} />;
}
