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
    url: 'new/proposal',
    breadcrumb: 'New Proposal',
    className: 'new-proposal',
  },
  {
    url: 'profile/edit',
    breadcrumb: 'Edit',
    className: 'editProfile',
  },
  {
    url: 'createCommunity',
    breadcrumb: 'New Commonwealth Community',
    className: 'create-community',
    isParent: true,
  },
  {
    url: '/communities',
    breadcrumb: 'Explore Communities',
    className: 'explore-communities',
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
    url: 'members',
    breadcrumb: 'Members',
    isGovernance: true,
    className: 'governance',
  },
  {
    url: 'proposals',
    breadcrumb: 'Proposals',
    isGovernance: true,
    className: 'governance',
  },
  {
    url: 'proposal/:id',
    breadcrumb: 'Proposal/:id',
  },
  {
    url: 'snapshot',
    breadcrumb: 'Snapshots',
    className: 'governance',
  },
  {
    url: 'discussions',
    className: 'discussions',
  },
  {
    url: 'new/discussion',
    className: 'new-thread',
  },
  {
    url: 'notification-settings',
    className: 'notification-management',
  },
  {
    url: 'notifications',
    className: 'notifications',
  },
  {
    url: 'search',
    className: 'search',
  },
];
