import { ECONEXT_HREF } from "./origins";
import { NavLinkSchema, type NavLink } from "../schemas/navigation";

const RAW_LINKS: readonly NavLink[] = [
  { id: "play", label: "Play", href: "/game-shell" },
  { id: "banking", label: "Banking", href: ECONEXT_HREF, external: true },
];

export const NAV_LINKS: readonly NavLink[] = RAW_LINKS.map((link) => {
  const parsed = NavLinkSchema.parse(link);
  if (parsed.external === true) {
    return {
      id: parsed.id,
      label: parsed.label,
      href: parsed.href,
      external: true,
    };
  }
  return {
    id: parsed.id,
    label: parsed.label,
    href: parsed.href,
  };
});
