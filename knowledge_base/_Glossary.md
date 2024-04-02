# Glossary

As of 240305, this starter glossary is in-progress and needs improvement. If you notice unclear wording or conceptual confusions, please open a PR tethered to the #4800 general documentation ticket!

Glossary terms referenced in a given term's definition are designated with CAPITAL letters. Relevant models and related entries may also be referenced; see [Subscription](#subscription) for an example.

## Contents

- [Chain Concepts](#chain-concepts)
  * [Chain Base](#chain-base)
  * [Chain Node](#chain-node)
  * [Module](#module)
  * [Network](#network)
- [Common App](#common-app)
  * [Bridge](#bridge)
  * [Comment](#comment)
  * [Community](#community)
  * [Core](#core)
  * [Forum](#forum)
  * [Group](#group)
  * [Link](#link)
  * [Member](#member)
  * [Notification](#notification)
  * [Page Scope](#page-scope)
  * [Profile](#profile)
  * [Reaction](#reaction)
  * [Poll](#poll)
  * [Role](#role)
  * [Sessions](#sessions)
  * [Sign-In](#sign-in)
  * [Stake](#stake)
  * [Subscription](#subscription)
  * [Template](#template)
  * [Thread](#thread)
  * [Topic](#topic)
  * [User](#user)
  * [Wallet](#wallet)
  * [Votes](#votes)
- [Hexagonal Architecture](#hexagonal-architecture)
  * [Port](#port)
  * [Adapter](#adapter)
- [Praxis](#praxis)
  * [Blocked](#blocked)
  * [Fast-Follow](#fast-follow)
  * [Issues, Tickets, & Stories](#issues-tickets--stories)
- [Change Log](#change-log)

## Chain Concepts

_NB: The meaning of these terms within the Common context is idiosyncratic and specific; these terms should not be taken as canonical Web3 concepts._

### Chain Base

A blockchain ecosystem, or L0, atop which NETWORK protocols are built.

### Chain Node

An endpoint, referring to external RPC servers, used to fetch updates and query data from blockchains.

### Module

Whereas contracts rely on a virtual machine running code atop a blockchain, modules are native extensions to a chain, seen predominantly within the Cosmos and Substrate ecosystems.

### Network

Network, as defined in the codebase, is a kludge of chains and chain ecosystems. Semantically, it refers only to the relevant `Chains` table database field; it has not been standardized, and lacks a real referent beyond determining which client code to load. (See step 4 of [App-Initialization-Flow.md](./App-Initialization-Flow.md))

## Common App

### Bridge

The Product Team uses "bridge" and "bridging" language, in user-facing comms, to refer to implementation-agnostic, cross-platform integrations such as [Discobot](./Discobot.md) and Farcaster.

### Comment

A short Markdown text object responding to a THREAD, which can be REACTED to.

See [models/comment.ts](../libs/model/src/models/comment.ts).

### Community

A community a unique namespace, identifying a set of underlying applications on the Common app. A community contains GROUPS; groups may be joined by PROFILE ADDRESSES.

See [models/community.ts](../libs/model/src/models/community.ts)

### Core

A set of features considered central to Common, which interface out with first-party apps. As of 240123, the core consists of a SIGN-IN system, a NOTIFICATION system, and a GROUP system.

### Forum

The Common forum (or "forum app") is Common's flagship first-party app. Its primary organizational primitive is the COMMUNITY. The forum app provides UI for off-chain discussions, and for interacting with community-associated chains.

### Group

ADDRESSES have Memberships to GROUPS. A group is defined by metadata and a set of on- and off-chain requirement for membership.

See [models/group.ts](../libs/model/src/models/group.ts) and the knowledgebase [Groups](./Groups.md) entry.

### Link

Some content on Common can be inter-linked, so that the content's UI prominently reflects its relationship to other content. As of 240123, THREADS can be linked to other THREADS as well as to PROPOSALS (both Snapshot and on-chain).

### Member

<!-- TODO: Review & update in light of new permissioning system; blocked pending meeting with Product. -->

Generically, a member is the default state of a PROFILE ADDRESS that has joined a GROUP contained within a COMMUNITY.

See [models/membership.ts](../libs/model/src/models/membership.ts).

### Notification

*Related Terms:* [Subscription](#subscription)

Notifications are messages emitted to users who are SUBSCRIBED to a given category of activity atop a given forum entity (e.g. a THREAD or COMMUNITY).

See also [models/notification.ts](../libs/model/src/models/notification.ts) and our KB entry [Notifications.md](./Notifications.md). For a list of activity categories which may trigger notification, see [NotificationCategories](../libs/core/src/types.ts).

### Page Scope

The Common website consists of scoped and unscoped pages. Scoped pages, or "community" pages, belong to Common communities; their URI syntax takes the form of e.g. `/scope/discussion/identifier`. Unscoped pages, or "global" pages, are community-independent. Examples include the landing and `/terms` pages.

For URI parsing, route setup, and the scope-conditional rendering of page layouts, see `CommonDomainRoutes.tsx`,  `setupAppRoutes.ts` and `Layout.tsx`.

### Profile

A USER consists of multiple ADDRESSES and a linked profile which specifies social metadata displayed on a profile page.

See [models/profile.ts](../libs/model/src/models/profile.ts).

### Reaction

<!-- TODO -->

### Poll

A poll is an off-chain mechanism for allowing PROFILES on a COMMUNITY to vote on a prompt (i.e. a question or decision). Poll objects in our database own many VOTES.

See [models/poll.ts](../libs/model/src/models/poll.ts).

### Role

As of 231215, Roles are considered deprecated ontology at Common.

COMMUNITIES remain managed by admins and moderators, but these are defined by their participation in admin and moderator GROUPS, with specific requirements and capacities.

### Sessions

A session may be active or inactive. A browsing or "analytics" session begins when a USER opens a new Common tab or window, and ends when that window closes.

When a USER SIGNS IN, a session key is created for their active ADDRESS, which is used to sign actions such as COMMENTS and REACTIONS.

### Sign-In

System which allows USERS to enter into sessions on the Common app and perform user actions. All "log-in" and similar language is deprecated and semantically incorrect.

### Stake

Community Stake is a feature whereby COMMUNITY ADMINS allow MEMBER PROFILES' ADDRESSES to deposit Ethereum into a smart contract in exchange for ERC1155 tokens. The received tokens are considered "stake." Stake is used for GATING content and features across a FORUM COMMUNITY.

See [models/community_stake.ts](../libs/model/src/models/community_stake.ts).

### Subscription

*Related Terms:* [Notification](#notification)

USERS subscribe (and are autosubscribed) to new events, e.g. in COMMUNITIES they join or on THREADS and COMMENTS they author. Users receive all NOTIFICATION objects which match the entity and category  ids of their subscriptions.

See [models/subscription.ts](../libs/model/src/models/subscription.ts).

### Template

A starter form for creating THREADS within a given TOPIC. As of 240305, this feature is only half-supported by Common App UX.

See [models/template.ts](../libs/model/src/models/template.ts).

### Thread

A thread is a discussion space created via the Common FORUM app. "Thread" may refer either specifically to the original post ('OP') object which opens a discussion, or more broadly to the group of discussion COMMENTS which includes and responds to OP. A thread may be REACTED to; it may be LINKED to other THREADS and PROPOSALS; and it may house a related POLL.

See [models/thread.ts](../libs/model/src/models/thread.ts)

### Topic

A topic is a sub-section of a COMMUNITY FORUM. It may be GATED or require permissions to participate in.

See [models/topic.ts](../libs/model/src/models/topic.ts)

### User

A user on Common is an account which is associated with a PROFILE, owns one or more ADDRESSES, and is identified by a unique login token.

A user is considered ACTIVATED when one of its profiles has taken an action, such as adding an UPVOTE, COMMENT, THREAD, or POLL.

See [models/user.ts](../libs/model/src/models/user.ts).

### Wallet

A tool, typically a browser plugin or hardware device, that manages keys for signing transactions for blockchains. The Common App delegates transaction signing to web wallets for a variety of USER actions, from signing in to voting on proposals.

See [web_wallets.ts](../packages/commonwealth/client/scripts/controllers/app/web_wallets.ts).

### Votes

Votes are responses by ADDRESSES to POLL prompts.

See [models/vote.ts](../libs/model/src/models/vote.ts).

## Hexagonal Architecture

### Adapter

A component linked to a PORT, which translates incoming and outgoing data.

### Port

An interface between an application and some external system; may be incoming or outgoing.

## Praxis

### Blocked

A project is considered blocked when some process outside the direct control of the developer—i.e. the blocker—must be resolved before work on the blocked project can continue.

### Fast-Follow

Fast-follow tickets are change requests tethered to new feature projects, intended to be completed within a week of the feature project being completed and merged.

### Issues, Tickets, & Stories

<!-- Blocked pending meeting with Forest -->

## Change Log

240305: Authored by Graham Johnson (#6985).
