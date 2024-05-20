
# Gating

## Setting up gating for local development

– In the DB, set your user's `isAdmin` column to `true` to become a superuser

– Run latest migrations, it will generate groups from existing topic thresholds

– Run `pnpm refresh-all-memberships` to create membership records across all communities; may take a few minutes

– In the app, navigate to a community, on the sidebar go to `Governance -> Members`

– Now you can see all members and their membership status within the community, and you can manage groups

## Change Log

- 231109: Authored by Ryan Bennett (#5659).
