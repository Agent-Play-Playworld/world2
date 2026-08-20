import { AppRouteSchema, type AppRoute } from "../schemas/routes";

const RAW_ROUTES: readonly AppRoute[] = [
  { id: "landing", path: "/", label: "Opening reel" },
  { id: "interest", path: "/interest", label: "Register interest" },
  { id: "assets", path: "/assets", label: "Studio catalog" },
  { id: "developers", path: "/developers", label: "Overview" },
  { id: "webgl", path: "/webgl", label: "WebGL" },
  { id: "rust", path: "/rust", label: "Rust" },
  { id: "c", path: "/c", label: "Native C" },
  { id: "visage", path: "/visage", label: "Visage" },
];

export const APP_ROUTES: readonly AppRoute[] = RAW_ROUTES.map((route) =>
  AppRouteSchema.parse(route)
);

export const EXPERIENCE_ROUTES: readonly AppRoute[] = APP_ROUTES.filter(
  (route) =>
    route.id === "developers" ||
    route.id === "webgl" ||
    route.id === "rust" ||
    route.id === "c" ||
    route.id === "visage"
);
