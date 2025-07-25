// Magna API TypeScript types

export interface MagnaAllocationsRequest {
  tokenId: string;
  cursor?: string;
  limit?: number;
  walletAddress?: string;
}

export interface MagnaStakeholder {
  id: string;
  type: string | null;
  employeeNumber: string | null;
  name: string | null;
  contactEmail: string | null;
}

export interface MagnaCategory {
  id: string;
  name: string;
}

export interface MagnaAllocation {
  id: string;
  key: string;
  description: string | null;
  amount: string;
  funded: string;
  received: string;
  walletAddress: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
  state:
    | 'MISSING_WALLET'
    | 'NOT_STARTED'
    | 'CANCELED'
    | 'COMPLETED'
    | 'UP_TO_DATE';
  stakeholder: MagnaStakeholder;
  customAttributes: any[];
  category: MagnaCategory;
  unlockStartAt: string;
  vestingStartAt: string;
}

export interface MagnaAllocationsResponse {
  isProcessed: boolean;
  result: {
    items: MagnaAllocation[];
    total: number;
  };
}
