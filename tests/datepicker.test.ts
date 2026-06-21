import { describe, expect, it } from "vitest"
import { PersianDatePicker } from "../presentation/components/datepicker/datepicker"

describe("PersianDatePicker", () => {
	it("builds its shell from the imported HTML template (fix #4)", () => {
		const picker = new PersianDatePicker({})
		expect(picker.root).toBeTruthy()
		expect(picker.root.classList.contains("pdp-root")).toBe(true)
		expect(picker.root.querySelector("[data-pdp-header]")).toBeTruthy()
		expect(picker.root.querySelector("[data-pdp-body]")).toBeTruthy()
		expect(picker.root.querySelector("[data-pdp-footer]")).toBeTruthy()
	})

	it("renders a day grid when opened", () => {
		const picker = new PersianDatePicker({})
		const anchor = document.createElement("input")
		document.body.appendChild(anchor)
		picker.open(anchor, { year: 1403, month: 1, day: 1 })
		expect(picker.root.style.display).toBe("block")
		expect(picker.root.querySelectorAll(".pdp-day").length).toBeGreaterThan(0)
	})

	it("emits a Gregorian + Jalali pair on selection and hides", () => {
		const picker = new PersianDatePicker({})
		let result: unknown = null
		picker.onSelect = (r: unknown) => (result = r)
		picker.open(document.body, { year: 1403, month: 1, day: 1 })
		picker._commit({ year: 1403, month: 1, day: 1 })
		expect(result).toEqual({
			jalali: { year: 1403, month: 1, day: 1 },
			gregorian: { year: 2024, month: 3, day: 20 },
		})
		expect(picker.root.style.display).toBe("none")
	})
})
