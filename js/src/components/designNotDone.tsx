import Loading from "@/components/loading";
import { formatTimeElapsed, mutationToString } from "@/lib/utils";
import type { Mutation } from "@/types/common";

export default function DesignNotDone(props: {
  currentMutation: Mutation | null;
  startTimestamp: number;
}) {
  const { currentMutation, startTimestamp } = props;
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loading>
        [{formatTimeElapsed(Date.now() - startTimestamp)}]{" "}
        {currentMutation
          ? `Trying ${mutationToString(currentMutation)}...`
          : "Starting..."}
      </Loading>
    </div>
  );
}
