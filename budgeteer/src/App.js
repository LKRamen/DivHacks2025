import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

import DonutChart from "./components/DonutChart";
import HorizontalBarChart from "./components/HorizontalBarChart";
import SummaryBlock from "./components/SummaryBlock";
import AuthButtons from "./components/AuthButtons";
import TransactionStatement from "./components/TransactionStatement";
import transactionsData from "./data/transactions.json"; // assuming you saved your JSON
import BudgetingTips from "./components/BudgetingTips";


function App() {
  const { isAuthenticated, isLoading, loginWithRedirect, user } = useAuth0();
  const aiSummary = "";

  // Particle init
  const particlesInit = async (main) => {
    await loadFull(main);
  };

  if (isLoading) {
    return <div className="p-10 text-xl">Loading...</div>;
  }

  // If user is not logged in → show login page
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
            color: { value: ["#16a34a", "#22c55e", "#facc15"] }, // green + gold
            move: { enable: true, speed: 0.5, random: false },
            opacity: { value: { min: 0.6, max: 0.8 } },
            size: { value: { min: 10, max: 16 } }, // bigger so characters are visible
            links: {
              enable: true,
              color: "#22c55e",
              distance: 300,
              opacity: 0.3,
              width: 2,
            },
            shape: {
              type: "char",
              character: {
                
                value: ["$", "€", "¥", "£"], // 👈 currency characters
                font: "Arial",
                style: "",
                weight: "400",
              },
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

  // If user is logged in → show dashboard
  return (
    <div className="p-10 bg-[#1f1f24] min-h-screen text-white">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Budgeteer Dashboard 💰</h1>
        <AuthButtons />
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

export default App;
