// Magna API TypeScript types

export interface MagnaStakeholder {
  name?: string;
  email?: string;
  xHandle?: string;
  employeeNumber?: string;
}

export interface MagnaCustomAttribute {
  key: string;
  value: string;
}

export interface CreateAllocationRequest {
  amount: string;
  contractId: string;
  tokenId: string;
  category: string;
  description?: string | null;
  unlockScheduleId?: string;
  unlockStartAt?: string;
  vestingScheduleId?: string;
  vestingStartAt?: string;
  releaseMode?: 'LINEAR' | 'CLIFF';
  walletAddress?: string;
  stakeholder?: MagnaStakeholder;
  receivedOffMagna?: string;
  cancellable?: boolean;
  customAttributes?: MagnaCustomAttribute[];
}

export interface MagnaAllocation {
  id: string;
  key: string;
  amount: string;
  receivedOffMagna: string | null;
  funded: string | null;
  received: string;
  state: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  status: string;
  isWalletSubmitted: boolean | null;
  releaseMode: string | null;
  description: string | null;
  releasable: string;
  claimable: string | null;
  pendingRelease: string | null;
  vaultId: string | null;
  grantId: string | null;
  custodyType: string;
  projectId: string;
  tokenId: string;
  stakeholderId: string;
  walletId: string | null;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
  scheduledCancelAt: string | null;
  unlockScheduleId: string | null;
  unlockStartAt: string | null;
  vestingScheduleId: string | null;
  vestingStartAt: string | null;
}

export interface MagnaResponse<T> {
  isProcessed: boolean;
  result: T;
}

export type MagnaAllocationResponse = MagnaResponse<MagnaAllocation>;
