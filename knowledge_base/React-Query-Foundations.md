The purpose of this doc is to present react-query as a tool that will help us handling application state - to be more specific - not a UI state, but the data coming from the backend server.

**Contents**

- [What is React-Query](#what-is-react-query)
- [How **React-Query works in a nutshell**](#how---react-query-works-in-a-nutshell--)
- [Why do we even consider React-Query?](#why-do-we-even-consider-react-query-)
- [Advantages and drawbacks](#advantages-and-drawbacks)
  * [Pros](#pros)
  * [Cons](#cons)
- [Gameplan](#gameplan)
- [React-Query styleguide](#react-query-styleguide)

## What is React-Query

React-Query is a popular open-source library that offers a data-fetching and caching solution for React applications. It simplifies the process of making asynchronous API calls and managing the data received from these calls. React-Query provides an elegant way to manage complex data-fetching requirements that typically involve network requests, caching, and refetching.

## How **React-Query works in a nutshell**

React-Query works by separating the data-fetching and data-management concerns from the component tree. It does this by providing a set of hooks that can be used to fetch and manage data. These hooks can be called from anywhere in the application, not just from within the component tree.

React-Query also provides a caching mechanism that caches data on the client-side. This means that when you make a subsequent request for the same data, React-Query can serve it from the cache instead of making a network request. This can help improve the performance of the application.

## Why do we even consider React-Query?

We are looking for a tool to help us manage the state of the application. The current architecture is not well suited to the React approach. Components do not react to a change in the store unless we inform them explicitly (e.g. with the help of an event emitter). In addition, a large majority of the current state is based on CRUD queries and is designed to hold server state on the front-end side. Using React-Query, we will be able to better organize how we communicate with the server. In addition, we will be able to greatly reduce the size of the front-end store, which will ultimately only help us with UI state handling stuff. All the heavy lifting work of holding data will be taken over by React-Query

## Advantages and drawbacks

Like any solution, React-Query has its strengths and weaknesses.

### Pros

- Caching mechanism can help reduce the number of network requests our application makes, which can improve performance and reduce latency.
- Apart from cache, RQ provides many options to improve performance for example it can cancel in-flight requests when a component unmounts or when a subsequent request is made for the same data or it helps introduce optimistic updates
- It can help reduce the amount of boilerplate code we need to write to manage data-fetching (loading state, error handling, providing data)
- Maintainers are top-notch developers that follow the best standards in front-end industry
- RQ has great community, thus there are a lot of resources on the Internet to learn it and find solutions to common problems
- RQ can be added incrementally to the project

### Cons

- While React-Query is relatively easy to use, it does have a learning curve, especially if there are no foundations set up
- If we decide to introduce both React-Query and Zustand, we will need to handle 3 state managers at the same time (3rd one is the current one), which might be quite messy for some period of time
- RQ is hooks first tool - it means that it cannot be used outside of react components. Thus, we need to rethink initialisation flow to take advantage of react-query.

## Gameplan

At first glance, React-Query does not seem to be too complicated to use. On the other hand, it has a lot of configuration possibilities. Then there is the issue of how to replace controllers and stores, and how to build a proper structure of directories, files, etc. [This short PR](https://github.com/hicommonwealth/commonwealth/pull/3741) presents the migration of a small piece of store and shows how much things need to be thought through to properly implement React-Query. That's why the first PRs are crucial to properly prepare the foundation for broader implementation.

- [ ]  Decide on which part of store we want to transfer first.
(From our perspective - Malik&Marcin - `topics` seems to be good shot, because it is not super complicated, but in the same time it has all CRUD operations so we can figure out both queries and mutations.)
- [ ]  Work on first PR which will be about:

1. Preparing the scaffold (directories, utils, cache keys approach, usage in components etc.) according to the style guide below.
2. Moving first part of store to the new react-query approach (eg `topics`)

- [ ]  Identify further areas that we would like to focus on.
(From our perspective, a big gain will be the introduction of React-Query at `threads` so discussions page and thread page. Also, queries that are made during the initialisation are worth to consider. Basically we are looking for data that is not being changed so often, so we can cache it! It would be great if we had some analytics on which backend routes are hit most frequently and which routes are the heaviest)
**Note: in this step it would be good to figure out which parts of the current store are feasible for React-Query and which parts should be handled by Zustand.**
- [ ]  Incrementally move other parts of old store to the React-Query, focusing on those that give us biggest performance gain.

## React-Query styleguide

(This is not final - it should be incrementally adjusted)

- we do not want to use react-query hooks in the components. From now on, we want the components to be responsible for rendering the data, not for handling the business logic. Thus, we want to create custom hooks that will expose react-query hooks and mutations and will be used in the components. For example `useTopics` will have all queries and mutations related to `topics` endpoints.
[Example here](https://github.com/hicommonwealth/commonwealth/pull/3741/files#diff-089b03d43833900fae3040e6a7279eb567973b0ec5739153ee05292e0f0ac414)
- Each query is identified by the `queryKey`. We need to build an easy approach to use queryKey effectively. There is an idea how to do this, but it needs evaluation:
  - Each backend route as a base for the query key: [check comment](https://github.com/hicommonwealth/commonwealth/pull/3741/files#r1186838388)
- We must not use jQuery for API calls. We use axios and we want to get rid of jQuery eventually.
- optimistic update seems to add boilerplate and complexity to the code. Ideally, we should have custom hook which will be used instead of `useMutation` and it will be responsible for handling optimistic update by default eg `useOptimisticMutation`
[See the comment](https://github.com/hicommonwealth/commonwealth/pull/3741/files#r1186518881)
- naming convention for queries and mutations:
  - Queries are for GET, so `const getTopicQuery = useQuery()`
  - Mutations are for PUT, POST and DELETE so const `editTopicMutation = useMutation()`, `const createTopicMutation = useMutation()` etc
- we should create and use methods for modifying arrays to avoid repeating code over and over again eg in optimistic updates. We can use methods from loadash.
[See comment](https://github.com/hicommonwealth/commonwealth/pull/3741/files#r1186842517)
- we should use default `staleTime` and `cacheTime` at the beginning as they work pretty nice out of the box. Later on we can play around with these values to adjust it to our needs.
[See comment](https://github.com/hicommonwealth/commonwealth/pull/3741/files#r1186839947)

## Change Log

- 230509: Authored by Marcin Maslanka.
