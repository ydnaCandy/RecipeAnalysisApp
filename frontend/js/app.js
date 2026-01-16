const app = {
    state: {
        domains: [],
        currentDomain: null,
        recipes: [],
        currentRecipe: null,
        editingRecipeId: null
    },

    async init() {
        // DB初期データ投入（既存データがある場合はAPI側でスキップされるためエラーハンドリングのみ）
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
        this.renderSidebar(); // アクティブ状態の更新

        // ヘッダー情報の更新
        document.getElementById('current-domain-title').textContent = this.state.currentDomain.name;
        document.getElementById('domain-systems').innerHTML = this.state.currentDomain.systems.map(s =>
            `<span class="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2 py-0.5 rounded border border-indigo-200">${s.system_name}</span>`
        ).join('');

        // レシピ取得（V1では全件取得後にクライアント側でフィルタリング対応。データ量が増えたらAPI側でフィルタリングする）
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

        // モーダルへのデータ流し込み
        document.getElementById('modal-title').textContent = r.title;
        document.getElementById('modal-summary').textContent = r.summary;
        // SQLの簡易シンタックスハイライト適用
        const sqlCodeBlock = document.getElementById('modal-sql');
        sqlCodeBlock.textContent = r.sql_content; // XSS対策のためtextContentを使用し、フォーマットを維持
        sqlCodeBlock.className = 'language-sql'; // highlight.js用のクラス追加
        hljs.highlightElement(sqlCodeBlock);

        // ER図の状態リセット
        const erDetails = document.getElementById('er-details');
        if (erDetails) {
            erDetails.removeAttribute('open'); // 詳細を閉じる
            const diagramDiv = document.getElementById('mermaid-diagram');
            diagramDiv.innerHTML = 'Loading diagram...';
            diagramDiv.removeAttribute('data-processed');

            // リスナーの再アタッチはinit()で行っているため不要。
            // DOM要素が置換されていなければイベントリスナーは維持される。
        }

        this.renderNotes();

        // モーダルの表示
        const modal = document.getElementById('recipe-modal');
        modal.classList.remove('hidden');
        // トランジション用の微小遅延
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            document.getElementById('recipe-modal-content').classList.remove('translate-x-full');
        }, 10);
    },

    // ER図トグルのリスナー初期化
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
        // ちらつきや再計算を防ぐため、未処理の場合のみレンダリングを行う
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

    // 新規作成関連（V1 UIでは簡易実装だが機能は連携済み）
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
        if (!this.state.currentDomain) return alert("Select a domain first");

        this.state.editingRecipeId = null;
        document.querySelector('#create-recipe-modal h3').textContent = 'Create New Recipe';
        document.querySelector('#create-recipe-modal button[onclick="app.submitNewRecipe()"]').textContent = 'Create Recipe';

        const modal = document.getElementById('create-recipe-modal');
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            document.getElementById('create-recipe-modal-content').classList.remove('scale-95');
            document.getElementById('create-recipe-modal-content').classList.add('scale-100');
        }, 10);
    },

    showEditRecipeModal() {
        if (!this.state.currentRecipe) return;

        this.state.editingRecipeId = this.state.currentRecipe.id;
        const r = this.state.currentRecipe;

        // フォームへのプレフィル（事前入力）
        document.getElementById('new-recipe-title').value = r.title;
        document.getElementById('new-recipe-summary').value = r.summary;
        document.getElementById('new-recipe-sql').value = r.sql_content;

        document.querySelector('#create-recipe-modal h3').textContent = 'Edit Recipe';
        document.querySelector('#create-recipe-modal button[onclick="app.submitNewRecipe()"]').textContent = 'Update Recipe';

        // 作成用モーダルを再利用
        const modal = document.getElementById('create-recipe-modal');
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            document.getElementById('create-recipe-modal-content').classList.remove('scale-95');
            document.getElementById('create-recipe-modal-content').classList.add('scale-100');
        }, 10);
    },

    closeCreateRecipeModal() {
        const modal = document.getElementById('create-recipe-modal');
        modal.classList.add('opacity-0');
        document.getElementById('create-recipe-modal-content').classList.remove('scale-100');
        document.getElementById('create-recipe-modal-content').classList.add('scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
            // 閉じる際にフィールドをクリア
            document.getElementById('new-recipe-title').value = '';
            document.getElementById('new-recipe-summary').value = '';
            document.getElementById('new-recipe-sql').value = '';
            this.state.editingRecipeId = null;
        }, 200);
    },

    async submitNewRecipe() {
        if (!this.state.currentDomain) return;

        const title = document.getElementById('new-recipe-title').value;
        const summary = document.getElementById('new-recipe-summary').value;
        const sql = document.getElementById('new-recipe-sql').value;

        if (!title || !sql) {
            alert("Title and SQL Content are required.");
            return;
        }

        const payload = {
            title: title,
            summary: summary,
            sql_content: sql
        };

        try {
            let res;
            if (this.state.editingRecipeId) {
                // 更新処理
                res = await fetch(`http://127.0.0.1:13081/api/recipes/${this.state.editingRecipeId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload) // domain_idは更新時には通常不要（スキーマでオプショナル）
                });
            } else {
                // 新規作成処理
                payload.domain_id = this.state.currentDomain.id;
                res = await fetch('http://127.0.0.1:13081/api/recipes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                const recipe = await res.json();

                // 編集中の場合、もし編集用モーダルが開いていれば（隠れてはいるが）現在のビューも更新する
                if (this.state.editingRecipeId) {
                    this.state.currentRecipe = recipe;
                    // 詳細ビューの更新
                    document.getElementById('modal-title').textContent = recipe.title;
                    document.getElementById('modal-summary').textContent = recipe.summary;
                    const sqlCodeBlock = document.getElementById('modal-sql');
                    sqlCodeBlock.textContent = recipe.sql_content;
                    hljs.highlightElement(sqlCodeBlock);
                    this.renderMermaid(); // ダイアグラムの再レンダリング
                }

                // リストの更新
                this.selectDomain(this.state.currentDomain.id);
                this.closeCreateRecipeModal();
            } else {
                alert("Failed to save recipe");
            }
        } catch (e) {
            console.error(e);
            alert("Error saving recipe");
        }
    },

    copySql() {
        navigator.clipboard.writeText(this.state.currentRecipe.sql_content);
        alert("SQL copied to clipboard!");
    }
};

// アプリケーションの開始
app.init();
