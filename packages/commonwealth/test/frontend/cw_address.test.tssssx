/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { CWAddress} from '../../client/scripts/views/components/component_kit/cw_address'

function sum(a, b) {
  return a + b;
}

describe('address component', () => {
  test('displays the About link', () => {
    render(<CWAddress address="test address" darkMode={true} />);
  })

  test('adds 1 + 2 to equal 3', () => {
    expect(sum(1, 2)).toBe(3);
  });
})
