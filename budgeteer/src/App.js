import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import DonutChart from "./components/DonutChart";
import HorizontalBarChart from "./components/HorizontalBarChart";
import SummaryBlock from "./components/SummaryBlock";
import AuthButtons from "./components/AuthButtons";
import useNessieSpending from "./hooks/useNessieSpending"; // Import the hook

function App() {
  const { isAuthenticated, isLoading, loginWithRedirect, user } = useAuth0();
  
  // Fetch spending data using the hook
  const { data: spendingData, loading: spendingLoading, error: spendingError } = useNessieSpending(user);
  
  const aiSummary = "";

  if (isLoading) {
    return <div className="p-10 text-xl">Loading...</div>;
  }

  // If user is not logged in → show login page
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

  // If user is logged in → show dashboard
  return (
    <div className="p-10 bg-gray-50 min-h-screen">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Budgeteer Dashboard 💰</h1>
        <AuthButtons />
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

      <SummaryBlock summary={aiSummary} />
    </div>
  );
}

export default App;