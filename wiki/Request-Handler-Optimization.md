# Learning from recent refactoring

## Law of Compounding
- If we improve something 50% thrice, we get ~10x overall improvement
eg. 1s -> 500ms -> 250ms -> 125ms

## Motivation 
-`/api/status` this route was noticeably slow for a while 1.2-2.2s, its 150-450ms now
 
## Best Practice (Refactoring Opportunities)

Related `/api/status` PRs:
- https://github.com/hicommonwealth/commonwealth/pull/4060
- https://github.com/hicommonwealth/commonwealth/pull/3916

## SELECT - in for loop
We have 1.6K chains/communities.
```
chains = chains.findAll()
chains.map(c=>(model.CommunitySnapshot.findOne({where {chain_id: c.id }})
```
Basically, we were making 1.6K get calls - one for each community

**Refactor:**
We can easily fetchAll data using "IN" clause in one network round trip
```
chains = chains.findAll()
chainIds = chains.map(c=>c.id)
chains.map(c=>(model.CommunitySnapshot.findOne({where chain_id: { [Op.in]: chainsIds,},})
```

This alone gave us 50% performance improvement.


## Parallelization - using Promise.all

```
async function getStatus(models, req) {
  let {chains, chainsWithSnapshots} = await getChainStatus(models)
  let chainIds = chains.map(c=>c.id)
  let userStatus = await getUserStatus(models, chainIds)
}
```

Here we did little bit of duplication to remove chainIds dependency between two subsequent calls to make them parallel
```
async function getStatus(models, req) {
  let chainsStatusPromise = getChainStatus(models)
  let userStatusPromise = getUserStatus(models)

  // they are called in parallel now
  let [chainStatusRet, userStatusRet] = await Promise.all([chainsStatusPromise, userStatusPromise])
}
```

This provided us another 10-20% improvement

## Remove unwanted data - Eliminating Joins
This is lucky scenario
We were just able to remove two big joins as code refactored over the years, 
the attached data was not even being used 

```
models.Chain.findAll({
      where: { active: true },
      include: [
        {
          model: models.Topic,
          as: 'topics',
        },
        {
          model: models.ChainNode,
          required: true,
        },
      ],
    })
```

Removed unnecessary inclusions
```
models.Chain.findAll({
      where: { active: true },

    })
```
This is source of another 50% improvement
