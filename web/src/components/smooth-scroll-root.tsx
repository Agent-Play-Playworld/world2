import { useEffect, type ReactNode } from "react";

type SmoothScrollRootProps = {
  children: ReactNode;
};

export const SmoothScrollRoot = (options: SmoothScrollRootProps) => {
  const { children } = options;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("smooth-scroll");
    return () => {
      root.classList.remove("smooth-scroll");
    };
  }, []);

  return <div className="smooth-scroll-root">{children}</div>;
};
