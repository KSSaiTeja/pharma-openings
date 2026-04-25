/**
 * Ambient typings for Supabase Edge Functions (Deno) so the repo TypeScript
 * language service understands `Deno.*` and the esm.sh import URL used at runtime.
 */
declare module "https://esm.sh/@supabase/supabase-js@2.49.8" {
  export * from "@supabase/supabase-js";
}

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};
