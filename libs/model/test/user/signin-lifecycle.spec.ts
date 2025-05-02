import * as services from '../../src/services';
vi.spyOn(services.tokenBalanceCache, 'getBalances').mockResolvedValue({});

import { SIWESigner } from '@canvas-js/chain-ethereum';
import type { Session, SessionSigner } from '@canvas-js/interfaces';
import { type Actor, command, dispose } from '@hicommonwealth/core';
import { getVerifiedUserInfo } from '@hicommonwealth/model';
import {
  CANVAS_TOPIC,
  ChainBase,
  CommunityTierMap,
  getSessionSigners,
  serializeCanvas,
  WalletId,
  WalletSsoSource,
} from '@hicommonwealth/shared';
import {
  Google,
  GoogleOAuthWithMetadata,
  User,
  WalletWithMetadata,
} from '@privy-io/server-auth';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { mapPrivyTypeToWalletSso } from '../../src/aggregates/user/signIn/privy';
import * as privyUtils from '../../src/aggregates/user/signIn/privyUtils';
import { SignIn } from '../../src/aggregates/user/signIn/SignIn.command';
import { models } from '../../src/database';
import { InvalidAddress, verifyAddress } from '../../src/services/session';
import * as tester from '../../src/tester';
import * as ssoVerificationUtils from '../../src/utils/oauth/getVerifiedUserInfo';
import { CommunitySeedOptions, getTestSigner, seedCommunity } from '../utils';
import { createSIWESigner } from '../utils/sign-in';

const getPrivyUserMock = vi.spyOn(privyUtils, 'getPrivyUserById');
const getPrivyUserByIdTokenMock = vi.spyOn(privyUtils, 'getPrivyUserByIdToken');
const getVerifiedUserInfoMock = vi.spyOn(
  ssoVerificationUtils,
  'getVerifiedUserInfo',
);

function generateSsoPrivyUserData(
  address: string,
  provider: SupportedTestProviders,
  data?: { subject?: string; email?: string; name?: string },
) {
  const subject = data?.subject ?? crypto.randomUUID();
  const email = data?.email ?? `${crypto.randomUUID()}@gmail.com`;
  const name = data?.name ?? crypto.randomUUID();
  const dates = {
    verifiedAt: new Date(),
    firstVerifiedAt: new Date(),
    latestVerifiedAt: new Date(),
  };
  return {
    linkedAccounts: [
      {
        address,
        type: 'wallet',
        imported: false,
        delegated: false,
        ...dates,
        chainType: 'ethereum' as const,
        walletClientType: 'privy',
        connectorType: 'embedded',
      },
      {
        subject,
        email,
        name,
        type: provider,
        ...dates,
      },
    ] as [WalletWithMetadata, GoogleOAuthWithMetadata],
    wallet: {
      address,
      chainType: 'ethereum' as const,
      walletClientType: 'privy',
      connectorType: 'embedded',
      imported: false,
      delegated: false,
      ...dates,
    } as Omit<WalletWithMetadata, 'type'>,
    [mapPrivyTypeToWalletSso(provider)]: {
      subject,
      email,
      name,
    } as Google,
  };
}

function generateExternalWalletPrivyUserData(
  address: string,
  wallet: 'metamask',
) {
  const dates = {
    verifiedAt: new Date(),
    firstVerifiedAt: new Date(),
    latestVerifiedAt: new Date(),
  };
  return {
    linkedAccounts: [
      {
        type: 'wallet',
        address,
        chainType: 'ethereum' as const,
        walletClientType: wallet,
        ...dates,
      },
    ] as [WalletWithMetadata],
    wallet: {
      address,
      chainType: 'ethereum' as const,
      walletClientType: wallet,
      ...dates,
    } as Omit<WalletWithMetadata, 'type'>,
  };
}

type SupportedTestProviders = 'google_oauth';

function generatePrivyId() {
  return `did:privy:${Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(36).padStart(2, '0'))
    .join('')
    .substring(0, 25)}`;
}

async function createPrivyUser(
  signer: SIWESigner,
  provider: 'externalWallet' | SupportedTestProviders,
  data?: { subject?: string; email?: string; name?: string },
): Promise<User> {
  const address = await signer.getWalletAddress();
  const did = generatePrivyId();

  return {
    id: did,
    createdAt: new Date(),
    isGuest: false,
    customMetadata: {},
    ...(provider === 'externalWallet'
      ? generateExternalWalletPrivyUserData(address, 'metamask')
      : generateSsoPrivyUserData(address, provider, data)),
  } as User;
}

const getVerifiedUserInfoMockFn: typeof getVerifiedUserInfo = ({
  privyUser,
  walletSsoSource,
}: {
  privyUser?: User;
  walletSsoSource: string;
  token?: string;
}) => {
  if (!privyUser) throw new Error('Only Privy supported in the Mock');

  switch (walletSsoSource) {
    case 'google':
      return Promise.resolve({
        provider: WalletSsoSource.Google,
        email: privyUser.google?.email,
        emailVerified: true,
      });
    default:
      throw new Error(`Unsupported SSO provider: ${walletSsoSource}`);
  }
};

describe('SignIn Lifecycle', async () => {
  const [evmSigner, , cosmosSigner, substrateSigner, solanaSigner] =
    await getSessionSigners();

  const mmPrivySigner = await createSIWESigner(8453);
  const externalWalletPrivyUser = await createPrivyUser(
    mmPrivySigner,
    'externalWallet',
  );

  const googlePrivySigner = await createSIWESigner(84532);
  const googlePrivyUser = await createPrivyUser(
    googlePrivySigner,
    'google_oauth',
  );

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
    | 'native-solana-phantom'
    | 'privy-evm-google';
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
      signer: mmPrivySigner,
      wallet: WalletId.Privy,
      seed: {
        chain_base: ChainBase.Ethereum,
        roles: ['admin'],
        chain_node: { eth_chain_id: 8453 },
      },
      privyUser: externalWalletPrivyUser,
    },
    {
      id: 'privy-evm-google',
      signer: googlePrivySigner,
      wallet: WalletId.Privy,
      seed: {
        chain_base: ChainBase.Ethereum,
        roles: ['admin'],
        chain_node: { eth_chain_id: 84532 },
      },
      provider: 'google_oauth',
      privyUser: googlePrivyUser,
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
    privyUser?: User;
    provider?: SupportedTestProviders;
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
    it.each(chains)(
      'should create $seed.chain_base $wallet address and new user (id: $id)',
      async ({ id, signer, wallet, seed, privyUser, provider }) => {
        if (privyUser) {
          getPrivyUserMock.mockImplementation(() => {
            return Promise.resolve(privyUser);
          });
          getPrivyUserByIdTokenMock.mockImplementation(() => {
            return Promise.resolve(privyUser);
          });
          getVerifiedUserInfoMock.mockImplementation(getVerifiedUserInfoMockFn);
        }
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
            privy: {
              identityToken: 'fake_identity_token',
              ssoOAuthToken: 'fake_sso_oauth_token',
              ssoProvider: provider,
            },
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
      'should sign existing $seed.chain_base $wallet address (id: $id)',
      async ({ id, wallet, provider, privyUser }) => {
        if (privyUser) {
          getPrivyUserMock.mockImplementation(() => {
            return Promise.resolve(privyUser);
          });
          getPrivyUserByIdTokenMock.mockImplementation(() => {
            return Promise.resolve(privyUser);
          });
          getVerifiedUserInfoMock.mockImplementation(getVerifiedUserInfoMockFn);
        }
        const ref = refs[id];

        const addr = await command(SignIn(), {
          actor: ref.actor,
          payload: {
            address: ref.address,
            community_id: ref.community_id,
            wallet_id: wallet,
            session: serializeCanvas(ref.session),
            privy: {
              identityToken: 'fake_identity_token',
              ssoOAuthToken: 'fake_sso_oauth_token',
              ssoProvider: provider,
            },
          },
        });

        expect(addr!).to.not.be.null;
        expect(addr!.User).to.be.not.null;
        expect(addr!.User!.id).to.equal(ref.actor.user.id!);
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

  describe('Connect new addresses for existing signed in users', () => {
    // Only test evm for now
    it.each(chains.filter((c) => c.id.includes('evm')))(
      'should sign new addresses for existing $seed.chain_base $wallet users (id: $id)',
      async ({ id, wallet, provider, privyUser }) => {
        if (privyUser) {
          getPrivyUserMock.mockImplementation(() => {
            return Promise.resolve(privyUser);
          });
          getPrivyUserByIdTokenMock.mockImplementation(() => {
            return Promise.resolve(privyUser);
          });
          getVerifiedUserInfoMock.mockImplementation(getVerifiedUserInfoMockFn);
        }
        const ref = refs[id];

        const newSigner = await createSIWESigner();
        const { payload: newSession } =
          await newSigner.newSession(CANVAS_TOPIC);
        const newAddress = await newSigner.getWalletAddress();

        const addr = await command(SignIn(), {
          actor: {
            user: {
              ...ref.actor.user,
              auth: await verifyAddress(ref.community_id, newAddress),
            },
          },
          payload: {
            address: newAddress,
            community_id: ref.community_id,
            wallet_id: wallet,
            session: serializeCanvas(newSession),
            privy: {
              identityToken: 'fake_identity_token',
              ssoOAuthToken: 'fake_sso_oauth_token',
              ssoProvider: provider,
            },
          },
        });

        expect(addr!).to.not.be.null;
        expect(addr!.User).to.be.not.null;
        expect(addr!.User!.id).to.equal(ref.actor.user.id!);
        expect(addr!.was_signed_in).to.be.true;
        expect(addr!.first_community).to.be.false;
        expect(addr!.user_created).to.be.false;
        expect(addr!.address_created).to.be.true;
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
    it.each(chains.filter((c) => !c.provider))(
      'should transfer $seed.chain_base $wallet address ownership (id: $id)',
      async ({ id, wallet, seed, privyUser, provider }) => {
        let externalSigner2: SIWESigner | undefined;
        if (privyUser) {
          externalSigner2 = await createSIWESigner(8453);
          const externalWalletPrivyUser2 = await createPrivyUser(
            externalSigner2,
            provider ?? 'externalWallet',
          );
          getPrivyUserMock.mockImplementation(() => {
            return Promise.resolve(externalWalletPrivyUser2);
          });
          getPrivyUserByIdTokenMock.mockImplementation(() => {
            return Promise.resolve(externalWalletPrivyUser2);
          });
          getVerifiedUserInfoMock.mockImplementation(getVerifiedUserInfoMockFn);
        }

        const ref = refs[id];

        // create a second community and have ref.actor join it
        const [community2] = await tester.seed('Community', {
          tier: CommunityTierMap.CommunityVerified,
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
          ...(privyUser && provider === 'google_oauth'
            ? {
                oauth_provider: 'google',
                oauth_email: privyUser.google?.email,
                oauth_email_verified: true,
              }
            : {}),
        });

        // create a second address/user combo
        // using seeds b/c signer is not creating a new address
        const address2 = externalSigner2
          ? await externalSigner2.getWalletAddress()
          : ref.address
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
          // Only set this when testing transferring of addresses via Privy
          privy_id: privyUser ? generatePrivyId() : null,
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
        console.log(
          `Testing transfer of address ${ref.address} from user ${ref.actor.user.id} to user ${actor2.user.id}`,
        );
        const transferred = await command(SignIn(), {
          actor: actor2,
          payload: {
            address: ref.address,
            community_id: ref.community_id,
            wallet_id: wallet,
            session: serializeCanvas(ref.session),
            privy: {
              identityToken: 'fake_identity_token',
              ssoOAuthToken: 'fake_sso_oauth_token',
              ssoProvider: provider,
            },
          },
        });
        expect(transferred).to.not.be.null;
        expect(transferred!.was_signed_in).to.be.true;
        expect(transferred!.address).to.be.equal(ref.address);

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

    it.each(chains.filter((c) => c.provider))(
      'should transfer $seed.chain_base $wallet address ownership (id: $id)',
      async ({ id, wallet, seed, privyUser, provider }) => {
        // Transfer address from 2nd user to existing ref user
        // Reversal needed since 2nd address cannot be owned by Privy user

        const externalSigner2 = await createSIWESigner(8453);

        // simulate Privy SSO sign in
        privyUser!.wallet!.walletClientType = 'privy';
        getPrivyUserMock.mockImplementation(() => {
          return Promise.resolve(privyUser!);
        });
        getPrivyUserByIdTokenMock.mockImplementation(() => {
          return Promise.resolve(privyUser!);
        });
        getVerifiedUserInfoMock.mockImplementation(getVerifiedUserInfoMockFn);

        const ref = refs[id];

        // create a second community and have 2nd user join it
        const [community2] = await tester.seed('Community', {
          tier: CommunityTierMap.CommunityVerified,
          chain_node_id: ref.chain_node_id,
          base: seed.chain_base,
          active: true,
          profile_count: 0,
          topics: [],
        });
        const [user2] = await tester.seed('User', {
          id: ref.actor.user.id! + 1000,
          profile: { name: 'user2' },
        });
        const [addr2] = await tester.seed('Address', {
          community_id: community2!.id,
          address: await externalSigner2.getWalletAddress(),
          user_id: user2!.id,
          role: 'member',
          wallet_id: WalletId.Magic,
          hex: null,
          ...(privyUser && provider === 'google_oauth'
            ? {
                oauth_provider: 'google',
                oauth_email: privyUser.google?.email,
                oauth_email_verified: true,
              }
            : {}),
        });

        // have user 1 sign in with address of user 2
        console.log(
          `Testing transfer of address ${addr2!.address} from user ${ref.actor.user.id} to user ${user2!.id}`,
        );
        const { payload: session } =
          await externalSigner2.newSession(CANVAS_TOPIC);
        const transferred = await command(SignIn(), {
          actor: {
            user: {
              id: ref.actor.user.id!,
              email: privyUser!.google!.email!,
              auth: await verifyAddress(community2!.id!, addr2!.address),
            },
            address: addr2!.address,
          },
          payload: {
            address: addr2!.address,
            community_id: addr2!.community_id,
            wallet_id: wallet,
            session: serializeCanvas(session),
            privy: {
              identityToken: 'fake_identity_token',
              ssoOAuthToken: 'fake_sso_oauth_token',
              ssoProvider: provider,
            },
          },
        });
        expect(transferred).to.not.be.null;
        expect(transferred!.was_signed_in).to.be.true;
        expect(transferred!.address).to.be.equal(addr2!.address);

        // check that user 1 now owns 2 address
        // 1 original created on sign in and 1 transferred from user 2
        const addresses = await models.Address.findAll({
          where: { user_id: ref.actor.user.id },
        });
        expect(addresses.length).to.be.equal(3);

        const user2Addresses = await models.Address.findAll({
          where: { user_id: user2!.id },
        });
        expect(user2Addresses.length).to.be.equal(0);
      },
    );
  });

  describe('assert all events in lifecycle', () => {
    it('should assert all events in lifecycle', async () => {
      const events = await models.Outbox.findAll({});
      const expectedEvents = [];
      for (let i = 0; i < chains.length; i++) {
        expectedEvents.push('CommunityJoined', 'WalletLinked', 'UserCreated');
      }
      for (
        let i = 0;
        i < chains.filter((c) => c.id.includes('evm')).length;
        i++
      ) {
        expectedEvents.push('CommunityJoined');
      }
      for (let i = 0; i < chains.length; i++) {
        expectedEvents.push('AddressOwnershipTransferred');
      }
      expect(events.map((e) => e.event_name)).toEqual(expectedEvents);
    });
  });
});
