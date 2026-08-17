import type { DesignIteration } from "@/types/common";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { asString, generateCsv } from "export-to-csv";
import { Button, buttonVariants } from "./ui/button";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { cn, saveFile } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { NUM_FEATURES } from "@/lib/consts";

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
    cell: ({ getValue }) => getValue<string>(),
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
        <div className="flex flex-col gap-2 border rounded-md p-4 mt-2">
          <p className="text-md font-bold underline">Design iterations</p>
          <p className="text-center text-muted-foreground">
            See the point mutations made by the greedy feature optimizer at each
            step.
          </p>
          <div className="flex flex-col border rounded-md p-4 gap-2 border-input">
            <Button className="w-full" onClick={handleExport}>
              {"Download design iterations as CSV"}
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
              <table
                data-slot="table"
                className="w-full caption-bottom text-sm"
              >
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead
                            className="sticky top-0 bg-background shadow-sm"
                            key={header.id}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                            {header.column.columnDef.header ===
                              "Feature Distance" && (
                              <Popover>
                                <PopoverTrigger
                                  className={cn(
                                    buttonVariants({
                                      variant: "default",
                                      size: "icon-xs",
                                    }),
                                    "ml-2 text-xs",
                                  )}
                                >
                                  ?
                                </PopoverTrigger>
                                <PopoverContent>
                                  <div className="gap-2 flex flex-col bg-accent shadow-sm rounded-md p-2">
                                    <p className="font-semibold underline text-center">
                                      What is "feature distance"?
                                    </p>
                                    <p>
                                      <span className="italic">
                                        Feature Distance
                                      </span>{" "}
                                      - the euclidean distance between two
                                      vectors of feature z-scores (feature
                                      vectors) in {NUM_FEATURES} dimensions.
                                    </p>
                                    <p>
                                      Our design approach for feature fitting
                                      greedily minimizes the feature distance
                                      between the designed IDR's feature vector
                                      and a target feature vector.
                                    </p>
                                  </div>
                                </PopoverContent>
                              </Popover>
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
              </table>
            </div>
          </div>
          <p className="text-muted-foreground">
            Scroll vertically in the table above to see all the iterations.
          </p>
          <p className="text-muted-foreground">
            On small screens, you may need to scroll horizontally to see the
            mutations and sequence at each iteration.
          </p>
        </div>
      ) : (
        <div className="mt-2 p-4 text-center border border-input rounded-md">
          Iterations will appear here (no iterations yet)
        </div>
      )}
    </details>
  );
}
