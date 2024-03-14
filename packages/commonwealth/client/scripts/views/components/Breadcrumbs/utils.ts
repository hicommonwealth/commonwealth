import { To } from 'react-router-dom';
import { breadCrumbURLS } from './data';

type currentDiscussion = {
  currentThreadName: string;
  currentTopic: string;
  topicURL: string;
};

const segmentMapping = {
  proposals: 'Proposals',
  proposal: 'Proposal',
  members: 'Members',
  snapshot: 'Snapshots',
};

export const truncateText = (str: string) => {
  // Get the available width of the container or the window
  const availableWidth = window.innerWidth;

  // Define the maximum allowed width
  const maxWidth = 0.4 * availableWidth;

  if (str.length > 50 || availableWidth < maxWidth) {
    const ellipsisWidth = '...'.length * 4;
    const truncatedLength = Math.floor((maxWidth - ellipsisWidth) / 8);
    return str.substring(0, truncatedLength) + '...';
  }
  return str;
};

const findMatchedBreadcrumb = (index: number, pathSegments: Array<string>) => {
  const breadcrumbData = breadCrumbURLS;

  return breadcrumbData.find((breadcrumbItem) => {
    return (
      !breadcrumbItem.url ||
      index >= pathSegments.length ||
      breadcrumbItem.url ===
        pathSegments.slice(index, breadcrumbData.length - 1).join('/')
    );
  });
};

export const generateBreadcrumbs = (
  locationPath: string,
  profileId: number,
  navigate: (val: To) => void,
  currentDiscussion?: currentDiscussion,
) => {
  let link: string;
  let label: string;
  let isParent: boolean;
  const pathSegments = locationPath
    .split('/')
    .filter((segment) => segment.length > 0);

  const governanceSegment = segmentMapping[pathSegments[1]];

  const breadcrumbs = pathSegments.map((pathSegment, index) => {
    //Checks to see if it's an easy page so we match with the data file & early return out.
    const matchedBreadcrumb = findMatchedBreadcrumb(index, pathSegments);

    // Generate the link based on the current path segment.
    switch (pathSegment) {
      case 'profile':
        link = `profile/id/${profileId}`;
        break;
      case 'members':
        if (
          pathSegments[index] === 'members' &&
          pathSegments[index + 1] === 'update'
        ) {
          link = 'members';
        }
        break;
      case 'snapshot':
        //Match the header on the snapshots page
        pathSegments.splice(index + 1, 1);
        pathSegments[index] = 'snapshots';
        break;
      case 'proposal':
        link = 'proposals';
        break;
      case 'new':
        // Remove 'new' segment and generate the link.
        if (pathSegments[index + 1] === 'discussion') {
          link = `new/discussion`;
          pathSegments.splice(index, 1);
        } else {
          link = `new/snapshot`;
          pathSegments.splice(-2);
          pathSegments[index] = 'New Snapshot Proposal';
        }
        break;
      default:
        if (pathSegments[index] === 'discussions') {
          // Generate the link for 'discussion' segment.
          link = `discussions`;
          pathSegments[index] = 'Discussions';
        } else {
          // Generate a default link for other segments.
          link = pathSegments.slice(0, index + 1).join('/');
        }
    }

    const splitLinks = link.split('/').filter((val) => val.length > 0);

    // Removed IDs from the breadcrumb
    const removedThreadId = decodeURIComponent(pathSegments[index]).replace(
      /^\d+-/,
      '',
    );

    //First pass of generating the label
    label =
      index === pathSegments.length - 1 && !!currentDiscussion.currentThreadName
        ? currentDiscussion.currentThreadName
        : matchedBreadcrumb
        ? matchedBreadcrumb.breadcrumb
        : removedThreadId;

    if (pathSegments[0] === 'profile' && index === 1) {
      label = 'Edit Profile';
    }

    if (pathSegments[1] === 'search' && index === 0) {
      pathSegments.splice(0, 1);
      label = 'Search';
    }

    if (locationPath.includes('new/discussion') && label !== 'Create Thread') {
      label = 'Discussions';
    }

    // Handles the unique logic of the discussions section
    if (
      !locationPath.includes('new/discussion') &&
      (pathSegments[1] === 'discussions' || pathSegments[1] === 'discussion')
    ) {
      label = 'Discussions';

      if (pathSegments.length > 2) {
        pathSegments.splice(0, 1);
        // after splice set discussion to parent for tooltip
        isParent = ['discussions', 'discussion'].includes(pathSegments[index]);
      }
    } else if (
      ['overview', 'archived'].includes(pathSegments[1]) &&
      label.toLowerCase() !== pathSegments[1]
    ) {
      label = 'Discussions';
    } else {
      // Reset derived state: isParent
      isParent = false;
    }

    //Handles the governance sections
    if (
      governanceSegment &&
      label.toLowerCase() !== governanceSegment.toLowerCase()
    ) {
      label = 'Governance';
      if (pathSegments.length === 3 && index === 2) {
        label = removedThreadId;
      }
      if (pathSegments.length > 3) {
        pathSegments.splice(2, 2);
      }
    }

    if (
      pathSegments[pathSegments.length - 1] === 'contract' ||
      (['manage', 'analytics', 'contracts'].includes(pathSegments[1]) &&
        index === 0)
    ) {
      label = 'Admin Capabilities';
      isParent = true;

      if (pathSegments.length > 1 && pathSegments[1] === 'manage') {
        pathSegments.splice(0, 1);
      }
    }

    // Create the breadcrumb object.
    return {
      label,
      path: link ? `/${link}` : locationPath,
      navigate: (val: To) => navigate(val),
      isParent:
        isParent ||
        matchedBreadcrumb?.isParent ||
        pathSegments[0] === splitLinks[index],
    };
  });

  currentDiscussion.currentTopic &&
    breadcrumbs.splice(1, 0, {
      label: currentDiscussion.currentTopic,
      path: currentDiscussion.topicURL,
      navigate: (val: To) => navigate(val),
      isParent: false,
    });

  return breadcrumbs.filter((val) => val !== undefined);
};
