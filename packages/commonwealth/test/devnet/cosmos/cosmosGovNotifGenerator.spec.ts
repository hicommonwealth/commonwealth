import { isDeliverTxSuccess } from '@cosmjs/stargate';
import { dispose } from '@hicommonwealth/core';
import { models, tester } from '@hicommonwealth/model';
import chai from 'chai';
import {
  encodeMsgSubmitProposal,
  encodeTextProposal,
} from 'controllers/chain/cosmos/gov/v1beta1/utils-v1beta1';
import { Any } from 'cosmjs-types/google/protobuf/any';
import { generateCosmosGovNotifications } from 'server/workers/cosmosGovNotifications/generateCosmosGovNotifications';
import sinon from 'sinon';
import { deposit, sendTx, setupTestSigner } from './utils/helpers';

const { expect } = chai;

const v1CommunityId = 'csdk-v1-local';
const v1RpcUrl = `http://localhost:8080/cosmosAPI/${v1CommunityId}`;
const v1Content = encodeTextProposal(`v1 title`, `v1 description`);

const v1Beta1CommunityId = 'csdk-beta-local';
const v1Beta1RpcUrl = `http://localhost:8080/cosmosAPI/${v1Beta1CommunityId}`;
const v1Beta1Content = encodeTextProposal(
  `beta text title`,
  `beta text description`,
);

async function createTestProposal(rpcUrl: string, content: Any) {
  const { signerAddress } = await setupTestSigner(rpcUrl);
  const msg = encodeMsgSubmitProposal(signerAddress, deposit, content);
  const resp = await sendTx(rpcUrl, msg);
  expect(resp.transactionHash).to.not.be.undefined;
  expect(resp.rawLog).to.not.be.undefined;
  expect(isDeliverTxSuccess(resp), 'TX failed').to.be.true;
}

async function enableCommunities(communities: string[]) {
  const possibleCommunities = [v1CommunityId, v1Beta1CommunityId];
  await models.sequelize.query(`
      DELETE FROM "NotificationsRead";
    `);
  await models.sequelize.query(`
      DELETE FROM "Notifications";
    `);

  const [user] = await models.User.findOrCreate({
    where: {
      email: 'drewstone329@gmail.com',
      emailVerified: true,
      isAdmin: true,
    },
  });

  for (const id of possibleCommunities) {
    if (communities.includes(id)) {
      await models.Subscription.findOrCreate({
        where: {
          subscriber_id: user.id,
          community_id: id,
          category_id: 'chain-event',
        },
      });
    } else {
      await models.Subscription.destroy({
        where: {
          subscriber_id: user.id,
          community_id: id,
        },
      });
    }
  }
}

describe('Cosmos Governance Notification Generator with real proposals', () => {
  before(async () => {
    await tester.seedDb();
    await enableCommunities([v1CommunityId, v1Beta1CommunityId]);
    await createTestProposal(v1RpcUrl, v1Content);
    await createTestProposal(v1Beta1RpcUrl, v1Beta1Content);
  });

  beforeEach('Clear notifications', async () => {
    await models.sequelize.query(`
      DELETE FROM "NotificationsRead";
    `);
    await models.sequelize.query(`
      DELETE FROM "Notifications";
    `);
  });

  after(async () => {
    await dispose()();
  });

  describe('v1 proposals', () => {
    it('should generate a single cosmos gov v1 notification when there are no existing notifications', async () => {
      await generateCosmosGovNotifications();
      const notifications = await models.Notification.findAll({
        where: {
          category_id: 'chain-event',
        },
      });
      expect(notifications.length).to.equal(2);
    });

    it('should not generate duplicate v1 notifications', async () => {
      await generateCosmosGovNotifications();
      await generateCosmosGovNotifications();
      const notifications = await models.Notification.findAll({
        where: {
          category_id: 'chain-event',
        },
      });
      expect(notifications.length).to.equal(2);
    });

    it('should generate notifications for all v1 proposals proposals since the last known notification', async () => {
      await generateCosmosGovNotifications();
      await createTestProposal(v1RpcUrl, v1Content);
      await createTestProposal(v1RpcUrl, v1Content);
      await generateCosmosGovNotifications();
      const notifications = await models.Notification.findAll({
        where: {
          category_id: 'chain-event',
        },
      });
      expect(notifications.length).to.equal(4);
    });

    it('should not generate any notifications for proposals older than 2 hours', async () => {
      await generateCosmosGovNotifications();
      await createTestProposal(v1RpcUrl, v1Content);

      const clock = sinon.useFakeTimers(Date.now());
      await clock.tickAsync(60_000 * 60 * 3); // advance time by 3 hours
      await generateCosmosGovNotifications();

      const notifications = await models.Notification.findAll({
        where: {
          category_id: 'chain-event',
        },
      });
      expect(notifications.length).to.equal(2);
      clock.restore();
    });
  });

  describe('v1beta1 proposals', () => {
    // eslint-disable-next-line max-len
    it('should generate a single cosmos gov v1beta1 notification when there are no existing notifications', async () => {
      await generateCosmosGovNotifications();
      const notifications = await models.Notification.findAll({
        where: {
          category_id: 'chain-event',
        },
      });
      expect(notifications.length).to.equal(2);
    });

    it('should not generate duplicate v1Beta1 notifications', async () => {
      await generateCosmosGovNotifications();
      await generateCosmosGovNotifications();
      const notifications = await models.Notification.findAll({
        where: {
          category_id: 'chain-event',
        },
      });
      expect(notifications.length).to.equal(2);
    });

    it('should generate notifications for multiple v1Beta1 proposals since the last known notification', async () => {
      await generateCosmosGovNotifications();
      await createTestProposal(v1Beta1RpcUrl, v1Beta1Content);
      await createTestProposal(v1Beta1RpcUrl, v1Beta1Content);
      await generateCosmosGovNotifications();
      const notifications = await models.Notification.findAll({
        where: {
          category_id: 'chain-event',
        },
      });
      expect(notifications.length).to.equal(4);
    });

    it('should not generate any notifications for proposals older than 2 hours', async () => {
      await generateCosmosGovNotifications();
      await createTestProposal(v1Beta1RpcUrl, v1Beta1Content);

      const clock = sinon.useFakeTimers(Date.now());
      await clock.tickAsync(60_000 * 60 * 3); // advance time by 3 hours
      await generateCosmosGovNotifications();

      const notifications = await models.Notification.findAll({
        where: {
          category_id: 'chain-event',
        },
      });
      expect(notifications.length).to.equal(2);
      clock.restore();
    });
  });

  describe('v1 and v1beta1 proposals', () => {
    // eslint-disable-next-line max-len
    it('should generate notifications for all v1 and v1beta1 proposals proposals since the last known notification', async () => {
      await generateCosmosGovNotifications();
      await createTestProposal(v1Beta1RpcUrl, v1Beta1Content);
      await createTestProposal(v1Beta1RpcUrl, v1Beta1Content);
      await createTestProposal(v1RpcUrl, v1Content);
      await createTestProposal(v1RpcUrl, v1Content);
      await generateCosmosGovNotifications();

      const notifications = await models.Notification.findAll({
        where: {
          category_id: 'chain-event',
        },
      });
      expect(notifications.length).to.equal(6);
    });

    it('should not generate any notifications for proposals older than 2 hours', async () => {
      await generateCosmosGovNotifications();
      await createTestProposal(v1Beta1RpcUrl, v1Beta1Content);
      await createTestProposal(v1RpcUrl, v1Content);

      const clock = sinon.useFakeTimers(Date.now());
      await clock.tickAsync(60_000 * 60 * 3); // advance time by 3 hours
      await generateCosmosGovNotifications();

      const notifications = await models.Notification.findAll({
        where: {
          category_id: 'chain-event',
        },
      });
      expect(notifications.length).to.equal(2);
      clock.restore();
    });
  });
});
