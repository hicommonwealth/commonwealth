// TODO: add index.json for default chain communities - is it necessary?
// TODO: encryption (add columns to db for privacyEnabled + encryption key)/remove testing sequelize
// TODO: create ipfs redirect route for encrypted communities

import { Buckets, PrivateKey } from '@textile/hub';
import { factory, formatFilename } from '../../shared/logging';
import models from '../database';
import { Op } from 'sequelize';
import { GetOrCreateResponse, PushPathResult } from '@textile/buckets/dist/cjs/types';

const log = factory.getLogger(formatFilename(__filename));

// the number of seconds to wait between each backup
const IPFS_BACKUP_REPEAT = Number(process.env.IPFS_BACKUP_REPEAT) || 60;

// the number of seconds since the last IPFS updated - when redeploying/restarting this should be updated
// so that we're not re-uploading the same content to IPFS again (isn't a big issue but can be computationally expensive)
const IPFS_LAST_UPDATE = Number(process.env.IPFS_LAST_UPDATE) || 1800;

async function main() {
  const user = await PrivateKey.fromRandom();
  const bucketClient = await Buckets.withKeyInfo({ key: process.env.HUB_CW_KEY });
  const token = await bucketClient.getToken(user);

  now = new Date()

  // try {
  //   await updateAddresses(bucketClient)
  // } catch (error) {
  //   await handleFatalError(error, 'addresses')
  // }
  //
  // try {
  //   await updatePublicCommunities(bucketClient)
  // } catch (error) {
  //   await handleFatalError(error, 'communities')
  // }
  //
  // try {
  //   await updatePublicThreads(bucketClient)
  // } catch (error) {
  //   await handleFatalError(error, 'threads')
  // }
  //
  // try {
  //   await updatePublicComments(bucketClient)
  // } catch (error) {
  //   await handleFatalError(error, 'comments')
  // }
  //
  // try {
  //   await updatePublicReactions(bucketClient)
  // } catch (error) {
  //   await handleFatalError(error, 'reactions')
  // }
  //
  // try {
  //   await updatePublicTopics(bucketClient)
  // } catch (error) {
  //   await handleFatalError(error, 'topics')
  // }
  await sequelizeTester();

  lastUpdate = now

  return bucketClient
}

async function handleFatalError(error: Error, source: string) {
  log.error(`${source} updating error between ${lastUpdate} and ${now}`, error)
  // TODO: error handling + Rollbar
}

/**
 * Updates any address or address related data such as chain and roles on ipfs
 * @param bucketClient An instance of the textile bucket api client
 */
async function updateAddresses(bucketClient) {
  await getOrCreateBucket(bucketClient, 'Addresses', null, false)

  // get all addresses that have been updated + their associated roles
  const updatedAddresses = await models.Address.findAll({
    attributes: ['id', 'address', 'chain'],
    where: {
      'updated_at': {
        [Op.gt]: lastUpdate,
        [Op.lte]: now,
      }
    },
    include: [
      { model: models.Role, as: 'Roles', required: true, attributes: ['offchain_community_id', 'chain_id', 'permission'] }
    ]
  })

  // get all roles that have been updated
  const updatedRoles = await models.Role.findAll({
    attributes: ['address_id'],
    where: {
      'updated_at': {
        [Op.gt]: lastUpdate,
        [Op.lte]: now,
      }
    },
  })

  // filter ids for the addresses that have been updated
  const addressIds = updatedAddresses.map(o => o.id);
  // get all addresses ids from the updated roles that are not already in the addressIds array
  const queryAddressIds = updatedRoles.filter(o => !addressIds.includes(o.address_id)).map(o => o.address_id)

  // get all the data needed for the addresses specified by queryAddressIds
  const moreAddresses = await models.Address.findAll({
    attributes: ['id', 'address', 'chain'],
    where: {
      'id': queryAddressIds
    },
    include: [
      { model: models.Role,
        as: 'Roles',
        required: true,
        attributes: ['offchain_community_id', 'chain_id', 'permission'],
      }
    ],
  })

  const allNewAddressData = updatedAddresses.concat(moreAddresses);
  // // push all the new address data to ipfs
  for (const data of allNewAddressData) {
    const roles = {}
    data.Roles.forEach((role) => {
      if (role.offchain_community_id) roles[role.offchain_community_id] = role.permission;
      else if (role.chain_id) roles[role.chain_id] = role.permission;
    });
    const result = await bucketClient.pushPath(
      buckets.addressBucket.root.key,
      `${data.address}.json`,
      Buffer.from(JSON.stringify({
        chain: data.chain,
        twitterHandle: null,
        roles
      }))
    )
    await updateBucketCache('Addresses', result);
  }
}

/**
 * Updates any community-wide info such as community name, chain, description,
 * website, discord, telegram, and github.
 *
 * NOTE: This function is for public communities ONLY
 *
 * @param bucketClient
 */
async function updatePublicCommunities(bucketClient) {
  const communities = await models.OffchainCommunity.findAll({
    attributes: ['id', 'name', 'default_chain', 'description', 'website', 'discord', 'telegram', 'github'],
    where: {
      'updated_at': {
        [Op.gt]: lastUpdate,
        [Op.lte]: now,
      },
      'deleted_at': null,
    }
  })

  for (const comm of communities) {
    await getOrCreateBucket(bucketClient, comm.id, null, !!comm.privacyEnabled)

    const result = await bucketClient.pushPath(
      buckets[comm.id].root.key,
      'index.json',
      Buffer.from(JSON.stringify(comm))
    )
    await updateBucketCache(comm.id, result);
  }
}

async function updatePublicThreads(bucketClient) {
  const updatedThreads = (await models.OffchainThread.findAll({
    attributes: ['id', 'title', 'body', 'chain', 'community', 'kind', 'url', 'stage', 'topic_id'],
    where: {
      'updated_at': {
        [Op.gt]: lastUpdate,
        [Op.lte]: now,
      },
      'deleted_at': null
    },
    include: [
      {
        model: models.Address,
        as: 'Address',
        required: true,
        attributes: ['address']
      },
      {
        model: models.OffchainCommunity,
        attributes: ['privacyEnabled']
      }
    ],
  }))

  for (const thread of updatedThreads) {
    const bucketName = await getOrCreateBucket(bucketClient, thread.community, thread.chain, !!thread.OffchainCommunity?.privacyEnabled)

    const result = await bucketClient.pushPath(
      buckets[bucketName].root.key,
      `threads/${thread.id}.json`,
      Buffer.from(JSON.stringify({
        author: thread.Address.address,
        tile: thread.title,
        body: thread.body,
        kind: thread.kind,
        url: thread.url,
        stage: thread.stage,
        topic: thread.topic_id
      }))
    )
    await updateBucketCache(bucketName, result);
  }
}

// root id gives use the id of the thread
async function updatePublicComments(bucketClient) {
  const comments = (await models.OffchainComment.findAll({
    attributes: ['id', 'chain', 'community', 'text', 'root_id'],
    where: {
      'updated_at': {
        [Op.gt]: lastUpdate,
        [Op.lte]: now,
      },
      'deleted_at': null
    },
    include: [
      {
        model: models.Address,
        required: true,
        attributes: ['address']
      },
      {
        model: models.OffchainCommunity,
        attributes: ['privacyEnabled']
      }
    ]
  }))

  for (const comment of comments) {
    const bucketName = await getOrCreateBucket(bucketClient, comment.community, comment.chain, !!comment.OffchainCommunity?.privacyEnabled)

    const result = await bucketClient.pushPath(
      buckets[bucketName].root.key,
      `comments/${comment.id}.json`,
      Buffer.from(JSON.stringify({
        author: comment.Address.address,
        text: comment.text,
        root_id: comment.root_id
      }))
    )
    await updateBucketCache(bucketName, result);
  }
}

async function updatePublicReactions(bucketClient) {
  const reactions = (await models.OffchainReaction.findAll({
    attributes: ['id', 'chain', 'reaction', 'community', 'thread_id', 'comment_id', 'proposal_id'],
    where: {
      'updated_at': {
        [Op.gt]: lastUpdate,
        [Op.lte]: now,
      },
    },
    include: [
      {
        model: models.Address,
        required: true,
        attributes: ['address']
      },
      {
        model: models.OffchainCommunity,
        attributes: ['privacyEnabled']
      }
    ]
  }))

  for (const reaction of reactions) {
    const bucketName = await getOrCreateBucket(bucketClient, reaction.community, reaction.chain, !!reaction.OffchainCommunity?.privacyEnabled)

    const result = await bucketClient.pushPath(
      buckets[bucketName].root.key,
      `reactions/${reaction.id}.json`,
      Buffer.from(JSON.stringify({
        reaction: reaction.reaction,
        thread_id: reaction.thread_id,
        comment_id: reaction.comment_id,
        proposal_id: reaction.proposal_id
      }))
    )

    await updateBucketCache(bucketName, result);
  }
}

async function updatePublicTopics(bucketClient) {
  const topics = (await models.OffchainTopic.findAll({
    attributes: ['id', 'name', 'deleted_at', 'chain_id', 'community_id', 'description', 'telegram'],
    where: {
      'updated_at': {
        [Op.gt]: lastUpdate,
        [Op.lte]: now,
      },
      'deleted_at': null
    },
    include: [
      {
        model: models.OffchainCommunity,
        as: 'community',
        attributes: ['privacyEnabled']
      }
    ]
  }))

  for (const topic of topics) {
    const bucketName = await getOrCreateBucket(bucketClient, topic.community_id, topic.chain_id, !!topic.community?.privacyEnabled)

    const result = await bucketClient.pushPath(
      buckets[bucketName].root.key,
      `topics/${topic.id}.json`,
      Buffer.from(JSON.stringify({
        name: topic.name,
        description: topic.description,
        telegram: topic.telegram
      }))
    )

    await updateBucketCache(bucketName, result);
  }
}

async function getOrCreateBucket(bucketClient: Buckets, community: string, chain: string, encrypted?: boolean): Promise<string> {
  const bucketName = community ? community : chain;

  if (!buckets[bucketName]) {
    buckets[bucketName] = await bucketClient.getOrCreate(bucketName, { encrypted: !!encrypted });
    if (!buckets[bucketName].root) {
      throw new Error('Failed to open bucket');
    }

    // save a bucket instance in the db if it doesn't already exist
    const bucketCache = (await models.BucketCache.findAll()).map(o => o.name);
    if (!bucketCache.includes(bucketName)) {
      const links = await bucketClient.links(buckets[bucketName].root.key);
      await models.BucketCache.create({
        name: bucketName,
        ipns_cid: buckets[bucketName].root.key,
        ipfs_cid: buckets[bucketName].root.path.split('/')[2],
        thread_link: links.url,
        ipns_link: links.ipns,
        bucket_website: links.www,
        encrypted: !!encrypted,
        token: links.url.split('?token=')[1]
      })
    }

    log.info(`IPNS address of ${bucketName} bucket: ${buckets[bucketName].root.key}`);
    log.info(`https://ipfs.io/ipns/${buckets[bucketName].root.key}`);
  }

  return bucketName
}

async function updateBucketCache(bucketName: string, pushPathResult: PushPathResult) {
  await models.BucketCache.update({
    ipfs_cid: pushPathResult.root.split('/')[2]
  }, {
    where: {
      name: bucketName
    }
  })
}

async function sequelizeTester() {
  const result = await models.OffchainTopic.findAll({
    attributes: ['id', 'name', 'deleted_at', 'chain_id', 'community_id', 'description', 'telegram'],
    where: {
      'updated_at': {
        [Op.gt]: lastUpdate,
        [Op.lte]: now,
      },
      'deleted_at': null
    },
    include: [
      {
        model: models.OffchainCommunity,
        as: 'community',
        required: false,
        attributes: ['privacyEnabled']
      }
    ]
  })

  console.log(JSON.stringify(result))
  return;
}



const buckets: { [key: string]: GetOrCreateResponse } = {}

let lastUpdate = new Date();
lastUpdate.setSeconds(lastUpdate.getSeconds() - IPFS_LAST_UPDATE);
let now;

main().then((client) =>
  setInterval(main, IPFS_BACKUP_REPEAT * 1000)
).catch((error) => {
  log.error('An error occurred in the ipfs node', error)
})
