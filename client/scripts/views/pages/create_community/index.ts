import m from 'mithril';
import Sublayout from 'views/sublayout';
import { CreateCommunity as CreateCommunityIndex } from './create_community';

const CreateCommunity: m.Component = {
  view: () => {
    return m(
      Sublayout,
      {
        title: 'Create Community',
        useQuickSwitcher: true,
      },
      [m(CreateCommunityIndex)]
    );
  },
};

export default CreateCommunity;