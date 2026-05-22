import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/components/dataTable";
import type { Featurized } from "@/types/featurize";
import type { AcceptedData } from "@/../node_modules/export-to-csv/output/lib/types";
import type { IDRome } from "@/lib/consts";

export function FeaturesTable(props: {
  featurized: Record<string, Featurized>;
  postProcessing: IDRome | "none";
}) {
  const { featurized, postProcessing } = props;

  const postProcessingDescription =
    postProcessing !== "none"
      ? `${postProcessing} IDRome Z-scores`
      : "raw features";
  const columns: ColumnDef<Record<string, AcceptedData>>[] = Object.keys(
    featurized,
  ).map((featureID) => ({
    accessorKey: featureID,
    cell: ({ getValue }) => {
      const value = getValue<number | string>();
      return typeof value === "number" ? value.toPrecision(4) : value;
    },
  }));
  const tableData = [
    Object.fromEntries(
      Object.entries(featurized).map(([featureID, featurized]) => [
        featureID,
        featurized.case === "ok" ? featurized.value : featurized.value.reason,
      ]),
    ),
  ];
  return (
    <div className="flex flex-col gap-2 p-4 border rounded-md border-primary">
      <p className="text-xl font-bold text-center">
        Computing sequence features
      </p>
      <p className="text-center text-muted-foreground">
        View and download a CSV of your sequence features below.
      </p>
      <DataTable
        columns={columns}
        data={tableData}
        suggestedFilename="features.csv"
        downloadButtonText={`Download as CSV (${postProcessingDescription})`}
      ></DataTable>
      <p className="text-center text-muted-foreground">
        Scroll horizontally in the table above to see more sequence features!
      </p>
    </div>
  );
}
