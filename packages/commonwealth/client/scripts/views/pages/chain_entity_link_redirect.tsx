import useNecessaryEffect from 'hooks/useNecessaryEffect';
import { chainEntityTypeToProposalSlug } from 'identifiers';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import app from 'state';
import { PageLoading } from './loading';

type ChainEntityLinkRedirectProps = {
  identifier: string;
  scope: string;
};

export default function ChainEntityLinkRedirect({
  identifier,
  scope,
}: ChainEntityLinkRedirectProps) {
  const navigate = useCommonNavigate();

  useNecessaryEffect(() => {
    const fetchChainEntityData = async () => {
      try {
        // 1. make query to chain events to get the specific entity data
        const entity = await app.chainEntities.getOneEntity(scope, identifier);

        // 2. query data to construct new link
        const { title, type, typeId } = entity;
        const newLink = {
          source: 'proposal',
          title,
          identifier:
            type === 'proposal'
              ? `${typeId}`
              : `${chainEntityTypeToProposalSlug(type)}/${typeId}`,
        };

        // 3. redirect
        navigate(`/proposal/${newLink.identifier}`, { replace: true });
      } catch (e) {
        // TODO: show error page
        throw new Error('could not find entity');
      }
    };

    fetchChainEntityData();
  }, [navigate]);

  return <PageLoading />;
}
