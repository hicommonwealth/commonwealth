import fetch, { Response } from 'node-fetch';

const REQUIRED_VARS: string[] = ['RAILWAY_GIT_COMMIT_SHA', 'RELEASER_URL'];
for (const VAR of REQUIRED_VARS) {
  if (!process.env[VAR]) {
    console.error(`Error: ${VAR} environment variable is not set.`);
    process.exit(1);
  }
}

const RAILWAY_GIT_COMMIT_SHA: string = process.env.RAILWAY_GIT_COMMIT_SHA!;
const RELEASER_URL: string = process.env.RELEASER_URL!;

// Check if release trigger is enabled (first argument)
const TRIGGER_RELEASE: boolean =
  process.argv[2] !== undefined ? process.argv[2] === 'true' : true;

(async () => {
  if (TRIGGER_RELEASE) {
    console.log(`Triggering release for commit: ${RAILWAY_GIT_COMMIT_SHA}`);
    const url = `${RELEASER_URL}/queue`;
    try {
      const response: Response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commitSha: RAILWAY_GIT_COMMIT_SHA }),
      });

      if (response.status === 200) {
        console.log('Release queued successfully');
      } else if (response.status === 202) {
        console.log('Release is already queued');
      } else {
        console.error(`Failed to queue release. Status: ${response.status}`);
        process.exit(1);
      }
    } catch (err) {
      console.error('Failed to queue release:', err);
      process.exit(1);
    }
  } else {
    console.log('Skipping release trigger, waiting for existing release...');
  }

  // Wait for release to complete with a 30-minute timeout
  const START_TIME: number = Date.now();
  const TIMEOUT: number = 30 * 60 * 1000; // 30 minutes in ms

  while (true) {
    let STATUS: string | undefined;
    try {
      const url = `${RELEASER_URL}/release?commit-sha=${RAILWAY_GIT_COMMIT_SHA}`;
      console.log(`Checking release status at ${url}`);
      const res: Response = await fetch(url);

      if (res.status === 400) {
        console.error('Bad request when checking release status');
        process.exit(1);
      } else if (res.status === 200) {
        const data: { release_status: string } = await res.json();
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
