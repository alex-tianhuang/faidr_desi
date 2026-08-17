import { featuresToTableData } from "@/lib/utils";
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
import FeaturesTableHeader from "./featuresTableHeaders";

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
    <div className="flex flex-col gap-2 p-4 border rounded-md border-primary">
      <p className="text-xl font-bold text-center">
        Computed sequence features
      </p>
      <p className="text-center text-muted-foreground">
        View and download a CSV of your sequence features below.
      </p>

      <div className="flex flex-col border rounded-md p-4 gap-2 border-input">
        <Button className="w-full" onClick={handleExport}>
          {"Download features table as CSV"}
        </Button>
        <div
          data-slot="table-container"
          className="relative w-full max-h-96 overflow-auto"
        >
          {/* 
          Ideally one would use ReactTable's <Table/> to keep with the capitalization.
          Unfortunately this wraps the table in an overflow-scroll element which is
          not max-h-96, which means the <th/> elements won't stay at the top of the table.
          Drats!
          */}
          <table data-slot="table" className="w-full caption-bottom text-sm">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      className="sticky top-0 bg-background shadow-sm"
                      key={header.id}
                    >
                      {header.isPlaceholder ? null : (
                        <FeaturesTableHeader
                          header={header}
                          table={table}
                        ></FeaturesTableHeader>
                      )}
                    </TableHead>
                  ))}
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
          </table>
        </div>
      </div>
      <div className="flex flex-col gap-2 items-start">
        <div
          className="self-center px-2 h-fit rounded-sm w-fit text-sm text-muted-foreground hover:underline hover:-translate-y-px"
          onClick={scrollToFeatureMetadata}
        >
          What are these features?
        </div>
        <p className="text-justify text-muted-foreground">
          Scroll vertically in the table above to see more sequence features,
          and scroll horizontally to see sequence features as different
          z-scores.
        </p>
        <p className="text-justify text-muted-foreground">
          Click the <ChevronsUp className="size-5 inline" /> and{" "}
          <ChevronsDown className="size-5 inline" /> buttons by the column
          headers to sort the table.
        </p>
      </div>
    </div>
  );
}
