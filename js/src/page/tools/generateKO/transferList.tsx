import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../components/ui/tooltip";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

/** Ripped from https://github.com/shadcn-ui/ui/issues/2114#issuecomment-2308012873 */
export default function TransferList<
  Item extends { selected: boolean; propKey: string; searchKey: string },
>(props: {
  disabled: boolean;
  renderItem: (
    item: Item,
    toggleSelect: () => void,
    whichList: "left" | "right",
  ) => React.ReactNode;
  leftListState: [Item[], (_: Item[]) => void];
  leftListTitle: string;
  rightListState: [Item[], (_: Item[]) => void];
  rightListTitle: string;
  compareFn: (a: Item, b: Item) => number;
  overrideLeftChevronTooltipState: [boolean, (_: boolean) => void];
}) {
  const {
    disabled,
    leftListState: [leftList, setLeftList],
    leftListTitle,
    rightListState: [rightList, setRightList],
    rightListTitle,
    renderItem,
    compareFn,
    overrideLeftChevronTooltipState: [
      overrideLeftChevronTooltip,
      setOverrideLeftChevronTooltip,
    ],
  } = props;
  const disabledLeft = useMemo(
    () => !Boolean(leftList.find((item) => item.selected)),
    [leftList],
  );
  const disabledRight = useMemo(
    () => !Boolean(rightList.find((item) => item.selected)),
    [rightList],
  );
  const [leftSearch, setLeftSearch] = React.useState("");
  const [rightSearch, setRightSearch] = React.useState("");
  const moveToRight = () => {
    const selectedItems = leftList.filter((item) => item.selected);
    setRightList(
      [
        ...rightList,
        ...selectedItems.map((item) => ({ ...item, selected: false })),
      ].sort(compareFn),
    );
    setLeftList(leftList.filter((item) => !item.selected));
  };

  const moveToLeft = () => {
    const selectedItems = rightList.filter((item) => item.selected);
    setLeftList(
      [
        ...leftList,
        ...selectedItems.map((item) => ({ ...item, selected: false })),
      ].sort(compareFn),
    );
    setRightList(rightList.filter((item) => !item.selected));
  };

  const toggleSelection = (
    list: Item[],
    setList: (_: Item[]) => void,
    propKey: string,
  ) => {
    const updatedList = list.map((item) => {
      if (item.propKey === propKey) {
        return { ...item, selected: !item.selected };
      }
      return item;
    });

    setList(updatedList);
  };
  const renderLeftItem = (item: Item) =>
    renderItem(
      item,
      () => toggleSelection(leftList, setLeftList, item.propKey),
      "left",
    );
  const renderRightItem = (item: Item) =>
    renderItem(
      item,
      () => toggleSelection(rightList, setRightList, item.propKey),
      "right",
    );

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex flex-row gap-4 w-full">
        <div className="w-1/2 text-center border-b">{leftListTitle}</div>
        <div className="w-1/2 text-center border-b">{rightListTitle}</div>
      </div>
      <div className="flex flex-row gap-4 w-full">
        <div className="w-[calc(50%-8px)] flex flex-col">
          <div className="flex items-center justify-between">
            <Input
              placeholder="Search"
              className="rounded-none focus-visible:ring-0 focus-visible:border-blue-500"
              value={leftSearch}
              onChange={(e) => setLeftSearch(e.target.value)}
            />
            <Tooltip
              key={overrideLeftChevronTooltip.toString()}
              open={overrideLeftChevronTooltip || undefined}
            >
              <TooltipTrigger disabled={disabled || disabledLeft}>
                <Button
                  disabled={disabled || disabledLeft}
                  className="rounded-none border-l-0"
                  onClick={() => {
                    setOverrideLeftChevronTooltip(false);
                    moveToRight();
                  }}
                  size="icon"
                  // variant="default"
                >
                  <ChevronsRight />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Click me to move selected items right!
              </TooltipContent>
            </Tooltip>
          </div>
          <ul className="h-50 border p-1.5 overflow-y-scroll">
            {leftList
              .filter((item) =>
                item.searchKey.toLowerCase().includes(leftSearch.toLowerCase()),
              )
              .map(renderLeftItem)}
          </ul>
        </div>
        <div className="w-[calc(50%-8px)] flex flex-col">
          <div className="flex items-center justify-between">
            <Tooltip>
              <TooltipTrigger disabled={disabled || disabledRight}>
                <Button
                  disabled={disabled || disabledRight}
                  className="rounded-none border-r-0"
                  onClick={moveToLeft}
                  size="icon"
                >
                  <ChevronsLeft />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Click me to move selected items left!
              </TooltipContent>
            </Tooltip>
            <Input
              placeholder="Search"
              className="rounded-none focus-visible:ring-0 focus-visible:border-blue-500"
              value={rightSearch}
              onChange={(e) => setRightSearch(e.target.value)}
            />
          </div>
          <ul className="h-50 border p-1.5 overflow-y-scroll">
            {rightList
              .filter((item) =>
                item.searchKey
                  .toLowerCase()
                  .includes(rightSearch.toLowerCase()),
              )
              .map(renderRightItem)}
          </ul>
        </div>
      </div>
    </div>
  );
}
