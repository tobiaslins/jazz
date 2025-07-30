import { Loaded, co, z } from "jazz-tools";

export const BubbleTeaAddOnTypes = [
  "Pearl",
  "Lychee jelly",
  "Red bean",
  "Brown sugar",
  "Taro",
] as const;

export const BubbleTeaBaseTeaTypes = [
  "Black",
  "Oolong",
  "Jasmine",
  "Thai",
] as const;

export const ListOfBubbleTeaAddOns = co.list(
  z.literal([...BubbleTeaAddOnTypes]),
);

function hasAddOnsChanges(list?: Loaded<typeof ListOfBubbleTeaAddOns> | null) {
  return list && Object.entries(list._raw.insertions).length > 0;
}

export const BubbleTeaOrder = co.map({
  baseTea: z.literal([...BubbleTeaBaseTeaTypes]),
  addOns: ListOfBubbleTeaAddOns,
  deliveryDate: z.date(),
  withMilk: z.boolean(),
  instructions: co.optional(co.plainText()),
});

export const DraftBubbleTeaOrder = co.map({
  baseTea: z.optional(z.literal([...BubbleTeaBaseTeaTypes])),
  addOns: co.optional(ListOfBubbleTeaAddOns),
  deliveryDate: z.optional(z.date()),
  withMilk: z.optional(z.boolean()),
  instructions: co.optional(co.plainText()),
});

export function validateDraftOrder(order: Loaded<typeof DraftBubbleTeaOrder>) {
  const errors: string[] = [];

  if (!order.baseTea) {
    errors.push("Please select your preferred base tea.");
  }
  if (!order.deliveryDate) {
    errors.push("Plese select a delivery date.");
  }

  return { errors };
}

export function hasChanges(order?: Loaded<typeof DraftBubbleTeaOrder> | null) {
  return (
    !!order &&
    (Object.keys(order._edits).length > 1 || hasAddOnsChanges(order.addOns))
  );
}

/** The root is an app-specific per-user private `CoMap`
 *  where you can store top-level objects for that user */
export const AccountRoot = co.map({
  draft: DraftBubbleTeaOrder,
  orders: co.list(BubbleTeaOrder),
});

export const JazzAccount = co
  .account({
    root: AccountRoot,
    profile: co.profile(),
  })
  .withMigration((account) => {
    if (!account.root) {
      account.root = AccountRoot.create(
        { draft: { addOns: [], instructions: "" }, orders: [] },
        account,
      );
    }
  });
