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
    log.info('Emitting a chain event');
    await emitEvent(models.Outbox, [
      {
        event_name: EventNames.ChainEventCreated,
        event_payload: {
          eventSource: {
            kind: 'Trade',
            chainNodeId: 1399,
            eventSignature:
              '0xfc13c9a8a9a619ac78b803aecb26abdd009182411d51a986090f82519d88a89e',
          },
          rawLog: {
            blockNumber: 12778141,
            blockHash:
              '0xca61ffd61d5230444ea82700da798b58861787b77cd79d91dc1c17cdca95f475',
            transactionIndex: 1,
            removed: false,
            address: '0xd097926d8765a7717206559e7d19eeccbba68c18',
            // eslint-disable-next-line max-len
            data: '0x0000000000000000000000008bd1207d8305cf176c1544d1fe8caa12b1b76fdf000000000000000000000000d7f82204b1f47bfde583a8d360986b31f22d3dae000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000007fba274cf70000000000000000000000000000000000000000000000000000000662e85d72c000000000000000000000000000000000000000000000000000000662e85d72c0000000000000000000000000000000000000000000000000000000000000000240000000000000000000000000000000000000000000000000000000000000000',
            topics: [
              '0xfc13c9a8a9a619ac78b803aecb26abdd009182411d51a986090f82519d88a89e',
            ],
            transactionHash:
              '0x2ed9d64010f1ddbcaf40fa7547d525bda91a7e3aaa27d1aa78a9b9273c2cbb0f',
            logIndex: 1,
          },
          parsedArgs: [
            '0x8bD1207d8305CF176c1544d1fe8CAA12b1B76FDf', // trader
            '0xD7f82204b1F47BFdE583a8d360986b31F22D3DAe', // namespace address
            true,
            { type: 'BigNumber', hex: '0x04' }, // community token amount
            { type: 'BigNumber', hex: '0x07fba274cf7000' }, // eth amount
            { type: 'BigNumber', hex: '0x662e85d72c00' }, // protocol eth amount
            { type: 'BigNumber', hex: '0x662e85d72c00' }, // namespace eth amount
            { type: 'BigNumber', hex: '0x24' }, // supply
            '0x0000000000000000000000000000000000000000', // exchange token
          ],
        },
      },
    ]);
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
