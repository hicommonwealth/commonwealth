
// TODO: add sigterm pool.end for dbNode (use same as from chain_spec tests)

import { Buckets, PrivateKey } from '@textile/hub';
import { factory, formatFilename } from '../../shared/logging';
import models from '../database';
import { Op } from 'sequelize';
import { GetOrCreateResponse } from '@textile/buckets/dist/cjs/types';

const log = factory.getLogger(formatFilename(__filename));

async function main() {
  const user = await PrivateKey.fromRandom();
  const bucketClient = await Buckets.withKeyInfo({ key: process.env.HUB_CW_KEY });
  const token = await bucketClient.getToken(user);

  try {
    await updateAddresses(bucketClient)
  } catch (error) {
    console.error('Address updating error')
    throw error
  }

  try {
    await updatePublicCommunities(bucketClient)
  } catch (error) {
    console.error('Community updating error')
    throw error
  }

  try {
    await updatePublicThreads(bucketClient)
  } catch (error) {
    console.error('Thread updating error')
    throw error
  }

  try {
    await updatePublicComments(bucketClient)
  } catch (error) {
    console.error('Comment updating error')
    throw error
  }

  try {
    await updatePublicReactions(bucketClient)
  } catch (error) {
    console.error('Reaction updating error')
    throw error
  }
  // await sequelizeTester();

  return bucketClient
}

// TODO: add index.json for default chain communities
// TODO: lastUpdate has to be stored in DB or elsewhere since when script restarts it should restart from 1970
// TODO: error handling + Rollbar
let bucketClient;
// TODO: empty the buckets every so often
const buckets: { [key: string]: GetOrCreateResponse } = {}
let lastUpdate = new Date(); // set this to 1970 for first run
lastUpdate.setHours(lastUpdate.getHours()-24);
main().then((client) => {}
  // setInterval(main, 30000)
).then(() => {

}).catch((error) => {
  log.error('An error occurred in the ipfs node', error)
})

/**
 * Updates any address or address related data such as chain and roles on ipfs
 * @param bucketClient An instance of the textile bucket api client
 */
async function updateAddresses(bucketClient) {
  if (!buckets.addressBucket) {
    let addressBucket = await bucketClient.getOrCreate('Addresses');
    if (!addressBucket.root) {
      throw new Error('Failed to open bucket');
    }
    log.info(`IPNS address of Users bucket: ${addressBucket.root.key}`)
    log.info(`https://ipfs.io/ipns/${addressBucket.root.key}`)
    buckets.addressBucket = addressBucket
  }

  // get all addresses that have been updated + their associated roles
  const updatedAddresses = await models.Address.findAll({
    attributes: ['id', 'address', 'chain'],
    where: {
      'updated_at': {
        [Op.gt]: lastUpdate
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
        [Op.gt]: lastUpdate
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
    await bucketClient.pushPath(
      buckets.addressBucket.root.key,
      `${data.address}.json`,
      Buffer.from(JSON.stringify({
        chain: data.chain,
        twitterHandle: null,
        roles
      }))
    )
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
        [Op.gt]: lastUpdate
      },
      'deleted_at': null,
      'privacyEnabled': false
    }
  })

  for (const comm of communities) {
    if (!buckets[comm.id]) {
      const communityBucket = await bucketClient.getOrCreate(comm.id);
      if (!communityBucket.root) {
        throw new Error('Failed to open bucket');
      }
      log.info(`IPNS address of Users bucket: ${communityBucket.root.key}`);
      log.info(`https://ipfs.io/ipns/${communityBucket.root.key}`);
      buckets[comm.id] = communityBucket
    }


    await bucketClient.pushPath(
      buckets[comm.id].root.key,
      'index.json',
      Buffer.from(JSON.stringify(comm))
    )
  }
}

async function updatePublicThreads(bucketClient) {
  const updatedThreads = (await models.OffchainThread.findAll({
    attributes: ['id', 'title', 'body', 'chain', 'community', 'kind', 'url', 'stage', 'topic_id'],
    where: {
      'updated_at': {
        [Op.gt]: lastUpdate
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
  })).filter((o) => {
    if (o.OffchainCommunity) return !o.OffchainCommunity.privacyEnabled
    else return true // if there is no off-chain community than it is a default chain community which does not have privacyEnabled
  })

  for (const thread of updatedThreads) {
    const bucketName = thread.community ? thread.community : thread.chain;
    if (!buckets[bucketName]) {
      buckets[bucketName] = await bucketClient.getOrCreate(bucketName);
      if (!buckets[bucketName].root) {
        throw new Error('Failed to open bucket');
      }
      log.info(`IPNS address of Users bucket: ${buckets[bucketName].root.key}`);
      log.info(`https://ipfs.io/ipns/${buckets[bucketName].root.key}`);
    }
    await bucketClient.pushPath(
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
  }
}

// root id gives use the id of the thread
async function updatePublicComments(bucketClient) {
  const comments = (await models.OffchainComment.findAll({
    attributes: ['id', 'chain', 'community', 'text', 'root_id'],
    where: {
      'updated_at': {
        [Op.gt]: lastUpdate
      },
      'deleted_at': null,
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
  })).filter((o) => {
    if (o.OffchainCommunity) return !o.OffchainCommunity.privacyEnabled
    else return true // if there is no off-chain community than it is a default chain community which does not have privacyEnabled
  })

  for (const comment of comments) {
    const bucketName = comment.community ? comment.community : comment.chain;
    if (!buckets[bucketName]) {
      buckets[bucketName] = await bucketClient.getOrCreate(bucketName);
      if (!buckets[bucketName].root) {
        throw new Error('Failed to open bucket');
      }
      log.info(`IPNS address of Users bucket: ${buckets[bucketName].root.key}`);
      log.info(`https://ipfs.io/ipns/${buckets[bucketName].root.key}`);
    }

    await bucketClient.pushPath(
      buckets[bucketName].root.key,
      `comments/${comment.id}.json`,
      Buffer.from(JSON.stringify({
        author: comment.Address.address,
        text: comment.text,
        root_id: comment.root_id
      }))
    )
  }
}

async function updatePublicReactions(bucketClient) {
  const reactions = (await models.OffchainReaction.findAll({
    attributes: ['id', 'chain', 'reaction', 'community', 'thread_id', 'comment_id', 'proposal_id'],
    where: {
      'updated_at': {
        [Op.gt]: lastUpdate
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
  })).filter((o) => {
    if (o.OffchainCommunity) return !o.OffchainCommunity.privacyEnabled
    else return true // if there is no off-chain community than it is a default chain community which does not have privacyEnabled
  })

  for (const reaction of reactions) {
    const bucketName = reaction.community ? reaction.community : reaction.chain
    console.log(JSON.stringify(reaction), bucketName);
    if (!buckets[bucketName]) {
      buckets[bucketName] = await bucketClient.getOrCreate(bucketName);
      if (!buckets[bucketName].root) {
        throw new Error('Failed to open bucket');
      }
      log.info(`IPNS address of Users bucket: ${buckets[bucketName].root.key}`);
      log.info(`https://ipfs.io/ipns/${buckets[bucketName].root.key}`);
    }

    await bucketClient.pushPath(
      buckets[bucketName].root.key,
      `reactions/${reaction.id}.json`,
      Buffer.from(JSON.stringify({
        reaction: reaction.reaction,
        thread_id: reaction.thread_id,
        comment_id: reaction.comment_id,
        proposal_id: reaction.proposal_id
      }))
    )
  }
}

async function updatePublicTopics(bucketClient) {
  const topics = (await models.OffchainTopic.findAll({
    attributes: ['id', 'name', 'deleted_at', 'chain_id', 'community_id', 'description', 'telegram'],
    where: {
      'updated_at': {
        [Op.gt]: lastUpdate,
        'deleted_at': null
      },
    },
    include: [
      {
        model: models.OffchainCommunity,
        attributes: ['privacyEnabled']
      }
    ]
  })).filter((o) => {
    if (o.community) return !o.community.privacyEnabled
    else return true // if there is no off-chain community than it is a default chain community which does not have privacyEnabled
  })

  for (const topic of topics) {
    const bucketName = topic.community_id ? topic.community_id : topic.chain_id;
    console.log(JSON.stringify(topic), bucketName);
    if (!buckets[bucketName]) {
      buckets[bucketName] = await bucketClient.getOrCreate(bucketName);
      if (!buckets[bucketName].root) {
        throw new Error('Failed to open bucket');
      }
      log.info(`IPNS address of Users bucket: ${buckets[bucketName].root.key}`);
      log.info(`https://ipfs.io/ipns/${buckets[bucketName].root.key}`);
    }

    await bucketClient.pushPath(
      buckets[bucketName].root.key,
      `topics/${topic.id}.json`,
      Buffer.from(JSON.stringify({
        name: topic.name,
        description: topic.description,
        telegram: topic.telegram
      }))
    )
  }
}

async function sequelizeTester() {
  const result = await models.OffchainComment.findAll({
    attributes: ['id', 'chain', 'community', 'text', 'root_id'],
    where: {
      'updated_at': {
        [Op.gt]: lastUpdate
      },
      'deleted_at': null,
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
  })

  console.log(JSON.stringify(result))
}

async function bucketManagement(bucketClient: Buckets) {
  // await bucketClient.remove('bafzbeiamkfqyemughngc3z2grv7hykllastjzswpgimjzyrbtbyoinpgpe');
  // await bucketClient.remove('bafzbeibauqemtha344lt7gm724tgcnzmg44fs7sukllfe3yo6s6q3suuxa');
  // await bucketClient.remove('bafzbeigup4wh4zh3qc3xcfd5mnfmqkjacpixnmvwweyfpigl745lsudsiy');
  await bucketClient.remove('bafzbeihjhcvsm5jbfrj2f7h2v7qjbzsdvlfevsqicbo7pwev74v4kiyt3i');
  await bucketClient.remove('bafzbeihodwrewpnhhbrwedg4653bbgkz655w76qwroop25pbfn7gj7efqm');
}
