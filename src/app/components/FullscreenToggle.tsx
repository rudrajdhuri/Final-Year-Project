// "use client";

// import { useState, useEffect } from "react";
// import { Maximize2, Minimize2 } from "lucide-react";

// export default function FullscreenToggle() {
//   const [visible,      setVisible]      = useState(false);
//   const [isFullscreen, setIsFullscreen] = useState(false);
//   const [isMobile,     setIsMobile]     = useState(false);

//   useEffect(() => {
//     setIsMobile(window.innerWidth <= 768);

//     const handleMouseMove = (e: MouseEvent) => {
//       // Show when mouse is near the top-right header area
//       if (e.clientY < 60) {
//         setVisible(true);
//       } else {
//         setVisible(false);
//       }
//     };

//     const handleFullscreenChange = () => {
//       setIsFullscreen(!!document.fullscreenElement);
//     };

//     window.addEventListener("mousemove", handleMouseMove);
//     document.addEventListener("fullscreenchange", handleFullscreenChange);
//     return () => {
//       window.removeEventListener("mousemove", handleMouseMove);
//       document.removeEventListener("fullscreenchange", handleFullscreenChange);
//     };
//   }, []);

//   const toggle = async () => {
//     try {
//       if (!document.fullscreenElement) {
//         await document.documentElement.requestFullscreen();
//       } else {
//         await document.exitFullscreen();
//       }
//     } catch (err) {
//       console.error("Fullscreen toggle failed:", err);
//     }
//   };

//   if (isMobile) return null;

//   return (
//     <button
//       onClick={toggle}
//       title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
//       className={`p-1.5 rounded-md transition-all duration-200
//                  text-gray-600 dark:text-gray-400
//                  hover:bg-gray-100 dark:hover:bg-gray-800
//                  hover:text-gray-900 dark:hover:text-white
//                  ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
//     >
//       {isFullscreen
//         ? <Minimize2 className="h-5 w-5" />
//         : <Maximize2 className="h-5 w-5" />
//       }
//     </button>
//   );
// }








"use client";

import { useState, useEffect } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

export default function FullscreenToggle() {
  const [visible,      setVisible]      = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile,     setIsMobile]     = useState(true);

  useEffect(() => {
    setIsMobile(window.innerWidth < 1024);

    const handleResize = () => setIsMobile(window.innerWidth < 1024);

    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY < 60) setVisible(true);
      else setVisible(false);
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggle = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {}
  };

  // Mobile — always visible, square icon made of 4 corner lines
  if (isMobile) {
    return (
      <button
        onClick={toggle}
        title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        className="p-1.5 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {isFullscreen ? (
          // Exit fullscreen — inward arrows
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="6,2 2,2 2,6" />
            <polyline points="12,2 16,2 16,6" />
            <polyline points="6,16 2,16 2,12" />
            <polyline points="12,16 16,16 16,12" />
            <line x1="2" y1="2" x2="6" y2="6" />
            <line x1="16" y1="2" x2="12" y2="6" />
            <line x1="2" y1="16" x2="6" y2="12" />
            <line x1="16" y1="16" x2="12" y2="12" />
          </svg>
        ) : (
          // Square made of 4 corner L-shapes
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="1,5 1,1 5,1" />
            <polyline points="13,1 17,1 17,5" />
            <polyline points="1,13 1,17 5,17" />
            <polyline points="13,17 17,17 17,13" />
          </svg>
        )}
      </button>
    );
  }

  // Desktop — hover to show, Maximize/Minimize icons
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
      {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
    </button>
  );
}