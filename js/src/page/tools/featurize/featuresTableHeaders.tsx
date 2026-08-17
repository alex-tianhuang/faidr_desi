import { buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { flexRender, type Header, type Table } from "@tanstack/react-table";
import { ChevronsDown, ChevronsUp } from "lucide-react";
import type { AcceptedData } from "@/../node_modules/export-to-csv/output/lib/types";
import { useFeatureMetadataScroller } from "@/contexts/featureMetadataSectionContext";

export default function FeaturesTableHeader(props: {
  table: Table<Record<string, AcceptedData>>;
  header: Header<Record<string, AcceptedData>, unknown>;
}) {
  const { header, table } = props;
  const sortCase = header.column.getIsSorted();
  const scrollToFeatureMetadata = useFeatureMetadataScroller();
  return (
    <div className="flex flex-col items-start pb-2">
      {flexRender(header.column.columnDef.header, header.getContext())}
      <div className="flex flex-row gap-2 items-center">
        {header.id === "Feature Name" && (
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
                  You can read more about the features are used in this app at
                  the bottom of this page, or by{" "}
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
        )}
        {header.id.endsWith("Z-Score") && (
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
              <div className="gap-2 flex flex-col bg-accent shadow-sm rounded-md p-2">
                <p className="font-semibold underline text-center">
                  What are "feature z-scores"?
                </p>
                <p>
                  <span className="italic">Feature Z-Scores</span> - the raw
                  feature value, minus the mean of the feature's value over a
                  reference IDRome, divided by the standard deviation of the
                  feature's value over a reference IDRome.
                </p>
                <p>
                  This column uses the{" "}
                  {header.column.id === "Human Z-Score" ? "human" : "yeast"}{" "}
                  IDRome's means and standard deviations.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        )}
        <Tooltip>
          <TooltipTrigger disabled={sortCase === "asc"}>
            <div
              className={buttonVariants({
                variant: "default",
                size: "icon-xs",
              })}
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
            >
              <ChevronsUp
                className={cn(
                  "size-4 cursor-pointer select-none",
                  sortCase !== "asc" && "opacity-50",
                )}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            Click to sort column in ascending order
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger disabled={sortCase === "desc"}>
            <div
              className={buttonVariants({
                variant: "default",
                size: "icon-xs",
              })}
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
            >
              <ChevronsDown
                className={cn(
                  "size-4 cursor-pointer select-none",
                  sortCase !== "desc" && "opacity-50",
                )}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            Click to sort column in descending order
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
