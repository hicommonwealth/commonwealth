import { models, UserAttributes } from '@hicommonwealth/model';
import * as dotenv from 'dotenv';
import { WhereOptions } from 'sequelize';

dotenv.config();

async function main() {
  if (
    !process.env.SUPER_ADMIN_EMAIL &&
    !process.env.SUPER_ADMIN_WALLET_ADDRESS
  ) {
    throw new Error(
      'Need to set SUPER_ADMIN_EMAIL or SUPER_ADMIN_WALLET_ADDRESS environment variable!',
    );
  }

  const where: WhereOptions<UserAttributes> = {};
  if (process.env.SUPER_ADMIN_EMAIL) {
    where['email'] = process.env.SUPER_ADMIN_EMAIL;
  } else {
    const address = await models.Address.findOne({
      where: {
        address: process.env.SUPER_ADMIN_WALLET_ADDRESS,
      },
    });
    where['id'] = address.user_id;
  }

  await models.User.update(
    {
      isAdmin: true,
    },
    {
      where,
    },
  );
}

if (require.main === module) {
  main()
    .then(() => {
      // note this stops rollbar errors reports from completing in the `dispatchWebhooks` function
      process.exit(0);
    })
    .catch((err) => {
      console.log('Failed to set super admin', err);
      process.exit(1);
    });
}
