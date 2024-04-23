# Request Handler Optimization

## Contents

- [Learning from Recent Refactoring](#learning-from-recent-refactoring)
  * [Law of Compounding](#law-of-compounding)
  * [Motivation](#motivation)
  * [Best Practices (Refactoring Opportunities)](#best-practices-refactoring-opportunities)
  * [SELECT - In For Loop](#select---in-for-loop)
  * [Parallelization - Using Promise.all](#parallelization---using-promiseall)
  * [Remove Unwanted Data - Eliminating Joins](#remove-unwanted-data---eliminating-joins)

## Learning from Recent Refactoring

### Law of Compounding

The law of compounding states that if we improve something by 50% three times, we achieve an overall improvement of approximately 10x. For example, starting with 1 second, improving it to 500 milliseconds, then to 250 milliseconds, and finally to 125 milliseconds.

### Motivation

The motivation for the recent refactoring was to address the noticeable slowness of the `/api/status` route, which had an average response time of 1.2-2.2 seconds. The goal was to optimize and improve its performance to reduce the response time to around 150-450 milliseconds.

### Best Practices (Refactoring Opportunities)

The following pull requests (PRs) are related to the `/api/status` route and demonstrate the implementation of best practices for optimization:

- PR #4060: [Link to PR](https://github.com/hicommonwealth/commonwealth/pull/4060)
- PR #3916: [Link to PR](https://github.com/hicommonwealth/commonwealth/pull/3916)

### SELECT - In For Loop

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

### Parallelization - Using Promise.all

To further optimize the code, parallelization using `Promise.all` was introduced:

```javascript
async function getStatus(models, req) {
  let {chains, chainsWithSnapshots} = await getChainStatus(models)
  let chainIds = chains.map(c=>c.id)
  let userStatus = await getUserStatus(models, chainIds)
}
```

By making the subsequent calls to `getChainStatus` and `getUserStatus` parallel, using `Promise.all`, we achieved an additional 10-20% improvement in performance:

```javascript
async function getStatus(models, req) {
  let chainsStatusPromise = getChainStatus(models)
  let userStatusPromise = getUserStatus(models)

  let [chainStatusRet, userStatusRet] = await Promise.all([chainsStatusPromise, userStatusPromise])
}
```

### Remove Unwanted Data - Eliminating Joins

As the code evolved over the years, two unnecessary joins were identified and removed. This was a lucky scenario where the attached data from the `models.Chain` query was not even being used:

```javascript
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

```javascript
models.Community.findAll({
  where: { active: true },
})
```

## Change Log

- 230602: Authored by Nakul Manchanda.
