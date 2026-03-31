import z from "zod";
export const InitializationError = z.object({
  case: z.literal("initialization-error"),
  error: z.object({
    reason: z.string(),
  }),
  // featureCompileErrors: // PseudoMap<&'a str, StandardError>,
});

export const Initialized = z.object({
  featureDistance: z.number(),
});
export type Initialized = z.infer<typeof Initialized>;
export const Progress = z.object({
  iterations: z.array(
    z.object({
      mutation: z.object({
        from: z.string(),
        pos: z.number(),
        to: z.string(),
      }),
      sequence: z.string(),
      featureDistance: z.number(),
    }),
  ),
});
export type Progress = {
  done: boolean;
  iterations: DesignIteration[];
};
export type DesignIteration = {
    mutation: string;
    featureDistance: number;
    sequence: string;
    iteration: number;
}