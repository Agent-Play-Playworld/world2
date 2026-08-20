import { useEffect, useState } from "react";
import { ART_REEL_FRAMES, artRefPublicPath } from "../lib/art-reel";
import { parallaxOffset } from "../lib/parallax";

export const CinematicReel = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setScrollY(window.scrollY);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="cinematic-reel">
      {ART_REEL_FRAMES.map((frame, index) => {
        const speed = index % 2 === 0 ? 0.18 : 0.08;
        const shift = parallaxOffset({ scrollY, speed });
        return (
          <section key={frame.file} className="reel-frame" id={`reel-${index}`}>
            <div
              className="reel-parallax"
              style={{ transform: `translate3d(0, ${shift * -0.15}px, 0)` }}
            >
              <img
                className="reel-still"
                data-design="true"
                src={artRefPublicPath(frame.file)}
                alt={frame.title}
              />
            </div>
            <div className="reel-copy">
              <p className="reel-kicker">World 2</p>
              <h2>{frame.title}</h2>
              <p>{frame.caption}</p>
            </div>
          </section>
        );
      })}
    </div>
  );
};
