import { Button } from "@/registry/quint/ui/button";
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
