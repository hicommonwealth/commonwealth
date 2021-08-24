// TODO: add index.json for default chain communities - is it necessary?
// TODO: bundle file pushes with pushPaths - connectionRefusals

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

// boolean where true means we should encrypt then upload private communities and
// false means we completely ignore private communities
const IPFS_PRIVATE_COMMUNITIES = !!process.env.IPFS_PRIVATE_COMMUNITIES || false;

// the string id of a chain or community to upload to IPFS. Used primarily for testing or
// for migrating specific backup changes
const IPFS_ONLY_CHAIN_OR_COMM = process.env.IPFS_ONLY_CHAIN_OR_COMM || null

// the combination of IPFS_LAST_UPDATE and IPFS_ONLY_CHAIN_OR_COMM allows us to
// completely refresh the ipfs bucket for any specific community

// boolean where true means all bucket pushes happen asynchronously
const IPFS_ASYNC_PUSH = process.env.IPFS_ASYNC_PUSH || true

async function main() {
  // const user = await PrivateKey.fromRandom();
  let bucketClient = await Buckets.withKeyInfo({ key: process.env.HUB_CW_KEY });
  // const token = await bucketClient.getToken(user);

  now = new Date()

  try {
    await updateAddresses(bucketClient)
  } catch (error) {
    await handleFatalError(error, 'addresses')
  }

  try {
    await updatePublicCommunities(bucketClient)
  } catch (error) {
    await handleFatalError(error, 'communities')
  }

  try {
    await updatePublicThreads(bucketClient)
  } catch (error) {
    await handleFatalError(error, 'threads')
  }

  try {
    await updatePublicComments(bucketClient)
  } catch (error) {
    await handleFatalError(error, 'comments')
  }

  try {
    await updatePublicReactions(bucketClient)
  } catch (error) {
    await handleFatalError(error, 'reactions')
  }

  try {
    await updatePublicTopics(bucketClient)
  } catch (error) {
    await handleFatalError(error, 'topics')
  }

  // await sequelizeTester();

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
  if (IPFS_ONLY_CHAIN_OR_COMM) return; // don't update addresses if updating a specific community
  await getOrCreateBucket(bucketClient, 'Addresses', false)

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

  // get ids for the addresses that have been updated
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

  let allNewAddressData = updatedAddresses.concat(moreAddresses);


  // if a specific chain/community is passed only get addresses for the chain/the communities default chain
  if (IPFS_ONLY_CHAIN_OR_COMM) {
    let chain = IPFS_ONLY_CHAIN_OR_COMM;
    const chains = (await models.Chain.findAll()).map(o => o.id);
    if (!chains.includes(IPFS_ONLY_CHAIN_OR_COMM)) {
      chain = (await models.OffchainCommunity.findOne({
        where: { 'id': IPFS_ONLY_CHAIN_OR_COMM }
      })).default_chain
    }
    allNewAddressData = allNewAddressData.filter(o => o.chain === chain)
  }

  // // push all the new address data to ipfs
  for (const data of allNewAddressData) {
    const roles = {}
    data.Roles.forEach((role) => {
      if (role.offchain_community_id) roles[role.offchain_community_id] = role.permission;
      else if (role.chain_id) roles[role.chain_id] = role.permission;
    });
    const result = await bucketClient.pushPath(
      buckets['Addresses'].root.key,
      `${data.address}.json`,
      Buffer.from(JSON.stringify({
        chain: data.chain,
        twitterHandle: null,
        roles
      }))
    )
    await updateBucketCache('Addresses', result);
  }

  log.info('Finished updating addresses')
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
  let communities = await models.OffchainCommunity.findAll({
    attributes: ['id', 'name', 'default_chain', 'description', 'website', 'discord', 'telegram', 'github'],
    where: {
      'updated_at': {
        [Op.gt]: lastUpdate,
        [Op.lte]: now,
      },
      'deleted_at': null,
    }
  })

  // filter out private communities
  if (!IPFS_PRIVATE_COMMUNITIES) {
    communities = communities.filter(o => !o.privacyEnabled)
  }

  const promises = [];
  for (const comm of communities) {
    if (IPFS_ONLY_CHAIN_OR_COMM && IPFS_ONLY_CHAIN_OR_COMM != comm.id) continue;

    await getOrCreateBucket(bucketClient, comm.id, !!comm.privacyEnabled)

    const data = [
      buckets[comm.id].root.key,
      'index.json',
      Buffer.from(JSON.stringify(comm))
    ]

    if (IPFS_ASYNC_PUSH) promises.push(bucketClient.pushPath(...data))
    else {
      const result = await bucketClient.pushPath(...data)
      await updateBucketCache(comm.id, result);
    }
  }

  if (IPFS_ASYNC_PUSH) await Promise.all(promises)
  log.info('Finished updating communities')
}

async function updatePublicThreads(bucketClient) {
  let updatedThreads = (await models.OffchainThread.findAll({
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

  if (!IPFS_PRIVATE_COMMUNITIES) {
    updatedThreads = updatedThreads.filter(o => !o.OffchainCommunity?.privacyEnabled)
  }

  const promises = [];
  for (const thread of updatedThreads) {
    const bucketName = thread.community || thread.chain;
    if (IPFS_ONLY_CHAIN_OR_COMM && IPFS_ONLY_CHAIN_OR_COMM != bucketName) continue;
    await getOrCreateBucket(bucketClient, bucketName, !!thread.OffchainCommunity?.privacyEnabled)

    const data = [
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
    ]
    if (IPFS_ASYNC_PUSH) promises.push(bucketClient.pushPath(...data))
    else {
      const result = await bucketClient.pushPath(...data)
      await updateBucketCache(bucketName, result);
    }
  }
  if (IPFS_ASYNC_PUSH) await Promise.all(promises)

  log.info('Finished updating threads')
}

// root id gives use the id of the thread
async function updatePublicComments(bucketClient) {
  let comments = (await models.OffchainComment.findAll({
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

  if (!IPFS_PRIVATE_COMMUNITIES) {
    comments = comments.filter(o => !o.OffchainCommunity?.privacyEnabled)
  }

  const promises = [];
  for (const comment of comments) {
    const bucketName = comment.community || comment.chain;
    if (IPFS_ONLY_CHAIN_OR_COMM && IPFS_ONLY_CHAIN_OR_COMM != bucketName) continue;
    await getOrCreateBucket(bucketClient, bucketName, !!comment.OffchainCommunity?.privacyEnabled)

    const data = [
      buckets[bucketName].root.key,
      `comments/${comment.id}.json`,
      Buffer.from(JSON.stringify({
        author: comment.Address.address,
        text: comment.text,
        root_id: comment.root_id
      }))
    ]

    if (IPFS_ASYNC_PUSH) promises.push(bucketClient.pushPath(...data))
    else {
      const result = await bucketClient.pushPath(...data)
      await updateBucketCache(bucketName, result);
    }
  }

  if (IPFS_ASYNC_PUSH) await Promise.all(promises)
  log.info('Finished updating comments')
}

async function updatePublicReactions(bucketClient) {
  let reactions = (await models.OffchainReaction.findAll({
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

  if (!IPFS_PRIVATE_COMMUNITIES) {
    reactions = reactions.filter(o => !o.OffchainCommunity?.privacyEnabled)
  }

  const promises = [];
  for (const reaction of reactions) {
    const bucketName = reaction.community || reaction.chain
    if (IPFS_ONLY_CHAIN_OR_COMM && IPFS_ONLY_CHAIN_OR_COMM != bucketName) continue;
    await getOrCreateBucket(bucketClient, bucketName, !!reaction.OffchainCommunity?.privacyEnabled)

    const data = [
      buckets[bucketName].root.key,
      `reactions/${reaction.id}.json`,
      Buffer.from(JSON.stringify({
        reaction: reaction.reaction,
        thread_id: reaction.thread_id,
        comment_id: reaction.comment_id,
        proposal_id: reaction.proposal_id
      }))
    ];

    if (IPFS_ASYNC_PUSH) promises.push(bucketClient.pushPath(...data))
    else {
      const result = await bucketClient.pushPath(...data);
      await updateBucketCache(bucketName, result);
    }
  }

  if (IPFS_ASYNC_PUSH) await Promise.all(promises)
  log.info('Finished updating reactions')
}

async function updatePublicTopics(bucketClient) {
  let topics = (await models.OffchainTopic.findAll({
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

  if (!IPFS_PRIVATE_COMMUNITIES) {
    topics = topics.filter(o => !o.community?.privacyEnabled)
  }

  const promises = [];
  for (const topic of topics) {
    const bucketName = topic.community_id || topic.chain_id;
    if (IPFS_ONLY_CHAIN_OR_COMM && IPFS_ONLY_CHAIN_OR_COMM != bucketName) continue;
    await getOrCreateBucket(bucketClient, bucketName, !!topic.community?.privacyEnabled)

    const data = [
      buckets[bucketName].root.key,
      `topics/${topic.id}.json`,
      Buffer.from(JSON.stringify({
        name: topic.name,
        description: topic.description,
        telegram: topic.telegram
      }))
    ];

    if (IPFS_ASYNC_PUSH) promises.push(bucketClient.pushPath(...data))
    else {
      const result = await bucketClient.pushPath(...data)
      await updateBucketCache(bucketName, result);
    }
  }

  if (IPFS_ASYNC_PUSH) await Promise.all(promises)
  log.info('Finished updating topics')
}

async function getOrCreateBucket(bucketClient: Buckets, bucketName: string, encrypted?: boolean): Promise<string> {
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
  const result = await models.OffchainThread.findAll({
    attributes: ['id', 'title', 'body', 'chain', 'community', 'kind', 'url', 'stage', 'topic_id'],
    where: {
      'updated_at': {
        [Op.gt]: lastUpdate,
        [Op.lte]: now,
      },
      'deleted_at': null,
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
