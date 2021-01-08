import * as monaco from 'monaco-editor'
import { registerRulesForLanguage } from 'monaco-ace-tokenizer'
import prettier from 'prettier/standalone'
import solidityPlugin from 'prettier-plugin-solidity'
import SolidityHighlightRules from './SolidityHighlightRules'

export default function () {
  monaco.languages.register({
    id: 'solidity'
  })
  registerRulesForLanguage('solidity', new SolidityHighlightRules())

  monaco.languages.registerDocumentFormattingEditProvider('solidity', {
    provideDocumentFormattingEdits (model) {
      const code = model.getValue()

      const formatted = prettier.format(code, {
        parser: 'solidity-parse',
        plugins: [solidityPlugin],
      })
      return [{
        range: model.getFullModelRange(),
        text: formatted,
      }]
    },
  })
}