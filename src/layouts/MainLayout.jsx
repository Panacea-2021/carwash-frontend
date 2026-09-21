import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer";

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [zoomScale, setZoomScale] = useState(1);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width < 1024;

      setIsMobile(mobile);

      if (mobile) setIsSidebarOpen(false);
      if (!mobile && !isSidebarOpen) setIsSidebarOpen(true);

      if (width < 1100) {
        const scale = width / 1100;
        setZoomScale(scale);
      } else {
        setZoomScale(1);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 👉 Zoom ONLY on mobile
  const contentStyle = isMobile
    ? {
        zoom: zoomScale,
        MozTransform: `scale(${zoomScale})`,
        MozTransformOrigin: "top left",
        width: "1100px",
      }
    : {};

  return (
    <div className="min-h-screen bg-page text-text-main font-sans transition-colors duration-300 flex overflow-x-hidden">
      <Sidebar
        isOpen={isSidebarOpen}
        isMobile={isMobile}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300
          ${!isMobile ? "ml-[72px]" : "ml-0"}
        `}
      >
        <Header
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        <main className="flex-1 overflow-x-hidden w-full bg-page">
          <div
            className={`animate-fade-in origin-top-left ${
              isMobile ? "" : "max-w-[1400px] mx-auto w-full"
            }`}
            style={contentStyle}
          >
            <Outlet />
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
