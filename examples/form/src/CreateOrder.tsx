import { useIframeHashRouter } from "hash-slash";
import { useAccount, useCoState } from "jazz-tools/react";
import { useState } from "react";
import { Errors } from "./Errors.tsx";
import { LinkToHome } from "./LinkToHome.tsx";
import { OrderForm } from "./OrderForm.tsx";
import {
  BubbleTeaOrder,
  JazzAccount,
  PartialBubbleTeaOrder,
  validatePartialBubbleTeaOrder,
} from "./schema.ts";

export function CreateOrder(props: { id: string }) {
  const { me } = useAccount(JazzAccount, {
    resolve: { root: { orders: true } },
  });
  const router = useIframeHashRouter();
  const [errors, setErrors] = useState<string[]>([]);

  const newOrder = useCoState(PartialBubbleTeaOrder, props.id, {
    resolve: { addOns: true, instructions: true },
  });

  if (!newOrder) return;

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!me) return;

    const validation = validatePartialBubbleTeaOrder(newOrder);
    setErrors(validation.errors);
    if (validation.errors.length > 0) {
      return;
    }

    // turn the draft into a real order
    me.root.orders.$jazz.push(newOrder as BubbleTeaOrder);

    router.navigate("/");
  };

  return (
    <>
      <LinkToHome />

      <h1 className="text-lg">
        <strong>Make a new bubble tea order 🧋</strong>
      </h1>

      <Errors errors={errors} />
      <OrderForm order={newOrder} onSave={handleSave} />
    </>
  );
}
