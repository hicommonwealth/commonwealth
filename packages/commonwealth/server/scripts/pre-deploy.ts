/* eslint-disable n/no-process-exit, no-fallthrough */
import fetch, { Response } from 'node-fetch';
import { config } from '../config';

const RAILWAY_GIT_COMMIT_SHA: string = config.RAILWAY.RAILWAY_GIT_COMMIT_SHA!;
const RELEASER_URL: string = config.RAILWAY.RELEASER_URL!;
const RELEASER_API_KEY: string = config.RAILWAY.RELEASER_API_KEY!;

if (!RAILWAY_GIT_COMMIT_SHA || !RELEASER_URL || !RELEASER_API_KEY) {
  console.error(
    `Error: RAILWAY_GIT_COMMIT_SHA, RELEASER_URL, RELEASER_API_KEY is not set.`,
  );
  process.exit(1);
}

(async () => {
  const url = `${RELEASER_URL}/queue`;
  console.log(
    `Triggering release for commit: ${RAILWAY_GIT_COMMIT_SHA} at ${url}`,
  );
  try {
    const response: Response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': RELEASER_API_KEY,
      },
      body: JSON.stringify({ commitSha: RAILWAY_GIT_COMMIT_SHA }),
    });
    const json = await response.json();

    if (response.status === 200) {
      console.log(json);
    } else if (response.status === 202) {
      if (['failed', 'timeout'].includes(json.release.release_status)) {
        console.error(`Release already failed. Exiting...`, json.release);
        process.exit(1);
      } else if (json.release.release_status === 'success') {
        console.log('Release already executed successfully.', json.release);
        process.exit(0);
      } else {
        console.log(json);
      }
    } else {
      console.error(`Failed to queue release. Status: ${response.status}`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Failed to queue release:', err);
    process.exit(1);
  }

  // Wait for release to complete with a 30-minute timeout
  const START_TIME: number = Date.now();
  const TIMEOUT: number = 30 * 60 * 1000; // 30 minutes in ms

  while (true) {
    let STATUS: string | undefined;
    try {
      const releaseUrl = `${RELEASER_URL}/release?commitSha=${RAILWAY_GIT_COMMIT_SHA}`;
      console.log(
        `Checking release status for ${RAILWAY_GIT_COMMIT_SHA} at ${releaseUrl}`,
      );
      const res: Response = await fetch(releaseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': RELEASER_API_KEY,
        },
      });

      if (res.status === 400) {
        console.error('Bad request when checking release status');
        // eslint-disable-next-line n/no-process-exit
        process.exit(1);
      } else if (res.status === 200) {
        const data: { release_status: string } = await res.json();
        if (!data.release_status) {
          console.warn('Release not found!');
        }
        STATUS = data.release_status;
      } else {
        console.error(
          `Unexpected status code when checking release: ${res.status}`,
        );
      }
    } catch (err) {
      console.error('Failed to check release status:', err);
      process.exit(1);
    }

    switch (STATUS) {
      case 'success':
        console.log('Release completed successfully!');
        process.exit(0);
      case 'failed':
        console.error('Release failed!');
        process.exit(1);
      case 'timeout':
        console.error('Release timed out!');
        process.exit(1);
      case 'running':
        console.log('Release is running, waiting...');
        break;
      case 'queued':
        console.log('Release is queued, waiting...');
        break;
      default:
        console.log(`Release status: ${STATUS}, waiting...`);
    }

    const ELAPSED: number = Date.now() - START_TIME;
    if (ELAPSED >= TIMEOUT) {
      console.error('Timed out waiting for release after 30 minutes.');
      process.exit(1);
    }

    await new Promise((r) => setTimeout(r, 10000));
  }
})();
