import { QueryClient } from '@tanstack/react-query';
import { screen } from '@testing-library/react';
import React from 'react';
import { useLocation } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import { renderWithProviders } from '../renderWithProviders';

const LocationProbe = () => {
  const location = useLocation();

  return <div data-testid="pathname">{location.pathname}</div>;
};

const ProviderValueContext = React.createContext('default');

const ProviderValueProbe = () => {
  const value = React.useContext(ProviderValueContext);
  return <div data-testid="provider-value">{value}</div>;
};

describe('renderWithProviders', () => {
  test('supports route override + provider override + isolated query clients', () => {
    const ProviderOverride = ({ children }: { children: React.ReactNode }) => (
      <ProviderValueContext.Provider value="override">
        {children}
      </ProviderValueContext.Provider>
    );

    renderWithProviders(<LocationProbe />, {
      initialRoute: '/component-test',
    });

    expect(screen.getByTestId('pathname')).toHaveTextContent('/component-test');

    renderWithProviders(<ProviderValueProbe />, {
      providerOverrides: { wrapper: ProviderOverride },
    });

    expect(screen.getByTestId('provider-value')).toHaveTextContent('override');

    const first = renderWithProviders(<div>first</div>);
    first.queryClient.setQueryData(
      ['isolation-contract'],
      'first-client-value',
    );

    const second = renderWithProviders(<div>second</div>);

    expect(first.queryClient.getQueryData(['isolation-contract'])).toBe(
      'first-client-value',
    );
    expect(second.queryClient.getQueryData(['isolation-contract'])).toBe(
      undefined,
    );
    expect(first.queryClient).toBeInstanceOf(QueryClient);
    expect(second.queryClient).toBeInstanceOf(QueryClient);
    expect(first.queryClient).not.toBe(second.queryClient);
  });
});
