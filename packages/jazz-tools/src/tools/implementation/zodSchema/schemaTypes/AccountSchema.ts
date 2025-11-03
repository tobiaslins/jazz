import {
  Account,
  AccountCreationProps,
  BranchDefinition,
  CoMapSchemaDefinition,
  coOptionalDefiner,
  Group,
  MaybeLoaded,
  RefsToResolveStrict,
  RefsToResolve,
  Resolved,
  Simplify,
  SubscribeListenerOptions,
  unstable_mergeBranchWithResolve,
} from "../../../internal.js";
import { AnonymousJazzAgent } from "../../anonymousJazzAgent.js";
import { InstanceOrPrimitiveOfSchema } from "../typeConverters/InstanceOrPrimitiveOfSchema.js";
import { InstanceOrPrimitiveOfSchemaCoValuesMaybeLoaded } from "../typeConverters/InstanceOrPrimitiveOfSchemaCoValuesMaybeLoaded.js";
import { z } from "../zodReExport.js";
import { AnyZodOrCoValueSchema, Loaded, ResolveQuery } from "../zodSchema.js";
import {
  CoMapSchema,
  CoreCoMapSchema,
  createCoreCoMapSchema,
} from "./CoMapSchema.js";
import { CoOptionalSchema } from "./CoOptionalSchema.js";
import { CoreResolveQuery } from "./CoValueSchema.js";
import { withSchemaResolveQuery } from "../../schemaUtils.js";

export type BaseProfileShape = {
  name: z.core.$ZodString<string>;
  inbox?: z.core.$ZodOptional<z.core.$ZodString>;
  inboxInvite?: z.core.$ZodOptional<z.core.$ZodString>;
};

export type BaseAccountShape = {
  profile: CoreCoMapSchema<BaseProfileShape>;
  root: CoreCoMapSchema;
};

export type DefaultAccountShape = {
  profile: CoMapSchema<BaseProfileShape>;
  root: CoMapSchema<{}>;
};

export class AccountSchema<
  Shape extends BaseAccountShape = DefaultAccountShape,
  DefaultResolveQuery extends CoreResolveQuery = true,
> implements CoreAccountSchema<Shape>
{
  collaborative = true as const;
  builtin = "Account" as const;
  shape: Shape;
  getDefinition: () => CoMapSchemaDefinition;
  resolve: DefaultResolveQuery = true as DefaultResolveQuery;

  constructor(
    coreSchema: CoreAccountSchema<Shape>,
    private coValueClass: typeof Account,
  ) {
    this.shape = coreSchema.shape;
    this.getDefinition = coreSchema.getDefinition;
  }

  create(
    options: Simplify<Parameters<(typeof Account)["create"]>[0]>,
  ): Promise<AccountInstance<Shape>> {
    // @ts-expect-error
    return this.coValueClass.create(options);
  }

  load<
    // @ts-expect-error
    const R extends ResolveQuery<AccountSchema<Shape>> = DefaultResolveQuery,
  >(
    id: string,
    options?: {
      loadAs?: Account | AnonymousJazzAgent;
      resolve?: RefsToResolveStrict<AccountSchema<Shape>, R>;
    },
  ): Promise<MaybeLoaded<Loaded<AccountSchema<Shape>, R>>> {
    // @ts-expect-error
    return this.coValueClass.load(
      id,
      // @ts-expect-error
      withSchemaResolveQuery(options, this.resolve),
    );
  }

  /** @internal */
  createAs(
    as: Account,
    options: {
      creationProps: { name: string };
    },
  ): Promise<AccountInstance<Shape>> {
    // @ts-expect-error
    return this.coValueClass.createAs(as, options);
  }

  unstable_merge<R extends ResolveQuery<AccountSchema<Shape>>>(
    id: string,
    options: {
      loadAs?: Account | AnonymousJazzAgent;
      resolve?: RefsToResolveStrict<AccountSchema<Shape>, R>;
      branch: BranchDefinition;
    },
  ): Promise<void> {
    // @ts-expect-error
    return unstable_mergeBranchWithResolve(this.coValueClass, id, options);
  }

  subscribe<
    const R extends RefsToResolve<Simplify<AccountInstance<Shape>>> = true,
  >(
    id: string,
    options: SubscribeListenerOptions<Simplify<AccountInstance<Shape>>, R>,
    listener: (
      value: Resolved<Simplify<AccountInstance<Shape>>, R>,
      unsubscribe: () => void,
    ) => void,
  ): () => void {
    // @ts-expect-error
    return this.coValueClass.subscribe(id, options, listener);
  }

  getMe(): Loaded<this, true> {
    // @ts-expect-error
    return this.coValueClass.getMe();
  }

  withMigration(
    migration: (
      account: Loaded<AccountSchema<Shape>>,
      creationProps?: { name: string },
    ) => void,
  ): AccountSchema<Shape, DefaultResolveQuery> {
    (this.coValueClass.prototype as Account).migrate = async function (
      this,
      creationProps,
    ) {
      // @ts-expect-error
      await migration(this, creationProps);
    };

    return this;
  }

  getCoValueClass(): typeof Account {
    return this.coValueClass;
  }

  optional(): CoOptionalSchema<this> {
    return coOptionalDefiner(this);
  }

  resolved<R extends ResolveQuery<AccountSchema<Shape>>>(
    resolveQuery: RefsToResolveStrict<AccountSchema<Shape>, R>,
  ): AccountSchema<Shape, R> {
    const coreSchema: CoreAccountSchema<Shape> = createCoreAccountSchema(
      this.shape,
    );
    const copy = new AccountSchema<Shape, R>(coreSchema, this.coValueClass);
    copy.resolve = resolveQuery as R;
    return copy;
  }
}

export function createCoreAccountSchema<Shape extends BaseAccountShape>(
  shape: Shape,
): CoreAccountSchema<Shape> {
  return {
    ...createCoreCoMapSchema(shape),
    builtin: "Account" as const,
  };
}

export type DefaultProfileShape = {
  name: z.core.$ZodString<string>;
  inbox: z.core.$ZodOptional<z.core.$ZodString>;
  inboxInvite: z.core.$ZodOptional<z.core.$ZodString>;
};

export type CoProfileSchema<
  Shape extends z.core.$ZodLooseShape = DefaultProfileShape,
  CatchAll extends AnyZodOrCoValueSchema | unknown = unknown,
> = CoMapSchema<Shape & DefaultProfileShape, CatchAll, Group>;

// less precise version to avoid circularity issues and allow matching against
export interface CoreAccountSchema<
  Shape extends z.core.$ZodLooseShape = z.core.$ZodLooseShape,
> extends Omit<CoreCoMapSchema<Shape>, "builtin"> {
  builtin: "Account";
}

export type AccountInstance<Shape extends z.core.$ZodLooseShape> = {
  readonly [key in keyof Shape]: InstanceOrPrimitiveOfSchema<Shape[key]>;
} & Account;
