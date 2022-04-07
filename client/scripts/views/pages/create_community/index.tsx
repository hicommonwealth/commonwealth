/* @jsx m */

import m from 'mithril';

import Sublayout from 'views/sublayout';
import { CreateCommunity as CreateCommunityIndex } from './create_community';

const CreateCommunity: m.Component = {
  view: () => {
    return (
      <Sublayout title="Create Community">
        <CreateCommunityIndex />
      </Sublayout>
    );
  },
};

export default CreateCommunity;
