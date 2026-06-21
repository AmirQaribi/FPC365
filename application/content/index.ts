/**
 * Content-script entry point. Bundled by esbuild into dist/content.js and
 * injected into supported Microsoft pages (see public/manifest.json).
 */
import { ContentController } from "./ContentController"
import { initDatePickerBridge } from "./DatePickerBridge"

function bootstrap(): void {
	const controller = new ContentController()
	void controller.init()

	// The Fluent v9 date-picker bridge runs independently of the text converter.
	try {
		initDatePickerBridge()
	} catch {
		/* bridge is best-effort */
	}
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", bootstrap)
} else {
	bootstrap()
}
