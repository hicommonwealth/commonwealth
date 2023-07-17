import React, { FC } from 'react';
import Tooltip from '@mui/joy/Tooltip';

export type Placement = 'top' | 'right' | 'bottom' | 'left';

type CWTooltipProps = {
  content: string;
  placement: Placement;
  children: any;
};

export const CWTooltip = (props: CWTooltipProps) => {
  const { content, placement, children } = props;

  return (
    <Tooltip
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '4px 8px',
        paddingBottom: '10px',
        isolation: 'isolate',
        maxWidth: '232px',
        height: '40px',
        backgroundColor: '#141315',
        color: '#FFFFFF',
        borderRadius: '4px',
        fontFamily: 'NeueHaasUnica',
        fontStyle: 'normal',
        fontWeight: 400,
        fontSize: '12px',
        lineHeight: '16px',
        textAlign: 'center',
        letterSpacing: '0.02em',
        fontFeatureSettings: `'tnum' on, 'lnum' on`,
        '& .MuiTooltip-arrow::before': {
          borderTopColor: '#141315',
          borderRightColor: '#141315',
          borderRadius: '0',
        },
      }}
      title={content}
      arrow
      placement={placement}
    >
      {children}
    </Tooltip>
  );
};
