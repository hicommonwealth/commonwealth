import pkg from '../../../../package.json';
import { commonProtocolVersion as schemaVersion } from '../commonProtocolEventSchema';
import { commonProtocolAbiVersion as signatureMapVersion } from '../evmEventSignatures';

const currentVersion = pkg.dependencies['@commonxyz/common-protocol-abis'];

let isValid = true;

if (schemaVersion !== currentVersion) {
  console.error(`❌ commonProtocolEventSchema is outdated:
  Current ABI version: ${currentVersion}
  commonProtocolVersion version:      ${schemaVersion}

Run: pnpm generate-event-schema`);
  isValid = false;
}

if (signatureMapVersion !== currentVersion) {
  console.error(`❌ evmEventSignatures is outdated:
  Current ABI version: ${currentVersion}
  commonProtocolAbiVersion version:   ${signatureMapVersion}

Run: pnpm generate-event-schema`);
  isValid = false;
}

if (!isValid) {
  process.exit(1);
}

console.log(
  `✅ commonProtocolEventSchema and evmEventSignatures are up to date with version ${currentVersion}`,
);
