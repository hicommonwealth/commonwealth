/**
 * Centralized data-testid selectors for E2E tests.
 *
 * Convention: all selectors use the format [data-testid="<value>"]
 * Components should add data-testid attributes matching these constants.
 */

export const SELECTORS = {
  // Layout
  layout: {
    root: '[data-testid="layout"]',
    header: '[data-testid="header"]',
    sidebar: '[data-testid="sidebar"]',
    mainContent: '[data-testid="main-content"]',
    mobileNav: '[data-testid="mobile-nav"]',
  },

  // Auth
  auth: {
    signInButton: '[data-testid="sign-in-button"]',
    createAccountButton: '[data-testid="create-account-button"]',
    authModal: '[data-testid="auth-modal"]',
    userMenu: '[data-testid="user-menu"]',
    signOutButton: '[data-testid="sign-out-button"]',
  },

  // Navigation
  nav: {
    communitySelector: '[data-testid="community-selector"]',
    breadcrumbs: '[data-testid="breadcrumbs"]',
    tabNav: '[data-testid="tab-nav"]',
    exploreLink: '[data-testid="explore-link"]',
  },

  // Community
  community: {
    header: '[data-testid="community-header"]',
    memberCount: '[data-testid="member-count"]',
    threadList: '[data-testid="thread-list"]',
    threadCard: '[data-testid="thread-card"]',
    communityCard: '[data-testid="community-card"]',
  },

  // Thread
  thread: {
    title: '[data-testid="thread-title"]',
    body: '[data-testid="thread-body"]',
    commentInput: '[data-testid="comment-input"]',
    commentSubmit: '[data-testid="comment-submit"]',
    voteButton: '[data-testid="vote-button"]',
    reactionBar: '[data-testid="reaction-bar"]',
  },

  // Profile
  profile: {
    header: '[data-testid="profile-header"]',
    addressList: '[data-testid="address-list"]',
    editButton: '[data-testid="profile-edit-button"]',
  },

  // Error
  error: {
    appError: '[data-testid="app-error"]',
    pageNotFound: '[data-testid="page-not-found"]',
  },
} as const;

/**
 * Helper to get a data-testid selector string.
 */
export function testId(id: string): string {
  return `[data-testid="${id}"]`;
}
