class LinuxTerminal {
    constructor() {
        this.files = {};
        this.currentFile = null;
        this.fileCounter = 1;
        this.commandHistory = [];
        this.historyIndex = -1;

        this.editor = document.getElementById('editor');
        this.lineNumbers = document.getElementById('lineNumbers');
        this.fileList = document.getElementById('fileList');
        this.outputArea = document.getElementById('outputArea');
        this.commandLine = document.querySelector('.command-line');
        this.commandInput = document.getElementById('commandInput');
        this.welcomeMsg = document.getElementById('welcomeMsg');

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateClock();
        this.renderFileList();
        this.updateStatus();
        this.updateLineNumbers();
        setInterval(() => this.updateClock(), 1000);
        this.commandInput.focus();
    }

    setupEventListeners() {
        // Editor events
        this.editor.addEventListener('input', () => {
            if (this.currentFile) {
                this.files[this.currentFile].content = this.editor.value;
                this.files[this.currentFile].modified = true;
                this.renderFileList();
            }
            this.updateLineNumbers();
            this.updateStatus();
        });

        this.editor.addEventListener('scroll', () => {
            this.lineNumbers.scrollTop = this.editor.scrollTop;
        });

        this.editor.addEventListener('click', () => this.updateStatus());
        this.editor.addEventListener('keyup', () => this.updateStatus());

        // Command input events
        this.commandInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.executeCommand(this.commandInput.value);
                this.commandInput.value = '';
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    this.commandInput.value = this.commandHistory[this.historyIndex];
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.historyIndex < this.commandHistory.length - 1) {
                    this.historyIndex++;
                    this.commandInput.value = this.commandHistory[this.historyIndex];
                } else {
                    this.historyIndex = this.commandHistory.length;
                    this.commandInput.value = '';
                }
            } else if (e.key === 'Tab') {
                e.preventDefault();
                this.autocomplete();
            } else if (e.key === 'l' && e.ctrlKey) {
                e.preventDefault();
                this.clearScreen();
            }
        });

        // Focus command input when clicking in output area
        this.outputArea.addEventListener('click', () => {
            this.commandInput.focus();
        });
    }

    updateClock() {
        const now = new Date();
        document.getElementById('clock').textContent = now.toLocaleTimeString();
    }

    updateLineNumbers() {
        const lines = this.editor.value.split('\n');
        this.lineNumbers.innerHTML = lines.map((line, i) => {
            const isComment = line.trim().startsWith('#');
            return `<span style="${isComment ? 'color: var(--text-dim)' : ''}">${i + 1}</span>`;
        }).join('<br>');
    }

    updateStatus() {
        const text = this.editor.value;
        const cursorPos = this.editor.selectionStart;
        const lines = text.substr(0, cursorPos).split('\n');
        const line = lines.length;
        const col = lines[lines.length - 1].length + 1;

        document.getElementById('cursorPos').textContent = `Ln ${line}, Col ${col}`;
        document.getElementById('fileSize').textContent = `${new Blob([text]).size} bytes`;
        document.getElementById('fileCount').textContent = `${Object.keys(this.files).length} files`;
    }

    executeCommand(cmd) {
        cmd = cmd.trim();
        if (!cmd) return;

        this.commandHistory.push(cmd);
        this.historyIndex = this.commandHistory.length;

        this.printCommand(cmd);

        const parts = cmd.split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);

        switch(command) {
            case 'help':
                this.printOutput(`Available commands:
  nano <file>     - Create or edit a file
  cat <file>      - Display file contents
  ls              - List all files
  rm <file>       - Delete a file
  neofetch        - Display system information
  clear           - Clear terminal screen
  pwd             - Show current directory
  echo <text>     - Print text
  date            - Show current date/time
  whoami          - Show current user
  save            - Save current file
  exit            - Close editor`);
                break;

            case 'neofetch':
                this.printNeofetch();
                break;

            case 'nano':
            case 'vim':
            case 'vi':
                if (args.length === 0) {
                    this.printError('Usage: nano <filename>');
                } else {
                    this.openFile(args[0]);
                }
                break;

            case 'cat':
                if (args.length === 0) {
                    this.printError('Usage: cat <filename>');
                } else {
                    this.printFile(args[0]);
                }
                break;

            case 'ls':
                this.listFiles();
                break;

            case 'rm':
                if (args.length === 0) {
                    this.printError('Usage: rm <filename>');
                } else {
                    this.deleteFile(args[0]);
                }
                break;

            case 'clear':
            case 'cls':
                this.clearScreen();
                break;

            case 'pwd':
                this.printOutput('/home/user/notes');
                break;

            case 'echo':
                this.printOutput(args.join(' '));
                break;

            case 'date':
                this.printOutput(new Date().toString());
                break;

            case 'whoami':
                this.printOutput('user');
                break;

            case 'save':
                this.saveCurrentFile();
                break;

            case 'exit':
            case 'quit':
                this.exitEditor();
                break;

            case 'mkdir':
                this.printError('Permission denied: cannot create directories in ~/notes');
                break;

            case 'touch':
                if (args.length === 0) {
                    this.printError('Usage: touch <filename>');
                } else {
                    this.createEmptyFile(args[0]);
                }
                break;

            case 'cp':
                if (args.length < 2) {
                    this.printError('Usage: cp <source> <destination>');
                } else {
                    this.copyFile(args[0], args[1]);
                }
                break;

            case 'mv':
                if (args.length < 2) {
                    this.printError('Usage: mv <source> <destination>');
                } else {
                    this.moveFile(args[0], args[1]);
                }
                break;

            default:
                this.printError(`Command not found: ${command}. Type 'help' for available commands.`);
        }

        this.scrollToBottom();
    }

    printNeofetch() {
        const container = document.createElement('div');
        container.className = 'neofetch-container';

        // Fedora logo ASCII art (block style matching the photo)
        const asciiArt = `         \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2593\u2593
       \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2593\u2593\u2593
      \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2593\u2593\u2593
     \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2593\u2593\u2593
    \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2593\u2593\u2593
   \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2593\u2593
  \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2593
  \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588
 \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588
 \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588
 \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588
  \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588
  \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588
   \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588
    \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588
     \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588
      \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588
       \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588
         \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588`;

        const asciiDiv = document.createElement('div');
        asciiDiv.className = 'neofetch-ascii';
        asciiDiv.textContent = asciiArt;

        const infoDiv = document.createElement('div');
        infoDiv.className = 'neofetch-info';

        // Host line: ilham@fedora
        const hostLine = document.createElement('div');
        hostLine.className = 'neofetch-line neofetch-host';
        hostLine.innerHTML = `ilham<span class="at">@</span><span class="host-name">fedora</span>`;
        infoDiv.appendChild(hostLine);

        // Separator line (dashes matching photo)
        const sepLine = document.createElement('div');
        sepLine.className = 'neofetch-line';
        sepLine.innerHTML = '<span class="neofetch-value">---------------------</span>';
        infoDiv.appendChild(sepLine);

        // System info lines matching the photo exactly
        const infoLines = [
            { label: 'OS', value: 'Fedora Linux 40 (Workstation Edition) x86_64' },
            { label: 'Host', value: '80M-WXX9 M1010' },
            { label: 'Kernel', value: '6.10.12-200.fc40.x86_64' },
            { label: 'Uptime', value: '36 mins' },
            { label: 'Packages', value: '2546 (rpm)' },
            { label: 'Shell', value: 'zsh 5.9' },
            { label: 'Resolution', value: '1920x1080' },
            { label: 'DE', value: 'Hyprland' },
            { label: 'WM', value: 'sway' },
            { label: 'Theme', value: 'Kali-Dark [GTK2/3]' },
            { label: 'Icons', value: 'Flat-Remix-Blue-Dark [GTK2/3]' },
            { label: 'Terminal', value: 'kitty' },
            { label: 'CPU', value: 'AMD Ryzen 7 5700U with Radeon Graphics (16) @ 4.372GHz' },
            { label: 'GPU', value: 'AMD ATI 03:00.0 Lucienne' },
            { label: 'Memory', value: '1653MiB / 15312MiB' },
        ];

        infoLines.forEach(item => {
            const line = document.createElement('div');
            line.className = 'neofetch-line';
            line.innerHTML = `<span class="neofetch-label">${item.label}:</span> <span class="neofetch-value">${item.value}</span>`;
            infoDiv.appendChild(line);
        });

        // Color palette blocks
        const colorsDiv = document.createElement('div');
        colorsDiv.className = 'neofetch-colors';

        const colorPalette = [
            '#3b3b3b', '#cc0000', '#4e9a06', '#c4a000',
            '#3465a4', '#75507b', '#06989a', '#d3d7cf',
            '#555753', '#ef2929', '#8ae234', '#fce94f',
            '#729fcf', '#ad7fa8', '#34e2e2', '#eeeeec'
        ];

        colorPalette.forEach(color => {
            const block = document.createElement('span');
            block.className = 'neofetch-color-block';
            block.style.backgroundColor = color;
            colorsDiv.appendChild(block);
        });

        infoDiv.appendChild(colorsDiv);

        container.appendChild(asciiDiv);
        container.appendChild(infoDiv);

        this.outputArea.insertBefore(container, this.commandLine);
    }

    printCommand(cmd) {
        const line = document.createElement('div');
        line.className = 'output-line command';
        line.innerHTML = `<span class="prompt">user@linux:~$</span> ${this.escapeHtml(cmd)}`;
        this.outputArea.insertBefore(line, this.commandLine);
    }

    printOutput(text) {
        const line = document.createElement('div');
        line.className = 'output-line output';
        line.textContent = text;
        this.outputArea.insertBefore(line, this.commandLine);
    }

    printError(text) {
        const line = document.createElement('div');
        line.className = 'output-line error';
        line.textContent = text;
        this.outputArea.insertBefore(line, this.commandLine);
    }

    printSuccess(text) {
        const line = document.createElement('div');
        line.className = 'output-line success';
        line.textContent = text;
        this.outputArea.insertBefore(line, this.commandLine);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    openFile(filename) {
        if (!filename) return;

        if (!this.files[filename]) {
            this.files[filename] = {
                content: '',
                created: new Date(),
                modified: false
            };
            this.printSuccess(`Created new file: ${filename}`);
        } else {
            this.printSuccess(`Opened: ${filename}`);
        }

        this.currentFile = filename;
        this.editor.value = this.files[filename].content;
        this.welcomeMsg.classList.add('hidden');
        this.editor.focus();
        this.updateLineNumbers();
        this.updateStatus();
        this.renderFileList();

        document.getElementById('mode').textContent = 'INSERT';
    }

    printFile(filename) {
        if (!this.files[filename]) {
            this.printError(`File not found: ${filename}`);
            return;
        }

        const content = this.files[filename].content;
        if (!content) {
            this.printOutput(`(empty file)`);
            return;
        }

        const lines = content.split('\n');
        lines.forEach((line, index) => {
            this.printOutput(`${index + 1}: ${line}`);
        });

        this.printSuccess(`End of ${filename} (${lines.length} lines)`);
    }

    listFiles() {
        const files = Object.keys(this.files);
        if (files.length === 0) {
            this.printOutput('total 0');
            return;
        }

        this.printOutput(`total ${files.length}`);
        files.forEach(filename => {
            const file = this.files[filename];
            const size = new Blob([file.content]).size;
            const date = file.created.toLocaleString();
            const modified = file.modified ? '*' : '';
            this.printOutput(`-rw-r--r-- 1 user user ${size.toString().padStart(6)} ${date} ${filename}${modified}`);
        });
    }

    deleteFile(filename) {
        if (!this.files[filename]) {
            this.printError(`File not found: ${filename}`);
            return;
        }

        delete this.files[filename];

        if (this.currentFile === filename) {
            this.currentFile = null;
            this.editor.value = '';
            this.welcomeMsg.classList.remove('hidden');
            document.getElementById('mode').textContent = 'COMMAND';
        }

        this.printSuccess(`Deleted: ${filename}`);
        this.renderFileList();
        this.updateStatus();
    }

    saveCurrentFile() {
        if (!this.currentFile) {
            this.printError('No file open. Use: nano <filename>');
            return;
        }

        this.files[this.currentFile].modified = false;
        this.files[this.currentFile].saved = new Date();
        this.printSuccess(`Saved: ${this.currentFile}`);
        this.renderFileList();
    }

    createEmptyFile(filename) {
        if (this.files[filename]) {
            this.printError(`File already exists: ${filename}`);
            return;
        }

        this.files[filename] = {
            content: '',
            created: new Date(),
            modified: false
        };

        this.printSuccess(`Created: ${filename}`);
        this.renderFileList();
    }

    copyFile(source, dest) {
        if (!this.files[source]) {
            this.printError(`Source file not found: ${source}`);
            return;
        }

        this.files[dest] = {
            content: this.files[source].content,
            created: new Date(),
            modified: false
        };

        this.printSuccess(`Copied: ${source} -> ${dest}`);
        this.renderFileList();
    }

    moveFile(source, dest) {
        if (!this.files[source]) {
            this.printError(`Source file not found: ${source}`);
            return;
        }

        this.files[dest] = this.files[source];
        delete this.files[source];

        if (this.currentFile === source) {
            this.currentFile = dest;
        }

        this.printSuccess(`Moved: ${source} -> ${dest}`);
        this.renderFileList();
    }

    clearScreen() {
        this.outputArea.innerHTML = '';
        this.outputArea.appendChild(this.commandLine);
    }

    exitEditor() {
        if (this.currentFile && this.files[this.currentFile].modified) {
            this.printError(`Unsaved changes in ${this.currentFile}. Use 'save' first or 'exit!' to force.`);
            return;
        }

        this.currentFile = null;
        this.editor.value = '';
        this.welcomeMsg.classList.remove('hidden');
        document.getElementById('mode').textContent = 'COMMAND';
        this.updateLineNumbers();
        this.updateStatus();
        this.printSuccess('Editor closed. Use "nano <file>" to edit.');
    }

    autocomplete() {
        const val = this.commandInput.value;
        const commands = ['nano', 'cat', 'ls', 'rm', 'clear', 'pwd', 'echo', 'date', 'whoami', 'save', 'exit', 'help', 'touch', 'cp', 'mv', 'neofetch'];
        const files = Object.keys(this.files);

        const matches = [...commands, ...files].filter(c => c.startsWith(val));
        if (matches.length === 1) {
            this.commandInput.value = matches[0];
        } else if (matches.length > 1) {
            this.printOutput(matches.join('  '));
        }
    }

    renderFileList() {
        const files = Object.keys(this.files);
        if (files.length === 0) {
            this.fileList.innerHTML = '<li style="color: var(--text-dim); padding: 4px 8px;">(empty)</li>';
            return;
        }

        this.fileList.innerHTML = files.map(filename => {
            const file = this.files[filename];
            const isActive = this.currentFile === filename;
            const isModified = file.modified;

            return `
                <li class="file-item ${isActive ? 'active' : ''}" onclick="term.openFile('${filename}')">
                    <span>${filename}</span>
                    ${isModified ? '<span class="unsaved">[+]</span>' : ''}
                </li>
            `;
        }).join('');
    }

    scrollToBottom() {
        this.outputArea.scrollTop = this.outputArea.scrollHeight;
    }
}

const term = new LinuxTerminal();
