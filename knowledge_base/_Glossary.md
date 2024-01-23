# Glossary

## Chain Concepts

### Chain Entity

A Chain Entity is a backend object, stored in the ChainEntities table, which consists of chain event bundles and values received from a smart CONTRACT.

### Chain Node

An endpoint or set of endpoints for querying arbitrary data from a specified chain.

<!-- TODO: Expand, clarify -->

### Delegate Contract

A delegate contract is a smart CONTRACT that contains the functions, events, and all business logic for a proxy contract.

### Module

Some CHAINS use modules rather than CONTRACTS. Modules are used predominantly within the Cosmos and Substrate ecosystems.

## Commonwealth

### Comment

### Community

A community is a space on Common, joinable by PROFILES, that owns metadata and is defined by a set of (ROLES) and PERMISSIONS for participation.

### Core

A set of features considered central to Common, which interface out with first-party apps. As of 240123, the core consists of a SIGN-IN system, a NOTIFICATION system, and a GROUP system.

### Forum

The Common forum is Common's flagship first-party app. Its primary organizational primitive is the COMMUNITY. The forum app provides UI for off-chain discussions, and for interacting with community-associated CHAINS.

### Group

<!-- TODO -->

### Link

Some Common content can be inter-linked, so that the content's UI prominently reflects its relationship to other content. As of 240123, THREADS can be linked to other THREADS as well as to PROPOSALS (both Snapshot and on-chain).

### Member

Generically, a member is a PROFILE that holds a (ROLE) within a COMMUNITY. More specifically, "Member" is the lowest-ranking (ROLE) in COMMUNITIES, below MODERATOR and ADMIN.

### Notification

### Profile

A profile is one or more ADDRESS, grouped together as a single identity, and owned by a USER.

### Reaction

### Poll

A poll is an off-chain mechanism for allowing PROFILES on a COMMUNITY to vote on a prompt (i.e. a question or decision). Poll objects in our database own many VOTES.

### Role

DEPRECATED IN FAVOR OF GROUPS ONTOLOGY.

### Sessions

Active or not

### Sign-In

All "log-in" and similar language is deprecated and semantically incorrect.

### Stake

Community Stake is a feature whereby COMMUNITY ADMINS allow MEMBER PROFILES' ADDRESSES (?) to deposit Ethereum into a smart contract in exchange for ERC1155 tokens. The received tokens are considered "stake."

Stake is used for GATING content and features across a COMMUNITY FORUM.

### Subscription

SEe NOTIFICATIONS.

### Template

Used for THREADS within TOPICS.

### Thread

A thread is a post made via the Common FORUM app, on top of which COMMENTS and REACTIONS may be created. May LINK to other THREADS and PROPOSALS, or own a POLL.

<!-- TODO: Improve "is a post" language. -->

### Topic

A topic is a sub-section of a COMMUNITY FORUM. It may be GATED or require PERMISSIONS to participate in.

<!-- TODO: Investigate GATING and PERMISSIONS -->

### User

A user on Common is an account which owns one or more PROFILES, and is identified by a unique login token.

A user is considered ACTIVATED when one of its profiles has taken an action, such as adding an UPVOTE, COMMENT, THREAD, or POLL.

### Wallet

A tool, typically a browser plugin or hardware device, that manages keys for signing transactions for blockchains.

<!-- TODO: Make Common-specific -->

### Votes

## Hexagonal Architecture

### Port

An interface between an application and some external system. Either incoming or outgoing.

### Adapter

A component linked to a PORT, which translates incoming and outoing data and messages.

## Praxis

### Fast-Follow

A new-feature ticket related to a project that is non-blocking but can be completed within a week, to be completed after the project is complete.

<!-- TODO: IMPROVE WORDING FOR CLARITY -->

## Change Log

24012X: Authored by Graham Johnson (#).
