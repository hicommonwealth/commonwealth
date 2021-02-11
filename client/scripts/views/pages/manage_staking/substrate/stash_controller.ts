import m from 'mithril';
import app from 'state';
import User from 'views/components/widgets/user';
import { Col, Grid } from 'construct-ui';

interface StashControllerAttrs {
  controllerId: string;
  stashId: string;
}

const StashController: m.Component<StashControllerAttrs, {}> = {
  view: (vnode) => {
    const { controllerId, stashId } = vnode.attrs;

    return m('div.address-info', [
      m(Grid, { gutter: 0, align: 'middle', justify: 'center', class:'cmb-0' }, [
        m(Col, { span: 6 }, m('.center-lg',
          m('p.fmd', 'stash account'),
          m('div.controller.fmd', m(User, {
            user: app.chain.accounts.get(stashId),
            linkify: true })))),
        m(Col, { span: 6 }, m('.center-lg',
          m('p.fmd', 'controller account'),
          m('div.controller.fmd', m(User, {
            user: app.chain.accounts.get(controllerId),
            linkify: true })))),
      ]),
      m('br')
    ]);
  },
};

export default StashController;
