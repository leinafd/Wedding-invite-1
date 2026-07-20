import { useEffect, useRef } from "react";

interface AudioPlayerProps {
  isMuted: boolean;
}

export default function AudioPlayer({ isMuted }: AudioPlayerProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterVolumeRef = useRef<GainNode | null>(null);
  const scheduleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // We only initialize the AudioContext when we start playing.
    const startGenerativeMusic = () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        const masterGain = ctx.createGain();
        masterGain.gain.value = isMuted ? 0 : 0.45; // Start volume
        masterGain.connect(ctx.destination);
        masterVolumeRef.current = masterGain;

        // --- Procedural Romantic Chime & Pad Synthesizer ---
        // Scale notes (Frequencies in G Major / E Minor pentatonic)
        // G3, A3, B3, D4, E4, G4, A4, B4, D5, E5
        const scale = [196.00, 220.00, 246.94, 293.66, 329.63, 392.00, 440.00, 493.88, 587.33, 659.25];
        const chords = [
          [196.00, 246.94, 293.66, 392.00], // G Maj (G, B, D, G)
          [220.00, 261.63, 329.63, 440.00], // A Min (A, C, E, A)
          [164.81, 246.94, 329.63, 392.00], // E Min (E, B, E, G)
          [174.61, 220.00, 261.63, 349.23], // F Maj (F, A, C, F)
        ];

        let chordIndex = 0;

        // Function to synthesize a single beautiful wind chime note
        const playChime = (freq: number, time: number, duration: number = 3.5) => {
          if (!ctx || ctx.state === "suspended") return;

          // Main sine wave oscillator for pure chime sound
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, time);

          // Add a subtle frequency modulation (vibrato) for organic warmth
          const vibrato = ctx.createOscillator();
          const vibratoGain = ctx.createGain();
          vibrato.frequency.value = 4.5; // 4.5Hz
          vibratoGain.gain.value = freq * 0.005; // vibrato range

          vibrato.connect(vibratoGain);
          vibratoGain.connect(osc.frequency);
          vibrato.start(time);

          // Custom chime envelope (instant attack, long exponential decay)
          gainNode.gain.setValueAtTime(0, time);
          gainNode.gain.linearRampToValueAtTime(0.08, time + 0.08); // soft spike
          gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

          // Lowpass filter to cut high harshness and make it cozy and warm
          const filter = ctx.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(1400, time);

          // Simple reverberation/delay simulator
          const delay = ctx.createDelay();
          const delayGain = ctx.createGain();
          delay.delayTime.value = 0.45; // 450ms feedback delay
          delayGain.gain.value = 0.35; // delay feed ratio

          osc.connect(gainNode);
          gainNode.connect(filter);
          
          // Router delay loop
          filter.connect(masterGain);
          filter.connect(delay);
          delay.connect(delayGain);
          delayGain.connect(delay);
          delayGain.connect(masterGain);

          osc.start(time);
          osc.stop(time + duration);
          
          // Clean up oscillator sources
          setTimeout(() => {
            try {
              osc.disconnect();
              gainNode.disconnect();
              filter.disconnect();
              delay.disconnect();
              delayGain.disconnect();
              vibrato.disconnect();
              vibratoGain.disconnect();
            } catch (e) {
              // ignore duplicate cleanup
            }
          }, (duration + 1) * 1000);
        };

        // Function to synthesize a warm romantic pad chord
        const playPadChord = (freqs: number[], time: number, duration: number = 7) => {
          if (!ctx || ctx.state === "suspended") return;

          freqs.forEach((freq) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            osc.type = "triangle"; // triangle has warm, brassy/stringy overtones
            osc.frequency.setValueAtTime(freq, time);

            // Chord slow build-up envelope
            gainNode.gain.setValueAtTime(0, time);
            gainNode.gain.linearRampToValueAtTime(0.025, time + 2.5); // long rise
            gainNode.gain.setValueAtTime(0.025, time + duration - 2);
            gainNode.gain.linearRampToValueAtTime(0.0001, time + duration); // slow release

            filter.type = "lowpass";
            filter.frequency.setValueAtTime(600, time);
            filter.frequency.exponentialRampToValueAtTime(300, time + duration); // sweeping filter

            osc.connect(gainNode);
            gainNode.connect(filter);
            filter.connect(masterGain);

            osc.start(time);
            osc.stop(time + duration);

            setTimeout(() => {
              try {
                osc.disconnect();
                gainNode.disconnect();
                filter.disconnect();
              } catch (e) {}
            }, (duration + 1) * 1000);
          });
        };

        // Generative music schedule loop (runs every 4 seconds)
        let nextChimeTime = ctx.currentTime;
        let nextPadTime = ctx.currentTime;

        const scheduleMusic = () => {
          const now = ctx.currentTime;

          // Schedule romantic chord pads every 6.5 seconds
          if (now >= nextPadTime - 1) {
            const currentChord = chords[chordIndex];
            playPadChord(currentChord, nextPadTime, 7.5);
            
            // Advance chords in a beautiful circular ring
            chordIndex = (chordIndex + 1) % chords.length;
            nextPadTime += 6.5;
          }

          // Schedule sparkling wind-chime arpeggios every 2 seconds
          if (now >= nextChimeTime - 0.5) {
            // Pick a random frequency from the G-Major Pentatonic Scale (skewed high)
            const freqIndex = Math.floor(Math.random() * 5) + 5; 
            const freq = scale[freqIndex];
            
            // Random tiny offsets to make it sound hand-played
            const playOffset = Math.random() * 0.4;
            playChime(freq, nextChimeTime + playOffset, 3.0 + Math.random() * 1.5);
            
            nextChimeTime += 1.8 + Math.random() * 1.5;
          }

          scheduleTimerRef.current = window.setTimeout(scheduleMusic, 1000);
        };

        // Start scheduling loop
        scheduleMusic();

      } catch (e) {
        console.error("Web Audio API not supported or blocked in this context:", e);
      }
    };

    // Auto-initialize when page clicks occur anywhere or component mounts (after gesture)
    const handleFirstGesture = () => {
      if (!audioContextRef.current) {
        startGenerativeMusic();
      } else if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }
    };

    window.addEventListener("click", handleFirstGesture);
    window.addEventListener("touchstart", handleFirstGesture);

    // Initial trigger if already clicked
    startGenerativeMusic();

    return () => {
      window.removeEventListener("click", handleFirstGesture);
      window.removeEventListener("touchstart", handleFirstGesture);
      
      if (scheduleTimerRef.current) {
        clearTimeout(scheduleTimerRef.current);
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Sync mute state changes
  useEffect(() => {
    if (masterVolumeRef.current) {
      // Smooth fade transition for volume changes
      const ctx = audioContextRef.current;
      if (ctx) {
        const targetVol = isMuted ? 0 : 0.45;
        masterVolumeRef.current.gain.linearRampToValueAtTime(targetVol, ctx.currentTime + 0.5);
      } else {
        masterVolumeRef.current.gain.value = isMuted ? 0 : 0.45;
      }
    }
  }, [isMuted]);

  return null; // Silent controller component using Web Audio
}
