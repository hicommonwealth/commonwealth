import $ from 'jquery';

import { redraw } from 'mithrilInterop';
import app from 'state';
import { AccessLevel } from 'models';
import { ChainCategoryType } from 'common-common/src/types';

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
  category_type_id: string,
  chain_id: string
) => {
  return new Promise<void>((resolve, reject) => {
    const params = {
      chain_id,
      category_type_id,
      auth: true,
      jwt: app.user.jwt,
    };
    $.post(`${app.serverUrl()}/updateChainCategory`, params)
      .then((response) => {
        if (response?.result) {
          app.config.chainCategoryMap[chain_id] =
            response.result.chainCategoryMap.chain_id;
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
