import fs from 'fs'
import path from 'path'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import babelCore from 'babel-core'
import ejs from 'ejs'
import { jsonLoader } from './jsonloader.js'
import MiniSizePlugin from './miniSizePlugin.js'
import { SyncHook } from 'tapable'

const _dirname = path.resolve('./')
let moduleId = 0
const hooks = {
  emitFile: new SyncHook(['context'])
}

const webpackConfig = {
  module: {
    rules: [{
      test: /\.json$/,
      uses: [
        jsonLoader
      ]
    }]
  },
  plugins: [
    new MiniSizePlugin()
  ]
}

function creatAssets(filePath) {
  // 1 获取文件内容
  let source = fs.readFileSync(path.resolve(_dirname, filePath), { encoding: 'utf-8' })

  // loader
  const loader = webpackConfig.module.rules
  loader.forEach(({test, uses}) => {
    if(test.test(filePath)) {
      uses.forEach(use => {
        source = use(source)
      })
    }
  })

  // 2 获取依赖关系
  const ast = parse(source, {
    sourceType: 'module'
  })
  const deps = []
  traverse.default(ast, {
    ImportDeclaration({node}) {
      deps.push(node.source.value)
    }
  })

  const {code} = babelCore.transformFromAst(ast, null, {
    presets: ['env']
  })
  
  return {
    filePath,
    code,
    deps,
    id: moduleId ++,
    mapping: {}
  }
}

const globalAssets = []

function creatGraph() {
  const mainAsset = creatAssets('./main.js')

  const queue = [ mainAsset ]

  for (const asset of queue) {
    asset.deps.forEach(childPath => {
      if(globalAssets.includes(childPath)) {
        let child = queue.filter(asset => asset.filePath === childPath)[0]
        asset.mapping[childPath] = child.id
        return
      }

      globalAssets.push(childPath)
      const child = creatAssets(childPath)

      asset.mapping[childPath] = child.id

      queue.push(child)
    })
  }

  return queue
}

function pluginInit() {
  const { plugins } = webpackConfig

  plugins.forEach(plugin => {
    plugin.apply(hooks)
  })
}

pluginInit()
const graph = creatGraph()
function build() {
  const template = fs.readFileSync(path.resolve(_dirname,'./build/bundle.ejs'), { encoding: 'utf-8' })

  const data = graph.map(asset => {
    const {mapping, code, id} = asset
    return {
      mapping, code, id
    }
  })

  const code = ejs.render(template, { data })

  const context = {
    code,
    filePath: './dist/bundle.js'
  }

  hooks.emitFile.call(context)

  fs.writeFileSync(path.resolve(_dirname, context.filePath), context.code);
}

build()