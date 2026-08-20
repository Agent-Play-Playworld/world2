import { NavLink } from "react-router-dom";
import { GAME_SITE_HREF } from "../lib/origins";
import { EXPERIENCE_ROUTES } from "../lib/routes";

export const SiteNavbar = () => {
  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="World 2">
        <NavLink className="brand" to="/">
          World 2
        </NavLink>
        <div className="nav-cluster">
          <a className="nav-link" href={GAME_SITE_HREF}>
            Enter the world
          </a>
          <NavLink className="nav-link" to="/interest">
            Show interest
          </NavLink>
          <NavLink className="nav-link" to="/assets">
            Assets
          </NavLink>
          <NavLink className="nav-link" to="/developers">
            Developers
          </NavLink>
          {EXPERIENCE_ROUTES.filter((route) => route.id !== "developers").map(
            (route) => (
              <NavLink key={route.id} className="nav-link" to={route.path}>
                {route.label}
              </NavLink>
            )
          )}
        </div>
      </nav>
    </header>
  );
};
