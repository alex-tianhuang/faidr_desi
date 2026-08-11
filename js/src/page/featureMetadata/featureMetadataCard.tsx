import type { FeatureMetadataRowSchema } from "@/types/featureMetadata";

export default function FeatureMetadataCard(props: {
  data: FeatureMetadataRowSchema;
}) {
  const { data } = props;
  return (
    <div className="flex flex-col rounded-md border border-input gap-2 px-2 pt-2 pb-4.5 max-w-full bg-card shadow-sm hover:-translate-y-px h-full">
      <div className="flex flex-row gap-2 max-w-full overflow-scroll items-center pb-1">
        <div className="border rounded-sm bg-accent text-muted-foreground px-2 shadow-sm">
          {data["Feature Code"]}
        </div>
        <div className="h-fit text-xs border rounded-sm bg-background text-muted-foreground shadow-xs text-nowrap px-2 py-1">
          {data["Category"]}
        </div>
      </div>
      <div className="text-lg font-semibold underline text-card-foreground px-2.5 overflow-auto">
        {data["Feature Name"]}
      </div>
      <div className="text-sm px-2.5 overflow-auto">
        {data["Short Description of Computation"]}
      </div>
      {data["Long Description of Computation"] && (
        <details>
          <summary className="text-sm">Expanded definition</summary>
          <div className="whitespace-pre-line text-sm mt-2 border rounded-sm p-2 bg-accent">
            {data["Long Description of Computation"]}
          </div>
        </details>
      )}
      {data["Additional Info"] && (
        <details>
          <summary className="text-sm">Additional Information</summary>
          <div className="whitespace-pre-line text-sm mt-2 border rounded-sm p-2 bg-accent">
            {data["Additional Info"]}
          </div>
        </details>
      )}
    </div>
  );
}
