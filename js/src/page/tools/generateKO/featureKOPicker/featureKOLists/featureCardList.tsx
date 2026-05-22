import type { FeatureCardData } from "@/types/generateKO";
import FeatureCard from "./featureCard";

export default function FeatureCardList(props: {
  search: string;
  disabled: boolean;
  featureVector: Record<string, number>;
  KOFeatureTargets: Record<string, number>;
  showHintOnHover: boolean;
  variant: "default" | "ko";
  handleClick: (_: FeatureCardData) => void;
  cards: FeatureCardData[]
}) {
  const {
    cards,
    search,
    disabled,
    featureVector,
    variant,
    KOFeatureTargets,
    showHintOnHover,
    handleClick,
  } = props;
  return (
    <ul className="h-50 border p-1.5 overflow-y-scroll">
      {cards
        .filter((item) =>
          item.searchKey.toLowerCase().includes(search.toLowerCase()),
        )
        .map((item) => (
          <li key={item.propKey}>
            <FeatureCard
              disabled={disabled}
              toggleSelect={() => handleClick(item)}
              selected={item.selected}
              featureID={item.propKey}
              variant={variant}
              featureVector={featureVector}
              KOFeatureTargets={KOFeatureTargets}
              showHintOnHover={showHintOnHover}
            />
          </li>
        ))}
    </ul>
  );
}
