/**
 * App Root Component
 * Main router that renders screens based on current route
 */

import stateManager from '../modules/stateManager.js';
import router from '../modules/router.js';

class AppRoot extends HTMLElement {
    constructor() {
        super();
        this.unsubscribe = null;
    }

    connectedCallback() {
        this.unsubscribe = stateManager.subscribe(() => this.render());
        this.render();
    }

    disconnectedCallback() {
        if (this.unsubscribe) this.unsubscribe();
    }

    render() {
        const state = stateManager.getState();
        const route = state.currentRoute;
        const screenTag = router.routes[route] || 'home-screen';

        this.innerHTML = `<${screenTag}></${screenTag}>`;
    }
}

customElements.define('app-root', AppRoot);

export default AppRoot;