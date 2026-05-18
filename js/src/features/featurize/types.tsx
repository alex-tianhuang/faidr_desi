import z from "zod";
export const StandardError = z.object({
  reason: z.string(),
});
export const InitializationError = z.object({
  case: z.literal("initialization-error"),
  reason: z.string(),
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
export const EndpointResult = z.object({
  data: z.record(z.string(), Featurized)
});
export type EndpointResult = z.infer<typeof EndpointResult>;
