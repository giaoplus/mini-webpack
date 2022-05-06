import prettier from "prettier"

export default class FormatPlugin {
  apply(hooks) {
    hooks.emitFile.tap('formatPlugin', (data) => {
      data.filePath = './dist/format.js'
      let code = prettier.format(data.code, { semi: false, parser: 'babel' })
      data.code = code
    })
  }
}