"use client";

import { useEffect } from "react";
import { initFirebase } from "@/lib/firebase";

export function FirebaseAnalytics() {
  useEffect(() => {
    initFirebase();
  }, []);

  return null;
}
