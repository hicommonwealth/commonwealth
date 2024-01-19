import { AccessLevel, CommunityCategoryType } from '@hicommonwealth/core';
import axios from 'axios';
import app from 'state';

export const sortAdminsAndModsFirst = (a, b) => {
  if (a.permission === b.permission)
    return a.Address.address.localeCompare(b.Address.address);
  if (a.permission === AccessLevel.Admin) return -1;
  if (b.permission === AccessLevel.Admin) return 1;
  if (a.permission === AccessLevel.Moderator) return -1;
  if (b.permission === AccessLevel.Moderator) return 1;
  return a.Address.address.localeCompare(b.Address.address);
};

export const setCommunityCategories = async (
  selected_tags: { [tag: string]: boolean },
  community_id: string,
) => {
  return new Promise<void>((resolve, reject) => {
    const params = {
      community_id,
      selected_tags: selected_tags,
      auth: true,
      jwt: app.user.jwt,
    };
    axios
      .post(`${app.serverUrl()}/updateCommunityCategory`, params)
      .then((response) => {
        if (response?.data.result) {
          const newMap = response.data.result;
          app.config.chainCategoryMap[newMap.community] = newMap.tags;
        }
        resolve();
      })
      .catch(() => {
        reject();
      });
  });
};

export const setSelectedTags = (community: string) => {
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
