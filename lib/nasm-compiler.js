'use babel';

import { CompositeDisposable } from 'atom';
import { exec } from 'child_process';
import path from 'path';

export default {
  config: {
    nasmPath: {
      type: 'string',
      default: 'nasm',
      title: 'Path to NASM executable',
      description: 'Full path to NASM executable if it\'s not in your PATH'
    },
    nasmFlags: {
      type: 'string',
      default: '-f elf64',
      title: 'NASM compilation flags',
      description: 'Default flags passed to NASM (e.g., -f elf64 for 64-bit ELF)'
    },
    ldFlags: {
      type: 'string',
      default: '',
      title: 'Linker flags',
      description: 'Flags passed to linker (ld) when building executable'
    },
    showToolbar: {
      type: 'boolean',
      default: true,
      title: 'Show toolbar buttons',
      description: 'Show compile buttons in the editor toolbar'
    }
  },

  subscriptions: null,
  toolbar: null,
  compileButton: null,
  compileRunButton: null,

  activate(state) {
    this.subscriptions = new CompositeDisposable();

    // Register commands
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'nasm-compiler:compile': () => this.compile(),
      'nasm-compiler:compile-and-run': () => this.compileAndRun()
    }));

    // Create toolbar
    this.createToolbar();

    // Update toolbar when active pane changes
    this.subscriptions.add(atom.workspace.onDidChangeActiveTextEditor(() => this.updateToolbar()));
  },

  deactivate() {
    this.subscriptions.dispose();
    this.toolbar?.remove();
    this.toolbar = null;
  },

  serialize() {
    return {};
  },

  createToolbar() {
    this.toolbar = document.createElement('div');
    this.toolbar.className = 'nasm-compiler-toolbar';

    this.compileButton = document.createElement('button');
    this.compileButton.className = 'btn';
    this.compileButton.innerHTML = '<span class="icon icon-zap"></span> Compile';
    this.compileButton.onclick = () => this.compile();

    this.compileRunButton = document.createElement('button');
    this.compileRunButton.className = 'btn btn-success';
    this.compileRunButton.innerHTML = '<span class="icon icon-zap"></span> Compile & Run';
    this.compileRunButton.onclick = () => this.compileAndRun();

    this.toolbar.appendChild(this.compileButton);
    this.toolbar.appendChild(this.compileRunButton);

    // Add toolbar to workspace
    const headerPanel = atom.workspace.getHeaderPanels()[0];
    headerPanel.insertBefore(this.toolbar, headerPanel.firstChild);
    this.updateToolbar();
  },

  updateToolbar() {
    if (atom.config.get('nasm-compiler.showToolbar')) {
      const editor = atom.workspace.getActiveTextEditor();
      const isAsm = editor?.getGrammar()?.scopeName === 'source.assembly';
      this.toolbar.style.display = isAsm ? 'flex' : 'none';
    } else {
      this.toolbar.style.display = 'none';
    }
  },

  compile() {
    const editor = atom.workspace.getActiveTextEditor();
    if (!editor) return;

    const filePath = editor.getPath();
    if (!filePath) return;

    const fileName = path.basename(filePath, '.asm');
    const fileDir = path.dirname(filePath);
    const objFile = path.join(fileDir, `${fileName}.o`);
    const binFile = path.join(fileDir, fileName);

    const nasmPath = atom.config.get('nasm-compiler.nasmPath');
    const nasmFlags = atom.config.get('nasm-compiler.nasmFlags');
    const ldFlags = atom.config.get('nasm-compiler.ldFlags');

    // First compile with NASM
    const nasmCommand = `"${nasmPath}" ${nasmFlags} "${filePath}" -o "${objFile}"`;

    exec(nasmCommand, (error, stdout, stderr) => {
      if (error) {
        atom.notifications.addError('NASM Compilation Failed', {
          detail: stderr,
          dismissable: true
        });
        return;
      }

      // Then link with LD if compilation succeeded
      const ldCommand = `ld ${ldFlags} "${objFile}" -o "${binFile}"`;

      exec(ldCommand, (error, stdout, stderr) => {
        if (error) {
          atom.notifications.addError('Linking Failed', {
            detail: stderr,
            dismissable: true
          });
        } else {
          atom.notifications.addSuccess('Compilation Successful', {
            detail: `Executable created: ${binFile}`
          });
        }
      });
    });
  },

  compileAndRun() {
    this.compile();
    const editor = atom.workspace.getActiveTextEditor();
    if (!editor) return;

    const filePath = editor.getPath();
    if (!filePath) return;

    const fileName = path.basename(filePath, '.asm');
    const fileDir = path.dirname(filePath);
    const binFile = path.join(fileDir, fileName);

    // Wait a bit for compilation to finish
    setTimeout(() => {
      exec(`"${binFile}"`, (error, stdout, stderr) => {
        if (error) {
          atom.notifications.addError('Execution Failed', {
            detail: stderr,
            dismissable: true
          });
        } else {
          atom.notifications.addSuccess('Program Output', {
            detail: stdout || "(Program executed successfully, no output)"
          });
        }
      });
    }, 1000);
  }
};
