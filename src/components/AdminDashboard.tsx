import React, { useState, useEffect } from "react";
import { RSVP, RSVPStats } from "../types";
import { Trash2, Download, Copy, Check, Users, HelpCircle, XCircle, ChevronLeft, Lock } from "lucide-react";

interface AdminDashboardProps {
  onBackToInvitation: () => void;
}

export default function AdminDashboard({ onBackToInvitation }: AdminDashboardProps) {
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Statistics
  const [stats, setStats] = useState<RSVPStats>({
    totalAttending: 0,
    totalDeclined: 0,
    totalUndecided: 0,
    totalGuests: 0,
  });

  const fetchRSVPs = async (code: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/rsvps", {
        headers: {
          "x-admin-passcode": code,
        },
      });

      if (!response.ok) {
        throw new Error("Invalid passcode. Access denied.");
      }

      const data = await response.json();
      setRsvps(data);
      setIsAuthenticated(true);
      setError("");
      
      // Save passcode in sessionStorage so they don't have to re-enter
      sessionStorage.setItem("admin_passcode", code);
    } catch (err: any) {
      setError(err.message || "Failed to fetch RSVPs.");
    } finally {
      setLoading(false);
    }
  };

  // Check session storage on mount
  useEffect(() => {
    const cachedCode = sessionStorage.getItem("admin_passcode");
    if (cachedCode) {
      setPasscode(cachedCode);
      fetchRSVPs(cachedCode);
    }
  }, []);

  // Recalculate stats when RSVPs change
  useEffect(() => {
    let attending = 0;
    let declined = 0;
    let undecided = 0;
    let guestSum = 0;

    rsvps.forEach((r) => {
      if (r.status === "attending") {
        attending++;
        guestSum += r.guestsCount;
      } else if (r.status === "declined") {
        declined++;
      } else {
        undecided++;
      }
    });

    setStats({
      totalAttending: attending,
      totalDeclined: declined,
      totalUndecided: undecided,
      totalGuests: guestSum,
    });
  }, [rsvps]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setError("Please enter a passcode.");
      return;
    }
    fetchRSVPs(passcode.trim());
  };

  const handleDeleteRSVP = async (id: string) => {
    if (!confirm("Are you sure you want to delete this RSVP?")) return;

    try {
      const response = await fetch(`/api/rsvps/${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-passcode": passcode,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete RSVP.");
      }

      // Refresh list
      setRsvps((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err.message || "Error deleting RSVP.");
    }
  };

  const handleExportCSV = () => {
    if (rsvps.length === 0) return;

    const headers = ["Name", "Guests Count", "Attendance Status", "Dietary Restrictions", "Message", "Submitted At"];
    const csvContent = [
      headers.join(","),
      ...rsvps.map((r) =>
        [
          `"${r.name.replace(/"/g, '""')}"`,
          r.guestsCount,
          r.status,
          `"${r.dietary.replace(/"/g, '""')}"`,
          `"${r.message.replace(/"/g, '""')}"`,
          r.submittedAt,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Nichelle_Eniola_Proposal_RSVPs_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_passcode");
    setPasscode("");
    setIsAuthenticated(false);
    setRsvps([]);
  };

  if (!isAuthenticated) {
    return (
      <div id="admin-login-screen" className="min-h-screen bg-[#fcfaf7] flex flex-col items-center justify-center p-6 text-gray-800">
        <button
          onClick={onBackToInvitation}
          className="absolute top-6 left-6 flex items-center gap-1 text-sm font-sans tracking-wide text-[#6c8675] hover:text-[#1a2e1a] transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Invitation
        </button>

        <div className="max-w-md w-full bg-white border border-[#e5e0d8] rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center">
          {/* Padlock Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-full bg-[#f4f1ea] flex items-center justify-center text-[#d4af37]">
              <Lock className="w-5 h-5" />
            </div>
          </div>

          <h1 className="font-serif text-2xl text-[#1a2e1a] tracking-wide mb-2 font-light">
            Host Dashboard
          </h1>
          <p className="font-sans text-xs tracking-wider text-[#8ea495] uppercase mb-8">
            Nichelle &amp; Eniola Proposal
          </p>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="text-left">
              <label className="block text-xs font-sans tracking-widest text-[#6c8675] uppercase mb-2">
                Enter Admin Passcode
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-[#e5e0d8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30 focus:border-[#d4af37] font-mono text-center text-lg tracking-widest bg-[#fcfaf7] transition-all"
              />
            </div>

            {error && <p className="text-red-500 font-sans text-xs mt-1">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#1a2e1a] text-white font-sans text-xs tracking-[0.2em] uppercase rounded-xl hover:bg-[#254225] transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Access RSVPs"}
            </button>
          </form>

          <p className="font-sans text-[11px] text-[#8ea495] mt-6">
            Tip: Passcode is NichelleEniola2026
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="admin-dashboard-panel" className="min-h-screen bg-[#fcfaf7] text-[#1a2e1a] p-6 md:p-12 font-sans">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-[#e5e0d8]">
        <div>
          <button
            onClick={onBackToInvitation}
            className="flex items-center gap-1 text-xs font-sans tracking-widest text-[#6c8675] uppercase hover:text-[#1a2e1a] transition-colors mb-3 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back to Invitation
          </button>
          <h1 className="font-serif text-3xl md:text-4xl text-[#1a2e1a] tracking-wide font-light">
            Nichelle &amp; Eniola
          </h1>
          <p className="font-sans text-xs tracking-[0.25em] text-[#8ea495] uppercase">
            RSVP Administration &amp; Analytics
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#e5e0d8] text-[#1a2e1a] rounded-xl hover:border-[#d4af37] text-xs font-sans tracking-wider uppercase transition-all duration-300 cursor-pointer shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600" /> Copied Link
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#6c8675]" /> Copy Invitation Link
              </>
            )}
          </button>

          <button
            onClick={handleExportCSV}
            disabled={rsvps.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#e5e0d8] text-[#1a2e1a] rounded-xl hover:border-[#d4af37] text-xs font-sans tracking-wider uppercase transition-all duration-300 cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5 text-[#6c8675]" /> Export CSV
          </button>

          <button
            onClick={handleLogout}
            className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100/50 text-xs font-sans tracking-wider uppercase transition-all duration-300 cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Card 1: Attending RSVPs */}
          <div className="bg-white border border-[#e5e0d8] rounded-2xl p-5 md:p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#eef6f0] text-green-700 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] md:text-xs font-sans tracking-widest text-[#8ea495] uppercase">
                Attending (Groups)
              </p>
              <h3 className="font-serif text-xl md:text-2xl font-normal text-[#1a2e1a] mt-0.5">
                {stats.totalAttending}
              </h3>
            </div>
          </div>

          {/* Card 2: Total Guests Attending */}
          <div className="bg-white border border-[#e5e0d8] rounded-2xl p-5 md:p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#fdf5e6] text-[#d4af37] flex items-center justify-center">
              <span className="text-xl">✨</span>
            </div>
            <div>
              <p className="text-[10px] md:text-xs font-sans tracking-widest text-[#8ea495] uppercase">
                Total Guests Attending
              </p>
              <h3 className="font-serif text-xl md:text-2xl font-normal text-[#1a2e1a] mt-0.5">
                {stats.totalGuests}
              </h3>
            </div>
          </div>

          {/* Card 3: Declined RSVPs */}
          <div className="bg-white border border-[#e5e0d8] rounded-2xl p-5 md:p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#fef1f1] text-red-600 flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] md:text-xs font-sans tracking-widest text-[#8ea495] uppercase">
                Declined
              </p>
              <h3 className="font-serif text-xl md:text-2xl font-normal text-[#1a2e1a] mt-0.5">
                {stats.totalDeclined}
              </h3>
            </div>
          </div>

          {/* Card 4: Undecided RSVPs */}
          <div className="bg-white border border-[#e5e0d8] rounded-2xl p-5 md:p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#f4f7f6] text-blue-600 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] md:text-xs font-sans tracking-widest text-[#8ea495] uppercase">
                Maybe / Undecided
              </p>
              <h3 className="font-serif text-xl md:text-2xl font-normal text-[#1a2e1a] mt-0.5">
                {stats.totalUndecided}
              </h3>
            </div>
          </div>
        </div>

        {/* RSVP List Table */}
        <div className="bg-white border border-[#e5e0d8] rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-[#e5e0d8] flex items-center justify-between">
            <h2 className="font-serif text-lg text-[#1a2e1a] font-normal">
              Guest List ({rsvps.length})
            </h2>
            <p className="font-sans text-[10px] tracking-wider text-[#8ea495] uppercase">
              Real-time updates
            </p>
          </div>

          {rsvps.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <p className="font-serif text-lg italic mb-2">No RSVPs received yet.</p>
              <p className="font-sans text-xs">Share your invitation link with guests to begin collecting responses.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fcfaf7] border-b border-[#e5e0d8]">
                    <th className="px-6 py-4 font-sans text-xs tracking-widest text-[#6c8675] uppercase font-medium">Guest Name</th>
                    <th className="px-6 py-4 font-sans text-xs tracking-widest text-[#6c8675] uppercase font-medium">Status</th>
                    <th className="px-6 py-4 font-sans text-xs tracking-widest text-[#6c8675] uppercase font-medium text-center">Guests Count</th>
                    <th className="px-6 py-4 font-sans text-xs tracking-widest text-[#6c8675] uppercase font-medium">Dietary Restrictions</th>
                    <th className="px-6 py-4 font-sans text-xs tracking-widest text-[#6c8675] uppercase font-medium">Congrats Message</th>
                    <th className="px-6 py-4 font-sans text-xs tracking-widest text-[#6c8675] uppercase font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f4f1ea] text-sm">
                  {rsvps.map((rsvp) => (
                    <tr key={rsvp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-sans font-medium text-[#1a2e1a]">
                        {rsvp.name}
                      </td>
                      <td className="px-6 py-4">
                        {rsvp.status === "attending" && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                            Attending
                          </span>
                        )}
                        {rsvp.status === "declined" && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                            Declined
                          </span>
                        )}
                        {rsvp.status === "undecided" && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-100">
                            Maybe
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center font-serif text-base text-gray-700">
                        {rsvp.status === "attending" ? rsvp.guestsCount : "—"}
                      </td>
                      <td className="px-6 py-4 font-sans text-xs text-gray-500 max-w-xs truncate" title={rsvp.dietary}>
                        {rsvp.dietary || <span className="text-gray-300 italic">None</span>}
                      </td>
                      <td className="px-6 py-4 font-serif italic text-xs text-gray-600 max-w-sm truncate" title={rsvp.message}>
                        {rsvp.message || <span className="text-gray-300 font-sans not-italic">No message</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                           onClick={() => handleDeleteRSVP(rsvp.id)}
                           className="p-1.5 rounded-lg text-[#8ea495] hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                           title="Delete RSVP"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
