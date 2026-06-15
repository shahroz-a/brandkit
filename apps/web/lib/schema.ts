import { z } from "zod";
import {
  LOGO_SHAPES,
  LOGO_SOURCES,
  LOGO_STYLES,
  META_GRADIENTS,
  META_LAYOUTS,
  META_PATTERNS,
  MAX_LOGO_DATA_URI_LENGTH,
  THEMES,
} from "@brandkit/core";

const hex = z.string().regex(/^#?([a-f\d]{3}|[a-f\d]{6})$/i);
const logoDataUri = z
  .string()
  .max(MAX_LOGO_DATA_URI_LENGTH)
  .regex(/^data:image\/(?:png|jpe?g|webp|gif|svg\+xml);base64,[a-z0-9+/=]+$/iu);

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
  theme: z.enum(THEMES),
  logoSource: z.enum(LOGO_SOURCES),
  logoDataUri: logoDataUri.optional(),
  logoShape: z.enum(LOGO_SHAPES),
  logoStyle: z.enum(LOGO_STYLES),
  metaGradient: z.enum(META_GRADIENTS),
  metaPattern: z.enum(META_PATTERNS),
  metaPatternScale: z.coerce.number().min(16).max(96),
  metaIntensity: z.coerce.number().min(0).max(100),
  metaLayout: z.enum(META_LAYOUTS),
});
