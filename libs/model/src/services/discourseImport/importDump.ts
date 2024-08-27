import { logger } from '@hicommonwealth/core';
import { exec } from 'child_process';

const log = logger(import.meta);

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
