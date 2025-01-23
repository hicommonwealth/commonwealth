export enum XPProgressIndicatorMode {
  Compact = 'compact',
  Detailed = 'detailed',
}

export type XPProgressIndicatorProps = {
  mode?: XPProgressIndicatorMode;
  className?: string;
};
