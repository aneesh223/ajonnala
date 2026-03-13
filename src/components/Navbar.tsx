import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

const navLinks = [
  { label: "About Me", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Skills", href: "#skills" },
  { label: "Let's Connect!", href: "#contact", bold: true },
];

const Navbar = () => {
  const [activeSection, setActiveSection] = useState("");

  const updateActive = useCallback(() => {
    const ids = navLinks.map((l) => l.href.slice(1));
    let current = "";
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 160) current = id;
      }
    }
    setActiveSection(current);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", updateActive, { passive: true });
    return () => window.removeEventListener("scroll", updateActive);
  }, [updateActive]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.nav
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="flex items-center gap-1 px-2 py-2 rounded-full border border-border/60 bg-background/60 backdrop-blur-2xl shadow-[0_4px_30px_hsl(217_91%_60%/0.08)]">
        {navLinks.map((link) => {
          const isActive = activeSection === link.href.slice(1);
          return (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleClick(e, link.href)}
              className={`relative px-4 py-1.5 text-sm rounded-full transition-all duration-300 ${
                "bold" in link && link.bold ? "font-bold" : "font-medium"
              } ${
                isActive
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="navbar-bubble"
                  className="absolute inset-0 rounded-full bg-primary/90 shadow-[0_0_14px_hsl(217_91%_60%/0.5)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{link.label}</span>
            </a>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default Navbar;
