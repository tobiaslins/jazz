"use client";

import { Switch } from "@/components/atoms/Switch";
import { NewsletterForm } from "@/components/organisms/NewsletterForm";
import { useState } from "react";

export function Components() {
  const [checked, setChecked] = useState({
    md: false,
    sm: false,
  });
  return (
    <div>
      <h2 id="components" className="text-xl mt-5 mb-2 font-bold">
        Components
      </h2>

      <div className="p-3">
        <NewsletterForm />
        <div className="py-3 flex gap-6">
          <Switch
            label="Switch default (md) (Primary)"
            id="switch-md"
            checked={checked.md}
            onChange={() => setChecked({ ...checked, md: !checked.md })}
          />
          <Switch
            label="Switch (sm) success"
            id="switch-sm"
            checked={checked.sm}
            onChange={() => setChecked({ ...checked, sm: !checked.sm })}
            size="sm"
            variant="success"
          />
        </div>
      </div>
    </div>
  );
}
