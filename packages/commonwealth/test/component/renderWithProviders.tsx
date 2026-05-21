import { OpenFeatureProvider } from '@openfeature/react-sdk';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';

type ProviderOverrides = {
  openFeatureClient?: unknown;
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
};

export type RenderWithProvidersOptions = Omit<RenderOptions, 'wrapper'> & {
  initialRoute?: string;
  queryClient?: QueryClient;
  memoryRouterProps?: Omit<MemoryRouterProps, 'children' | 'initialEntries'>;
  providerOverrides?: ProviderOverrides;
};

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

export const renderWithProviders = (
  ui: React.ReactElement,
  options: RenderWithProvidersOptions = {},
) => {
  const {
    initialRoute = '/',
    queryClient = createTestQueryClient(),
    providerOverrides,
    memoryRouterProps,
    ...renderOptions
  } = options;

  const AdditionalWrapper = providerOverrides?.wrapper;

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    const wrappedChildren = AdditionalWrapper ? (
      <AdditionalWrapper>{children}</AdditionalWrapper>
    ) : (
      children
    );

    return (
      <HelmetProvider>
        <MemoryRouter initialEntries={[initialRoute]} {...memoryRouterProps}>
          <QueryClientProvider client={queryClient}>
            {/* @ts-expect-error Current app wiring intentionally uses an undefined OpenFeature client in tests */}
            <OpenFeatureProvider client={providerOverrides?.openFeatureClient}>
              {wrappedChildren}
            </OpenFeatureProvider>
          </QueryClientProvider>
        </MemoryRouter>
      </HelmetProvider>
    );
  };

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
};
