import z from "zod";
export const InitializationError = z.object({
  case: z.literal("initialization-error"),
  reason: z.string(),
});

export const Initialized = z.object({
  featureDistance: z.number(),
  sequence: z.string()
});
export type Initialized = z.infer<typeof Initialized>;
export const Mutation = z.object({
  from: z.string(),
  pos: z.number(),
  to: z.string(),
});
export const Progress = z.object({
  iterations: z.array(
    z.object({
      mutation: Mutation,
      sequence: z.string(),
      featureDistance: z.number(),
    }),
  ),
  currentMutation: Mutation.optional(),
});
export type Mutation = z.infer<typeof Mutation>
export type Progress = {
  done: boolean;
  currentMutation: Mutation | null;
  iterations: DesignIteration[];
};
export type DesignIteration = {
  mutation: string;
  featureDistance: number;
  sequence: string;
  iteration: number;
};

export type ProgressRaw = {
  done: boolean;
  currentMutation: Mutation | undefined;
  iterations: z.infer<typeof Progress>["iterations"];
};