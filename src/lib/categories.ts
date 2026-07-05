// Category dot colors (chips are monotone; the dot carries the category).
export const CATEGORY_DOT: Record<string, string> = {
  Academic: "#6573A8",
  Exams: "#B26079",
  Placements: "#4E9387",
  Sports: "#74935E",
  Clubs: "#8772B5",
  Workshops: "#B59440",
  General: "#646A82",
};

export function categoryDot(name: string): string {
  return CATEGORY_DOT[name] ?? "#646A82";
}

/** A colored gradient panel per category — stands in for a cover image. */
export function categoryGradient(name: string): string {
  const c = categoryDot(name);
  return `linear-gradient(145deg, ${c} 0%, ${c}cc 50%, #14151f 150%)`;
}
