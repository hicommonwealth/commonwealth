import { trpc } from '@hicommonwealth/adapters';
import { dispose } from '@hicommonwealth/core';
import { readFile, unlink, writeFile } from 'fs/promises';
import pkg from 'openapi-diff';
import path from 'path';
import apiClientPackageJson from '../../../../libs/api-client/package.json';
import externalApiConfig from '../../external-api-config.json';
import { oasOptions, trpcRouter } from '../api/external-router';

const { diffSpecs } = pkg;

const EXTERNAL_API_CONFIG_PATH = 'external-api-config.json';

const productionOasPath = 'external-production-openapi.json';
const localOasPath = 'external-openapi.json';

async function updateVersionInFile(newVersion: string) {
  const updatedApiConfig = {
    ...externalApiConfig,
    version: newVersion,
  };
  await writeFile(
    EXTERNAL_API_CONFIG_PATH,
    JSON.stringify(updatedApiConfig),
    'utf8',
  );
  const updatedPackageJson = {
    ...apiClientPackageJson,
    version: newVersion,
  };
  await writeFile(
    '../../libs/api-client/package.json',
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
    throw new Error('Invalid SemVer string');
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

async function validateExternalApiVersioning() {
  // TODO: potentially fetch from github (libs/api-client/openapi.json) after #9526 is merged
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
  const newVersion = parseSemVer(newOas.info.version);

  if (oldVersion.major !== newVersion.major) {
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

  await Promise.all([unlink(productionOasPath), unlink(localOasPath)]);
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
