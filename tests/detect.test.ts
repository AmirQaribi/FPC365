import { describe, expect, it } from "vitest"
import { looksLikeDateField, shouldSkipElement } from "../application/DateConverter"

describe("looksLikeDateField", () => {
	it("detects native date inputs", () => {
		const input = document.createElement("input")
		input.type = "date"
		expect(looksLikeDateField(input)).toBe(true)
	})

	it("detects inputs labelled as dates", () => {
		const input = document.createElement("input")
		input.setAttribute("aria-label", "Start date")
		expect(looksLikeDateField(input)).toBe(true)
	})

	it("detects inputs whose value parses as a date", () => {
		const input = document.createElement("input")
		input.value = "2024-03-20"
		expect(looksLikeDateField(input)).toBe(true)
	})

	it("ignores plain text inputs", () => {
		const input = document.createElement("input")
		input.value = "hello"
		expect(looksLikeDateField(input)).toBe(false)
		expect(looksLikeDateField(null)).toBe(false)
	})
})

describe("shouldSkipElement", () => {
	it("skips script/style and the extension's own UI", () => {
		expect(shouldSkipElement(document.createElement("script"))).toBe(true)
		const banner = document.createElement("div")
		banner.id = "fpc365-refresh-banner"
		document.body.appendChild(banner)
		expect(shouldSkipElement(banner)).toBe(true)
	})

	it("does not skip ordinary content elements", () => {
		const span = document.createElement("span")
		span.textContent = "2024-03-20"
		document.body.appendChild(span)
		expect(shouldSkipElement(span)).toBe(false)
	})
})
