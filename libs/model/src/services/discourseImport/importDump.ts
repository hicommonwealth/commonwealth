import { exec } from 'child_process';

export function importDump(dumpUrl: string, dbUri: string): Promise<void> {
  const command = `curl -s ${dumpUrl} | psql ${dbUri}`;
  console.log('running command: ', command);
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        reject(err);
        return;
      }
      if (stderr?.length > 0) {
        console.error(stderr);
      }
      resolve();
    });
  });
}
