import { To } from 'react-router-dom';
import { breadCrumbURLS } from './data';

type currentDiscussion = {
  currentThreadName: string;
  currentTopic: string;
  topicURL: string;
};

export const generateBreadcrumbs = (
  locationPath: string,
  breadcrumbData: typeof breadCrumbURLS,
  profileId: number,
  navigate: (val: To) => void,
  currentDiscussion?: currentDiscussion,
) => {
  let link: string;
  const pathSegments = locationPath
    .split('/')
    .filter((segment) => segment.length > 0);

  console.log('TOPIC:', currentDiscussion);

  const breadcrumbs = pathSegments.map((pathSegment, index) => {
    //Checks to see if it's an easy page so we match with the data file & early return out.
    const matchedBreadcrumb = breadcrumbData.find((breadcrumbItem) => {
      return (
        !breadcrumbItem.url ||
        index >= pathSegments.length ||
        breadcrumbItem.url ===
          pathSegments.slice(index, breadcrumbData.length - 1).join('/')
      );
    });

    // Generate the link based on the current path segment.
    switch (pathSegment) {
      case 'profile':
        // Remove 'profile' segment and generate the link.
        pathSegments.splice(index + 1, 2);
        link = `id/${profileId}`;
        break;
      case 'snapshot':
        //Match the header on the snapshots page
        pathSegments.splice(index + 1, 1);
        pathSegments[index] = 'snapshots';
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

    const removedThreadId = decodeURIComponent(pathSegments[index]).replace(
      /^\d+-/,
      '',
    );

    let label =
      index === pathSegments.length - 1 && !!currentDiscussion.currentThreadName
        ? currentDiscussion.currentThreadName
        : matchedBreadcrumb
        ? matchedBreadcrumb.breadcrumb
        : removedThreadId;

    //Handles the unique logic of the discussions section
    if (pathSegments[1] === 'discussions' || pathSegments[1] === 'discussion') {
      label = 'Discussions';

      if (pathSegments.length > 2) {
        pathSegments.splice(0, 1);
      }
    } else if (pathSegments[1] === 'overview' && label !== 'Overview') {
      label = 'Discussions';
    }

    // Create the breadcrumb object.
    return {
      label,
      path: link ? `/${link}` : locationPath,
      navigate: (val: To) => navigate(val),
      isParent:
        matchedBreadcrumb?.isParent || pathSegments[0] === splitLinks[index],
    };
  });

  currentDiscussion.currentTopic &&
    breadcrumbs.splice(1, 0, {
      label: currentDiscussion.currentTopic,
      path: currentDiscussion.topicURL,
      navigate: (val: To) => navigate(val),
      isParent: false,
    });

  console.log('bread', breadcrumbs);
  return breadcrumbs.filter((val) => val !== undefined);
};
