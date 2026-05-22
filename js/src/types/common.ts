import z from "zod"
export const Mutation = z.object({
  from: z.string(),
  pos: z.number(),
  to: z.string(),
});
export type Mutation = z.infer<typeof Mutation>
export const DesignProgress = z.object({
  iterations: z.array(
    z.object({
      mutation: Mutation,
      sequence: z.string(),
      featureDistance: z.number(),
    }),
  ),
  currentMutation: Mutation.optional(),
});
export type DesignProgress = z.infer<typeof DesignProgress>;

export type DesignIteration = {
  mutation: string;
  featureDistance: number;
  sequence: string;
  iteration: number;
};

export type DesignStatus = {
  done: boolean;
  currentMutation: Mutation | null;
  iterations: DesignIteration[];
};
