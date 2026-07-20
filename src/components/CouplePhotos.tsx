import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Sparkles, Camera, Image as ImageIcon } from "lucide-react";

export default function CouplePhotos() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [photoError1, setPhotoError1] = useState(false);
  const [photoError2, setPhotoError2] = useState(false);

  // The two couple photos
  const photos = [
    {
      src: "/assets/couple_photo1.jpg",
      alt: "Nichelle & Eniola smiling warmly at a romantic evening venue",
      error: photoError1,
      setError: setPhotoError1,
    },
    {
      src: "/assets/couple_photo2.jpg",
      alt: "An intimate close-up of Nichelle & Eniola looking affectionately at each other",
      error: photoError2,
      setError: setPhotoError2,
    }
  ];

  // Rotate pictures every 5 seconds for a slow, organic slideshow feel
  useEffect(() => {
    // Only auto-rotate if both photos load successfully
    if (photoError1 || photoError2) return;

    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % photos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [photoError1, photoError2]);

  const hasErrors = photoError1 || photoError2;

  return (
    <div className="relative w-full max-w-sm mx-auto p-4">
      <AnimatePresence mode="wait">
        {hasErrors ? (
          /* --- HIGHLY POLISHED ROMANTIC FALLBACK CARD --- */
          <motion.div
            key="fallback-card"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.6 }}
            className="w-full aspect-[3/4] rounded-2xl bg-gradient-to-tr from-[#fbf8f3] via-[#fcfaf7] to-[#f4f1ea] border border-[#e5e0d8] p-6 shadow-xl flex flex-col justify-between text-center relative overflow-hidden"
          >
            {/* Ambient Background Glows */}
            <div className="absolute top-[-20%] left-[-20%] w-64 h-64 rounded-full bg-[#d4af37]/5 blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-64 h-64 rounded-full bg-[#8ea495]/10 blur-3xl pointer-events-none" />

            {/* Top Bar Decors */}
            <div className="flex justify-between items-center z-10 text-[#8ea495] opacity-80">
              <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: "12s" }} />
              <span className="font-sans text-[9px] tracking-[0.25em] uppercase">Love Portrait</span>
              <Heart className="w-3.5 h-3.5 text-[#d4af37] fill-[#d4af37]/20" />
            </div>

            {/* Central Romantic Vector Graphic */}
            <div className="flex flex-col items-center justify-center my-auto z-10 space-y-4">
              <div className="relative">
                {/* Concentric Pulsing Circles */}
                <div className="absolute inset-0 bg-[#d4af37]/10 rounded-full scale-150 animate-ping" style={{ animationDuration: "3s" }} />
                <div className="absolute inset-0 bg-[#8ea495]/15 rounded-full scale-125 animate-pulse" />
                
                <div className="relative w-16 h-16 rounded-full bg-white border border-[#e5e0d8] flex items-center justify-center text-[#d4af37] shadow-sm">
                  <Heart className="w-8 h-8 fill-[#d4af37]/20 animate-pulse" />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="font-serif text-xl font-normal text-[#1a2e1a] tracking-wide">
                  Nichelle &amp; Eniola
                </h4>
                <p className="font-sans text-[10px] tracking-widest text-[#8ea495] uppercase font-medium">
                  Garden Proposal • Aug 1, 2026
                </p>
              </div>
            </div>

            {/* Interactive Host Upload Instructions */}
            <div className="bg-white/80 backdrop-blur-xs border border-[#e5e0d8] rounded-xl p-3 z-10 shadow-xs">
              <div className="flex items-center gap-1.5 justify-center text-[10px] font-sans text-[#1a2e1a] font-semibold tracking-wider uppercase mb-1">
                <Camera className="w-3.5 h-3.5 text-[#d4af37]" /> Host Instructions
              </div>
              <p className="font-sans text-[10px] leading-relaxed text-gray-500">
                To feature your beautiful portrait photos, upload them as{" "}
                <code className="bg-[#f4f1ea] px-1 py-0.5 rounded font-mono text-[9px] text-[#1a2e1a]">
                  couple_photo1.jpg
                </code>{" "}
                and{" "}
                <code className="bg-[#f4f1ea] px-1 py-0.5 rounded font-mono text-[9px] text-[#1a2e1a]">
                  couple_photo2.jpg
                </code>{" "}
                to the <span className="font-semibold text-[#6c8675]">assets/</span> directory of the code editor!
              </p>
            </div>
          </motion.div>
        ) : (
          /* --- CINEMATIC ACTIVE POLAROID SLIDESHOW --- */
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, scale: 0.98, rotate: currentIdx === 0 ? -1 : 1 }}
            animate={{ opacity: 1, scale: 1, rotate: currentIdx === 0 ? -1.5 : 1.5 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.85, ease: "easeInOut" }}
            className="w-full aspect-[3/4] bg-white border border-[#e5e0d8] p-3 pb-12 rounded-lg shadow-xl relative overflow-hidden flex flex-col justify-between"
          >
            {/* Elegant Golden Border Accent */}
            <div className="absolute inset-2 border border-[#d4af37]/10 pointer-events-none rounded-md" />

            {/* Smooth Zooming Ken-Burns Image Frame */}
            <div className="relative w-full h-[84%] overflow-hidden rounded bg-slate-100 border border-[#e5e0d8]/60">
              <motion.img
                initial={{ scale: 1.02 }}
                animate={{ scale: 1.09 }}
                transition={{ duration: 5, ease: "linear" }}
                src={photos[currentIdx].src}
                alt={photos[currentIdx].alt}
                referrerPolicy="no-referrer"
                onError={() => photos[currentIdx].setError(true)}
                className="w-full h-full object-cover"
              />

              {/* Sparkling overlay */}
              <div className="absolute top-2 right-2 bg-white/60 backdrop-blur-xs px-2 py-0.5 rounded-full flex items-center gap-1 text-[8px] font-sans tracking-widest text-[#1a2e1a] uppercase">
                <Sparkles className="w-2.5 h-2.5 text-[#d4af37] animate-pulse" /> Live
              </div>
            </div>

            {/* Handwritten Polaroid Bottom Caption */}
            <div className="text-center pt-2.5 z-10">
              <p className="font-serif italic text-sm text-[#1a2e1a] tracking-wide">
                {currentIdx === 0 ? "Nichelle & Eniola ♥" : "Always & Forever"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Picture Skipping Controls (Only visible if photos loaded successfully) */}
      {!hasErrors && (
        <div className="flex justify-center gap-1.5 mt-4">
          {photos.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIdx(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIdx ? "bg-[#d4af37] w-4" : "bg-gray-300 hover:bg-gray-400"
              }`}
              title={`View photo ${idx + 1}`}
              aria-label={`View photo ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
