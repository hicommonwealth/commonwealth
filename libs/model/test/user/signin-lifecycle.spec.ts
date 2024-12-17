import type { Session, SessionSigner } from '@canvas-js/interfaces';
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
import { afterAll, describe, expect, it } from 'vitest';
import { models } from '../../src/database';
import { InvalidAddress, verifyAddress } from '../../src/services/session';
import { SignIn } from '../../src/user/SignIn.command';
import { CommunitySeedOptions, seedCommunity } from '../utils';

describe('SignIn Lifecycle', () => {
  const [evmSigner, cosmosSigner, substrateSigner, solanaSigner] =
    getSessionSigners();

  const refs = {} as Record<
    ChainBase,
    {
      community_id: string;
      address: string;
      session: Session;
      actor: Actor;
    }
  >;

  afterAll(async () => {
    await dispose()();
  });

  const chains = [
    {
      signer: evmSigner,
      wallet: WalletId.Metamask,
      seed: {
        chain_base: ChainBase.Ethereum,
        roles: ['admin'],
        chain_node: { eth_chain_id: 1 },
      },
    },
    {
      signer: cosmosSigner,
      wallet: WalletId.Keplr,
      seed: {
        chain_base: ChainBase.CosmosSDK,
        roles: ['admin'],
        chain_node: { cosmos_chain_id: 'osmosis-1' },
        bech32_prefix: 'cosmos',
      },
    },
    {
      signer: substrateSigner,
      wallet: WalletId.Polkadot,
      seed: {
        chain_base: ChainBase.Substrate,
        roles: ['admin'],
        ss58_prefix: 42,
        chain_node: {},
      },
    },
    {
      signer: solanaSigner,
      wallet: WalletId.Phantom,
      seed: {
        chain_base: ChainBase.Solana,
        roles: ['admin'],
        chain_node: {},
      },
    },
  ] as Array<{
    signer: SessionSigner;
    wallet: WalletId;
    seed: CommunitySeedOptions;
  }>;

  describe('create addresses and users', () => {
    it.each(chains)(
      'should create $seed.chain_base address and new user',
      async ({ signer, wallet, seed }) => {
        const { payload } = await signer.newSession(CANVAS_TOPIC);
        const { community } = await seedCommunity(seed);
        const address =
          'getWalletAddress' in signer &&
          typeof signer.getWalletAddress === 'function'
            ? await signer.getWalletAddress()
            : payload.did.split(':')[4];

        const ref = (refs[seed.chain_base!] = {
          community_id: community!.id,
          session: payload,
          address,
          actor: {
            user: {
              id: -1,
              email: '',
              auth: await verifyAddress(community!.id, address),
            },
          },
        });

        const addr = await command(SignIn(), {
          actor: ref.actor,
          payload: {
            address: ref.address,
            community_id: ref.community_id,
            wallet_id: wallet,
            session: serializeCanvas(ref.session),
          },
        });

        expect(addr).to.not.be.null;
        expect(addr!.address).to.be.equal(ref.address);
        expect(addr!.community_id).to.equal(ref.community_id);
        expect(addr!.wallet_id).to.be.equal(wallet);
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
      },
    );
  });

  describe('signin existing addresses', () => {
    it.each(chains)(
      'should sign existing $seed.chain_base address',
      async ({ wallet, seed }) => {
        const ref = refs[seed.chain_base!];

        const addr = await command(SignIn(), {
          actor: ref.actor,
          payload: {
            address: ref.address,
            community_id: ref.community_id,
            wallet_id: wallet,
            session: serializeCanvas(ref.session),
          },
        });

        expect(addr!).to.not.be.null;
        expect(addr!.User).to.be.not.null;
        expect(addr!.first_community).to.be.false;
        expect(addr!.user_created).to.be.false;
        expect(addr!.address_created).to.be.false;
      },
    );
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

  describe('evm exceptions', () => {
    it('should fail to create a new user if session is for wrong address', async () => {
      const altSessionSigner = getTestSigner();
      const { payload } = await altSessionSigner.newSession(CANVAS_TOPIC);
      expect(
        command(SignIn(), {
          actor: refs[ChainBase.Ethereum].actor,
          payload: {
            address: refs[ChainBase.Ethereum].address,
            community_id: refs[ChainBase.Ethereum].community_id,
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
          actor: refs[ChainBase.Ethereum].actor,
          payload: {
            address: refs[ChainBase.Ethereum].address,
            community_id: refs[ChainBase.Ethereum].community_id,
            wallet_id: WalletId.Metamask,
            session: serializeCanvas(payload),
          },
        }),
      ).rejects.toThrow(/invalid SIWE signature/);
    });
  });
});
