import { fetchLatestNotifProposalIds } from '../../server/cosmos-gov-notifications';
import { resetDatabase } from '../../server-test';
import models from '../../server/database';
import { expect } from 'chai';

async function createFakeProposalNotification(
  proposalId: string,
  chainId: string
): Promise<{ event_data: { id: string } }> {
  const notifData = {
    event_data: {
      id: proposalId,
    },
  };
  await models.Notification.create({
    category_id: 'chain-event',
    chain_id: chainId,
    notification_data: JSON.stringify(notifData),
  });

  return notifData;
}

describe.only('CosmosGovNotifGenerator', () => {
  before('Reset database', async () => {
    await resetDatabase();
  });

  describe('Utility function tests', () => {
    it('should fetch the latest proposal ids', async () => {
      await createFakeProposalNotification('1', 'edgeware');
      const latestEdgewareProposal = await createFakeProposalNotification(
        '2',
        'edgeware'
      );
      await createFakeProposalNotification('1', 'ethereum');
      const latestEthereumProposal = await createFakeProposalNotification(
        '2',
        'ethereum'
      );

      const result = await fetchLatestNotifProposalIds([
        'edgeware',
        'ethereum',
      ]);
      expect(result).to.deep.include({
        chain_id: 'edgeware',
        proposal_id: latestEdgewareProposal.event_data.id,
      });
      expect(result).to.deep.include({
        chain_id: 'ethereum',
        proposal_id: latestEthereumProposal.event_data.id,
      });
      expect(result).to.not.deep.include({
        chain_id: 'edgeware',
        proposal_id: '1',
      });
      expect(result).to.not.deep.include({
        chain_id: 'ethereum',
        proposal_id: '1',
      });
    });
  });
});
