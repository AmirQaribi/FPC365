/**
 * Vite configuration for the FPC365 MV3 extension (fix #7).
 *
 * MV3 content scripts cannot be ES modules, so every entry is built as a
 * self-contained IIFE. Because Vite's library mode builds a single entry at a
 * time, the actual per-entry loop lives in scripts/vite-build.mjs, which calls
 * Vite's build() API once per entry using this shared config.
 *
 * This file also teaches Vite to import *.html files as raw strings (used by
 * datepicker.ts -> datepicker.html, fix #4) and compiles imported .scss.
 */
import { defineConfig, type Plugin } from "vite"

export default defineConfig({
	plugins: [],
	css: {
		preprocessorOptions: {
			scss: {
				loadPaths: [".", "presentation"],
			},
		},
	},
	build: {
		target: ["chrome110", "edge110"],
		minify: true,
		sourcemap: false,
		emptyOutDir: false,
		outDir: "dist",
	},
})
