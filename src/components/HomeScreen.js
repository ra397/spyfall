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
        this.shadowRoot.addEventListener('submit', async (e) => {
            e.preventDefault();

            const form = e.target;
            const formId = form.id;

            if (formId === 'create-form') {
                const name = form.querySelector('#create-name').value.trim();
                await createGame(name);
            } else if (formId === 'join-form') {
                const name = form.querySelector('#join-name').value.trim();
                const code = form.querySelector('#join-code').value.trim();
                await joinGame(name, code);
            }
        });
    }

    render() {
        const state = stateManager.getState();

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
                    padding: 20px;
                    margin-bottom: 20px;
                }
                
                h2 {
                    margin-top: 0;
                    margin-bottom: 15px;
                    font-size: 1.2em;
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
                
                button {
                    width: 100%;
                    padding: 10px;
                    background: #007bff;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    font-size: 1em;
                    cursor: pointer;
                }
                
                button:hover {
                    background: #0056b3;
                }
                
                button:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                }
                
                .error {
                    color: #dc3545;
                    font-size: 0.9em;
                    margin-top: 10px;
                    text-align: center;
                }
                
                .divider {
                    text-align: center;
                    color: #666;
                    margin: 20px 0;
                }
            </style>
            
            <h1>🕵️ Spyfall</h1>
            
            <div class="card">
                <h2>Create New Game</h2>
                <form id="create-form">
                    <div class="form-group">
                        <label for="create-name">Your Name</label>
                        <input 
                            type="text" 
                            id="create-name" 
                            maxlength="12" 
                            required 
                            placeholder="Enter your name"
                            ${state.loading ? 'disabled' : ''}
                        >
                    </div>
                    <button type="submit" ${state.loading ? 'disabled' : ''}>
                        ${state.loading ? 'Creating...' : 'Create Game'}
                    </button>
                </form>
            </div>
            
            <div class="divider">— or —</div>
            
            <div class="card">
                <h2>Join Existing Game</h2>
                <form id="join-form">
                    <div class="form-group">
                        <label for="join-name">Your Name</label>
                        <input 
                            type="text" 
                            id="join-name" 
                            maxlength="12" 
                            required 
                            placeholder="Enter your name"
                            ${state.loading ? 'disabled' : ''}
                        >
                    </div>
                    <div class="form-group">
                        <label for="join-code">Game Code</label>
                        <input 
                            type="text" 
                            id="join-code" 
                            maxlength="4" 
                            required 
                            placeholder="4-letter code"
                            style="text-transform: uppercase;"
                            ${state.loading ? 'disabled' : ''}
                        >
                    </div>
                    <button type="submit" ${state.loading ? 'disabled' : ''}>
                        ${state.loading ? 'Joining...' : 'Join Game'}
                    </button>
                </form>
            </div>
            
            ${state.error ? `<p class="error">${state.error}</p>` : ''}
        `;
    }
}

customElements.define('home-screen', HomeScreen);

export default HomeScreen;