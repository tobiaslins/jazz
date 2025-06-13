import { Button } from "@/components/atoms/Button";
import { Table } from "@/components/molecules/Table";
import Link from "next/link";

export function Buttons() {
  return (
    <div>
      <h2 id="buttons" className="text-xl mt-5 mb-2 font-bold">
        Buttons
      </h2>

      <h3 className="text-lg mt-5 mb-2 font-bold">Variants</h3>

      <div className="grid grid-cols-2 gap-2">
        <Button>default</Button>
        <Button variant="secondary">secondary</Button>
        <Button variant="tip">tip</Button>
        <Button variant="info">info</Button>
        <Button variant="success">success</Button>
        <Button variant="warning">warning</Button>
        <Button variant="alert">alert</Button>
        <Button variant="danger">danger</Button>
      </div>

      <h3 className="text-lg mt-5 mb-2 font-bold">Colors</h3>

      <div className="grid grid-cols-2 gap-2">
        <Button color="light">light</Button>
        <Button color="dark">dark</Button>
        <Button color="white">white</Button>
        <Button color="black">black</Button>
      </div>

      <h3 className="text-lg mt-5 mb-2 font-bold">Styles</h3>

      <div className="grid grid-cols-2 gap-2">
        <Button styleVariant="outline">outline</Button>
        <Button styleVariant="inverted">inverted</Button>
        <Button styleVariant="ghost">ghost</Button>
        <Button styleVariant="text">text</Button>
      </div>

      <p className="text-sm mt-5 mb-2">
        <strong>NB:</strong> Variants and styles are interchangeable.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Button styleVariant="outline" variant="warning">
          outline warning
        </Button>
        <Button styleVariant="inverted" variant="success">
          inverted success
        </Button>
        <Button styleVariant="ghost" variant="info">
          ghost info
        </Button>
        <Button styleVariant="text" variant="tip">
          text tip
        </Button>
      </div>

      <p>Buttons can also contain an icon.</p>

      <div className="grid grid-cols-2 gap-2">
        <Button
          icon="delete"
          styleVariant="text"
          variant="danger"
          iconPosition="right"
        >
          text danger with icon
        </Button>
        <Button
          icon="info"
          iconPosition="left"
          styleVariant="outline"
          variant="info"
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
      <div>
        <h3 className="text-xl mt-5 mb-2 font-bold">Props Table</h3>
        <Table tableData={buttonPropsTableData} copyable={true} />
      </div>
    </div>
  );
}

const buttonPropsTableData = {
  headers: ["Prop", "Types", "Default"],
  data: [
    {
      Prop: "variant?",
      Types: [
        "primary",
        "secondary",
        "tip",
        "info",
        "success",
        "warning",
        "alert",
        "danger",
      ],
      Default: "primary",
    },
    {
      Prop: "styleVariant?",
      Types: ["outline", "inverted", "ghost", "text"],
      Default: "default",
    },
    {
      Prop: "color?",
      Types: ["light", "dark", "white", "black"],
      Default: "primary",
    },
    {
      Prop: "icon?",
      Types: "string",
      Types: "see icon props",
      Default: "undefined",
    },
    {
      Prop: "iconPosition?",
      Types: ["left", "right"],
      Default: "left",
    },
    {
      Prop: "loading?",
      Types: "boolean",
      Default: "false",
    },
    {
      Prop: "loadingText?",
      Types: "string",
      Default: "Loading...",
    },
    {
      Prop: "disabled?",
      Types: "boolean",
      Default: "false",
    },
    {
      Prop: "href?",
      Types: "string",
      Default: "undefined",
    },
    {
      Prop: "newTab?",
      Types: "boolean",
      Default: "false",
    },
    {
      Prop: "size?",
      Types: ["sm", "md", "lg"],
      Default: "md",
    },
    {
      Prop: "className?",
      Types: "string",
      Default: "undefined",
    },
    {
      Prop: "children?",
      Types: "React.ReactNode",
      Default: "undefined",
    },
  ],
};
