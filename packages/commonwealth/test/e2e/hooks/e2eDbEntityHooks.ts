import * as process from 'process';
import Sequelize from 'sequelize';
import models from 'server/database';
import type { AddressInstance } from 'server/models/address';
import type { ChainInstance } from 'server/models/chain';
import type { ChainNodeAttributes } from 'server/models/chain_node';
import type { CollaborationAttributes } from 'server/models/collaboration';
import type { CommentInstance } from 'server/models/comment';
import type { ReactionAttributes } from 'server/models/reaction';
import type { ThreadInstance } from 'server/models/thread';
import type { TopicAttributes } from 'server/models/topic';
import type { UserInstance } from 'server/models/user';
import { ProfileAttributes } from '../../../server/models/profile';
import { testAddress } from '../utils/e2eUtils';

const Op = Sequelize.Op;

export let testThreads: ThreadInstance[];
export let testComments: CommentInstance[];
export let testUsers: UserInstance[];
export let testAddresses: AddressInstance[];
export let testChains: ChainInstance[];
export let testCollaborations: CollaborationAttributes[];
export let testReactions: ReactionAttributes[];
export let testChainNodes: ChainNodeAttributes[];
export let testTopics: TopicAttributes[];
export let testProfiles: ProfileAttributes[];

const idOffset = 1000;

export async function createTestEntities() {
  try {
    testUsers = await Promise.all(
      [...Array(4).keys()].map(
        async (i) =>
          (
            await models.User.findOrCreate({
              where: {
                id: i + idOffset,
                email: `test${i + idOffset}@gmail.com`,
                emailVerified: true,
                isAdmin: true,
              },
            })
          )[0]
      )
    );

    testProfiles = await Promise.all(
      [...Array(2).keys()].map(
        async (i) =>
          (
            await models.Profile.findOrCreate({
              where: {
                id: i + idOffset,
                profile_name: `testName${i + idOffset}`,
                avatar_url: `testAvatarUrl${i + idOffset}`,
                email: `test${i + idOffset}@gmail.com`,
                user_id: i + idOffset,
              },
            })
          )[0]
      )
    );

    testChainNodes = [
      (
        await models.ChainNode.findOrCreate({
          where: {
            id: idOffset,
            eth_chain_id: idOffset,
            url: `test1`,
            balance_type: 'ethereum',
            name: `TestName1`,
          },
        })
      )[0],
      (
        await models.ChainNode.findOrCreate({
          where: {
            id: idOffset + 1,
            eth_chain_id: idOffset + 1,
            url: `test2`,
            balance_type: 'ethereum',
            name: 'TestName2',
          },
        })
      )[0],
    ];

    testChains = [
      (
        await models.Chain.findOrCreate({
          where: {
            id: 'cmntest',
            chain_node_id: idOffset,
            name: 'cmntest',
            network: 'ethereum',
            type: 'offchain',
            base: 'ethereum',
            // collapsed_on_homepage: true,
            custom_stages: 'true',
            // stages_enabled: true,
            // has_chain_events_listener: false,
            icon_url:
              'https://pbs.twimg.com/profile_images/1562880197376020480/6R_gefq8_400x400.jpg',
            active: true,
            default_symbol: 'cmn',
            custom_domain: 'customdomain.com',
          },
        })
      )[0],
      (
        await models.Chain.findOrCreate({
          where: {
            id: 'cmntest2',
            chain_node_id: idOffset + 1,
            name: 'cmntest2',
            network: 'cmntest',
            type: 'offchain',
            icon_url:
              'https://pbs.twimg.com/profile_images/1562880197376020480/6R_gefq8_400x400.jpg',
            active: true,
            default_symbol: 'cmntest2',
            custom_domain: 'customdomain.com',
          },
        }).catch((e) => console.log(e))
      )[0],
    ];

    testTopics = [
      (
        await models.Topic.findOrCreate({
          where: {
            id: idOffset,
            name: 'testTopic',
            chain_id: 'cmntest',
          },
        })
      )[0],
      (
        await models.Topic.findOrCreate({
          where: {
            id: idOffset + 1,
            name: 'testTopic2',
            chain_id: 'cmntest',
          },
        })
      )[0],
    ];

    const addresses = [
      '0x834731c87A7a6f8B57F4aa42c205265EAcbFCCD7',
      '0x7EcA9278094511486506bb34B31087df7C25Db6f',
      '0xd65FA09DE724f0D68EcbF5e0e186d3d59080172C',
      '0x89F40750d76D646c2f822E4Dd6Ea1558A83eDb82',
    ];

    testAddresses = await Promise.all(
      [...Array(4).keys()].map(
        async (i) =>
          (
            await models.Address.findOrCreate({
              where: {
                id: i + idOffset,
                user_id: i + idOffset,
                address: addresses[i],
                chain: 'cmntest',
                verification_token: '',
                profile_id: i < 2 ? idOffset : idOffset + 1,
              },
            })
          )[0]
      )
    );

    testThreads = await Promise.all(
      [...Array(2).keys()].map(
        async (i) =>
          (
            await models.Thread.findOrCreate({
              where: {
                id: i + idOffset,
                address_id: idOffset,
                title: `testThread Title ${i + idOffset}`,
                body: `testThread Body ${i + idOffset}`,
                chain: 'cmntest',
                topic_id: idOffset,
                kind: 'discussion',
              },
            })
          )[0]
      )
    );

    testThreads.push(
      ...(await Promise.all(
        [...Array(3).keys()].map(
          async (i) =>
            (
              await models.Thread.findOrCreate({
                where: {
                  id: i + idOffset + 2,
                  address_id: idOffset + 1,
                  title: `testThread Title ${i + idOffset + 2}`,
                  body: `testThread Body ${i + idOffset + 2}`,
                  chain: 'cmntest',
                  topic_id: idOffset + 1,
                  kind: 'discussion',
                },
              })
            )[0]
        )
      ))
    );

    testCollaborations = await Promise.all(
      [...Array(2).keys()].map(
        async (i) =>
          (
            await models.Collaboration.findOrCreate({
              where: {
                thread_id: idOffset,
                address_id: i + idOffset,
              },
            })
          )[0]
      )
    );

    testComments = await Promise.all(
      [...Array(2).keys()].map(
        async (i) =>
          (
            await models.Comment.findOrCreate({
              where: {
                id: i + idOffset,
                chain: 'cmntest',
                address_id: idOffset,
                text: '',
                thread_id: idOffset,
                plaintext: '',
              },
            })
          )[0]
      )
    );

    testComments.push(
      ...(await Promise.all(
        [...Array(3).keys()].map(
          async (i) =>
            (
              await models.Comment.findOrCreate({
                where: {
                  id: i + idOffset + 2,
                  chain: 'cmntest',
                  address_id: idOffset + 1,
                  text: '',
                  thread_id: idOffset + 1,
                  plaintext: '',
                },
              })
            )[0]
        )
      ))
    );

    testReactions = await Promise.all(
      [...Array(2).keys()].map(
        async (i) =>
          (
            await models.Reaction.findOrCreate({
              where: {
                id: i + idOffset,
                reaction: 'like',
                address_id: idOffset,
                thread_id: idOffset,
                chain: 'cmntest',
              },
            })
          )[0]
      )
    );

    testReactions.push(
      ...(await Promise.all(
        [...Array(3).keys()].map(
          async (i) =>
            (
              await models.Reaction.findOrCreate({
                where: {
                  id: i + idOffset + 2,
                  reaction: 'like',
                  address_id: idOffset + 1,
                  comment_id: idOffset + 1,
                  chain: 'cmntest',
                },
              })
            )[0]
        )
      ))
    );
  } catch (e) {
    console.log(e);
  }
}
