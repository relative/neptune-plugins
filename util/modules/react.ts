import type React from 'react'
import { modules } from '@neptune'

const react = modules.find(e => e.exports?.createElement)
if (!react) throw new Error("Couldn't find React module")

export default react.exports as typeof React & {
  /**
   * added by hooks/react.ts to save the true original createElement function
   */
  _createElement?: typeof React.createElement
}
