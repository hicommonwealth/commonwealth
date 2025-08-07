--
-- PostgreSQL database dump
--

-- Dumped from database version 15.1
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: enum_Addresses_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_Addresses_role" AS ENUM (
    'member',
    'moderator',
    'admin'
);


--
-- Name: enum_ChainObjectQueries_query_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_ChainObjectQueries_query_type" AS ENUM (
    'INIT',
    'ADD',
    'UPDATE'
);


--
-- Name: enum_CommunityContractTemplateMetadata_display_options; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_CommunityContractTemplateMetadata_display_options" AS ENUM (
    '0',
    '1',
    '2',
    '3'
);


--
-- Name: enum_CommunityRoles_name; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_CommunityRoles_name" AS ENUM (
    'admin',
    'moderator',
    'member'
);


--
-- Name: enum_ContestActions_action; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_ContestActions_action" AS ENUM (
    'added',
    'upvoted'
);


--
-- Name: enum_GroupGatedActions_gated_actions; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_GroupGatedActions_gated_actions" AS ENUM (
    'CREATE_THREAD',
    'CREATE_COMMENT',
    'CREATE_THREAD_REACTION',
    'CREATE_COMMENT_REACTION',
    'UPDATE_POLL'
);


--
-- Name: enum_InviteLinks_time_limit; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_InviteLinks_time_limit" AS ENUM (
    '24h',
    '48h',
    '1w',
    '30d',
    'none'
);


--
-- Name: enum_QuestActionMetas_participation_limit; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_QuestActionMetas_participation_limit" AS ENUM (
    'once_per_quest',
    'once_per_period'
);


--
-- Name: enum_QuestActionMetas_participation_period; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_QuestActionMetas_participation_period" AS ENUM (
    'daily',
    'weekly',
    'monthly'
);


--
-- Name: enum_Reactions_reaction; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_Reactions_reaction" AS ENUM (
    'like'
);


--
-- Name: enum_Roles_permission; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_Roles_permission" AS ENUM (
    'admin',
    'moderator',
    'member'
);


--
-- Name: enum_StakeTransactions_stake_direction; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_StakeTransactions_stake_direction" AS ENUM (
    'buy',
    'sell'
);


--
-- Name: insert_subscription_preference(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.insert_subscription_preference() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM "SubscriptionPreferences" WHERE user_id = NEW.id
            ) THEN
              INSERT INTO "SubscriptionPreferences" (user_id)
              VALUES (NEW.id);
            END IF;
            RETURN NEW;
          END;
          $$;


--
-- Name: notify_insert_outbox_function(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_insert_outbox_function() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
        BEGIN
          IF NEW.relayed = false THEN
            PERFORM pg_notify('outbox_channel', NEW.event_id::TEXT);
          END IF;
          RETURN NEW;
        END;
        $$;


--
-- Name: old_subscriptions_delete(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.old_subscriptions_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
          BEGIN
            IF OLD.category_id IN ('chain-event', 'snapshot-proposal') THEN
              DELETE FROM "CommunityAlerts"
              WHERE user_id = OLD.subscriber_id
                AND community_id = OLD.community_id;
            ELSIF OLD.category_id = 'new-comment-creation' AND OLD.comment_id IS NOT NULL THEN
              DELETE FROM "CommentSubscriptions"
              WHERE user_id = OLD.subscriber_id
                AND comment_id = OLD.comment_id;
            ELSIF OLD.category_id = 'new-comment-creation' AND OLD.thread_id IS NOT NULL THEN
              DELETE FROM "ThreadSubscriptions"
              WHERE user_id = OLD.subscriber_id
                AND thread_id = OLD.thread_id;
            END IF;
            RETURN OLD;
          END;
          $$;


--
-- Name: old_subscriptions_insert(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.old_subscriptions_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
          BEGIN
            IF NEW.category_id = 'chain-event' THEN
                            IF NOT EXISTS (
                SELECT 1 FROM "CommunityAlerts"
                WHERE user_id = NEW.subscriber_id
                  AND community_id = NEW.community_id
              ) THEN
                INSERT INTO "CommunityAlerts" (user_id, community_id, created_at, updated_at)
                VALUES (NEW.subscriber_id, NEW.community_id, NEW.created_at, NEW.updated_at);
              END IF;
              RETURN NEW;
            ELSIF NEW.category_id = 'snapshot-proposal' THEN
              IF NOT EXISTS (
                SELECT 1 FROM "CommunityAlerts"
                WHERE user_id = NEW.subscriber_id
                  AND community_id = NEW.community_id
              ) THEN
                INSERT INTO "CommunityAlerts" (user_id, community_id, created_at, updated_at)
                VALUES (
                  NEW.subscriber_id, 
                  (SELECT id FROM "Communities" WHERE NEW.snapshot_id = ANY(snapshot_spaces) LIMIT 1), 
                  NEW.created_at, NEW.updated_at
                );
              END IF;
              RETURN NEW;
            ELSIF NEW.category_id = 'new-comment-creation' AND NEW.comment_id IS NOT NULL THEN
              IF NOT EXISTS (
                SELECT 1 FROM "CommentSubscriptions"
                WHERE user_id = NEW.subscriber_id
                  AND comment_id = NEW.comment_id
              ) THEN
                INSERT INTO "CommentSubscriptions" (user_id, comment_id, created_at, updated_at)
                VALUES (NEW.subscriber_id, NEW.comment_id, NEW.created_at, NEW.updated_at);
              END IF;
              RETURN NEW;
            ELSIF NEW.category_id = 'new-comment-creation' AND NEW.thread_id IS NOT NULL THEN
              IF NOT EXISTS (
                SELECT 1 FROM "ThreadSubscriptions"
                WHERE user_id = NEW.subscriber_id
                  AND thread_id = NEW.thread_id
              ) THEN
                INSERT INTO "ThreadSubscriptions" (user_id, thread_id, created_at, updated_at)
                VALUES (NEW.subscriber_id, NEW.thread_id, NEW.created_at, NEW.updated_at);
              END IF;
              RETURN NEW;
            END IF;
            RETURN NEW;
          END;
          $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Addresses" (
    id integer NOT NULL,
    address character varying(255) NOT NULL,
    community_id character varying(255) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    user_id integer,
    verification_token character varying(255) NOT NULL,
    verification_token_expires timestamp with time zone,
    verified timestamp with time zone,
    last_active timestamp with time zone,
    ghost_address boolean DEFAULT false NOT NULL,
    wallet_id character varying(255),
    block_info character varying(255),
    role public."enum_Addresses_role" DEFAULT 'member'::public."enum_Addresses_role" NOT NULL,
    hex character varying(64),
    is_banned boolean DEFAULT false NOT NULL,
    oauth_provider character varying(255),
    oauth_email character varying(255),
    oauth_username character varying(255),
    oauth_phone_number character varying(255),
    oauth_email_verified boolean
);


--
-- Name: Addresses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Addresses_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Addresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Addresses_id_seq" OWNED BY public."Addresses".id;


--
-- Name: ApiKeys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ApiKeys" (
    user_id integer NOT NULL,
    hashed_api_key character varying(255) NOT NULL,
    salt character varying(255) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    premium_tier boolean DEFAULT false
);


--
-- Name: ChainEventXpSources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ChainEventXpSources" (
    chain_node_id integer NOT NULL,
    contract_address character varying(255) NOT NULL,
    event_signature character varying(255) NOT NULL,
    quest_action_meta_id integer NOT NULL,
    active boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    readable_signature character varying(255) NOT NULL,
    transaction_hash character varying(255) NOT NULL
);


--
-- Name: ChainNodes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ChainNodes" (
    id integer NOT NULL,
    url character varying(255) NOT NULL,
    eth_chain_id integer,
    alt_wallet_url character varying(255),
    private_url character varying(255),
    balance_type character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255),
    ss58 integer,
    bech32 character varying(255),
    created_at timestamp with time zone DEFAULT '2022-10-27 18:45:08.315+00'::timestamp with time zone NOT NULL,
    updated_at timestamp with time zone DEFAULT '2022-10-27 18:45:08.322+00'::timestamp with time zone NOT NULL,
    cosmos_chain_id character varying(255),
    health character varying(255),
    cosmos_gov_version character varying(64),
    block_explorer character varying(255),
    slip44 integer,
    max_ce_block_range integer,
    alchemy_metadata jsonb,
    CONSTRAINT "Cosmos_chain_id_alphanumeric_lowercase" CHECK (((cosmos_chain_id)::text ~ '[a-z0-9]+'::text)),
    CONSTRAINT alchemy_metadata_check CHECK ((((alchemy_metadata IS NOT NULL) AND (((url)::text ~~ '%.g.alchemy.com%'::text) OR ((private_url)::text ~~ '%.g.alchemy.com%'::text))) OR ((alchemy_metadata IS NULL) AND (((url)::text !~~ '%.g.alchemy.com%'::text) AND ((private_url)::text !~~ '%.g.alchemy.com%'::text))))),
    CONSTRAINT check_block_range_for_alchemy_nodes CHECK (((((url)::text ~~ '%alchemy%'::text) AND (max_ce_block_range = '-1'::integer)) OR (((url)::text !~~ '%alchemy%'::text) AND (max_ce_block_range > '-1'::integer))))
);


--
-- Name: ChainNodes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."ChainNodes_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ChainNodes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."ChainNodes_id_seq" OWNED BY public."ChainNodes".id;


--
-- Name: Collaborations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Collaborations" (
    thread_id integer NOT NULL,
    address_id integer NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: CommentSubscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CommentSubscriptions" (
    user_id integer NOT NULL,
    comment_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: CommentVersionHistories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CommentVersionHistories" (
    id integer NOT NULL,
    comment_id integer NOT NULL,
    body character varying(2000) NOT NULL,
    "timestamp" timestamp with time zone NOT NULL,
    content_url character varying(255)
);


--
-- Name: CommentVersionHistories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."CommentVersionHistories_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: CommentVersionHistories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."CommentVersionHistories_id_seq" OWNED BY public."CommentVersionHistories".id;


--
-- Name: Comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Comments" (
    id integer NOT NULL,
    parent_id integer,
    address_id integer,
    body character varying(2000) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    root_id character varying(255),
    search tsvector,
    canvas_msg_id character varying(255),
    thread_id integer NOT NULL,
    created_by character varying(255),
    marked_as_spam_at timestamp with time zone,
    discord_meta jsonb,
    reaction_count integer DEFAULT 0 NOT NULL,
    reaction_weights_sum numeric(78,0) DEFAULT 0 NOT NULL,
    canvas_signed_data jsonb,
    content_url character varying(255),
    comment_level integer DEFAULT 0 NOT NULL,
    reply_count integer DEFAULT 0 NOT NULL,
    user_tier_at_creation integer
);


--
-- Name: Comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Comments_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Comments_id_seq" OWNED BY public."Comments".id;


--
-- Name: Communities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Communities" (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    default_symbol character varying(255),
    icon_url character varying(255),
    active boolean DEFAULT false,
    network character varying(255) DEFAULT 'edgeware'::character varying NOT NULL,
    description character varying(255),
    type character varying(255) DEFAULT 'chain'::character varying NOT NULL,
    collapsed_on_homepage boolean DEFAULT true NOT NULL,
    block_explorer_ids character varying(255),
    base character varying(255) DEFAULT ''::character varying NOT NULL,
    ss58_prefix integer,
    custom_domain character varying(255),
    terms character varying(255),
    bech32_prefix character varying(255),
    default_summary_view boolean,
    admin_only_polling boolean,
    chain_node_id integer,
    token_name character varying(255),
    hide_projects boolean,
    discord_config_id integer,
    default_page character varying(255),
    has_homepage character varying(255) DEFAULT false,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    discord_bot_webhooks_enabled boolean DEFAULT false,
    directory_page_enabled boolean DEFAULT false NOT NULL,
    directory_page_chain_node_id integer,
    social_links character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[] NOT NULL,
    namespace character varying(255),
    stages_enabled boolean DEFAULT true NOT NULL,
    custom_stages text[] DEFAULT ARRAY[]::text[] NOT NULL,
    redirect text,
    lifetime_thread_count integer DEFAULT 0 NOT NULL,
    namespace_address character varying(255),
    snapshot_spaces character varying(255)[] DEFAULT '{}'::character varying[] NOT NULL,
    include_in_digest_email boolean,
    profile_count integer DEFAULT 0 NOT NULL,
    banner_text text,
    allow_tokenized_threads boolean DEFAULT false NOT NULL,
    tier integer DEFAULT 1 NOT NULL,
    spam_tier_level integer DEFAULT '-1'::integer NOT NULL,
    thread_purchase_token character varying(255),
    namespace_creator_address character varying(255),
    namespace_verified boolean DEFAULT false NOT NULL,
    namespace_verification_configured boolean DEFAULT false NOT NULL,
    namespace_nominations character varying(255)[],
    environment character varying(255) DEFAULT NULL::character varying NOT NULL,
    pending_namespace_judge_token_id integer,
    ai_features_enabled boolean DEFAULT true NOT NULL,
    namespace_governance_address character varying(255),
    CONSTRAINT check_lowercase_bech32_prefix CHECK (((bech32_prefix)::text = lower((bech32_prefix)::text)))
);


--
-- Name: CommunityAlerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CommunityAlerts" (
    user_id integer NOT NULL,
    community_id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: CommunityDirectoryTags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CommunityDirectoryTags" (
    community_id character varying(255) NOT NULL,
    tag_id integer,
    selected_community_id character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: CommunityGoalMetas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CommunityGoalMetas" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    target integer NOT NULL,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: CommunityGoalMetas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."CommunityGoalMetas_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: CommunityGoalMetas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."CommunityGoalMetas_id_seq" OWNED BY public."CommunityGoalMetas".id;


--
-- Name: CommunityGoalReached; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CommunityGoalReached" (
    community_goal_meta_id integer NOT NULL,
    community_id character varying(255) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    reached_at timestamp with time zone
);


--
-- Name: CommunityStakes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CommunityStakes" (
    community_id character varying(255) NOT NULL,
    stake_id integer NOT NULL,
    stake_token character varying(255) NOT NULL,
    vote_weight integer NOT NULL,
    stake_enabled boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: CommunityTags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CommunityTags" (
    community_id character varying(255) NOT NULL,
    tag_id integer NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: ContestActions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ContestActions" (
    contest_address character varying(255) NOT NULL,
    contest_id integer NOT NULL,
    content_id integer NOT NULL,
    actor_address character varying(255) NOT NULL,
    action public."enum_ContestActions_action" NOT NULL,
    content_url character varying(255),
    voting_power numeric(78,0) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    thread_id integer,
    calculated_voting_weight numeric(78,0) DEFAULT NULL::numeric,
    cast_deleted_at timestamp with time zone
);


--
-- Name: ContestManagers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ContestManagers" (
    contest_address character varying(255) NOT NULL,
    community_id character varying(255) NOT NULL,
    "interval" integer NOT NULL,
    created_at timestamp with time zone NOT NULL,
    name character varying(255) NOT NULL,
    image_url character varying(255),
    funding_token_address character varying(255),
    prize_percentage integer,
    payout_structure integer[],
    cancelled boolean,
    ticker character varying(255),
    decimals integer,
    ended boolean,
    farcaster_frame_url character varying(255),
    farcaster_frame_hashes character varying(255)[],
    topic_id integer,
    is_farcaster_contest boolean DEFAULT false NOT NULL,
    description character varying(255),
    vote_weight_multiplier double precision,
    ending boolean DEFAULT false,
    creator_address character varying(255),
    environment character varying(255) DEFAULT 'production'::character varying NOT NULL,
    farcaster_author_cast_hash character varying(255),
    deleted_at timestamp with time zone,
    namespace_judge_token_id integer,
    namespace_judges character varying(255)[]
);


--
-- Name: Contests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Contests" (
    contest_address character varying(255) NOT NULL,
    contest_id integer NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    score jsonb,
    score_updated_at timestamp with time zone,
    contest_balance numeric(78,0)
);


--
-- Name: DiscordBotConfig; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DiscordBotConfig" (
    id integer NOT NULL,
    community_id character varying(255) NOT NULL,
    guild_id character varying(255),
    verification_token character varying(255),
    verified boolean DEFAULT false NOT NULL,
    token_expiration timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: DiscordBotConfig_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."DiscordBotConfig_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: DiscordBotConfig_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."DiscordBotConfig_id_seq" OWNED BY public."DiscordBotConfig".id;


--
-- Name: Dlq; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Dlq" (
    consumer character varying(255) NOT NULL,
    event_id integer NOT NULL,
    event_name character varying(255) NOT NULL,
    reason character varying(255) NOT NULL,
    "timestamp" integer NOT NULL,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: EmailUpdateTokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EmailUpdateTokens" (
    id integer NOT NULL,
    token character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    expires timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    redirect_path character varying(255)
);


--
-- Name: EvmEventSources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EvmEventSources" (
    eth_chain_id integer NOT NULL,
    contract_address character varying(255) NOT NULL,
    event_signature character varying(255) NOT NULL,
    created_at_block integer NOT NULL,
    events_migrated boolean DEFAULT false NOT NULL,
    contract_name character varying(255) NOT NULL,
    parent_contract_address character varying(255) NOT NULL,
    CONSTRAINT check_contract_name CHECK (((contract_name)::text = ANY (ARRAY[('SingleContest'::character varying)::text, ('RecurringContest'::character varying)::text])))
);


--
-- Name: GroupGatedActions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GroupGatedActions" (
    group_id integer NOT NULL,
    gated_actions public."enum_GroupGatedActions_gated_actions"[] NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    topic_id integer NOT NULL,
    is_private boolean DEFAULT false NOT NULL
);


--
-- Name: Groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Groups" (
    id integer NOT NULL,
    community_id character varying(255) NOT NULL,
    metadata json NOT NULL,
    requirements json NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_system_managed boolean DEFAULT false NOT NULL
);


--
-- Name: Groups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Groups_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Groups_id_seq" OWNED BY public."Groups".id;


--
-- Name: LastProcessedEvmBlocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LastProcessedEvmBlocks" (
    chain_node_id integer NOT NULL,
    block_number integer NOT NULL
);


--
-- Name: LaunchpadTokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LaunchpadTokens" (
    name character varying(255) NOT NULL,
    icon_url character varying(255),
    description character varying(255),
    symbol character varying(255) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    token_address character varying(255) NOT NULL,
    namespace character varying(255) NOT NULL,
    initial_supply integer NOT NULL,
    liquidity_transferred boolean DEFAULT false NOT NULL,
    launchpad_liquidity numeric(78,0) NOT NULL,
    eth_market_cap_target double precision NOT NULL,
    creator_address character varying(255)
);


--
-- Name: LaunchpadTrades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LaunchpadTrades" (
    eth_chain_id integer NOT NULL,
    transaction_hash character varying(255) NOT NULL,
    token_address character varying(255) NOT NULL,
    trader_address character varying(255) NOT NULL,
    is_buy boolean NOT NULL,
    community_token_amount numeric(78,0) NOT NULL,
    price double precision NOT NULL,
    floating_supply numeric(78,0) NOT NULL,
    "timestamp" integer NOT NULL
);


--
-- Name: LoginTokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."LoginTokens_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: LoginTokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."LoginTokens_id_seq" OWNED BY public."EmailUpdateTokens".id;


--
-- Name: MCPServerCommunities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MCPServerCommunities" (
    mcp_server_id integer NOT NULL,
    community_id character varying(255) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: MCPServers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MCPServers" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255) NOT NULL,
    handle character varying(255) NOT NULL,
    source character varying(255) NOT NULL,
    server_url character varying(255) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: MCPServers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."MCPServers_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: MCPServers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."MCPServers_id_seq" OWNED BY public."MCPServers".id;


--
-- Name: Memberships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Memberships" (
    group_id integer NOT NULL,
    address_id integer NOT NULL,
    reject_reason jsonb,
    last_checked timestamp with time zone NOT NULL
);


--
-- Name: Notifications_id_seq1; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Notifications_id_seq1"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Polls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Polls" (
    id integer NOT NULL,
    community_id character varying(255) NOT NULL,
    thread_id integer NOT NULL,
    prompt character varying(255) NOT NULL,
    ends_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone,
    options character varying(255)[] NOT NULL
);


--
-- Name: OffchainPolls_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."OffchainPolls_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: OffchainPolls_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."OffchainPolls_id_seq" OWNED BY public."Polls".id;


--
-- Name: Reactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Reactions" (
    id integer NOT NULL,
    address_id integer NOT NULL,
    reaction public."enum_Reactions_reaction" NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    thread_id integer,
    comment_id integer,
    proposal_id character varying(255),
    canvas_msg_id character varying(255),
    calculated_voting_weight numeric(78,0),
    canvas_signed_data jsonb,
    user_tier_at_creation integer
);


--
-- Name: OffchainReactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."OffchainReactions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: OffchainReactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."OffchainReactions_id_seq" OWNED BY public."Reactions".id;


--
-- Name: Topics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Topics" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    community_id character varying(255) NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    telegram character varying(255),
    featured_in_sidebar boolean DEFAULT false NOT NULL,
    featured_in_new_post boolean DEFAULT false NOT NULL,
    default_offchain_template text,
    "order" integer,
    channel_id character varying(255),
    default_offchain_template_backup text,
    weighted_voting character varying(255),
    token_address character varying(255),
    token_symbol character varying(255),
    vote_weight_multiplier double precision,
    archived_at timestamp with time zone,
    chain_node_id integer,
    token_decimals integer,
    allow_tokenized_threads boolean DEFAULT false NOT NULL
);


--
-- Name: OffchainThreadCategories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."OffchainThreadCategories_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: OffchainThreadCategories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."OffchainThreadCategories_id_seq" OWNED BY public."Topics".id;


--
-- Name: Threads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Threads" (
    id integer NOT NULL,
    address_id integer,
    title text NOT NULL,
    body character varying(2000) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    community_id character varying(255) DEFAULT NULL::character varying NOT NULL,
    pinned boolean DEFAULT false NOT NULL,
    kind character varying(255) NOT NULL,
    url text,
    read_only boolean DEFAULT false NOT NULL,
    topic_id integer NOT NULL,
    stage text DEFAULT 'discussion'::text NOT NULL,
    has_poll boolean,
    last_commented_on timestamp with time zone,
    search tsvector,
    canvas_msg_id character varying(255),
    links jsonb,
    last_edited timestamp with time zone,
    locked_at timestamp with time zone,
    created_by character varying(255),
    marked_as_spam_at timestamp with time zone,
    archived_at timestamp with time zone,
    discord_meta jsonb,
    comment_count integer DEFAULT 0 NOT NULL,
    reaction_count integer DEFAULT 0 NOT NULL,
    reaction_weights_sum numeric(78,0) DEFAULT 0 NOT NULL,
    view_count integer DEFAULT 0 NOT NULL,
    canvas_signed_data jsonb,
    activity_rank_date timestamp with time zone,
    content_url character varying(255),
    launchpad_token_address character varying(255),
    is_linking_token boolean DEFAULT false NOT NULL,
    user_tier_at_creation integer
);


--
-- Name: OffchainThreads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."OffchainThreads_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: OffchainThreads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."OffchainThreads_id_seq" OWNED BY public."Threads".id;


--
-- Name: Votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Votes" (
    id integer NOT NULL,
    option character varying(255) NOT NULL,
    address character varying(255) NOT NULL,
    author_community_id character varying(255),
    community_id character varying(255) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    poll_id integer NOT NULL,
    calculated_voting_weight numeric(78,0),
    user_id integer
);


--
-- Name: OffchainVotes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."OffchainVotes_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: OffchainVotes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."OffchainVotes_id_seq" OWNED BY public."Votes".id;


--
-- Name: Outbox; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Outbox" (
    event_id bigint NOT NULL,
    event_name text NOT NULL,
    event_payload jsonb NOT NULL,
    relayed boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
)
PARTITION BY LIST (relayed);


--
-- Name: Outbox_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public."Outbox" ALTER COLUMN event_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public."Outbox_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: PinnedTokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PinnedTokens" (
    community_id character varying(255) NOT NULL,
    contract_address character varying(255) NOT NULL,
    chain_node_id integer NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: ProfileTags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProfileTags" (
    tag_id integer NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    user_id integer NOT NULL
);


--
-- Name: QuestActionMetas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."QuestActionMetas" (
    id integer NOT NULL,
    quest_id integer NOT NULL,
    event_name character varying(255) NOT NULL,
    reward_amount integer NOT NULL,
    creator_reward_weight double precision DEFAULT 0 NOT NULL,
    participation_limit public."enum_QuestActionMetas_participation_limit",
    participation_period public."enum_QuestActionMetas_participation_period",
    participation_times_per_period integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    amount_multiplier double precision,
    instructions_link character varying(255),
    content_id character varying(255),
    start_link character varying(255),
    community_goal_meta_id integer
);


--
-- Name: QuestActionMetas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."QuestActionMetas_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: QuestActionMetas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."QuestActionMetas_id_seq" OWNED BY public."QuestActionMetas".id;


--
-- Name: QuestTweets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."QuestTweets" (
    tweet_id character varying(255) NOT NULL,
    quest_action_meta_id integer NOT NULL,
    retweet_cap integer NOT NULL,
    like_cap integer NOT NULL,
    replies_cap integer NOT NULL,
    num_likes integer DEFAULT 0 NOT NULL,
    num_retweets integer DEFAULT 0 NOT NULL,
    num_replies integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    retweet_xp_awarded boolean DEFAULT false NOT NULL,
    reply_xp_awarded boolean DEFAULT false NOT NULL,
    like_xp_awarded boolean DEFAULT false NOT NULL,
    tweet_url character varying(255) NOT NULL
);


--
-- Name: Quests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Quests" (
    id integer NOT NULL,
    community_id character varying(255),
    name character varying(255) NOT NULL,
    description character varying(255) NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    image_url character varying(255) NOT NULL,
    xp_awarded integer DEFAULT 0 NOT NULL,
    max_xp_to_end integer DEFAULT 0 NOT NULL,
    quest_type character varying(255) NOT NULL,
    scheduled_job_id character varying(255)
);


--
-- Name: Quests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Quests_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Quests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Quests_id_seq" OWNED BY public."Quests".id;


--
-- Name: ReferralFees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ReferralFees" (
    eth_chain_id integer NOT NULL,
    transaction_hash character varying(255) NOT NULL,
    namespace_address character varying(255) NOT NULL,
    distributed_token_address character varying(255) NOT NULL,
    referrer_recipient_address character varying(255) NOT NULL,
    referrer_received_amount numeric(78,0) NOT NULL,
    transaction_timestamp bigint NOT NULL,
    referee_address character varying(255) DEFAULT ''::character varying NOT NULL
);


--
-- Name: Referrals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Referrals" (
    eth_chain_id integer NOT NULL,
    transaction_hash character varying(255) NOT NULL,
    namespace_address character varying(255) NOT NULL,
    referee_address character varying(255) NOT NULL,
    referrer_address character varying(255) NOT NULL,
    referrer_received_eth_amount numeric(78,0) DEFAULT '0'::double precision NOT NULL,
    created_on_chain_timestamp bigint NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SequelizeMeta" (
    name character varying(255) NOT NULL
);


--
-- Name: Sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Sessions" (
    sid character varying(255) NOT NULL,
    expires timestamp with time zone,
    data text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: SsoTokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SsoTokens" (
    issued_at integer NOT NULL,
    issuer character varying(255) NOT NULL,
    address_id integer NOT NULL,
    state_id character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: StakeTransactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."StakeTransactions" (
    transaction_hash character varying(255) NOT NULL,
    community_id character varying(255) NOT NULL,
    stake_id integer NOT NULL,
    address character varying(255) NOT NULL,
    stake_amount integer NOT NULL,
    stake_price bigint NOT NULL,
    stake_direction public."enum_StakeTransactions_stake_direction" NOT NULL,
    "timestamp" integer NOT NULL
);


--
-- Name: StarredCommunities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."StarredCommunities" (
    user_id integer NOT NULL,
    community_id character varying(255) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: SubscriptionPreferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SubscriptionPreferences" (
    user_id integer NOT NULL,
    email_notifications_enabled boolean DEFAULT false NOT NULL,
    digest_email_enabled boolean DEFAULT false NOT NULL,
    recap_email_enabled boolean DEFAULT false NOT NULL,
    mobile_push_notifications_enabled boolean DEFAULT false NOT NULL,
    mobile_push_discussion_activity_enabled boolean DEFAULT false NOT NULL,
    mobile_push_admin_alerts_enabled boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Subscriptions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Tags" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: Tags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Tags_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Tags_id_seq" OWNED BY public."Tags".id;


--
-- Name: ThreadRanks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ThreadRanks" (
    thread_id integer NOT NULL,
    community_rank bigint NOT NULL,
    global_rank bigint NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: ThreadSubscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ThreadSubscriptions" (
    user_id integer NOT NULL,
    thread_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ThreadVersionHistories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ThreadVersionHistories" (
    id integer NOT NULL,
    thread_id integer NOT NULL,
    address character varying(255) NOT NULL,
    body character varying(2000) NOT NULL,
    "timestamp" timestamp with time zone NOT NULL,
    content_url character varying(255)
);


--
-- Name: ThreadVersionHistories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."ThreadVersionHistories_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ThreadVersionHistories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."ThreadVersionHistories_id_seq" OWNED BY public."ThreadVersionHistories".id;


--
-- Name: TwitterCursors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TwitterCursors" (
    bot_name character varying(255) NOT NULL,
    last_polled_timestamp bigint NOT NULL
);


--
-- Name: Users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Users" (
    id integer NOT NULL,
    email character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    "isAdmin" boolean DEFAULT false,
    "disableRichText" boolean DEFAULT false NOT NULL,
    "emailVerified" boolean,
    selected_community_id character varying(255),
    "emailNotificationInterval" character varying(255) DEFAULT 'never'::character varying NOT NULL,
    promotional_emails_enabled boolean,
    is_welcome_onboard_flow_complete boolean DEFAULT true NOT NULL,
    profile jsonb DEFAULT '{}'::jsonb NOT NULL,
    xp_points integer DEFAULT 0,
    referral_eth_earnings double precision DEFAULT '0'::double precision NOT NULL,
    referral_count integer,
    unsubscribe_uuid character varying(255),
    referred_by_address character varying(255),
    xp_referrer_points integer DEFAULT 0,
    tier integer DEFAULT 0 NOT NULL,
    privy_id character varying(255),
    notify_user_name_change boolean DEFAULT false,
    CONSTRAINT users_avatar_url_check CHECK ((((profile ->> 'avatar_url'::text) IS NOT NULL) AND ((profile ->> 'avatar_url'::text) <> ''::text)))
);


--
-- Name: Users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Users_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Users_id_seq" OWNED BY public."Users".id;


--
-- Name: Wallets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Wallets" (
    id integer NOT NULL,
    user_id integer NOT NULL,
    user_address character varying(255) NOT NULL,
    relay_address character varying(255) NOT NULL,
    wallet_address character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Wallets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Wallets_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Wallets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Wallets_id_seq" OWNED BY public."Wallets".id;


--
-- Name: Webhooks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Webhooks" (
    id integer NOT NULL,
    url character varying(255) NOT NULL,
    community_id character varying(255) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    events character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[] NOT NULL,
    destination character varying(255) NOT NULL,
    signing_key character varying(255) NOT NULL
);


--
-- Name: Webhooks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Webhooks_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Webhooks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Webhooks_id_seq" OWNED BY public."Webhooks".id;


--
-- Name: XpLogs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."XpLogs" (
    user_id integer NOT NULL,
    created_at timestamp with time zone NOT NULL,
    xp_points integer NOT NULL,
    action_meta_id integer NOT NULL,
    creator_user_id integer,
    creator_xp_points integer,
    event_created_at timestamp with time zone NOT NULL,
    name character varying(255),
    id integer NOT NULL,
    event_id integer,
    scope json
);


--
-- Name: XpLogs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."XpLogs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: XpLogs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."XpLogs_id_seq" OWNED BY public."XpLogs".id;


--
-- Name: outbox_unrelayed; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.outbox_unrelayed (
    event_id bigint NOT NULL,
    event_name text NOT NULL,
    event_payload jsonb NOT NULL,
    relayed boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: template_public_outbox_relayed; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.template_public_outbox_relayed (
    id bigint NOT NULL,
    event_name text NOT NULL,
    event_payload jsonb NOT NULL,
    relayed boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: outbox_unrelayed; Type: TABLE ATTACH; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Outbox" ATTACH PARTITION public.outbox_unrelayed FOR VALUES IN (false);


--
-- Name: Addresses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Addresses" ALTER COLUMN id SET DEFAULT nextval('public."Addresses_id_seq"'::regclass);


--
-- Name: ChainNodes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChainNodes" ALTER COLUMN id SET DEFAULT nextval('public."ChainNodes_id_seq"'::regclass);


--
-- Name: CommentVersionHistories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommentVersionHistories" ALTER COLUMN id SET DEFAULT nextval('public."CommentVersionHistories_id_seq"'::regclass);


--
-- Name: Comments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Comments" ALTER COLUMN id SET DEFAULT nextval('public."Comments_id_seq"'::regclass);


--
-- Name: CommunityGoalMetas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommunityGoalMetas" ALTER COLUMN id SET DEFAULT nextval('public."CommunityGoalMetas_id_seq"'::regclass);


--
-- Name: DiscordBotConfig id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DiscordBotConfig" ALTER COLUMN id SET DEFAULT nextval('public."DiscordBotConfig_id_seq"'::regclass);


--
-- Name: EmailUpdateTokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmailUpdateTokens" ALTER COLUMN id SET DEFAULT nextval('public."LoginTokens_id_seq"'::regclass);


--
-- Name: Groups id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Groups" ALTER COLUMN id SET DEFAULT nextval('public."Groups_id_seq"'::regclass);


--
-- Name: MCPServers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MCPServers" ALTER COLUMN id SET DEFAULT nextval('public."MCPServers_id_seq"'::regclass);


--
-- Name: Polls id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Polls" ALTER COLUMN id SET DEFAULT nextval('public."OffchainPolls_id_seq"'::regclass);


--
-- Name: QuestActionMetas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuestActionMetas" ALTER COLUMN id SET DEFAULT nextval('public."QuestActionMetas_id_seq"'::regclass);


--
-- Name: Quests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Quests" ALTER COLUMN id SET DEFAULT nextval('public."Quests_id_seq"'::regclass);


--
-- Name: Reactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Reactions" ALTER COLUMN id SET DEFAULT nextval('public."OffchainReactions_id_seq"'::regclass);


--
-- Name: Tags id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Tags" ALTER COLUMN id SET DEFAULT nextval('public."Tags_id_seq"'::regclass);


--
-- Name: ThreadVersionHistories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ThreadVersionHistories" ALTER COLUMN id SET DEFAULT nextval('public."ThreadVersionHistories_id_seq"'::regclass);


--
-- Name: Threads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Threads" ALTER COLUMN id SET DEFAULT nextval('public."OffchainThreads_id_seq"'::regclass);


--
-- Name: Topics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Topics" ALTER COLUMN id SET DEFAULT nextval('public."OffchainThreadCategories_id_seq"'::regclass);


--
-- Name: Users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users" ALTER COLUMN id SET DEFAULT nextval('public."Users_id_seq"'::regclass);


--
-- Name: Votes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Votes" ALTER COLUMN id SET DEFAULT nextval('public."OffchainVotes_id_seq"'::regclass);


--
-- Name: Wallets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Wallets" ALTER COLUMN id SET DEFAULT nextval('public."Wallets_id_seq"'::regclass);


--
-- Name: Webhooks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Webhooks" ALTER COLUMN id SET DEFAULT nextval('public."Webhooks_id_seq"'::regclass);


--
-- Name: XpLogs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."XpLogs" ALTER COLUMN id SET DEFAULT nextval('public."XpLogs_id_seq"'::regclass);


--
-- Name: Addresses Addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Addresses"
    ADD CONSTRAINT "Addresses_pkey" PRIMARY KEY (id);


--
-- Name: ApiKeys ApiKeys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ApiKeys"
    ADD CONSTRAINT "ApiKeys_pkey" PRIMARY KEY (user_id);


--
-- Name: ChainEventXpSources ChainEventXpSources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChainEventXpSources"
    ADD CONSTRAINT "ChainEventXpSources_pkey" PRIMARY KEY (chain_node_id, contract_address, event_signature, quest_action_meta_id);


--
-- Name: ChainNodes ChainNodes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChainNodes"
    ADD CONSTRAINT "ChainNodes_pkey" PRIMARY KEY (id);


--
-- Name: ChainNodes ChainNodes_unique_url; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChainNodes"
    ADD CONSTRAINT "ChainNodes_unique_url" UNIQUE (url);


--
-- Name: ChainNodes Chain_nodes_unique_cosmos_chain_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChainNodes"
    ADD CONSTRAINT "Chain_nodes_unique_cosmos_chain_id" UNIQUE (cosmos_chain_id);


--
-- Name: ChainNodes Chain_nodes_unique_eth_chain_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChainNodes"
    ADD CONSTRAINT "Chain_nodes_unique_eth_chain_id" UNIQUE (eth_chain_id);


--
-- Name: Collaborations Collaborations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Collaborations"
    ADD CONSTRAINT "Collaborations_pkey" PRIMARY KEY (address_id, thread_id);


--
-- Name: CommentSubscriptions CommentSubscriptions_user_id_comment_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommentSubscriptions"
    ADD CONSTRAINT "CommentSubscriptions_user_id_comment_id_pk" PRIMARY KEY (user_id, comment_id);


--
-- Name: CommentVersionHistories CommentVersionHistories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommentVersionHistories"
    ADD CONSTRAINT "CommentVersionHistories_pkey" PRIMARY KEY (id);


--
-- Name: Comments Comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Comments"
    ADD CONSTRAINT "Comments_pkey" PRIMARY KEY (id);


--
-- Name: Communities Communities_namespace_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Communities"
    ADD CONSTRAINT "Communities_namespace_key" UNIQUE (namespace);


--
-- Name: Communities Communities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Communities"
    ADD CONSTRAINT "Communities_pkey" PRIMARY KEY (id);


--
-- Name: CommunityAlerts CommunityAlerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommunityAlerts"
    ADD CONSTRAINT "CommunityAlerts_pkey" PRIMARY KEY (user_id, community_id);


--
-- Name: CommunityGoalMetas CommunityGoalMetas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommunityGoalMetas"
    ADD CONSTRAINT "CommunityGoalMetas_pkey" PRIMARY KEY (id);


--
-- Name: CommunityGoalReached CommunityGoalReached_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommunityGoalReached"
    ADD CONSTRAINT "CommunityGoalReached_pkey" PRIMARY KEY (community_goal_meta_id, community_id);


--
-- Name: CommunityStakes CommunityStakes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommunityStakes"
    ADD CONSTRAINT "CommunityStakes_pkey" PRIMARY KEY (community_id, stake_id);


--
-- Name: CommunityTags CommunityTags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommunityTags"
    ADD CONSTRAINT "CommunityTags_pkey" PRIMARY KEY (community_id, tag_id);


--
-- Name: ContestActions ContestActions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContestActions"
    ADD CONSTRAINT "ContestActions_pkey" PRIMARY KEY (contest_address, contest_id, content_id, actor_address, action);


--
-- Name: ContestManagers ContestManagers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContestManagers"
    ADD CONSTRAINT "ContestManagers_pkey" PRIMARY KEY (contest_address);


--
-- Name: Contests Contests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Contests"
    ADD CONSTRAINT "Contests_pkey" PRIMARY KEY (contest_address, contest_id);


--
-- Name: DiscordBotConfig DiscordBotConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DiscordBotConfig"
    ADD CONSTRAINT "DiscordBotConfig_pkey" PRIMARY KEY (id);


--
-- Name: Dlq Dlq_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Dlq"
    ADD CONSTRAINT "Dlq_pkey" PRIMARY KEY (consumer, event_id);


--
-- Name: EvmEventSources EvmEventSources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EvmEventSources"
    ADD CONSTRAINT "EvmEventSources_pkey" PRIMARY KEY (eth_chain_id, contract_address, event_signature);


--
-- Name: GroupGatedActions GroupPermissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GroupGatedActions"
    ADD CONSTRAINT "GroupPermissions_pkey" PRIMARY KEY (group_id, topic_id);


--
-- Name: Groups Groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Groups"
    ADD CONSTRAINT "Groups_pkey" PRIMARY KEY (id);


--
-- Name: LastProcessedEvmBlocks LastProcessedEvmBlocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LastProcessedEvmBlocks"
    ADD CONSTRAINT "LastProcessedEvmBlocks_pkey" PRIMARY KEY (chain_node_id);


--
-- Name: LaunchpadTrades LaunchpadTrades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LaunchpadTrades"
    ADD CONSTRAINT "LaunchpadTrades_pkey" PRIMARY KEY (eth_chain_id, transaction_hash);


--
-- Name: EmailUpdateTokens LoginTokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmailUpdateTokens"
    ADD CONSTRAINT "LoginTokens_pkey" PRIMARY KEY (id);


--
-- Name: MCPServerCommunities MCPServerCommunities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MCPServerCommunities"
    ADD CONSTRAINT "MCPServerCommunities_pkey" PRIMARY KEY (mcp_server_id, community_id);


--
-- Name: MCPServers MCPServers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MCPServers"
    ADD CONSTRAINT "MCPServers_pkey" PRIMARY KEY (id);


--
-- Name: Memberships Memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Memberships"
    ADD CONSTRAINT "Memberships_pkey" PRIMARY KEY (address_id, group_id);


--
-- Name: Polls OffchainPolls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Polls"
    ADD CONSTRAINT "OffchainPolls_pkey" PRIMARY KEY (id);


--
-- Name: PinnedTokens PinnedTokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PinnedTokens"
    ADD CONSTRAINT "PinnedTokens_pkey" PRIMARY KEY (community_id);


--
-- Name: ProfileTags ProfileTags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProfileTags"
    ADD CONSTRAINT "ProfileTags_pkey" PRIMARY KEY (user_id, tag_id);


--
-- Name: QuestActionMetas QuestActionMetas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuestActionMetas"
    ADD CONSTRAINT "QuestActionMetas_pkey" PRIMARY KEY (id);


--
-- Name: QuestTweets QuestTweets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuestTweets"
    ADD CONSTRAINT "QuestTweets_pkey" PRIMARY KEY (tweet_id);


--
-- Name: Quests Quests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Quests"
    ADD CONSTRAINT "Quests_pkey" PRIMARY KEY (id);


--
-- Name: Reactions Reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Reactions"
    ADD CONSTRAINT "Reactions_pkey" PRIMARY KEY (id);


--
-- Name: ReferralFees ReferralFees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ReferralFees"
    ADD CONSTRAINT "ReferralFees_pkey" PRIMARY KEY (eth_chain_id, transaction_hash);


--
-- Name: Referrals Referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Referrals"
    ADD CONSTRAINT "Referrals_pkey" PRIMARY KEY (referrer_address, namespace_address, eth_chain_id);


--
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- Name: Sessions Sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Sessions"
    ADD CONSTRAINT "Sessions_pkey" PRIMARY KEY (sid);


--
-- Name: SsoTokens SsoTokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SsoTokens"
    ADD CONSTRAINT "SsoTokens_pkey" PRIMARY KEY (address_id);


--
-- Name: StakeTransactions StakeTransactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StakeTransactions"
    ADD CONSTRAINT "StakeTransactions_pkey" PRIMARY KEY (transaction_hash);


--
-- Name: StarredCommunities Starredcommunities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StarredCommunities"
    ADD CONSTRAINT "Starredcommunities_pkey" PRIMARY KEY (community_id, user_id);


--
-- Name: SubscriptionPreferences SubscriptionPreferences_user_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SubscriptionPreferences"
    ADD CONSTRAINT "SubscriptionPreferences_user_id_pk" PRIMARY KEY (user_id);


--
-- Name: Tags Tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Tags"
    ADD CONSTRAINT "Tags_pkey" PRIMARY KEY (id);


--
-- Name: ThreadRanks ThreadRanks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ThreadRanks"
    ADD CONSTRAINT "ThreadRanks_pkey" PRIMARY KEY (thread_id);


--
-- Name: ThreadSubscriptions ThreadSubscriptions_user_id_thread_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ThreadSubscriptions"
    ADD CONSTRAINT "ThreadSubscriptions_user_id_thread_id_pk" PRIMARY KEY (user_id, thread_id);


--
-- Name: ThreadVersionHistories ThreadVersionHistories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ThreadVersionHistories"
    ADD CONSTRAINT "ThreadVersionHistories_pkey" PRIMARY KEY (id);


--
-- Name: Threads Threads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Threads"
    ADD CONSTRAINT "Threads_pkey" PRIMARY KEY (id);


--
-- Name: LaunchpadTokens Tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LaunchpadTokens"
    ADD CONSTRAINT "Tokens_pkey" PRIMARY KEY (token_address);


--
-- Name: Topics Topics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Topics"
    ADD CONSTRAINT "Topics_pkey" PRIMARY KEY (id);


--
-- Name: TwitterCursors TwitterCursors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TwitterCursors"
    ADD CONSTRAINT "TwitterCursors_pkey" PRIMARY KEY (bot_name);


--
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


--
-- Name: Votes Votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Votes"
    ADD CONSTRAINT "Votes_pkey" PRIMARY KEY (id);


--
-- Name: Wallets Wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Wallets"
    ADD CONSTRAINT "Wallets_pkey" PRIMARY KEY (id);


--
-- Name: Webhooks Webhooks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Webhooks"
    ADD CONSTRAINT "Webhooks_pkey" PRIMARY KEY (id);


--
-- Name: XpLogs XpLogs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."XpLogs"
    ADD CONSTRAINT "XpLogs_pkey" PRIMARY KEY (id);


--
-- Name: Addresses addresses_hex_single_user_excl; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Addresses"
    ADD CONSTRAINT addresses_hex_single_user_excl EXCLUDE USING gist (hex WITH =, user_id WITH <>) WHERE (((hex IS NOT NULL) AND (user_id IS NOT NULL))) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: Addresses cosmos_requires_hex; Type: CHECK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE public."Addresses"
    ADD CONSTRAINT cosmos_requires_hex CHECK ((((wallet_id)::text <> ALL (ARRAY[('keplr'::character varying)::text, ('leap'::character varying)::text, ('cosm-metamask'::character varying)::text, ('terrastation'::character varying)::text, ('keplr-ethereum'::character varying)::text])) OR (((wallet_id)::text = ANY (ARRAY[('keplr'::character varying)::text, ('leap'::character varying)::text, ('cosm-metamask'::character varying)::text, ('terrastation'::character varying)::text, ('keplr-ethereum'::character varying)::text])) AND (hex IS NOT NULL)))) NOT VALID;


--
-- Name: CommunityDirectoryTags unique_community_tag_selected; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommunityDirectoryTags"
    ADD CONSTRAINT unique_community_tag_selected UNIQUE (community_id, tag_id, selected_community_id);


--
-- Name: Votes votes_user_id_not_null; Type: CHECK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE public."Votes"
    ADD CONSTRAINT votes_user_id_not_null CHECK ((user_id IS NOT NULL)) NOT VALID;


--
-- Name: XpLogs xp_logs_user_id_action_meta_id_event_created_at_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."XpLogs"
    ADD CONSTRAINT xp_logs_user_id_action_meta_id_event_created_at_name UNIQUE NULLS NOT DISTINCT (user_id, action_meta_id, event_created_at, name);


--
-- Name: Addresses_address_community_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Addresses_address_community_id" ON public."Addresses" USING btree (address, community_id);


--
-- Name: Communities_snapshot_spaces; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Communities_snapshot_spaces" ON public."Communities" USING btree (snapshot_spaces);


--
-- Name: MCPServerCommunities_community_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "MCPServerCommunities_community_id_index" ON public."MCPServerCommunities" USING btree (community_id);


--
-- Name: MCPServerCommunities_mcp_server_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "MCPServerCommunities_mcp_server_id_index" ON public."MCPServerCommunities" USING btree (mcp_server_id);


--
-- Name: MCPServers_name_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "MCPServers_name_unique" ON public."MCPServers" USING btree (name);


--
-- Name: Quests_community_id_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Quests_community_id_name_key" ON public."Quests" USING btree (community_id, name);


--
-- Name: address_trgm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX address_trgm_idx ON public."Addresses" USING gin (address public.gin_trgm_ops);


--
-- Name: addresses_community_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX addresses_community_id_idx ON public."Addresses" USING btree (community_id);


--
-- Name: addresses_oauth_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX addresses_oauth_email ON public."Addresses" USING btree (oauth_email);


--
-- Name: addresses_oauth_phone_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX addresses_oauth_phone_number ON public."Addresses" USING btree (oauth_phone_number);


--
-- Name: addresses_oauth_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX addresses_oauth_provider ON public."Addresses" USING btree (oauth_provider);


--
-- Name: addresses_oauth_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX addresses_oauth_username ON public."Addresses" USING btree (oauth_username);


--
-- Name: addresses_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX addresses_user_id ON public."Addresses" USING btree (user_id);


--
-- Name: comment_subscriptions_comment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX comment_subscriptions_comment_id ON public."CommentSubscriptions" USING btree (comment_id);


--
-- Name: comment_version_histories_comment_id_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX comment_version_histories_comment_id_timestamp ON public."CommentVersionHistories" USING btree (comment_id, "timestamp");


--
-- Name: comments_address_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX comments_address_id ON public."Comments" USING btree (address_id);


--
-- Name: comments_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX comments_parent_id ON public."Comments" USING btree (parent_id);


--
-- Name: comments_search; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX comments_search ON public."Comments" USING gin (search) WHERE ((marked_as_spam_at IS NULL) AND (deleted_at IS NULL));


--
-- Name: comments_thread_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX comments_thread_id ON public."Comments" USING btree (thread_id);


--
-- Name: communities_include_in_digest_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX communities_include_in_digest_email ON public."Communities" USING btree (include_in_digest_email);


--
-- Name: communities_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX communities_name ON public."Communities" USING btree (name);


--
-- Name: communities_namespace_address_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX communities_namespace_address_idx ON public."Communities" USING btree (namespace_address);


--
-- Name: community_name_trgm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX community_name_trgm_idx ON public."Communities" USING gin (name public.gin_trgm_ops);


--
-- Name: contests_start_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contests_start_time ON public."Contests" USING btree (start_time);


--
-- Name: groupgatedactions_is_private; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX groupgatedactions_is_private ON public."GroupGatedActions" USING btree (is_private, topic_id);


--
-- Name: groupgatedactions_topic_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX groupgatedactions_topic_id ON public."GroupGatedActions" USING btree (topic_id);


--
-- Name: groups_chain_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX groups_chain_id ON public."Groups" USING btree (community_id);


--
-- Name: idx_threads_is_not_spam; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_threads_is_not_spam ON public."Threads" USING btree (((marked_as_spam_at IS NULL)));


--
-- Name: idx_users_profile_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_profile_name ON public."Users" USING gin (((profile ->> 'name'::text)) public.gin_trgm_ops);


--
-- Name: launchpad_trades_token_address_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX launchpad_trades_token_address_timestamp ON public."LaunchpadTrades" USING btree (token_address, "timestamp");


--
-- Name: login_tokens_token_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX login_tokens_token_email ON public."EmailUpdateTokens" USING btree (token, email);


--
-- Name: memberships_group_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX memberships_group_id ON public."Memberships" USING btree (group_id);


--
-- Name: memberships_group_id_address_id_accepted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX memberships_group_id_address_id_accepted ON public."Memberships" USING btree (group_id, address_id) WHERE (reject_reason IS NULL);


--
-- Name: quest_action_metas_quest_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quest_action_metas_quest_id ON public."QuestActionMetas" USING btree (quest_id);


--
-- Name: quests_end_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quests_end_date ON public."Quests" USING btree (end_date);


--
-- Name: reactions_address_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reactions_address_id ON public."Reactions" USING btree (address_id);


--
-- Name: reactions_comment_id_address_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX reactions_comment_id_address_id ON public."Reactions" USING btree (comment_id, address_id) WHERE (comment_id IS NOT NULL);


--
-- Name: reactions_thread_id_address_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX reactions_thread_id_address_id ON public."Reactions" USING btree (thread_id, address_id) WHERE (thread_id IS NOT NULL);


--
-- Name: referrals_eth_chain_id_transaction_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX referrals_eth_chain_id_transaction_hash ON public."Referrals" USING btree (eth_chain_id, transaction_hash);


--
-- Name: referrals_referee_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX referrals_referee_address ON public."Referrals" USING btree (referee_address);


--
-- Name: referrals_referrer_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX referrals_referrer_address ON public."Referrals" USING btree (referrer_address);


--
-- Name: sso_tokens_issuer_address_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sso_tokens_issuer_address_id ON public."SsoTokens" USING btree (issuer, address_id);


--
-- Name: starred_communities_community_id_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX starred_communities_community_id_user_id ON public."StarredCommunities" USING btree (user_id, community_id);


--
-- Name: thread_subscriptions_thread_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX thread_subscriptions_thread_id ON public."ThreadSubscriptions" USING btree (thread_id);


--
-- Name: thread_version_histories_thread_id_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX thread_version_histories_thread_id_timestamp ON public."ThreadVersionHistories" USING btree (thread_id, "timestamp");


--
-- Name: threads_activity_rank_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX threads_activity_rank_date ON public."Threads" USING btree (activity_rank_date DESC NULLS LAST) WHERE (marked_as_spam_at IS NULL);


--
-- Name: threads_author_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX threads_author_id ON public."Threads" USING btree (address_id);


--
-- Name: threads_community_id_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX threads_community_id_created_at ON public."Threads" USING btree (community_id, created_at);


--
-- Name: threads_community_id_pinned; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX threads_community_id_pinned ON public."Threads" USING btree (community_id, pinned);


--
-- Name: threads_community_id_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX threads_community_id_updated_at ON public."Threads" USING btree (community_id, updated_at);


--
-- Name: threads_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX threads_created_at ON public."Threads" USING btree (created_at);


--
-- Name: threads_is_linking_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX threads_is_linking_token ON public."Threads" USING btree (is_linking_token);


--
-- Name: threads_search; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX threads_search ON public."Threads" USING gin (search) WHERE ((marked_as_spam_at IS NULL) AND (deleted_at IS NULL));


--
-- Name: threads_title_trgm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX threads_title_trgm_idx ON public."Threads" USING gin (title public.gin_trgm_ops) WHERE ((marked_as_spam_at IS NULL) AND (deleted_at IS NULL));


--
-- Name: topics_community_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX topics_community_id_idx ON public."Topics" USING btree (community_id);


--
-- Name: unique_profile_name_not_anonymous; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_profile_name_not_anonymous ON public."Users" USING btree (((profile ->> 'name'::text))) WHERE ((profile ->> 'name'::text) IS DISTINCT FROM 'Anonymous'::text);


--
-- Name: users_privy_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_privy_id ON public."Users" USING btree (privy_id);


--
-- Name: users_xp_points_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_xp_points_index ON public."Users" USING btree (xp_points);


--
-- Name: votes_poll_id_address; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX votes_poll_id_address ON public."Votes" USING btree (poll_id, address);


--
-- Name: Users insert_subscription_preference_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER insert_subscription_preference_trigger AFTER INSERT ON public."Users" FOR EACH ROW EXECUTE FUNCTION public.insert_subscription_preference();


--
-- Name: Outbox outbox_insert_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER outbox_insert_trigger AFTER INSERT ON public."Outbox" FOR EACH ROW EXECUTE FUNCTION public.notify_insert_outbox_function();


--
-- Name: Addresses Addresses_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Addresses"
    ADD CONSTRAINT "Addresses_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public."Communities"(id) ON UPDATE CASCADE;


--
-- Name: Addresses Addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Addresses"
    ADD CONSTRAINT "Addresses_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ApiKeys ApiKeys_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ApiKeys"
    ADD CONSTRAINT "ApiKeys_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id) ON DELETE CASCADE;


--
-- Name: ChainEventXpSources ChainEventXpSources_chain_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChainEventXpSources"
    ADD CONSTRAINT "ChainEventXpSources_chain_node_id_fkey" FOREIGN KEY (chain_node_id) REFERENCES public."ChainNodes"(id) ON DELETE CASCADE;


--
-- Name: ChainEventXpSources ChainEventXpSources_quest_action_meta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChainEventXpSources"
    ADD CONSTRAINT "ChainEventXpSources_quest_action_meta_id_fkey" FOREIGN KEY (quest_action_meta_id) REFERENCES public."QuestActionMetas"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Communities Chains_chain_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Communities"
    ADD CONSTRAINT "Chains_chain_node_id_fkey" FOREIGN KEY (chain_node_id) REFERENCES public."ChainNodes"(id);


--
-- Name: Communities Chains_discord_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Communities"
    ADD CONSTRAINT "Chains_discord_config_id_fkey" FOREIGN KEY (discord_config_id) REFERENCES public."DiscordBotConfig"(id);


--
-- Name: Collaborations Collaborations_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Collaborations"
    ADD CONSTRAINT "Collaborations_address_id_fkey" FOREIGN KEY (address_id) REFERENCES public."Addresses"(id);


--
-- Name: Collaborations Collaborations_offchain_thread_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Collaborations"
    ADD CONSTRAINT "Collaborations_offchain_thread_id_fkey" FOREIGN KEY (thread_id) REFERENCES public."Threads"(id);


--
-- Name: CommentSubscriptions CommentSubscriptions_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommentSubscriptions"
    ADD CONSTRAINT "CommentSubscriptions_comment_id_fkey" FOREIGN KEY (comment_id) REFERENCES public."Comments"(id) ON DELETE CASCADE;


--
-- Name: CommentSubscriptions CommentSubscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommentSubscriptions"
    ADD CONSTRAINT "CommentSubscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id) ON DELETE CASCADE;


--
-- Name: CommentVersionHistories CommentVersionHistories_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommentVersionHistories"
    ADD CONSTRAINT "CommentVersionHistories_comment_id_fkey" FOREIGN KEY (comment_id) REFERENCES public."Comments"(id);


--
-- Name: Comments Comments_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Comments"
    ADD CONSTRAINT "Comments_address_id_fkey" FOREIGN KEY (address_id) REFERENCES public."Addresses"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Comments Comments_thread_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Comments"
    ADD CONSTRAINT "Comments_thread_id_fkey" FOREIGN KEY (thread_id) REFERENCES public."Threads"(id);


--
-- Name: CommunityAlerts CommunityAlerts_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommunityAlerts"
    ADD CONSTRAINT "CommunityAlerts_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public."Communities"(id) ON DELETE CASCADE;


--
-- Name: CommunityAlerts CommunityAlerts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommunityAlerts"
    ADD CONSTRAINT "CommunityAlerts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id) ON DELETE CASCADE;


--
-- Name: CommunityDirectoryTags CommunityDirectoryTags_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommunityDirectoryTags"
    ADD CONSTRAINT "CommunityDirectoryTags_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public."Communities"(id) ON DELETE CASCADE;


--
-- Name: CommunityDirectoryTags CommunityDirectoryTags_selected_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommunityDirectoryTags"
    ADD CONSTRAINT "CommunityDirectoryTags_selected_community_id_fkey" FOREIGN KEY (selected_community_id) REFERENCES public."Communities"(id) ON DELETE CASCADE;


--
-- Name: CommunityDirectoryTags CommunityDirectoryTags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommunityDirectoryTags"
    ADD CONSTRAINT "CommunityDirectoryTags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES public."Tags"(id) ON DELETE CASCADE;


--
-- Name: CommunityGoalReached CommunityGoalReached_community_goal_meta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommunityGoalReached"
    ADD CONSTRAINT "CommunityGoalReached_community_goal_meta_id_fkey" FOREIGN KEY (community_goal_meta_id) REFERENCES public."CommunityGoalMetas"(id) ON DELETE CASCADE;


--
-- Name: CommunityGoalReached CommunityGoalReached_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommunityGoalReached"
    ADD CONSTRAINT "CommunityGoalReached_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public."Communities"(id) ON DELETE CASCADE;


--
-- Name: CommunityStakes CommunityStakes_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommunityStakes"
    ADD CONSTRAINT "CommunityStakes_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public."Communities"(id);


--
-- Name: ContestActions ContestActions_contests_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContestActions"
    ADD CONSTRAINT "ContestActions_contests_fkey" FOREIGN KEY (contest_address, contest_id) REFERENCES public."Contests"(contest_address, contest_id) ON DELETE CASCADE;


--
-- Name: ContestActions ContestActions_threads_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContestActions"
    ADD CONSTRAINT "ContestActions_threads_fkey" FOREIGN KEY (thread_id) REFERENCES public."Threads"(id);


--
-- Name: ContestManagers ContestManagers_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContestManagers"
    ADD CONSTRAINT "ContestManagers_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public."Communities"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ContestManagers ContestManagers_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContestManagers"
    ADD CONSTRAINT "ContestManagers_topic_id_fkey" FOREIGN KEY (topic_id) REFERENCES public."Topics"(id);


--
-- Name: Contests Contests_contestmanagers_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Contests"
    ADD CONSTRAINT "Contests_contestmanagers_fkey" FOREIGN KEY (contest_address) REFERENCES public."ContestManagers"(contest_address) ON DELETE CASCADE;


--
-- Name: DiscordBotConfig DiscordBotConfig_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DiscordBotConfig"
    ADD CONSTRAINT "DiscordBotConfig_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public."Communities"(id) ON DELETE CASCADE;


--
-- Name: GroupGatedActions GroupPermissions_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GroupGatedActions"
    ADD CONSTRAINT "GroupPermissions_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public."Groups"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GroupGatedActions GroupPermissions_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GroupGatedActions"
    ADD CONSTRAINT "GroupPermissions_topic_id_fkey" FOREIGN KEY (topic_id) REFERENCES public."Topics"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Groups Groups_chain_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Groups"
    ADD CONSTRAINT "Groups_chain_id_fkey" FOREIGN KEY (community_id) REFERENCES public."Communities"(id);


--
-- Name: LastProcessedEvmBlocks LastProcessedEvmBlocks_chain_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LastProcessedEvmBlocks"
    ADD CONSTRAINT "LastProcessedEvmBlocks_chain_node_id_fkey" FOREIGN KEY (chain_node_id) REFERENCES public."ChainNodes"(id);


--
-- Name: LaunchpadTrades LaunchpadTrades_token_address_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LaunchpadTrades"
    ADD CONSTRAINT "LaunchpadTrades_token_address_fkey" FOREIGN KEY (token_address) REFERENCES public."LaunchpadTokens"(token_address);


--
-- Name: MCPServerCommunities MCPServerCommunities_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MCPServerCommunities"
    ADD CONSTRAINT "MCPServerCommunities_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public."Communities"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MCPServerCommunities MCPServerCommunities_mcp_server_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MCPServerCommunities"
    ADD CONSTRAINT "MCPServerCommunities_mcp_server_id_fkey" FOREIGN KEY (mcp_server_id) REFERENCES public."MCPServers"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Memberships Memberships_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Memberships"
    ADD CONSTRAINT "Memberships_address_id_fkey" FOREIGN KEY (address_id) REFERENCES public."Addresses"(id);


--
-- Name: Memberships Memberships_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Memberships"
    ADD CONSTRAINT "Memberships_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public."Groups"(id);


--
-- Name: Polls OffchainPolls_chain_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Polls"
    ADD CONSTRAINT "OffchainPolls_chain_id_fkey" FOREIGN KEY (community_id) REFERENCES public."Communities"(id);


--
-- Name: Polls OffchainPolls_thread_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Polls"
    ADD CONSTRAINT "OffchainPolls_thread_id_fkey" FOREIGN KEY (thread_id) REFERENCES public."Threads"(id);


--
-- Name: PinnedTokens PinnedTokens_chain_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PinnedTokens"
    ADD CONSTRAINT "PinnedTokens_chain_node_id_fkey" FOREIGN KEY (chain_node_id) REFERENCES public."ChainNodes"(id) ON DELETE CASCADE;


--
-- Name: PinnedTokens PinnedTokens_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PinnedTokens"
    ADD CONSTRAINT "PinnedTokens_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public."Communities"(id) ON DELETE CASCADE;


--
-- Name: QuestActionMetas QuestActionMetas_community_goal_meta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuestActionMetas"
    ADD CONSTRAINT "QuestActionMetas_community_goal_meta_id_fkey" FOREIGN KEY (community_goal_meta_id) REFERENCES public."CommunityGoalMetas"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: QuestActionMetas QuestActionMetas_quest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuestActionMetas"
    ADD CONSTRAINT "QuestActionMetas_quest_id_fkey" FOREIGN KEY (quest_id) REFERENCES public."Quests"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: QuestTweets QuestTweets_quest_action_meta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuestTweets"
    ADD CONSTRAINT "QuestTweets_quest_action_meta_id_fkey" FOREIGN KEY (quest_action_meta_id) REFERENCES public."QuestActionMetas"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Quests Quests_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Quests"
    ADD CONSTRAINT "Quests_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public."Communities"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Reactions Reactions_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Reactions"
    ADD CONSTRAINT "Reactions_address_id_fkey" FOREIGN KEY (address_id) REFERENCES public."Addresses"(id);


--
-- Name: Reactions Reactions_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Reactions"
    ADD CONSTRAINT "Reactions_comment_id_fkey" FOREIGN KEY (comment_id) REFERENCES public."Comments"(id);


--
-- Name: Reactions Reactions_thread_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Reactions"
    ADD CONSTRAINT "Reactions_thread_id_fkey" FOREIGN KEY (thread_id) REFERENCES public."Threads"(id);


--
-- Name: SsoTokens SsoTokens_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SsoTokens"
    ADD CONSTRAINT "SsoTokens_address_id_fkey" FOREIGN KEY (address_id) REFERENCES public."Addresses"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: StarredCommunities Starredcommunities_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StarredCommunities"
    ADD CONSTRAINT "Starredcommunities_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public."Communities"(id) ON UPDATE CASCADE;


--
-- Name: StarredCommunities Starredcommunities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StarredCommunities"
    ADD CONSTRAINT "Starredcommunities_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id) ON UPDATE CASCADE;


--
-- Name: SubscriptionPreferences SubscriptionPreferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SubscriptionPreferences"
    ADD CONSTRAINT "SubscriptionPreferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id) ON DELETE CASCADE;


--
-- Name: ThreadRanks ThreadRanks_thread_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ThreadRanks"
    ADD CONSTRAINT "ThreadRanks_thread_id_fkey" FOREIGN KEY (thread_id) REFERENCES public."Threads"(id) ON DELETE CASCADE;


--
-- Name: ThreadSubscriptions ThreadSubscriptions_thread_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ThreadSubscriptions"
    ADD CONSTRAINT "ThreadSubscriptions_thread_id_fkey" FOREIGN KEY (thread_id) REFERENCES public."Threads"(id) ON DELETE CASCADE;


--
-- Name: ThreadSubscriptions ThreadSubscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ThreadSubscriptions"
    ADD CONSTRAINT "ThreadSubscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id) ON DELETE CASCADE;


--
-- Name: ThreadVersionHistories ThreadVersionHistories_thread_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ThreadVersionHistories"
    ADD CONSTRAINT "ThreadVersionHistories_thread_id_fkey" FOREIGN KEY (thread_id) REFERENCES public."Threads"(id);


--
-- Name: Threads Threads_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Threads"
    ADD CONSTRAINT "Threads_author_id_fkey" FOREIGN KEY (address_id) REFERENCES public."Addresses"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Threads Threads_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Threads"
    ADD CONSTRAINT "Threads_topic_id_fkey" FOREIGN KEY (topic_id) REFERENCES public."Topics"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Topics Topics_chain_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Topics"
    ADD CONSTRAINT "Topics_chain_node_id_fkey" FOREIGN KEY (chain_node_id) REFERENCES public."ChainNodes"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Topics Topics_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Topics"
    ADD CONSTRAINT "Topics_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public."Communities"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Users Users_selected_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_selected_community_id_fkey" FOREIGN KEY (selected_community_id) REFERENCES public."Communities"(id);


--
-- Name: Votes Votes_poll_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Votes"
    ADD CONSTRAINT "Votes_poll_id_fkey" FOREIGN KEY (poll_id) REFERENCES public."Polls"(id) ON DELETE CASCADE;


--
-- Name: Wallets Wallets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Wallets"
    ADD CONSTRAINT "Wallets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: Webhooks Webhooks_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Webhooks"
    ADD CONSTRAINT "Webhooks_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public."Communities"(id);


--
-- Name: XpLogs XpLogs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."XpLogs"
    ADD CONSTRAINT "XpLogs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."Users"(id) ON DELETE CASCADE;


--
-- Name: CommunityTags fk_CommunityTags_community_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommunityTags"
    ADD CONSTRAINT "fk_CommunityTags_community_id" FOREIGN KEY (community_id) REFERENCES public."Communities"(id) ON DELETE CASCADE;


--
-- Name: CommunityTags fk_CommunityTags_tag_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommunityTags"
    ADD CONSTRAINT "fk_CommunityTags_tag_id" FOREIGN KEY (tag_id) REFERENCES public."Tags"(id) ON DELETE CASCADE;


--
-- Name: ProfileTags fk_ProfileTags_tag_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProfileTags"
    ADD CONSTRAINT "fk_ProfileTags_tag_id" FOREIGN KEY (tag_id) REFERENCES public."Tags"(id) ON DELETE CASCADE;


--
-- Name: ProfileTags fk_ProfileTags_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProfileTags"
    ADD CONSTRAINT "fk_ProfileTags_user_id" FOREIGN KEY (user_id) REFERENCES public."Users"(id);


--
-- Name: ContestActions fk_contest_actions_contest_address; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContestActions"
    ADD CONSTRAINT fk_contest_actions_contest_address FOREIGN KEY (contest_address) REFERENCES public."ContestManagers"(contest_address) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: StakeTransactions fk_stake_transactions_community_stakes; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StakeTransactions"
    ADD CONSTRAINT fk_stake_transactions_community_stakes FOREIGN KEY (stake_id, community_id) REFERENCES public."CommunityStakes"(stake_id, community_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: XpLogs fk_xp_logs_action_meta_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."XpLogs"
    ADD CONSTRAINT fk_xp_logs_action_meta_id FOREIGN KEY (action_meta_id) REFERENCES public."QuestActionMetas"(id);


--
-- Name: XpLogs fk_xp_logs_creator_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."XpLogs"
    ADD CONSTRAINT fk_xp_logs_creator_user_id FOREIGN KEY (creator_user_id) REFERENCES public."Users"(id);


--
-- PostgreSQL database dump complete
--

