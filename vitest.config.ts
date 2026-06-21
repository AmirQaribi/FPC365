/**
 * Vitest configuration (fix #9).
 *
 * Reuses the Vite config (so the raw-HTML plugin used by datepicker.ts and
 * ReloadBanner.ts works inside tests too) and layers on the jsdom test
 * environment plus a chrome.* mock provided by tests/setup.ts.
 */
import { defineConfig, mergeConfig } from "vitest/config"
import viteConfig from "./vite.config"

export default mergeConfig(
	viteConfig,
	defineConfig({
		test: {
			environment: "jsdom",
			globals: true,
			setupFiles: ["./tests/setup.ts"],
			include: ["tests/**/*.test.ts"],
			coverage: {
				provider: "v8",
				reportsDirectory: "coverage",
				include: [
					"core/**/*.ts",
					"application/**/*.ts",
					"infra/**/*.ts",
					"presentation/**/*.ts",
				],
			},
		},
	}),
)
