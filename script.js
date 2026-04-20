class TerminalNotepad {
    constructor() {
        this.files = [];
        this.activeFile = null;
        this.tabs = [];
        this.fileCounter = 1;

        this.editor = document.getElementById('editor');
        this.lineNumbers = document.getElementById('lineNumbers');
        this.fileList = document.getElementById('fileList');
        this.editorTabs = document.getElementById('editorTabs');
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.commandPalette = document.getElementById('commandPalette');
        this.commandInput = document.getElementById('commandInput');

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.newFile();

        // Focus editor
        this.editor.focus();
    }

    setupEventListeners() {
        // Editor input
        this.editor.addEventListener('input', () => {
            this.updateLineNumbers();
            this.updateStatus();
            this.markUnsaved();
        });

        this.editor.addEventListener('scroll', () => {
            this.lineNumbers.scrollTop = this.editor.scrollTop;
        });

        this.editor.addEventListener('click', () => {
            this.updateStatus();
        });

        this.editor.addEventListener('keyup', () => {
            this.updateStatus();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key.toLowerCase()) {
                    case 'n':
                        e.preventDefault();
                        this.newFile();
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveFile();
                        break;
                    case 'o':
                        e.preventDefault();
                        this.toggleCommandPalette();
                        break;
                    case 'w':
                        e.preventDefault();
                        this.closeTab(this.activeFile);
                        break;
                }
            }

            if (e.key === 'Escape') {
                this.closeCommandPalette();
            }
        });

        // Command palette
        this.commandInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.executeCommand(this.commandInput.value);
            }
        });
    }

    newFile() {
        const file = {
            id: Date.now(),
            name: `untitled-${this.fileCounter++}.txt`,
            content: '',
            saved: true,
            type: 'text'
        };

        this.files.push(file);
        this.openTab(file);
        this.renderFileList();

        // Hide welcome screen
        this.welcomeScreen.classList.add('hidden');
    }

    openTab(file) {
        // Check if already open
        if (!this.tabs.find(t => t.id === file.id)) {
            this.tabs.push(file);
            this.renderTabs();
        }

        this.activeFile = file;
        this.editor.value = file.content;
        this.updateLineNumbers();
        this.updateStatus();
        this.renderTabs();
        this.renderFileList();
        this.editor.focus();
    }

    closeTab(file) {
        if (!file) return;

        const index = this.tabs.findIndex(t => t.id === file.id);
        this.tabs = this.tabs.filter(t => t.id !== file.id);

        if (this.activeFile && this.activeFile.id === file.id) {
            if (this.tabs.length > 0) {
                const newIndex = Math.min(index, this.tabs.length - 1);
                this.activeFile = this.tabs[newIndex];
                this.editor.value = this.activeFile.content;
            } else {
                this.activeFile = null;
                this.editor.value = '';
                this.welcomeScreen.classList.remove('hidden');
            }
        }

        this.renderTabs();
        this.updateLineNumbers();
        this.updateStatus();
    }

    saveFile() {
        if (!this.activeFile) return;

        this.activeFile.content = this.editor.value;
        this.activeFile.saved = true;
        this.renderTabs();

        // Flash status
        const status = document.querySelector('.mode-indicator');
        const original = status.textContent;
        status.textContent = '-- SAVED --';
        status.style.color = 'var(--accent-green)';

        setTimeout(() => {
            status.textContent = original;
            status.style.color = 'var(--accent-yellow)';
        }, 1000);
    }

    markUnsaved() {
        if (this.activeFile && this.activeFile.saved) {
            this.activeFile.saved = false;
            this.renderTabs();
        }
    }

    renderFileList() {
        this.fileList.innerHTML = this.files.map(file => `
            <div class="file-item ${this.activeFile && this.activeFile.id === file.id ? 'active' : ''}" 
                 onclick="app.openTab(app.files.find(f => f.id === ${file.id}))">
                <span class="file-icon">📄</span>
                <span class="file-name">${file.name}${!file.saved ? ' •' : ''}</span>
            </div>
        `).join('');
    }

    renderTabs() {
        this.editorTabs.innerHTML = this.tabs.map(file => `
            <div class="tab ${this.activeFile && this.activeFile.id === file.id ? 'active' : ''} ${!file.saved ? 'tab-unsaved' : ''}"
                 onclick="app.switchTab(${file.id})">
                <span>${file.name}</span>
                <span class="tab-close" onclick="event.stopPropagation(); app.closeTab(app.tabs.find(t => t.id === ${file.id}))">×</span>
            </div>
        `).join('');
    }

    switchTab(fileId) {
        const file = this.tabs.find(t => t.id === fileId);
        if (file) {
            this.activeFile = file;
            this.editor.value = file.content;
            this.updateLineNumbers();
            this.updateStatus();
            this.renderTabs();
            this.renderFileList();
            this.editor.focus();
        }
    }

    updateLineNumbers() {
        const lines = this.editor.value.split('\n').length;
        this.lineNumbers.innerHTML = Array.from({length: lines}, (_, i) => i + 1).join('<br>');
    }

    updateStatus() {
        const text = this.editor.value;
        const cursorPos = this.editor.selectionStart;
        const lines = text.substr(0, cursorPos).split('\n');
        const line = lines.length;
        const col = lines[lines.length - 1].length + 1;

        document.getElementById('cursorPos').textContent = `Ln ${line}, Col ${col}`;
        document.getElementById('fileSize').textContent = `${new Blob([text]).size} bytes`;

        if (this.activeFile) {
            const ext = this.activeFile.name.split('.').pop();
            const types = {
                'js': 'JavaScript',
                'py': 'Python',
                'html': 'HTML',
                'css': 'CSS',
                'json': 'JSON',
                'md': 'Markdown'
            };
            document.getElementById('fileType').textContent = types[ext] || 'Plain Text';
        }
    }

    toggleCommandPalette() {
        this.commandPalette.classList.toggle('active');
        if (this.commandPalette.classList.contains('active')) {
            this.commandInput.value = '';
            this.commandInput.focus();
        }
    }

    closeCommandPalette() {
        this.commandPalette.classList.remove('active');
        this.editor.focus();
    }

    executeCommand(cmd) {
        cmd = cmd.toLowerCase().trim();

        if (cmd === 'new' || cmd === 'n') {
            this.newFile();
        } else if (cmd === 'save' || cmd === 's') {
            this.saveFile();
        } else if (cmd === 'quit' || cmd === 'q') {
            this.closeWindow();
        } else if (cmd.startsWith('open ')) {
            const filename = cmd.slice(5);
            const file = this.files.find(f => f.name === filename);
            if (file) this.openTab(file);
        }

        this.closeCommandPalette();
    }

    closeWindow() {
        if (confirm('Quit Terminal Notepad?')) {
            window.close();
        }
    }

    minimizeWindow() {
        alert('Minimize functionality would be implemented in a desktop app');
    }

    maximizeWindow() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
}

const app = new TerminalNotepad();
