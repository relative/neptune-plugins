import '@relative/util'
import { unints } from './state'
import './react'

export function onUnload() {
  unints.forEach(e => e())
}
