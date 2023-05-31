import React, { useEffect } from 'react';
import app from 'state';
import { PageLoading } from './loading';
import { useCommonNavigate } from 'navigation/helpers';
import { chainEntityTypeToProposalSlug } from 'identifiers';

type ChainEntityLinkRedirectProps = {
  identifier: string;
  scope: string;
};

export default function ChainEntityLinkRedirect({
  identifier,
  scope,
}: ChainEntityLinkRedirectProps) {
  const navigate = useCommonNavigate();

  useEffect(() => {
    const fetchChainEntityData = async () => {
      try {
        // 1. make query to chain events to get the specific entity data
        const entity = await app.chainEntities.getOneEntity(scope, identifier);

        // 2. query data to construct new link
        const { type, typeId } = entity;
        const newLink = {
          source: 'proposal',
          identifier: type === 'proposal' ? `${typeId}` : `${chainEntityTypeToProposalSlug(type)}/${typeId}`
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
