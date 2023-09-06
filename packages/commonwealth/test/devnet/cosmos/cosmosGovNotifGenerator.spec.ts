import chai from 'chai';
import { deposit, sendTx, setupTestSigner } from './utils/helpers';
import models from '../../../server/database';
import {
  encodeMsgSubmitProposal,
  encodeTextProposal,
} from 'controllers/chain/cosmos/gov/v1beta1/utils-v1beta1';
import { Any } from 'cosmjs-types/google/protobuf/any';
import { isDeliverTxSuccess } from '@cosmjs/stargate';
import { generateCosmosGovNotifications } from '../../../server/cosmos-gov-notifications/generateCosmosGovNotifications';
import { resetDatabase } from '../../../server-test';
import {
  BalanceType,
  ChainBase,
  ChainNetwork,
  ChainType,
} from 'common-common/src/types';
import { CosmosApiType } from 'controllers/chain/cosmos/chain';
import {
  getRPCClient,
  getTMClient,
} from 'controllers/chain/cosmos/chain.utils';

const { expect, assert } = chai;

const v1ChainId = 'csdk-v1';
const v1Beta1ChainId = 'csdk-beta-ci';

describe.only('Cosmos Governance Notification Generator with real proposals', () => {
  describe('v1 proposals', () => {
    const content = encodeTextProposal(`v1 title`, `v1 description`);
    const rpcUrl = `http://localhost:8080/cosmosAPI/${v1ChainId}`;
    before('Setup DB objects and create proposal', async () => {
      await models.Chain.update(
        { has_chain_events_listener: false },
        { where: { id: v1Beta1ChainId } }
      );
      await models.Chain.update(
        { has_chain_events_listener: true },
        { where: { id: v1ChainId } }
      );

      const { signerAddress } = await setupTestSigner(rpcUrl);
      const msg = encodeMsgSubmitProposal(signerAddress, deposit, content);
      const resp = await sendTx(rpcUrl, msg);
      expect(resp.transactionHash).to.not.be.undefined;
      expect(resp.rawLog).to.not.be.undefined;
      expect(isDeliverTxSuccess(resp), 'TX failed').to.be.true;
    });

    beforeEach(async () => {
      await models.Notification.destroy({
        truncate: true,
      });
    });

    it('should generate a cosmos gov v1 notification', async () => {
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
  });

  describe('v1beta1 proposals', () => {
    const content = encodeTextProposal(
      `beta text title`,
      `beta text description`
    );
    const rpcUrlBeta = `http://localhost:8080/cosmosAPI/${v1Beta1ChainId}`;

    before('Setup DB objects and create proposal', async () => {
      await models.Chain.update(
        { has_chain_events_listener: false },
        { where: { id: v1ChainId } }
      );
      await models.Chain.update(
        { has_chain_events_listener: true },
        { where: { id: v1Beta1ChainId } }
      );

      const { signerAddress } = await setupTestSigner(rpcUrlBeta);

      const msg = encodeMsgSubmitProposal(signerAddress, deposit, content);
      const resp = await sendTx(rpcUrlBeta, msg);

      expect(resp.transactionHash).to.not.be.undefined;
      expect(resp.rawLog).to.not.be.undefined;
      expect(isDeliverTxSuccess(resp), 'TX failed').to.be.true;
    });

    beforeEach(async () => {
      await models.Notification.destroy({
        truncate: true,
      });
    });

    it('should generate a single cosmos gov v1beta1 notification', async () => {
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
  });
});
