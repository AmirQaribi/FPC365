import { describe, expect, it } from "vitest"
import {
	formatJalali,
	gregorianToJalali,
	jalaaliMonthLength,
	jalaliToGregorian,
	pad2,
	toPersianDigits,
} from "../application/Jalali"

describe("Jalali calendar math", () => {
	it("converts Nowruz 1403 (2024-03-20) to 1403/01/01", () => {
		expect(gregorianToJalali(2024, 3, 20)).toEqual({
			year: 1403,
			month: 1,
			day: 1,
		})
	})

	it("round-trips Gregorian -> Jalali -> Gregorian", () => {
		const samples: Array<[number, number, number]> = [
			[2024, 3, 20],
			[2000, 1, 1],
			[1995, 12, 31],
			[2026, 6, 21],
		]
		for (const [gy, gm, gd] of samples) {
			const j = gregorianToJalali(gy, gm, gd)
			const g = jalaliToGregorian(j.year, j.month, j.day)
			expect(g).toEqual({ year: gy, month: gm, day: gd })
		}
	})

	it("reports month lengths: 1-6 => 31, 7-11 => 30", () => {
		expect(jalaaliMonthLength(1403, 1)).toBe(31)
		expect(jalaaliMonthLength(1403, 7)).toBe(30)
	})
})

describe("formatting helpers", () => {
	it("pads single digits", () => {
		expect(pad2(5)).toBe("05")
		expect(pad2(12)).toBe("12")
	})

	it("converts ASCII digits to Persian digits", () => {
		expect(toPersianDigits("1403")).toBe("\u06f1\u06f4\u06f0\u06f3")
		expect(toPersianDigits(42)).toBe("\u06f4\u06f2")
	})

	it("formats numeric and month-name styles", () => {
		expect(formatJalali(1403, 1, 1)).toBe("1403/01/01")
		expect(formatJalali(1403, 1, 1, { useMonthNames: true })).toBe(
			"1 \u0641\u0631\u0648\u0631\u062f\u06cc\u0646 1403",
		)
	})

	it("applies Persian digits when requested", () => {
		expect(formatJalali(1403, 1, 1, { usePersianDigits: true })).toBe(
			toPersianDigits("1403/01/01"),
		)
	})
})
