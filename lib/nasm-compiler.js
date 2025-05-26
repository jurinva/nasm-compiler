'use babel';

import { CompositeDisposable } from 'atom';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

export default {
  config: {
    nasmPath: {
      type: 'string',
      default: '/usr/bin/nasm',
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
    }
  },

  subscriptions: null,

  activate(state) {
    this.subscriptions = new CompositeDisposable();

    // Привязываем методы к контексту
    this.compile = this.compile.bind(this);
    this.compileAndRun = this.compileAndRun.bind(this);

    // Регистрируем команды
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'nasm-compiler:compile': () => {
        console.log('Menu item "Compile" selected'); // Логирование выбора меню
        this.compile();
      },
      'nasm-compiler:compile-and-run': () => {
        console.log('Menu item "Compile and Run" selected'); // Логирование выбора меню
        this.compileAndRun();
      }
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  compile() {
    const editor = atom.workspace.getActiveTextEditor();
    if (!editor) return;

    const filePath = editor.getPath();
    if (!filePath || path.extname(filePath) !== '.asm') {
      atom.notifications.addWarning('Please save the file with .asm extension first');
      return;
    }

    const fileName = path.basename(filePath, '.asm');
    const fileDir = path.dirname(filePath);
    const objFile = path.join(fileDir, `${fileName}.o`);
    const binFile = path.join(fileDir, fileName);

    const nasmPath = atom.config.get('nasm-compiler.nasmPath').trim();
    const nasmFlags = atom.config.get('nasm-compiler.nasmFlags');
    const ldFlags = atom.config.get('nasm-compiler.ldFlags');

    // Проверяем доступность NASM
    if (!fs.existsSync(nasmPath)) {
      atom.notifications.addError('NASM executable not found at specified path');
      return;
    }

    // Компиляция с NASM
    const nasmCommand = `"${nasmPath}" ${nasmFlags} "${filePath}" -o "${objFile}"`;
    console.log(`Running NASM command: ${nasmCommand}`);

    exec(nasmCommand, (error, stdout, stderr) => {
      console.log('NASM stdout:', stdout);
      console.error('NASM stderr:', stderr);

      if (error) {
        atom.notifications.addError('NASM Compilation Failed', {
          detail: stderr,
          dismissable: true
        });
        return;
      }

      // Линковка с LD
      const ldCommand = `ld ${ldFlags} "${objFile}" -o "${binFile}"`;
      console.log(`Running LD command: ${ldCommand}`);

      exec(ldCommand, (error, stdout, stderr) => {
        console.log('LD stdout:', stdout);
        console.error('LD stderr:', stderr);

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

    setTimeout(() => {
      const editor = atom.workspace.getActiveTextEditor();
      if (!editor) return;

      const filePath = editor.getPath();
      if (!filePath) return;

      const fileName = path.basename(filePath, '.asm');
      const fileDir = path.dirname(filePath);
      const binFile = path.join(fileDir, fileName);

      // Проверяем существование скомпилированного файла
      if (!fs.existsSync(binFile)) {
        atom.notifications.addError('Compiled executable not found');
        return;
      }

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
