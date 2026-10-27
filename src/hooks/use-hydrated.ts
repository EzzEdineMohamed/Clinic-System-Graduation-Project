"use client";

import { useSyncExternalStore } from "react";

/** false while the page is plain HTML, true once React runs in the browser.
 *  Forms keep their submit button disabled until then, so a click can never
 *  send the form the old HTML way (no loading state, fields in the URL). */
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
