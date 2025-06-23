"use client";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { Select } from "@/components/molecules/Select";
import { Table } from "@/components/molecules/Table";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
} from "@/components/organisms/Dropdown";
import { Variant } from "@/utils/variants";
import { useState } from "react";
export default function ButtonsPage() {
  const variants = [
    "default",
    "primary",
    "tip",
    "info",
    "success",
    "warning",
    "alert",
    "danger",
    "muted",
    "highlight",
  ] as const;
  const [selectedVariant, setSelectedVariant] = useState<Variant>("default");
  return (
    <>
      <h3 className="text-lg mt-5 mb-2 font-bold">Variants</h3>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="default">default</Button>
        <Button variant="primary">primary</Button>
        <Button variant="tip">tip</Button>
        <Button variant="info">info</Button>
        <Button variant="success">success</Button>
        <Button variant="warning">warning</Button>
        <Button variant="alert">alert</Button>
        <Button variant="danger">danger</Button>
        <Button variant="muted">muted</Button>
        <Button variant="highlight">highlight</Button>
      </div>

      <div className="flex justify-between items-center w-12 mt-10">
        <h3 className="text-lg font-bold">Styles</h3>
        <div className="max-w-xs ml-12">
          <Dropdown>
            <DropdownButton
              className="w-full justify-between"
              as={Button}
              variant="default"
              styleVariant="inverted"
            >
              {selectedVariant}
              <Icon name="chevronDown" size="sm" />
            </DropdownButton>
            <DropdownMenu>
              {variants.map((variant) => (
                <DropdownItem
                  key={variant}
                  onClick={() => setSelectedVariant(variant)}
                >
                  {variant}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
      <p className="text-sm mt-2 mb-5">
        <strong>NB:</strong> Variants and styles are interchangeable. See the
        variants with the dropdown
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Button variant={selectedVariant} styleVariant="outline">
          outline
        </Button>
        <Button variant={selectedVariant} styleVariant="inverted">
          inverted
        </Button>
        <Button variant={selectedVariant} styleVariant="ghost">
          ghost
        </Button>
        <Button variant={selectedVariant} styleVariant="text">
          text
        </Button>
      </div>

      <h3 className="text-lg font-bold mt-5">Icons</h3>

      <p>Buttons can also contain an icon and text.</p>

      <div className="grid grid-cols-2 gap-2">
        <Button
          icon="delete"
          styleVariant="text"
          variant="danger"
          iconPosition="right"
          className="col-span-2 md:col-span-1"
        >
          text danger with icon
        </Button>
        <Button
          icon="info"
          iconPosition="left"
          styleVariant="outline"
          variant="info"
          className="col-span-2 md:col-span-1"
        >
          outline info with icon
        </Button>
        <p className="col-span-2">
          Or just use the icon prop with any of the button variants, style
          variants and colors.
        </p>
        <Button icon="newsletter" styleVariant="text" variant="tip" />
        <Button icon="check" variant="success" />
      </div>
      <div className="overflow-auto">
        <h3 className="text-xl mt-5 mb-2 font-bold">Props Table</h3>
        <Table tableData={buttonPropsTableData} copyable={true} />
      </div>
    </>
  );
}

const buttonPropsTableData = {
  headers: ["prop", "types", "default"],
  data: [
    {
      prop: "variant?",
      types: [
        "default",
        "primary",
        "tip",
        "info",
        "success",
        "warning",
        "alert",
        "danger",
        "muted",
        "highlight",
      ],
      default: "default",
    },
    {
      prop: "styleVariant?",
      types: ["outline", "inverted", "ghost", "text"],
      default: "default",
    },
    {
      prop: "icon?",
      types: "Lucide icon name",
      default: "undefined",
    },
    {
      prop: "iconPosition?",
      types: ["left", "right"],
      default: "left",
    },
    {
      prop: "loading?",
      types: "boolean",
      default: "false",
    },
    {
      prop: "loadingText?",
      types: "string",
      default: "Loading...",
    },
    {
      prop: "disabled?",
      types: "boolean",
      default: "false",
    },
    {
      prop: "href?",
      types: "string",
      default: "undefined",
    },
    {
      prop: "newTab?",
      types: "boolean",
      default: "false",
    },
    {
      prop: "size?",
      types: ["sm", "md", "lg"],
      default: "md",
    },
    {
      prop: "className?",
      types: "string",
      default: "undefined",
    },
    {
      prop: "children?",
      types: "React.ReactNode",
      default: "undefined",
    },
  ],
};
