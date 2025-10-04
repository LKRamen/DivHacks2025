import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import DonutChart from "./components/DonutChart";
import HorizontalBarChart from "./components/HorizontalBarChart";
import SummaryBlock from "./components/SummaryBlock";
import AuthButtons from "./components/AuthButtons";

function App() {
  const { isAuthenticated, isLoading, loginWithRedirect, user } = useAuth0();
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
<<<<<<< HEAD
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
=======
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Budgeteer Dashboard 💰</h1>
        <AuthButtons />
      </header>

      <h2 className="text-2xl mb-8">Welcome, {user?.name || "User"}!</h2>
>>>>>>> 1a76e026a3cf631670f54b8409f700db2aa71d35

      <div className="grid grid-cols-2 gap-8 mb-8">
        <DonutChart />
        <HorizontalBarChart />
      </div>

      <SummaryBlock summary={aiSummary} />
    </div>
  );
}

export default App;