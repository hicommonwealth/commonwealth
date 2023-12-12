import { To } from 'react-router-dom';
import { breadCrumbURLS } from './data';

export const generateBreadcrumbs = (
  locationPath: string,
  breadcrumbData: typeof breadCrumbURLS,
  profileId: number,
  navigate: (val: To) => void,
) => {
  let threadName: string | undefined;
  let link: string;
  const pathSegments = locationPath
    .split('/')
    .filter((segment) => segment.length > 0);

  const breadcrumbs = pathSegments.map((pathSegment, index) => {
    const matchedBreadcrumb = breadcrumbData.find((breadcrumbItem) => {
      breadcrumbItem.breadcrumb = breadcrumbItem.breadcrumb?.replace(
        ':community',
        pathSegments[0],
      );
      // matchedBreadcrumb?.breadcrumb?.includes(':community') &&
      // matchedBreadcrumb.breadcrumb.replace(':community', pathSegments[0]);
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
        if (
          pathSegments[index] === 'discussion' ||
          pathSegments[index] === 'discussions'
        ) {
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

    const label =
      index === pathSegments.length - 1 && !!threadName
        ? threadName
        : matchedBreadcrumb
        ? matchedBreadcrumb.breadcrumb
        : removedThreadId;

    // Create the breadcrumb object.
    return {
      label,
      path: link ? `/${link}` : locationPath,
      navigate: (val: To) => navigate(val),
      isParent:
        matchedBreadcrumb?.isParent || pathSegments[0] === splitLinks[index],
    };
  });

  // const discussionsIndex = pathSegments.indexOf('discussions');
  // if (discussionsIndex !== -1) {
  //   breadcrumbs.sort((a, b) => {
  //     if (
  //       a.label.toLowerCase() === 'discussions' ||
  //       a.label.toLowerCase() === 'discussion'
  //     ) {
  //       return -1;
  //     } else if (
  //       b.label.toLowerCase() === 'discussions' ||
  //       b.label.toLowerCase() === 'discussion'
  //     ) {
  //       return 1;
  //     }
  //     return 0;
  //   });
  //
  //   console.log('bread', breadcrumbs);
  // }

  return breadcrumbs.filter((val) => val !== undefined);
};
