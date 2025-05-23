# Plan for Enhanced Contextual Mentions and AI Interaction

### Overview

This plan outlines the steps to implement an enhanced contextual mention system. The goal is to allow users to mention various platform entities (Users, Topics, Threads, Communities, Proposals) within text editors. The `@` symbol will trigger a global multi-entity search, while `#`, `!`, and `~` will allow for specific entity type searches. This contextual information will be dynamically fetched (primarily server-side) and provided to the AI to generate more relevant and informed responses. The implementation involves client-side UI changes for mentions, new backend logic for context aggregation, and modifications to the AI prompting mechanism.

## I. Extend Mention System (`use_mention.tsx` and related Quill configuration)

**Tasks:**
- [ ] Define denotation characters (`@`, `#`, `!`, `~`) and their roles (global vs. specific search).
- [ ] Update `QuillMention` module configuration for each denotation character.
- [ ] Modify `use_mention.tsx` - `source` function:
    - [ ] Handle `@` for global multi-entity search (`SearchScope.All`, global `communityScope`).
    - [ ] Handle `#`, `!`, `~` for specific entity searches (respective `SearchScope`, configurable `communityScope`).
    - [ ] Ensure existing search API is called correctly with constructed `SearchQuery`.
    - [ ] Implement typeahead result limiting (e.g., ~7 results).
- [ ] Modify `use_mention.tsx` - `renderItem` function:
    - [ ] Handle mixed entity types from `@` search (requires `item.type` from API).
    - [ ] Display appropriate icons/formatting based on `item.type`.
- [ ] Modify `use_mention.tsx` - `onSelect` function:
    - [ ] Inspect `item.type` upon selection.
    - [ ] Insert the correct specific mention format (e.g., `[#Topic Name](topic:topicId)`) based on `item.type`.

## II. Contextual Data Aggregation (Primarily Server-Side)

**Tasks:**
- [ ] Create new client-side hook: `useMentionExtractor.ts`.
    - [ ] Implement logic to parse editor content for inserted mention formats.
    - [ ] Extract unique mention identifiers, types, and names.
    - [ ] Return the list of extracted mention objects.
- [ ] Develop new backend endpoint: `POST /api/ai/aggregate-context`.
    - [ ] Define input structure: `mentions: Array<{ type: string, id: string, name?: string }>` (from `useMentionExtractor`).
    - [ ] Implement data fetching logic for each mention `type` (`user`, `topic`, `thread`, `community`).
        - [ ] Fetch user profile bio & last 3 comments.
        - [ ] Fetch topic description & recent thread titles/summaries.
        - [ ] Fetch thread OP (truncated) & top comment content/summaries.
        - [ ] Fetch community description & recent active thread titles/summaries.
    - [ ] Implement formatting of fetched data into descriptive context strings.
    - [ ] Define output structure: `{ contextualPrompts: string[] }` (array of formatted context strings).

## III. Integrate Context into AI Prompts

**Tasks:**
- [ ] Modify `useAiCompletion.ts` (Client):
    - [ ] Integrate `useMentionExtractor` to get identifiers from editor content.
    - [ ] Add logic to call `POST /api/ai/aggregate-context` if mentions are found.
    - [ ] Pass `contextualPrompts` received from backend to `generateCompletion` function.
    - [ ] Ensure `generateCompletion` adds `contextualPrompts` to the request body for `/api/aicompletion`.
- [ ] Modify `aiCompletionHandler.ts` (Backend - `/api/aicompletion` endpoint):
    - [ ] Handle `contextualPrompts` array in the request body.
    - [ ] Prepend/structure this context into the `finalSystemPrompt` for the LLM.
- [ ] Review and update `prompts.ts`:
    - [ ] Adjust system prompts to guide LLM on using "ADDITIONAL CONTEXT FROM APPLICATION".

## IV. Update Components to Trigger Context Aggregation

**Tasks:**
- [ ] Verify `StickyInput.tsx` correctly triggers context aggregation via `useAiCompletion` when `handleGenerateAIContent` is called.
- [ ] Verify `NewThreadForm.tsx` correctly triggers context aggregation via `useAiCompletion` when `handleGenerateAIThread` is called.
- [ ] Verify `CommentEditor.tsx` correctly triggers context aggregation via `useAiCompletion` when `handleCommentWithAI` is called.

## V. API Adjustments

**Tasks:**
- [ ] Update `SearchQuery.ts` (Client Model):
    - [ ] Add `Topics` to `SearchScope` enum and related constants (if not present).
    - [ ] Ensure `Proposals` is included in `SearchScope` if it's part of the global `@` search.
- [ ] Update Existing Search API (Backend - e.g., `/api/search`):
    - [ ] Ensure handling for `SearchScope.Topics` (and `Proposals`).
    - [ ] For `SearchScope.All` (or multi-type array for `@` search) with global `communityScope`, ensure global search across entities and return of `type: string` for each result.
- [ ] Implement new backend endpoint: `POST /api/ai/aggregate-context` (as per Section II tasks).
- [ ] Implement new API endpoint (Backend): `GET /api/users/{userId}/comments?limit=3&sortBy=createdAt:desc`.
- [ ] Verify/Update existing data-fetching endpoints (used by `/api/ai/aggregate-context`):
    - [ ] Ensure profile fetching returns bio.
    - [ ] Ensure thread fetching is filterable, sortable, and can provide summaries.
    - [ ] Ensure thread detail fetching includes OP and efficient comment retrieval (possibly with summaries).
    - [ ] Ensure community detail fetching is comprehensive.

## VI. Iteration and Refinement

**Tasks:**
- [ ] Conduct testing on various mention scenarios and context generation.
- [ ] Iterate on context string formats based on LLM performance and relevance.
- [ ] Monitor and optimize backend performance for context aggregation.
- [ ] Confirm and document default search scope (current community vs. global) for specific denotations (`#`, `!`, `~`).
- [ ] Add comprehensive unit and integration tests for new hooks, components, and API endpoints. 