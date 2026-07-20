import { useState } from "react";
import GardenCanvas from "./components/GardenCanvas";
import InvitationContent from "./components/InvitationContent";
import AdminDashboard from "./components/AdminDashboard";
import AudioPlayer from "./components/AudioPlayer";
import Confetti from "./components/Confetti";

type AppScreen = "entrance" | "invitation" | "admin";

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("entrance");
  const [isMuted, setIsMuted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleRSVPSubmitted = () => {
    // Spark a beautiful confetti celebration cascade
    setShowConfetti(true);
    // Auto turn off confetti after 8 seconds
    setTimeout(() => {
      setShowConfetti(false);
    }, 8000);
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  return (
    <main className="w-full min-h-screen bg-[#fdfaf6] selection:bg-[#c3b091]/20">
      {/* Immersive Procedural Synthesizer (Active in all screens when not suspended) */}
      <AudioPlayer isMuted={isMuted} />

      {/* Confetti Explosion (Active on RSVP success) */}
      {showConfetti && <Confetti />}

      {/* Screen Routing */}
      {screen === "entrance" && (
        <GardenCanvas
          onEntered={() => setScreen("invitation")}
          audioRef={{ current: null }} // Managed inside AudioPlayer procedurally
          isMuted={isMuted}
          toggleMute={toggleMute}
        />
      )}

      {screen === "invitation" && (
        <div className="animate-fade-in duration-700">
          <InvitationContent
            onRSVPSubmitted={handleRSVPSubmitted}
            onOpenAdmin={() => setScreen("admin")}
            isMuted={isMuted}
            toggleMute={toggleMute}
          />
        </div>
      )}

      {screen === "admin" && (
        <div className="animate-fade-in">
          <AdminDashboard
            onBackToInvitation={() => setScreen("invitation")}
          />
        </div>
      )}
    </main>
  );
}
