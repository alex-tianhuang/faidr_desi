import { Button, buttonVariants } from "@/components/ui/button";
import {
  FEATURE_MEANS_FOR_ZSCORE,
  FEATURE_WEIGHTS,
  type IDRome,
} from "@/lib/consts";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type CellContext,
  type ColumnDef,
} from "@tanstack/react-table";
import type { AcceptedData } from "@/../node_modules/export-to-csv/output/lib/types";
import { asString, generateCsv } from "export-to-csv";
import { cn, saveFile } from "@/lib/utils";
import React from "react";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useFeatureMetadataScroller } from "@/contexts/featureMetadataSectionContext";

export default function DesignedSequenceFeaturesTable(props: {
  initialFeatureVector: Record<string, number>;
  designFeatureVector: Record<string, number>;
  KOFeatureTargets: Record<string, number>;
  featureTargets: Record<string, number>;
  idrome: IDRome;
}) {
  const {
    initialFeatureVector,
    designFeatureVector,
    KOFeatureTargets,
    featureTargets,
    idrome,
  } = props;
  const tableData = React.useMemo(
    () =>
      VectorsToTableData({
        initialFeatureVector,
        designFeatureVector,
        KOFeatureTargets,
        featureTargets,
        idrome,
      }),
    [
      initialFeatureVector,
      designFeatureVector,
      KOFeatureTargets,
      featureTargets,
      idrome,
    ],
  );
  const zscoreKind = idrome === "human" ? "Human Z-Score" : "Yeast Z-Score";
  const columns: ColumnDef<Record<string, AcceptedData>>[] = [
    {
      accessorKey: "Feature Name",
    },
    ...["Initial Value", "Output Design Value", "Design Target"].map(
      (prefix) => ({
        accessorKey: `${prefix} (${zscoreKind})`,
        cell: ({
          getValue,
        }: CellContext<Record<string, AcceptedData>, unknown>) =>
          getValue<number>().toPrecision(3),
      }),
    ),
    ...["Initial Value", "Output Design Value", "Design Target"].map(
      (prefix) => ({
        accessorKey: `${prefix} (Raw Value)`,
        cell: ({
          getValue,
        }: CellContext<Record<string, AcceptedData>, unknown>) =>
          getValue<number>().toPrecision(3),
      }),
    ),
  ];
  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  const scrollToFeatureMetadata = useFeatureMetadataScroller();
  const handleExport = () => {
    const rows = table.getCoreRowModel().rows;
    const rowData = rows.map((row) => row.original);
    const csv = asString(generateCsv({ useKeysAsHeaders: true })(rowData));
    saveFile(csv, "ko_features.csv");
  };
  return (
    <div className="flex flex-col gap-2 border p-4 rounded-md">
      <Button className="w-full h-auto py-1.5" onClick={handleExport}>
        <span className="min-w-0 text-wrap">
          Download feature comparison table as CSV
        </span>
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
            {table.getHeaderGroups().map((headerGroup) => {
              const headerFeatureName = headerGroup.headers[0];
              const headerZscores = headerGroup.headers.slice(1, 4);
              const headerRawValues = headerGroup.headers.slice(4, 7);
              return (
                <TableRow key={headerGroup.id}>
                  {[
                    <TableHead
                      className="sticky top-0 bg-background shadow-sm"
                      key="Feature Name"
                    >
                      {headerFeatureName.isPlaceholder ? null : (
                        <div className="flex flex-row gap-2 items-center">
                          {flexRender(
                            headerFeatureName.column.columnDef.header,
                            headerFeatureName.getContext(),
                          )}
                          <Popover>
                            <PopoverTrigger
                              className={cn(
                                buttonVariants({
                                  variant: "default",
                                  size: "icon-xs",
                                }),
                                "text-xs",
                              )}
                            >
                              ?
                            </PopoverTrigger>
                            <PopoverContent>
                              <div className="flex flex-col gap-2 bg-accent shadow-sm p-2 rounded-md">
                                <p className="text-center font-semibold underline">
                                  What are these features?
                                </p>
                                <p>
                                  You can read more about the features are used
                                  in this app at the bottom of this page, or by{" "}
                                  <span
                                    className="font-semibold hover:underline"
                                    onClick={scrollToFeatureMetadata}
                                  >
                                    clicking here
                                  </span>
                                  .
                                </p>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}
                    </TableHead>,
                  ].concat(
                    [...headerZscores.entries()].map(([i, header]) => (
                      <TableHead
                        className="sticky top-0 bg-background shadow-sm"
                        key={header.id}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              <>
                                {
                                  [
                                    "Initial Value",
                                    "Output Design Value",
                                    "Design Target",
                                  ][i]
                                }
                                <br />({zscoreKind})
                              </>,
                              header.getContext(),
                            )}
                      </TableHead>
                    )),
                    [...headerRawValues.entries()].map(([i, header]) => (
                      <TableHead
                        className="sticky top-0 bg-background shadow-sm"
                        key={header.id}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              <>
                                {
                                  [
                                    "Initial Value",
                                    "Output Design Value",
                                    "Design Target",
                                  ][i]
                                }
                                <br />
                                (Raw Value)
                              </>,
                              header.getContext(),
                            )}
                      </TableHead>
                    )),
                  )}
                </TableRow>
              );
            })}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
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
            ))}
          </TableBody>
        </table>
      </div>
    </div>
  );
}
function VectorsToTableData(props: {
  initialFeatureVector: Record<string, number>;
  designFeatureVector: Record<string, number>;
  KOFeatureTargets: Record<string, number>;
  featureTargets: Record<string, number>;
  idrome: IDRome;
}) {
  const {
    initialFeatureVector,
    designFeatureVector,
    KOFeatureTargets,
    featureTargets,
    idrome,
  } = props;
  const KOFeatureNames = [...Object.keys(KOFeatureTargets)];
  const preserveFeatureNames = [...Object.keys(featureTargets)].filter(
    (featureName) => !(featureName in KOFeatureTargets),
  );
  const zscoreKind = idrome === "human" ? "Human Z-Score" : "Yeast Z-Score";
  const featureMeans = FEATURE_MEANS_FOR_ZSCORE[idrome];
  const featureWeights = FEATURE_WEIGHTS[idrome];
  return ([] as Record<string, AcceptedData>[]).concat(
    ...[KOFeatureNames, preserveFeatureNames].map((featureNames) => {
      const rows = featureNames.map((featureName) => ({
        ["Feature Name"]: featureName,
        [`Initial Value (${zscoreKind})`]:
          (initialFeatureVector[featureName] - featureMeans[featureName]) *
          featureWeights[featureName],
        [`Output Design Value (${zscoreKind})`]:
          (designFeatureVector[featureName] - featureMeans[featureName]) *
          featureWeights[featureName],
        [`Design Target (${zscoreKind})`]:
          (featureTargets[featureName] - featureMeans[featureName]) *
          featureWeights[featureName],
        ["Initial Value (Raw Value)"]: initialFeatureVector[featureName],
        ["Output Design Value (Raw Value)"]: designFeatureVector[featureName],
        ["Design Target (Raw Value)"]: featureTargets[featureName],
      }));
      return rows.sort((a, b) => {
        const [aK, bK] = [a, b].map((row) =>
          Math.abs(
            (row[`Output Design Value (${zscoreKind})`] as number) -
              (row[`Design Target (${zscoreKind})`] as number),
          ),
        );
        return bK - aK;
      });
    }),
  );
}
