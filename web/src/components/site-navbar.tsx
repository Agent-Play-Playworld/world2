import { Link } from "react-router-dom";
import { NAV_LINKS } from "../lib/navigation";

export const SiteNavbar = () => {
  return (
    <header className="site-header site-header-overlay">
      <nav className="site-nav" aria-label="World 2">
        <Link className="brand" to="/">
          World 2
        </Link>
        <div className="nav-cluster">
          {NAV_LINKS.map((link) =>
            link.external === true ? (
              <a
                key={link.id}
                className="nav-link"
                href={link.href}
                rel="noreferrer"
              >
                {link.label}
              </a>
            ) : (
              <Link key={link.id} className="nav-link" to={link.href}>
                {link.label}
              </Link>
            )
          )}
        </div>
      </nav>
    </header>
  );
};
