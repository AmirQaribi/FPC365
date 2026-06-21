/**
 * Jalali (Solar Hijri) calendar math & formatting.
 * Ported from the original lib/jalali.js (jalaali-js algorithm).
 */
import { PERSIAN_DIGITS, PERSIAN_MONTHS } from "../core/constants"
import type { FormatOptions, GregorianParts, JalaliParts } from "../core/models"

const div = (a: number, b: number): number => ~~(a / b)

export function toPersianDigits(input: string | number): string {
	return String(input).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)])
}

export function pad2(n: number): string {
	return n < 10 ? `0${n}` : String(n)
}

export function gregorianToJalali(
	gy: number,
	gm: number,
	gd: number,
): JalaliParts {
	const gDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
	let gy2 = gm > 2 ? gy + 1 : gy
	let days =
		355666 +
		365 * gy +
		div(gy2 + 3, 4) -
		div(gy2 + 99, 100) +
		div(gy2 + 399, 400) +
		gd +
		gDaysInMonth.slice(0, gm - 1).reduce((a, b) => a + b, 0)
	let jy = -1595 + 33 * div(days, 12053)
	days %= 12053
	jy += 4 * div(days, 1461)
	days %= 1461
	if (days > 365) {
		jy += div(days - 1, 365)
		days = (days - 1) % 365
	}
	const jm = days < 186 ? 1 + div(days, 31) : 7 + div(days - 186, 30)
	const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30)
	return { year: jy, month: jm, day: jd }
}

export function jalaliToGregorian(
	jy: number,
	jm: number,
	jd: number,
): GregorianParts {
	let jy2 = jy + 1595
	let days =
		-355668 +
		365 * jy2 +
		div(jy2, 33) * 8 +
		div((jy2 % 33) + 3, 4) +
		jd +
		(jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186)
	let gy = 400 * div(days, 146097)
	days %= 146097
	if (days > 36524) {
		gy += 100 * div(--days, 36524)
		days %= 36524
		if (days >= 365) days++
	}
	gy += 4 * div(days, 1461)
	days %= 1461
	if (days > 365) {
		gy += div(days - 1, 365)
		days = (days - 1) % 365
	}
	let gd = days + 1
	const sal_a = [
		0,
		31,
		(gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
		31,
		30,
		31,
		30,
		31,
		31,
		30,
		31,
		30,
		31,
	]
	let gm = 0
	for (gm = 0; gm < 13; gm++) {
		const v = sal_a[gm]
		if (gd <= v) break
		gd -= v
	}
	return { year: gy, month: gm, day: gd }
}

export function formatJalali(
	jy: number,
	jm: number,
	jd: number,
	options: FormatOptions = {},
): string {
	const { usePersianDigits = false, useMonthNames = false } = options
	const out = useMonthNames
		? `${jd} ${PERSIAN_MONTHS[jm - 1]} ${jy}`
		: `${jy}/${pad2(jm)}/${pad2(jd)}`
	return usePersianDigits ? toPersianDigits(out) : out
}

export function formatJalaliDateTime(
	date: Date,
	options: FormatOptions = {},
): string {
	if (!date || typeof date.getFullYear !== "function") return ""
	const { year, month, day } = gregorianToJalali(
		date.getFullYear(),
		date.getMonth() + 1,
		date.getDate(),
	)
	let out = formatJalali(year, month, day, options)
	const hours = date.getHours()
	const minutes = date.getMinutes()
	const seconds = date.getSeconds()
	if (hours !== 0 || minutes !== 0 || seconds !== 0) {
		const time = `${pad2(hours)}:${pad2(minutes)}`
		out += ` ${options.usePersianDigits ? toPersianDigits(time) : time}`
	}
	return out
}

export function jalaaliMonthLength(jy: number, jm: number): number {
	if (jm <= 6) return 31
	if (jm <= 11) return 30
	// Esfand: length depends on whether the next Farvardin 1 is 365/366 days out.
	const g1 = jalaliToGregorian(jy, 12, 30)
	const d = new Date(g1.year, g1.month - 1, g1.day)
	const back = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate())
	return back.month === 12 && back.day === 30 ? 30 : 29
}

/** Returns the weekday index of the 1st of the given Jalali month, Saturday = 0. */
export function jalaaliFirstWeekday(jy: number, jm: number): number {
	const g = jalaliToGregorian(jy, jm, 1)
	const d = new Date(g.year, g.month - 1, g.day)
	return (d.getDay() + 1) % 7
}

export function todayJalali(): JalaliParts {
	const now = new Date()
	return gregorianToJalali(
		now.getFullYear(),
		now.getMonth() + 1,
		now.getDate(),
	)
}
