import type { DesignIteration } from "@/types/common";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { asString, generateCsv } from "export-to-csv";
import { Button } from "./ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { saveFile } from "@/lib/utils";

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

export function DesignIterationsTable(props: {
  iterations: DesignIteration[];
}) {
  const { iterations } = props;
  const table = useReactTable({
    data: iterations,
    columns: COLUMNS,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleExport = () => {
    const headers = table.getVisibleFlatColumns().reduce(
      (acc, col) => {
        const header = col.columnDef.header;
        if (typeof header === "string") {
          acc[col.id] = header;
        }
        return acc;
      },
      {} as Record<string, string>,
    );
    const rows = table.getCoreRowModel().rows;
    const rowData = rows.map((row) =>
      Object.fromEntries(
        Object.entries(row.original).map(([key, val]) => [
          headers[key] ?? key,
          val,
        ]),
      ),
    );
    const csv = asString(generateCsv({ useKeysAsHeaders: true })(rowData));
    saveFile(csv, "design_iterations.csv");
  };
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
        {iterations.length > 0
          ? `Show all iterations (${iterations.length - 1})`
          : "Iterations will appear here"}
      </summary>
      {iterations.length > 0 ? (
        <div className="mt-2 flex flex-col gap-2">
          <div className="flex flex-col overflow-hidden border rounded-md p-4 gap-2 border-input max-h-100">
            <Button className="w-full" onClick={handleExport}>
              {"Download design iterations as CSV"}
            </Button>
            <Table className="max-h-100 overflow-auto">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="text-base text-center text-muted-foreground">
            Scroll vertically in the table above to see all the iterations!
          </div>
        </div>
      ) : (
        <div className="mt-2 p-4 text-center border border-input rounded-md">
          Iterations will appear here (no iterations yet)
        </div>
      )}
    </details>
  );
}
