import { isHex, isU8a } from '@polkadot/util';
import {
  checkAddress,
  decodeAddress,
  encodeAddress,
} from '@polkadot/util-crypto';
import { ProposalType } from 'common-common/src/types';
import {
  AccessLevel,
  everyonePermissions,
  PermissionManager,
} from './permissions';
import type { RoleObject } from './types';

export const getNextPollEndingTime = (now) => {
  // Offchain polls should be open until 1st or 15th of the month,
  // and should always be open for at least 5 days.
  //
  // TODO: Allow the user to customize their poll ending time from
  // the frontend. (This requires adding a datepicker component)

  const t1 = now.clone().utc().startOf('month').add(15, 'days');
  const t2 = now.clone().utc().endOf('month').add(1, 'days');
  const t3 = now.clone().utc().endOf('month').add(15, 'days');

  const earliestPossible = now.clone().utc().add(5, 'days');
  if (t1.isAfter(earliestPossible)) return t1;
  if (t2.isAfter(earliestPossible)) return t2;
  return t3;
};

export const getNextPollEndingTimeIsDangerouslyClose = (now, endingTime) => {
  now.utc().add(5, 'days');
  endingTime.utc();
};

export const slugify = (str: string): string => {
  // Remove any character that isn't a alphanumeric character or a
  // space, and then replace any sequence of spaces with dashes.
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};

export const slugifyPreserveDashes = (str: string): string => {
  // Remove any character that isn't a alphanumeric character, a
  // space, or a dash, and then replace any sequence of spaces with a single dash.

  // return str
  //   .toLowerCase()
  //   .trim()
  //   .replace(/[^A-Za-z0-9]+/g, '-');

  return str
    .replace(/[^A-Za-z0-9 -]/g, '')
    .replace(/(\s|-)+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
};

export const requiresTypeSlug = (type: ProposalType): boolean => {
  return (
    type === ProposalType.SubstrateDemocracyReferendum ||
    type === ProposalType.SubstrateDemocracyProposal ||
    type === ProposalType.SubstrateTreasuryTip ||
    type === ProposalType.SubstrateTechnicalCommitteeMotion ||
    type === ProposalType.SubstrateTreasuryProposal
  );
};

/* eslint-disable */
export const getThreadUrl = (proposal, comment?) => {
  const aId = proposal.chain;
  const tId = proposal.type_id || proposal.id;
  const tTitle = proposal.title ? `-${slugify(proposal.title)}` : '';
  const cId = comment ? `?comment=${comment.id}` : '';

  return process.env.NODE_ENV === 'production'
    ? `https://commonwealth.im/${aId}/discussion/${tId}${tTitle.toLowerCase()}${cId}`
    : `http://localhost:8080/${aId}/discussion/${tId}${tTitle.toLowerCase()}${cId}`;
};

export const getThreadUrlWithoutObject = (
  proposalCommunity,
  proposalId,
  comment?
) => {
  const aId = proposalCommunity;
  const tId = proposalId;
  const cId = comment ? `?comment=${comment.id}` : '';

  return process.env.NODE_ENV === 'production'
    ? `https://commonwealth.im/${aId}/discussion/${tId}${cId}`
    : `http://localhost:8080/${aId}/discussion/${tId}${cId}`;
};

export const getCommunityUrl = (community) => {
  return process.env.NODE_ENV === 'production'
    ? `https://commonwealth.im/${community}`
    : `http://localhost:8080/${community}`;
};

export const smartTrim = (text, maxLength = 200) => {
  if (text.length > maxLength) {
    const smartTrimmedText = text.slice(0, maxLength).replace(/\W+$/, '');
    if (smartTrimmedText.length === 0) return `${text.slice(0, maxLength)}...`;
    return `${smartTrimmedText}...`;
  } else {
    return text;
  }
};

export const validURL = (str) => {
  const pattern = new RegExp(
    '^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+:@]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$',
    'i'
  ); // fragment locator
  return !!pattern.test(str);
};

export const urlHasValidHTTPPrefix = (url: string) => {
  return url.indexOf('http://') === 0 || url.indexOf('https://') === 0;
};

export const preprocessQuillDeltaForRendering = (nodes) => {
  // split up nodes at line boundaries
  const lines = [];
  for (const node of nodes) {
    if (typeof node.insert === 'string') {
      const matches = node.insert.match(/[^\n]+\n?|\n/g);
      (matches || []).forEach((line) => {
        lines.push({ attributes: node.attributes, insert: line });
      });
    } else {
      lines.push(node);
    }
  }
  // group nodes under parents
  const result = [];
  let parent = { children: [], attributes: undefined };
  for (const node of lines) {
    if (typeof node.insert === 'string' && node.insert.endsWith('\n')) {
      parent.attributes = node.attributes;
      // concatenate code-block node parents together, keeping newlines
      if (
        result.length > 0 &&
        result[result.length - 1].attributes &&
        parent.attributes &&
        parent.attributes['code-block'] &&
        result[result.length - 1].attributes['code-block']
      ) {
        parent.children.push({ insert: node.insert });
        result[result.length - 1].children = result[
          result.length - 1
        ].children.concat(parent.children);
      } else {
        parent.children.push({ insert: node.insert });
        result.push(parent);
      }
      parent = { children: [], attributes: undefined };
    } else {
      parent.children.push(node);
    }
  }
  // If there was no \n at the end of the document, we need to push whatever remains in `parent`
  // onto the result. This may happen if we are rendering a truncated Quill document
  if (parent.children.length > 0) {
    result.push(parent);
  }

  // trim empty newlines at end of document
  while (
    result.length &&
    result[result.length - 1].children.length === 1 &&
    typeof result[result.length - 1].children[0].insert === 'string' &&
    result[result.length - 1].children[0].insert === '\n' &&
    result[result.length - 1].children[0].attributes === undefined
  ) {
    result.pop();
  }

  return result;
};

export const renderQuillDeltaToText = (delta, paragraphSeparator = '\n\n') => {
  return preprocessQuillDeltaForRendering(delta.ops)
    .map((parent) => {
      return parent.children
        .map((child) => {
          if (typeof child.insert === 'string')
            return child.insert.trimRight('\n');
          if (child.insert?.image) return '(image)';
          if (child.insert?.twitter) return '(tweet)';
          if (child.insert?.video) return '(video)';
          return '';
        })
        .filter((child) => !!child)
        .join(' ')
        .replace(/  +/g, ' '); // remove multiple spaces
    })
    .filter((parent) => !!parent)
    .join(paragraphSeparator);
};

export function formatAddressShort(
  address: string,
  chain?: string,
  includeEllipsis?: boolean,
  maxCharLength?: number
) {
  if (!address) return;
  if (chain === 'near') {
    return `@${address}`;
  } else if (
    chain === 'straightedge' ||
    chain === 'cosmoshub' ||
    chain === 'osmosis' ||
    chain === 'injective' ||
    chain === 'injective-testnet' ||
    chain === 'osmosis-local'
  ) {
    return `${address.slice(0, 9)}${includeEllipsis ? '…' : ''}`;
  } else {
    return `${address.slice(0, maxCharLength || 5)}${
      includeEllipsis ? '…' : ''
    }`;
  }
}

export const addressSwapper = (options: {
  address: string;
  currentPrefix: number;
}): string => {
  if (!options.address) throw new Error('No address provided to swap');

  if (!options.currentPrefix) return options.address;

  if (isU8a(options.address) || isHex(options.address)) {
    throw new Error('address not in SS58 format');
  }

  // check if it is valid as an address
  let decodedAddress: Uint8Array;

  try {
    decodedAddress = decodeAddress(options.address);
  } catch (e) {
    throw new Error('failed to decode address');
  }

  // check if it is valid with the current prefix & reencode if needed
  const [valid, errorMsg] = checkAddress(
    options.address,
    options.currentPrefix
  );

  if (!valid) {
    try {
      return encodeAddress(decodedAddress, options.currentPrefix);
    } catch (e) {
      throw new Error('failed to reencode address');
    }
  } else {
    return options.address;
  }
};

export function aggregatePermissions(
  roles: RoleObject[],
  chain_permissions: { allow: bigint; deny: bigint }
) {
  const permissionsManager = new PermissionManager();

  const ORDER: AccessLevel[] = [
    AccessLevel.Member,
    AccessLevel.Moderator,
    AccessLevel.Admin,
  ];

  function compare(o1: RoleObject, o2: RoleObject) {
    return ORDER.indexOf(o1.permission) - ORDER.indexOf(o2.permission);
  }

  roles = roles.sort(compare);

  const permissionsAllowDeny: Array<{
    allow: bigint;
    deny: bigint;
  }> = roles.map(({ allow, deny }) => ({ allow, deny }));

  // add chain default permissions to beginning of permissions array
  permissionsAllowDeny.unshift(chain_permissions);

  // compute permissions
  const permission: bigint = permissionsManager.computePermissions(
    everyonePermissions,
    permissionsAllowDeny
  );
  return permission;
}
