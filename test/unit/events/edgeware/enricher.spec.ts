import chai from 'chai';

import EdgewareEnricherFunc from '../../../../shared/events/edgeware/filters/enricher';
import { constructFakeApi } from './testUtil';

const { assert } = chai;

/* eslint-disable: dot-notation */
describe('Edgeware Event Enricher Filter Tests', () => {
  /** staking events */
  it('should enrich reward event', async () => {

  });
  it('should enrich slash event', async () => {

  });
  it('should enrich bonded event', async () => {

  });
  it('should enrich unbonded event', async () => {

  });

  /** democracy events */
  it('should enrich vote-delegated event', async () => {

  });
  it('should enrich democracy-proposed event', async () => {

  });
  it('should enrich democracy-tabled event', async () => {

  });
  it('should enrich democracy-started event', async () => {

  });
  it('should enrich democracy-passed event', async () => {

  });
  it('should enrich democracy-not-passed event', async () => {

  });
  it('should enrich democracy-cancelled event', async () => {

  });
  it('should enrich democracy-executed event', async () => {

  });

  /** preimage events */
  it('should enrich preimage-noted event', async () => {

  });
  it('should enrich preimage-used event', async () => {

  });
  it('should enrich preimage-invalid event', async () => {

  });
  it('should enrich preimage-missing event', async () => {

  });
  it('should enrich preimage-reaped event', async () => {

  });

  /** treasury events */
  it('should enrich treasury-proposed event', async () => {

  });
  it('should enrich treasury-awarded event', async () => {

  });
  it('should enrich treasury-rejected event', async () => {

  });

  /** elections events */
  it('should enrich election-new-term event', async () => {

  });
  it('should enrich election-empty-term event', async () => {

  });
  it('should enrich election-member-kicked event', async () => {

  });
  it('should enrich election-member-renounced event', async () => {

  });

  /** collective events */
  it('should enrich collective-proposed event', async () => {

  });
  it('should enrich collective-approved event', async () => {

  });
  it('should enrich collective-disapproved event', async () => {

  });
  it('should enrich collective-executed event', async () => {

  });
  it('should enrich collective-member-executed event', async () => {

  });

  /** signaling events */
  it('should enrich signaling-new-proposal event', async () => {

  });
  it('should enrich signaling-commit-started event', async () => {

  });
  it('should enrich signaling-voting-started event', async () => {

  });
  it('should enrich signaling-voting-completed event', async () => {

  });

  /** other */
  it('should not enrich invalid event', async () => {

  });
  it('should not enrich with invalid API query', async () => {

  });
});
