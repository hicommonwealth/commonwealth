export const twitterLinkRegex =
  /^(?:http[s]?:\/\/)?(?:www[.])?twitter[.]com\/.+?\/status\/(\d+)$/;

export enum APIOrderDirection {
  Desc = 'DESC',
  Asc = 'ASC',
}

export enum APIOrderBy {
  LastActive = 'last_active',
  Rank = 'rank',
  CreatedAt = 'created_at',
}
