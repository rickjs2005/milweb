import { resolvePolicy } from "./config";

/**
 * A política lida do ambiente (config.ts explica as variáveis). Cada `process.env.NEXT_PUBLIC_*` fica escrito
 * por extenso: o Next só substitui no bundle do cliente a referência literal.
 */
export const HALLOWEEN_POLICY = resolvePolicy({
  off: process.env.NEXT_PUBLIC_HALLOWEEN,
  preview: process.env.NEXT_PUBLIC_HALLOWEEN_PREVIEW,
  nodeEnv: process.env.NODE_ENV,
  vercelEnv: process.env.NEXT_PUBLIC_VERCEL_ENV,
});
