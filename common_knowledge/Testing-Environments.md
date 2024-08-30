# Testing Environments

Currently we have 2 open testing environments in Heroku for testing any third party integrations requiring a direct connection, called "Frick" and "Frack" and located at `https://commonwealth-frick.herokuapp.com` and `https://commonwealth-frack.herokuapp.com`. Frack has mainly been used for testing CDN caching (which can't be tested locally) and any sus migrations (that need to be tested without merging into master.)

We also have a QA ("beta") environment which is automatically updated whenever feature branches are merged to master, which is located at `https://commonwealth-beta.herokuapp.com.` It does not have a way of testing migrations without merging them to master, as it is not running on a QA branch.

The dyno that QA is sunning on also has a 2nd postgres database ("RED") that is configured to be a fast-follower of the production database. This is the only database that should be used for taking data dumps, as it does not support any other load and moreover is guaranteed to match production within a few seconds.

To deploy to one of the testing environments (ie not QA) you just need to push to either the frick or frack branches, which will automatically deploy to the respective environment. The #eng-infra Slack channel is used to communicate which servers are free for testing, and which branches or PRs each sever is presently pegged to. Server reservations must be listed in the channel topic, with the name of the server, and the name of the branch or PR which the server currently hosts. When you are done with a server, you must update the channel topic again listing the server as free. You may also include, parenthetically, the date you’re planning to reserve a server until, as well as the branch or PR which previously occupied a free slot. Do not overwrite a reserved server without explicit permission from the engineer using it.

We also have added script to package.json to sync the database from RED (fast-follower) to Frick or Frack.
