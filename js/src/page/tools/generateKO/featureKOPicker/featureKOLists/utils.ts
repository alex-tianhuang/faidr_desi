import { compareStrings } from "@/lib/utils";
import type { FeatureCardData } from "@/types/generateKO";

export function listActions(args: {
  defaultListState: [FeatureCardData[], (_: FeatureCardData[]) => void];
  KOListState: [FeatureCardData[], (_: FeatureCardData[]) => void];
  showHintOnHover: boolean;
  setOverrideLeftChevronTooltip: (_: boolean) => void;
}) {
  const {
    defaultListState,
    KOListState,
    showHintOnHover,
    setOverrideLeftChevronTooltip,
  } = args;
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
  const selectCardByPropKey = (
    list: FeatureCardData[],
    setList: (_: FeatureCardData[]) => void,
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
  const numFeaturesKO = KOList.length;
  const clickDefaultCard = (card: FeatureCardData) => {
    // User is deselecting the only selected card on the left list
    // don't show the tooltip when there are no selected cards
    const turnOffChevronTooltip =
      card.selected &&
      !showHintOnHover &&
      numFeaturesKO === 0 &&
      defaultList.filter((item) => item.selected).length === 1;
    if (showHintOnHover) {
      setOverrideLeftChevronTooltip(true);
    }
    if (turnOffChevronTooltip) {
      setOverrideLeftChevronTooltip(false);
    }
    selectCardByPropKey(defaultList, setDefaultList, card.propKey);
  };
  const clickKOCard = (card: FeatureCardData) => {
    selectCardByPropKey(KOList, setKOList, card.propKey);
  };
  return {
    moveCardsToDefaultList,
    moveCardsToKOList,
    clickDefaultCard,
    clickKOCard,
  };
}
function compareCards(a: FeatureCardData, b: FeatureCardData) {
  return compareStrings(a.searchKey, b.searchKey);
}
