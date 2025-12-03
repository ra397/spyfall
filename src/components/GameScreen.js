/**
 * Game Screen Component
 * Active game view with timer, role, and player list
 */

import stateManager from '../modules/stateManager.js';
import { endRound, leaveGame, getLocations } from '../modules/firebase.js';

class GameScreen extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.unsubscribe = null;
        this.timerInterval = null;
        this.timeRemaining = 0;
        this.timerStarted = false;
    }

    connectedCallback() {
        this.render();
        this.unsubscribe = stateManager.subscribe(() => this.render());
        this.startTimer();
    }

    disconnectedCallback() {
        if (this.unsubscribe) this.unsubscribe();
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    startTimer() {
        const state = stateManager.getState();
        const duration = state.game?.duration || 480;

        if (!this.timerStarted) {
            this.timeRemaining = duration;
            this.timerStarted = true;
        }

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.timerInterval = setInterval(() => {
            if (this.timeRemaining > 0) {
                this.timeRemaining--;
                this.updateTimerDisplay();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const timerElement = this.shadowRoot.querySelector('#timer');
        if (timerElement) {
            const minutes = Math.floor(this.timeRemaining / 60);
            const seconds = this.timeRemaining % 60;
            timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            // Change color when low on time
            if (this.timeRemaining <= 60) {
                timerElement.classList.add('urgent');
            } else if (this.timeRemaining <= 120) {
                timerElement.classList.add('warning');
            }
        }
    }

    bindEvents() {
        // End round button
        const endBtn = this.shadowRoot.querySelector('#end-btn');
        if (endBtn) {
            endBtn.onclick = async () => {
                await endRound();
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
        const isSpy = state.occupation === 'Spy';

        // Format time for initial render
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                
                h1 {
                    margin: 0 0 10px 0;
                    font-size: 1.5em;
                }
                
                .timer {
                    font-size: 3em;
                    font-family: monospace;
                    font-weight: bold;
                    color: #333;
                }
                
                .timer.warning {
                    color: #ffc107;
                }
                
                .timer.urgent {
                    color: #dc3545;
                    animation: pulse 1s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                .role-card {
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 20px;
                    text-align: center;
                }
                
                .role-card.spy {
                    background: linear-gradient(135deg, #1a1a2e, #16213e);
                    color: #eee;
                }
                
                .role-card.regular {
                    background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
                    color: #1b5e20;
                }
                
                .role-label {
                    font-size: 0.9em;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    opacity: 0.8;
                }
                
                .role-value {
                    font-size: 1.8em;
                    font-weight: bold;
                    margin: 8px 0;
                }
                
                .location-label {
                    font-size: 0.9em;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    opacity: 0.8;
                    margin-top: 15px;
                }
                
                .location-value {
                    font-size: 1.4em;
                    font-weight: bold;
                }
                
                .spy-hint {
                    font-size: 0.9em;
                    opacity: 0.8;
                    margin-top: 10px;
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
                
                .locations-grid li.current {
                    background: #28a745;
                    color: white;
                    font-weight: bold;
                }
                
                .btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 4px;
                    font-size: 1em;
                    cursor: pointer;
                }
                
                .btn-warning {
                    background: #ffc107;
                    color: #000;
                }
                
                .btn-warning:hover {
                    background: #e0a800;
                }
                
                .btn-danger {
                    background: #dc3545;
                    color: white;
                }
                
                .btn-danger:hover {
                    background: #c82333;
                }
                
                .actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                }
                
                .controls {
                    background: #fff3cd;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 15px;
                }
                
                .error {
                    color: #dc3545;
                    margin-top: 10px;
                }
            </style>
            
            <div class="header">
                <h1>🕵️ Spyfall</h1>
                <div id="timer" class="timer">${timeDisplay}</div>
            </div>
            
            <div class="role-card ${isSpy ? 'spy' : 'regular'}">
                <div class="role-label">Your Role</div>
                <div class="role-value">${state.occupation || 'Loading...'}</div>
                ${isSpy ? `
                    <div class="spy-hint">You don't know the location. Try to figure it out without revealing yourself!</div>
                ` : `
                    <div class="location-label">Location</div>
                    <div class="location-value">${state.game?.location || 'Loading...'}</div>
                `}
            </div>
            
            <div class="section">
                <h2>Players</h2>
                <ul>
                    ${state.players.map(player => `
                        <li class="player-item">
                            <span>${player.playerName}</span>
                            ${player.playerId === state.playerId ? '<span class="you-badge">YOU</span>' : ''}
                        </li>
                    `).join('')}
                </ul>
            </div>
            
            <div class="section">
                <h2>All Locations</h2>
                <ul class="locations-grid">
                    ${locations.map(loc => `
                        <li class="${!isSpy && loc === state.game?.location ? 'current' : ''}">${loc}</li>
                    `).join('')}
                </ul>
            </div>
            
            ${state.isOwner ? `
                <div class="controls">
                    <h2>Game Controls</h2>
                    <p>End the round when players are ready to reveal the spy or when time runs out.</p>
                    <button id="end-btn" class="btn btn-warning" ${state.loading ? 'disabled' : ''}>
                        ${state.loading ? 'Ending...' : 'End Round'}
                    </button>
                </div>
            ` : ''}
            
            <div class="actions">
                <button id="leave-btn" class="btn btn-danger">Leave Game</button>
            </div>
            
            ${state.error ? `<p class="error">${state.error}</p>` : ''}
        `;

        this.bindEvents();
    }
}

customElements.define('game-screen', GameScreen);

export default GameScreen;