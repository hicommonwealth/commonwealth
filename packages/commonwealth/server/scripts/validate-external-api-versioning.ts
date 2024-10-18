import { trpc } from '@hicommonwealth/adapters';
import { dispose } from '@hicommonwealth/core';
import { readFileSync } from 'fs';
import { readFile, unlink, writeFile } from 'fs/promises';
import pkg from 'openapi-diff';
import path from 'path';
import { fileURLToPath } from 'url';
import { oasOptions, trpcRouter } from '../api/external-router';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { diffSpecs } = pkg;

const externalApiConfig = JSON.parse(
  readFileSync(path.join(__dirname, '../external-api-config.json'), 'utf8'),
);

const apiClientPackageJson = JSON.parse(
  readFileSync(
    path.join(__dirname, '../../../../libs/api-client/package.json'),
    'utf8',
  ),
);

const productionOasPath = 'external-production-openapi.json';
const localOasPath = 'external-openapi.json';

async function updateVersionInFile(newVersion: string) {
  const updatedApiConfig = {
    ...externalApiConfig,
    version: newVersion,
  };
  await writeFile(
    path.join(__dirname, '../external-api-config.json'),
    JSON.stringify(updatedApiConfig),
    'utf8',
  );
  const updatedPackageJson = {
    ...apiClientPackageJson,
    version: newVersion,
  };
  await writeFile(
    path.join(__dirname, '../../libs/api-client/package.json'),
    JSON.stringify(updatedPackageJson),
    'utf8',
  );
}

function parseSemVer(version: string) {
  const regex = /^(\d+)\.(\d+)\.(\d+)$/;
  const match = version.match(regex);

  if (match) {
    return {
      major: parseInt(match[1]),
      minor: parseInt(match[2]),
      patch: parseInt(match[3]),
    };
  } else {
    throw new Error(`Invalid SemVer string: ${version}`);
  }
}

async function downloadFile(url: string, outputFileName: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  const data = await response.text();

  await writeFile(outputFileName, data, 'utf8');

  console.log('Downloaded openapi spec successfully');
}

function readableVersion(version: {
  major: number;
  minor: number;
  patch: number;
}) {
  return `${version.major}.${version.minor}.${version.patch}`;
}

// Returns true if versionOne is greater than versionTwo
function compareSemVersions(versionOne: string, versionTwo: string) {
  const oneRes = parseSemVer(versionOne);
  const twoRes = parseSemVer(versionTwo);

  if (oneRes.major > twoRes.major) return true;
  else if (oneRes.major === twoRes.major && oneRes.minor > twoRes.minor)
    return true;
  else if (
    oneRes.major === twoRes.major &&
    oneRes.minor === twoRes.minor &&
    oneRes.patch > twoRes.patch
  )
    return true;

  return false;
}

async function validateExternalApiVersioning() {
  // verify matching version numbers
  if (externalApiConfig.version !== apiClientPackageJson.version) {
    throw new Error(
      `Mismatching version from external api config (${externalApiConfig.version}) ` +
        `and api-client/package.json (${apiClientPackageJson.version})`,
    );
  }

  // NPM version must be provided since the version on master is never updated
  if (!process.argv[2] || typeof process.argv[2] !== 'string') {
    throw new Error('Must provide @commonxyz/api-client package version');
  }

  await downloadFile(
    'https://commonwealth.im/api/v1/openapi.json',
    productionOasPath,
  );

  const newOas = trpc.toOpenApiDocument(
    trpcRouter,
    'http://commonwealth.im', // host must be the same as production
    oasOptions,
  );
  await writeFile(localOasPath, JSON.stringify(newOas, null, 2), 'utf8');

  const sourceContent = await readFile(productionOasPath, 'utf8');

  const oldVersion = parseSemVer(JSON.parse(sourceContent).info.version);

  // Use the local version only if it is greater than the npm version.
  // If local version > npm version that means CI already bumped versions
  // after a push to a PR to be merged into production branch
  const newVersion = compareSemVersions(newOas.info.version, process.argv[2])
    ? parseSemVer(newOas.info.version)
    : parseSemVer(process.argv[2]);

  if (oldVersion.major < newVersion.major) {
    if (newVersion.minor !== 0 || newVersion.patch !== 0) {
      const newMajorVersion = `${newVersion.major}.0.0`;
      await updateVersionInFile(newMajorVersion);
      console.log(
        `Bumped OAS version from ${readableVersion(oldVersion)} to ${newMajorVersion}`,
      );
    }
    return; // Breaking change, this is valid regardless of schema changes
  }

  const result = await diffSpecs({
    sourceSpec: {
      content: sourceContent,
      location: path.basename(productionOasPath),
      format: 'openapi3',
    },
    destinationSpec: {
      content: JSON.stringify(newOas),
      location: path.basename(localOasPath),
      format: 'openapi3',
    },
  });
  await Promise.all([unlink(productionOasPath), unlink(localOasPath)]);

  if (result.breakingDifferencesFound) {
    throw Error('External API has breaking changes, update the Major version');
  }

  if (
    oldVersion.minor === newVersion.minor &&
    result.nonBreakingDifferences.filter((c) => c.action === 'add').length > 0
  ) {
    const newVersionMinor = `${oldVersion.major}.${oldVersion.minor + 1}.0`;
    await updateVersionInFile(newVersionMinor);

    console.log(
      `Bumped minor version from ${readableVersion(oldVersion)} to ${newVersionMinor}`,
    );
    return;
  }

  if (
    oldVersion.patch === newVersion.patch &&
    result.nonBreakingDifferences.length > 0
  ) {
    const newVersionPatch = `${oldVersion.major}.${oldVersion.minor}.${oldVersion.patch + 1}`;
    await updateVersionInFile(newVersionPatch);

    console.log(
      `Bumped patch version from ${readableVersion(oldVersion)} to ${newVersionPatch}`,
    );
    return;
  }

  console.log(`No version updated: ${readableVersion(oldVersion)}`);
}

if (import.meta.url.endsWith(process.argv[1])) {
  validateExternalApiVersioning()
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
