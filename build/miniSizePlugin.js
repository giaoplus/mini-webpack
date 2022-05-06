import uglify from 'uglify-js'

export default class MiniSizePlugin {

  apply(hooks) {
    hooks.emitFile.tap('miniSizePlugin', (data) => {
      data.filePath = './dist/test.js'
      let { code } = uglify.minify(data.code)
      data.code = code
    })
  }
}