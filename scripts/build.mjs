// ---------------------------------------------------------------------------
// Build script: compiles TypeScript + SCSS into a flat, unpacked-extension
// friendly `dist/` folder that Chrome and Edge can load directly.
//
//   TS  ->  esbuild (IIFE bundles, no imports left at runtime)
//   SCSS -> sass (compiled CSS)
//   static assets (manifest, icons, html) -> copied verbatim
//
// Usage:
//   node scripts/build.mjs            one-off production build
//   node scripts/build.mjs --watch    rebuild on change
// ---------------------------------------------------------------------------
import { build, context } from "esbuild"
import * as sass from "sass"
import { promises as fs } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")
const dist = path.join(root, "dist")
const watch = process.argv.includes("--watch")

// Entry points: [sourceFile, outputName]
const tsEntries = [
	["application/content/index.ts", "content.js"],
	["presentation/components/popup/popup.ts", "popup.js"],
	["presentation/components/options/options.ts", "options.js"],
]

// SCSS entry points: [sourceFile, outputName]
const scssEntries = [
	["presentation/content.scss", "content.css"],
	["presentation/components/popup/popup.scss", "popup.css"],
	["presentation/components/options/options.scss", "options.css"],
]

// HTML files: [sourceFile, outputName]
const htmlEntries = [
	["presentation/components/popup/popup.html", "popup.html"],
	["presentation/components/options/options.html", "options.html"],
]

async function clean() {
	await fs.rm(dist, { recursive: true, force: true })
	await fs.mkdir(dist, { recursive: true })
}

// SCSS is compiled separately by sass (see buildScss). The entry TS files now
// import their .scss for the Vite pipeline (fix #7); for the esbuild fallback we
// resolve those imports to an empty module so the JS still bundles cleanly.
const ignoreScssPlugin = {
	name: "ignore-scss",
	setup(b) {
		b.onResolve({ filter: /\.scss$/ }, (args) => ({
			path: args.path,
			namespace: "scss-ignore",
		}))
		b.onLoad({ filter: /.*/, namespace: "scss-ignore" }, () => ({
			contents: "",
			loader: "js",
		}))
	},
}

const rawHtmlPlugin = {
	name: "raw-html",
	setup(b) {
		b.onResolve({ filter: /\.html\?raw$/ }, (args) => ({
			path: path.resolve(args.resolveDir, args.path.replace(/\?raw$/, "")),
			namespace: "raw-html",
		}))
		b.onLoad({ filter: /.*/, namespace: "raw-html" }, async (args) => ({
			contents: await fs.readFile(args.path, "utf8"),
			loader: "text",
		}))
	},
}

function esbuildConfig() {
	return {
		entryPoints: Object.fromEntries(
			tsEntries.map(([src, out]) => [out.replace(/\.js$/, ""), path.join(root, src)]),
		),
		outdir: dist,
		bundle: true,
		format: "iife",
		target: ["chrome110", "edge110"],
		platform: "browser",
		loader: { ".html": "text" },
		plugins: [ignoreScssPlugin, rawHtmlPlugin],
		logLevel: "info",
		minify: !watch,
		sourcemap: watch ? "inline" : false,
	}
}

async function buildScss() {
	for (const [src, out] of scssEntries) {
		const result = sass.compile(path.join(root, src), {
			style: watch ? "expanded" : "compressed",
			loadPaths: [root, path.join(root, "presentation")],
		})
		await fs.writeFile(path.join(dist, out), result.css)
	}
	console.log(`sass: compiled ${scssEntries.length} stylesheet(s)`)
}

async function copyStatic() {
	// manifest
	await fs.copyFile(
		path.join(root, "public/manifest.json"),
		path.join(dist, "manifest.json"),
	)
	// icons
	await fs.cp(path.join(root, "public/icons"), path.join(dist, "icons"), {
		recursive: true,
	})
	// html
	for (const [src, out] of htmlEntries) {
		await fs.copyFile(path.join(root, src), path.join(dist, out))
	}
	console.log("copied: manifest, icons, html")
}

async function run() {
	await clean()
	await copyStatic()
	await buildScss()

	if (watch) {
		const ctx = await context(esbuildConfig())
		await ctx.watch()
		console.log("watching for changes... (scss/static are not watched)")
	} else {
		await build(esbuildConfig())
		console.log(`\nBuild complete -> ${path.relative(process.cwd(), dist)}`)
	}
}

run().catch((err) => {
	console.error(err)
	process.exit(1)
})
