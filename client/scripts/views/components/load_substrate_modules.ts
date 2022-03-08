import m from 'mithril';
import app from 'state';
import { ChainBase } from 'types';
import { ProposalModule } from 'models';
import { Tag } from 'construct-ui';
import PageLoading from 'views/pages/loading';
import ErrorPage from 'views/pages/error';

const loadSubstrateModules = (
  name: string,
  getModules: () => ProposalModule<any, any, any>[]
): m.Vnode | undefined => {
  const onSubstrate = app.chain?.base === ChainBase.Substrate;
  if (onSubstrate) {
    const modules = getModules();
    if (modules.some((mod) => !mod.ready)) {
      if (modules.some((mod) => mod.error)) {
        const errors = modules.map((mod) => mod.error).filter((e) => !!e);
        return m(ErrorPage, {
          message: `Failed to initialize chain modules: ${errors.join(', ')}.`,
          title: [
            name,
            m(Tag, {
              size: 'xs',
              label: 'Beta',
              style: 'position: relative; top: -2px; margin-left: 6px',
            }),
          ],
        });
      }
      app.chain.loadModules(modules);
      return m(PageLoading, {
        message: `Loading ${name.toLowerCase()}`,
        title: [
          name,
          m(Tag, {
            size: 'xs',
            label: 'Beta',
            style: 'position: relative; top: -2px; margin-left: 6px',
          }),
        ],
        showNewProposalButton: true,
      });
    }
  }
};

export default loadSubstrateModules;
