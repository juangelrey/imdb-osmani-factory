import type { ReactNode } from "react";
import type { Show } from "@/lib/catalog/types";
import { posterTransitionName, titleColorKey } from "./poster";
import { DetailsLayout, personLinks, ratingFact, type Fact } from "./title-details";

interface ShowDetailsProps {
  show: Show;
  /** Controls shown under the heading, such as the watchlist button. */
  actions?: ReactNode;
}

export function ShowDetails({ show, actions }: ShowDetailsProps) {
  const facts: Fact[] = [
    [show.years?.includes("–") ? "Years" : "Year", show.years],
    ["Seasons", show.seasonCount?.toString()],
    ["Episodes", show.episodeCount?.toString()],
    ["Genres", show.genres.map(({ name }) => name).join(", ") || undefined],
    ["Rating", ratingFact(show.rating)],
    ["Created by", personLinks(show.creators)],
    ["Cast", personLinks(show.cast)],
  ];

  return (
    <DetailsLayout
      colorKey={titleColorKey("tv", show.id)}
      name={show.name}
      posterUrl={show.posterUrl}
      transitionName={posterTransitionName("tv", show.id)}
      synopsis={show.synopsis}
      facts={facts}
      actions={actions}
    />
  );
}
