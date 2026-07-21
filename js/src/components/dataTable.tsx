import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { asString, generateCsv } from "export-to-csv";
import type { AcceptedData } from "@/../node_modules/export-to-csv/output/lib/types";
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
import React from "react";

export default function DataTable<TData extends Record<string, AcceptedData>, TValue>(props: {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  suggestedFilename: string;
  downloadButtonText: string;
}) {
  const { columns, data, suggestedFilename, downloadButtonText } = props;
  const [sorting, setSorting] = React.useState<SortingState>([])
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting
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
    const rows = table.getSortedRowModel().rows;
    const rowData = rows.map((row) =>
      Object.fromEntries(
        Object.entries(row.original).map(([key, val]) => [
          headers[key] ?? key,
          val,
        ]),
      ),
    );
    const csv = asString(generateCsv({ useKeysAsHeaders: true })(rowData));
    saveFile(csv, suggestedFilename)
  };
// {table.getHeaderGroups().map((headerGroup) => (
//             <tr key={headerGroup.id}>
//               {headerGroup.headers.map((header) => {
//                 return (
//                   <th key={header.id} colSpan={header.colSpan}>
                    
//                   </th>
//                 )
//               })}
//             </tr>
//           ))}
  return (
    <div className="flex flex-col overflow-hidden border rounded-md items-end p-4 gap-2 border-input">
      <Button className="w-full" onClick={handleExport}>{downloadButtonText}</Button>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? 'cursor-pointer select-none'
                            : ''
                        }
                        onClick={header.column.getToggleSortingHandler()}
                        title={
                          header.column.getCanSort()
                            ? header.column.getNextSortingOrder() === 'asc'
                              ? 'Sort ascending'
                              : header.column.getNextSortingOrder() === 'desc'
                                ? 'Sort descending'
                                : 'Clear sort'
                            : undefined
                        }
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {{
                          asc: ' 🔼',
                          desc: ' 🔽',
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
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
