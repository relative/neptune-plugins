// TODO: need this plugin.ts file since my live-reload esbuild plugin breaks importing the entry point lol

import { createPlugin } from '@relative/util'
const plugin = await createPlugin()
export default plugin
