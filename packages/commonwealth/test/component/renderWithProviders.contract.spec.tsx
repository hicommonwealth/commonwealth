import { QueryClient, useQueryClient } from '@tanstack/react-query';
import React, { createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import {
  createTestQueryClient,
  renderWithProviders,
} from './renderWithProviders';

const MarkerContext = createContext('unset');
const CONTRACT_QUERY_KEY = ['render-with-providers-contract'];

const ContractProbe = () => {
  const marker = useContext(MarkerContext);
  const location = useLocation();
  const queryClient = useQueryClient();

  return (
    <div>
      <span data-testid="route">{location.pathname}</span>
      <span data-testid="marker">{marker}</span>
      <span data-testid="has-contract-query">
        {String(Boolean(queryClient.getQueryData(CONTRACT_QUERY_KEY)))}
      </span>
    </div>
  );
};

describe('renderWithProviders contract', () => {
  test('supports route/provider overrides and isolates default query clients', () => {
    const customQueryClient = createTestQueryClient();
    const ProviderWrapper = ({ children }: { children: React.ReactNode }) => (
      <MarkerContext.Provider value="provider-override">
        {children}
      </MarkerContext.Provider>
    );

    const firstRender = renderWithProviders(<ContractProbe />, {
      initialRoute: '/epic-2/harness',
      queryClient: customQueryClient,
      providerOverrides: {
        wrapper: ProviderWrapper,
      },
    });

    expect(firstRender.queryClient).toBe(customQueryClient);
    expect(firstRender.getByTestId('route')).toHaveTextContent(
      '/epic-2/harness',
    );
    expect(firstRender.getByTestId('marker')).toHaveTextContent(
      'provider-override',
    );

    firstRender.queryClient.setQueryData(CONTRACT_QUERY_KEY, {
      from: 'first-render',
    });
    firstRender.unmount();

    const secondRender = renderWithProviders(<ContractProbe />, {
      initialRoute: '/epic-2/harness-second',
      providerOverrides: {
        wrapper: ProviderWrapper,
      },
    });

    expect(secondRender.queryClient).toBeInstanceOf(QueryClient);
    expect(secondRender.queryClient).not.toBe(firstRender.queryClient);
    expect(secondRender.queryClient.getQueryData(CONTRACT_QUERY_KEY)).toBe(
      undefined,
    );
    expect(secondRender.getByTestId('route')).toHaveTextContent(
      '/epic-2/harness-second',
    );
    expect(secondRender.getByTestId('marker')).toHaveTextContent(
      'provider-override',
    );
    expect(secondRender.getByTestId('has-contract-query')).toHaveTextContent(
      'false',
    );
  });
});
