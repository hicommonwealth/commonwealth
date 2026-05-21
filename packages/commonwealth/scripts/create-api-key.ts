/**
 * Creates an API key for a user identified by their address.
 *
 * Usage:
 *   pnpm -F commonwealth create-api-key <address>
 *
 * The plaintext API key is printed once and never stored — save it immediately.
 */
import { dispose } from '@hicommonwealth/core';
import { getSaltedApiKeyHash } from '@hicommonwealth/model';
import { models } from '@hicommonwealth/model/db';
import { randomBytes } from 'crypto';
import { Op } from 'sequelize';

async function main() {
  const address = process.argv[2];
  if (!address) {
    throw new Error('Usage: create-api-key <address>');
  }

  const addressRecord = await models.Address.findOne({
    where: { address, verified: { [Op.ne]: null } },
    include: [{ model: models.User, required: true }],
  });

  if (!addressRecord?.User?.id) {
    throw new Error(`No verified user found for address: ${address}`);
  }

  const userId = addressRecord.User.id;

  // Delete any existing key for this user
  await models.ApiKey.destroy({ where: { user_id: userId } });

  const apiKey = randomBytes(32).toString('base64url');
  const salt = randomBytes(16).toString('hex');
  const hash = getSaltedApiKeyHash(apiKey, salt);

  await models.ApiKey.create({
    user_id: userId,
    hashed_api_key: hash,
    salt,
    premium_tier: false,
  });

  console.log(`API key created for user ${userId} (address: ${address})`);
  console.log(`\nMCP_AUTH_TOKEN=${address}:${apiKey}\n`);
  console.log('Save this now — the plaintext key cannot be recovered.');
}

main()
  .then(() => dispose()('EXIT', true))
  .catch((err) => {
    console.error('Failed:', err);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    dispose()('ERROR', true);
  });
