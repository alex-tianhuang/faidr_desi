import DataTable from "./dataTable";
import type { Featurized } from "@/features/featurize/types";


export function FeaturesTable(props: { data: Record<string, Featurized> }) {
  const columns = Object.keys(props.data).map((feature_id) => ({
    accessorKey: feature_id,
  }))
  const data = [Object.fromEntries(Object.entries(props.data).map(([feature_id, featurized]) => [
    feature_id, featurized.case === "ok" ? featurized.value : featurized.value.reason
  ]))]
  return <DataTable columns={columns} data={data} filename="features"></DataTable>;
}
