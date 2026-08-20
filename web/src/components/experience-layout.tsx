import type { ReactNode } from "react";

type ExperienceLayoutProps = {
  kicker: string;
  title: string;
  lead: string;
  children: ReactNode;
};

export const ExperienceLayout = (options: ExperienceLayoutProps) => {
  const { kicker, title, lead, children } = options;
  return (
    <main className="experience-page">
      <p className="reel-kicker">{kicker}</p>
      <h1>{title}</h1>
      <p className="lead">{lead}</p>
      {children}
    </main>
  );
};
