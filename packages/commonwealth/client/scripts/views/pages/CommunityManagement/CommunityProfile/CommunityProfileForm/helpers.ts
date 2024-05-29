import { CommunityCategoryType } from '@hicommonwealth/shared';
import app from 'state';

type CommunityTags = {
  [tag in CommunityCategoryType]: boolean;
};

// TODO: this method should be deprecated after https://github.com/hicommonwealth/commonwealth/issues/7835
export const getCommunityTags = (community: string): CommunityTags => {
  const chainToCategoriesMap: {
    [community: string]: CommunityCategoryType[];
  } = app.config.chainCategoryMap;

  const selectedTags = {
    [CommunityCategoryType.DeFi]: false,
    [CommunityCategoryType.DAO]: false,
  };

  if (chainToCategoriesMap[community]) {
    for (const tag of chainToCategoriesMap[community]) {
      selectedTags[tag] = true;
    }
  }

  return selectedTags;
};
