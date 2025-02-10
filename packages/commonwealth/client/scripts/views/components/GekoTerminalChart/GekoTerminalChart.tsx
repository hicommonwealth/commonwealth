import { boolToQueryValue, getBaseUrl } from 'client/scripts/utils/gekoUtils';
import React from 'react';

export interface GeckoTerminalEmbedProps {
  chain: string;
  poolAddress: string;
  embed?: boolean;
  info?: boolean;
  swaps?: boolean;
  grayscale?: boolean;
  lightChart?: boolean;
  width?: string | number;
  height?: string | number;
  id?: string;
  title?: string;
}

const GeckoTerminalChart = ({
  chain,
  poolAddress,
  embed = true,
  info = true,
  swaps = true,
  grayscale = false,
  lightChart = false,
  width = '100%',
  height = '500px',
  id = 'geckoterminal-embed',
  title = 'GeckoTerminal Embed',
}: GeckoTerminalEmbedProps) => {
  const baseUrl = getBaseUrl(chain, poolAddress);

  const queryParams = new URLSearchParams({
    embed: boolToQueryValue(embed),
    info: boolToQueryValue(info),
    swaps: boolToQueryValue(swaps),
    grayscale: boolToQueryValue(grayscale),
    light_chart: boolToQueryValue(lightChart),
  });

  const widgetUrl = `${baseUrl}?${queryParams.toString()}`;

  return (
    <iframe
      id={id}
      title={title}
      width={width}
      height={height}
      src={widgetUrl}
      frameBorder="0"
      allow="clipboard-write"
      allowFullScreen
      style={{ border: 'none' }}
    />
  );
};

export default GeckoTerminalChart;
