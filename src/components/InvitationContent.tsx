import React, { useState, useEffect } from "react";
import { RSVP } from "../types";
import { Calendar, MapPin, Clock, Shirt, Sparkles, Heart, ChevronRight, MessageSquare, Check, Music } from "lucide-react";
import CouplePhotos from "./CouplePhotos";

interface InvitationContentProps {
  onRSVPSubmitted: () => void;
  onOpenAdmin: () => void;
  isMuted: boolean;
  toggleMute: () => void;
}

export default function InvitationContent({ onRSVPSubmitted, onOpenAdmin, isMuted, toggleMute }: InvitationContentProps) {
  // RSVP Form States
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"attending" | "declined" | "undecided">("attending");
  const [guestsCount, setGuestsCount] = useState(1);
  const [dietary, setDietary] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formError, setFormError] = useState("");

  // Countdown States
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isOver: false,
  });

  // Photo Slider state
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "First Meeting",
      desc: "An unexpected encounter that bloomed into a lifetime journey.",
      emoji: "🌿"
    },
    {
      title: "Growing Together",
      desc: "Nurturing dreams, laughter, and an unbreakable foundation.",
      emoji: "✨"
    },
    {
      title: "The Next Chapter",
      desc: "Entering the garden of forever, hand in hand.",
      emoji: "💍"
    }
  ];

  // Calculate Countdown
  useEffect(() => {
    const targetDate = new Date("2026-08-01T18:00:00-04:00").getTime(); // 6:00 PM EDT (Garden opens)

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = targetDate - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true });
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days: d, hours: h, minutes: m, seconds: s, isOver: false });
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, []);

  // Slide rotation timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Please enter your name.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/rsvps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          guestsCount: status === "attending" ? guestsCount : 0,
          status,
          dietary,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit RSVP. Please try again.");
      }

      setIsSuccess(true);
      onRSVPSubmitted(); // Trigger confetti in parent
    } catch (err: any) {
      setFormError(err.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="invitation-scroll-container" className="min-h-screen bg-[#fcfaf7] text-[#1a2e1a] selection:bg-[#d4af37]/20">
      
      {/* Floating Control Bar */}
      <div className="fixed top-6 left-6 right-6 flex justify-between items-center z-30 pointer-events-none">
        <div className="pointer-events-auto bg-white/75 backdrop-blur-md px-4 py-2 rounded-full border border-[#e5e0d8] shadow-sm flex items-center gap-2">
          <span className="font-serif text-sm text-[#1a2e1a] font-semibold tracking-widest">N &amp; E</span>
          <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
          <span className="font-sans text-[9px] tracking-widest text-[#6c8675] uppercase font-medium">August 1, 2026</span>
        </div>

        <div className="pointer-events-auto flex gap-2">
          <button
            onClick={toggleMute}
            className="w-10 h-10 rounded-full bg-white/75 backdrop-blur-md border border-[#e5e0d8] shadow-sm flex items-center justify-center text-[#1a2e1a] hover:bg-[#fcfaf7] transition-all cursor-pointer"
            title={isMuted ? "Unmute Music" : "Mute Music"}
          >
            <Music className={`w-4.5 h-4.5 ${isMuted ? 'opacity-40' : 'text-[#d4af37]'}`} />
          </button>
        </div>
      </div>

      {/* --- Section 1: Hero Banner Header --- */}
      <header id="invitation-hero" className="relative h-[90vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden bg-gradient-to-b from-[#f4eee5] to-[#fcfaf7]">
        {/* Animated Background Flora Shapes */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]">
          <div className="absolute -top-10 -left-10 w-96 h-96 rounded-full bg-emerald-800 blur-3xl animate-pulse" />
          <div className="absolute -bottom-10 -right-10 w-96 h-96 rounded-full bg-[#d4af37] blur-3xl" />
        </div>

        {/* Elegant Gold-rimmed Monogram Circle */}
        <div className="relative mb-8 flex items-center justify-center w-24 h-24 rounded-full border border-[#d4af37]/40 bg-[#fbf8f3] shadow-inner animate-fade-in">
          <span className="font-serif text-3xl font-extralight text-[#1a2e1a] tracking-widest">N&amp;E</span>
          <div className="absolute inset-2 rounded-full border border-dashed border-[#d4af37]/20" />
        </div>

        <p className="font-sans text-[11px] tracking-[0.35em] text-[#8ea495] uppercase mb-4 animate-slide-up">
          The Honor of Your Presence is Requested
        </p>

        <h1 className="font-serif text-4xl md:text-6xl text-[#1a2e1a] font-light leading-relaxed tracking-wide mb-3 animate-slide-up">
          Nichelle <span className="font-sans text-2xl md:text-3xl text-[#d4af37] italic font-light font-serif">&amp;</span> Eniola
        </h1>

        <p className="font-serif text-lg md:text-xl text-[#d4af37] tracking-widest italic mb-8 animate-slide-up">
          Are Celebrating Their Proposal
        </p>

        <div className="w-16 h-[1px] bg-[#d4af37]/30 mb-8" />

        <div className="space-y-1 mb-8">
          <p className="font-sans text-sm tracking-[0.25em] text-[#6c8675] uppercase font-semibold">
            SATURDAY, AUGUST 1ST, 2026
          </p>
          <p className="font-sans text-xs tracking-[0.15em] text-[#8ea495] uppercase">
            Acworth, Georgia
          </p>
        </div>

        {/* Call to Scroll Down Button */}
        <div className="absolute bottom-10 flex flex-col items-center gap-2 text-[#8ea495] animate-bounce">
          <span className="font-sans text-[9px] tracking-[0.25em] uppercase">Explore Details</span>
          <ChevronRight className="w-4 h-4 rotate-90 text-[#d4af37]" />
        </div>
      </header>

      {/* --- Section 2: Countdown Timer --- */}
      <section id="invitation-countdown" className="py-12 bg-white border-y border-[#e5e0d8] px-6">
        <div className="max-w-xl mx-auto text-center">
          <p className="font-sans text-[10px] tracking-[0.25em] text-[#8ea495] uppercase mb-6 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" /> Counting Down to Forever
          </p>

          <div className="grid grid-cols-4 gap-4 md:gap-6">
            <div className="bg-[#fcfaf7] border border-[#e5e0d8] rounded-xl p-3.5 shadow-sm">
              <span className="block font-serif text-3xl md:text-4xl text-[#1a2e1a] font-light">
                {timeLeft.days}
              </span>
              <span className="font-sans text-[9px] tracking-widest text-[#8ea495] uppercase">Days</span>
            </div>
            
            <div className="bg-[#fcfaf7] border border-[#e5e0d8] rounded-xl p-3.5 shadow-sm">
              <span className="block font-serif text-3xl md:text-4xl text-[#1a2e1a] font-light">
                {timeLeft.hours}
              </span>
              <span className="font-sans text-[9px] tracking-widest text-[#8ea495] uppercase">Hours</span>
            </div>

            <div className="bg-[#fcfaf7] border border-[#e5e0d8] rounded-xl p-3.5 shadow-sm">
              <span className="block font-serif text-3xl md:text-4xl text-[#1a2e1a] font-light">
                {timeLeft.minutes}
              </span>
              <span className="font-sans text-[9px] tracking-widest text-[#8ea495] uppercase">Mins</span>
            </div>

            <div className="bg-[#fcfaf7] border border-[#e5e0d8] rounded-xl p-3.5 shadow-sm">
              <span className="block font-serif text-3xl md:text-4xl text-[#1a2e1a] font-light">
                {timeLeft.seconds}
              </span>
              <span className="font-sans text-[9px] tracking-widest text-[#8ea495] uppercase">Secs</span>
            </div>
          </div>
        </div>
      </section>

      {/* --- Section 3: Event Information & Logistics --- */}
      <section id="invitation-details" className="py-20 max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
        
        {/* Detail Cards Column */}
        <div className="md:col-span-7 space-y-8">
          <div className="mb-4">
            <h2 className="font-serif text-3xl text-[#1a2e1a] font-light tracking-wide mb-2">
              The Gathering
            </h2>
            <p className="font-sans text-xs tracking-wider text-[#8ea495] uppercase">
              Important Event Details &amp; Location
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Date Card */}
            <div className="bg-white border border-[#e5e0d8] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[#fcfaf7] border border-[#e5e0d8]/40 flex items-center justify-center text-[#d4af37] shrink-0">
                <Calendar className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="font-sans text-xs tracking-widest text-[#6c8675] uppercase font-semibold mb-1">
                  The Date
                </h4>
                <p className="font-serif text-sm text-[#1a2e1a] font-semibold">
                  Saturday, August 1st, 2026
                </p>
                <p className="font-sans text-xs text-gray-500 mt-1">
                  Proposal Party
                </p>
              </div>
            </div>

            {/* Time Card */}
            <div className="bg-white border border-[#e5e0d8] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[#fcfaf7] border border-[#e5e0d8]/40 flex items-center justify-center text-[#d4af37] shrink-0">
                <Clock className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="font-sans text-xs tracking-widest text-[#6c8675] uppercase font-semibold mb-1">
                  The Time
                </h4>
                <p className="font-serif text-sm text-[#1a2e1a] font-semibold">
                  6:00 PM EST
                </p>
                <p className="font-sans text-xs text-gray-500 mt-1">
                  Garden Opens
                </p>
              </div>
            </div>

            {/* Location Card */}
            <div className="bg-white border border-[#e5e0d8] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex gap-4 sm:col-span-2">
              <div className="w-10 h-10 rounded-full bg-[#fcfaf7] border border-[#e5e0d8]/40 flex items-center justify-center text-[#d4af37] shrink-0">
                <MapPin className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="font-sans text-xs tracking-widest text-[#6c8675] uppercase font-semibold mb-1">
                  The Location
                </h4>
                <p className="font-serif text-sm text-[#1a2e1a] font-semibold">
                  The Private Garden Residence
                </p>
                <p className="font-sans text-xs text-gray-600 mt-0.5">
                  702 Dover springs dr, Acworth, GA 30102
                </p>
              </div>
            </div>

            {/* Dress Code Card */}
            <div className="bg-white border border-[#e5e0d8] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex gap-4 sm:col-span-2">
              <div className="w-10 h-10 rounded-full bg-[#fcfaf7] border border-[#e5e0d8]/40 flex items-center justify-center text-[#d4af37] shrink-0">
                <Shirt className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="font-sans text-xs tracking-widest text-[#6c8675] uppercase font-semibold mb-1">
                  Dress Code
                </h4>
                <p className="font-serif text-sm text-[#1a2e1a] font-semibold">
                  Touch of Pink or Black
                </p>
                <p className="font-sans text-xs text-gray-600 mt-1.5 leading-relaxed">
                  We kindly encourage guests to celebrate with us in style wearing formal attire with a lovely touch of pink or classic black.
                </p>
              </div>
            </div>
          </div>

          {/* Schedule of Events */}
          <div className="bg-[#fcfaf7] border border-[#e5e0d8] rounded-2xl p-8 mt-4">
            <h3 className="font-serif text-xl text-[#1a2e1a] mb-6 flex items-center gap-2">
              🌿 Schedule of Events
            </h3>
            
            <div className="relative border-l border-[#e5e0d8] pl-6 space-y-6">
              {/* Event 1 */}
              <div className="relative">
                <div className="absolute -left-[30px] top-1 w-4 h-4 rounded-full border border-white bg-[#d4af37]" />
                <span className="font-mono text-[10px] text-[#6c8675] tracking-widest uppercase">6:00 PM</span>
                <h4 className="font-serif text-sm font-semibold text-[#1a2e1a]">Garden Opens</h4>
                <p className="font-sans text-xs text-gray-500 mt-0.5">Doors officially open for early guests to arrive and enjoy the quiet garden scenery.</p>
              </div>

              {/* Event 2 */}
              <div className="relative">
                <div className="absolute -left-[30px] top-1 w-4 h-4 rounded-full border border-white bg-[#d4af37]" />
                <span className="font-mono text-[10px] text-[#6c8675] tracking-widest uppercase font-semibold">7:00 PM</span>
                <h4 className="font-serif text-sm font-semibold text-[#1a2e1a]">Guest Arrival &amp; Drinks</h4>
                <p className="font-sans text-xs text-gray-500 mt-0.5">Time arrival for all invited guests. Settle in, grab a glass, and start socializing!</p>
              </div>

              {/* Event 3 */}
              <div className="relative">
                <div className="absolute -left-[30px] top-1 w-4 h-4 rounded-full border border-white bg-[#d4af37]" />
                <span className="font-mono text-[10px] text-[#6c8675] tracking-widest uppercase">Till 7:30 PM</span>
                <h4 className="font-serif text-sm font-semibold text-[#1a2e1a]">Drinks &amp; Networking</h4>
                <p className="font-sans text-xs text-gray-500 mt-0.5">Mingle, share laughs, and network with loved ones while enjoying signature garden drinks.</p>
              </div>

              {/* Event 4 */}
              <div className="relative">
                <div className="absolute -left-[30px] top-1 w-4 h-4 rounded-full border border-white bg-[#d4af37] animate-pulse" />
                <span className="font-mono text-[10px] text-[#d4af37] tracking-widest uppercase font-semibold">8:00 PM</span>
                <h4 className="font-serif text-sm font-semibold text-[#1a2e1a] flex items-center gap-1">
                  The Surprise Proposal <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />
                </h4>
                <p className="font-sans text-xs text-gray-500 mt-0.5">The absolute highlight of the evening! Let's celebrate Nichelle &amp; Eniola's dream moment.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Location Map Preview Column */}
        <div className="md:col-span-5 md:sticky md:top-24 space-y-6">
          <div className="bg-white border border-[#e5e0d8] rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <h3 className="font-serif text-base text-[#1a2e1a] mb-3 px-1">
              Garden Map Preview
            </h3>

            {/* Simulated Clean Visual Vector Map */}
            <div className="relative h-64 w-full bg-[#f4f7f5] rounded-xl overflow-hidden border border-[#e5e0d8] flex flex-col items-center justify-center p-4">
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                {/* Visual lines resembling streets */}
                <div className="absolute top-1/3 left-0 right-0 h-4 bg-gray-300" />
                <div className="absolute left-1/2 top-0 bottom-0 w-4 bg-gray-300" />
                <div className="absolute top-2/3 left-0 right-0 h-4 bg-[#6c8675]/30 transform rotate-12" />
                
                {/* River/Water graphic */}
                <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full bg-blue-100/60 blur-md" />
              </div>

              {/* Landmark markers */}
              <div className="absolute left-1/4 top-1/4 bg-white/90 border border-gray-100 py-1 px-2.5 rounded-lg text-[9px] text-gray-500 font-mono shadow-sm">
                Acworth Park
              </div>

              {/* Location Pin */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-[#1a2e1a] flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.2)] animate-bounce">
                  <MapPin className="w-6 h-6 text-[#d4af37]" />
                </div>
                <div className="w-4 h-1 bg-[#1a2e1a]/30 rounded-full blur-[2px] mt-1" />
              </div>

              {/* Event Marker Bubble */}
              <div className="relative z-10 mt-3 bg-white border border-[#e5e0d8] px-3.5 py-2 rounded-xl text-center shadow-lg max-w-xs">
                <p className="font-serif text-xs font-semibold text-[#1a2e1a]">
                  Nichelle &amp; Eniola Proposal
                </p>
                <p className="font-sans text-[10px] text-gray-500 mt-0.5">
                  702 Dover springs dr
                </p>
              </div>
            </div>

            {/* Direct Google Maps Navigation Button */}
            <a
              href="https://www.google.com/maps/search/?api=1&query=702+Dover+springs+dr,+Acworth,+GA+30102"
              target="_blank"
              rel="noreferrer"
              className="w-full mt-4 py-3 bg-[#1a2e1a] text-white font-sans text-xs tracking-widest uppercase rounded-xl hover:bg-[#254225] transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer text-center"
            >
              Open in Google Maps <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          <div className="bg-[#fcfaf7] border border-[#e5e0d8] rounded-2xl p-6">
            <h4 className="font-serif text-sm font-semibold text-[#1a2e1a] mb-2">
              Garden Notes
            </h4>
            <p className="font-sans text-xs text-gray-600 leading-relaxed">
              Parking is available inside the residence driveway and alongside Dover Springs Drive. Valet assistance will be provided. Please arrive on time at 7:00 PM to settle before the surprise proposal at 8:00 PM!
            </p>
          </div>
        </div>
      </section>

      {/* --- Section 4: Love Story / Couples Spotlight --- */}
      <section id="invitation-story" className="py-24 bg-[#f4f1ea] px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            {/* Left Column: Animated Living Polaroid Photo Frame */}
            <div className="md:col-span-5 flex justify-center">
              <CouplePhotos />
            </div>

            {/* Right Column: Love Story Details & Card Slider */}
            <div className="md:col-span-7 text-center md:text-left space-y-6">
              <div className="space-y-3">
                <Heart className="w-7 h-7 text-[#d4af37] mx-auto md:mx-0 animate-pulse fill-[#d4af37]/20" />
                <h2 className="font-serif text-3xl text-[#1a2e1a] font-light tracking-wide">
                  Our Story inside the Garden
                </h2>
                <p className="font-sans text-xs tracking-[0.2em] text-[#8ea495] uppercase">
                  A Journey of Love &amp; Companionship
                </p>
              </div>

              {/* Interactive Card Slider */}
              <div className="relative max-w-xl mx-auto md:mx-0 bg-white border border-[#e5e0d8] rounded-2xl p-8 shadow-[0_12px_40px_rgba(0,0,0,0.02)] min-h-[16rem] flex flex-col justify-between">
                <div>
                  <div className="text-4xl mb-4">{slides[currentSlide].emoji}</div>
                  <h3 className="font-serif text-xl text-[#1a2e1a] font-semibold mb-3">
                    {slides[currentSlide].title}
                  </h3>
                  <p className="font-serif text-sm italic text-gray-600 leading-relaxed max-w-md">
                    "{slides[currentSlide].desc}"
                  </p>
                </div>

                {/* Slider Dots indicators */}
                <div className="flex justify-center md:justify-start gap-2 mt-8">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        idx === currentSlide ? "bg-[#d4af37] w-4" : "bg-gray-200"
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Section 5: RSVP Submission form --- */}
      <section id="rsvp-section" className="py-24 bg-white border-t border-[#e5e0d8] px-6">
        <div className="max-w-lg mx-auto bg-[#fcfaf7] border border-[#e5e0d8] rounded-2xl p-8 md:p-10 shadow-sm relative">
          
          {/* Floral border decor top */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#d4af37] via-[#8ea495] to-[#d4af37]" />

          <div className="text-center mb-8">
            <h2 className="font-serif text-2xl text-[#1a2e1a] font-light tracking-wide mb-2">
              Will You Celebrate with Us?
            </h2>
            <p className="font-sans text-xs tracking-[0.18em] text-[#8ea495] uppercase">
              Please kindly respond by July 25th, 2026
            </p>
          </div>

          {isSuccess ? (
            <div id="rsvp-success-message" className="text-center py-8 space-y-4 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-green-600 mx-auto mb-4">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl text-[#1a2e1a] font-semibold">
                RSVP Received!
              </h3>
              <p className="font-sans text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
                Thank you so much! Your response has been securely logged. Nichelle and Eniola cannot wait to share this magical day with you.
              </p>
              <button
                onClick={() => setIsSuccess(false)}
                className="mt-6 font-sans text-xs tracking-widest text-[#6c8675] uppercase hover:text-[#1a2e1a] underline transition-colors cursor-pointer"
              >
                Submit another response
              </button>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="block text-[10px] font-sans tracking-widest text-[#6c8675] uppercase mb-2 font-semibold">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Victor Ogboko"
                  className="w-full px-4 py-3 border border-[#e5e0d8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30 focus:border-[#d4af37] bg-white font-sans text-sm transition-all"
                />
              </div>

              {/* Status Radio Buttons */}
              <div>
                <label className="block text-[10px] font-sans tracking-widest text-[#6c8675] uppercase mb-3 font-semibold">
                  Will You Attend?
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setStatus("attending")}
                    className={`py-3.5 px-3 border text-xs font-sans tracking-widest uppercase rounded-xl transition-all duration-300 cursor-pointer ${
                      status === "attending"
                        ? "bg-[#1a2e1a] text-white border-[#1a2e1a] shadow-sm"
                        : "bg-white text-gray-600 border-[#e5e0d8] hover:border-gray-400"
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("declined")}
                    className={`py-3.5 px-3 border text-xs font-sans tracking-widest uppercase rounded-xl transition-all duration-300 cursor-pointer ${
                      status === "declined"
                        ? "bg-red-50 text-red-700 border-red-200 shadow-sm"
                        : "bg-white text-gray-600 border-[#e5e0d8] hover:border-gray-400"
                    }`}
                  >
                    Regretfully No
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("undecided")}
                    className={`py-3.5 px-3 border text-xs font-sans tracking-widest uppercase rounded-xl transition-all duration-300 cursor-pointer ${
                      status === "undecided"
                        ? "bg-gray-100 text-gray-700 border-gray-300 shadow-sm"
                        : "bg-white text-gray-600 border-[#e5e0d8] hover:border-gray-400"
                    }`}
                  >
                    Maybe
                  </button>
                </div>
              </div>

              {/* Guest Count Selector (Only shown if attending) */}
              {status === "attending" && (
                <div className="animate-fade-in">
                  <label className="block text-[10px] font-sans tracking-widest text-[#6c8675] uppercase mb-2 font-semibold">
                    Number of Guests (including yourself)
                  </label>
                  <div className="flex items-center gap-3">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setGuestsCount(num)}
                        className={`w-10 h-10 border rounded-full font-serif text-sm transition-all duration-300 cursor-pointer ${
                          guestsCount === num
                            ? "bg-[#d4af37] text-white border-[#d4af37] shadow-sm"
                            : "bg-white text-gray-600 border-[#e5e0d8] hover:border-gray-400"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dietary Restrictions */}
              <div>
                <label className="block text-[10px] font-sans tracking-widest text-[#6c8675] uppercase mb-2 font-semibold">
                  Dietary Restrictions / Food Allergies
                </label>
                <input
                  type="text"
                  value={dietary}
                  onChange={(e) => setDietary(e.target.value)}
                  placeholder="e.g. Vegetarian, Gluten-free, none"
                  className="w-full px-4 py-3 border border-[#e5e0d8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30 focus:border-[#d4af37] bg-white font-sans text-sm transition-all"
                />
              </div>

              {/* Congrats Message */}
              <div>
                <label className="block text-[10px] font-sans tracking-widest text-[#6c8675] uppercase mb-2 font-semibold flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-[#d4af37]" /> Wish or message for Nichelle &amp; Eniola
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Leave a sweet message or congratulations for the happy couple..."
                  className="w-full px-4 py-3 border border-[#e5e0d8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30 focus:border-[#d4af37] bg-white font-serif italic text-sm transition-all resize-none"
                />
              </div>

              {formError && (
                <p className="text-red-500 font-sans text-xs text-center">{formError}</p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#1a2e1a] text-white font-sans text-xs tracking-[0.25em] uppercase rounded-xl hover:bg-[#254225] transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Sending Response..." : "Send RSVP"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* --- Footer & Admin portal entry --- */}
      <footer id="invitation-footer" className="py-12 bg-[#fcfaf7] border-t border-[#e5e0d8] px-6 text-center text-gray-400">
        <p className="font-serif text-sm text-[#d4af37] italic tracking-wide mb-1">
          Made with love and anticipation
        </p>
        <p className="font-sans text-[9px] tracking-widest uppercase text-gray-400 mb-8">
          Nichelle &amp; Eniola • August 1st, 2026
        </p>

        {/* Private Access Admin entry point */}
        <button
          onClick={onOpenAdmin}
          className="inline-flex items-center gap-1 font-sans text-[10px] tracking-widest uppercase text-[#8ea495] hover:text-[#1a2e1a] transition-all cursor-pointer bg-white px-3.5 py-1.5 rounded-full border border-[#e5e0d8] hover:border-[#d4af37]"
        >
          Host Login Access <ChevronRight className="w-3 h-3" />
        </button>
      </footer>
    </div>
  );
}
