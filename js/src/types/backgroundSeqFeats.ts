import { z } from "zod/mini";

export const FeatureMetadataRowSchema = z.object({
  "Feature Name": z.string(),
  "Feature Code": z.string(),
  "Short Description of Computation": z.string(),
  "Category": z.string(),
  "Long Description of Computation": z.optional(z.string()),
  "Additional Info": z.optional(z.string())
})
export type FeatureMetadataRowSchema = z.infer<typeof FeatureMetadataRowSchema>;