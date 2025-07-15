import { z } from "../zodReExport.js";

/**
 * "Core" CoValue schemas are necessary to avoid circularity issues when
 * defining schemas. This is similar to how Zod's "core" schemas are used.
 *
 * They are not meant to be used directly, but rather to be extended by
 * the actual CoValue schemas.
 */
export interface CoreCoValueSchema {
  /**
   * Used for discriminating between different CoValue schemas.
   */
  builtin: string;

  /**
   * Returns the Zod schema that this CoValue schema is based on.
   */
  getZodSchema: () => z.core.$ZodType;
}
