/**
 * DOM heuristics for deciding whether an element is a date field and whether an
 * element should be skipped during conversion.
 * Extracted from the original DateConverter.ts (fix #6).
 */
import { parseDateString } from "./engine"

export function looksLikeDateField(element: Element | null): boolean {
	if (!element) return false
	const tag = element.tagName?.toLowerCase()
	if (tag === "input" || tag === "textarea") {
		const type = (element.getAttribute("type") || "text").toLowerCase()
		if (type === "date" || type === "datetime-local") return true
		const ariaLabel = (element.getAttribute("aria-label") || "").toLowerCase()
		const placeholder = (element.getAttribute("placeholder") || "").toLowerCase()
		if (/date|time|\u062a\u0627\u0631\u06cc\u062e/.test(ariaLabel + placeholder)) return true
		if (
			element.closest(
				'[data-id*="date"], [data-id*="time"], [data-id*="Date"], .ms-DatePicker, [class*="DatePicker"], [class*="date"], [class*="Date"]',
			)
		)
			return true
		if (parseDateString((element as HTMLInputElement).value)) return true
	}
	return false
}

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "PATH", "IFRAME"])

export function shouldSkipElement(el: Element | null): boolean {
	if (!el || el.nodeType !== Node.ELEMENT_NODE) return true
	if (SKIP_TAGS.has(el.tagName)) return true
	if (el.closest?.("[data-fpc365-persian-skip]")) return true
	if (el.classList?.contains("fpc365-persian-tooltip")) return true
	if (
		el.closest?.(
			".ms-DatePicker, [class*='DatePicker'], [class*='Callout'], #fpc365-refresh-banner, .pdp-root",
		)
	)
		return true
	return false
}
