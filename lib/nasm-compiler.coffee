'use babel'

{CompositeDisposable} = require 'atom'
{exec} = require 'child_process'
path = require 'path'

module.exports =
  config:
    nasmPath:
      type: 'string'
      default: 'nasm'
      title: 'Path to NASM executable'
      description: 'Full path to NASM executable if it\'s not in your PATH'
    nasmFlags:
      type: 'string'
      default: '-f elf64'
      title: 'NASM compilation flags'
      description: 'Default flags passed to NASM (e.g., -f elf64 for 64-bit ELF)'
    ldFlags:
      type: 'string'
      default: ''
      title: 'Linker flags'
      description: 'Flags passed to linker (ld) when building executable'
    showToolbar:
      type: 'boolean'
      default: true
      title: 'Show toolbar buttons'
      description: 'Show compile buttons in the editor toolbar'

  subscriptions: null
  toolbar: null

  activate: (state) ->
    @subscriptions = new CompositeDisposable

    # Register commands
    @subscriptions.add atom.commands.add 'atom-workspace',
      'nasm-compiler:compile': => @compile()
    @subscriptions.add atom.commands.add 'atom-workspace',
      'nasm-compiler:compile-and-run': => @compileAndRun()

    # Create toolbar
    @createToolbar()

    # Update toolbar when active pane changes
    @subscriptions.add atom.workspace.onDidChangeActiveTextEditor => @updateToolbar()

  deactivate: ->
    @subscriptions.dispose()
    @toolbar?.remove()
    @toolbar = null

  serialize: ->

  createToolbar: ->
    @toolbar = document.createElement('div')
    @toolbar.className = 'nasm-compiler-toolbar'

    @compileButton = document.createElement('button')
    @compileButton.className = 'btn'
    @compileButton.innerHTML = '<span class="icon icon-zap"></span> Compile'
    @compileButton.onclick = => @compile()

    @compileRunButton = document.createElement('button')
    @compileRunButton.className = 'btn btn-success'
    @compileRunButton.innerHTML = '<span class="icon icon-zap"></span> Compile & Run'
    @compileRunButton.onclick = => @compileAndRun()

    @toolbar.appendChild(@compileButton)
    @toolbar.appendChild(@compileRunButton)

    # Add toolbar to workspace
    atom.workspace.addHeaderPanel(item: @toolbar)
    @updateToolbar()

  updateToolbar: ->
    if atom.config.get('nasm-compiler.showToolbar')
      editor = atom.workspace.getActiveTextEditor()
      isAsm = editor?.getGrammar()?.scopeName is 'source.assembly'
      @toolbar.style.display = if isAsm then 'flex' else 'none'
    else
      @toolbar.style.display = 'none'

  compile: ->
    # ... (остальной код compile из предыдущей версии)

  compileAndRun: ->
    # ... (остальной код compileAndRun из предыдущей версии)
