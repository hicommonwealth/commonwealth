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

const { expect, assert } = chai;

const idV1 = 'csdk-v1'; // V1 CI devnet
const rpcUrl = `http://localhost:8080/cosmosAPI/${idV1}`;
const lcdUrl = `http://localhost:8080/cosmosLCD/${idV1}`;
let content: Any;

describe('Cosmos Governance Notification Generator with real proposals', () => {
  describe('v1 proposals', () => {
    content = encodeTextProposal(`v1 title`, `v1 description`);
    before('Reset database and create proposal', async () => {
      await resetDatabase();

      const { signerAddress } = await setupTestSigner(rpcUrl);
      const msg = encodeMsgSubmitProposal(signerAddress, deposit, content);
      const resp = await sendTx(rpcUrl, msg);
      expect(resp.transactionHash).to.not.be.undefined;
      expect(resp.rawLog).to.not.be.undefined;
      expect(isDeliverTxSuccess(resp), 'TX failed').to.be.true;
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
  });

  describe('v1beta1 proposals', () => {});
});
