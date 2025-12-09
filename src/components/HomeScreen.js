/**
 * Home Screen Component
 * Create or join a game
 */

import stateManager from '../modules/stateManager.js';
import { createGame, joinGame } from '../modules/firebase.js';

class HomeScreen extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.unsubscribe = null;
        this.activeTab = 'join'; // 'create' or 'join'
    }

    connectedCallback() {
        this.render();
        this.unsubscribe = stateManager.subscribe(() => this.render());
        this.bindEvents();
    }

    disconnectedCallback() {
        if (this.unsubscribe) this.unsubscribe();
    }

    bindEvents() {
        this.shadowRoot.addEventListener('click', (e) => {
            const tab = e.target.closest('.tab');
            if (tab) {
                const newTab = tab.dataset.tab;
                if (newTab !== this.activeTab) {
                    this.activeTab = newTab;
                    this.render();
                    this.bindEvents();
                }
            }
        });

        this.shadowRoot.addEventListener('submit', async (e) => {
            e.preventDefault();

            const form = e.target;
            const name = form.querySelector('#player-name').value.trim();

            if (this.activeTab === 'create') {
                await createGame(name);
            } else {
                const code = form.querySelector('#join-code').value.trim();
                await joinGame(name, code);
            }
        });
    }

    render() {
        const state = stateManager.getState();
        const isCreate = this.activeTab === 'create';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    max-width: 400px;
                    margin: 0 auto;
                    padding: 20px;
                }
                
                h1 {
                    text-align: center;
                    margin-bottom: 30px;
                }
                
                .card {
                    background: #f5f5f5;
                    border-radius: 8px;
                    overflow: hidden;
                }
                
                .tabs {
                    display: flex;
                    background: #e0e0e0;
                }
                
                .tab {
                    flex: 1;
                    padding: 12px 16px;
                    text-align: center;
                    cursor: pointer;
                    font-size: 0.95em;
                    font-weight: 500;
                    border: none;
                    background: transparent;
                    color: #666;
                    transition: background 0.2s, color 0.2s;
                }
                
                .tab:hover {
                    background: #d5d5d5;
                }
                
                .tab.active {
                    background: #f5f5f5;
                    color: #007bff;
                }
                
                .form-container {
                    padding: 20px;
                }
                
                .form-group {
                    margin-bottom: 12px;
                }
                
                label {
                    display: block;
                    margin-bottom: 4px;
                    font-size: 0.9em;
                }
                
                input {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    font-size: 1em;
                    box-sizing: border-box;
                }
                
                input:focus {
                    outline: none;
                    border-color: #007bff;
                }
                
                button[type="submit"] {
                    width: 100%;
                    padding: 10px;
                    background: #007bff;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    font-size: 1em;
                    cursor: pointer;
                    margin-top: 8px;
                }
                
                button[type="submit"]:hover {
                    background: #0056b3;
                }
                
                button[type="submit"]:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                }
                
                .error {
                    color: #dc3545;
                    font-size: 0.9em;
                    margin-top: 15px;
                    text-align: center;
                }
                
                #join-code {
                    text-transform: uppercase;
                }
                
                #join-code::placeholder {
                    text-transform: none;
                }
                
                #description {
                    text-align: center;
                    margin-bottom: 30px;
                }
            </style>
            
            <h1>Spyfall</h1>
            
            <p id="description">
                A fast, social deduction game you can play right in your browser.
                Everyone gets the same location… except one secret spy. Ask clever questions, spot suspicious answers, 
                and expose the spy before they figure out where you are.
            </p>
            
            <div class="card">
                <div class="tabs">
                    <button class="tab ${isCreate ? 'active' : ''}" data-tab="create">Create Game</button>
                    <button class="tab ${!isCreate ? 'active' : ''}" data-tab="join">Join Game</button>
                </div>
                
                <div class="form-container">
                    <form id="game-form">
                        <div class="form-group">
                            <label for="player-name">Your Name</label>
                            <input 
                                type="text" 
                                id="player-name" 
                                maxlength="12" 
                                required 
                                placeholder="Enter your name"
                                ${state.loading ? 'disabled' : ''}
                            >
                        </div>
                        
                        ${!isCreate ? `
                            <div class="form-group">
                                <label for="join-code">Game Code</label>
                                <input 
                                    type="text" 
                                    id="join-code" 
                                    maxlength="4" 
                                    required 
                                    placeholder="Enter game code"
                                    ${state.loading ? 'disabled' : ''}
                                >
                            </div>
                        ` : ''}
                        
                        <button type="submit" ${state.loading ? 'disabled' : ''}>
                            ${state.loading
            ? (isCreate ? 'Creating...' : 'Joining...')
            : (isCreate ? 'Create Game' : 'Join Game')}
                        </button>
                    </form>
                </div>
            </div>
            
            ${state.error ? `<p class="error">${state.error}</p>` : ''}
        `;
    }
}

customElements.define('home-screen', HomeScreen);

export default HomeScreen;