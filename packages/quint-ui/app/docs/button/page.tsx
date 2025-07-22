import { Button } from "@/src/components/button";

export default function ButtonDocsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Button</h1>

      <div className="flex gap-2">
        <Button intent="primary">Default</Button>
        <Button intent="primary" variant="outline">
          Outline
        </Button>
        <Button intent="primary" variant="ghost">
          Ghost
        </Button>
        <Button intent="primary" variant="link">
          Link
        </Button>
        <Button intent="primary" variant="inverted">
          Inverted
        </Button>
      </div>
    </div>
  );
}
