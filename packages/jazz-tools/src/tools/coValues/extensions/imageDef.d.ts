import { z } from "../../implementation/zodSchema/zodReExport.js";
import { Loaded } from "../../internal.js";
/** @category Media */
export declare const ImageDefinition: import("../../internal.js").WithHelpers<
  import("../../internal.js").CoMapSchema<
    {
      originalSize: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
      placeholderDataURL: z.ZodOptional<z.ZodString>;
    },
    z.core.$catchall<import("../../internal.js").FileStreamSchema>,
    import("../account.js").Account | import("../group.js").Group
  >,
  {
    highestResAvailable(
      imageDef: Loaded<
        import("../../internal.js").CoMapSchema<
          {
            originalSize: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
            placeholderDataURL: z.ZodOptional<z.ZodString>;
          },
          z.core.$catchall<import("../../internal.js").FileStreamSchema>,
          import("../account.js").Account | import("../group.js").Group
        >
      >,
      options?: {
        maxWidth?: number;
        targetWidth?: number;
      },
    ):
      | {
          res: `${number}x${number}`;
          stream: import("../coFeed.js").BinaryCoStream;
        }
      | undefined;
  }
>;
export type ImageDefinition = Loaded<typeof ImageDefinition>;
