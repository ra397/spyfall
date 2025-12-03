/**
 * Lobby Screen Component
 * Display players, locations, and game controls
 */

import stateManager from '../modules/stateManager.js';
import { startRound, updateDuration, leaveGame, getLocations } from '../modules/firebase.js';

class LobbyScreen extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.unsubscribe = null;
    }

    connectedCallback() {
        this.render();
        this.unsubscribe = stateManager.subscribe(() => this.render());
    }

    disconnectedCallback() {
        if (this.unsubscribe) this.unsubscribe();
    }

    bindEvents() {
        // Start round button
        const startBtn = this.shadowRoot.querySelector('#start-btn');
        if (startBtn) {
            startBtn.onclick = async () => {
                await startRound();
            };
        }

        // Duration selector
        const durationSelect = this.shadowRoot.querySelector('#duration-select');
        if (durationSelect) {
            durationSelect.onchange = async (e) => {
                await updateDuration(e.target.value);
            };
        }

        // Leave button
        const leaveBtn = this.shadowRoot.querySelector('#leave-btn');
        if (leaveBtn) {
            leaveBtn.onclick = async () => {
                await leaveGame();
            };
        }
    }

    render() {
        const state = stateManager.getState();
        const locations = getLocations();
        const playerCount = state.players.length;
        const canStart = playerCount >= 3 && playerCount <= 10;
        const duration = state.game?.duration || 480;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                
                h1 {
                    margin: 0;
                    font-size: 1.5em;
                }
                
                .game-code {
                    background: #f0f0f0;
                    padding: 8px 16px;
                    border-radius: 4px;
                    font-family: monospace;
                    font-size: 1.4em;
                    font-weight: bold;
                    letter-spacing: 2px;
                }
                
                .section {
                    background: #f5f5f5;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 15px;
                }
                
                .section h2 {
                    margin: 0 0 10px 0;
                    font-size: 1.1em;
                }
                
                ul {
                    margin: 0;
                    padding-left: 20px;
                }
                
                li {
                    padding: 4px 0;
                }
                
                .player-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .owner-badge {
                    background: #ffc107;
                    color: #000;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 0.75em;
                    font-weight: bold;
                }
                
                .you-badge {
                    background: #28a745;
                    color: #fff;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 0.75em;
                }
                
                .locations-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                    gap: 8px;
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                
                .locations-grid li {
                    background: #e9ecef;
                    padding: 8px;
                    border-radius: 4px;
                    text-align: center;
                    font-size: 0.9em;
                }
                
                .controls {
                    background: #e3f2fd;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 15px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }
                
                .form-row {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    margin-bottom: 10px;
                    justify-content: center;
                }
                
                label {
                    font-weight: 500;
                }
                
                select {
                    padding: 8px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    font-size: 1em;
                }
                
                .btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 4px;
                    font-size: 1em;
                    cursor: pointer;
                }
                
                .btn-primary {
                    background: #007bff;
                    color: white;
                }
                
                .btn-primary:hover:not(:disabled) {
                    background: #0056b3;
                }
                
                .btn-primary:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                }
                
                .btn-danger {
                    background: #dc3545;
                    color: white;
                }
                
                .btn-danger:hover {
                    background: #c82333;
                }
                
                .player-count {
                    font-size: 0.9em;
                    color: #666;
                }
                
                .warning {
                    color: #856404;
                    background: #fff3cd;
                    padding: 8px;
                    border-radius: 4px;
                    font-size: 0.9em;
                    margin-top: 10px;
                }
                
                .error {
                    color: #dc3545;
                    margin-top: 10px;
                }
                
                .actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                    justify-content: center;
                }
            </style>
            
            <div class="header">
                <h1>Spyfall Lobby</h1>
                <div class="game-code">${state.gameCode}</div>
            </div>
            
            <div class="section">
                <h2>Players <span class="player-count">(${playerCount}/10)</span></h2>
                <ul>
                    ${state.players.map(player => `
                        <li class="player-item">
                            <span>${player.playerName}</span>
                            ${player.playerId === state.game?.ownerId ? '<span class="owner-badge">OWNER</span>' : ''}
                            ${player.playerId === state.playerId ? '<span class="you-badge">YOU</span>' : ''}
                        </li>
                    `).join('')}
                </ul>
                ${playerCount < 3 ? '<p class="warning">Need at least 3 players to start</p>' : ''}
            </div>
            
            ${state.isOwner ? `
                <div class="controls">
                    <div class="form-row">
                        <label for="duration-select">Round Duration:</label>
                        <select id="duration-select">
                            <option value="300" ${duration === 300 ? 'selected' : ''}>5 minutes</option>
                            <option value="360" ${duration === 360 ? 'selected' : ''}>6 minutes</option>
                            <option value="420" ${duration === 420 ? 'selected' : ''}>7 minutes</option>
                            <option value="480" ${duration === 480 ? 'selected' : ''}>8 minutes</option>
                            <option value="540" ${duration === 540 ? 'selected' : ''}>9 minutes</option>
                            <option value="600" ${duration === 600 ? 'selected' : ''}>10 minutes</option>
                        </select>
                    </div>
                    <button 
                        id="start-btn" 
                        class="btn btn-primary"
                        ${!canStart || state.loading ? 'disabled' : ''}
                    >
                        ${state.loading ? 'Starting...' : 'Start Round'}
                    </button>
                </div>
            ` : `
                <div class="section">
                    <p>Waiting for the game owner to start the round...</p>
                </div>
            `}
            
            <div class="section">
                <h2>All Locations</h2>
                <ul class="locations-grid">
                    ${locations.map(loc => `<li>${loc}</li>`).join('')}
                </ul>
            </div>
            
            <div class="actions">
                <button id="leave-btn" class="btn btn-danger">Leave Game</button>
            </div>
            
            ${state.error ? `<p class="error">${state.error}</p>` : ''}
        `;

        this.bindEvents();
    }
}

customElements.define('lobby-screen', LobbyScreen);

export default LobbyScreen;