# Glossary

As of 240305, this starter glossary is in-progress and needs improvement. If you notice unclear wording or conceptual confusions, please open a PR tethered to the #4800 general documentation ticket!

Glossary terms referenced in a given term's definition are designated with CAPITAL letters. Relevant models and related entries may also be referenced; see [Subscription](#subscription) for an example.

## Contents

- [Chain Concepts](#chain-concepts)
  * [Chain Entity](#chain-entity)
  * [Chain Node](#chain-node)
  * [Delegate Contract](#delegate-contract)
  * [Module](#module)
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

### Chain Entity

A Chain Entity is a backend object, stored in the ChainEntities table, which consists of chain event bundles and values received from a smart contract.

### Chain Node

An endpoint or set of endpoints for querying arbitrary data from a specified chain.

<!-- TODO: Expand, clarify -->

### Delegate Contract

A delegate contract is a smart CONTRACT that contains the functions, events, and all business logic for a proxy contract.

### Module

Some CHAINS use modules rather than CONTRACTS. Modules are used predominantly within the Cosmos and Substrate ecosystems.

## Common App

### Bridge

The Product Team uses "bridge" and "bridging" language, in user-facing comms, to refer to implementation-agnostic, cross-platform integrations such as [Discobot](./Discobot.md) and Farcaster.

### Comment

See [models/comment.ts](../libs/model/src/models/comment.ts).

### Community

A community is a space on Common, joinable by PROFILES, that owns metadata and is defined by a set of (ROLES) and PERMISSIONS for participation.

See [models/community.ts](../libs/model/src/models/community.ts)

### Core

A set of features considered central to Common, which interface out with first-party apps. As of 240123, the core consists of a SIGN-IN system, a NOTIFICATION system, and a GROUP system.

### Forum

The Common forum is Common's flagship first-party app. Its primary organizational primitive is the COMMUNITY. The forum app provides UI for off-chain discussions, and for interacting with community-associated CHAINS.

### Group

`Groups` are used by community admins to handle permissioning across the forum, using associated `Membership` objects that link `Addresses` to Groups. For more thorough documentation, see [Groups](./Groups.md) entry.

See [models/group.ts](../libs/model/src/models/group.ts).

### Link

Some Common content can be inter-linked, so that the content's UI prominently reflects its relationship to other content. As of 240123, THREADS can be linked to other THREADS as well as to PROPOSALS (both Snapshot and on-chain).

### Member

Generically, a member is a PROFILE that holds a (ROLE) within a COMMUNITY.

More specifically, "Member" is the lowest-ranking (ROLE) in COMMUNITIES, below MODERATOR and ADMIN.

<!-- TODO: UPDATE IN LIGHT OF NEW PERMISSIONS -->

### Notification

*Related Terms:* [Subscription](#subscription)

Notifications are messages emitted to users who are SUBSCRIBED to a given category of activity atop a given forum entity (e.g. a THREAD or COMMUNITY).

See also [models/notification.ts](../libs/model/src/models/notification.ts) and our KB entry [Notifications.md](./Notifications.md). For a list of activity categories which may trigger notification, see [NotificationCategories](../libs/core/src/types.ts).

### Page Scope

The Common website consists of scoped and unscoped pages. Scoped pages, or "community" pages, belong to Common communities; their URI syntax takes the form of e.g. `/scope/discussion/identifier`. Unscoped pages, or "global" pages, are community-independent. Examples include the landing and `/terms` pages.

For URI parsing, route setup, and the scope-conditional rendering of page layouts, see `CommonDomainRoutes.tsx`,  `setupAppRoutes.ts` and `Layout.tsx`.

### Profile

A profile is one or more ADDRESS, grouped together as a single identity, representing a single USER.

**Model:** [profile.ts](../libs/model/src/models/profile.ts)

### Reaction

### Poll

A poll is an off-chain mechanism for allowing PROFILES on a COMMUNITY to vote on a prompt (i.e. a question or decision). Poll objects in our database own many VOTES.

See [models/poll.ts](../libs/model/src/models/poll.ts).

### Role

As of 231215, Roles are considered deprecated ontology at Common. In their place is a GROUPS and PERMISSIONS system.

### Sessions

Active or not

### Sign-In

All "log-in" and similar language is deprecated and semantically incorrect.

### Stake

Community Stake is a feature whereby COMMUNITY ADMINS allow MEMBER PROFILES' ADDRESSES (?) to deposit Ethereum into a smart contract in exchange for ERC1155 tokens. The received tokens are considered "stake."

Stake is used for GATING content and features across a COMMUNITY FORUM.

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

A topic is a sub-section of a COMMUNITY FORUM. It may be GATED or require PERMISSIONS to participate in.

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
