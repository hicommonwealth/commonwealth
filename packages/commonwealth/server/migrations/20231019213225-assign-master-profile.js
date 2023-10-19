'use strict';

// reference interfaces used to temporarily type the data:

// interface Address {
//   hex: string;
//   id: number;
//   user_id?: number;
//   profile_id?: number;
//   last_active?: Date;
// }

// interface Profile {
//   id: number;
//   user_id?: number;
//   profile_name: string;
//   email: string;
//   bio: string;
//   avatar_url: string;
//   socials: string;
//   background_image: string;
// }

// interface MasterProfile extends Profile {
//   profile_name_last_active?: Date;
//   email_last_active?: Date;
//   bio_last_active?: Date;
//   avatar_url_last_active?: Date;
//   socials_last_active?: Date;
//   background_image_last_active?: Date;
//   user_id_last_active?: Date;
// }

// interface Signer {
//   hex: string; // identifier
//   addresses: Address[];
//   profiles?: MasterProfile[];
//   master_profile?: MasterProfile;
// }

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Addresses" ADD COLUMN IF NOT EXISTS "legacy_user_id" INTEGER NULL;
        ALTER TABLE "Addresses" ADD COLUMN IF NOT EXISTS "legacy_profile_id" INTEGER NULL;
        `,
        { raw: true, transaction: t }
      );
    });

    let updateCount = 0;
    await queryInterface.sequelize.transaction(async (t) => {
      // get all addresses with hex and their profiles by profile_id:
      const [hexAddresses] = await queryInterface.sequelize.query(
        `
        SELECT hex, id, user_id, profile_id, last_active, address
        FROM "Addresses"
        WHERE hex IS NOT NULL AND profile_id IS NOT NULL;
        `,
        { transaction: t }
      );

      console.log('# hexAddresses with a profile_id', hexAddresses.length);

      const profileIds = hexAddresses
        .map((address) => address.profile_id)
        .join(',');

      console.log('# profileIds', profileIds.split(',').length);

      const [profiles] = await queryInterface.sequelize.query(
        `
          SELECT * from "Profiles"
          WHERE "id" IN (${profileIds});  
          `,
        { transaction: t }
      );

      let signers = [];
      hexAddresses.forEach((address) => {
        const signer = signers.find((signer) => signer.hex === address.hex);
        const profile = profiles.find((p) => p.id === address.profile_id);
        if (signer) {
          if (!signer.addresses.find((a) => a.id === address.id)) {
            signer.addresses.push(address);
          }
          if (!signer.profiles.find((p) => p.id === profile.id)) {
            signer.profiles.push(profile);
          }
        } else {
          if (!signers.find((s) => s.hex === address.hex)) {
            signers.push({
              hex: address.hex,
              addresses: [address],
              profiles: [profile],
            });
          }
        }
      });

      console.log('# signers', signers.length);

      const signersWithMultipleProfiles = signers.filter(
        (signer) => signer.profiles.length > 1
      );

      console.log(
        '# signersWithMultipleProfiles',
        signersWithMultipleProfiles.length
      );
      console.log(
        'signersWithMultipleProfiles',
        signersWithMultipleProfiles[0]
      );

      const signersLast6Months = signersWithMultipleProfiles.filter((s) =>
        s.addresses.some((a) => a.last_active > new Date('2023-04-01'))
      );
      const signersLast3Months = signersWithMultipleProfiles.filter((s) =>
        s.addresses.some((a) => a.last_active > new Date('2023-07-01'))
      );

      console.log('# signersLast6Months', signersLast6Months.length);
      console.log('# signersLast3Months', signersLast3Months.length);
      console.log('signersLast3Months', signersLast3Months[0]);

      for (let i = 0; i < signersWithMultipleProfiles.length; i++) {
        const masterProfile = signersWithMultipleProfiles[i].profiles.reduce(
          (master, profile) => {
            if (!master) {
              return profile;
            }
            const addressLastActive = signersWithMultipleProfiles[
              i
            ].addresses.find((a) => a.profile_id === profile.id).last_active;
            if (profile.profile_name) {
              if (addressLastActive > master.profile_name_last_active) {
                master.profile_name = profile.profile_name;
                master.profile_name_last_active = addressLastActive;
              }
            }
            if (profile.email) {
              if (addressLastActive > master.email_last_active) {
                master.email = profile.email;
                master.email_last_active = addressLastActive;
              }
            }
            if (profile.bio) {
              if (addressLastActive > master.bio_last_active) {
                master.bio = profile.bio;
                master.bio_last_active = addressLastActive;
              }
            }
            if (profile.avatar_url) {
              if (addressLastActive > master.avatar_url_last_active) {
                master.avatar_url = profile.avatar_url;
                master.avatar_url_last_active = addressLastActive;
              }
            }
            if (profile.socials) {
              if (addressLastActive > master.socials_last_active) {
                master.socials = profile.socials;
                master.socials_last_active = addressLastActive;
              }
            }
            if (profile.background_image) {
              if (addressLastActive > master.background_image_last_active) {
                master.background_image = profile.background_image;
                master.background_image_last_active = addressLastActive;
              }
            }
            // assign user_id:
            if (profile.user_id) {
              if (addressLastActive > master.user_id_last_active) {
                master.user_id = profile.user_id;
                master.user_id_last_active = addressLastActive;
              }
            }
            return master;
          },
          null
        );
        signersWithMultipleProfiles[i].master_profile = masterProfile;

        await queryInterface.sequelize.transaction(async (t) => {
          // Insert the new profile and update the addresses
          try {
            const { profile_name, email, bio, avatar_url, user_id } =
              masterProfile;

            const [insertedProfile] = await queryInterface.bulkInsert(
              'Profiles',
              [
                {
                  profile_name,
                  email,
                  bio,
                  avatar_url,
                  socials: masterProfile.socials?.length
                    ? masterProfile.socials
                    : null,
                  background_image: masterProfile.background_image
                    ? JSON.stringify(masterProfile.background_image)
                    : null,
                  user_id,
                },
              ],
              { transaction: t, returning: true }
            );

            const new_profile_id = insertedProfile.id;

            const updateQuery = `
                UPDATE "Addresses" A
                SET
                  legacy_user_id = A.user_id,
                  legacy_profile_id = A.profile_id,
                  profile_id = ${new_profile_id},
                  user_id = ${masterProfile.user_id}
                WHERE A.hex = '${signersWithMultipleProfiles[i].hex}';
              `;

            await queryInterface.sequelize.query(updateQuery, {
              transaction: t,
              raw: true,
            });
            updateCount++;
          } catch (e) {
            console.log('error', e);
            throw new Error(e);
          }
        });
      }
      console.log('updateCount', updateCount); // 2777 ... 20231005213247-assign_master_profile: migrated (77.703s)
      // 2373 == 20231005213247-assign_master_profile: migrated (52.780s)
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
          UPDATE "Addresses" SET profile_id = "Addresses".legacy_profile_id, user_id = "Addresses".legacy_user_id where legacy_profile_id IS NOT NULL;
          ALTER TABLE "Addresses" DROP COLUMN "legacy_user_id";
          ALTER TABLE "Addresses" DROP COLUMN "legacy_profile_id";
        `,
        { raw: true, transaction: t }
      );
    });
  },
};
