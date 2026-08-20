import { AppRouteSchema, type AppRoute } from "../schemas/routes";

const RAW_ROUTES: readonly AppRoute[] = [
  { id: "landing", path: "/", label: "World 2" },
  { id: "interest", path: "/interest", label: "Show interest" },
  { id: "assets", path: "/assets", label: "Assets" },
  { id: "developers", path: "/developers", label: "Developers" },
  { id: "webgl", path: "/webgl", label: "WebGL developers" },
  { id: "rust", path: "/rust", label: "Rust Experience" },
  { id: "c", path: "/c", label: "C" },
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
