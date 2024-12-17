import type { Session } from '@canvas-js/interfaces';
import { command, dispose, type Actor } from '@hicommonwealth/core';
import {
  CANVAS_TOPIC,
  ChainBase,
  // TEST_BLOCK_INFO_STRING,
  WalletId,
  getSessionSigners,
  getTestSigner,
  serializeCanvas,
} from '@hicommonwealth/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { models } from '../../src/database';
import { InvalidAddress, verifyAddress } from '../../src/services/session';
import { SignIn } from '../../src/user/SignIn.command';
import { seedCommunity } from '../utils';

describe('SignIn Lifecycle', () => {
  const [evmSigner, cosmosSigner, substrateSigner, solanaSigner] =
    getSessionSigners();

  afterAll(async () => {
    await dispose()();
  });

  describe('evm', () => {
    let ethereum_community_id: string;
    let evm_address: string;
    let evm_session: Session;
    let evm_actor: Actor;

    beforeAll(async () => {
      const { community } = await seedCommunity({ roles: ['admin'] });
      ethereum_community_id = community!.id;
    });

    it('should create an ETH address and a new user', async () => {
      const { payload } = await evmSigner.newSession(CANVAS_TOPIC);
      evm_session = payload;
      evm_address = evm_session.did.split(':')[4];
      // actor with auth verification
      evm_actor = {
        user: {
          id: -1,
          email: '',
          auth: await verifyAddress(ethereum_community_id, evm_address),
        },
      };

      const addr = await command(SignIn(), {
        actor: evm_actor,
        payload: {
          address: evm_address,
          community_id: ethereum_community_id,
          wallet_id: WalletId.Metamask,
          // block_info: TEST_BLOCK_INFO_STRING,
          session: serializeCanvas(evm_session),
        },
      });

      expect(addr).to.not.be.null;
      expect(addr!.address).to.be.equal(evm_address);
      expect(addr!.community_id).to.equal(ethereum_community_id);
      expect(addr!.wallet_id).to.be.equal(WalletId.Metamask);
      expect(addr!.role).to.be.equal('member');
      expect(addr!.verification_token).to.be.not.null;
      // expect(addr!.verification_token_expires).to.not.be.equal(null);
      expect(addr!.verified).to.be.not.null;

      expect(addr!.first_community).to.be.true;
      expect(addr!.user_created).to.be.true;
      expect(addr!.address_created).to.be.true;
      expect(addr!.User).to.not.be.null;
      expect(addr!.User!.id).to.be.not.null;
      expect(addr!.User!.profile.email).to.be.undefined;
      expect(addr!.User!.emailVerified).to.be.null;
    });

    it('should verify existing ETH address', async () => {
      const addr = await command(SignIn(), {
        actor: evm_actor,
        payload: {
          address: evm_address,
          community_id: ethereum_community_id,
          wallet_id: WalletId.Metamask,
          // block_info: TEST_BLOCK_INFO_STRING,
          session: serializeCanvas(evm_session),
        },
      });
      expect(addr!).to.not.be.null;
      expect(addr!.User).to.be.not.null;
      expect(addr!.first_community).to.be.false;
      expect(addr!.user_created).to.be.false;
      expect(addr!.address_created).to.be.false;
    });

    it('should fail to create a new user if session is for wrong address', async () => {
      const altSessionSigner = getTestSigner();
      const { payload } = await altSessionSigner.newSession(CANVAS_TOPIC);
      expect(
        command(SignIn(), {
          actor: evm_actor,
          payload: {
            address: evm_address,
            community_id: ethereum_community_id,
            wallet_id: WalletId.Metamask,
            session: serializeCanvas(payload),
          },
        }),
      ).rejects.toThrow(/session.did address (.*) does not match (.*)/);
    });

    it('should fail to create a new user if session is for wrong topic', async () => {
      const { payload } = await evmSigner.newSession('FAKE_TOPIC');
      expect(
        command(SignIn(), {
          actor: evm_actor,
          payload: {
            address: evm_address,
            community_id: ethereum_community_id,
            wallet_id: WalletId.Metamask,
            session: serializeCanvas(payload),
          },
        }),
      ).rejects.toThrow(/invalid SIWE signature/);
    });
  });

  describe('cosmos', () => {
    let cosmos_community_id: string;
    let cosmos_session: Session;
    let cosmos_actor: Actor;
    let cosmos_address: string;

    beforeAll(async () => {
      const { community } = await seedCommunity({
        roles: ['admin'],
        chain_node: { cosmos_chain_id: 'osmosis-1' },
        chain_base: ChainBase.CosmosSDK,
        bech32_prefix: 'cosmos',
      });
      cosmos_community_id = community!.id;
    });

    it('should create a Cosmos address and a new user', async () => {
      cosmos_address = await cosmosSigner.getWalletAddress();
      const { payload } = await cosmosSigner.newSession(CANVAS_TOPIC);
      cosmos_session = payload;
      // actor with auth verification
      cosmos_actor = {
        user: {
          id: -1,
          email: '',
          auth: await verifyAddress(cosmos_community_id, cosmos_address),
        },
      };

      const addr = await command(SignIn(), {
        actor: cosmos_actor,
        payload: {
          address: cosmos_address,
          community_id: cosmos_community_id,
          wallet_id: WalletId.Keplr,
          // block_info: TEST_BLOCK_INFO_STRING,
          session: serializeCanvas(cosmos_session),
        },
      });

      expect(addr).to.not.be.null;
      expect(addr!.address).to.be.equal(cosmos_address);
      expect(addr!.community_id).to.equal(cosmos_community_id);
      expect(addr!.wallet_id).to.be.equal(WalletId.Keplr);
      expect(addr!.role).to.be.equal('member');
      expect(addr!.verification_token).to.be.not.null;
      // expect(addr!.verification_token_expires).to.not.be.equal(null);
      expect(addr!.verified).to.be.not.null;

      expect(addr!.first_community).to.be.true;
      expect(addr!.user_created).to.be.true;
      expect(addr!.address_created).to.be.true;
      expect(addr!.User).to.not.be.null;
      expect(addr!.User!.id).to.be.not.null;
      expect(addr!.User!.profile.email).to.be.undefined;
      expect(addr!.User!.emailVerified).to.be.null;
    });
  });

  describe('substrate', () => {
    let substrate_community_id: string;
    let substrate_session: Session;
    let substrate_actor: Actor;
    let substrate_address: string;

    beforeAll(async () => {
      const { community } = await seedCommunity({
        roles: ['admin'],
        chain_node: {},
        chain_base: ChainBase.Substrate,
        ss58_prefix: 42,
      });
      substrate_community_id = community!.id;
    });

    it('should create a Substrate address and a new user', async () => {
      substrate_address = await substrateSigner.getWalletAddress();
      const { payload } = await substrateSigner.newSession(CANVAS_TOPIC);
      substrate_session = payload;

      // actor with auth verification
      substrate_actor = {
        user: {
          id: -1,
          email: '',
          auth: await verifyAddress(substrate_community_id, substrate_address),
        },
      };

      const addr = await command(SignIn(), {
        actor: substrate_actor,
        payload: {
          address: substrate_address,
          community_id: substrate_community_id,
          wallet_id: WalletId.Polkadot,
          session: serializeCanvas(substrate_session),
        },
      });

      expect(addr).to.not.be.null;
      expect(addr!.address).to.be.equal(substrate_address);
      expect(addr!.community_id).to.equal(substrate_community_id);
      expect(addr!.wallet_id).to.be.equal(WalletId.Polkadot);
      expect(addr!.role).to.be.equal('member');
      expect(addr!.verification_token).to.be.not.null;
      // expect(addr!.verification_token_expires).to.not.be.equal(null);
      expect(addr!.verified).to.be.not.null;

      expect(addr!.first_community).to.be.true;
      expect(addr!.user_created).to.be.true;
      expect(addr!.address_created).to.be.true;
      expect(addr!.User).to.not.be.null;
      expect(addr!.User!.id).to.be.not.null;
      expect(addr!.User!.profile.email).to.be.undefined;
      expect(addr!.User!.emailVerified).to.be.null;
    });
  });

  describe('solana', () => {
    let solana_community_id: string;
    let solana_session: Session;
    let solana_actor: Actor;
    let solana_address: string;

    beforeAll(async () => {
      const { community } = await seedCommunity({
        roles: ['admin'],
        chain_node: {},
        chain_base: ChainBase.Solana,
      });
      solana_community_id = community!.id;
    });

    it('should create a Solana address and a new user', async () => {
      solana_address = await solanaSigner.getWalletAddress();
      const { payload } = await solanaSigner.newSession(CANVAS_TOPIC);
      solana_session = payload;

      // actor with auth verification
      solana_actor = {
        user: {
          id: -1,
          email: '',
          auth: await verifyAddress(solana_community_id, solana_address),
        },
      };

      const addr = await command(SignIn(), {
        actor: solana_actor,
        payload: {
          address: solana_address,
          community_id: solana_community_id,
          wallet_id: WalletId.Phantom,
          session: serializeCanvas(solana_session),
        },
      });

      expect(addr).to.not.be.null;
      expect(addr!.address).to.be.equal(solana_address);
      expect(addr!.community_id).to.equal(solana_community_id);
      expect(addr!.wallet_id).to.be.equal(WalletId.Phantom);
      expect(addr!.role).to.be.equal('member');
      expect(addr!.verification_token).to.be.not.null;
      // expect(addr!.verification_token_expires).to.not.be.equal(null);
      expect(addr!.verified).to.be.not.null;

      expect(addr!.first_community).to.be.true;
      expect(addr!.user_created).to.be.true;
      expect(addr!.address_created).to.be.true;
      expect(addr!.User).to.not.be.null;
      expect(addr!.User!.id).to.be.not.null;
      expect(addr!.User!.profile.email).to.be.undefined;
      expect(addr!.User!.emailVerified).to.be.null;
    });
  });

  const invalidAddresses = [
    { base: ChainBase.Ethereum, wallet: WalletId.Keplr },
    { base: ChainBase.Ethereum, wallet: WalletId.Polkadot },
    { base: ChainBase.Ethereum, wallet: WalletId.Phantom },
    { base: ChainBase.CosmosSDK, wallet: WalletId.Metamask },
    { base: ChainBase.CosmosSDK, wallet: WalletId.Polkadot },
    { base: ChainBase.CosmosSDK, wallet: WalletId.Phantom },
    { base: ChainBase.Substrate, wallet: WalletId.Metamask },
    { base: ChainBase.Substrate, wallet: WalletId.Keplr },
    { base: ChainBase.Substrate, wallet: WalletId.Phantom },
    { base: ChainBase.Solana, wallet: WalletId.Metamask },
    { base: ChainBase.Solana, wallet: WalletId.Keplr },
    { base: ChainBase.Solana, wallet: WalletId.Polkadot },
  ] as Array<{
    base: ChainBase;
    wallet: WalletId;
  }>;

  describe('signing in with invalid addresses', () => {
    it.each(invalidAddresses)(
      'should fail signin on $base community with a $wallet address',
      async ({ base, wallet }) => {
        const community = await models.Community.findOne({ where: { base } });
        expect(community).to.not.be.null;
        const addr = await models.Address.findOne({
          where: { wallet_id: wallet, role: 'member' },
        });
        expect(addr).to.not.be.null;
        expect(verifyAddress(community!.id, addr!.address)).rejects.toThrow(
          InvalidAddress,
        );
      },
    );
  });
});
