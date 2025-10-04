
import React, { useEffect, useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import "./App.css";

/** 
 * CapWise — Fintech Budget Coach (DivHacks Edition)
 * Advanced features:
 * - CSV/JSON import of transactions (offline-friendly; Nessie optional)
 * - Smart auto-categorization + editable keyword rules (UI)
 * - Interactive donut: hover highlights; click slice → drill-down (top merchants + table filter)
 * - Monthly & per-category budgets with live alerts
 * - What‑If Simulator: per-category % reduction to see impact before acting
 * - Suggestions that consider both actual and simulated spend
 * - Export JSON report
 * - LocalStorage persistence
 */

const COLORS = ["#6366f1","#22c55e","#f59e0b","#ef4444","#06b6d4","#a855f7","#94a3b8","#16a34a","#f97316"];

const DEFAULT_CATEGORIES = ["Food","Transport","Shopping","Entertainment","Bills","Health","Other"];

const DEFAULT_RULES = {
  Food: ["ubereats","doordash","grubhub","mcdonald","starbucks","chipotle","papa john","cafe","restaurant","trader joe","whole foods"],
  Transport: ["uber","lyft","mta","metro","transit","shell","exxon","bp","gas"],
  Shopping: ["amazon","etsy","target","walmart","nike","best buy"],
  Entertainment: ["spotify","netflix","hulu","disney","amc","theatre","steam"],
  Bills: ["verizon","t-mobile","at&t","coned","electric","utility","rent"],
  Health: ["pharmacy","walgreens","cvs","rite aid","clinic","dentist"],
};

const SAMPLE_TXNS = [
  { date: "2025-10-01", description: "Starbucks - Latte", amount: -6.25 },
  { date: "2025-10-01", description: "Uber trip", amount: -18.30 },
  { date: "2025-10-02", description: "Amazon marketplace", amount: -42.10 },
  { date: "2025-10-02", description: "Spotify", amount: -10.99 },
  { date: "2025-10-03", description: "Trader Joe's Groceries", amount: -58.40 },
  { date: "2025-10-03", description: "ConEd Electric", amount: -64.00 },
  { date: "2025-10-03", description: "Payroll", amount: 850.00 },
  { date: "2025-10-03", description: "Starbucks - Cold Brew", amount: -5.25 },
  { date: "2025-10-04", description: "Netflix", amount: -15.49 },
  { date: "2025-10-04", description: "Lyft", amount: -14.50 },
];

function dollars(n) {
  const sign = n < 0 ? "-" : "";
  const v = Math.abs(n).toFixed(2);
  return `${sign}$${v}`;
}
function normalize(s){ return (s||"").toLowerCase(); }
function round2(n){ return Math.round(n*100)/100; }

function inferCategory(desc, rules){
  const d = normalize(desc);
  for (const [cat, keys] of Object.entries(rules)){
    for (const k of keys){
      if (d.includes(k)) return cat;
    }
  }
  return "Other";
}

function parseCSV(text){
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map(h=>h.trim().toLowerCase());
  const idxDate = header.indexOf("date");
  const idxDesc = header.indexOf("description");
  const idxAmt  = header.indexOf("amount");
  const idxCat  = header.indexOf("category");
  const rows = [];
  for (let i=1;i<lines.length;i++){
    const cols = lines[i].split(",");
    if (cols.length < 3) continue;
    const r = {
      date: (cols[idxDate]||"").trim(),
      description: (cols[idxDesc]||"").trim(),
      amount: Number((cols[idxAmt]||"0").trim()),
    };
    if (idxCat !== -1) r.category = (cols[idxCat]||"").trim();
    rows.push(r);
  }
  return rows;
}

function groupByCategory(transactions, rules){
  const withCats = transactions.map(t => ({
    ...t,
    category: t.category || inferCategory(t.description, rules),
  }));
  const spendOnly = withCats.filter(t => t.amount < 0);
  const totals = {};
  const byCatMerch = {};
  for (const t of spendOnly){
    const cat = t.category;
    totals[cat] = round2((totals[cat]||0) + Math.abs(t.amount));
    const merch = normalize(t.description).replace(/[^a-z0-9 ]/g,"").split(" ").slice(0,3).join(" ");
    if (!byCatMerch[cat]) byCatMerch[cat] = {};
    byCatMerch[cat][merch] = round2((byCatMerch[cat][merch]||0) + Math.abs(t.amount));
  }
  const totalSpend = Object.values(totals).reduce((a,b)=>a+b,0);
  return { withCats, totals, totalSpend, byCatMerch };
}

function findSubscriptions(transactions){
  const byMerchant = {};
  for (const t of transactions.filter(t=>t.amount<0)){
    const m = normalize(t.description).replace(/[^a-z0-9 ]/g,"").split(" ").slice(0,2).join(" ");
    if (!byMerchant[m]) byMerchant[m] = { count:0, total:0 };
    byMerchant[m].count += 1;
    byMerchant[m].total += Math.abs(t.amount);
  }
  return Object.entries(byMerchant)
    .filter(([,v])=>v.count>=2)
    .map(([merchant,v])=>({ merchant, estMonthly: round2(v.total/v.count) }))
    .sort((a,b)=>b.estMonthly - a.estMonthly)
    .slice(0,5);
}

// LocalStorage helpers
const LS = {
  load(key, fallback){ try{ const v = localStorage.getItem(key); return v? JSON.parse(v) : fallback; }catch{return fallback} },
  save(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch{} }
};

function Suggestions({ totals, totalSpend, budgets, monthlyBudget, simulatedTotals, usingSimulation }){
  const items = [];
  const useTotals = usingSimulation ? simulatedTotals : totals;
  const useSpend = usingSimulation
    ? Object.values(simulatedTotals).reduce((a,b)=>a+b,0)
    : totalSpend;

  for (const [cat, spent] of Object.entries(useTotals)){
    const cap = budgets[cat] ?? 0;
    if (cap > 0 && spent > cap){
      const over = round2(spent - cap);
      const perWeek = round2(over/4.3);
      items.push({
        title: `Over budget in ${cat} by ${dollars(over)}`,
        detail: `Aim to cut about ${dollars(perWeek)}/week for the rest of the month.`
      });
    }
  }

  if (monthlyBudget > 0 && useSpend > monthlyBudget){
    const gap = round2(useSpend - monthlyBudget);
    items.push({
      title: `Monthly target exceeded by ${dollars(gap)}`,
      detail: `Focus reductions on your top categories below, or use the What‑If sliders to preview cuts.`
    });
  }

  if (items.length===0){
    items.push({
      title: "On track — looking good",
      detail: "Consider auto‑sweeping surplus to savings/investing."
    });
  }

  return (
    <ul className="suggestions">
      {items.map((it,i)=>(
        <li key={i}>
          <strong>{it.title}</strong>
          <div className="muted">{it.detail}</div>
        </li>
      ))}
    </ul>
  );
}

function RulesEditor({ categories, rules, setRules, addCategory }){
  const [newCat, setNewCat] = useState("");
  const handleChange = (cat, text) => {
    const arr = text.split(",").map(s=>normalize(s.trim())).filter(Boolean);
    setRules(prev => {
      const next = { ...prev, [cat]: arr };
      LS.save("rules", next);
      return next;
    });
  };
  return (
    <div className="rules">
      <h3>Keyword Rules</h3>
      <p className="muted small">Comma-separated keywords per category for auto-categorization.</p>
      <div className="rules-grid">
        {categories.map(cat => (
          <div className="rule-card" key={cat}>
            <div className="rule-head">
              <strong>{cat}</strong>
            </div>
            <textarea
              value={(rules[cat]||[]).join(", ")}
              onChange={(e)=>handleChange(cat, e.target.value)}
              rows={3}
            />
          </div>
        ))}
      </div>

      <div className="row">
        <input
          placeholder="New category name"
          value={newCat}
          onChange={(e)=>setNewCat(e.target.value)}
        />
        <button onClick={()=>{ if(!newCat.trim()) return; addCategory(newCat.trim()); setNewCat(""); }}>Add Category</button>
      </div>
    </div>
  );
}

function BudgetRow({ cat, value, setValue }){
  return (
    <div className="budget-row">
      <label>{cat}</label>
      <div className="budget-controls">
        <input type="range" min="0" max="2000" step="10" value={value} onChange={(e)=>setValue(Number(e.target.value))} />
        <input type="number" min="0" value={value} onChange={(e)=>setValue(Number(e.target.value))} />
      </div>
    </div>
  );
}

function App(){
  // Core state
  const [transactions, setTransactions] = useState(()=>LS.load("txns", SAMPLE_TXNS));
  const [categories, setCategories] = useState(()=>LS.load("categories", DEFAULT_CATEGORIES));
  const [rules, setRules] = useState(()=>LS.load("rules", DEFAULT_RULES));
  const [monthlyBudget, setMonthlyBudget] = useState(()=>LS.load("monthlyBudget", 800));
  const [categoryBudgets, setCategoryBudgets] = useState(()=>LS.load("categoryBudgets", {
    Food: 220, Transport: 140, Shopping: 160, Entertainment: 90, Bills: 180, Health: 60, Other: 60
  }));
  // What‑If Simulator: percent reductions (0-100) by category
  const [whatIf, setWhatIf] = useState(()=>LS.load("whatIf", {}));
  const [useSimulation, setUseSimulation] = useState(()=>LS.load("useSimulation", false));

  // UX state
  const [activeIndex, setActiveIndex] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(()=>{ LS.save("txns", transactions); },[transactions]);
  useEffect(()=>{ LS.save("categories", categories); },[categories]);
  useEffect(()=>{ LS.save("rules", rules); },[rules]);
  useEffect(()=>{ LS.save("monthlyBudget", monthlyBudget); },[monthlyBudget]);
  useEffect(()=>{ LS.save("categoryBudgets", categoryBudgets); },[categoryBudgets]);
  useEffect(()=>{ LS.save("whatIf", whatIf); },[whatIf]);
  useEffect(()=>{ LS.save("useSimulation", useSimulation); },[useSimulation]);

  const { withCats, totals, totalSpend, byCatMerch } = useMemo(
    ()=>groupByCategory(transactions, rules),
    [transactions, rules]
  );

  // Build simulated totals from What‑If sliders
  const simulatedTotals = useMemo(()=>{
    const obj = {};
    for (const cat of categories){
      const actual = totals[cat] || 0;
      const cutPct = (whatIf[cat]||0) / 100;
      obj[cat] = round2(actual * (1 - cutPct));
    }
    return obj;
  }, [categories, totals, whatIf]);

  const pieData = useMemo(
    ()=> Object.entries(totals).map(([name,value])=>({ name, value })),
    [totals]
  );

  const budgetVsActual = useMemo(()=>{
    const rows = [];
    for (const cat of categories){
      const actual = totals[cat] || 0;
      const simulated = simulatedTotals[cat] ?? actual;
      const target = categoryBudgets[cat] || 0;
      rows.push({
        category: cat,
        Actual: round2(actual),
        Simulated: round2(simulated),
        Target: round2(target)
      });
    }
    return rows;
  },[categories, totals, simulatedTotals, categoryBudgets]);

  const burnRate = useMemo(()=>{
    const base = useSimulation
      ? Object.values(simulatedTotals).reduce((a,b)=>a+b,0)
      : totalSpend;
    return [
      { name: "Spent", value: round2(base) },
      { name: "Budget", value: round2(monthlyBudget) },
    ];
  },[useSimulation, simulatedTotals, totalSpend, monthlyBudget]);

  const subscriptions = useMemo(()=>findSubscriptions(withCats), [withCats]);

  // File import
  function handleFile(file){
    const reader = new FileReader();
    reader.onload = (e)=>{
      const text = e.target.result;
      let rows = [];
      try{
        if (file.name.toLowerCase().endsWith(".json")) rows = JSON.parse(text);
        else rows = parseCSV(text);
      }catch{
        alert("Invalid file. Use CSV with date,description,amount[,category] or JSON array.");
        return;
      }
      const cleaned = rows
        .filter(r=>r.date && r.description && !Number.isNaN(Number(r.amount)))
        .map(r=>({
          date:r.date, description:r.description, amount:Number(r.amount), category:r.category
        }));
      setTransactions(cleaned);
    };
    reader.readAsText(file);
  }

  function exportReport(){
    const report = {
      month: new Date().toISOString().slice(0,7),
      monthlyBudget,
      categoryBudgets,
      totals,
      simulatedTotals,
      usingSimulation: useSimulation,
      totalSpend,
      subscriptions,
      overspent: Object.entries(useSimulation? simulatedTotals : totals)
        .filter(([cat, amt])=> (categoryBudgets[cat]??0)>0 && amt>(categoryBudgets[cat]??0))
        .map(([cat, amt])=>({ category:cat, overBy: round2(amt-(categoryBudgets[cat]??0)) }))
    };
    const blob = new Blob([JSON.stringify(report,null,2)],{type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "capwise-report.json"; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  // Drill-down: top merchants for selected category
  const topMerchants = useMemo(()=>{
    if (!selectedCategory || !byCatMerch[selectedCategory]) return [];
    const entries = Object.entries(byCatMerch[selectedCategory])
      .map(([merchant, amt])=>({ merchant, amt }))
      .sort((a,b)=>b.amt - a.amt)
      .slice(0,5);
    return entries;
  },[selectedCategory, byCatMerch]);

  // Filtered rows for table view
  const filteredRows = useMemo(()=>{
    const q = normalize(query);
    return withCats.filter(r => {
      const matchCat = selectedCategory ? r.category === selectedCategory : true;
      const matchQ = !q ? true : normalize(r.description).includes(q);
      return matchCat && matchQ;
    });
  },[withCats, selectedCategory, query]);

  function addCategory(name){
    if (categories.includes(name)) return;
    const nextCats = [...categories, name];
    const nextRules = { ...rules, [name]: [] };
    const nextBudgets = { ...categoryBudgets, [name]: 0 };
    setCategories(nextCats);
    setRules(nextRules);
    setCategoryBudgets(nextBudgets);
  }

  // Pie interactions
  const onPieEnter = (_, index) => setActiveIndex(index);
  const onPieClick  = (d) => setSelectedCategory(d.name === selectedCategory ? null : d.name);

  return (
    <div className="app">
      <header className="app-header">
        <h1>CapWise — Fintech Budget Coach</h1>
        <p className="tagline">Interactive budgeting with smart categorization, drill‑downs, and What‑If planning. Built for DivHacks × Capital One.</p>
      </header>

      <section className="card">
        <h2>1) Load Transactions</h2>
        <p className="muted">Import CSV (date,description,amount,category?) or JSON. Negatives = spending; positives = income.</p>
        <div className="row">
          <input type="file" accept=".csv,.json" onChange={(e)=>e.target.files?.[0] && handleFile(e.target.files[0])} />
          <button onClick={()=>setTransactions(SAMPLE_TXNS)}>Use sample data</button>
        </div>
      </section>

      <section className="card">
        <h2>2) Set Targets</h2>
        <div className="budget-grid">
          <div className="budget-month">
            <label>Monthly Total Budget</label>
            <div className="budget-controls">
              <input type="range" min="0" max="5000" step="10" value={monthlyBudget} onChange={(e)=>setMonthlyBudget(Number(e.target.value))} />
              <input type="number" min="0" value={monthlyBudget} onChange={(e)=>setMonthlyBudget(Number(e.target.value))} />
            </div>
            <div className={(useSimulation ? Object.values(simulatedTotals).reduce((a,b)=>a+b,0) : totalSpend) > monthlyBudget ? "alert":"ok"}>
              Spent {dollars(useSimulation ? Object.values(simulatedTotals).reduce((a,b)=>a+b,0) : totalSpend)} / {dollars(monthlyBudget)}
            </div>
          </div>

          <div className="budget-cats">
            {categories.map((cat)=>(
              <BudgetRow key={cat} cat={cat} value={categoryBudgets[cat]??0}
                setValue={(v)=>setCategoryBudgets(prev=>({...prev,[cat]:v}))} />
            ))}
          </div>
        </div>
      </section>

      <section className="grid-2">
        <div className="card">
          <h2>Spending Breakdown</h2>
          <div className="muted small">{selectedCategory ? `Filtered by: ${selectedCategory} (click the center or slice again to clear)` : "Click a slice to drill into merchants & filter table"}</div>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={120}
                activeIndex={activeIndex}
                onMouseEnter={onPieEnter}
                onClick={onPieClick}
                label
              >
                {pieData.map((e,i)=>(<Cell key={i} fill={COLORS[i % COLORS.length]} stroke={selectedCategory===e.name ? "#111" : "#fff"} strokeWidth={selectedCategory===e.name?3:1} />))}
              </Pie>
              <Tooltip formatter={(v)=>dollars(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          {selectedCategory && (
            <div className="merchants">
              <h3>Top merchants in {selectedCategory}</h3>
              <ul>
                {topMerchants.map((m,i)=>(
                  <li key={i}><span>{m.merchant}</span><strong>{dollars(m.amt)}</strong></li>
                ))}
              </ul>
              <button className="linklike" onClick={()=>setSelectedCategory(null)}>Clear filter</button>
            </div>
          )}
        </div>

        <div className="card">
          <h2>Budget vs. {useSimulation ? "Simulated" : "Actual"}</h2>
          <div className="row">
            <label className="switch">
              <input type="checkbox" checked={useSimulation} onChange={(e)=>setUseSimulation(e.target.checked)} />
              <span>Use What‑If Simulation</span>
            </label>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={budgetVsActual}>
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <ReferenceLine y={0} />
              {useSimulation ? <Bar dataKey="Simulated" radius={[6,6,0,0]} /> : <Bar dataKey="Actual" radius={[6,6,0,0]} />}
              <Bar dataKey="Target" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid-2">
        <div className="card">
          <h2>What‑If Simulator</h2>
          <p className="muted small">Set a hypothetical % reduction per category. Toggle "Use What‑If Simulation" above to see the impact.</p>
          <div className="whatif-grid">
            {categories.map((cat)=>(
              <div className="whatif-row" key={cat}>
                <div className="wi-cat">{cat}</div>
                <input type="range" min="0" max="100" value={whatIf[cat]||0} onChange={(e)=>setWhatIf(prev=>({...prev,[cat]: Number(e.target.value)}))} />
                <div className="wi-val">{whatIf[cat]||0}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>Actionable Suggestions</h2>
          <Suggestions
            totals={totals}
            totalSpend={totalSpend}
            budgets={categoryBudgets}
            monthlyBudget={monthlyBudget}
            simulatedTotals={simulatedTotals}
            usingSimulation={useSimulation}
          />
          <h3 className="mt">Likely Subscriptions</h3>
          {subscriptions.length ? (
            <ul className="subs">
              {subscriptions.map((s,i)=>(<li key={i}><span>{s.merchant}</span><strong>~{dollars(s.estMonthly)}/mo</strong></li>))}
            </ul>
          ) : <div className="muted">No obvious recurring merchants.</div>}
        </div>
      </section>

      <section className="card">
        <h2>Transactions</h2>
        <div className="row">
          <input className="search" placeholder="Search description..." value={query} onChange={(e)=>setQuery(e.target.value)} />
          <div className="muted small">{filteredRows.length} shown</div>
          <div className="row end" style={{flex:1}}>
            <button onClick={exportReport}>Export JSON Report</button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Description</th><th>Amount</th><th>Category</th></tr>
            </thead>
            <tbody>
              {filteredRows.map((t,i)=>(
                <tr key={i}>
                  <td>{t.date}</td>
                  <td>{t.description}</td>
                  <td className={t.amount<0?"neg":"pos"}>{dollars(t.amount)}</td>
                  <td>{t.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>3) Fine‑Tune Categorization</h2>
        <RulesEditor
          categories={categories}
          rules={rules}
          setRules={setRules}
          addCategory={addCategory}
        />
      </section>

      <footer className="muted small">
        Demo app — no real banking data is stored. Optional Capital One Nessie API can be wired to the importer;
        offline demo is robust for judging.
      </footer>
    </div>
  );
}

export default App;
