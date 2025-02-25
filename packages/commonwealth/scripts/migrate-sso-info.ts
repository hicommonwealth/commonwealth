import { dispose, logger } from '@hicommonwealth/core';
import { AddressInstance, models } from '@hicommonwealth/model';
import { Magic, MagicUserMetadata, WalletType } from '@magic-sdk/admin';
import csvParser from 'csv-parser';
import fs from 'fs/promises';
import path from 'path';
import { Op } from 'sequelize';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';
import { config } from '../server/config';

const log = logger(import.meta);

type MagicData = {
  email?: string;
  phone_number?: string;
  subject?: string;
  issuer:
    | 'EMAIL'
    | 'APPLE'
    | 'GITHUB'
    | 'GOOGLE'
    | 'TWITTER'
    | 'DISCORD'
    | 'SMS'
    | 'FARCASTER';
  signup_time: Date;
  ETH: string;
  POLKADOT?: string;
  COSMOS?: string;
  verified?: boolean;
};

function getWalletType(address: string): WalletType {
  if (address.startsWith('0x')) return WalletType.ETH;
  else if (address.startsWith('cosmos')) return WalletType.COSMOS;
  else return WalletType.POLKADOT;
}

async function loadMagicData(
  filepath: string,
): Promise<Record<string, MagicData>> {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const fileContent = await fs.readFile(path.join(__dirname, filepath));
  const stream = Readable.from(fileContent.toString());
  const map: Record<string, MagicData> = {};

  for await (const data of stream.pipe(csvParser())) {
    const parsedData = {
      email: data['email'] || undefined,
      phone_number: data['phone_number'] || undefined,
      subject: data['subject'] || undefined,
      issuer: data['issuer'],
      signup_time: new Date(data['signup_time']),
      ETH: data['ETH'] || undefined,
      POLKADOT: data['POLKADOT'] || undefined,
      COSMOS: data['COSMOS'] || undefined,
      verified:
        data['verified'] === 'true'
          ? true
          : data['verified'] === 'false'
            ? false
            : undefined,
    };
    if (parsedData.ETH) map[parsedData.ETH] = parsedData;
    if (parsedData.POLKADOT) map[parsedData.POLKADOT] = parsedData;
    if (parsedData.COSMOS) map[parsedData.COSMOS] = parsedData;
  }

  return map;
}

async function main() {
  if (config.APP_ENV === 'production') {
    if (!config.MAGIC_API_KEY) {
      throw new Error('MAGIC_API_KEY is required in production');
    }
    if (!process.argv[2]) {
      throw new Error('Must provide a filepath to the user dump (csv)');
    }
  }

  const data = await loadMagicData(
    process.argv[2] || './2025-02-24T15_16_02.493Z.csv',
  );

  const addressToBackfillCount = await models.Address.count({
    where: {
      address: {
        [Op.in]: Object.keys(data),
      },
      wallet_id: 'magic',
      oauth_provider: null,
    },
  });
  let numBackfilled = 0;

  let addresses: AddressInstance[] = [];
  while (true) {
    addresses = await models.Address.findAll({
      attributes: ['id', 'address'],
      where: {
        address: {
          [Op.in]: Object.keys(data),
        },
        wallet_id: 'magic',
        oauth_provider: null,
      },
      limit: 100,
    });

    if (addresses.length === 0) {
      log.info('All magic addresses migrated from user dump (csv)');
      break;
    }

    for (const address of addresses) {
      if (!data[address.address]) {
        log.warn(`No data for address ${address.address}`);
        continue;
      }
      address.oauth_provider = data[address.address].issuer;
      address.oauth_email = data[address.address].email;
      address.oauth_phone_number = data[address.address].phone_number;
      await address.save();
      numBackfilled++;
      log.info(
        `[${numBackfilled}/${addressToBackfillCount}]: Updated address ${address.address}`,
      );
    }
  }

  const missingDumpAddresses = await models.Address.findAll({
    attributes: ['id', 'address'],
    where: {
      wallet_id: 'magic',
      oauth_provider: null,
      address: {
        [Op.or]: [{ [Op.like]: '0x%' }, { [Op.like]: 'cosmos%' }],
      },
    },
  });
  let processedAddresses = 0;

  const magic = new Magic(config.MAGIC_API_KEY!);
  for (const address of missingDumpAddresses) {
    let fetchedData: MagicUserMetadata;
    try {
      fetchedData = await magic.users.getMetadataByPublicAddressAndWallet(
        address.address,
        getWalletType(address.address),
      );
    } catch (e) {
      log.warn(
        `Failed to fetch data for address ${address.address}: ${JSON.stringify(e, null, 2)}`,
      );
      continue;
    }

    if (fetchedData.oauthProvider) {
      address.oauth_provider = fetchedData.oauthProvider;
      address.oauth_email = fetchedData.email;
      address.oauth_phone_number = fetchedData.phoneNumber;
      await address.save();
    }
    processedAddresses++;
    log.info(
      `[${processedAddresses}/${missingDumpAddresses.length}]: Processed address ${address.address}`,
    );
    // 400 rpm (limit is 500)
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  log.info('All magic addresses processed');
}

if (import.meta.url.endsWith(process.argv[1])) {
  main()
    .then(() => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('EXIT', true);
    })
    .catch((err) => {
      console.error(err);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('ERROR', true);
    });
}
