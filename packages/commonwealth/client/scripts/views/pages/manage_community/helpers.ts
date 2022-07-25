import $ from 'jquery';
import m from 'mithril';
import app from 'state';

import { RolePermission } from 'models';
import { ChainCategoryType } from 'common-common/src/types';
import { buildChainToCategoriesMap } from '../community_cards';

export const sortAdminsAndModsFirst = (a, b) => {
  if (a.permission === b.permission)
    return a.Address.address.localeCompare(b.Address.address);
  if (a.permission === RolePermission.admin) return -1;
  if (b.permission === RolePermission.admin) return 1;
  if (a.permission === RolePermission.moderator) return -1;
  if (b.permission === RolePermission.moderator) return 1;
  return a.Address.address.localeCompare(b.Address.address);
};

export const setChainCategories = async (
  category_type_id: number,
  chain_id: string,
  create: boolean
) => {
  return new Promise<void>((resolve, reject) => {
    const params = {
      chain_id,
      category_type_id,
      create,
      auth: true,
      jwt: app.user.jwt,
    };
    $.post(`${app.serverUrl()}/updateChainCategory`, params)
      .then((response) => {
        if (create && response.result) {
          app.config.chainCategories = app.config.chainCategories.concat([
            {
              id: response.result.id,
              chain_id: response.result.chain_id,
              category_type_id: response.result.category_type_id,
            },
          ]);
        } else if (!create) {
          app.config.chainCategories = app.config.chainCategories.filter(
            (data) => data.id !== response.result.id
          );
        }
        resolve();
        m.redraw();
      })
      .catch(() => {
        reject();
      });
  });
};

export const setSelectedTags = (chain: string) => {
  const categoryTypes = app.config.chainCategoryTypes;
  const chainsAndCategories = app.config.chainCategories;
  const chainToCategoriesMap: { [chain: string]: ChainCategoryType[] } =
    buildChainToCategoriesMap(categoryTypes, chainsAndCategories);

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

export const buildCategoryMap = () => {
  const categoryTypes = app.config.chainCategoryTypes;
  const categoryMap = {};

  for (const data of categoryTypes) {
    categoryMap[data.category_name] = data.id;
  }
  return categoryMap;
};
