import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/components/dataTable";
import type { AcceptedData } from "@/../node_modules/export-to-csv/output/lib/types";
import featuresToTableData from "@/lib/utils";

export function FeaturesTable(props: {
  featurized: ReturnType<typeof featuresToTableData>;
}) {
  const { featurized } = props;

  const columns: ColumnDef<Record<string, AcceptedData>>[] = [
    "Feature Name",
    "Raw Value",
    "Human Z-Score",
    "Yeast Z-Score",
  ].map((column) => ({
    accessorKey: column,
    cell: ({ getValue }) => {
      const value = getValue<number | string>();
      return typeof value === "number" ? value.toPrecision(4) : value;
    },
  }));
  return (
    <div className="flex flex-col gap-2 p-4 border rounded-md border-primary max-h-100 overflow-auto">
      <p className="text-xl font-bold text-center">
        Computing sequence features
      </p>
      <p className="text-center text-muted-foreground">
        View and download a CSV of your sequence features below.
      </p>
      <DataTable
        columns={columns}
        data={featurized}
        suggestedFilename="features.csv"
        downloadButtonText="Download as CSV"
      ></DataTable>
      <p className="text-center text-muted-foreground">
        Scroll vertically in the table above to see more sequence features!
      </p>
    </div>
  );
}
