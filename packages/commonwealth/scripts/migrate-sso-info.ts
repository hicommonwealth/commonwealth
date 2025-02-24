import { dispose } from '@hicommonwealth/core';
import csvParser from 'csv-parser';
import fs from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';

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

async function loadMagicData(): Promise<Array<MagicData>> {
  const results: Array<MagicData> = [];

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const fileContent = await fs.readFile(
    path.join(__dirname, './2025-02-24T15_16_02.493Z.csv'),
  );
  const stream = Readable.from(fileContent.toString());

  for await (const data of stream.pipe(csvParser())) {
    results.push({
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
    });
  }

  return results;
}

async function main() {
  const data = await loadMagicData();
  // console.log(data);
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
