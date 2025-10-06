import { AllocationStatus } from '@hicommonwealth/schemas';

export interface MagnaStakeholder {
  id?: string;
  type?: string | null;
  employeeNumber?: string | null;
  name?: string | null;
  contactEmail?: string | null;
}

export interface MagnaCustomAttribute {
  key: string;
  value: string;
}

export interface CreateAllocationRequest {
  key: string; // unique allocation key to avoid duplicates
  contractId: string;
  tokenId: string;
  amount: number;
  walletAddress: string;
  stakeholder: MagnaStakeholder;
  unlockScheduleId: string;
  unlockStartAt: string;
  category: string;
  description?: string | null;
  vestingScheduleId?: string;
  vestingStartAt?: string;
  releaseMode?: 'LINEAR' | 'CLIFF';
  receivedOffMagna?: string;
  cancellable?: boolean;
  customAttributes?: MagnaCustomAttribute[];
}

export interface MagnaAllocation {
  id: string;
  key: string;
  description: string | null;
  amount: string;
  funded: string | null;
  claimable: string | null;
  received: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  cancelledAt: Date | null;
  walletAddress: string;
  status: (typeof AllocationStatus)[number];
  stakeholder: MagnaStakeholder;
  category: {
    id: string;
    name: string;
  };
  unlockStartAt: Date | null;
  vestingStartAt: Date | null;
}

export interface ClaimAllocationRequest {
  sender: string;
  userCountryCode?: string;
}

export interface MagnaClaim {
  from: string;
  to: string;
  data: string;
}

export interface MagnaResponse<T> {
  isProcessed: boolean;
  result?: T;
  error?: {
    type: string;
    message: string;
    context?: { existingAllocationId?: string };
  };
}

export type MagnaAllocationResponse = MagnaResponse<MagnaAllocation>;
export type MagnaClaimResponse = MagnaResponse<MagnaClaim[]>;
