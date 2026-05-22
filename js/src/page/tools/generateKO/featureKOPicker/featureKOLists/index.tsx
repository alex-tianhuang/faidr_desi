import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import type { FeatureCardData } from "@/types/generateKO";
import FeatureCardList from "./featureCardList";
import { listActions } from "./utils";
import MoveCardsButton from "./moveCardsButton";

/** Adapted from https://github.com/shadcn-ui/ui/issues/2114#issuecomment-2308012873 */
export default function FeatureKOLists(props: {
  disabled: boolean;
  defaultListState: [FeatureCardData[], (_: FeatureCardData[]) => void];
  KOListState: [FeatureCardData[], (_: FeatureCardData[]) => void];
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
  const showHintOnHover = useMemo(
    () =>
      numFeaturesKO === 0 &&
      !Boolean(defaultList.find((item) => item.selected)),
    [defaultList, KOList],
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
    clickDefaultCard,
    clickKOCard,
  } = listActions({
    defaultListState: [defaultList, setDefaultList],
    KOListState: [KOList, setKOList],
    showHintOnHover,
    setOverrideLeftChevronTooltip,
  });

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
            <MoveCardsButton
              override={overrideLeftChevronTooltip}
              tooltipText="Click me to move selected features right!"
              disabled={disabled || disabledLeft}
              onClick={() => {
                setOverrideLeftChevronTooltip(false);
                moveCardsToKOList();
              }}
              className="rounded-none border-l-0"
            >
              <ChevronsRight />
            </MoveCardsButton>
          </div>
          <FeatureCardList
            showHintOnHover={showHintOnHover}
            cards={defaultList}
            search={searchDefaultList}
            disabled={disabled}
            featureVector={featureVector}
            KOFeatureTargets={KOFeatureTargets}
            variant="default"
            handleClick={clickDefaultCard}
          ></FeatureCardList>
        </div>
        <div className="w-[calc(50%-8px)] flex flex-col">
          <div className="flex items-center justify-between">
            <MoveCardsButton
              tooltipText="Click me to move selected features back left!"
              disabled={disabled || disabledRight}
              onClick={moveCardsToDefaultList}
              className="rounded-none border-r-0"
            >
              <ChevronsLeft />
            </MoveCardsButton>
            <Input
              placeholder="Search"
              className="rounded-none focus-visible:ring-0 focus-visible:border-blue-500"
              value={searchKOList}
              onChange={(e) => setSearchKOList(e.target.value)}
            />
          </div>
          <FeatureCardList
            showHintOnHover={showHintOnHover}
            cards={KOList}
            search={searchKOList}
            disabled={disabled}
            featureVector={featureVector}
            KOFeatureTargets={KOFeatureTargets}
            variant="ko"
            handleClick={clickKOCard}
          ></FeatureCardList>
        </div>
      </div>
    </div>
  );
}
