import React, { useEffect } from 'react';
import { PageLoading } from './loading';
import { useCommonNavigate } from 'navigation/helpers';
import { getProposal } from 'helpers/snapshot_utils';

type SnapshotProposalLinkRedirectProps = {
  identifier: string;
  scope: string;
};

export default function SnapshotProposalLinkRedirect({ identifier, scope }: SnapshotProposalLinkRedirectProps) {
  const navigate = useCommonNavigate();

  useEffect(() => {
    const fetchSnapshotData = async () => {
      try {
        // 1. make query to snapshot to get the specific proposal data
        const snapshotProposal = await getProposal(identifier);

        // 2. query data to construct new link
        const { title, space } = snapshotProposal;
        const newLink = {
          source: 'snapshot',
          title,
          identifier: `${space}/${identifier}}`
        };

        // 3. handoff link to server in background (do not care if fails)
        // TODO: app.threads dispatch newLink to replace old

        // 4. redirect
        navigate(`/proposal/${newLink.identifier}`, { replace: true });
      } catch (e) {
        // TODO: show error page
        throw new Error('could not find entity');
      }
    }

    fetchSnapshotData();
  }, [navigate]);

  return <PageLoading />;
}
