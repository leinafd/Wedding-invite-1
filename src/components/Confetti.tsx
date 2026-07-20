import { useEffect, useRef } from "react";

export default function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const colors = ["#ff6b8b", "#ff9bb0", "#fbc531", "#4cd137", "#00a8ff", "#9c88ff", "#fdfaf6"];
    const confettiCount = 120;
    const confettiList: Array<{
      x: number;
      y: number;
      size: number;
      color: string;
      speedX: number;
      speedY: number;
      rotation: number;
      rotationSpeed: number;
    }> = [];

    for (let i = 0; i < confettiCount; i++) {
      confettiList.push({
        x: Math.random() * width,
        y: Math.random() * -height - 20,
        size: 5 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: Math.random() * 4 - 2,
        speedY: 2 + Math.random() * 4,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 5 - 2.5,
      });
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      let activeCount = 0;
      confettiList.forEach((c) => {
        c.y += c.speedY;
        c.x += c.speedX;
        c.rotation += c.rotationSpeed;

        if (c.y < height + 20) {
          activeCount++;
        }

        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate((c.rotation * Math.PI) / 180);
        ctx.fillStyle = c.color;
        
        // Draw a diamond, circle, or rectangle randomly
        const shape = Math.floor(c.size) % 3;
        if (shape === 0) {
          ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size);
        } else if (shape === 1) {
          ctx.beginPath();
          ctx.arc(0, 0, c.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(0, -c.size / 2);
          ctx.lineTo(c.size / 2, 0);
          ctx.lineTo(0, c.size / 2);
          ctx.lineTo(-c.size / 2, 0);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      });

      if (activeCount > 0) {
        animationId = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50 w-full h-full" />;
}
