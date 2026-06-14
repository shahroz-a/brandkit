import { z } from "zod";

const hex = z.string().regex(/^#?([a-f\d]{3}|[a-f\d]{6})$/i);

export const brandInputSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().min(1).max(260),
  font: z.string().min(1).max(80),
  radius: z.coerce.number().min(0).max(64),
  primary: hex,
  secondary: hex,
  accent: hex,
  background: hex,
  foreground: hex,
  mode: z.enum(["light", "dark"]),
  theme: z.enum(["minimal", "glass", "editorial", "apple", "stripe", "linear", "modern", "brutalist", "mesh", "gradient"])
});
