import { useEffect, useState } from "react";

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

type Breakpoint = "sm" | "md" | "lg" | "xl" | "2xl";

const getBreakpoint = (): Breakpoint => {
  if (typeof window === "undefined") return "sm";

  const { innerWidth } = window;

  if (innerWidth >= breakpoints["2xl"]) return "2xl";
  if (innerWidth >= breakpoints.xl) return "xl";
  if (innerWidth >= breakpoints.lg) return "lg";
  if (innerWidth >= breakpoints.md) return "md";

  return "sm";
};

const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(getBreakpoint());

  useEffect(() => {
    const handleResize = () => {
      setBreakpoint(getBreakpoint());
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return breakpoint;
};

export { useBreakpoint };
