import { logger } from '@hicommonwealth/core';
import { readFileSync } from 'fs';
import fetch from 'node-fetch';
import { App } from 'octokit';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config';

const __dirname = dirname(fileURLToPath(import.meta.url));

const log = logger(import.meta);
const externalApiConfig = JSON.parse(
  readFileSync(path.join(__dirname, '../external-api-config.json'), 'utf8'),
);

const owner = 'hicommonwealth';
const repo = 'common-api-fern-config';
const workflow_id = 'publish.yml';
const API_CLIENT_NPM_NAME = '@commonxyz/api-client';

export async function getOctokit() {
  if (
    !config.GITHUB.DISPATCHER_APP_ID ||
    !config.GITHUB.DISPATCHER_APP_PRIVATE_KEY
  ) {
    log.error('Missing GitHub app credentials');
    return;
  }
  const app = new App({
    appId: config.GITHUB.DISPATCHER_APP_ID,
    privateKey: config.GITHUB.DISPATCHER_APP_PRIVATE_KEY,
  });

  // https://docs.github.com/en/rest/apps/apps?#get-a-repository-installation-for-the-authenticated-app
  const { data: installation } = await app.octokit.request(
    `GET /repos/{owner}/{repo}/installation`,
    { owner, repo },
  );

  return app.getInstallationOctokit(installation.id);
}

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

  const url = `/repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches`;

  try {
    const octokit = await getOctokit();
    if (!octokit) return;
    const res = await octokit.request(`POST ${url}`, {
      owner,
      repo,
      workflow_id,
      ref: 'main',
      inputs: {
        version: externalApiConfig.version,
      },
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (res.status !== 204) {
      log.fatal(`Failed to dispatch workflow: ${res.status}`);
    } else {
      log.info('Workflow dispatched successfully');
    }
  } catch (error) {
    log.fatal('Error dispatching workflow', error);
  }
}
