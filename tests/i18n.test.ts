import { describe, expect, it } from "vitest"
import {
	applyLanguageToggle,
	getTranslation,
	translateDocument,
} from "../infra/i18n/i18n"

describe("getTranslation", () => {
	it("returns English and Persian strings", () => {
		expect(getTranslation("openSettings", "en")).toBe("Open settings")
		expect(getTranslation("openSettings", "fa")).toBe(
			"\u0628\u0627\u0632 \u06a9\u0631\u062f\u0646 \u062a\u0646\u0638\u06cc\u0645\u0627\u062a",
		)
	})

	it("exposes the new global-setting label (fix #3/#5)", () => {
		expect(getTranslation("globalSettingLabel", "en")).toBe("Global setting")
		expect(getTranslation("globalSettingLabel", "fa")).toBe(
			"\u062a\u0646\u0638\u06cc\u0645 \u0633\u0631\u0627\u0633\u0631\u06cc",
		)
	})

	it("returns an empty string for unknown keys", () => {
		expect(getTranslation("doesNotExist", "en")).toBe("")
	})
})

describe("translateDocument", () => {
	it("translates [data-i18n] nodes and sets direction", () => {
		const el = document.createElement("span")
		el.dataset.i18n = "openSettings"
		el.textContent = "Open settings"
		document.body.appendChild(el)

		translateDocument("fa")
		expect(el.textContent).toBe(
			"\u0628\u0627\u0632 \u06a9\u0631\u062f\u0646 \u062a\u0646\u0638\u06cc\u0645\u0627\u062a",
		)
		expect(document.documentElement.dir).toBe("rtl")
		expect(document.body.classList.contains("rtl")).toBe(true)
	})

	it("leaves the HTML fallback intact for missing keys", () => {
		const el = document.createElement("span")
		el.dataset.i18n = "doesNotExist"
		el.textContent = "Fallback"
		document.body.appendChild(el)

		translateDocument("en")
		expect(el.textContent).toBe("Fallback")
	})
})

describe("applyLanguageToggle", () => {
	it("marks the matching .interface-lang-card as selected", () => {
		const btn = document.createElement("button")
		btn.className = "interface-lang-card"
		btn.dataset.interfaceLang = "fa"
		document.body.appendChild(btn)

		applyLanguageToggle("fa")
		expect(btn.classList.contains("selected")).toBe(true)
		expect(btn.getAttribute("aria-pressed")).toBe("true")

		applyLanguageToggle("en")
		expect(btn.classList.contains("selected")).toBe(false)
		expect(btn.getAttribute("aria-pressed")).toBe("false")
	})
})
