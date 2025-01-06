import { dispose, logger } from '@hicommonwealth/core';
import { emitEvent, models } from '@hicommonwealth/model';
import { EventNames } from '@hicommonwealth/schemas';
import { SnapshotEventType } from '@hicommonwealth/shared';

const log = logger(import.meta);

async function main() {
  if (process.argv[2] === 'snapshot') {
    log.info('Emitting a snapshot event');
    await emitEvent(models.Outbox, [
      {
        event_name: EventNames.SnapshotProposalCreated,
        event_payload: {
          id: '0x5ed0465ba58b442f1e671789797d5e36b538a27603549639a34f95451b59ad32',
          title: 'Some Title',
          body: 'Some Body',
          choices: ['yes', 'no'],
          space: 'dydxgov.eth',
          event: SnapshotEventType.Created,
          start: 1721340530706,
          expire: 1721340563390,
          token: 'some token',
          secret: 'some secret',
        },
      },
    ]);
  } else if (process.argv[2] === 'chain-event') {
    log.error('Not implemented');
  } else {
    throw new Error('Unsupported event type');
  }

  log.info('Event emitted');
}

if (import.meta.url.endsWith(process.argv[1])) {
  main()
    .then(() => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('EXIT', true);
    })
    .catch((err) => {
      console.log('Failed to delete user', err);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('ERROR', true);
    });
}
