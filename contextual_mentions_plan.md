# Plan for Enhanced Contextual Mentions and AI Interaction

## I. Extend Mention System (`use_mention.tsx` and related Quill configuration)

1.  **Define Denotation Characters & Configuration:**
    *   Users: `@` (also acts as a global multi-entity search trigger)
    *   Topics: `#` (specific topic search)
    *   Threads: `!` (specific thread search)
    *   Communities: `~` (specific community search)
    *   Update `QuillMention` module configuration. Each denotation character needs its own configuration.

2.  **Modify `use_mention.tsx`:**
    *   **`source` function:**
        *   Aware of `mentionChar` to determine entity type and search strategy.
        *   **If `mentionChar` is `@`:**
            *   Construct `SearchQuery` with `searchScope: [SearchScope.All]` (or a specific list like `[SearchScope.Members, SearchScope.Topics, SearchScope.Threads, SearchScope.Communities, SearchScope.Proposals]`).
            *   `communityScope` must be `undefined` for global search.
        *   **If `mentionChar` is `#`, `!`, or `~`:**
            *   Construct `SearchQuery` with the specific single `SearchScope` (e.g., `[SearchScope.Topics]` for `#`).
            *   `communityScope` can be current community or `undefined` for global specific search (TBD: default behavior for these, assume global if undefined for now).
        *   Calls the existing search API with the configured `SearchQuery`.
        *   The typeahead limit (e.g., ~7 results) applies to the search.
    *   **`renderItem` function:**
        *   Must handle potentially mixed entity types, especially for `@` search results. Each search result item from the API (when `SearchScope.All` is used) must include a `type: string` field (e.g., 'user', 'topic', 'thread').
        *   Displays appropriate icons/formatting based on `item.type`.
    *   **`onSelect` function:**
        *   Crucially, when an item is selected (from any denotation character search, but especially important for `@`), inspects `item.type` to determine the correct denotation character and format for the inserted mention string.
            *   E.g., if `item.type === 'topic'` (even if found via `@`), inserts `[#${item.name}](topic:${item.id})`.
            *   E.g., if `item.type === 'user'`, inserts `[@${item.name}](user:${item.id})`.

## II. Contextual Data Aggregation (Primarily Server-Side)

1.  **New Client-Side Hook: `useMentionExtractor.ts`:**
    *   Input: Current editor content (Delta or text).
    *   Responsibility: Parses editor content to extract a list of unique mention identifiers and their types/names based on the *inserted mention format* (e.g., `[{ type: 'user', id: 'usr_123', name: 'Alice' }, { type: 'topic', id: 'top_456', name: 'General Discussion' }]`). Note: the `type` here is derived from the parsed link format (e.g., `user:` prefix implies user type).
    *   Returns this list of extracted mention objects.

2.  **New Backend Endpoint: `POST /api/ai/aggregate-context`:**
    *   Input: `mentions: Array<{ type: string, id: string, name?: string }>` (from `useMentionExtractor`).
    *   Responsibility:
        *   For each mention, fetches required data based on `type` and `id` using internal services/data access:
            *   **User (`user` type):** Profile bio + last 3 comments.
            *   **Topic (`topic` type):** Topic description + titles/summaries of last 3-5 relevant threads.
            *   **Thread (`thread` type):** Original post (truncated) + content/summaries of top 3-5 comments.
            *   **Community (`community` type):** Community description + titles/summaries of last 3 active threads.
        *   Formats this data into descriptive context strings (e.g., `User @Alice (Bio: ..., Recent Comments: \"...\")`).
    *   Output: `{ contextualPrompts: string[] }` (array of formatted context strings).

## III. Integrate Context into AI Prompts

1.  **Modify `useAiCompletion.ts` (Client):**
    *   When AI generation is triggered (e.g., in `StickyInput`, `NewThreadForm`, `CommentEditor`):
        1.  Call `useMentionExtractor` to get mention identifiers from the current editor content.
        2.  If mentions are found, call the new `POST /api/ai/aggregate-context` backend endpoint with these identifiers.
        3.  Receive `contextualPrompts` from the backend.
        4.  Pass these `contextualPrompts` as an argument to its `generateCompletion` function.
    *   The `generateCompletion` function in `useAiCompletion.ts` will add `contextualPrompts` to the request body sent to `/api/aicompletion`.

2.  **Modify `aiCompletionHandler.ts` (Backend - `/api/aicompletion` endpoint):**
    *   If `contextualPrompts` (e.g., `string[]`) is received in the request body:
        *   Prepend to `finalSystemPrompt` or create a new structured system message part:
            \`\`\`
            ADDITIONAL CONTEXT FROM APPLICATION:
            \${contextualPrompts.join('\\n')}
            ---
            \`\`\`

3.  **Review `prompts.ts`:**
    *   Adjust system prompts to guide the LLM on effectively using the "ADDITIONAL CONTEXT FROM APPLICATION" when present.

## IV. Update Components to Trigger Context Aggregation

*(No significant change here from the original plan, components will indirectly trigger context aggregation via `useAiCompletion.ts`)*

1.  **`StickyInput.tsx`:** When `handleGenerateAIContent` calls `generateCompletion` (from `useAiCompletion`).
2.  **`NewThreadForm.tsx`:** When `handleGenerateAIThread` calls `generateCompletion`.
3.  **`CommentEditor.tsx`:** When `handleCommentWithAI` calls `generateCompletion`.

## V. API Adjustments

1.  **`SearchQuery.ts` (Client Model):**
    *   Add `Topics` to `SearchScope` enum and related constants/arrays (if not already present). Ensure `Proposals` is also included if desired in `@` global search.
2.  **Existing Search API (Backend - e.g., `/api/search`):**
    *   Ensure it handles `SearchScope.Topics` (and `SearchScope.Proposals` if included).
    *   When `searchScope` is `SearchScope.All` (or the array of multiple types for `@` search) and `communityScope` is `undefined`, it must perform a global search across these entities and return a `type: string` field for each result item.
3.  **New Backend Endpoint: `POST /api/ai/aggregate-context`** (as detailed in Section II.2).
4.  **New API Endpoint (Backend): `GET /api/users/{userId}/comments?limit=3&sortBy=createdAt:desc`**
    *   Returns last 3 comments by a user (needed by `/api/ai/aggregate-context`).
5.  **Verify/Update Existing Endpoints (used by `/api/ai/aggregate-context`):**
    *   Profile fetching includes bio.
    *   Thread fetching is filterable by topic & sortable, and can return summaries if needed.
    *   Thread details include OP and efficient comment fetching (possibly with summaries).
    *   Community details are comprehensive.

## VI. Iteration and Refinement
*   Test and iterate on context string formats for LLM effectiveness.
*   Monitor and optimize performance of context aggregation on the backend.
*   Confirm default search scope (current community vs. global) for specific denotations like `#`, `!`, `~`. For `@`, it's explicitly global. 