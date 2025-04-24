import { boolToQueryValue, getBaseUrl } from 'client/scripts/utils/gekoUtils';
import React from 'react';
import './GekoTerminalChart.scss';

export interface GeckoTerminalEmbedProps {
  chain: string;
  poolAddress: string;
  embed?: boolean;
  info?: boolean;
  swaps?: boolean;
  grayscale?: boolean;
  lightChart?: boolean;
  id?: string;
  title?: string;
  className?: string;
}

const GeckoTerminalChart = ({
  chain,
  poolAddress,
  embed = true,
  info = true,
  swaps = true,
  grayscale = false,
  lightChart = false,
  id = 'geckoterminal-embed',
  title = 'GeckoTerminal Embed',
  className,
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
      src={widgetUrl}
      frameBorder="0"
      allow="clipboard-write"
      allowFullScreen
      className={className}
      style={{ border: 'none' }}
    />
  );
};

export default GeckoTerminalChart;
