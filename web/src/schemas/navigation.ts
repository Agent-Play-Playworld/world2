import { z } from "zod";

export const NavLinkItemSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  external: z.boolean().optional(),
});

export type NavLinkItem = {
  label: string;
  href: string;
  external?: boolean;
};

export const NavGroupSchema = z.object({
  id: z.enum(["play", "launch", "citizens", "engineering"]),
  label: z.string().min(1),
  items: z.array(NavLinkItemSchema).min(1),
});

export type NavGroup = {
  id: "play" | "launch" | "citizens" | "engineering";
  label: string;
  items: readonly NavLinkItem[];
};
