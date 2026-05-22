import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import FeatureKOCard from "./featureKOCard";
import type { FeatureCard } from "@/types/generateKO";
import { compareStrings } from "@/lib/utils";

/** Adapted from https://github.com/shadcn-ui/ui/issues/2114#issuecomment-2308012873 */
export default function FeatureKOLists(props: {
  disabled: boolean;
  defaultListState: [FeatureCard[], (_: FeatureCard[]) => void];
  KOListState: [FeatureCard[], (_: FeatureCard[]) => void];
  featureVector: Record<string, number>;
  KOFeatureTargets: Record<string, number>;
}) {
  const {
    disabled,
    defaultListState: [defaultList, setDefaultList],
    KOListState: [KOList, setKOList],
    featureVector,
    KOFeatureTargets,
  } = props;
  const numFeaturesKO = KOList.length;
  // user hasn't clicked anything and might not understand these are buttons
  const userProbablyNeedsHint = useMemo(
    () =>
      numFeaturesKO === 0 && (!Boolean(defaultList.find(item => item.selected))),
    [defaultList, KOList],
  );
  const onlyOneItemSelected = useMemo(
    () =>
      !userProbablyNeedsHint &&
      numFeaturesKO === 0 &&
      defaultList.filter((item) => item.selected).length === 1,
    [userProbablyNeedsHint, defaultList, KOList],
  );
  const disabledLeft = useMemo(
    () => !Boolean(defaultList.find((item) => item.selected)),
    [defaultList],
  );
  const disabledRight = useMemo(
    () => !Boolean(KOList.find((item) => item.selected)),
    [KOList],
  );
  const [overrideLeftChevronTooltip, setOverrideLeftChevronTooltip] =
    useState(false);
  const [searchDefaultList, setSearchDefaultList] = useState("");
  const [searchKOList, setSearchKOList] = useState("");
  const {
    moveCardsToDefaultList,
    moveCardsToKOList,
    clickCard
  } = listActions([defaultList, setDefaultList], [KOList, setKOList])
  
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex flex-row gap-4 w-full">
        <div className="w-1/2 text-center border-b">Features to preserve</div>
        <div className="w-1/2 text-center border-b">
          Features to set to IDRome minimum
        </div>
      </div>
      <div className="flex flex-row gap-4 w-full">
        <div className="w-[calc(50%-8px)] flex flex-col">
          <div className="flex items-center justify-between">
            <Input
              placeholder="Search"
              className="rounded-none focus-visible:ring-0 focus-visible:border-blue-500"
              value={searchDefaultList}
              onChange={(e) => setSearchDefaultList(e.target.value)}
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
                    moveCardsToKOList();
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
            {defaultList
              .filter((item) =>
                item.searchKey.toLowerCase().includes(searchDefaultList.toLowerCase()),
              )
              .map((item) => (
                <li key={item.propKey}>
                  <FeatureKOCard
                    disabled={disabled}
                    toggleSelect={() => {
                      if (!item.selected && userProbablyNeedsHint) {
                        setOverrideLeftChevronTooltip(true);
                      }
                      if (item.selected && onlyOneItemSelected) {
                        setOverrideLeftChevronTooltip(false);
                      }
                      clickCard(defaultList, setDefaultList, item.propKey);
                    }}
                    selected={item.selected}
                    featureID={item.propKey}
                    isKOList={false}
                    featureVector={featureVector}
                    KOFeatureTargets={KOFeatureTargets}
                    userProbablyNeedsHint={userProbablyNeedsHint}
                  />
                </li>
              ))}
          </ul>
        </div>
        <div className="w-[calc(50%-8px)] flex flex-col">
          <div className="flex items-center justify-between">
            <Tooltip>
              <TooltipTrigger disabled={disabled || disabledRight}>
                <Button
                  disabled={disabled || disabledRight}
                  className="rounded-none border-r-0"
                  onClick={moveCardsToDefaultList}
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
              value={searchKOList}
              onChange={(e) => setSearchKOList(e.target.value)}
            />
          </div>
          <ul className="h-50 border p-1.5 overflow-y-scroll">
            {KOList
              .filter((item) =>
                item.searchKey
                  .toLowerCase()
                  .includes(searchKOList.toLowerCase()),
              )
              .map((item) => (
                <li key={item.propKey}>
                  <FeatureKOCard
                    disabled={disabled}
                    toggleSelect={() => {
                      if (!item.selected && userProbablyNeedsHint) {
                        setOverrideLeftChevronTooltip(true);
                      }
                      if (item.selected && onlyOneItemSelected) {
                        setOverrideLeftChevronTooltip(false);
                      }
                      clickCard(KOList, setKOList, item.propKey);
                    }}
                    selected={item.selected}
                    featureID={item.propKey}
                    isKOList={true}
                    featureVector={featureVector}
                    KOFeatureTargets={KOFeatureTargets}
                    userProbablyNeedsHint={userProbablyNeedsHint}
                  />
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
function listActions(defaultListState: [FeatureCard[], (_: FeatureCard[]) => void], KOListState: [FeatureCard[], (_: FeatureCard[]) => void]) {
  const [defaultList, setDefaultList] = defaultListState;
  const [KOList, setKOList] = KOListState;
  const moveCardsToDefaultList = () => {
    const selectedItems = KOList.filter((item) => item.selected);
    setDefaultList(
      [
        ...defaultList,
        ...selectedItems.map((item) => ({ ...item, selected: false })),
      ].sort(compareCards),
    );
    setKOList(KOList.filter((item) => !item.selected));
  };
  const moveCardsToKOList = () => {
    const selectedItems = defaultList.filter((item) => item.selected);
    setKOList(
      [
        ...KOList,
        ...selectedItems.map((item) => ({ ...item, selected: false })),
      ].sort(compareCards),
    );
    setDefaultList(defaultList.filter((item) => !item.selected));
  };
  const clickCard = (
    list: FeatureCard[],
    setList: (_: FeatureCard[]) => void,
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
  return {
    moveCardsToDefaultList,
    moveCardsToKOList,
    clickCard
  }
}
function compareCards(a: FeatureCard, b: FeatureCard) {
  return compareStrings(a.searchKey, b.searchKey)
}