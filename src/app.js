/**
 * Spyfall Application Entry Point
 */

// Import modules
import stateManager from './modules/stateManager.js';
import { initializeFirebase } from './modules/firebase.js';

// Import components
import './components/AppRoot.js';
import './components/HomeScreen.js';
import './components/LobbyScreen.js';
import './components/GameScreen.js';

// Firebase configuration
import { firebaseConfig } from "./modules/firebase.js";

// Initialize application
async function init() {
    document.body.innerHTML = '<p style="text-align: center; margin-top: 50px;">Loading...</p>';
    const success = await initializeFirebase(firebaseConfig);
    if (success) {
        // Mount the app
        document.body.innerHTML = '<app-root></app-root>';
    } else {
        document.body.innerHTML = `
            <div style="text-align: center; margin-top: 50px; color: #dc3545;">
                <h1>Failed to initialize</h1>
                <p>Please check your Firebase configuration and try again.</p>
            </div>
        `;
    }
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}