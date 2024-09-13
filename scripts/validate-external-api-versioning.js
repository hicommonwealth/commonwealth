import { readFile, writeFile } from 'fs/promises';
import pkg from 'openapi-diff';
import path from 'path';

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

async function validateExternalApiVersioning() {
  await downloadFile('https://commonwealth.im/api/v1/openapi.json', sourcePath);
  await downloadFile(
    'http://localhost:8080/api/v1/openapi.json',
    destinationPath,
  );

  const sourceContent = await readFile(sourcePath, 'utf8');
  const destinationContent = await readFile(destinationPath, 'utf8');

  const oldVersion = parseSemVer(JSON.parse(sourceContent).info.version);
  const newVersion = parseSemVer(JSON.parse(destinationContent).info.version);

  if (oldVersion.major !== newVersion.major) {
    return; // Breaking change, this is valid regardless of schema changes
  }

  const result = await diffSpecs({
    sourceSpec: {
      content: sourceContent,
      location: path.basename(sourcePath),
      format: 'openapi3',
    },
    destinationSpec: {
      content: destinationContent,
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
    await updateVersionInFile(
      versioningPath,
      `${oldVersion.major}.${oldVersion.minor + 1}.${oldVersion.patch}`,
    );

    console.log('Updated minor version');
    return;
  }

  if (
    oldVersion.patch === newVersion.patch &&
    result.nonBreakingDifferences.length > 0
  ) {
    await updateVersionInFile(
      versioningPath,
      `${oldVersion.major}.${oldVersion.minor}.${oldVersion.patch + 1}`,
    );

    console.log('Updated oatch version');
    return;
  }

  throw Error('Should not have reached here');
}

validateExternalApiVersioning()
  .then(() => {
    console.log('Finished openapi versioning');
  })
  .catch((error) => {
    console.error('Failed to validate openapi versioning', error);
    throw error;
  });
