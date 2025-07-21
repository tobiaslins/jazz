import { Button } from "@/registry/jazz/ui/button";
import { PlusIcon } from "lucide-react";

export default function ButtonWithIcon() {
  return (
    <div>
      <Button intent="primary" variant="outline">
        <PlusIcon />
        Add
      </Button>
    </div>
  );
}
