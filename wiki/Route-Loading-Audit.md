## Route Loading Audit


#### Logged Out on /discussions (osmosis, ETH starter community)



1. /domain (check custom domain)
2. /status (load main site data)
3. /entities
4. /getEntityMeta
5. /bulkOffchain
6. /activeThreads (threads per topic = 3 => overview page)
7. /threadsUsersCountAndAvatars
8. /bulkThreads
9. /entities (looks like duplicate call?)
10. /bulkThreads (looks like duplicate call?)
11. /entities (looks like duplicate call?)
12. /reactionCounts
13. /threadsUsersCountAndAvatars
14. /reactionCounts (looks like duplicate call?)
15. /threadsUsersCountAndAvatars (looks like duplicate call?)
16. /getAddressProfile (happens sometime after step 7, may be several)


#### /overview logged out



1. /domain
2. /status
3. /entities
4. /getEntityMeta
5. /bulkOffchain
6. /activeThreads
7. /threadsUsersCountAndAvatars
8. /getAddressProfile


#### Logged In on /discussions or /overview

After step (2) above, makes the following additional calls:



1. /viewDiscussionNotifications
2. /viewChainEventNotifications
3. /viewSubscriptions
4. /getSubscribedChains

After step (7) above, makes the following additional calls:



1. /tokenBalance
2. /selectChain


#### /discussions On dYdX

Makes several IPFS calls at end of query (aave proposal naming).
