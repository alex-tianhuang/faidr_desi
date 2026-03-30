import type { DesignIteration } from "@/features/generateMimic/types";
import type { ColumnDef } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { generateCsv, download } from "export-to-csv";
import type { AcceptedData } from "node_modules/export-to-csv/output/lib/types";
import { Button } from "./ui/button";

const columns: ColumnDef<DesignIteration>[] = [
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

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}
export function DesignIterationsTable(props: { data: DesignIteration[] }) {
  const { data } = props;
  return <DataTable columns={columns} data={data}></DataTable>;
}
function DataTable<TData extends Record<string, AcceptedData>, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
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
    const rows = table.getFilteredRowModel().rows;
    const rowData = rows.map((row) =>
      Object.fromEntries(
        Object.entries(row.original).map(([key, val]) => [
          headers[key] ?? key,
          val,
        ]),
      ),
    );
    const csv = generateCsv({ useKeysAsHeaders: true })(rowData);
    download({ filename: "designs" })(csv);
  };

  return (
    <div className="overflow-hidden rounded-md border">
      <Button onClick={handleExport}>Download CSV</Button>
      <Table>
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
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
