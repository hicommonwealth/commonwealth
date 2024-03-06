import { isDeliverTxSuccess } from '@cosmjs/stargate';
import { models, tester } from '@hicommonwealth/model';
import chai from 'chai';
import {
  encodeMsgSubmitProposal,
  encodeTextProposal,
} from 'controllers/chain/cosmos/gov/v1beta1/utils-v1beta1';
import { Any } from 'cosmjs-types/google/protobuf/any';
import sinon from 'sinon';
// eslint-disable-next-line max-len
import { dispose } from '@hicommonwealth/core';
import { generateCosmosGovNotifications } from '../../../server/workers/cosmosGovNotifications/generateCosmosGovNotifications';
import { deposit, sendTx, setupTestSigner } from './utils/helpers';

const { expect } = chai;

const v1ChainId = 'csdk-v1';
const v1RpcUrl = `http://localhost:8080/cosmosAPI/${v1ChainId}`;
const v1Content = encodeTextProposal(`v1 title`, `v1 description`);

const v1Beta1ChainId = 'csdk-beta-ci';
const v1Beta1RpcUrl = `http://localhost:8080/cosmosAPI/${v1Beta1ChainId}`;
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

async function enableChains(chains: string[]) {
  const possibleChains = [v1ChainId, v1Beta1ChainId];
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

  for (const id of possibleChains) {
    if (chains.includes(id)) {
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
  });
  after(async () => {
    await dispose()();
  });

  beforeEach('Clear notifications', async () => {
    await models.sequelize.query(`
      DELETE FROM "NotificationsRead";
    `);
    await models.sequelize.query(`
      DELETE FROM "Notifications";
    `);
  });

  describe('v1 proposals', () => {
    before('Setup DB objects and create proposal', async () => {
      await enableChains([v1ChainId]);
      await createTestProposal(v1RpcUrl, v1Content);
    });

    it('should generate a single cosmos gov v1 notification when there are no existing notifications', async () => {
      await generateCosmosGovNotifications();
      const notifications = await models.Notification.findAll({
        where: {
          category_id: 'chain-event',
        },
      });
      expect(notifications.length).to.equal(1);
    });

    it('should not generate duplicate v1 notifications', async () => {
      await generateCosmosGovNotifications();
      await generateCosmosGovNotifications();
      const notifications = await models.Notification.findAll({
        where: {
          category_id: 'chain-event',
        },
      });
      expect(notifications.length).to.equal(1);
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
      expect(notifications.length).to.equal(3);
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
      expect(notifications.length).to.equal(1);
      clock.restore();
    });
  });

  describe('v1beta1 proposals', () => {
    before('Setup DB objects and create proposal', async () => {
      await enableChains([v1Beta1ChainId]);
      await createTestProposal(v1Beta1RpcUrl, v1Beta1Content);
    });

    // eslint-disable-next-line max-len
    it('should generate a single cosmos gov v1beta1 notification when there are no existing notifications', async () => {
      await generateCosmosGovNotifications();
      const notifications = await models.Notification.findAll({
        where: {
          category_id: 'chain-event',
        },
      });
      expect(notifications.length).to.equal(1);
    });

    it('should not generate duplicate v1Beta1 notifications', async () => {
      await generateCosmosGovNotifications();
      await generateCosmosGovNotifications();
      const notifications = await models.Notification.findAll({
        where: {
          category_id: 'chain-event',
        },
      });
      expect(notifications.length).to.equal(1);
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
      expect(notifications.length).to.equal(3);
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
      expect(notifications.length).to.equal(1);
      clock.restore();
    });
  });

  describe('v1 and v1beta1 proposals', () => {
    before('Setup DB objects and create proposal', async () => {
      await enableChains([v1ChainId, v1Beta1ChainId]);
    });

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
