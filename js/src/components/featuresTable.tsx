import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "./dataTable";
import type { Featurized } from "@/features/featurize/types";
import type { AcceptedData } from "node_modules/export-to-csv/output/lib/types";


export function FeaturesTable(props: { data: Record<string, Featurized> }) {
  const columns: ColumnDef<Record<string, AcceptedData>>[] = Object.keys(props.data).map((featureID) => ({
    accessorKey: featureID,
    cell: ({ getValue }) => (
      <span className="block truncate">
        {getValue<number>().toPrecision(4)}
      </span>
    ),
  }))
  const data = [Object.fromEntries(Object.entries(props.data).map(([featureID, featurized]) => [
    featureID, featurized.case === "ok" ? featurized.value : featurized.value.reason
  ]))]
  return <DataTable columns={columns} data={data} suggestedFilename="features.csv"></DataTable>;
}
