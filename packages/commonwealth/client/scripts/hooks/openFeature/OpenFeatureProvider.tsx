/**
 * This file was grabbed from https://github.com/open-feature. There was an issue with the react-sdk npm deploy,
 * so I had copied the code
 */

import { Client, OpenFeature } from '@openfeature/web-sdk';
import * as React from 'react';

type ClientOrClientName =
  | {
      /**
       * The name of the client.
       * @see OpenFeature.setProvider() and overloads.
       */
      clientName: string;
      /**
       * OpenFeature client to use.
       */
      client?: never;
    }
  | {
      /**
       * OpenFeature client to use.
       */
      client: Client;
      /**
       * The name of the client.
       * @see OpenFeature.setProvider() and overloads.
       */
      clientName?: never;
    };

type ProviderProps = {
  children?: React.ReactNode;
} & ClientOrClientName;

const Context = React.createContext<Client | undefined>(undefined);

export const OpenFeatureProvider = ({
  client,
  clientName,
  children,
}: ProviderProps) => {
  if (!client) {
    client = OpenFeature.getClient(clientName);
  }

  return <Context.Provider value={client}>{children}</Context.Provider>;
};

export const useOpenFeatureClient = () => {
  const client = React.useContext(Context);

  if (!client) {
    throw new Error(
      'No OpenFeature client available - components using OpenFeature must be wrapped with an <OpenFeatureProvider>',
    );
  }

  return client;
};
