export enum SortType {
  Upvotes = 'upvotes',
  Recent = 'recent',
}

export const sortOptions = [
  {
    value: SortType.Upvotes,
    label: 'Most Upvoted',
  },
  {
    value: SortType.Recent,
    label: 'Most Recent',
  },
];
