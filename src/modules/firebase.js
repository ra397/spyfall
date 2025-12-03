/**
 * Firebase Module
 * Handles all Firestore reads, writes, and listeners
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    onSnapshot,
    serverTimestamp,
    writeBatch,
    getDocs
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import stateManager from './stateManager.js';

export const firebaseConfig = {
    apiKey: "AIzaSyA-Z72TYnmyemq6cZqhlz_Hdba6IC3JhpE",
    authDomain: "spyfall-3af5b.firebaseapp.com",
    projectId: "spyfall-3af5b",
    storageBucket: "spyfall-3af5b.firebasestorage.app",
    messagingSenderId: "1006584234578",
    appId: "1:1006584234578:web:45b60fc569fe831eb4958b",
    measurementId: "G-8C0C9SDS9W"
};

// Initialize Firebase
let app;
let db;

// Active listeners
let gameUnsubscribe = null;
let playersUnsubscribe = null;

// Locations data (loaded from JSON)
let locationsData = null;

/**
 * Initialize Firebase and load locations data
 */
export async function initializeFirebase(config) {
    try {
        app = initializeApp(config || firebaseConfig);
        db = getFirestore(app);

        // Load locations data
        const response = await fetch('/locations.json');
        locationsData = await response.json();

        // Check for existing session
        await checkExistingSession();

        return true;
    } catch (error) {
        console.error('Firebase initialization error:', error);
        stateManager.setState({ error: 'Failed to initialize app' });
        return false;
    }
}

/**
 * Get locations list for display
 */
export function getLocations() {
    return locationsData?.locations?.map(loc => loc.name) || [];
}

/**
 * Generate a random 4-character uppercase alphanumeric code
 */
function generateGameCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Generate a unique player ID
 */
function generatePlayerId() {
    return `player_${crypto.randomUUID()}`;
}

/**
 * Get or create player ID from localStorage
 */
function getPlayerId() {
    let playerId = localStorage.getItem('spyfall_playerId');
    if (!playerId) {
        playerId = generatePlayerId();
        localStorage.setItem('spyfall_playerId', playerId);
    }
    return playerId;
}

/**
 * Check for existing session on page load
 */
async function checkExistingSession() {
    const playerId = getPlayerId();
    const savedGameCode = localStorage.getItem('spyfall_gameCode');
    const savedPlayerName = localStorage.getItem('spyfall_playerName');

    stateManager.setState({ playerId });

    if (savedGameCode && savedPlayerName) {
        try {
            // Check if player still exists in game
            const playerDoc = await getDoc(doc(db, 'players', playerId));

            if (playerDoc.exists() && playerDoc.data().gameCode === savedGameCode) {
                // Check if game still exists
                const gameDoc = await getDoc(doc(db, 'games', savedGameCode));

                if (gameDoc.exists()) {
                    const gameData = gameDoc.data();
                    const isOwner = gameData.ownerId === playerId;

                    stateManager.setState({
                        gameCode: savedGameCode,
                        playerName: savedPlayerName,
                        isOwner,
                        currentRoute: gameData.status === 'game' ? 'game' : 'lobby'
                    });

                    // Set up listeners
                    setupGameListeners(savedGameCode);
                    return;
                }
            }
        } catch (error) {
            console.error('Session check error:', error);
        }

        // Clear invalid session
        localStorage.removeItem('spyfall_gameCode');
        localStorage.removeItem('spyfall_playerName');
    }
}

/**
 * Create a new game
 */
export async function createGame(playerName) {
    // Validate player name
    if (!playerName || playerName.length < 1 || playerName.length > 12) {
        stateManager.setState({ error: 'Name must be 1-12 characters' });
        return false;
    }

    stateManager.setState({ loading: true, error: null });

    try {
        const playerId = getPlayerId();
        let gameCode;
        let gameExists = true;

        // Generate unique game code
        while (gameExists) {
            gameCode = generateGameCode();
            const gameDoc = await getDoc(doc(db, 'games', gameCode));
            gameExists = gameDoc.exists();
        }

        // Create game document
        await setDoc(doc(db, 'games', gameCode), {
            gameCode,
            status: 'lobby',
            duration: 480, // Default 8 minutes
            location: null,
            ownerId: playerId,
            lastInteraction: serverTimestamp()
        });

        // Add player to players collection
        await setDoc(doc(db, 'players', playerId), {
            playerId,
            playerName,
            gameCode,
            occupation: null
        });

        // Save to localStorage
        localStorage.setItem('spyfall_gameCode', gameCode);
        localStorage.setItem('spyfall_playerName', playerName);

        // Update state
        stateManager.setState({
            gameCode,
            playerName,
            isOwner: true,
            currentRoute: 'lobby',
            loading: false
        });

        // Set up listeners
        setupGameListeners(gameCode);

        return true;
    } catch (error) {
        console.error('Create game error:', error);
        stateManager.setState({
            error: 'Failed to create game',
            loading: false
        });
        return false;
    }
}

/**
 * Join an existing game
 */
export async function joinGame(playerName, gameCode) {
    // Validate inputs
    if (!playerName || playerName.length < 1 || playerName.length > 12) {
        stateManager.setState({ error: 'Name must be 1-12 characters' });
        return false;
    }

    if (!gameCode || gameCode.length !== 4) {
        stateManager.setState({ error: 'Invalid game code' });
        return false;
    }

    gameCode = gameCode.toUpperCase();
    stateManager.setState({ loading: true, error: null });

    try {
        // Check if game exists
        const gameDoc = await getDoc(doc(db, 'games', gameCode));

        if (!gameDoc.exists()) {
            stateManager.setState({ error: 'Game not found', loading: false });
            return false;
        }

        const gameData = gameDoc.data();

        // Check if game is in lobby
        if (gameData.status === 'game') {
            stateManager.setState({ error: 'Game is in session', loading: false });
            return false;
        }

        // Check for unique name
        const playersQuery = query(
            collection(db, 'players'),
            where('gameCode', '==', gameCode)
        );
        const playersSnapshot = await getDocs(playersQuery);

        const nameExists = playersSnapshot.docs.some(
            doc => doc.data().playerName.toLowerCase() === playerName.toLowerCase()
        );

        if (nameExists) {
            stateManager.setState({ error: 'Name already taken', loading: false });
            return false;
        }

        const playerId = getPlayerId();

        // Add player
        await setDoc(doc(db, 'players', playerId), {
            playerId,
            playerName,
            gameCode,
            occupation: null
        });

        // Update last interaction
        await updateDoc(doc(db, 'games', gameCode), {
            lastInteraction: serverTimestamp()
        });

        // Save to localStorage
        localStorage.setItem('spyfall_gameCode', gameCode);
        localStorage.setItem('spyfall_playerName', playerName);

        // Update state
        stateManager.setState({
            gameCode,
            playerName,
            isOwner: false,
            currentRoute: 'lobby',
            loading: false
        });

        // Set up listeners
        setupGameListeners(gameCode);

        return true;
    } catch (error) {
        console.error('Join game error:', error);
        stateManager.setState({
            error: 'Failed to join game',
            loading: false
        });
        return false;
    }
}

/**
 * Start a new round (owner only)
 */
export async function startRound() {
    const state = stateManager.getState();

    if (!state.isOwner) {
        stateManager.setState({ error: 'Only the owner can start the round' });
        return false;
    }

    stateManager.setState({ loading: true, error: null });

    try {
        const { gameCode } = state;

        // Get current players
        const playersQuery = query(
            collection(db, 'players'),
            where('gameCode', '==', gameCode)
        );
        const playersSnapshot = await getDocs(playersQuery);
        const players = playersSnapshot.docs.map(doc => doc.data());

        // Validate player count
        if (players.length < 3) {
            stateManager.setState({ error: 'Need at least 3 players', loading: false });
            return false;
        }

        if (players.length > 10) {
            stateManager.setState({ error: 'Maximum 10 players', loading: false });
            return false;
        }

        // Select random spy
        const spyIndex = Math.floor(Math.random() * players.length);

        // Select random location
        const locationIndex = Math.floor(Math.random() * locationsData.locations.length);
        const selectedLocation = locationsData.locations[locationIndex];

        // Shuffle occupations for random assignment
        const shuffledOccupations = [...selectedLocation.occupations]
            .sort(() => Math.random() - 0.5);

        // Create batch write
        const batch = writeBatch(db);

        // Update game status
        batch.update(doc(db, 'games', gameCode), {
            status: 'game',
            location: selectedLocation.name,
            lastInteraction: serverTimestamp()
        });

        // Assign roles to players
        let occupationIndex = 0;
        players.forEach((player, index) => {
            const isSpy = index === spyIndex;
            const occupation = isSpy
                ? 'Spy'
                : shuffledOccupations[occupationIndex++ % shuffledOccupations.length];

            batch.update(doc(db, 'players', player.playerId), {
                occupation
            });
        });

        await batch.commit();

        stateManager.setState({ loading: false });
        return true;
    } catch (error) {
        console.error('Start round error:', error);
        stateManager.setState({
            error: 'Failed to start round',
            loading: false
        });
        return false;
    }
}

/**
 * End the current round (owner only)
 */
export async function endRound() {
    const state = stateManager.getState();

    if (!state.isOwner) {
        stateManager.setState({ error: 'Only the owner can end the round' });
        return false;
    }

    stateManager.setState({ loading: true, error: null });

    try {
        const { gameCode } = state;

        // Get all players
        const playersQuery = query(
            collection(db, 'players'),
            where('gameCode', '==', gameCode)
        );
        const playersSnapshot = await getDocs(playersQuery);

        // Create batch write
        const batch = writeBatch(db);

        // Update game status
        batch.update(doc(db, 'games', gameCode), {
            status: 'lobby',
            location: null,
            lastInteraction: serverTimestamp()
        });

        // Clear all player occupations
        playersSnapshot.docs.forEach(playerDoc => {
            batch.update(doc(db, 'players', playerDoc.id), {
                occupation: null
            });
        });

        await batch.commit();

        stateManager.setState({ loading: false });
        return true;
    } catch (error) {
        console.error('End round error:', error);
        stateManager.setState({
            error: 'Failed to end round',
            loading: false
        });
        return false;
    }
}

/**
 * Update game duration (owner only)
 */
export async function updateDuration(duration) {
    const state = stateManager.getState();

    if (!state.isOwner) return false;

    try {
        await updateDoc(doc(db, 'games', state.gameCode), {
            duration: parseInt(duration),
            lastInteraction: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Update duration error:', error);
        return false;
    }
}

/**
 * Leave the current game
 */
export async function leaveGame() {
    const state = stateManager.getState();

    try {
        // Remove player from game
        await deleteDoc(doc(db, 'players', state.playerId));

        // Clear localStorage
        localStorage.removeItem('spyfall_gameCode');
        localStorage.removeItem('spyfall_playerName');

        // Clean up listeners
        cleanupListeners();

        // Reset state
        stateManager.resetGame();

        return true;
    } catch (error) {
        console.error('Leave game error:', error);
        return false;
    }
}

/**
 * Set up real-time listeners for game and players
 */
function setupGameListeners(gameCode) {
    // Clean up existing listeners
    cleanupListeners();

    const playerId = getPlayerId();

    // Listen to game document
    gameUnsubscribe = onSnapshot(
        doc(db, 'games', gameCode),
        (snapshot) => {
            if (snapshot.exists()) {
                const gameData = snapshot.data();
                const currentState = stateManager.getState();

                stateManager.setState({
                    game: gameData,
                    isOwner: gameData.ownerId === playerId,
                    currentRoute: gameData.status === 'game' ? 'game' : 'lobby'
                });
            } else {
                // Game was deleted
                cleanupListeners();
                localStorage.removeItem('spyfall_gameCode');
                localStorage.removeItem('spyfall_playerName');
                stateManager.resetGame();
                stateManager.setState({ error: 'Game no longer exists' });
            }
        },
        (error) => {
            console.error('Game listener error:', error);
        }
    );

    // Listen to players collection
    const playersQuery = query(
        collection(db, 'players'),
        where('gameCode', '==', gameCode)
    );

    playersUnsubscribe = onSnapshot(
        playersQuery,
        (snapshot) => {
            const players = snapshot.docs.map(doc => doc.data());

            // Find current player's data
            const currentPlayer = players.find(p => p.playerId === playerId);

            stateManager.setState({
                players,
                occupation: currentPlayer?.occupation || null
            });
        },
        (error) => {
            console.error('Players listener error:', error);
        }
    );
}

/**
 * Clean up all active listeners
 */
function cleanupListeners() {
    if (gameUnsubscribe) {
        gameUnsubscribe();
        gameUnsubscribe = null;
    }
    if (playersUnsubscribe) {
        playersUnsubscribe();
        playersUnsubscribe = null;
    }
}

export { cleanupListeners };