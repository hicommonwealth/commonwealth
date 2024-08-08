# Request Handler Optimization

_This is a historical document which uses performance improvements to the `/status` route as an example for the optimization of request handlers more generally. The PRs which introduced the discussed improvements are #3916 and #4060._

The law of compounding states that if we improve something by 50% three times, we achieve an overall improvement of approximately 10x. For example, starting with 1 second, improving it to 500 milliseconds, then to 250 milliseconds, and finally to 125 milliseconds.

_See also [Database Optimizaion](./Database-Optimization.md) entry._

## Contents

- [Loops and Sequelize Operators](#loops-and-sequelize-operators)
- [Parallelization and Promise.all](#parallelization-and-promiseall)
- [Eliminating Unnecessary Joins](#eliminating-unnecessary-joins)

### Loops and Sequelize Operators

Previously, the code was fetching data for each of the 1.6K chains/communities using a loop:

```javascript
chains = chains.findAll()
chains.map(c=>(model.CommunitySnapshot.findOne({where {chain_id: c.id }})
```

To optimize this, the refactored code uses the "IN" clause in a single network round trip:

```javascript
chains = chains.findAll()
chainIds = chains.map(c=>c.id)
chains.map(c=>(model.CommunitySnapshot.findOne({where chain_id: { [Op.in]: chainsIds,},})
```

This simple refactor alone resulted in a 50% performance improvement.

### Parallelization and Promise.all

To further optimize the code, parallelization using `Promise.all` was introduced:

```js
async function getStatus(models, req) {
  let {chains, chainsWithSnapshots} = await getChainStatus(models)
  let chainIds = chains.map(c=>c.id)
  let userStatus = await getUserStatus(models, chainIds)
}
```

By making the subsequent calls to `getChainStatus` and `getUserStatus` parallel, using `Promise.all`, we achieve an additional 10-20% improvement in performance:

```js
async function getStatus(models, req) {
  let chainsStatusPromise = getChainStatus(models)
  let userStatusPromise = getUserStatus(models)

  let [chainStatusRet, userStatusRet] = await Promise.all([chainsStatusPromise, userStatusPromise])
}
```

### Eliminating Unnecessary Joins

As the code evolved over the years, two unnecessary joins were identified and removed. This was a lucky scenario where the attached data from the `models.Chain` query was not even being used:

```js
models.Community.findAll({
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

By removing the unnecessary inclusions, the following simplified query was used, resulting in another 50% improvement in performance:

```js
models.Community.findAll({
  where: { active: true },
})
```

## Change Log

- 240705: Historicized and abridged by Graham Johnson (#8376).
- 230602: Authored by Nakul Manchanda.
