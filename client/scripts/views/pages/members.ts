/* eslint-disable no-unused-expressions */
import 'pages/members.scss';

import _ from 'lodash';
import m from 'mithril';
import $ from 'jquery';

import app from 'state';
import ChainOrCommunityRoles from 'views/pages/discussions/roles';

const MembersPage = {
  view: (vnode) => {
    return m('.MembersPage', [
      m(ChainOrCommunityRoles),
    ]);
  },
};

export default MembersPage;
