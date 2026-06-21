/**
 * Persian display formatters for the "special format" date patterns.
 * Extracted from the original DateConverter.ts (fix #6).
 */
import { PERSIAN_MONTHS, PERSIAN_WEEKDAYS } from "../../core/constants"
import { toPersianDigits } from "../Jalali"
import {
	MONTH_NAMES,
	PERSIAN_TIME_UNITS,
	RELATIVE_PHRASES,
	WEEKDAY_NAMES,
} from "./dictionaries"
import type { RegexMatch } from "./parsers"

export function formatRelativeTimePersian(amount: string, unit: string): string {
	const num = +amount
	const unitName = PERSIAN_TIME_UNITS[unit.toLowerCase()] || unit
	const persianNum = toPersianDigits(num)
	return `${persianNum} ${unitName} \u067e\u06cc\u0634`
}

export function formatWeekdayTimePersian(
	weekdayStr: string,
	hours: string,
	minutes: string,
	ampm?: string,
): string | null {
	const h = ampm
		? hours12To24(+hours, ampm)
		: +hours
	const min = minutes
	const weekdayIndex = WEEKDAY_NAMES[weekdayStr.toLowerCase()]
	if (weekdayIndex === undefined) return null
	const persianWeekday = PERSIAN_WEEKDAYS[weekdayIndex]
	const persianTime = toPersianDigits(`${h}:${min}`)
	const period = h >= 12 ? "\u0628\u0639\u062f \u0627\u0632 \u0638\u0647\u0631" : "\u0642\u0628\u0644 \u0627\u0632 \u0638\u0647\u0631"
	return `${persianWeekday} \u062f\u0631 ${persianTime} ${period}`
}

function hours12To24(hours: number, ampm: string): number {
	const isPm = ampm.toLowerCase() === "pm"
	if (isPm && hours < 12) return hours + 12
	if (!isPm && hours === 12) return 0
	return hours
}

export function formatMonthDayPersian(monthStr: string, day: string): string | null {
	const mo = MONTH_NAMES[monthStr.toLowerCase()]
	if (!mo) return null
	const persianMonth = PERSIAN_MONTHS[mo - 1]
	const persianDay = toPersianDigits(day)
	return `${persianDay} ${persianMonth}`
}

export function formatRelativePhrasePersian(match: RegexMatch): string {
	const phrase = match[0].toLowerCase()
	return RELATIVE_PHRASES[phrase] || phrase
}

/**
 * Convert an English clock-hour rail label ("12 AM", "1 PM", "11 PM") into a
 * Persian equivalent ("۱۲ ق.ظ", "۱ ب.ظ", ...). Returns null when the input
 * is not a bare hour label, so callers can fall through to other handlers.
 */
export function formatClockHourPersian(
	text: string,
	usePersianDigits: boolean,
): string | null {
	const m = /^\s*(\d{1,2})\s*(AM|PM)\s*$/i.exec(text)
	if (!m) return null
	const hour = m[1]
	const period = m[2].toUpperCase() === "AM" ? "ق.ظ" : "ب.ظ"
	const hourOut = usePersianDigits ? toPersianDigits(hour) : hour
	return `${hourOut} ${period}`
}
