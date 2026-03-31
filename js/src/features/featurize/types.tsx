import z from "zod";
export const StandardError = z.object({
  reason: z.string(),
});
export const Initialized = z.object({
  featureCompileErrors: z.record(z.string(), StandardError),
})
export const InitializationError = z.object({
  case: z.literal("initialization-error"),
  error: z.object({
    reason: z.string(),
  }),
});
export const Featurized = z.discriminatedUnion("case", [
  z.object({
    case: z.literal("ok"),
    value: z.number(),
  }),
  z.object({
    case: z.literal("error"),
    value: StandardError,
  }),
]);
export type Featurized = z.infer<typeof Featurized>;
export const Progress = z.object({
  sequenceByFeatureMatrix: z.object({
    0: z.record(z.string(), Featurized),
  }),
});
export type Progress = z.infer<typeof Progress>;
