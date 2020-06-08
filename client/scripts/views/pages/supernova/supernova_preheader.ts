import 'pages/supernova/supernova_preheader.scss';

import m from 'mithril';

const SupernovaPreheader = {
  view: (vnode) => {
    return m('.SupernovaPreheader', [
      m('.preview-explanation', 'This is a preview of the Supernova lockdrop, for testing only. ')
    ]);
  }
};

export default SupernovaPreheader;
