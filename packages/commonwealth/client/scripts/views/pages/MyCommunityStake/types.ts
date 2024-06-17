export type FilterOptions = {
  searchText?: string;
  selectedAddress?: { label: string; value: string };
};

export type TransactionsProps = {
  transactions: {
    community: {
      id?: string;
      default_symbol?: string;
      icon_url?: string;
      name?: string;
      chain_node_id?: number;
    };
    address: string;
    price: string;
    stake: number;
    voteWeight: number;
    timestamp: number;
    action: string;
    totalPrice: string;
    avgPrice: string;
    etherscanLink: string;
    chain: string;
  }[];
};
