"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React from "react";

/** Ripped from https://github.com/shadcn-ui/ui/issues/2114#issuecomment-2308012873 */
export default function TransferList<
  Item extends { selected: boolean; propKey: string; searchKey: string },
>(props: {
  disabled: boolean;
  renderItem: (item: Item, toggleSelect: () => void) => React.ReactNode;
  leftListState: [Item[], (_: Item[]) => void];
  rightListState: [Item[], (_: Item[]) => void];
}) {
  const {
    disabled,
    leftListState: [leftList, setLeftList],
    rightListState: [rightList, setRightList],
    renderItem,
  } = props;
  const [leftSearch, setLeftSearch] = React.useState("");
  const [rightSearch, setRightSearch] = React.useState("");

  const moveToRight = () => {
    const selectedItems = leftList.filter((item) => item.selected);
    setRightList([
      ...rightList,
      ...selectedItems.map((item) => ({ ...item, selected: false })),
    ]);
    setLeftList(leftList.filter((item) => !item.selected));
  };

  const moveToLeft = () => {
    const selectedItems = rightList.filter((item) => item.selected);
    setLeftList([
      ...leftList,
      ...selectedItems.map((item) => ({ ...item, selected: false })),
    ]);
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
    renderItem(item, () =>
      toggleSelection(leftList, setLeftList, item.propKey),
    );
  const renderRightItem = (item: Item) =>
    renderItem(item, () =>
      toggleSelection(rightList, setRightList, item.propKey),
    );

  return (
    <div className="flex space-x-4">
      <div className="w-1/2 shadow-sm bg-background rounded-sm">
        <div className="flex items-center justify-between">
          <Input
            placeholder="Search"
            className="rounded-br-none rounded-bl-none rounded-tr-none rounded-bl-none focus-visible:ring-0 focus-visible:border-blue-500"
            value={leftSearch}
            onChange={(e) => setLeftSearch(e.target.value)}
          />
          <Button
            disabled={disabled}
            className="rounded-tl-none rounded-bl-none rounded-br-none border-l-0"
            onClick={moveToRight}
            size="icon"
            variant="outline"
          >
            {">>"}
          </Button>
        </div>
        <ul className="h-[200px] border-l border-r border-b rounded-br-sm rounded-bl-sm p-1.5 overflow-y-scroll">
          {leftList
            .filter((item) =>
              item.searchKey.toLowerCase().includes(leftSearch.toLowerCase()),
            )
            .map(renderLeftItem)}
        </ul>
      </div>

      <div className="w-1/2 shadow-sm bg-background rounded-sm">
        <div className="flex items-center justify-between">
          <Button
            disabled={disabled}
            className="rounded-tr-none rounded-br-none rounded-bl-none border-r-0"
            onClick={moveToLeft}
            size="icon"
            variant="outline"
          >
            {"<<"}
          </Button>
          <Input
            placeholder="Search"
            className="rounded-bl-none rounded-br-none rounded-tl-none rounded-bl-none focus-visible:ring-0 focus-visible:border-blue-500"
            value={rightSearch}
            onChange={(e) => setRightSearch(e.target.value)}
          />
        </div>
        <ul className="h-[200px] border-l border-r border-b rounded-br-sm rounded-bl-sm p-1.5 overflow-y-scroll">
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
