# Make breadcrumbs selectable in community

## Summary
Breadcrumbs inside a community show a tooltip indicating the page is not selectable. Users cannot navigate back to the community root from these items.

## Work
- Update `Breadcrumbs` component so parent crumbs redirect to the community's root page.
- Remove "not selectable" tooltip when within a community.

## Testing
- Verified updated breadcrumbs render without tooltip in community context and redirect to community root.
