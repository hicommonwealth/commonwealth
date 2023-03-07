'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Get all Profiles
      const profiles = await queryInterface.sequelize.query(
        `SELECT * FROM "Profiles"`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction: t }
      );

      // For each profile
      for (const profile of profiles) {
        console.log('Updating profile with id: ', profile.id);
        if (profile.profile_name !== null) {
          // User has set the profile_name via modal

          const addresses = await queryInterface.sequelize.query(
            `SELECT * FROM "Addresses" WHERE profile_id=${profile.id}`,
            { type: queryInterface.sequelize.QueryTypes.SELECT, transaction: t }
          );

          for (const address of addresses) {
            // Get offchainProfile for the address
            const offchainProfiles = await queryInterface.sequelize.query(
              `SELECT * FROM "OffchainProfiles" WHERE address_id=${address.id}`,
              {
                type: queryInterface.sequelize.QueryTypes.SELECT,
                transaction: t,
              }
            );

            // Find the first offchain profile with an avatarUrl and copy it over
            for (const offchainProfile of offchainProfiles) {
              let parsedData;
              try {
                parsedData = JSON.parse(offchainProfile.data);
              } catch (e) {
                console.log('Error parsing JSON', e);
                continue;
              }

              if (parsedData && parsedData.avatarUrl) {
                // Update profile with avatarUrl from corresponding offchainProfile
                await queryInterface.sequelize.query(
                  `UPDATE "Profiles" SET avatar_url=${
                    parsedData.avatarUrl ? `'${parsedData.avatarUrl}'` : 'NULL'
                  } WHERE id=${profile.id}`,
                  { transaction: t }
                );
              }
            }
          }
        } else {
          // No profile_name set
          const addresses = await queryInterface.sequelize.query(
            `SELECT * FROM "Addresses" WHERE profile_id=${profile.id}`,
            { type: queryInterface.sequelize.QueryTypes.SELECT, transaction: t }
          );

          // If only one address, get offchainProfile for the address
          if (addresses.length === 1) {
            const offchainProfiles = await queryInterface.sequelize.query(
              `SELECT * FROM "OffchainProfiles" WHERE address_id=${addresses[0].id}`,
              {
                type: queryInterface.sequelize.QueryTypes.SELECT,
                transaction: t,
              }
            );

            if (offchainProfiles.length === 1) {
              let parsedData;
              try {
                parsedData = JSON.parse(offchainProfiles[0].data);
              } catch (e) {
                console.log('Error parsing JSON', e);
                continue;
              }

              // Update with the offchainProfile's data
              await queryInterface.sequelize.query(
                `UPDATE "Profiles" SET avatar_url=${
                  parsedData?.avatarUrl ? `'${parsedData.avatarUrl}'` : 'NULL'
                }, profile_name=${
                  parsedData?.name
                    ? `'${parsedData.name.replace(/'/g, '')}'`
                    : 'NULL'
                } WHERE id=${profile.id}`,
                { transaction: t }
              );
            }
          } else if (addresses.length > 1) {
            // More than one valid address exists
            const names = [];
            let sameName = true;

            for (const address of addresses) {
              const offchainProfiles = await queryInterface.sequelize.query(
                `SELECT * FROM "OffchainProfiles" WHERE address_id=${address.id}`,
                {
                  type: queryInterface.sequelize.QueryTypes.SELECT,
                  transaction: t,
                }
              );

              if (offchainProfiles.length === 1) {
                const offchainProfile = offchainProfiles[0];
                if (offchainProfile.data) {
                  let parsedData;
                  try {
                    parsedData = JSON.parse(offchainProfile.data);
                  } catch (e) {
                    console.log('Error parsing JSON', e);
                    continue;
                  }

                  const name = parsedData.name;
                  if (!names.includes(name)) {
                    // Checks if name is already in the array- user has multiple addresses with the same name
                    names.push(name);
                  }

                  if (names.length > 1) {
                    sameName = false;
                  }
                }
              }
            }

            if (sameName) {
              // Multiple addresses with same name- we need only update one profile
              let avatarUrl;
              let name;

              for (const address of addresses) {
                const offchainProfiles = await queryInterface.sequelize.query(
                  `SELECT * FROM "OffchainProfiles" WHERE address_id=${address.id}`,
                  {
                    type: queryInterface.sequelize.QueryTypes.SELECT,
                    transaction: t,
                  }
                );

                // Choose extract the name and avatarUrl from whichever OffchainProfiles have them
                if (offchainProfiles.length === 1) {
                  if (offchainProfiles[0].data) {
                    let parsedData;
                    try {
                      parsedData = JSON.parse(offchainProfiles[0].data);
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
                      }
                    }
                  }
                }
              }

              await queryInterface.sequelize.query(
                `UPDATE "Profiles" SET avatar_url=${
                  avatarUrl ? `'${avatarUrl}'` : 'NULL'
                }, profile_name=${
                  name ? `'${name.replace(/'/g, '')}'` : 'NULL'
                } WHERE id=${profile.id}`,
                { transaction: t }
              );
            } else {
              // Addresses have different names- we must create new profiles
              for (let i = 0; i < addresses.length; i++) {
                const address = addresses[i];
                const offchainProfiles = await queryInterface.sequelize.query(
                  `SELECT * FROM "OffchainProfiles" WHERE address_id=${address.id}`,
                  { type: queryInterface.sequelize.QueryTypes.SELECT }
                );

                if (offchainProfiles.length === 1) {
                  const offchainProfile = offchainProfiles[0];
                  let parsedData;
                  try {
                    parsedData = JSON.parse(offchainProfile.data);
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
                      } WHERE id=${profile.id}`,
                      { transaction: t }
                    );
                  } else {
                    // The other addresses result in new user and profile objects

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
                      `UPDATE "Addresses" SET user_id=${newUser[0][0].id}, profile_id=${newProfile[0][0].id} WHERE id=${address.id}`,
                      { transaction: t }
                    );
                  }
                }
              }
            }
          }
        }
      }
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
