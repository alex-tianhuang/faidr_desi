import DataTable from "./dataTable";
import type { Featurized } from "@/features/featurize/types";


export function FeaturesTable(props: { data: Record<string, Featurized> }) {
  const columns = Object.keys(props.data).map((featureID) => ({
    accessorKey: featureID,
  }))
  const data = [Object.fromEntries(Object.entries(props.data).map(([featureID, featurized]) => [
    featureID, featurized.case === "ok" ? featurized.value : featurized.value.reason
  ]))]
  return <DataTable columns={columns} data={data} filename="features"></DataTable>;
}
