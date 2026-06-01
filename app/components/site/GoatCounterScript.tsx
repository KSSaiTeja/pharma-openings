import Script from "next/script";

import { goatCounterCountEndpoint } from "@/src/lib/goatcounter";

/** Privacy-friendly pageview tracking (GoatCounter). No cookies; ~3.5KB script. */
export function GoatCounterScript() {
  const endpoint = goatCounterCountEndpoint();
  if (!endpoint) return null;

  return (
    <Script
      data-goatcounter={endpoint}
      async
      src="https://gc.zgo.at/count.js"
      strategy="afterInteractive"
    />
  );
}
