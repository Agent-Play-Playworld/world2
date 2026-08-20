import { Route, Routes } from "react-router-dom";
import { CustomCursor } from "./components/custom-cursor";
import { SiteNavbar } from "./components/site-navbar";
import { SmoothScrollRoot } from "./components/smooth-scroll-root";
import { AssetsPage } from "./pages/assets-page";
import { CPage } from "./pages/c-page";
import { DevelopersPage } from "./pages/developers-page";
import { GameShellPage } from "./pages/game-shell-page";
import { InterestPage } from "./pages/interest-page";
import { LandingPage } from "./pages/landing-page";
import { RustPage } from "./pages/rust-page";
import { VisagePage } from "./pages/visage-page";
import { WebglPage } from "./pages/webgl-page";

export const App = () => {
  return (
    <SmoothScrollRoot>
      <CustomCursor />
      <SiteNavbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/interest" element={<InterestPage />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/game-shell" element={<GameShellPage />} />
        <Route path="/developers" element={<DevelopersPage />} />
        <Route path="/webgl" element={<WebglPage />} />
        <Route path="/rust" element={<RustPage />} />
        <Route path="/c" element={<CPage />} />
        <Route path="/visage" element={<VisagePage />} />
      </Routes>
    </SmoothScrollRoot>
  );
};
