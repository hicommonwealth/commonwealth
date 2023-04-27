import React, { useEffect } from 'react';
import app from 'state';
import { PageLoading } from './loading';
import { useCommonNavigate } from 'navigation/helpers';

type ChainEntityLinkRedirectProps = {
  identifier: string;
  scope: string;
};

export default function ChainEntityLinkRedirect({ identifier, scope }: ChainEntityLinkRedirectProps) {
  const navigate = useCommonNavigate();

  useEffect(() => {
    const fetchChainEntityData = async () => {
      try {
        // 1. make query to chain events to get the specific entity data
        const entity = await app.chainEntities.getOneEntity(scope, identifier);

        // 2. query data to construct new link
        const { title, type, typeId } = entity;
        const newLink = {
          source: 'proposal',
          title,
          identifier: type === 'proposal' ? `${typeId}` : `${type}/${typeId}}`
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

    fetchChainEntityData();
  }, [navigate]);

  return <PageLoading />;
}
