import $ from 'jquery';

import { redraw } from 'mithrilInterop';
import app from 'state';
import { AccessLevel } from '../../../../../shared/permissions';
import { ChainCategoryType } from 'common-common/src/types';
import axios from 'axios';

export const sortAdminsAndModsFirst = (a, b) => {
  if (a.permission === b.permission)
    return a.Address.address.localeCompare(b.Address.address);
  if (a.permission === AccessLevel.Admin) return -1;
  if (b.permission === AccessLevel.Admin) return 1;
  if (a.permission === AccessLevel.Moderator) return -1;
  if (b.permission === AccessLevel.Moderator) return 1;
  return a.Address.address.localeCompare(b.Address.address);
};

export const setChainCategories = async (
  selected_tags: { [tag: string]: boolean },
  chain_id: string
) => {
  return new Promise<void>((resolve, reject) => {
    const params = {
      chain_id,
      selected_tags: selected_tags,
      auth: true,
      jwt: app.user.jwt,
    };
    axios
      .post(`${app.serverUrl()}/updateChainCategory`, params)
      .then((response) => {
        if (response?.data.result) {
          const newMap = response.data.result;
          app.config.chainCategoryMap[newMap.chain] = newMap.tags;
        }
        resolve();
        redraw();
      })
      .catch(() => {
        reject();
      });
  });
};

export const setSelectedTags = (chain: string) => {
  const chainToCategoriesMap: {
    [chain: string]: ChainCategoryType[];
  } = app.config.chainCategoryMap;

  const types = Object.keys(ChainCategoryType);
  const selectedTags = {};

  for (const type of types) {
    selectedTags[type] = false;
  }

  if (chainToCategoriesMap[chain]) {
    for (const tag of chainToCategoriesMap[chain]) {
      selectedTags[tag] = true;
    }
  }

  return selectedTags;
};
