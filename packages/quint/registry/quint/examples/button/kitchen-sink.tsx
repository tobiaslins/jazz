import { Button } from "@/registry/jazz/ui/button";
import { ChevronRightIcon } from "lucide-react";

export default function ButtonDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2 md:flex-row">
      <div>
        Default
        <div className="flex flex-wrap gap-2">
          <Button intent="success">Success</Button>
          <Button intent="default">Default</Button>
          <Button intent="danger">
            Danger
            <ChevronRightIcon />
          </Button>
          <Button intent="primary">Primary</Button>
        </div>
      </div>
      <div>
        Outline:
        <div className="flex flex-wrap gap-2">
          <Button intent="success" variant="outline">
            Success
          </Button>
          <Button intent="default" variant="outline">
            Default
          </Button>
          <Button intent="danger" variant="outline">
            Danger
          </Button>
          <Button intent="primary" variant="outline">
            Primary
          </Button>
        </div>
      </div>
      <div>
        Ghost
        <div className="flex flex-wrap gap-2">
          <Button intent="success" variant="ghost">
            Success
          </Button>
          <Button intent="default" variant="ghost">
            Default
          </Button>
          <Button intent="danger" variant="ghost">
            Danger
          </Button>
          <Button intent="primary" variant="ghost">
            Primary
          </Button>
        </div>
      </div>
      <div>
        Inverted
        <div className="flex flex-wrap gap-2">
          <Button intent="success" variant="inverted">
            Success
          </Button>
          <Button intent="default" variant="inverted">
            Default
          </Button>
          <Button intent="danger" variant="inverted">
            Danger
          </Button>
          <Button intent="primary" variant="inverted">
            Primary
          </Button>
        </div>
      </div>
    </div>
  );
}
