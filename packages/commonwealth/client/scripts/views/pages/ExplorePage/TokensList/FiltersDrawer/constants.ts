import { TokenSortDirections, TokenSortOptions } from './types';

export const tokenSortOptionsLabelToKeysMap = {
  [TokenSortOptions.MarketCap]: 'market_cap', // this field doesn't exist on the tokens schema = hardcoding string
  [TokenSortOptions.Price]: 'price', // this field doesn't exist on the tokens schema = hardcoding string
};

export const sortOrderLabelsToDirectionsMap = {
  [TokenSortDirections.Ascending]: 'ASC',
  [TokenSortDirections.Descending]: 'DESC',
};
