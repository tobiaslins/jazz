"use client";
import { addPizzazz } from "@unicorn-poo/pizzazz";

import { useEffect } from "react";

export function Pizzazz() {
  useEffect(() => {
    addPizzazz(document?.body, { effectType: "valentines" });
  }, []);

  return null;
}
