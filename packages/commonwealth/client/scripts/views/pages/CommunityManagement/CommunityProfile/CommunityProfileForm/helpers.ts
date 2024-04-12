import { CommunityCategoryType } from '@hicommonwealth/shared';
import app from 'state';

export const getCommunityTags = (community: string) => {
  const chainToCategoriesMap: {
    [community: string]: CommunityCategoryType[];
  } = app.config.chainCategoryMap;

  const types = Object.keys(CommunityCategoryType);
  const selectedTags = {};

  for (const type of types) {
    selectedTags[type] = false;
  }

  if (chainToCategoriesMap[community]) {
    for (const tag of chainToCategoriesMap[community]) {
      selectedTags[tag] = true;
    }
  }

  return selectedTags;
};
