import 'pages/_object_page.scss';

import { default as m } from 'mithril';

interface IAttrs {
  class: string;
  content: m.Vnode | m.Vnode[];
  sidebar?: any;
  compact?: boolean;
}

const ObjectPage: m.Component<IAttrs> = {
  view: (vnode) => {
    return m('.ObjectPage', { class: vnode.attrs.class }, [
      m('.page-container', [
        m('.container', [
          vnode.attrs.compact ? [
            m('.row', [
              m('.col-sm-10.col-sm-offset-1', vnode.attrs.content),
            ]),
          ] :
          vnode.attrs.sidebar ? [
            m('.row', [
              m('.col-sm-8', vnode.attrs.content),
              m('.col-sm-4', vnode.attrs.sidebar),
            ])
          ] :
          vnode.attrs.content
        ]),
      ]),
    ]);
  }
};

export default ObjectPage;
