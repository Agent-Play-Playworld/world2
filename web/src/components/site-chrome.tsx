import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { CustomCursor } from "./custom-cursor";
import { SiteNavbar } from "./site-navbar";

export const SiteChrome = () => {
  const { pathname } = useLocation();
  const isGameShell = pathname === "/game-shell";

  useEffect(() => {
    document.documentElement.classList.toggle("game-shell-route", isGameShell);
    return () => {
      document.documentElement.classList.remove("game-shell-route");
    };
  }, [isGameShell]);

  if (isGameShell) {
    return null;
  }

  return (
    <>
      <CustomCursor />
      <SiteNavbar />
    </>
  );
};
