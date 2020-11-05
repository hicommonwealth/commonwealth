import 'components/right_sidebar.scss';

import m from 'mithril';
import app from 'state';
import CommunityInfoModule from 'views/components/sidebar/community_info_module';

const RightSidebar: m.Component<{
  rightSidebar,
}> = {
  view: (vnode) => {
    const { rightSidebar } = vnode.attrs;

    return m('.RightSidebar', [
      rightSidebar,
      !rightSidebar
        && (app.chain || app.community)
        && m('div', { style: 'margin: 30px 20px 0;' }, [
          m(CommunityInfoModule)
        ]),
    ]);
  }
};

export default RightSidebar;
