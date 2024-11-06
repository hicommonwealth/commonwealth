import { logger } from '@hicommonwealth/core';
import { readFileSync } from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import { config } from '../config';

const log = logger(import.meta);
const externalApiConfig = JSON.parse(
  readFileSync(path.join(__dirname, '../external-api-config.json'), 'utf8'),
);

const API_CLIENT_GH_ORG = 'hicommonwealth';
const API_CLIENT_GH_REPO = 'api-client';
const API_CLIENT_PUBLISH_WORKFLOW_FILE_NAME = 'publish.yml';
const API_CLIENT_NPM_NAME = '@commonxyz/api-client';

export async function dispatchSDKPublishWorkflow() {
  let currentVersionNPM: string | undefined = undefined;

  try {
    const response = await fetch(
      `https://registry.npmjs.org/${API_CLIENT_NPM_NAME}`,
    );
    if (!response.ok) {
      log.fatal(
        `Failed to fetch package info: ${response.status} - ${response.statusText}`,
      );
    } else {
      const packageInfo = await response.json();
      currentVersionNPM = packageInfo['dist-tags'].latest;
      log.info(
        `Current version of @commonxyz/api-client is ${currentVersionNPM}`,
      );
    }
  } catch (error) {
    log.fatal('Error fetching package info', error);
  }

  if (!currentVersionNPM) return;

  // nothing to publish if versions are equal
  if (currentVersionNPM === externalApiConfig.version) {
    log.info(
      `Current API client package version (${currentVersionNPM}) is equal to ` +
        `the existing OpenAPI spec version (${externalApiConfig.version})`,
    );
    return;
  }

  const url =
    `https://api.github.com/repos/${API_CLIENT_GH_ORG}/${API_CLIENT_GH_REPO}` +
    `/actions/workflows/${API_CLIENT_PUBLISH_WORKFLOW_FILE_NAME}/dispatches`;

  const data = {
    ref: 'main',
    inputs: {
      version: externalApiConfig.version,
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${config.GITHUB.API_CLIENT_REPO_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.status !== 204) {
      log.fatal(
        `Failed to dispatch workflow: ${response.status} - ${response.statusText}`,
      );
    } else {
      log.info('Workflow dispatched successfully');
    }
  } catch (error) {
    log.fatal('Error dispatching workflow', error);
  }
}
