const app = {
    state: {
        domains: [],
        currentDomain: null,
        recipes: [],
        currentRecipe: null
    },

    async init() {
        // Initialize DB with sample data if needed (silent)
        try { await fetch('http://127.0.0.1:13081/api/init'); } catch (e) { }

        await this.loadDomains();
        mermaid.initialize({ startOnLoad: false, theme: 'default' });
        this.setupListeners();
    },

    async loadDomains() {
        const res = await fetch('http://127.0.0.1:13081/api/domains');
        this.state.domains = await res.json();
        this.renderSidebar();
    },

    renderSidebar() {
        const list = document.getElementById('domain-list');
        list.innerHTML = this.state.domains.map(d => `
            <li class="group">
                <button onclick="app.selectDomain(${d.id})" class="w-full text-left px-3 py-2 rounded-md hover:bg-slate-800 transition-colors flex items-center justify-between ${this.state.currentDomain?.id === d.id ? 'bg-slate-800 text-white' : 'text-slate-400'}">
                    <span class="font-medium">${d.name}</span>
                    <span class="opacity-0 group-hover:opacity-100 text-slate-500">→</span>
                </button>
            </li>
        `).join('');
    },

    async selectDomain(id) {
        this.state.currentDomain = this.state.domains.find(d => d.id === id);
        this.renderSidebar(); // update active state

        // Update Header
        document.getElementById('current-domain-title').textContent = this.state.currentDomain.name;
        document.getElementById('domain-systems').innerHTML = this.state.currentDomain.systems.map(s =>
            `<span class="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2 py-0.5 rounded border border-indigo-200">${s.system_name}</span>`
        ).join('');

        // Fetch Recipes (filtering on client for simplicity if API returns all, or optimize API later)
        // For now API returns all, we filter here or update API. Let's filter client side for V1.
        const res = await fetch('http://127.0.0.1:13081/api/recipes');
        const allRecipes = await res.json();
        this.state.recipes = allRecipes.filter(r => r.domain_id === id);
        this.renderRecipes();
    },

    renderRecipes() {
        const container = document.getElementById('recipes-container');
        if (this.state.recipes.length === 0) {
            container.innerHTML = `<div class="text-slate-400 mt-10">No recipes found for this domain. Create one!</div>`;
            return;
        }

        container.innerHTML = this.state.recipes.map(r => `
            <div onclick="app.showRecipe(${r.id})" class="min-w-[300px] w-[300px] bg-white rounded-xl shadow-sm hover:shadow-xl transition-all border border-slate-200 overflow-hidden cursor-pointer flex-col flex h-[400px]">
                <div class="h-2 bg-gradient-to-r from-brand-500 to-indigo-600"></div>
                <div class="p-5 flex-1 flex flex-col">
                    <h3 class="font-bold text-lg text-slate-800 mb-2 leading-tight">${r.title}</h3>
                    <p class="text-slate-500 text-sm line-clamp-3 mb-4 flex-1">${r.summary}</p>
                    <div class="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <span>${new Date(r.created_at).toLocaleDateString()}</span>
                        <div class="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>
                            <span>${r.notes.length} Notes</span>
                        </div>
                    </div>
                </div>
                <div class="bg-slate-50 p-3 text-xs font-mono text-slate-500 border-t border-slate-100 truncate">
                    ${r.sql_content.substring(0, 40)}...
                </div>
            </div>
        `).join('');
    },

    showRecipe(id) {
        this.state.currentRecipe = this.state.recipes.find(r => r.id === id);
        const r = this.state.currentRecipe;

        // Populate Modal
        document.getElementById('modal-title').textContent = r.title;
        document.getElementById('modal-summary').textContent = r.summary;
        // Basic Syntax Highlighting for SQL
        const sqlCodeBlock = document.getElementById('modal-sql');
        sqlCodeBlock.textContent = r.sql_content; // Use textContent to prevent XSS and preserve formatting
        sqlCodeBlock.className = 'language-sql'; // Add class for highlight.js
        hljs.highlightElement(sqlCodeBlock);

        // Reset ER Diagram state
        const erDetails = document.getElementById('er-details');
        if (erDetails) {
            erDetails.removeAttribute('open'); // Close details
            const diagramDiv = document.getElementById('mermaid-diagram');
            diagramDiv.innerHTML = 'Loading diagram...';
            diagramDiv.removeAttribute('data-processed');

            // Re-attach listener if element was replaced? No, ID is stable.
            // But if we navigate away and back, listeners persist. 
            // Better to attach once in init().
        }

        this.renderNotes();

        // Show Modal
        const modal = document.getElementById('recipe-modal');
        modal.classList.remove('hidden');
        // Small delay for transition
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            document.getElementById('recipe-modal-content').classList.remove('translate-x-full');
        }, 10);
    },

    // Initialize listener for ER toggle
    setupListeners() {
        const erDetails = document.getElementById('er-details');
        if (erDetails) {
            erDetails.addEventListener('toggle', (e) => {
                if (erDetails.open) {
                    this.renderMermaid();
                }
            });
        }
    },

    renderMermaid() {
        const diagramDiv = document.getElementById('mermaid-diagram');
        // Only render if not already processed to avoid flicker/re-computation
        if (!diagramDiv.hasAttribute('data-processed') || diagramDiv.innerHTML === '' || diagramDiv.innerHTML === 'Loading diagram...') {
            const mermaidCode = Visualizer.generateMermaid(this.state.currentRecipe.sql_content);
            diagramDiv.removeAttribute('data-processed');
            diagramDiv.innerHTML = mermaidCode;
            try {
                if (mermaid.run) {
                    mermaid.run({ nodes: [diagramDiv] });
                } else {
                    mermaid.init(undefined, diagramDiv);
                }
            } catch (e) {
                console.error('Mermaid error:', e);
                diagramDiv.innerHTML = '<div class="text-red-400 text-sm">Failed to generate diagram</div>';
            }
        }
    },

    closeRecipeModal() {
        const modal = document.getElementById('recipe-modal');
        modal.classList.add('opacity-0');
        document.getElementById('recipe-modal-content').classList.add('translate-x-full');
        setTimeout(() => modal.classList.add('hidden'), 300);
    },

    renderNotes() {
        const container = document.getElementById('modal-notes');
        const notes = this.state.currentRecipe.notes;

        if (!notes || notes.length === 0) {
            container.innerHTML = '<div class="text-slate-400 text-sm italic">No notes yet. Be the first to share insight!</div>';
            return;
        }

        container.innerHTML = notes.map(n => `
            <div class="relative pb-4">
                <div class="absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white ${n.note_type === 'caution' ? 'bg-red-500' : 'bg-blue-500'}"></div>
                <div class="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                    <div class="flex items-center justify-between mb-1">
                        <span class="font-bold text-sm text-slate-700">${n.author_name}</span>
                        <span class="text-xs text-slate-400">${new Date(n.created_at).toLocaleDateString()}</span>
                    </div>
                    <p class="text-sm text-slate-600">${n.content}</p>
                    ${n.note_type === 'caution' ? '<span class="inline-block mt-2 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">CAUTION</span>' : ''}
                </div>
            </div>
        `).join('');
    },

    toggleNoteInput() {
        document.getElementById('add-note-form').classList.toggle('hidden');
    },

    async submitNote() {
        const type = document.getElementById('note-type').value;
        const author = document.getElementById('note-author').value || 'Anonymous';
        const content = document.getElementById('note-content').value;

        if (!content) return;

        const res = await fetch(`http://127.0.0.1:13081/api/recipes/${this.state.currentRecipe.id}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                author_name: author,
                note_type: type,
                content: content
            })
        });

        if (res.ok) {
            const newNote = await res.json();
            this.state.currentRecipe.notes.push(newNote);
            this.renderNotes();
            document.getElementById('note-content').value = '';
            this.toggleNoteInput();
        }
    },

    // Placeholders for creation (not fully implemented in V1 UI but connected)
    showCreateDomainModal() {
        const name = prompt("Domain Name:");
        if (name) this.createDomain(name);
    },

    async createDomain(name) {
        await fetch('http://127.0.0.1:13081/api/domains', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description: "New domain", systems: [] })
        });
        this.loadDomains();
    },

    showCreateRecipeModal() {
        // Simple prompting for V1 to fulfill basic "create" req
        if (!this.state.currentDomain) return alert("Select a domain first");
        // In real app use a modal, here simplified for brevity of single-file logic
        alert("This would open a full create form. For now relying on init data or API calls.");
    },

    copySql() {
        navigator.clipboard.writeText(this.state.currentRecipe.sql_content);
        alert("SQL copied to clipboard!");
    }
};

// Start app
app.init();
