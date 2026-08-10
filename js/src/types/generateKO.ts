import * as z from "zod/mini";
export const InitializationError = z.object({
  case: z.literal("initialization-error"),
  reason: z.string(),
});

export const Initialized = z.object({
  featureDistance: z.number(),
});
export type Initialized = z.infer<typeof Initialized>;

export type FeatureCardData = {
  propKey: string;
  selected: boolean;
  searchKey: string;
  value: number;
};