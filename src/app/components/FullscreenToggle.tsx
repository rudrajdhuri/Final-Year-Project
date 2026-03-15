"use client";

import { useState, useEffect } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

export default function FullscreenToggle() {
  const [visible,      setVisible]      = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile,     setIsMobile]     = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);

    const handleMouseMove = (e: MouseEvent) => {
      // Show when mouse is near the top-right header area
      if (e.clientY < 60) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggle = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen toggle failed:", err);
    }
  };

  if (isMobile) return null;

  return (
    <button
      onClick={toggle}
      title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      className={`p-1.5 rounded-md transition-all duration-200
                 text-gray-600 dark:text-gray-400
                 hover:bg-gray-100 dark:hover:bg-gray-800
                 hover:text-gray-900 dark:hover:text-white
                 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
    >
      {isFullscreen
        ? <Minimize2 className="h-5 w-5" />
        : <Maximize2 className="h-5 w-5" />
      }
    </button>
  );
}