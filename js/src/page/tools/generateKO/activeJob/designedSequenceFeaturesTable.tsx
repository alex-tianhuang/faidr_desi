import { Button } from "@/components/ui/button";
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
import { saveFile } from "@/lib/utils";
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    ...["Initial Value", "Design Value", "Design Target"].map((prefix) => ({
      accessorKey: `${prefix} (${zscoreKind})`,
      cell: ({
        getValue,
      }: CellContext<Record<string, AcceptedData>, unknown>) =>
        getValue<number>().toPrecision(3),
    })),
    ...["Initial Value", "Design Value", "Design Target"].map((prefix) => ({
      accessorKey: `${prefix} (Raw Value)`,
      cell: ({
        getValue,
      }: CellContext<Record<string, AcceptedData>, unknown>) =>
        getValue<number>().toPrecision(3),
    })),
  ];
  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  const handleExport = () => {
    const rows = table.getCoreRowModel().rows;
    const rowData = rows.map((row) => row.original);
    const csv = asString(generateCsv({ useKeysAsHeaders: true })(rowData));
    saveFile(csv, "ko_features.csv");
  };
  return (
    <div className="flex flex-col overflow-hidden gap-2 max-h-100 border p-4 rounded-md">
      <Button className="w-full" onClick={handleExport}>
        {"Download feature comparison table as CSV"}
      </Button>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => {
            const headerFeatureName = headerGroup.headers[0];
            const headerZscores = headerGroup.headers.slice(1, 4);
            const headerRawValues = headerGroup.headers.slice(4, 7);
            return (
              <TableRow key={headerGroup.id}>
                {[
                  <TableHead key="Feature Name">
                    {headerFeatureName.isPlaceholder
                      ? null
                      : flexRender(
                          headerFeatureName.column.columnDef.header,
                          headerFeatureName.getContext(),
                        )}
                  </TableHead>,
                ].concat(
                  [...headerZscores.entries()].map(([i, header]) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            <>
                              {
                                [
                                  "Initial Value",
                                  "Design Value",
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
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            <>
                              {
                                [
                                  "Initial Value",
                                  "Design Value",
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
      </Table>
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
        [`Design Value (${zscoreKind})`]:
          (designFeatureVector[featureName] - featureMeans[featureName]) *
          featureWeights[featureName],
        [`Design Target (${zscoreKind})`]:
          (featureTargets[featureName] - featureMeans[featureName]) *
          featureWeights[featureName],
        ["Initial Value (Raw Value)"]: initialFeatureVector[featureName],
        ["Design Value (Raw Value)"]: designFeatureVector[featureName],
        ["Design Target (Raw Value)"]: featureTargets[featureName],
      }));
      return rows.sort((a, b) => {
        const [aK, bK] = [a, b].map((row) =>
          Math.abs(
            (row[`Design Value (${zscoreKind})`] as number) -
              (row[`Design Target (${zscoreKind})`] as number),
          ),
        );
        return bK - aK;
      });
    }),
  );
}
