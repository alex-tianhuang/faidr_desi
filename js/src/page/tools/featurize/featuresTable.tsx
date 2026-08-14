import { cn, featuresToTableData } from "@/lib/utils";
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
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { saveFile } from "@/lib/utils";
import React from "react";
import { useFeatureMetadataScroller } from "@/contexts/featureMetadataSectionContext";
import { ChevronsDown, ChevronsUp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const COLUMNS: ColumnDef<Record<string, AcceptedData>>[] = [
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

export function FeaturesTable(props: {
  featurized: ReturnType<typeof featuresToTableData>;
}) {
  const { featurized } = props;
  const scrollToFeatureMetadata = useFeatureMetadataScroller();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const table = useReactTable({
    data: featurized,
    columns: COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  });
  const handleExport = () => {
    const rows = table.getSortedRowModel().rows;
    const rowData = rows.map((row) => row.original);
    const csv = asString(generateCsv({ useKeysAsHeaders: true })(rowData));
    saveFile(csv, "features.csv");
  };
  return (
    <div className="flex flex-col gap-2 p-4 border rounded-md border-primary max-h-100 overflow-auto">
      <p className="text-xl font-bold text-center">
        Computed sequence features
      </p>
      <p className="text-center text-muted-foreground">
        View and download a CSV of your sequence features below.
      </p>

      <div className="flex flex-col overflow-hidden border rounded-md p-4 gap-2 border-input">
        <Button className="w-full" onClick={handleExport}>
          {"Download features table as CSV"}
        </Button>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sortCase = header.column.getIsSorted();
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div className="flex flex-row gap-2 items-center">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {header.column.getCanSort() && (
                            <>
                              <Tooltip>
                                <TooltipTrigger disabled={sortCase === "asc"}>
                                  <ChevronsUp
                                    className={cn(
                                      "size-5 cursor-pointer select-none",
                                      sortCase !== "asc" && "opacity-50",
                                    )}
                                    onClick={() =>
                                      table.setSorting(
                                        sortCase === "asc"
                                          ? []
                                          : [
                                              {
                                                id: header.column.id,
                                                desc: false,
                                              },
                                            ],
                                      )
                                    }
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  Click to sort column in ascending order
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger disabled={sortCase === "desc"}>
                                  <ChevronsDown
                                    className={cn(
                                      "size-5 cursor-pointer select-none",
                                      sortCase !== "desc" && "opacity-50",
                                    )}
                                    onClick={() =>
                                      table.setSorting(
                                        sortCase === "desc"
                                          ? []
                                          : [
                                              {
                                                id: header.column.id,
                                                desc: true,
                                              },
                                            ],
                                      )
                                    }
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  Click to sort column in descending order
                                </TooltipContent>
                              </Tooltip>
                            </>
                          )}
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={COLUMNS.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col items-center">
        <p className="text-center text-muted-foreground">
          <span>
            Click the <ChevronsUp className="size-5 inline" /> and{" "}
            <ChevronsDown className="size-5 inline" /> buttons by the column
            headers to sort the table.
          </span>
          <br />
          Scroll vertically in the table above to see more sequence features.
        </p>
        <div
          className="px-2 h-fit rounded-sm w-fit text-sm text-muted-foreground hover:underline hover:-translate-y-px"
          onClick={scrollToFeatureMetadata}
        >
          What are these features?
        </div>
      </div>
    </div>
  );
}
