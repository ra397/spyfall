## Project Overview
Spyfall is real-time multiplayer web app using Firebase Firestore as the only backend. The game supports multiple rounds inside one persistent lobby, and players remain in the lobby until they manually leave.

## Core features
1. Game Creation
    - User enters a player name (unique within game, 1–12 chars).
    - System auto-generates a 4-character alphanumeric game code, uppercase, stored in Firestore.
    - User becomes the game owner.
    - Create a game document in the top-level `/games` collection with:
        - `gameCode` (string, 4-char uppercase)
        - `status`: "lobby" or "game"
        - `duration`: integer (seconds) set by owner before round
        - `location`: string (set at round start, cleared at round end)
        - `ownerId`: a persistent ID stored in client localStorage
        - `lastInteraction`: timestamp (update on any action)
    - The owner is automatically added to the `/players` top-level collection.

2. Joining a Game
    - User enters player name and game code.
    - Validations:
        - Name must be unique in the game.
        - Name length 1–12 chars.
        - Game must exist.
        - Game must be in lobby.
        - If status = "game" → show error: "Game is in session".
    - On success, the user is added to `/players`.

3. Lobby
    - Display:
        - Game code
        - Realtime list of players (from /players filtered by gameCode)
        - Static predefined list of all Spyfall locations
    - The owner additionally sees:
        - Duration selector (seconds)
        - "Start Round" button (only enabled if 3–10 players).

4. Starting a round (Game owner only)
    - Preconditions
        - Game has 3 or more players.
        - Game has 10 or fewer players.
    - On start
        - Game status → `"game"`.
        - Randomly select one spy among players.
        - Randomly select one location from predefined JSON.
        - For each non-spy:
            - Assign an occupation randomly from location’s occupation list.
        - For the spy:
            - occupation = "Spy"
    - All players are redirected to the game screen in realtime.
    - Timer
        - Timer starts client-side when status changes to "game"
        - When it reaches 00:00, nothing happens automatically—only owner can end the round.
5. Game
    - All players see:
        - Their assigned occupation
            - If non-spy: also the location
            - If spy: location unknown
        - List of all players (realtime)
        - List of all Spyfall locations (static)
        - Client-side countdown timer based on round duration
    - Game owner additionally sees:
        - End Round button (returns game to lobby)
6. Ending a round (Game owner only)
    - When owner ends the round:
        - Game status → `"lobby"`.
        - `location` is cleared.
        - All player `occupation` fields are cleared.
        - Duration remains unchanged until owner updates it.
        - All players return to lobby screen.
7. Other
    - Late Join
        - If a user attempts to join while status = `"game"`
            - Reject the join attempt with an error: "Game is in session".   
    - Player Persistance (LocalStorage)
        - Players should persist across refresh:
            - A persistent localStorage playerId identifies them.
            - On refresh, if the player is still in the `/players` list for that game, they rejoin automatically, otherwise, they must re-enter name + code.

## Database Design
Use two top-level collections: 
- `/games/{gameCode}`
    - gameCode (string)
    - status ("lobby" | "game")
    - duration (number, seconds)
    - location (string | null)
    - ownerId (string)
    - lastInteraction (timestamp)
- `/players/{playerId}`
    - playerId (same as document ID; stored in localStorage)
    - playerName
    - gameCode (foreign key)
    - occupation (string | null)

Automatic Cleanup:
- Games auto-delete after 40 minutes of inactivity defined by `lastInteraction`
- Deletes all players in `/players` where `gameCode` = deletedGame

## Project Architecture
The application is built around three isolated modules, each with a single responsibility:
1. UI Layer (Web Components)
2. State Manager (global reactive store)
3. Firebase Module (Firestore reads, writes, listeners)
- Data flow:
```
UI → Firebase (via firebase module)
Firebase → StateManager (incoming realtime updates)
StateManager → UI (reactive updates)
```
### UI Module
- All UI elements are custom Web Components extending `HTMLElement`.
- Each component has:
    - A shadow DOM
    - Internal render() method
    - A stateManager subscription created on connectedCallback()
    - Cleanup in disconnectedCallback()
- Responsibilities:
    - Render UI based on current state snapshot
    - Listen to state changes via a subscription
    - Dispatch user intentions via direct calls to Firebase module’s public functions
    - DO NOT modify global state directly or communicate with Firestore on your own.
- Example:
```javascript
class CustomComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.unsubscribe = null;
    }

    connectedCallback() {
        // initial render
        this.render();

        // subscribe to global state manager
        this.unsubscribe = stateManager.subscribe(() => {
            // when state changes, re-render only what’s needed
            this.render();
        });

        // bind event listeners here
    }

    disconnectedCallback() {
        // remove subscriptions and listeners
        if (this.unsubscribe) this.unsubscribe();
    }

    render() {
        const state = stateManager.getState();
        // Render HTML based on state
        this.shadowRoot.innerHTML = `
            <style>
                /* minimal UI rules */
            </style>

            <div></div>
        `;
    }
}

customElements.define('custom-component', CustomComponent);
```
- UI routing
```javascript
class AppRoot extends HTMLElement {
    connectedCallback() {
        this.unsubscribe = stateManager.subscribe(() => this.render());
        this.render();
    }

    render() {
        const state = stateManager.getState();
        const route = state.currentRoute;
        const screenTag = router.routes[route] || 'app-error';

        this.innerHTML = `<${screenTag}></${screenTag}>`;
    }
}

customElements.define('app-root', AppRoot);
```

### State Module
A centralized store that provides:
- `getState()`
- `setState(partialObject)`
- `subscribe(callback)`
- DO NOT perofrm firestore reads/writes, knows anything about DOM.
### Firebase Module
- Handles creating games, joining games, listening to updates, updating firestore on user intent, and convert firestore snapshots to state updates.
- Provides public functions like `createGame`, `joinGame`, `startRound`, `endRound`.
- Updates Firestore using safe transactions when needed.
- Subscribes to Firestore listeners game document and players collection.
- DO NOT modify DOM or call components directly or store UI logic.

## Styling and Aesthetic
Minimal necessary CSS inside Web Components using `<style>` tags. Please use as much native HTML elements such as `<ul>` to display the players list. For now, let's only focus on functionality, so keep UI minimal.