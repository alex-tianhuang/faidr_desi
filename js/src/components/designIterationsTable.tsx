import type { DesignIteration } from "@/types/common";
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
    cell: ({ getValue }) => getValue<number>().toPrecision(4),
  },
  {
    accessorKey: "mutation",
    header: "Mutation",
  },
  {
    accessorKey: "sequence",
    header: "Sequence",
    cell: ({ getValue }) => (
      <span className="block max-w-50 truncate">{getValue<string>()}</span>
    ),
  },
];

export function DesignIterationsTable(props: { iterations: DesignIteration[] }) {
  const { iterations } = props;
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
        {iterations.length > 0
          ? `Show all iterations (${iterations.length - 1})`
          : "Iterations will appear here"}
      </summary>
      {iterations.length > 0 ? <div className="mt-2">
        <DataTable
          columns={COLUMNS}
          data={iterations}
          suggestedFilename="design_iterations.csv"
          downloadButtonText="Download as CSV"
        ></DataTable>
      </div> : <div className="mt-2 p-4 text-center border border-input rounded-md">Iterations will appear here (no iterations yet)</div>}
    </details>
  );
}
