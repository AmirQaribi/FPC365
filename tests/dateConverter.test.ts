import { describe, expect, it } from "vitest"
import {
	convertToPersian,
	parseDateString,
	replaceDatesInText,
} from "../application/DateConverter"

describe("parseDateString", () => {
	it("parses an ISO date into a real Date", () => {
		const parsed = parseDateString("2024-03-20")
		expect(parsed).not.toBeNull()
		expect(parsed?.date instanceof Date).toBe(true)
	})

	it("returns a special pre-formatted result for relative phrases", () => {
		const parsed = parseDateString("today")
		expect(parsed?.isSpecialFormat).toBe(true)
		expect(parsed?.formatted).toBe("\u0627\u0645\u0631\u0648\u0632")
	})

	it("ignores non-dates", () => {
		expect(parseDateString("hello world")).toBeNull()
		expect(parseDateString("")).toBeNull()
		expect(parseDateString(null)).toBeNull()
	})

	it("skips strings that already look Jalali", () => {
		expect(parseDateString("1403/01/01")).toBeNull()
	})
})

describe("convertToPersian", () => {
	it("converts an ISO date to the numeric Jalali form", () => {
		expect(convertToPersian("2024-03-20")).toBe("1403/01/01")
	})

	it("honours month-name + Persian-digit options", () => {
		expect(
			convertToPersian("2024-03-20", {
				useMonthNames: true,
				usePersianDigits: true,
			}),
		).toBe("\u06f1 \u0641\u0631\u0648\u0631\u062f\u06cc\u0646 \u06f1\u06f4\u06f0\u06f3")
	})

	it("returns null when there is no date", () => {
		expect(convertToPersian("not a date")).toBeNull()
	})
})

describe("replaceDatesInText", () => {
	it("replaces an embedded date inside surrounding text", () => {
		const out = replaceDatesInText("Due 2024-03-20 for review")
		expect(out).toContain("1403/01/01")
	})

	it("returns null when nothing was converted", () => {
		expect(replaceDatesInText("no dates here")).toBeNull()
	})
})
