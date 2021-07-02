import * as monaco from 'monaco-editor'
import { registerRulesForLanguage } from 'monaco-ace-tokenizer'
import { BaseProjectManager } from '@obsidians/workspace'

import prettier from 'prettier/standalone'
import solidityPlugin from 'prettier-plugin-solidity'

import SolidityHighlightRules from './SolidityHighlightRules'

export default function (editor, editorComponent) {
  // editor.addAction({
  //   id: 'solhint',
  //   label: 'Solhint',
  //   keybindings: null,
  //   precondition: null,
  //   keybindingContext: null,
  //   contextMenuGroupId: 'navigation',
  //   contextMenuOrder: 1.5,
  //   run: () => BaseProjectManager.instance.lint(),
  // })

  editor.addCommand(
    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S,
    () => {
      editorComponent.props.onCommand('save')
      BaseProjectManager.instance.lint()
    }
  )

  setTimeout(() => {
    BaseProjectManager.instance.lint()
  }, 100)

  monaco.languages.register({ id: 'solidity' })
  monaco.languages.setLanguageConfiguration('solidity', {
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/'],
    },
    brackets: [
      ['(', ')'],
      ['[', ']'],
      ['{', '}'],
    ],
    autoClosingPairs: [
      { open: '(', close: ')' },
      { open: '[', close: ']' },
      { open: '{', close: '}' },
    ]
  })
  registerRulesForLanguage('solidity', new SolidityHighlightRules())

  monaco.languages.registerDocumentFormattingEditProvider('solidity', {
    async provideDocumentFormattingEdits (model) {
      const code = model.getValue()

      const formatted = prettier.format(code, {
        parser: 'solidity-parse',
        plugins: [solidityPlugin],
        tabWidth: 2,
      })

      return [{
        range: model.getFullModelRange(),
        text: formatted,
      }]
    },
  })
}