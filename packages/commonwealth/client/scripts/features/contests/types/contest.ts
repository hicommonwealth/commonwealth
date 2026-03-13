type ContestTopic = {
  id?: number;
  name?: string;
};

type ContestScoreEntry = {
  creator_address?: string;
  content_id?: string;
  votes?: number;
  prize?: string;
  tickerPrize?: number;
};

type ContestInstance = {
  contest_id?: number;
  score?: ContestScoreEntry[];
  score_updated_at?: Date;
  start_time?: Date;
  end_time?: Date;
  contest_balance?: string;
};

export type Contest = {
  is_farcaster_contest: boolean;
  community_id: string;
  contest_address: string;
  created_at?: Date;
  name: string;
  description?: string;
  image_url?: string;
  topic_id?: number;
  topics: ContestTopic[];
  cancelled?: boolean;
  decimals?: number;
  funding_token_address?: string;
  interval: number;
  payout_structure: number[];
  prize_percentage?: number;
  ticker?: string;
  vote_weight_multiplier?: number;
  namespace_judges?: string[];
  namespace_judge_token_id?: number;
  contests: ContestInstance[];
};
