/**
 * State Manager Module
 * Centralized reactive store for application state
 */

const stateManager = (() => {
    // Initial state
    let state = {
        // Routing
        currentRoute: 'home', // 'home' | 'lobby' | 'game'

        // Player identity (persisted in localStorage)
        playerId: null,
        playerName: null,

        // Current game
        gameCode: null,
        isOwner: false,

        // Game document data
        game: null, // { gameCode, status, duration, location, ownerId, lastInteraction }

        // Players in game
        players: [], // [{ playerId, playerName, gameCode, occupation }]

        // Current player's role
        occupation: null,
        location: null,

        // UI state
        error: null,
        loading: false
    };

    // Subscribers
    const subscribers = new Set();

    /**
     * Get current state snapshot
     */
    function getState() {
        return { ...state };
    }

    /**
     * Update state with partial object
     */
    function setState(partialState) {
        state = { ...state, ...partialState };
        notifySubscribers();
    }

    /**
     * Subscribe to state changes
     * @param {Function} callback - Called on every state change
     * @returns {Function} Unsubscribe function
     */
    function subscribe(callback) {
        subscribers.add(callback);
        return () => subscribers.delete(callback);
    }

    /**
     * Notify all subscribers of state change
     */
    function notifySubscribers() {
        subscribers.forEach(callback => {
            try {
                callback(state);
            } catch (err) {
                console.error('Subscriber error:', err);
            }
        });
    }

    /**
     * Reset state to initial values (keeping playerId)
     */
    function resetGame() {
        const playerId = state.playerId;
        setState({
            currentRoute: 'home',
            playerName: null,
            gameCode: null,
            isOwner: false,
            game: null,
            players: [],
            occupation: null,
            location: null,
            error: null,
            loading: false,
            playerId
        });
    }

    return {
        getState,
        setState,
        subscribe,
        resetGame
    };
})();

export default stateManager;