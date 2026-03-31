import z from "zod";
export const InitializationError = z.object({
  case: z.literal("initialization-error"),
  error: z.object({
    reason: z.string(),
  }),
  // featureCompileErrors: // PseudoMap<&'a str, StandardError>,
});

export const Featurized = z.discriminatedUnion("case", [
  z.object({
    case: z.literal("ok"),
    value: z.number(),
  }),
  z.object({
    case: z.literal("error"),
    value: z.object({
      reason: z.string()
    }),
  }),
]);
export type Featurized = z.infer<typeof Featurized>;
export const Progress = z.object({
  sequenceByFeatureMatrix: z.object({
    0: z.record(z.string(), Featurized),
  }),
});
export type Progress = z.infer<typeof Progress>;

