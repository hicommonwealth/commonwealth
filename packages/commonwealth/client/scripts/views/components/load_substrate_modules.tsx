import React from 'react';

import { ChainBase } from 'common-common/src/types';
import type { ProposalModule } from 'models';

import app from 'state';
import ErrorPage from 'views/pages/error';
import { PageLoading } from 'views/pages/loading';
import { BreadcrumbsTitleTag } from './breadcrumbs_title_tag';

export const loadSubstrateModules = (
  name: string,
  getModules: () => ProposalModule<any, any, any>[]
): React.ReactNode | undefined => {
  const onSubstrate = app.chain?.base === ChainBase.Substrate;

  if (onSubstrate) {
    const modules = getModules();

    if (modules.some((mod) => !mod.ready)) {
      if (modules.some((mod) => mod.error)) {
        const errors = modules.map((mod) => mod.error).filter((e) => !!e);

        return (
          <ErrorPage
            message={`Failed to initialize chain modules: ${errors.join(
              ', '
            )}.`}
            title={<BreadcrumbsTitleTag title={name} />}
          />
        );
      }

      app.chain.loadModules(modules);

      return <PageLoading message={`Loading ${name.toLowerCase()}`} />;
    }
  }
};
