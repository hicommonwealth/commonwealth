import { trpc } from '@hicommonwealth/adapters';
import { readFile, writeFile } from 'fs/promises';
import pkg from 'openapi-diff';
import path from 'path';
import { oasOptions, trpcRouter } from '../api/external-router';

const { diffSpecs } = pkg;

const versioningPath = path.resolve(
  'packages/commonwealth/server/api/external-router.ts',
);
const sourcePath = 'external-production-openapi.json';
const destinationPath = 'external-openapi.json';

async function updateVersionInFile(filePath, newVersion) {
  let fileContent = await readFile(filePath, 'utf8');

  const versionPattern = /version:\s*'(\d+\.\d+\.\d+)'/g;
  const updatedContent = fileContent.replace(
    versionPattern,
    `version: '${newVersion}'`,
  );

  await writeFile(filePath, updatedContent, 'utf8');
}

function parseSemVer(version) {
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

async function downloadFile(url, outputFileName) {
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
  await downloadFile('https://commonwealth.im/api/v1/openapi.json', sourcePath);

  const newOas = trpc.toOpenApiDocument(
    trpcRouter,
    'http://commonwealth.im',
    oasOptions,
  );
  await writeFile(destinationPath, JSON.stringify(newOas, null, 2), 'utf8');

  const sourceContent = await readFile(sourcePath, 'utf8');

  const oldVersion = parseSemVer(JSON.parse(sourceContent).info.version);
  const newVersion = parseSemVer(newOas.info.version);

  if (oldVersion.major !== newVersion.major) {
    if (newVersion.minor !== 0 || newVersion.patch !== 0) {
      const newMajorVersion = `${newVersion.major}.0.0`;
      await updateVersionInFile(versioningPath, newMajorVersion);
      console.log(
        `Bumped OAS version from ${readableVersion(oldVersion)} to ${newMajorVersion}`,
      );
    }
    return; // Breaking change, this is valid regardless of schema changes
  }

  const result = await diffSpecs({
    sourceSpec: {
      content: sourceContent,
      location: path.basename(sourcePath),
      format: 'openapi3',
    },
    destinationSpec: {
      content: JSON.stringify(newOas),
      location: path.basename(destinationPath),
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
    await updateVersionInFile(versioningPath, newVersionMinor);

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
    await updateVersionInFile(versioningPath, newVersionPatch);

    console.log(
      `Bumped patch version from ${readableVersion(oldVersion)} to ${newVersionPatch}`,
    );
    return;
  }
}

validateExternalApiVersioning()
  .then(() => {
    console.log('Finished openapi versioning');
  })
  .catch((error) => {
    console.error('Failed to validate openapi versioning', error);
    throw error;
  });
