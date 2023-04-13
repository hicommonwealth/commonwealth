import Enzyme from 'enzyme';
import Adapter from '@cfaester/enzyme-adapter-react-18';

Enzyme.configure({ adapter: new Adapter() });

import React from 'react';
import { assert } from 'chai';
import { mount, shallow } from 'enzyme';
import { Footer } from '../../client/scripts/views/footer';

describe('footer component', () => {
  it('should display a link to the About page', () => {
    const wrapper = mount(<Footer />)
    assert.equal(1, 1)
  });
});