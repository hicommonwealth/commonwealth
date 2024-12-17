/* eslint-disable no-unused-expressions */
import type { Session } from '@canvas-js/interfaces';
import { command, dispose, type Actor } from '@hicommonwealth/core';
import {
  CANVAS_TOPIC,
  ChainBase,
  // TEST_BLOCK_INFO_STRING,
  WalletId,
  bech32ToHex,
  getSessionSigners,
  getTestSigner,
  serializeCanvas,
} from '@hicommonwealth/shared';
import { bech32 } from 'bech32';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { SignIn } from '../../src/user/SignIn.command';
import { seedCommunity } from '../utils';

describe('SignIn Lifecycle', () => {
  const [
    evmSigner,
    cosmosSigner,
    //, substrateSigner
    //, solanaSigner
  ] = getSessionSigners();

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

    test('should create an ETH address and a new user', async () => {
      const { payload } = await evmSigner.newSession(CANVAS_TOPIC);
      evm_session = payload;
      evm_address = evm_session.did.split(':')[4];
      // actor with auth verification
      evm_actor = {
        user: {
          id: -1,
          email: '',
          auth: {
            base: ChainBase.Ethereum,
            encodedAddress: evm_address,
          },
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

    test('should verify existing ETH address', async () => {
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

    test('should fail to create a new user if session is for wrong address', async () => {
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

    test('should fail to create a new user if session is for wrong topic', async () => {
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

    test('should create a Cosmos address and a new user', async () => {
      const { payload } = await cosmosSigner.newSession(CANVAS_TOPIC);
      cosmos_session = payload;
      cosmos_address = await cosmosSigner.getWalletAddress();

      const { words } = bech32.decode(cosmos_address, 50);
      const encodedAddress = bech32.encode('cosmos', words);

      // actor with auth verification
      cosmos_actor = {
        user: {
          id: -1,
          email: '',
          auth: {
            base: ChainBase.CosmosSDK,
            encodedAddress,
            hex: bech32ToHex(cosmos_address),
          },
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
});
