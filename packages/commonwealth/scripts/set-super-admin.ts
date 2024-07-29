import { dispose } from '@hicommonwealth/core';
import { models, UserAttributes } from '@hicommonwealth/model';
import { WhereOptions } from 'sequelize';

async function main() {
  if (
    !process.env.SUPER_ADMIN_EMAIL &&
    !process.env.SUPER_ADMIN_WALLET_ADDRESS
  ) {
    throw new Error(
      'Need to set SUPER_ADMIN_EMAIL or SUPER_ADMIN_WALLET_ADDRESS environment variable!',
    );
  }

  if (!process.argv[2]) {
    throw new Error(
      'Must provide a boolean argument indicating what `User.isAdmin` should be set to.',
    );
  }
  const isAdmin = process.argv[2] === 'true';

  const where: WhereOptions<UserAttributes> = {};
  if (process.env.SUPER_ADMIN_EMAIL) {
    where['email'] = process.env.SUPER_ADMIN_EMAIL;
  } else {
    const address = await models.Address.findOne({
      where: {
        address: process.env.SUPER_ADMIN_WALLET_ADDRESS,
      },
    });
    // @ts-expect-error StrictNullChecks
    where['id'] = address.user_id;
  }

  await models.User.update(
    {
      isAdmin,
    },
    {
      where,
    },
  );
}

if (import.meta.url.endsWith(process.argv[1])) {
  main()
    .then(() => {
      console.log('Success!');
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('EXIT', true);
    })
    .catch((err) => {
      console.log('Failed to set super admin', err);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('ERROR', true);
    });
}
