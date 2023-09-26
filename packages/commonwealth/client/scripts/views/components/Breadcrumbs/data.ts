export const breadCrumbURLS = [
  {
    url: 'dashboard',
    breadcrumb: 'Dashboard',
  },
  {
    url: 'notification-settings',
    breadcrumb: 'Notification Management',
    className: 'notification-settings',
  },
  {
    url: 'profile/id',
    breadcrumb: 'Profile',
  },
  {
    url: 'profile/edit',
    breadcrumb: 'Edit',
    className: 'editProfile',
  },
  {
    url: 'createCommunity',
    breadcrumb: 'New Commonwealth Community',
    className: 'createCommunity',
    isParent: true,
  },
  {
    url: 'manage',
    breadcrumb: 'Manage',
    isAdmin: true,
    className: 'admin',
  },
  {
    url: 'analytics',
    breadcrumb: 'Analytics',
    isAdmin: true,
    className: 'analytics',
  },
  {
    url: 'overview',
    breadcrumb: 'Overview',
  },
  {
    url: 'dicussions/General',
    breadcrumb: 'Discussions/General',
  },
  {
    url: 'dicussions/Decentralise',
    breadcrumb: 'Discussions/Decentralise',
  },
  {
    url: 'members',
    breadcrumb: 'Members',
    isGovernance: true,
  },
  {
    url: 'proposals',
    breadcrumb: 'Proposals',
    isGovernance: true,
  },
  {
    url: 'proposal/:id',
    breadcrumb: 'Proposal/:id',
  },
  {
    url: 'snapshot',
    breadcrumb: 'Snapshots',
  },
];
