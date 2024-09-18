import type { SnapshotSpace } from 'helpers/snapshot_utils';
import { createProposal, getSpaceBlockNumber } from 'helpers/snapshot_utils';
import type Account from 'models/Account';
import { getTextFromDelta } from 'views/components/react_quill_editor';

export type ThreadForm = {
  body: string;
  choices: Array<string>;
  end: number;
  metadata: {
    network?: string;
    strategies?: Array<{
      name: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      params: any;
    }>;
  };
  name: string;
  range: string;
  snapshot: number;
  start: number;
  type: string;
};

export enum NewThreadErrors {
  NoBody = 'Proposal body cannot be blank!',
  NoTitle = 'Title cannot be blank!',
  NoChoices = 'Choices cannot be blank!',
  NoStartDate = 'Start Date cannot be blank!',
  NoEndDate = 'End Date cannot be blank!',
}

export const createNewProposal = async (
  form: ThreadForm,
  content: string,
  author: Account,
  space: SnapshotSpace,
) => {
  if (!form.name) {
    throw new Error(NewThreadErrors.NoTitle);
  }

  if (!form.start) {
    throw new Error(NewThreadErrors.NoStartDate);
  }

  if (!form.end) {
    throw new Error(NewThreadErrors.NoEndDate);
  }

  if (!form.choices[0] || !form.choices[1]) {
    throw new Error(NewThreadErrors.NoChoices);
  }

  const bodyText = getTextFromDelta(JSON.parse(content));
  if (bodyText.length === 0) {
    throw new Error(NewThreadErrors.NoBody);
  }

  form.body = bodyText; // use content, which is richtext
  form.snapshot = await getSpaceBlockNumber(space.network);
  form.metadata.network = space.network;
  form.metadata.strategies = space.strategies;

  // Format form for proper validation
  const delay = space.voting.delay ?? 0;
  const period = space.voting.period ?? 432000; // 5 day default
  const timestamp = Math.floor(Date.now() / 1e3);
  form.start = timestamp + delay;
  form.end = form.start + period;

  const proposalPayload = {
    space: space.id,
    type: 'single-choice',
    title: form.name,
    body: form.body,
    choices: form.choices,
    start: form.start,
    end: form.end,
    snapshot: form.snapshot,
    network: '1', // TODO: unclear if this is always 1
    timestamp: timestamp,
    strategies: JSON.stringify({}),
    plugins: JSON.stringify({}),
    metadata: JSON.stringify({}),
  };

  return await createProposal(author.address, proposalPayload, space.id);
};
