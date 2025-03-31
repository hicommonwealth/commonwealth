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
  ProfileName = 'profile_name',
}

export const DEFAULT_CHAIN = 'edgeware';

export const BASE_CHAIN_ID = 8453;
export const BASE_GOERLI_CHAIN_ID = 84531;
export const BASE_SEPOLIA_CHAIN_ID = 84532;
