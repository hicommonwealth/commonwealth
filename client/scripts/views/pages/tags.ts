/* eslint-disable no-unused-expressions */
import 'pages/tags.scss';

import _ from 'lodash';
import m from 'mithril';
import $ from 'jquery';
import { Card } from 'construct-ui';

import app from 'state';
import Sublayout from 'views/sublayout';
import { isCommunityAdmin } from 'views/pages/discussions/roles';
import TagSelector, { NewTagButton } from 'views/components/sidebar/tag_selector';

const TagsPage = {
  view: (vnode) => {
    return m(Sublayout, {
      class: 'TagsPage',
    }, [
      m('.forum-container', [
        m(TagSelector, { activeTag: null, hideEditButton: false }),
        m('br'),
        isCommunityAdmin() && m(NewTagButton),
      ]),
    ]);
  },
};

export default TagsPage;
