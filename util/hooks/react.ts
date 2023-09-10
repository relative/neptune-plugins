import type React from 'react'
import { modules } from '@neptune'

export function findReactModule() {
  const react = modules.find(e => e.exports?.createElement)
  if (!react) throw new Error("Couldn't find React module")
  return react.exports as typeof React
}

function hookReactCreateElement() {
  // console.log(findReactModule().createElement.toString())
}

// main
hookReactCreateElement()
