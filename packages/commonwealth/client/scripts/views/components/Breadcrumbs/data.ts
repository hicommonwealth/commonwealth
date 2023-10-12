export const breadCrumbURLS = [
  {
    url: 'dashboard',
    breadcrumb: 'Dashboard',
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
    url: 'new/discussion',
    breadcrumb: 'New Thread',
    className: 'new-thread',
  },
  {
    url: 'profile/edit',
    breadcrumb: 'Edit Profile',
    className: 'editProfile',
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
    breadcrumb: 'Discussions',
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
