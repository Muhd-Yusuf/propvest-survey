"use client";

import { useState, useEffect, useCallback } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ──────────────────────────────────────────────────────────
   TYPES
   ────────────────────────────────────────────────────────── */
interface Response {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  ageRange: string;
  incomeRange: string;
  investedBefore: string;
  howInvested?: string;
  wouldInvest: string;
  propertyTypeInterest: string[];
  startingAmount: string;
  whatsStoppingYou: string[];
  preferredPayment: string;
  heardAboutUs: string;
  submittedAt: string;
}

/* ──────────────────────────────────────────────────────────
   LABEL MAPS
   ────────────────────────────────────────────────────────── */
const LABEL: Record<string, string> = {
  "18-24": "18–24",
  "25-34": "25–34",
  "35-44": "35–44",
  "45-54": "45–54",
  "55+": "55+",
  "under-100k": "Under ₦100K",
  "100k-300k": "₦100K–300K",
  "300k-500k": "₦300K–500K",
  "500k-1m": "₦500K–1M",
  "above-1m": "Above ₦1M",
  "50k-100k": "₦50K–100K",
  "bank-transfer": "Bank Transfer",
  "card": "Debit Card",
  "ussd": "USSD",
  "any": "Any",
  "definitely": "Definitely",
  "probably": "Most likely",
  "maybe": "Maybe",
  "not-sure": "Need to understand more",
  "yes": "Yes",
  "no": "No",
  "direct-purchase": "Bought property",
  "cooperative": "Cooperative",
  "reit": "REIT / Fund",
  "crowdfunding": "Crowdfunding",
  "other": "Other",
  "rental": "Rental",
  "build-sell": "Build & Sell",
  "land": "Land",
  "social-media": "Social Media",
  "friend": "Friend / Family",
  "whatsapp": "WhatsApp",
  "search": "Google",
  "no-capital": "Money no reach",
  "no-trust": "Don't trust platforms",
  "no-knowledge": "Don't know how to start",
  "no-access": "No reliable developer",
  "nothing": "Ready — just need the platform",
};

function label(val: string | undefined): string {
  if (!val) return "—";
  return LABEL[val] || val;
}

/* ──────────────────────────────────────────────────────────
   HELPERS
   ────────────────────────────────────────────────────────── */
function topValue(responses: Response[], key: keyof Response): string {
  const counts: Record<string, number> = {};
  for (const r of responses) {
    const v = r[key];
    if (typeof v === "string" && v) {
      counts[v] = (counts[v] || 0) + 1;
    }
  }
  let top = "";
  let max = 0;
  for (const [k, c] of Object.entries(counts)) {
    if (c > max) { top = k; max = c; }
  }
  return top ? `${label(top)} (${max})` : "—";
}

function pct(count: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((count / total) * 100)}%`;
}

function breakdown(responses: Response[], key: keyof Response): { label: string; count: number; pct: string }[] {
  const counts: Record<string, number> = {};
  for (const r of responses) {
    const v = r[key];
    if (typeof v === "string" && v) {
      counts[v] = (counts[v] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, c]) => ({ label: label(k), count: c, pct: pct(c, responses.length) }));
}

function breakdownArray(responses: Response[], key: keyof Response): { label: string; count: number; pct: string }[] {
  const counts: Record<string, number> = {};
  for (const r of responses) {
    const v = r[key];
    if (Array.isArray(v)) {
      for (const item of v) {
        if (item) counts[item] = (counts[item] || 0) + 1;
      }
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, c]) => ({ label: label(k), count: c, pct: pct(c, responses.length) }));
}

/* ──────────────────────────────────────────────────────────
   COMPONENTS
   ────────────────────────────────────────────────────────── */
function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs text-white/40 mb-1">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function Bar({ label: l, count, pct: p, color }: { label: string; count: number; pct: string; color: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-32 text-white/60 shrink-0 truncate">{l}</span>
      <div className="flex-1 h-6 rounded bg-white/[0.05] overflow-hidden">
        <div className="h-full rounded" style={{ width: p, background: color }} />
      </div>
      <span className="text-white/40 w-16 text-right shrink-0">{count} ({p})</span>
    </div>
  );
}

function BreakdownCard({ title, data, color = "#00D4AA" }: { title: string; data: { label: string; count: number; pct: string }[]; color?: string }) {
  if (data.length === 0) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
      <p className="text-sm font-semibold text-white/70">{title}</p>
      {data.map((d) => (
        <Bar key={d.label} label={d.label} count={d.count} pct={d.pct} color={color} />
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   MAIN
   ────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [responses, setResponses] = useState<Response[]>([]);
  const [view, setView] = useState<"overview" | "table">("overview");

  useEffect(() => {
    const saved = sessionStorage.getItem("dashboard_key");
    if (saved) {
      setKey(saved);
      setAuthed(true);
    }
  }, []);

  const fetchData = useCallback(async (k: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/responses?key=${encodeURIComponent(k)}`);
      if (res.status === 401) {
        setError("Wrong password");
        setAuthed(false);
        sessionStorage.removeItem("dashboard_key");
        return;
      }
      const data = await res.json();
      setResponses(data);
      setAuthed(true);
      sessionStorage.setItem("dashboard_key", k);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed && key && responses.length === 0) {
      fetchData(key);
    }
  }, [authed, key, responses.length, fetchData]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(key);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text("PropVest Survey Responses", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`${responses.length} responses | Exported ${new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}`, 14, 25);

    autoTable(doc, {
      startY: 32,
      head: [["#", "Name", "Email", "Phone", "Age", "Income", "Would Invest?", "What's Stopping", "Starting $", "Source", "Date"]],
      body: responses.map((r, i) => [
        i + 1,
        r.fullName || "",
        r.email || "",
        r.phone || "",
        label(r.ageRange),
        label(r.incomeRange),
        label(r.wouldInvest),
        r.whatsStoppingYou?.length > 0 ? r.whatsStoppingYou.map(label).join(", ") : "",
        label(r.startingAmount),
        label(r.heardAboutUs),
        r.submittedAt ? new Date(r.submittedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "",
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [0, 212, 170], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save("propvest-survey-responses.pdf");
  };

  // ── LOGIN ──
  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D4AA] to-[#00B894] flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">Dashboard</span>
          </div>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Enter dashboard password"
            autoFocus
            className="w-full px-4 py-3 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-[#00D4AA]/50 focus:ring-1 focus:ring-[#00D4AA]/20 transition-all text-sm"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || !key}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00D4AA] to-[#00B894] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Loading..." : "Enter"}
          </button>
        </form>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-white/40">Loading responses...</p>
      </main>
    );
  }

  // ── DASHBOARD ──
  const total = responses.length;
  const interested = responses.filter((r) =>
    ["definitely", "probably", "maybe"].includes(r.wouldInvest)
  ).length;

  return (
    <main className="min-h-screen py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00D4AA] to-[#00B894] flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Survey Dashboard</h1>
              <p className="text-xs text-white/40">{total} responses</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-white/10 overflow-hidden text-sm">
              <button
                onClick={() => setView("overview")}
                className={`px-4 py-2 cursor-pointer transition-colors ${view === "overview" ? "bg-[#00D4AA]/10 text-[#00D4AA]" : "text-white/40 hover:text-white/60"}`}
              >
                Overview
              </button>
              <button
                onClick={() => setView("table")}
                className={`px-4 py-2 cursor-pointer transition-colors ${view === "table" ? "bg-[#00D4AA]/10 text-[#00D4AA]" : "text-white/40 hover:text-white/60"}`}
              >
                Responses
              </button>
            </div>
            <button
              onClick={exportPDF}
              className="px-4 py-2 rounded-lg border border-white/10 text-sm text-white/60 hover:text-white hover:border-white/20 transition-colors cursor-pointer"
            >
              Export PDF
            </button>
          </div>
        </div>

        {total === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/40 text-sm">No responses yet</p>
          </div>
        ) : view === "overview" ? (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Total Responses" value={total} />
              <StatCard title="Interested" value={`${interested} (${pct(interested, total)})`} />
              <StatCard title="Top Age Range" value={topValue(responses, "ageRange")} />
              <StatCard title="Top Starting Amount" value={topValue(responses, "startingAmount")} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BreakdownCard title="Would you invest?" data={breakdown(responses, "wouldInvest")} />
              <BreakdownCard title="What's stopping them?" data={breakdownArray(responses, "whatsStoppingYou")} color="#FF6B6B" />
              <BreakdownCard title="Age range" data={breakdown(responses, "ageRange")} color="#4ECDC4" />
              <BreakdownCard title="Income range" data={breakdown(responses, "incomeRange")} color="#FFD93D" />
              <BreakdownCard title="Starting amount" data={breakdown(responses, "startingAmount")} />
              <BreakdownCard title="Property type interest" data={breakdownArray(responses, "propertyTypeInterest")} color="#6C5CE7" />
              <BreakdownCard title="Invested before?" data={breakdown(responses, "investedBefore")} color="#A8E6CF" />
              <BreakdownCard title="Preferred payment" data={breakdown(responses, "preferredPayment")} color="#74B9FF" />
              <BreakdownCard title="How they heard about us" data={breakdown(responses, "heardAboutUs")} color="#FD79A8" />
            </div>
          </div>
        ) : (
          /* ── TABLE ── */
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    <th className="text-left px-4 py-3 text-white/40 font-medium whitespace-nowrap">#</th>
                    <th className="text-left px-4 py-3 text-white/40 font-medium whitespace-nowrap">Name</th>
                    <th className="text-left px-4 py-3 text-white/40 font-medium whitespace-nowrap">Email</th>
                    <th className="text-left px-4 py-3 text-white/40 font-medium whitespace-nowrap">Phone</th>
                    <th className="text-left px-4 py-3 text-white/40 font-medium whitespace-nowrap">Age</th>
                    <th className="text-left px-4 py-3 text-white/40 font-medium whitespace-nowrap">Income</th>
                    <th className="text-left px-4 py-3 text-white/40 font-medium whitespace-nowrap">Would Invest?</th>
                    <th className="text-left px-4 py-3 text-white/40 font-medium whitespace-nowrap">Stopping Them</th>
                    <th className="text-left px-4 py-3 text-white/40 font-medium whitespace-nowrap">Starting $</th>
                    <th className="text-left px-4 py-3 text-white/40 font-medium whitespace-nowrap">Source</th>
                    <th className="text-left px-4 py-3 text-white/40 font-medium whitespace-nowrap">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((r, i) => (
                    <tr key={r._id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-white/30">{i + 1}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{r.fullName || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-white/60">{r.email || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-white/60">{r.phone || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-white/60">{label(r.ageRange)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-white/60">{label(r.incomeRange)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          r.wouldInvest === "definitely" ? "bg-emerald-500/10 text-emerald-400" :
                          r.wouldInvest === "probably" ? "bg-blue-500/10 text-blue-400" :
                          r.wouldInvest === "maybe" ? "bg-yellow-500/10 text-yellow-400" :
                          "bg-red-500/10 text-red-400"
                        }`}>
                          {label(r.wouldInvest)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-white/60 text-xs max-w-[200px] truncate">
                        {r.whatsStoppingYou?.length > 0 ? r.whatsStoppingYou.map(label).join(", ") : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-white/60">{label(r.startingAmount)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-white/60">{label(r.heardAboutUs)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-white/40 text-xs">
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
