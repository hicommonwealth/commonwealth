import { logger } from '@hicommonwealth/logging';
import { exec } from 'child_process';

const log = logger(__filename);

export function importDump(dumpUrl: string, dbUri: string): Promise<void> {
  const command = `curl -s ${dumpUrl} | psql ${dbUri}`;
  log.debug(`running command: ${command}`);
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        reject(err);
        return;
      }
      if (stderr?.length > 0) {
        log.error(stderr);
      }
      resolve();
    });
  });
}
