# Shared frontend game flow

All four games use the backend catalog for levels/progress and `CompletedRound` for the final outcome, rewards and level changes. Each game keeps the input controls that fit its answers; frontend code does not calculate account EXP.

## Shared pieces

- `features/shared-game/registry.ts`: labels, routes, colors and units.
- `api/games.api.ts`: common create, recall, submit and read-completed-session calls.
- `utils/deadline.ts` and `hooks/usePhaseTimer.ts`: convert the server clock and count down the actual remaining phase time. Retrying recall does not restart the timer.
- `completion.ts`: notify profile/dashboard and refresh the catalog once per completed session. API adapters retain data; the active store triggers completion effects after accepting a response.
- `utils/completedRound.ts`: choose result copy and actions from the server's grade and unlocked levels. A passing round can still leave the next level locked.
- `components/RoundResultCard.tsx`: shared verdict, score, accuracy, EXP breakdown, records, account level, streak and replay/next actions.

## Game adapters

Cards and Images retain their existing boards and stores. They submit through `gamesApi` and retain the complete `CompletedRound`. Responses from a reset session are ignored and changing account clears old rounds.

FaceName retains the complete response as `result.round` as well as its portrait/name review fields. Fractional or negative game points are separate from the account EXP returned by the server. Original person order is preserved when sending the answer array; only visual recall order is shuffled.

Signed-in Numbers retains its `/numbers` adapter, autosave queue, revision checks and daily-attempt status. After submission, its result screen reads the corresponding shared session through `GET /game-sessions/:id`. This only reads a result; retrying does not submit answers again or trigger a reward write.

Guest Numbers is public and uses the shared cookie-owned create/recall/submit endpoints for level and custom practice. Drafts stay in memory in the current tab. The adapter retains the submitted `CompletedRound`, so results never request protected account history. Login/logout clears guest drafts and ignores late responses. Guest progress comes from the backend catalog, is temporary and earns no account EXP. The Numbers daily challenge requires login.

If the shared Numbers result cannot be loaded, the original correct/wrong/blank counts and digit comparison remain visible. The UI offers a read retry and does not substitute zero EXP or guess whether a level unlocked. Legacy sessions that were not imported into shared history can have no shared reward response.

Numbers daily results return to Numbers settings. Global card/image challenges retain their leaderboard link. Guest results show the guest explanation instead of an invented `+0 EXP` reward.

## Extending a game

Add its UI metadata to the registry, render the game-specific memorize/recall board, and return the backend `CompletedRound` unchanged. Reuse the shared timer, completion notification and result card. Keep autosave capabilities inside a transport/store that needs them rather than adding conditional branches for every game to one large store.

## Verification

`npm test` covers the API adapter, score/unlock presentation, completion effects, server clock conversion, stale responses, account changes and existing Numbers autosave/revision behavior. Browser checks use controlled API responses for all four result screens at 1440, 768 and 390px, including a failed Numbers reward read followed by a successful read retry.

Deploy the shared-core backend before this frontend. Real MongoDB transaction verification remains in the backend integration suites; the frontend browser fixtures do not validate database writes.
