import { bar } from './bar.js'
import data from './data.json'

bar()

export function foo() {
  console.log(123)
  console.log(data)
}