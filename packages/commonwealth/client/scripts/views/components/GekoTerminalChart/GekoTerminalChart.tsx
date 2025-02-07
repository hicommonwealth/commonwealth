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

const GeckoTerminalChart: React.FC<GeckoTerminalEmbedProps> = ({
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
}) => {
  const boolToQueryValue = (value: boolean): string => (value ? '1' : '0');

  const baseUrl = `https://www.geckoterminal.com/${chain}/pools/${poolAddress}`;

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
