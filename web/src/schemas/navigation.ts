import { z } from "zod";

export const NavLinkSchema = z.object({
  id: z.enum(["play", "banking"]),
  label: z.string().min(1),
  href: z.string().min(1),
  external: z.boolean().optional(),
});

export type NavLink = {
  id: "play" | "banking";
  label: string;
  href: string;
  external?: boolean;
};
