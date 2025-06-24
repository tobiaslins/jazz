import { Icon } from "@/components/atoms/Icon";
import { Table } from "@/components/molecules/Table";

export default function IconsView() {
  return (
    <div className="p-3">
      <div className="flex gap-2">
        <Icon name="search" size="xs" styleType="primary" />
        <Icon name="zip" size="md" styleType="info" />
        <Icon name="docs" size="lg" styleType="success" />
        <Icon name="file" size="xl" styleType="warning" />
        <Icon name="hash" size="2xl" styleType="danger" />
        <Icon name="help" size="3xl" styleType="alert" />
        <Icon name="image" size="4xl" styleType="tip" />
        <Icon name="corecord" size="5xl" styleType="default" />
        <Icon name="corecord" size="6xl" styleType="muted" />
        <Icon name="corecord" size="7xl" styleType="strong" />
      </div>
      <div className="flex gap-2">
        <Icon name="search" size="xs" styleType="primary" hasBackground />
        <Icon name="zip" size="md" styleType="info" hasBackground />
        <Icon name="docs" size="lg" styleType="success" hasBackground />
        <Icon name="file" size="xl" styleType="warning" hasBackground />
        <Icon name="hash" size="2xl" styleType="danger" hasBackground />
        <Icon name="help" size="3xl" styleType="alert" hasBackground />
        <Icon name="image" size="4xl" styleType="tip" hasBackground />
        <Icon name="corecord" size="5xl" styleType="default" hasBackground />
        <Icon name="corecord" size="6xl" styleType="muted" hasBackground />
        <Icon name="corecord" size="7xl" styleType="strong" hasBackground />
      </div>
      <Table className="mt-6" tableData={iconPropsTable} copyable />
    </div>
  );
}

const iconPropsTable = {
  headers: ["prop", "types", "default"],
  data: [
    {
      prop: "name",
      types: "string",
      default: "undefined",
    },
    {
      prop: "icon",
      types: "LucideIcon",
      default: "undefined",
    },
    {
      prop: "size",
      types: ["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl"],
      default: "md",
    },
    {
      prop: "styleType",
      types: [
        "default",
        "primary",
        "info",
        "success",
        "warning",
        "danger",
        "alert",
        "tip",
        "muted",
        "strong",
        "white",
      ],
      default: "default",
    },
    {
      prop: "hasBackground",
      types: "boolean",
      default: "false",
    },
    {
      prop: "className",
      types: "string",
      default: "undefined",
    },
  ],
};
