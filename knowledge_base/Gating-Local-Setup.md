
 # How to setup Gating for local development

– First, add the following to the `.env` file:
 ```sh
GATING_API_ENABLED=true
FEATURE_FLAG_GROUP_CHECK_ENABLED=true
 ```
 You can disable `FEATURE_FLAG_GROUP_CHECK_ENABLED` to bypass gating on actions such as create thread/comment/reaction

– In the DB, set your user's `isAdmin` column to `true` to become a superuser

– Run latest migrations, it will generate groups from existing topic thresholds

– Run `yarn refresh-all-memberships` to create membership records across all communities; may take a few minutes

– In the app, navigate to a community, on the sidebar go to `Governance -> Members`

– Now you can see all members and their membership status within the community, and you can manage groups
