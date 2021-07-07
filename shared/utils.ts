export const getNextOffchainPollEndingTime = (now) => {
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

export const getNextOffchainPollEndingTimeIsDangerouslyClose = (now, endingTime) => {
  now.utc().add(5, 'days');
  endingTime.utc();
};

export const slugify = (str: string): string => {
  // Remove any character that isn't a alphanumeric character or a
  // space, and then replace any sequence of spaces with dashes.
  return str.toLowerCase().trim().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
};

/* eslint-disable import/prefer-default-export */
export const getProposalUrl = (type, proposal, comment?) => {
  const aId = (proposal.community) ? proposal.community : proposal.chain;
  const tId = proposal.type_id || proposal.id;
  const tTitle = proposal.title ? `-${slugify(proposal.title)}` : '';
  const cId = comment ? `?comment=${comment.id}` : '';

  return (process.env.NODE_ENV === 'production')
    ? `https://commonwealth.im/${aId}/proposal/${type}/${tId}${tTitle.toLowerCase()}${cId}`
    : `http://localhost:8080/${aId}/proposal/${type}/${tId}${tTitle.toLowerCase()}${cId}`;
};

export const getProposalUrlWithoutObject = (type, proposalCommunity, proposalId, comment?) => {
  const aId = proposalCommunity;
  const tId = proposalId;
  const cId = comment ? `?comment=${comment.id}` : '';

  return (process.env.NODE_ENV === 'production')
    ? `https://commonwealth.im/${aId}/proposal/${type}/${tId}${cId}`
    : `http://localhost:8080/${aId}/proposal/${type}/${tId}${cId}`;
};

export const getCommunityUrl = (community) => {
  return (process.env.NODE_ENV === 'production')
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
  const pattern = new RegExp('^(https?:\\/\\/)?' // protocol
    + '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' // domain name
    + '((\\d{1,3}\\.){3}\\d{1,3}))' // OR ip (v4) address
    + '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' // port and path
    + '(\\?[;&a-z\\d%_.~+=-]*)?' // query string
    + '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
  return !!pattern.test(str);
};

export const urlHasValidHTTPPrefix = (url: string) => {
  return (url.indexOf('http://') === 0 || url.indexOf('https://') === 0);
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
      if (result.length > 0 && result[result.length - 1].attributes && parent.attributes
                 && parent.attributes['code-block'] && result[result.length - 1].attributes['code-block']) {
        parent.children.push({ insert: node.insert });
        result[result.length - 1].children = result[result.length - 1].children.concat(parent.children);
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
  while (result.length
         && result[result.length - 1].children.length === 1
         && typeof result[result.length - 1].children[0].insert === 'string'
         && result[result.length - 1].children[0].insert === '\n'
         && result[result.length - 1].children[0].attributes === undefined) {
    result.pop();
  }

  return result;
};

export const renderQuillDeltaToText = (delta, paragraphSeparator = '\n\n') => {
  return preprocessQuillDeltaForRendering(delta.ops).map((parent) => {
    return parent.children.map((child) => {
      if (typeof child.insert === 'string') return child.insert.trimRight('\n');
      if (child.insert?.image) return '(image)';
      if (child.insert?.twitter) return '(tweet)';
      if (child.insert?.video) return '(video)';
      return '';
    }).filter((child) => !!child).join(' ').replace(/  +/g, ' '); // remove multiple spaces
  }).filter((parent) => !!parent).join(paragraphSeparator);
};

export function formatAddressShort(address: string, chain?: string, includeEllipsis?: boolean) {
  if (!address) return;
  if (chain === 'near') {
    return `@${address}`;
  } else if (chain === 'straightedge' || chain === 'cosmos' || chain === 'osmosis') {
    return `${address.slice(0, 9)}${includeEllipsis ? '…' : ''}`;
  } else {
    return `${address.slice(0, 4)}${includeEllipsis ? '…' : ''}`;
  }
}
