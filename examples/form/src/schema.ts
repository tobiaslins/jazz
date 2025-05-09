import { Account, CoList, CoMap, coField } from "jazz-tools";

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

export class ListOfBubbleTeaAddOns extends CoList.Of(
  coField.literal(...BubbleTeaAddOnTypes),
) {
  get hasChanges() {
    return Object.entries(this._raw.insertions).length > 0;
  }
}

export class BubbleTeaOrder extends CoMap {
  baseTea = coField.literal(...BubbleTeaBaseTeaTypes);
  addOns = coField.ref(ListOfBubbleTeaAddOns);
  deliveryDate = coField.Date;
  withMilk = coField.boolean;
  instructions = coField.optional.string;
}

export class DraftBubbleTeaOrder extends CoMap {
  baseTea = coField.optional.literal(...BubbleTeaBaseTeaTypes);
  addOns = coField.optional.ref(ListOfBubbleTeaAddOns);
  deliveryDate = coField.optional.Date;
  withMilk = coField.optional.boolean;
  instructions = coField.optional.string;

  static hasChanges(order: DraftBubbleTeaOrder | undefined) {
    return (
      !!order &&
      (Object.keys(order._edits).length > 1 || order.addOns?.hasChanges)
    );
  }

  static validate(order: DraftBubbleTeaOrder) {
    const errors: string[] = [];

    if (!order.baseTea) {
      errors.push("Please select your preferred base tea.");
    }
    if (!order.deliveryDate) {
      errors.push("Plese select a delivery date.");
    }

    return { errors };
  }
}

export class ListOfBubbleTeaOrders extends CoList.Of(
  coField.ref(BubbleTeaOrder),
) {}

/** The root is an app-specific per-user private `CoMap`
 *  where you can store top-level objects for that user */
export class AccountRoot extends CoMap {
  draft = coField.ref(DraftBubbleTeaOrder);
  orders = coField.ref(ListOfBubbleTeaOrders);
}

export class JazzAccount extends Account {
  root = coField.ref(AccountRoot);

  migrate() {
    const account = this;

    if (!this._refs.root) {
      const orders = ListOfBubbleTeaOrders.create([], account);
      const draft = DraftBubbleTeaOrder.create(
        {
          addOns: ListOfBubbleTeaAddOns.create([], account),
        },
        account,
      );

      this.root = AccountRoot.create({ draft, orders }, account);
    }
  }
}
