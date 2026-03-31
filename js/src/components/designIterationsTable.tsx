import type { DesignIteration } from "@/features/generateMimic/types";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "./dataTable";

const COLUMNS: ColumnDef<DesignIteration>[] = [
  {
    accessorKey: "iteration",
    header: "Iteration",
  },
  {
    accessorKey: "featureDistance",
    header: "Feature Distance",
  },
  {
    accessorKey: "mutation",
    header: "Mutation",
  },
  {
    accessorKey: "sequence",
    header: "Sequence",
  },
];


export function DesignIterationsTable(props: { data: DesignIteration[] }) {
  const { data } = props;
  return <DataTable columns={COLUMNS} data={data} filename="designs"></DataTable>;
}
