"use client";

import { Switch } from "@/components/atoms/Switch";
import { Input } from "@/components/molecules/Input";
import { InputWithButton } from "@/components/molecules/InputWithButton";
import { NewsletterForm } from "@/components/organisms/NewsletterForm";
import { useState } from "react";

export function Components() {
  const [checked, setChecked] = useState({
    md: true,
    sm: true,
  });

  return (
    <div>
      <h2 id="components" className="text-xl mt-5 mb-2 font-bold">
        Components
      </h2>

      <div className="p-3">
        <div className="py-3 flex gap-6">
          <h3 className="text-md font-semibold">Switches</h3>
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
        <h3 className="text-md font-semibold mb-2">Inputs</h3>
        <div className="flex flex-col gap-2">
          <Input
            icon="search"
            label="Search [label hidden]"
            iconPosition="left"
            placeholder="Search"
            labelHidden={true}
          />
          <Input
            icon="check"
            label="Email"
            iconPosition="left"
            placeholder="Email"
          />
          <Input
            icon="file"
            label="Password"
            iconPosition="right"
            placeholder="Password"
          />
          <InputWithButton
            inputProps={{
              label: "Input with button [label visible]",
              labelHidden: false,
              placeholder: "Input with button",
            }}
            buttonProps={{
              children: "Let's go",
              variant: "success",
              styleVariant: "inverted",
              icon: "check",
              iconPosition: "left",
            }}
          />
          <NewsletterForm />
        </div>
      </div>
    </div>
  );
}
