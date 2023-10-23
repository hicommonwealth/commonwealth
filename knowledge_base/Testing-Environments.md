Currently we have 2 open testing environments in Heroku for testing any third party integrations requiring a direct connection, called "Frick" and "Frack" and located at https//commonwealth-frick.herokuapp.com and https//commonwealth-frack.herokuapp.com. Frick has access to chain events, which Frack does not. Frack has mainly been used for testing CDN caching (which can't be tested locally) and any sus migrations (that need to be tested without merging into master.) 

We also have a QA environment which is automatically updated whenever feature branches are merged to master, which is located at https://commonwealth-beta.herokuapp.com. However, this QA environment does not currently have access to the chain events service (and also as noted, doesn't have a way of testing migrations without merging them to master, as it is not running on a QA branch.) 

The dyno that QA is sunning on also has a 2nd postgres database ("RED") that is configured to be a fast-follower of the production database. This is the only database that should be used for taking data dumps, as it does not support any other load and moreover is guaranteed to match production within a few seconds. 

To deploy to one of the testing environments (ie not QA) you just need to push to either the frick or frack branches, which will automatically deploy to the respective environment. 

We also have added script to package.json to sync the database from RED (fast-follower) to Frick or Frack. 
