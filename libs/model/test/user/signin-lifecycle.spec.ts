import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import * as privyUtils from '../../src/aggregates/user/signIn/privyUtils';

const getPrivyUserMock = vi.spyOn(privyUtils, 'getPrivyUserById');
const getPrivyUserByIdTokenMock = vi.spyOn(privyUtils, 'getPrivyUserByIdToken');

import { SIWESigner } from '@canvas-js/chain-ethereum';
import type { Session, SessionSigner } from '@canvas-js/interfaces';
import { command, dispose, type Actor } from '@hicommonwealth/core';
import { generateWallet } from '@hicommonwealth/evm-protocols';
import {
  CANVAS_TOPIC,
  ChainBase,
  getSessionSigners,
  serializeCanvas,
  // TEST_BLOCK_INFO_STRING,
  WalletId,
} from '@hicommonwealth/shared';
import { User } from '@privy-io/server-auth';
import { SignIn } from '../../src/aggregates/user/signIn/SignIn.command';
import { models } from '../../src/database';
import { InvalidAddress, verifyAddress } from '../../src/services/session';
import * as tester from '../../src/tester';
import { CommunitySeedOptions, getTestSigner, seedCommunity } from '../utils';

const privyTestUserOneDid = 'did:privy:cm8no7aig005zranv3tivdeoj';

const tempPrivyIdToken =
  'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik5yZ2RpT25UOHpaSzNQTVEzRG10emQwNER3UXFJOF9QSDZEMzNESnZLQW8ifQ.eyJjciI6IjE3NDI4NTMwMjEiLCJsaW5rZWRfYWNjb3VudHMiOiJbe1widHlwZVwiOlwiZW1haWxcIixcImFkZHJlc3NcIjpcInRlc3QtMzYxOUBwcml2eS5pb1wiLFwibHZcIjoxNzQyODUzMDIxfV0iLCJpc3MiOiJwcml2eS5pbyIsImlhdCI6MTc0Mjg1MzAyMSwiYXVkIjoiY204ZXI2bXJtMDBmb3dicXk4YnB3Mzk1NiIsInN1YiI6ImRpZDpwcml2eTpjbThubG90emwwMHhkY3M0NzA3bDhnd29mIiwiZXhwIjoxNzQyODU2NjIxfQ.7MoFzEPIJcnprZXbmpHLBsuCsnjVEY6oDRNCjXFIO3L_wG26HBaia1AbXzGo-0pBganXf7jjmoMij6cyJnNAjA';
const tempPrivyAccessToken =
  'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik5yZ2RpT25UOHpaSzNQTVEzRG10emQwNER3UXFJOF9QSDZEMzNESnZLQW8ifQ.eyJzaWQiOiJjbThubG90eDIwMHhiY3M0N3c3Z3N3cHIzIiwiaXNzIjoicHJpdnkuaW8iLCJpYXQiOjE3NDI4NTMwMjEsImF1ZCI6ImNtOGVyNm1ybTAwZm93YnF5OGJwdzM5NTYiLCJzdWIiOiJkaWQ6cHJpdnk6Y204bmxvdHpsMDB4ZGNzNDcwN2w4Z3dvZiIsImV4cCI6MTc0Mjg1NjYyMX0.gfEmzLhiqh7JeZheHsjG4pu-u9TPhIlp1lAwPo8o2BWM0NOAtA9cNIFC7zmJTZ5RY26lMXfNxgjKrqr3R3wuCw';

describe.only('SignIn Lifecycle', async () => {
  const [evmSigner, , cosmosSigner, substrateSigner, solanaSigner] =
    await getSessionSigners();

  const wallet = await generateWallet();
  const evmSignerPrivy = new SIWESigner({
    signer: {
      getAddress: () => Promise.resolve(wallet.address),
      signMessage: (message: string) =>
        Promise.resolve(wallet.signMessage({ message })),
    },
    chainId: 8453,
  });

  // Update the addresses in the mock privy utils
  const privySignerAddress = await evmSignerPrivy.getWalletAddress();

  console.log(
    `?????????????????? generated wallet address: ${wallet.address} --- signer address: ${privySignerAddress}`,
  );

  const fullPrivyUserMock: User = {
    id: privyTestUserOneDid,
    createdAt: new Date('2025-03-24T19:49:09.000Z'),
    isGuest: false,
    linkedAccounts: [
      {
        type: 'wallet',
        address: privySignerAddress,
        chainType: 'ethereum',
        walletClientType: 'metamask',
        latestVerifiedAt: new Date('2025-03-24T19:49:09.000Z'),
      },
    ],
    wallet: {
      address: privySignerAddress,
      chainType: 'ethereum',
      walletClientType: 'metamask',
      latestVerifiedAt: new Date('2025-03-24T19:49:09.000Z'),
    },
  } as unknown as User;

  const partialPrivyUserMock: User = {
    id: privyTestUserOneDid,
    createdAt: '2025-03-24T23:00:41.000Z',
    isGuest: false,
    linkedAccounts: [
      {
        type: 'wallet',
        address: privySignerAddress,
        chainType: 'ethereum',
        walletClientType: 'metamask',
        latestVerifiedAt: '2025-03-24T23:00:41.000Z',
      },
    ],
    wallet: {
      address: privySignerAddress,
      chainType: 'ethereum',
      walletClientType: 'metamask',
      latestVerifiedAt: '2025-03-24T23:00:41.000Z',
    },
  } as unknown as User;

  afterAll(async () => {
    await dispose()();
  });

  afterEach(async () => {
    vi.clearAllMocks();
  });

  type WalletChainIds =
    | 'native-evm-metamask'
    | 'privy-evm-metamask'
    | 'native-cosmos-keplr'
    | 'native-substrate-polkadot'
    | 'native-solana-phantom';
  const chains = [
    {
      id: 'native-evm-metamask',
      signer: evmSigner,
      wallet: WalletId.Metamask,
      seed: {
        chain_base: ChainBase.Ethereum,
        roles: ['admin'],
        chain_node: { eth_chain_id: 1 },
      },
    },
    {
      id: 'privy-evm-metamask',
      signer: evmSignerPrivy,
      wallet: WalletId.Privy,
      seed: {
        chain_base: ChainBase.Ethereum,
        roles: ['admin'],
        chain_node: { eth_chain_id: 8453 },
      },
    },
    {
      id: 'native-cosmos-keplr',
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
      id: 'native-substrate-polkadot',
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
      id: 'native-solana-phantom',
      signer: solanaSigner,
      wallet: WalletId.Phantom,
      seed: {
        chain_base: ChainBase.Solana,
        roles: ['admin'],
        chain_node: {},
      },
    },
    // TODO: add Privy Solana
  ] as Array<{
    id: WalletChainIds;
    signer: SessionSigner;
    wallet: WalletId;
    seed: CommunitySeedOptions;
  }>;

  const refs = {} as Record<
    WalletChainIds,
    {
      community_id: string;
      chain_node_id: number;
      address: string;
      session: Session;
      actor: Actor;
    }
  >;

  describe('create addresses and users', () => {
    // TODO: add some kind of indicator above for sso vs wallet Privy
    //  return different mocks based on that in order to test findAddressBySso
    //  OR: create separate test suite for SSO tests
    getPrivyUserMock.mockImplementation(() => {
      return Promise.resolve(fullPrivyUserMock);
    });
    getPrivyUserByIdTokenMock.mockImplementation(() => {
      return Promise.resolve(partialPrivyUserMock);
    });
    it.each(chains)(
      'should create $seed.chain_base $wallet address and new user',
      async ({ id, signer, wallet, seed }) => {
        const { payload } = await signer.newSession(CANVAS_TOPIC);
        const { community } = await seedCommunity(seed);
        const address =
          'getWalletAddress' in signer &&
          typeof signer.getWalletAddress === 'function'
            ? await signer.getWalletAddress()
            : signer.getAddressFromDid(payload.did);

        const ref = (refs[id] = {
          community_id: community!.id,
          chain_node_id: community!.chain_node_id!,
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
            privyIdentityToken: 'fake_identity_token',
          },
        });
        ref.actor.user.id = addr!.user_id!;

        expect(addr).to.not.be.null;
        expect(addr!.address).to.be.equal(ref.address);
        expect(addr!.community_id).to.equal(ref.community_id);
        expect(addr!.wallet_id).to.be.equal(wallet);
        expect(addr!.role).to.be.equal('member');
        expect(addr!.verification_token).to.be.not.null;
        expect(addr!.verified).to.be.not.null;

        expect(addr!.was_signed_in).to.be.false;
        expect(addr!.first_community).to.be.true;
        expect(addr!.user_created).to.be.true;
        expect(addr!.address_created).to.be.true;
        expect(addr!.User).to.not.be.null;
        expect(addr!.User!.id).to.be.not.null;
        expect(addr!.User!.profile.email).to.be.undefined;
        expect(addr!.User!.emailVerified).to.be.undefined;

        // check community profile count was incremented
        const c = await models.Community.findOne({
          where: { id: ref.community_id },
        });
        expect(c?.profile_count).to.be.equal(1);
      },
    );
  });

  describe('signin existing addresses', () => {
    it.each(chains)(
      'should sign existing $seed.chain_base $wallet address',
      async ({ id, wallet, seed }) => {
        const ref = refs[id];

        const addr = await command(SignIn(), {
          actor: ref.actor,
          payload: {
            address: ref.address,
            community_id: ref.community_id,
            wallet_id: wallet,
            session: serializeCanvas(ref.session),
            privyIdentityToken: 'fake_identity_token',
          },
        });

        expect(addr!).to.not.be.null;
        expect(addr!.User).to.be.not.null;
        expect(addr!.was_signed_in).to.be.true;
        expect(addr!.first_community).to.be.false;
        expect(addr!.user_created).to.be.false;
        expect(addr!.address_created).to.be.false;

        // check community profile count is still 1
        const c = await models.Community.findOne({
          where: { id: ref.community_id },
        });
        expect(c?.profile_count).to.be.equal(1);
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
    { base: ChainBase.CosmosSDK, wallet: WalletId.Privy },
    { base: ChainBase.Substrate, wallet: WalletId.Privy },
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
          actor: {
            user: {
              ...refs['native-evm-metamask'].actor.user,
              id: -1, // not signed in to verify session
            },
          },
          payload: {
            address: refs['native-evm-metamask'].address,
            community_id: refs['native-evm-metamask'].community_id,
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
          actor: {
            user: {
              ...refs['native-evm-metamask'].actor.user,
              id: -1, // not signed in to verify session
            },
          },
          payload: {
            address: refs['native-evm-metamask'].address,
            community_id: refs['native-evm-metamask'].community_id,
            wallet_id: WalletId.Metamask,
            session: serializeCanvas(payload),
          },
        }),
      ).rejects.toThrow(/invalid SIWE signature/);
    });
  });

  describe('transfer ownership', () => {
    it.each(chains)(
      'should transfer $seed.chain_base $wallet address ownership',
      async ({ id, wallet, seed }) => {
        const ref = refs[id];

        // create a second community and have ref.actor join it
        const [community2] = await tester.seed('Community', {
          chain_node_id: ref.chain_node_id,
          base: seed.chain_base,
          active: true,
          profile_count: 0,
          topics: [],
        });
        await tester.seed('Address', {
          community_id: community2!.id,
          address: ref.address,
          user_id: ref.actor.user.id!,
          role: 'member',
          wallet_id: wallet,
          hex: 'hex',
        });

        // create a second address/user combo
        // using seeds b/c signer is not creating a new address
        const address2 = ref.address
          .split('')
          .map((c, i) =>
            i === ref.address.length - 1
              ? String.fromCharCode(c.charCodeAt(0) + 1)
              : c,
          )
          .join(''); // just increment last char of ref.address to keep format
        const [user2] = await tester.seed('User', {
          id: ref.actor.user.id! + 1000,
          profile: { name: 'user2' },
        });
        const [addr2] = await tester.seed('Address', {
          community_id: ref.community_id,
          address: address2,
          user_id: user2?.id,
          role: 'member',
          wallet_id: wallet,
          hex: 'hex',
        });

        // have user 2 sign in with address of user 1
        const actor2 = {
          user: {
            id: addr2!.user_id!, // simulated signed in
            email: user2!.email!,
            auth: await verifyAddress(ref.community_id, ref.address),
          },
        };
        const transferred = await command(SignIn(), {
          actor: actor2,
          payload: {
            address: ref.address,
            community_id: ref.community_id,
            wallet_id: wallet,
            session: serializeCanvas(ref.session),
          },
        });
        expect(transferred).to.not.be.null;
        expect(transferred!.was_signed_in).to.be.true;
        expect(transferred!.address).to.be.equal(ref.address);

        // check that user 2 now owns 3 addresses from user 1
        // the address from the EVM addresses were transferred (privy + MM)
        const addresses = await models.Address.findAll({
          where: { address: ref.address },
        });
        console.log();
        expect(addresses.length).to.be.equal(2);
        addresses.forEach((a) => {
          expect(a.user_id).to.be.equal(addr2!.user_id);
        });

        // check community profile count is still 1
        const c = await models.Community.findOne({
          where: { id: ref.community_id },
        });
        expect(c?.profile_count).to.be.equal(1);
      },
    );
  });
  //
  // describe('assert all events in lifecycle', () => {
  //   it('should assert all events in lifecycle', async () => {
  //     const events = await models.Outbox.findAll({});
  //     expect(events.map((e) => e.event_name)).toEqual([
  //       'CommunityJoined',
  //       'WalletLinked',
  //       'UserCreated',
  //       'CommunityJoined',
  //       'WalletLinked',
  //       'UserCreated',
  //       'CommunityJoined',
  //       'WalletLinked',
  //       'UserCreated',
  //       'CommunityJoined',
  //       'WalletLinked',
  //       'UserCreated',
  //       'AddressOwnershipTransferred',
  //       'AddressOwnershipTransferred',
  //       'AddressOwnershipTransferred',
  //       'AddressOwnershipTransferred',
  //     ]);
  //   });
  // });
});
