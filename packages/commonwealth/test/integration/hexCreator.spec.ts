import chai from 'chai';
import chaiHttp from 'chai-http';
import { WalletId } from 'common-common/src/types';
import { ethers } from 'ethers';
import { resetDatabase } from '../../server-test';
import models from '../../server/database';
import { HexCreator } from '../../server/util/hexCreator';

chai.use(chaiHttp);
const { expect } = chai;

describe('HexCreator Tests', () => {
  beforeEach('Reset database', async () => {
    await resetDatabase();
  });

  describe('Tests what the hexCreator creates', () => {
    it('Should only add hex to Cosmos wallet Addresses ', async () => {
      // create old cosmos address
      const cosmosAddress = await models.Address.create({
        address: 'osmo18q3tlnx8vguv2fadqslm7x59ejauvsmnhltgq6',
        chain: 'osmosis',
        wallet_id: WalletId.Keplr,
        verification_token: 'blah',
        created_at: new Date('2021-01-01'),
        updated_at: new Date('2021-01-01'),
        hex: 'temp1', // validation requires hex to be set, but we will overwrite it
      });

      // create eth address
      await models.Address.create({
        address: ethers.Wallet.createRandom().address,
        chain: 'ethereum',
        wallet_id: WalletId.Metamask,
        verification_token: 'blah',
        created_at: new Date('2021-01-01'),
        updated_at: new Date('2021-01-01'),
      });

      const hexCreator = new HexCreator();
      hexCreator.init(models, undefined, true);
      await hexCreator.executeQueries();

      const cosmosAddressUpdated = await models.Address.findOne({
        where: { id: cosmosAddress.id },
      });
      const ethAddresses = await models.Address.findAll({
        where: { wallet_id: WalletId.Metamask },
      });

      expect(cosmosAddressUpdated.hex).to.equal(
        '3822bfccc76238c527ad043fbf1a85ccbbc64373'
      );
      for (const ethAddress of ethAddresses) {
        expect(ethAddress.hex).to.equal(null);
      }
    });
    it('Cosmos addresses with the same signer should have the same hex', async () => {
      const expectedHex = '3822bfccc76238c527ad043fbf1a85ccbbc64373';
      const csdkAddress = await models.Address.create({
        address: 'cosmos18q3tlnx8vguv2fadqslm7x59ejauvsmnlycckg',
        chain: 'csdk',
        wallet_id: WalletId.Keplr,
        verification_token: 'blah',
        created_at: new Date('2021-01-01'),
        updated_at: new Date('2021-01-01'),
        hex: 'temp2', // validation requires hex to be set, but we will overwrite it
      });

      const osmosisAddress = await models.Address.create({
        address: 'osmo18q3tlnx8vguv2fadqslm7x59ejauvsmnhltgq6',
        chain: 'osmosis',
        wallet_id: WalletId.Keplr,
        verification_token: 'blah',
        created_at: new Date('2021-01-02'),
        updated_at: new Date('2021-01-02'),
        hex: 'temp3', // validation requires hex to be set, but we will overwrite it
      });

      const hexCreator = new HexCreator();
      hexCreator.init(models, undefined, true);
      await hexCreator.executeQueries();

      const csdkAddressUpdated = await models.Address.findOne({
        where: { id: csdkAddress.id },
      });
      const osmosisAddressUpdated = await models.Address.findOne({
        where: { id: osmosisAddress.id },
      });

      expect(hexCreator.completed).to.equal(true);
      expect(csdkAddressUpdated.hex).to.equal(expectedHex);
      expect(osmosisAddressUpdated.hex).to.equal(expectedHex);
      expect(csdkAddressUpdated.hex).to.equal(osmosisAddressUpdated.hex);
    });
    it('should skip job if hexes already exist in the DB', async () => {
      const osmosisAddress = await models.Address.create({
        address: 'osmo18q3tlnx8vguv2fadqslm7x59ejauvsmnhltgq6',
        chain: 'osmosis',
        wallet_id: WalletId.Keplr,
        verification_token: 'blah',
        created_at: new Date('2021-01-02'),
        updated_at: new Date('2021-01-02'),
        hex: 'example123',
      });

      const hexCreator = new HexCreator();
      expect(hexCreator.completed).to.equal(false);
      await hexCreator.initJob(models);

      const osmosisAddressUpdated = await models.Address.findOne({
        where: { id: osmosisAddress.id },
      });

      expect(hexCreator.completed).to.equal(false);
      expect(osmosisAddressUpdated.hex).to.equal('example123'); //unchanged
    });
  });
});
