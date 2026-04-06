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
    cell: ({ getValue }) => (
      getValue<number>().toPrecision(4)
    ),
  },
  {
    accessorKey: "mutation",
    header: "Mutation",
  },
  {
    accessorKey: "sequence",
    header: "Sequence",
    cell: ({ getValue }) => (
      <span className="block max-w-50 truncate">
        {getValue<string>()}
      </span>
    ),
  },
];

export function DesignIterationsTable(props: { data: DesignIteration[] }) {
  const { data } = props;
  return (
    <DataTable columns={COLUMNS} data={data} suggestedFilename="design_iterations.csv" downloadButtonText="Download as CSV"></DataTable>
  );
}
