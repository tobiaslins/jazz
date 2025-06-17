"use client";

import { Icon } from "@/components/atoms/Icon";
import { Switch } from "@/components/atoms/Switch";
import { Input } from "@/components/molecules/Input";
import { InputWithButton } from "@/components/molecules/InputWithButton";
import { Table } from "@/components/molecules/Table";
import { NewsletterForm } from "@/components/organisms/NewsletterForm";
import { useState } from "react";
import { ViewsLayout } from "../ViewsLayout";

export default function Components() {
  const [checked, setChecked] = useState({
    md: true,
    sm: true,
  });

  return (
    <ViewsLayout>
      <h2 id="components" className="text-xl mt-5 mb-2 font-bold">
        Components
      </h2>

      <div className="p-3">
        <div className="pb-4 flex gap-6 flex-col md:flex-row">
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
          <Input
            icon="eye"
            label="Password"
            iconPosition="right"
            labelPosition="row"
            placeholder="Password"
          />
          <InputWithButton
            inputProps={{
              label: "Input with button [label visible]",
              labelHidden: false,
              placeholder: "Input with button",
              variant: "success",
            }}
            buttonProps={{
              children: "Let's go",
              variant: "success",
              styleVariant: "inverted",
              icon: "check",
              iconPosition: "left",
            }}
          />
          <InputWithButton
            inputProps={{
              label: "Input with button [label visible]",
              labelHidden: false,
              labelPosition: "row",
              placeholder: "Input with button",
            }}
            buttonProps={{
              children: "Learn more",
              variant: "tip",
              styleVariant: "outline",
              icon: "corecord",
              iconPosition: "right",
            }}
          />
          <NewsletterForm />
        </div>
        <Table className="mt-6" tableData={inputPropsTable} copyable />
      </div>
      <div className="p-3">
        <h3 className="text-md font-semibold mb-2">Icons</h3>
        <div className="flex gap-2">
          <Icon name="search" size="xs" variant="primary" />
          <Icon name="upload" size="sm" variant="secondary" />
          <Icon name="zip" size="md" variant="info" />
          <Icon name="docs" size="lg" variant="success" />
          <Icon name="file" size="xl" variant="warning" />
          <Icon name="hash" size="2xl" variant="danger" />
          <Icon name="help" size="3xl" variant="alert" />
          <Icon name="image" size="4xl" variant="tip" />
          <Icon name="corecord" size="5xl" variant="default" />
        </div>
      </div>
    </ViewsLayout>
  );
}

const inputPropsTable = {
  headers: ["prop", "types", "default"],
  data: [
    {
      prop: "label",
      types: "string",
      default: "undefined",
    },
    {
      prop: "labelHidden",
      types: "boolean",
      default: "false",
    },
    {
      prop: "labelPosition",
      types: ["column", "row"],
      default: "column",
    },
    {
      prop: "icon",
      types: ["LucideIcon"],
      default: "undefined",
    },
    {
      prop: "iconPosition",
      types: ["left", "right"],
      default: "left",
    },
    {
      prop: "buttonProps",
      types: "see Button Props",
      default: "undefined",
    },
  ],
};
