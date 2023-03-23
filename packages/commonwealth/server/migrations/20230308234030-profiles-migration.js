('use strict');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      const profiles = await queryInterface.sequelize.query(
        `SELECT "Profiles".id AS profile_id, "Profiles".profile_name, "Profiles".user_id,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'address_id', "Addresses".id, 
            'data', COALESCE("OffchainProfiles".data, '{}'),
            'address', "Addresses".address
          )
        ) AS address_offchain_pairs
          FROM "Profiles"
          LEFT JOIN "Addresses" ON "Profiles".id = "Addresses".profile_id
          LEFT JOIN "OffchainProfiles" ON "Addresses".id = "OffchainProfiles".address_id
          GROUP BY "Profiles".id, "Profiles".profile_name`,
        {
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction: t,
        }
      );

      let newProfilesAndUsersCreated = 0;
      let newProfilesSkippedForAddressDuplication = 0;
      // For each profile
      for (const profile of profiles) {
        const profileName = profile.profile_name;

        if (profileName !== null) {
          // User has set the profile_name via modal
          for (const address_offchain_pair of profile.address_offchain_pairs) {
            let parsedData;
            try {
              parsedData = JSON.parse(address_offchain_pair.data);
            } catch (e) {
              console.log('Error parsing JSON', e, address_offchain_pair);
              continue;
            }

            if (parsedData && parsedData.avatarUrl) {
              // Update the OffchainProfile with the profile_name
              await queryInterface.sequelize.query(
                `UPDATE "Profiles" SET avatar_url=${
                  parsedData.avatarUrl ? `'${parsedData.avatarUrl}'` : 'NULL'
                } WHERE id=${profile.profile_id}`,
                { transaction: t }
              );
              break;
            }
          }
        } else {
          // No profile_name set
          if (profile.address_offchain_pairs.length === 1) {
            let parsedData;
            try {
              parsedData = JSON.parse(profile.address_offchain_pairs[0].data);
            } catch (e) {
              console.log(
                'Error parsing JSON',
                e,
                profile.address_offchain_pairs[0]
              );
              continue;
            }

            if (parsedData) {
              // Update with the offchainProfile's data
              await queryInterface.sequelize.query(
                `UPDATE "Profiles" SET avatar_url=${
                  parsedData?.avatarUrl ? `'${parsedData.avatarUrl}'` : 'NULL'
                }, profile_name=${
                  parsedData?.name
                    ? `'${parsedData.name.replace(/'/g, '')}'`
                    : 'NULL'
                } WHERE id=${profile.profile_id}`,
                { transaction: t }
              );
            }
          } else if (profile.address_offchain_pairs.length > 1) {
            // More than one valid address exists
            const names = [];
            let sameName = true;

            for (const address_offchain_pair of profile.address_offchain_pairs) {
              let parsedData;
              try {
                parsedData = JSON.parse(address_offchain_pair.data);
              } catch (e) {
                console.log('Error parsing JSON', e, address_offchain_pair);
                continue;
              }

              const name = parsedData?.name;
              if (name !== undefined && !names.includes(name)) {
                // Checks if name is already in the array- if so, it's not unique
                names.push(name);
              }

              if (names.length > 1) {
                sameName = false;
              }
            }

            if (sameName) {
              // Multiple addresses with same name- we need only update one profile
              let avatarUrl;
              let name;
              for (const address_offchain_pair of profile.address_offchain_pairs) {
                let parsedData;
                try {
                  parsedData = JSON.parse(address_offchain_pair.data);
                } catch (e) {
                  console.log('Error parsing JSON', e);
                  continue;
                }
                if (parsedData) {
                  if (parsedData.name) {
                    name = parsedData.name;
                  }
                  if (parsedData.avatarUrl) {
                    avatarUrl = parsedData.avatarUrl;
                    // Found an avatar url, no need to continue
                    break;
                  }
                }
              }
              await queryInterface.sequelize.query(
                `UPDATE "Profiles" SET avatar_url=${
                  avatarUrl ? `'${avatarUrl}'` : 'NULL'
                }, profile_name=${
                  name ? `'${name.replace(/'/g, '')}'` : 'NULL'
                } WHERE id=${profile.profile_id}`,
                { transaction: t }
              );
            } else {
              let addressMapping = {};
              // Addresses have different names- we must create new profiles
              for (let i = 0; i < profile.address_offchain_pairs.length; i++) {
                const address_offchain_pair = profile.address_offchain_pairs[i];
                const addressId = address_offchain_pair.address_id;
                const address = address_offchain_pair.address;
                let parsedData;
                try {
                  parsedData = JSON.parse(address_offchain_pair.data);
                } catch (e) {
                  console.log('Error parsing JSON', e);
                  continue;
                }

                if (i === 0) {
                  // The first address we simply copy its OffchainProfile data to the Profile
                  await queryInterface.sequelize.query(
                    `UPDATE "Profiles" SET avatar_url=${
                      parsedData?.avatarUrl
                        ? `'${parsedData.avatarUrl}'`
                        : 'NULL'
                    }, profile_name=${
                      parsedData?.name
                        ? `'${parsedData.name.replace(/'/g, '')}'`
                        : 'NULL'
                    } WHERE id=${profile.profile_id}`,
                    { transaction: t }
                  );

                  addressMapping[address] = {
                    profileId: profile.profile_id,
                    userId: profile.user_id,
                    name: parsedData?.name
                      ? `${parsedData.name.replace(/'/g, '')}`
                      : null,
                    avatarUrl: parsedData?.avatarUrl
                      ? `${parsedData.avatarUrl}`
                      : null,
                  };
                } else {
                  // The other addresses result in new user and profile objects

                  // Check if we have seen the address already (special case)

                  if (addressMapping[address]) {
                    const existingAddressProfileId =
                      addressMapping[address].profileId;
                    const existingAddressUserId =
                      addressMapping[address].userId;
                    const existingAddressName = addressMapping[address].name;
                    const existingAddressAvatarUrl =
                      addressMapping[address].avatarUrl;

                    if (!existingAddressAvatarUrl || !existingAddressName) {
                      // Update the existing profile with the avatar url and name if they exists
                      await queryInterface.sequelize.query(
                        `UPDATE "Profiles" SET avatar_url=${
                          parsedData?.avatarUrl
                            ? `'${parsedData.avatarUrl}'`
                            : 'NULL'
                        }, profile_name=${
                          parsedData?.name
                            ? `'${parsedData.name.replace(/'/g, '')}'`
                            : 'NULL'
                        } WHERE id=${existingAddressProfileId}`,
                        { transaction: t }
                      );
                    }

                    // update address with new user id and new profile id
                    await queryInterface.sequelize.query(
                      `UPDATE "Addresses" SET user_id=${existingAddressUserId}, profile_id=${existingAddressProfileId} WHERE id=${addressId}`,
                      { transaction: t }
                    );
                    newProfilesSkippedForAddressDuplication += 1;
                    continue;
                  }

                  // Create new user
                  const newUser = await queryInterface.sequelize.query(
                    `INSERT INTO "Users" (created_at, updated_at, "emailNotificationInterval") VALUES (NOW(), NOW(), 'never') RETURNING id`,
                    {
                      type: queryInterface.sequelize.QueryTypes.INSERT,
                      transaction: t,
                    }
                  );

                  // Create new profile
                  const newProfile = await queryInterface.sequelize.query(
                    `INSERT INTO "Profiles" (user_id, profile_name, avatar_url) VALUES (${
                      newUser[0][0].id
                    }, ${
                      parsedData?.name
                        ? `'${parsedData.name.replace(/'/g, '')}'`
                        : 'NULL'
                    }, ${
                      parsedData?.avatarUrl
                        ? `'${parsedData.avatarUrl}'`
                        : 'NULL'
                    }) RETURNING id`,
                    {
                      type: queryInterface.sequelize.QueryTypes.INSERT,
                      transaction: t,
                    }
                  );

                  // update address with new user id and new profile id
                  await queryInterface.sequelize.query(
                    `UPDATE "Addresses" SET user_id=${newUser[0][0].id}, profile_id=${newProfile[0][0].id} WHERE id=${addressId}`,
                    { transaction: t }
                  );

                  // Add to map to keep track of address duplicates
                  addressMapping[address] = {
                    profileId: newProfile[0][0].id,
                    userId: newUser[0][0].id,
                    name: parsedData?.name,
                    avatarUrl: parsedData?.avatarUrl,
                  };

                  newProfilesAndUsersCreated += 1;
                }
              }
            }
          }
        }
      }

      console.log(
        `Created ${newProfilesAndUsersCreated} new profiles and users`
      );
      console.log(
        'Skipped creating',
        newProfilesSkippedForAddressDuplication,
        'new profiles due to duplicate addresses'
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    return;
  },
};
