'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Get all Profiles
      const profiles = await queryInterface.sequelize.query(
        `SELECT * FROM Profiles`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction: t }
      );

      const test = [profiles[0], profiles[1]];

      console.log(test);

      // For each profile
      for (const profile of test) {
        console.log('profile', profile);
        if (profile.profile_name !== null) {
          // User has set the profile_name via modal

          console.log('Has profile name', profile.profile_name);
          const addresses = await queryInterface.sequelize.query(
            `SELECT * FROM Addresses WHERE profile_id=${profile.id}`,
            { type: queryInterface.sequelize.QueryTypes.SELECT, transaction: t }
          );

          for (const address of addresses) {
            // Get offchainProfile for the address
            const offchainProfiles = await queryInterface.sequelize.query(
              `SELECT * FROM OffchainProfiles WHERE address_id=${address.id}`,
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
                console.log('setting avatarUrl', parsedData.avatarUrl);
                await queryInterface.sequelize.query(
                  `UPDATE Profiles SET avatar_url='${parsedData.avatarUrl}' WHERE id=${profile.id}`,
                  { transaction: t }
                );
                // Exit loop because we have found an offchainProfile with the avatarUrl and need not do more
                break;
              }
            }
          }
        } else {
          // No profile_name set
          console.log("doesn't have profile_name");
          const addresses = await queryInterface.sequelize.query(
            `SELECT * FROM Addresses WHERE profile_id=${profile.id}`,
            { type: queryInterface.sequelize.QueryTypes.SELECT, transaction: t }
          );

          // If only one address, get offchainProfile for the address
          if (addresses.length === 1) {
            console.log('Only one address', addresses[0]);
            const offchainProfiles = await queryInterface.sequelize.query(
              `SELECT * FROM OffchainProfiles WHERE address_id=${addresses[0].id}`,
              {
                type: queryInterface.sequelize.QueryTypes.SELECT,
                transaction: t,
              }
            );

            let lastValidName = '';
            for (let i = 0; i < offchainProfiles.length; i++) {
              const offchainProfile = offchainProfiles[i];
              let parsedData;
              try {
                parsedData = JSON.parse(offchainProfile.data);
              } catch (e) {
                console.log('Error parsing JSON', e);
                continue;
              }

              // Update profile with name and avatarUrl from corresponding offchainProfile
              if (parsedData && parsedData.name) {
                lastValidName = parsedData.name;
                if (!parsedData.avatarUrl && i < offchainProfiles.length - 1) {
                  // If there is no avatarUrl, try the next offchainProfile
                  // But if we have exhausted all offchainProfiles, we will ignore the avatar url
                  continue;
                }
                console.log(
                  'setting name and avatarUrl',
                  parsedData.name,
                  parsedData.avatarUrl
                );
                // Update with the first offchainProfile that has a name and avatarUrl (if it exists)
                await queryInterface.sequelize.query(
                  `UPDATE Profiles SET avatar_url='${
                    parsedData.avatarUrl ?? ''
                  }' profile_name='${parsedData.name}' WHERE id=${profile.id}`,
                  { transaction: t }
                );

                break;
              }

              if (i === offchainProfiles.length - 1 && lastValidName) {
                // If the final offchainProfile had no name, use the last valid name we saw
                console.log('setting name', lastValidName);
                await queryInterface.sequelize.query(
                  `UPDATE Profiles SET profile_name='${lastValidName}' WHERE id=${profile.id}`,
                  { transaction: t }
                );
              }
            }
          } else if (addresses.length > 1) {
            console.log('more than one address');
            const names = [];
            let sameName = true;

            for (const address of addresses) {
              const offchainProfiles = await queryInterface.sequelize.query(
                `SELECT * FROM OffchainProfiles WHERE address_id=${address.id}`,
                {
                  type: queryInterface.sequelize.QueryTypes.SELECT,
                  transaction: t,
                }
              );

              for (const offchainProfile of offchainProfiles) {
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
              console.log('all have same name, ');
              let avatarUrl;
              let name;

              for (const address of addresses) {
                const offchainProfiles = await queryInterface.sequelize.query(
                  `SELECT * FROM OffchainProfiles WHERE address_id=${address.id}`,
                  {
                    type: queryInterface.sequelize.QueryTypes.SELECT,
                    transaction: t,
                  }
                );

                for (const offchainProfile of offchainProfiles) {
                  if (offchainProfile.data) {
                    let parsedData;
                    try {
                      parsedData = JSON.parse(offchainProfile.data);
                    } catch (e) {
                      console.log('Error parsing JSON', e);
                      continue;
                    }

                    avatarUrl = parsedData.avatarUrl;
                    name = parsedData.name;
                    break;
                  }
                }
              }

              await queryInterface.sequelize.query(
                `UPDATE Profiles SET avatar_url='${avatarUrl}', profile_name='${name}' WHERE id=${profile.id}`,
                { transaction: t }
              );
            } else {
              for (const address of addresses) {
                const offchainProfiles = await queryInterface.sequelize.query(
                  `SELECT * FROM OffchainProfiles WHERE address_id=${address.id}`,
                  { type: queryInterface.sequelize.QueryTypes.SELECT }
                );

                if (offchainProfiles.length > 1) {
                  for (let i = 0; i < offchainProfiles.length; i++) {
                    const offchainProfile = offchainProfiles[i];

                    if (offchainProfile.data) {
                      let parsedData;
                      try {
                        parsedData = JSON.parse(offchainProfile.data);
                      } catch (e) {
                        console.log('Error parsing JSON', e);
                        continue;
                      }

                      if (i === 0) {
                        await queryInterface.sequelize.query(
                          `UPDATE Profiles SET avatar_url='${parsedData.avatarUrl}' name='${parsedData.name}' WHERE id=${profile.id}`,
                          { transaction: t }
                        );
                      } else {
                        await queryInterface.sequelize.query(
                          `INSERT INTO Profiles (user_id, profile_name, avatar_url) VALUES (${profile.user_id}, '${parsedData.name}', '${parsedData.avatarUrl}')`,
                          { transaction: t }
                        );
                      }
                    }
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
