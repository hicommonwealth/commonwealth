'use strict';

const hasIntersection = (set1, set2) => {
  return [...set1].filter((x) => set2.has(x)).length > 0;
};

const inplaceSetUnion = (set1, set2) => {
  for (const item of set2) {
    set1.add(item);
  }
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // 1. Locate addresses with duplicate users
      const addressesWithDuplicateUsers = await queryInterface.sequelize.query(
        `
          SELECT a.id AS id, a.address AS address, a.user_id AS user_id
          FROM "Addresses" AS a
          JOIN "Addresses" AS a2
          ON a.address = a2.address AND a.user_id != a2.user_id;
        `,
        {
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction,
        }
      );

      // 2. Produce mapping of addresses to duplicate users
      const addressToUserMap = {}; // address => user[]
      for (const address of addressesWithDuplicateUsers) {
        if (!addressToUserMap[address.address]) {
          addressToUserMap[address.address] = [];
        }
        addressToUserMap[address.address].push(address.user_id);
      }

      // 3. Walk map of addresses to produce sets of users to combine
      let userMergeSets = [];
      const addressMapUserArrays = Object.values(addressToUserMap);
      for (const mergeGroup of addressMapUserArrays) {
        const mergeSet = new Set(mergeGroup);
        // add elements to search set + continue search, to maximize size of union
        // ex. we're adding {A, B} to [{A, C}, {B, D}], so we need to end up with [{A, B, C, D}]
        //   start: union({A, B}, {A, C}) => {A, B, C}, then, union({A, B, C}, {B, D}) => {A, B, C, D}.
        //   after this, we remove {A, C} and {B, D} from the search set, and add {A, B, C, D}.
        for (const existingSet of userMergeSets) {
          if (hasIntersection(existingSet, mergeSet)) {
            inplaceSetUnion(mergeSet, existingSet);
          }
        }

        // once mergeSet is maximal, remove all intersecting elements + reinsert the final set
        userMergeSets = userMergeSets.filter(
          (set) => !hasIntersection(set, mergeSet)
        );
        userMergeSets.push(mergeSet);
      }

      // at this point, all sets should be disjoint -- assert this
      for (const set1 of userMergeSets) {
        for (const set2 of userMergeSets) {
          if (set1 !== set2) {
            if (hasIntersection(set1, set2)) {
              throw new Error('Sets should be disjoint');
            }
          }
        }
      }
      console.log(`Found ${userMergeSets.length} sets of users to merge.`);

      if (userMergeSets.length > 0) {
        // 4. query all identified users + profiles in order to select which to use
        const usersToBeMerged = await queryInterface.sequelize.query(
          `
          SELECT
            u.id AS user_id, u.email AS email, u.updated_at AS user_updated,
            p.id AS profile_id, p.profile_name AS name, p.updated_at AS profile_updated
          FROM "Users" AS u
          JOIN "Profiles" AS p
          ON u.id = p.user_id
            AND u.id IN (${userMergeSets
              .map((set) => [...set].join(','))
              .join(',')});
        `,
          {
            type: queryInterface.sequelize.QueryTypes.SELECT,
            transaction,
          }
        );

        // 5. Produce object to transform addresses / profiles
        /* userTransformData =
          {
            keptUser: user_id,
            keptProfile: profile_id,
            keptProfileName: string,
            keptProfileNameId: profile_id,
            mergedUsers: user_id[],
          }
        */
        const userToKeepMap = [];
        for (const userSet of userMergeSets) {
          const userSetData = [...userSet].map((user_id) =>
            usersToBeMerged.find((u) => u.user_id === user_id)
          );
          const userTransformData = {
            keptUser: null,
            keptProfile: null,
            keptProfileName: null,
            keptProfileNameId: null,
            mergedUsers: [...userSet],
          };

          // Select which User will be kept -- most recently updated with email
          const keptUser = userSetData.reduce((acc, cur) => {
            if (!acc) return cur;
            if (!cur.email && acc.email) return acc;
            if (cur.email && !acc.email) return cur;
            if (cur.user_updated > acc.user_updated) return cur;
            return acc;
          });
          userTransformData.keptUser = keptUser.user_id;
          userTransformData.keptProfile = keptUser.profile_id;

          // Select which Profile name will be kept, if any
          const keptProfileName = userSetData.reduce((acc, cur) => {
            if (!acc) return cur;
            if (!cur.name && acc.name) return acc;
            if (cur.name && !acc.name) return cur;
            if (cur.profile_updated > acc.profile_updated) return cur;
            return acc;
          });
          userTransformData.keptProfileName = keptProfileName.name;
          userTransformData.keptProfileNameId = keptProfileName.profile_id;
          userToKeepMap.push(userTransformData);
        }

        // 6. Update profile objects on kept users to have selected name
        let profilesUpdated = 0;
        for (const {
          keptProfile,
          keptProfileName,
          keptProfileNameId,
        } of userToKeepMap) {
          if (keptProfileNameId !== keptProfile && keptProfileName) {
            profilesUpdated++;
            await queryInterface.sequelize.query(
              `
              UPDATE "Profiles"
              SET profile_name = '${keptProfileName}'
              WHERE id = ${keptProfile}
            `,
              { transaction }
            );
          }
        }
        console.log(`Updated ${profilesUpdated} profiles.`);

        // 7. Update address objects on merged users to have kept user
        for (const { keptUser, keptProfile, mergedUsers } of userToKeepMap) {
          await queryInterface.sequelize.query(
            `
            UPDATE "Addresses"
            SET user_id = ${keptUser}, profile_id = ${keptProfile}
            WHERE user_id IN (${mergedUsers.join(',')});
          `,
            { transaction }
          );
        }
        console.log('Migration complete.');
      }
      // For another migration: remove dead (orphaned) users + profiles
      // (this is difficult because of cascading deletions, e.g. notifications, subscriptions)
    });
  },

  down: async (queryInterface, Sequelize) => {
    // NOT REVERSIBLE
  },
};
