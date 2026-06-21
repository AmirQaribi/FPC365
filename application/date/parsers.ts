/**
 * Parsers that turn a matched date string into a Gregorian Date (or null).
 * Extracted from the original DateConverter.ts (fix #6).
 */
import { MONTH_NAMES, WEEKDAY_NAMES } from "./dictionaries"
import { applyAmPm, buildDate } from "./gregorian"

export type RegexMatch = RegExpMatchArray

export function parseSlashDate(m: RegexMatch): Date | null {
	const a = +m[1]
	const b = +m[2]
	const y = +m[3]
	let mo: number
	let d: number
	if (a > 12) {
		d = a
		mo = b
	} else if (b > 12) {
		mo = a
		d = b
	} else {
		// Ambiguous \u2014 prefer US (M/d).
		mo = a
		d = b
	}
	const h = m[4] ? applyAmPm(m[4], m[7]) : 0
	return buildDate(y, mo, d, String(h), m[5], m[6])
}

export function parseDotDate(m: RegexMatch): Date | null {
	const d = +m[1]
	const mo = +m[2]
	const y = +m[3]
	return buildDate(y, mo, d, m[4], m[5], m[6])
}

export function parseNamedMonth(
	monthStr: string,
	day: number,
	year: number,
	h?: string,
	mi?: string,
	s?: string,
	ampm?: string,
): Date | null {
	const mo = MONTH_NAMES[monthStr.toLowerCase()]
	if (!mo) return null
	const hours = h ? applyAmPm(h, ampm) : 0
	return buildDate(year, mo, day, String(hours), mi, s)
}

export function parseWeekdayTime(
	weekdayStr: string,
	hours: string,
	minutes: string,
	ampm?: string,
): Date | null {
	const today = new Date()
	const targetWeekday = WEEKDAY_NAMES[weekdayStr.toLowerCase()]
	if (targetWeekday === undefined) return null
	const currentWeekday = today.getDay()
	let daysOffset = targetWeekday - currentWeekday
	if (daysOffset < 0) daysOffset += 7
	const targetDate = new Date(today)
	targetDate.setDate(targetDate.getDate() + daysOffset)
	const h = applyAmPm(+hours, ampm)
	return buildDate(
		targetDate.getFullYear(),
		targetDate.getMonth() + 1,
		targetDate.getDate(),
		String(h),
		minutes,
		"0",
	)
}

export function parseMonthDay(monthStr: string, day: number): Date | null {
	const mo = MONTH_NAMES[monthStr.toLowerCase()]
	if (!mo) return null
	const today = new Date()
	const year = today.getFullYear()
	return buildDate(year, mo, day, "0", "0", "0")
}

export function parseRelativeTime(amount: string, unit: string): Date {
	const now = new Date()
	const num = +amount
	const u = unit.toLowerCase()
	if (u === "m") now.setMinutes(now.getMinutes() - num)
	else if (u === "h") now.setHours(now.getHours() - num)
	else if (u === "d") now.setDate(now.getDate() - num)
	else if (u === "w") now.setDate(now.getDate() - num * 7)
	return now
}

export function parseRelativePhrase(timeRef: string, unit: string): Date {
	const now = new Date()
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
	const ref = timeRef.toLowerCase()
	const u = unit.toLowerCase()
	if (u === "week") {
		const dayOfWeek = today.getDay()
		const startOfWeek = new Date(today)
		startOfWeek.setDate(today.getDate() - dayOfWeek)
		if (ref === "this") return startOfWeek
		if (ref === "last") {
			startOfWeek.setDate(startOfWeek.getDate() - 7)
			return startOfWeek
		}
		if (ref === "next") {
			startOfWeek.setDate(startOfWeek.getDate() + 7)
			return startOfWeek
		}
	} else if (u === "month") {
		if (ref === "this") return new Date(today.getFullYear(), today.getMonth(), 1)
		if (ref === "last") return new Date(today.getFullYear(), today.getMonth() - 1, 1)
		if (ref === "next") return new Date(today.getFullYear(), today.getMonth() + 1, 1)
	} else if (u === "year") {
		if (ref === "this") return new Date(today.getFullYear(), 0, 1)
		if (ref === "last") return new Date(today.getFullYear() - 1, 0, 1)
		if (ref === "next") return new Date(today.getFullYear() + 1, 0, 1)
	}
	return today
}
