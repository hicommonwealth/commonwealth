// Source: https://github.com/Simspace/monorail/blob/master/src/metaComponents/popOver/PopOver.tsx

export enum dropDirections {
  Bottom = 'bottom',
  Left = 'left',
  Right = 'right',
  Top = 'top',
}

export type dropXDirectionType = dropDirections.Left | dropDirections.Right;
export type dropYDirectionType = dropDirections.Top | dropDirections.Bottom;

export type PopoverPosition = {
  dropXAmount: number;
  dropXDirection: dropXDirectionType;
  dropYAmount: number;
  dropYDirection: dropYDirectionType;
  gap: number;
  maxHeight: number;
  maxWidth: number;
  originHeight: number;
  originWidth: number;
  maxHeightCalc: string;
  maxWidthCalc: string;
};

export type GetFunctionAttrs = {
  dropXDirection: dropXDirectionType;
  dropYDirection: dropYDirectionType;
  boundingRect: {
    top: number;
    bottom: number;
    left: number;
    right: number;
    width: number;
    height: number;
  };
  innerWidth: number;
  innerHeight: number;
  toSide: boolean;
  gap: number;
};

export type GetFunctionXAttrs = Omit<
  GetFunctionAttrs,
  'dropYDirection' | 'innerHeight'
>;

export type GetFunctionYAttrs = Omit<
  GetFunctionAttrs,
  'dropXDirection' | 'innerWidth'
>;
