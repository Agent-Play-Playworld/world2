import { GAME_SITE_HREF } from "./origins";
import { NavGroupSchema, type NavGroup } from "../schemas/navigation";

const RAW_GROUPS: readonly NavGroup[] = [
  {
    id: "play",
    label: "Play",
    items: [
      { label: "Live world", href: GAME_SITE_HREF, external: true },
      { label: "Opening reel", href: "/" },
    ],
  },
  {
    id: "launch",
    label: "Launch",
    items: [{ label: "Register interest", href: "/interest" }],
  },
  {
    id: "citizens",
    label: "Citizens",
    items: [
      { label: "Studio catalog", href: "/assets" },
      { label: "Avatar set", href: "/assets#avatar-set" },
      { label: "Inks", href: "/assets#inks" },
    ],
  },
  {
    id: "engineering",
    label: "Engineering",
    items: [
      { label: "Overview", href: "/developers" },
      { label: "WebGL", href: "/webgl" },
      { label: "Rust", href: "/rust" },
      { label: "Native C", href: "/c" },
      { label: "Visage", href: "/visage" },
    ],
  },
];

export const NAV_GROUPS: readonly NavGroup[] = RAW_GROUPS.map((group) => {
  const parsed = NavGroupSchema.parse(group);
  return {
    id: parsed.id,
    label: parsed.label,
    items: parsed.items.map((item) => {
      if (item.external === true) {
        return {
          label: item.label,
          href: item.href,
          external: true,
        };
      }
      return {
        label: item.label,
        href: item.href,
      };
    }),
  };
});
