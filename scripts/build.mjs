import esbuild from 'esbuild'
import path from 'path'
import repl from 'repl'
import fs from 'fs/promises'

import {
  BASE_DIR,
  PLUGINS_DIR,
  DIST_DIR,
  pluginManifests,
  buildManifestPath,
  esbuildPluginNeptunePlugin,
} from './esbuild-plugin-neptune-plugin.mjs'
import { esbuildPluginProblemMatcher } from './esbuild-plugin-problem-matcher.mjs'

const args = process.argv.slice(2)
const options = {
  production: args.some(a => a.match(/-p|--production/i)),
  watch: args.some(a => a.match(/-w|--watch/i)),
}

/**
 * @typedef {{name: string; description: string; author: string; hash?: string; main?: string;}} PluginManifest
 */

/**
 * Read JSON file from disk at path
 * @param {string} p Path
 * @param {string} encoding Encoding for fs.readFile
 * @returns {Promise<object>} JSON.parse resu;t
 */
async function readJsonFile(p, encoding = 'utf8') {
  const contents = await fs.readFile(p, encoding)
  try {
    return JSON.parse(contents)
  } catch (err) {
    throw err
  }
}

const forcePathToUnix = p => (path.win32 === path ? path.posix.format(path.parse(p)) : p)

/**
 * @type {string[]}
 */
const entryPoints = []

for (const ent of await fs.readdir(PLUGINS_DIR, { withFileTypes: true })) {
  if (!ent.isDirectory()) continue
  const { name } = ent
  try {
    const pth = path.join(PLUGINS_DIR, name)
    const pkg = await readJsonFile(path.join(pth, 'package.json'))

    let ep = path.join(pth, 'index.js')

    if (pkg.main) ep = path.join(pth, pkg.main)

    ep = path.relative(BASE_DIR, ep)
    // Check for existence of entry point, throws on failure
    void (await fs.stat(ep))

    /**
     * @type {PluginManifest}
     */
    const manifest = {
      name: pkg.displayName || pkg.name,
      description: pkg.description ?? '',
      author: pkg.author ?? '',
      main: forcePathToUnix(path.relative(pth, ep)),
    }

    if (typeof manifest.name !== 'string') throw new TypeError(`Missing "displayName" or "name" in package.json`)
    if (typeof manifest.description !== 'string')
      console.warn('Plugin', name, 'is missing a "description" in package.json')
    if (typeof manifest.author !== 'string') console.warn('Plugin', name, 'is missing an "author" in package.json')

    pluginManifests.set(name, manifest)
    // entryPoints.push(ep, buildManifestPath(name))
    entryPoints.push(buildManifestPath(name), ep)
    console.log('Added plugin', name, 'at', ep)
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(
        'Plugin',
        name,
        'is missing a valid',
        err.path.includes('package.json') ? 'package.json' : 'entry point'
      )
    } else {
      console.error('Unknown error while parsing plugin', name)
    }
    console.error(err)
  }
}

console.log(`Building in ${options.production ? 'production' : 'development'}`)
const ctx = await esbuild.context({
  entryPoints,

  /// Output to dist/[plugin] and specify "main" in manifest.json
  outbase: PLUGINS_DIR,
  outdir: DIST_DIR,

  bundle: true,
  minify: options.production,
  sourcemap: true,
  format: 'esm',

  platform: 'browser',
  external: [...repl._builtinLibs.map(m => [m, `node:${m}`]), '@neptune', '@plugin'].flat(),

  write: false,

  plugins: [esbuildPluginNeptunePlugin, esbuildPluginProblemMatcher(options.watch)],

  logLevel: 'info',
  logLimit: process.env.CI ? 0 : 30,
})

if (options.watch) {
  const { host, port } = await ctx.serve({})
} else {
  const result = await ctx.rebuild()
  void (await Promise.all(
    result.outputFiles.map(async f => {
      await fs.mkdir(path.dirname(f.path), {
        recursive: true,
      })
      return fs.writeFile(f.path, f.contents, {
        encoding: 'utf8',
      })
    })
  ))
  await ctx.dispose()
  console.log('Build complete!')
}
