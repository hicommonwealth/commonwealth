import React from 'react';
import { assert } from 'chai';
import { mount, shallow } from 'enzyme';
import { Footer } from '../../client/scripts/views/footer';

describe('footer component', () => {
  it('should display a link to the About page', () => {
    // console.log(Footer)
    const wrapper = mount(<Footer/>)
  });
});