import pkg from '../../../package.json';
import { commonProtocolVersion } from './commonProtocolEventSchema';
const currentVersion = pkg.dependencies['@commonxyz/common-protocol-abis'];

if (commonProtocolVersion !== currentVersion) {
  console.error(`❌ commonProtocolEventSchema is outdated:
  Current ABI version: ${currentVersion}
  commonProtocolVersion version:      ${commonProtocolVersion}

Run: pnpm generate-event-schema`);
  process.exit(1);
}

console.log(
  `✅ commonProtocolEventSchema is up to date with version ${currentVersion}`,
);
