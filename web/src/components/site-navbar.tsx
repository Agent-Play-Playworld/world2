import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { NAV_GROUPS } from "../lib/navigation";
import type { NavGroup } from "../schemas/navigation";

export const SiteNavbar = () => {
  const [openGroupId, setOpenGroupId] = useState<NavGroup["id"] | null>(null);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-nav-root]") !== null) {
        return;
      }
      setOpenGroupId(null);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return (
    <header className="site-header site-header-overlay">
      <nav className="site-nav" aria-label="World 2" data-nav-root="true">
        <Link className="brand" to="/">
          World 2
        </Link>
        <div className="nav-cluster">
          {NAV_GROUPS.map((group) => {
            const expanded = openGroupId === group.id;
            const menuId = `nav-menu-${group.id}`;
            return (
              <div
                key={group.id}
                className="nav-group"
                onPointerEnter={() => setOpenGroupId(group.id)}
                onPointerLeave={() =>
                  setOpenGroupId((current) => (current === group.id ? null : current))
                }
              >
                <button
                  type="button"
                  className={expanded ? "nav-trigger nav-trigger-open" : "nav-trigger"}
                  aria-expanded={expanded}
                  aria-controls={menuId}
                  onClick={() =>
                    setOpenGroupId((current) =>
                      current === group.id ? null : group.id
                    )
                  }
                >
                  {group.label}
                </button>
                <ul
                  id={menuId}
                  className="nav-submenu"
                  hidden={!expanded}
                >
                  {group.items.map((item) => (
                    <li key={`${group.id}-${item.href}`}>
                      {item.external === true ? (
                        <a
                          className="nav-sublink"
                          href={item.href}
                          rel="noreferrer"
                        >
                          {item.label}
                        </a>
                      ) : (
                        <Link
                          className="nav-sublink"
                          to={item.href}
                          onClick={() => setOpenGroupId(null)}
                        >
                          {item.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </nav>
    </header>
  );
};
