// ---------------------------------------------------------------------------
// Vite build (fix #7) \u2014 the primary build for the extension.
//
// MV3 content scripts must be plain IIFEs (no ESM), and Vite's library mode
// builds one entry at a time, so we call Vite's build() API once per entry and
// emit a flat dist/ that Chrome and Edge can load unpacked:
//
//   <name>.js   IIFE bundle (TS -> JS)
//   <name>.css  compiled SCSS imported by that entry
//   manifest.json, icons/, *.html  copied verbatim
//
// Usage:  node scripts/vite-build.mjs
// ---------------------------------------------------------------------------
import { promises as fs } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { build } from "vite"
import * as sass from "sass"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")
const dist = path.join(root, "dist")
const configFile = path.join(root, "vite.config.ts")

// [outputName, sourceEntry, iifeGlobalName]
const entries = [
	["content", "application/content/index.ts", "FPC365Content"],
	["popup", "presentation/components/popup/popup.ts", "FPC365Popup"],
	["options", "presentation/components/options/options.ts", "FPC365Options"],
]

const htmlEntries = [
	["presentation/components/popup/popup.html", "popup.html"],
	["presentation/components/options/options.html", "options.html"],
]

// [sourceScss, outputCss] — compiled with sass because Vite's library mode
// does not reliably emit the entry CSS in this setup.
const scssEntries = [
	["presentation/content.scss", "content.css"],
	["presentation/components/popup/popup.scss", "popup.css"],
	["presentation/components/options/options.scss", "options.css"],
]

async function buildScss() {
	for (const [src, out] of scssEntries) {
		const result = sass.compile(path.join(root, src), {
			style: "compressed",
			loadPaths: [root, path.join(root, "presentation")],
		})
		await fs.writeFile(path.join(dist, out), result.css)
	}
	console.log(`sass: compiled ${scssEntries.length} stylesheet(s)`)
}

// Vite library mode emits the extracted CSS as "style.css" and ignores
// assetFileNames for it. Rename it to "<name>.css" so the manifest and the
// popup/options <link> tags resolve.
async function renameEmittedCss(name) {
	const wanted = path.join(dist, `${name}.css`)
	try {
		await fs.access(wanted)
		return // already correctly named
	} catch {}
	const known = entries.map(([n]) => `${n}.css`)
	const files = await fs.readdir(dist)
	const stray = files.find((f) => f.endsWith(".css") && !known.includes(f))
	if (stray) await fs.rename(path.join(dist, stray), wanted)
}

async function clean() {
	await fs.rm(dist, { recursive: true, force: true })
	await fs.mkdir(dist, { recursive: true })
}

async function buildEntry([name, entry, globalName]) {
	await build({
		configFile,
		root,
		logLevel: "info",
		build: {
			outDir: dist,
			emptyOutDir: false,
			cssCodeSplit: false,
			lib: {
				entry: path.join(root, entry),
				formats: ["iife"],
				name: globalName,
				fileName: () => `${name}.js`,
			},
			rollupOptions: {
				output: { assetFileNames: `${name}.[ext]` },
			},
		},
	})
	await renameEmittedCss(name)
}

async function copyStatic() {
	await fs.copyFile(
		path.join(root, "public/manifest.json"),
		path.join(dist, "manifest.json"),
	)
	await fs.cp(path.join(root, "public/icons"), path.join(dist, "icons"), {
		recursive: true,
	})
	for (const [src, out] of htmlEntries) {
		await fs.copyFile(path.join(root, src), path.join(dist, out))
	}
}

async function run() {
	await clean()
	for (const entry of entries) {
		await buildEntry(entry)
	}
	await buildScss()
	await copyStatic()
	console.log(`\nVite build complete -> ${path.relative(process.cwd(), dist)}`)
}

run().catch((err) => {
	console.error(err)
	process.exit(1)
})
