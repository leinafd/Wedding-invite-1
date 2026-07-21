import React, { useState, useEffect } from "react";
import { RSVP, RSVPStats } from "../types";
import { Trash2, Download, Copy, Check, Users, HelpCircle, XCircle, ChevronLeft, Lock, Upload, Camera, Image as ImageIcon, Sparkles } from "lucide-react";

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

  // Photo upload and custom URL states
  const [photo1Url, setPhoto1Url] = useState("");
  const [photo2Url, setPhoto2Url] = useState("");
  const [uploading1, setUploading1] = useState(false);
  const [uploading2, setUploading2] = useState(false);
  const [uploadSuccess1, setUploadSuccess1] = useState(false);
  const [uploadSuccess2, setUploadSuccess2] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSettingsSuccess, setSaveSettingsSuccess] = useState(false);

  // Fetch current spotlight image settings
  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setPhoto1Url(data.photo1Url || "");
        setPhoto2Url(data.photo2Url || "");
      }
    } catch (err) {
      console.error("Error fetching spotlight settings:", err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setUploadError("");
    setSaveSettingsSuccess(false);

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": passcode,
        },
        body: JSON.stringify({
          photo1Url,
          photo2Url,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save settings.");
      }

      setSaveSettingsSuccess(true);
      setTimeout(() => setSaveSettingsSuccess(false), 4000);
    } catch (err: any) {
      console.error("Save settings error:", err);
      setUploadError(err.message || "Failed to save photo URLs.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handlePhotoUpload = async (photoIndex: 1 | 2, file: File) => {
    const setUploading = photoIndex === 1 ? setUploading1 : setUploading2;
    const setSuccess = photoIndex === 1 ? setUploadSuccess1 : setUploadSuccess2;
    
    setUploading(true);
    setUploadError("");
    setSuccess(false);

    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select an image file (JPG, PNG, etc.).");
      }

      // Convert to Base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read file."));
        reader.readAsDataURL(file);
      });

      const base64Data = await base64Promise;

      // Upload to server
      const response = await fetch("/api/upload-photo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": passcode,
        },
        body: JSON.stringify({
          photoIndex,
          base64Data,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload photo.");
      }

      setSuccess(true);
      // Sync local text states
      if (photoIndex === 1) {
        setPhoto1Url(data.url);
      } else {
        setPhoto2Url(data.url);
      }
      // Automatically reset success state after 4 seconds
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadError(err.message || "Something went wrong uploading your photo.");
    } finally {
      setUploading(false);
    }
  };

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

        {/* Featured Couple Photos Upload Section */}
        <div className="bg-white border border-[#e5e0d8] rounded-2xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 border-b border-[#f4f1ea] pb-4">
            <div>
              <h2 className="font-serif text-lg text-[#1a2e1a] font-normal flex items-center gap-2">
                <span className="text-[#d4af37]">✨</span> Spotlight Photo Center
              </h2>
              <p className="font-sans text-xs text-gray-500 mt-1">
                Customize the beautiful photos featured in the romantic Polaroid slideshow on your home page.
              </p>
            </div>
            <span className="self-start md:self-auto font-sans text-[10px] tracking-wider text-[#d4af37] bg-[#d4af37]/5 px-3 py-1 rounded-full uppercase font-medium">
              Live Website Feature
            </span>
          </div>

          {uploadError && (
            <div className="bg-red-50 text-red-600 border border-red-100 rounded-xl px-4 py-3 text-xs font-sans mb-4">
              {uploadError}
            </div>
          )}

          {saveSettingsSuccess && (
            <div className="bg-green-50 text-green-700 border border-green-100 rounded-xl px-4 py-3 text-xs font-sans mb-4 flex items-center gap-2 font-medium">
              <span className="text-base">🎉</span> Spotlight photo URLs updated and saved successfully!
            </div>
          )}

          {/* Quick Explainer for Stateless Hosting / Render */}
          <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-4 mb-6 text-amber-900 font-sans text-xs leading-relaxed">
            <h4 className="font-semibold text-amber-950 flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" /> Important: Making pictures visible to everyone (Render & GitHub)
            </h4>
            <p className="mb-2">
              If your website is hosted on Render or GitHub, uploaded files might disappear when the server restarts or won't be pushed to your repository automatically.
            </p>
            <p className="font-medium">
              <strong>Recommendation:</strong> Upload your photos to a free hosting service (like <a href="https://postimages.org" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-amber-700">postimages.org</a>, Imgur, or push them to your GitHub <code className="bg-amber-100/80 px-1 rounded font-mono">assets/</code> folder), then paste the <strong>Direct Link</strong> (ending in <code className="bg-amber-100/80 px-1 rounded font-mono">.jpg</code> or <code className="bg-amber-100/80 px-1 rounded font-mono">.png</code>) below and click <strong>Save Spotlight URLs</strong>.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Photo 1 Section */}
              <div className="border border-[#e5e0d8] rounded-xl p-5 bg-[#faf8f5] flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-serif text-sm text-[#1a2e1a] font-semibold flex items-center gap-1.5 mb-1">
                    <span className="text-[#d4af37]">1.</span> Spotlight Photo 1
                  </h3>
                  <p className="font-sans text-[11px] text-gray-500 mb-4 leading-relaxed">
                    Nichelle & Eniola's warm evening lounge portrait.
                  </p>

                  {/* Option 1: File upload button */}
                  <div className="border border-dashed border-[#e5e0d8] hover:border-[#d4af37]/50 rounded-lg p-4 bg-white flex flex-col items-center justify-center text-center relative transition-all group min-h-[110px] mb-4">
                    <input
                      type="file"
                      id="photo-upload-1"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload(1, file);
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="photo-upload-1"
                      className="cursor-pointer flex flex-col items-center justify-center space-y-2 w-full h-full"
                    >
                      {uploading1 ? (
                        <div className="flex flex-col items-center space-y-1">
                          <div className="w-5 h-5 rounded-full border-2 border-[#d4af37] border-t-transparent animate-spin" />
                          <p className="font-sans text-[10px] text-[#d4af37] font-semibold uppercase tracking-wider">Uploading...</p>
                        </div>
                      ) : uploadSuccess1 ? (
                        <div className="flex flex-col items-center space-y-1">
                          <Check className="w-5 h-5 text-green-600 animate-bounce" />
                          <p className="font-sans text-[10px] text-green-700 font-semibold uppercase tracking-wider">Uploaded successfully!</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-[#8ea495] group-hover:text-[#d4af37] transition-colors" />
                          <span className="font-sans text-[10px] tracking-wider text-gray-600 group-hover:text-[#d4af37] transition-all font-medium uppercase">
                            Upload File Directly
                          </span>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Option 2: Paste link */}
                  <div className="space-y-1.5">
                    <label className="font-sans text-[10px] tracking-wider uppercase font-semibold text-gray-500 block">
                      Or Paste Image URL:
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/couple_photo1.jpg"
                      value={photo1Url}
                      onChange={(e) => setPhoto1Url(e.target.value)}
                      className="w-full font-sans text-xs bg-white border border-[#e5e0d8] rounded-lg px-3 py-2 text-[#1a2e1a] focus:outline-hidden focus:border-[#d4af37] transition-colors shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Photo 2 Section */}
              <div className="border border-[#e5e0d8] rounded-xl p-5 bg-[#faf8f5] flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-serif text-sm text-[#1a2e1a] font-semibold flex items-center gap-1.5 mb-1">
                    <span className="text-[#d4af37]">2.</span> Spotlight Photo 2
                  </h3>
                  <p className="font-sans text-[11px] text-gray-500 mb-4 leading-relaxed">
                    An intimate close-up looking affectionately at each other.
                  </p>

                  {/* Option 1: File upload button */}
                  <div className="border border-dashed border-[#e5e0d8] hover:border-[#d4af37]/50 rounded-lg p-4 bg-white flex flex-col items-center justify-center text-center relative transition-all group min-h-[110px] mb-4">
                    <input
                      type="file"
                      id="photo-upload-2"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload(2, file);
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="photo-upload-2"
                      className="cursor-pointer flex flex-col items-center justify-center space-y-2 w-full h-full"
                    >
                      {uploading2 ? (
                        <div className="flex flex-col items-center space-y-1">
                          <div className="w-5 h-5 rounded-full border-2 border-[#d4af37] border-t-transparent animate-spin" />
                          <p className="font-sans text-[10px] text-[#d4af37] font-semibold uppercase tracking-wider">Uploading...</p>
                        </div>
                      ) : uploadSuccess2 ? (
                        <div className="flex flex-col items-center space-y-1">
                          <Check className="w-5 h-5 text-green-600 animate-bounce" />
                          <p className="font-sans text-[10px] text-green-700 font-semibold uppercase tracking-wider">Uploaded successfully!</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-[#8ea495] group-hover:text-[#d4af37] transition-colors" />
                          <span className="font-sans text-[10px] tracking-wider text-gray-600 group-hover:text-[#d4af37] transition-all font-medium uppercase">
                            Upload File Directly
                          </span>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Option 2: Paste link */}
                  <div className="space-y-1.5">
                    <label className="font-sans text-[10px] tracking-wider uppercase font-semibold text-gray-500 block">
                      Or Paste Image URL:
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/couple_photo2.jpg"
                      value={photo2Url}
                      onChange={(e) => setPhoto2Url(e.target.value)}
                      className="w-full font-sans text-xs bg-white border border-[#e5e0d8] rounded-lg px-3 py-2 text-[#1a2e1a] focus:outline-hidden focus:border-[#d4af37] transition-colors shadow-2xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#f4f1ea]">
              <button
                type="submit"
                disabled={savingSettings}
                className="font-sans text-xs tracking-wider uppercase font-semibold px-6 py-2.5 rounded-full bg-[#1a2e1a] hover:bg-[#2b442b] disabled:bg-[#1a2e1a]/40 text-white transition-all cursor-pointer shadow-sm hover:shadow-md flex items-center gap-2"
              >
                {savingSettings ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving URLs...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Save Spotlight URLs
                  </>
                )}
              </button>
            </div>
          </form>
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
