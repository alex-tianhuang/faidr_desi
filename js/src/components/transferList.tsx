"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronsLeft, ChevronsRight } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import React, { useMemo } from "react";

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
}) {
  const {
    disabled,
    leftListState: [leftList, setLeftList],
    leftListTitle,
    rightListState: [rightList, setRightList],
    rightListTitle,
    renderItem,
    compareFn,
  } = props;
  const disabledLeft = useMemo(() => !Boolean(leftList.find(item => item.selected)), [leftList])
  const disabledRight = useMemo(() => !Boolean(rightList.find(item => item.selected)), [rightList])
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
    <div className="flex gap-4">
      <div className="flex flex-col gap-2 w-1/2 bg-background">
        <div className="w-full text-center border-b">{leftListTitle}</div>
        <div className="flex items-center justify-between">
          <Input
            placeholder="Search"
            className="rounded-br-none rounded-bl-none rounded-tr-none focus-visible:ring-0 focus-visible:border-blue-500"
            value={leftSearch}
            onChange={(e) => setLeftSearch(e.target.value)}
          />
          <Button
            disabled={disabled || disabledLeft}
            className="rounded-tl-none rounded-bl-none rounded-br-none border-l-0"
            onClick={moveToRight}
            size="icon"
            // variant="default"
          >
            <HugeiconsIcon icon={ChevronsRight}></HugeiconsIcon>
          </Button>
        </div>
        <ul className="h-50 border-l border-r border-b p-1.5 overflow-y-scroll">
          {leftList
            .filter((item) =>
              item.searchKey.toLowerCase().includes(leftSearch.toLowerCase()),
            )
            .map(renderLeftItem)}
        </ul>
      </div>

      <div className="flex flex-col gap-2 w-1/2 bg-background">
        <div className="w-full text-center border-b">{rightListTitle}</div>
        <div className="flex items-center justify-between">
          <Button
            disabled={disabled || disabledRight}
            className="rounded-tr-none rounded-br-none rounded-bl-none border-r-0"
            onClick={moveToLeft}
            size="icon"
          >
            <HugeiconsIcon icon={ChevronsLeft}></HugeiconsIcon>
          </Button>
          <Input
            placeholder="Search"
            className="rounded-bl-none rounded-br-none rounded-tl-none focus-visible:ring-0 focus-visible:border-blue-500"
            value={rightSearch}
            onChange={(e) => setRightSearch(e.target.value)}
          />
        </div>
        <ul className="h-50 border-l border-r border-b p-1.5 overflow-y-scroll">
          {rightList
            .filter((item) =>
              item.searchKey.toLowerCase().includes(rightSearch.toLowerCase()),
            )
            .map(renderRightItem)}
        </ul>
      </div>
    </div>
  );
}
