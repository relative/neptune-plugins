import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url),
  __dirname = path.dirname(__filename)
export const BASE_DIR = path.resolve(__dirname, '..'),
  PLUGINS_DIR = path.join(BASE_DIR, 'plugins'),
  DIST_DIR = path.join(BASE_DIR, 'dist')

export const DEV_SETTINGS = {
  host: '',
  port: 0,
}

// Make sure these make sense if they are changed
export const buildManifestPath = pluginName => path.join(PLUGINS_DIR, pluginName, 'manifest.json')
export const isManifestPath = p => path.basename(p) === 'manifest.json'
export const getPluginNameFromPath = p => {
  const relativePath = path.relative(p.startsWith(PLUGINS_DIR) ? PLUGINS_DIR : DIST_DIR, p)
  if (relativePath.startsWith('..')) throw new TypeError(`Couldn't determine plugin name from path "${p}"`)
  const [pluginName] = relativePath.split(path.sep, 1)
  return pluginName
}

/**
 * @typedef {{name: string; description: string; author: string; hash?: string; main?: string;}} PluginManifest
 */

/**
 * @type {Map<string, PluginManifest>}
 */
export const pluginManifests = new Map()

/**
 * @type {string[]}
 */
export const entryPoints = []

/**
 * @param {esbuild.OutputFile} manifestFile
 * @param {string} hash
 */
function fixManifest(manifestFile, hash) {
  const manifest = JSON.parse(manifestFile.text)
  manifest.hash = hash
  manifestFile.contents = new Uint8Array(Buffer.from(JSON.stringify(manifest), 'utf8'))
}

const tplDevLiveReload = await readFile(path.join(__dirname, 'dev-live-reload.ts'), 'utf8')

/**
 * @type {import('esbuild').Plugin}
 */
export const esbuildPluginNeptunePlugin = {
  name: 'neptune-plugin',
  setup(build) {
    /**
     * Need to disable "write" to actually modify the output files in onEnd callback
     * @see https://github.com/evanw/esbuild/issues/2999
     */
    build.initialOptions.write = false

    const manifestFilter = /manifest\.json$/i,
      namespace = 'neptune-ns'

    /**
     * Loads [plugin]/manifest.json using our loader rather than load from file
     */
    build.onResolve({ filter: manifestFilter }, args => {
      const pluginName = getPluginNameFromPath(args.path),
        manifest = pluginManifests.get(pluginName)
      return {
        path: args.path,
        namespace,
        watchDirs: [path.dirname(args.path)],
        pluginData: {
          manifest,
        },
      }
    })

    /**
     * Hash is the current ts as the onEnd callback doesn't work as intended in serve mode
     * The onEnd callback will update the hash when bundling.
     * @see https://github.com/evanw/esbuild/issues/3101
     */
    build.onLoad({ filter: manifestFilter, namespace }, args => ({
      contents: JSON.stringify({
        ...args.pluginData.manifest,
        hash: Date.now().toString(),
      }),
      loader: 'copy',
    }))

    /**
     * Updates the hash in each [plugin]/manifest.json
     */
    build.onEnd(r => {
      /**
       * @type {Map<string, {hash?: string; manifestFile?: esbuild.OutputFile}>}
       */
      const cache = new Map()

      for (const file of r.outputFiles) {
        const pn = getPluginNameFromPath(file.path)
        const obj = cache.get(pn)
        if (!isManifestPath(file.path)) {
          if (obj?.manifestFile) fixManifest(obj.manifestFile, file.hash)
          else cache.set(pn, { hash: file.hash })
        } else {
          if (obj?.hash) fixManifest(file, obj.hash)
          else cache.set(pn, { manifestFile: file })
        }
      }
    })

    // pseudo if !production
    if (!build.initialOptions.minify) {
      build.onResolve({ filter: /\.ts$/i }, args => {
        const normalized = path.join(args.resolveDir, args.path)
        if (entryPoints.includes(path.normalize(args.path))) {
          return {
            path: args.path,
            namespace,
            watchFiles: [args.path],
            pluginData: {
              pluginName: getPluginNameFromPath(normalized),
            },
          }
        }

        // Don't pass this to onLoad, just load it from file
        return {}
      })
      build.onLoad({ filter: /\.ts$/i, namespace }, async args => {
        const contents = await readFile(args.path)
        const devLdr = tplDevLiveReload.replace(
          '{dev_settings}',
          JSON.stringify({ ...DEV_SETTINGS, pluginName: args.pluginData.pluginName })
        )
        return {
          contents: devLdr + '\n' + contents,
          loader: 'ts',
          resolveDir: path.dirname(args.path),
        }
      })
    }
  },
}

/* /// The following is for output to dist/[plugin] (but strip first dir/)
  // [dir] here will be path to [plugin]/src, we want it to be [plugin]/
  entryNames: '[dir]/../[name]',

  // output paths will be relative to the PLUGINS_DIR
  outbase: PLUGINS_DIR,

  // output to dist dir
  outdir: 'dist', */

/* /// The following is for output to plugins/[plugin]/dist
  // [dir] here will be path to plugins/[plugin]/src
  // we want it to be plugins/[plugin]/dist
  entryNames: '[dir]/../dist/[name]',

  // output paths will be relative to the PLUGINS_DIR
  outbase: PLUGINS_DIR,

  // we want to output to the PLUGINS_DIR
  outdir: PLUGINS_DIR, */
