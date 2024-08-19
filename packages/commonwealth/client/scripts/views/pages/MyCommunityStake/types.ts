export type FilterOptions = {
  searchText?: string;
  selectedAddress?: { label: string; value: string };
};

export type TransactionsProps = {
  transactions: {
    community: {
      id: string;
      default_symbol?: string | null;
      icon_url?: string | null;
      name: string;
      chain_node_id?: number | null;
      chain_node_name?: string | null;
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
  }[];
};
