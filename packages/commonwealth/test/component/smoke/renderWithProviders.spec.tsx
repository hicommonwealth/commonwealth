import { screen } from '@testing-library/react';
import React from 'react';
import { useLocation } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import { renderWithProviders } from '../renderWithProviders';

const LocationProbe = () => {
  const location = useLocation();

  return <div data-testid="pathname">{location.pathname}</div>;
};

describe('renderWithProviders', () => {
  test('renders component with providers and initial route', () => {
    renderWithProviders(<LocationProbe />, {
      initialRoute: '/component-test',
    });

    expect(screen.getByTestId('pathname')).toHaveTextContent('/component-test');
  });
});
