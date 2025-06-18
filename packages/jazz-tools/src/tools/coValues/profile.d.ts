import {
  CoMap,
  CoMapInit,
  CoValueClass,
  Group,
  Simplify,
} from "../internal.js";
/** @category Identity & Permissions */
export declare class Profile extends CoMap {
  name: string;
  inbox?: string | undefined;
  inboxInvite?: string | undefined;
  /**
   * Creates a new profile with the given initial values and owner.
   *
   * The owner (a Group) determines access rights to the Profile.
   *
   * @category Creation
   */
  static create<M extends CoMap>(
    this: CoValueClass<M>,
    init: Simplify<CoMapInit<M>>,
    options?:
      | {
          owner: Group;
        }
      | Group,
  ): M;
}
