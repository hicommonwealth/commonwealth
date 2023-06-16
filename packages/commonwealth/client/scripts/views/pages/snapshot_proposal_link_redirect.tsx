import { getProposal } from 'helpers/snapshot_utils';
import useNecessaryEffect from 'hooks/useNecessaryEffect';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { PageLoading } from './loading';

type SnapshotProposalLinkRedirectProps = {
  identifier: string;
  scope: string;
};

export default function SnapshotProposalLinkRedirect({
  identifier,
}: SnapshotProposalLinkRedirectProps) {
  const navigate = useCommonNavigate();

  useNecessaryEffect(() => {
    const fetchSnapshotData = async () => {
      try {
        // 1. make query to snapshot to get the specific proposal data
        const snapshotProposal = await getProposal(identifier);

        // 2. query data to construct new link
        const { title, space } = snapshotProposal;
        const newLink = {
          source: 'snapshot',
          title,
          identifier: `${space}/${identifier}}`,
        };

        // 3. redirect
        navigate(`/proposal/${newLink.identifier}`, { replace: true });
      } catch (e) {
        // TODO: show error page
        throw new Error('could not find entity');
      }
    };

    fetchSnapshotData();
  }, [navigate]);

  return <PageLoading />;
}
