export const breadCrumbURLS = [
  {
    url: 'new/discussion',
    breadcrumb: 'Create Thread',
    className: 'new-thread',
  },
  {
    url: 'dashboard',
    breadcrumb: 'Dashboard',
    className: 'dashboard',
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
    breadcrumb: 'Profile',
    className: 'editProfile',
    isParent: false,
  },
  {
    url: 'createCommunity',
    breadcrumb: 'New Commonwealth Community',
    className: 'create-community',
    isParent: true,
  },
  {
    url: 'communities',
    breadcrumb: 'Explore Communities',
    className: 'explore-communities',
    isParent: true,
  },
  {
    url: 'manage',
    breadcrumb: 'Manage Community',
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
    className: 'members',
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
    isGovernance: true,
  },
  {
    url: 'discussions',
    className: 'discussions',
    breadcrumb: 'All Discussions',
    isParent: false,
  },
  {
    url: 'discussion',
    className: 'discussion',
    breadcrumb: 'All Discussions',
    isParent: true,
  },
  {
    url: 'notification-settings',
    className: 'notification-management',
    breadcrumb: 'Notification Management',
  },
  {
    url: '/notifications',
    className: 'notifications',
    breadcrumb: 'Notifications',
  },
  {
    url: 'search',
    className: 'search',
    breadcrumb: 'Search',
  },
];
