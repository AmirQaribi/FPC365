/**
 * Low-level Gregorian date construction / validation helpers.
 * Extracted from the original DateConverter.ts (fix #6).
 */

export function isValidGregorian(y: number, mo: number, d: number): boolean {
	if (y < 1900 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > 31) return false
	const test = new Date(y, mo - 1, d)
	return (
		test.getFullYear() === y &&
		test.getMonth() === mo - 1 &&
		test.getDate() === d
	)
}

export function buildDate(
	y: number,
	mo: number,
	d: number,
	h?: string,
	mi?: string,
	s?: string,
): Date | null {
	if (!isValidGregorian(y, mo, d)) return null
	const date = new Date(y, mo - 1, d, h ? +h : 0, mi ? +mi : 0, s ? +s : 0)
	if (isNaN(date.getTime())) return null
	return date
}

export function applyAmPm(hours: number | string, ampm?: string): number {
	if (!ampm) return +hours
	const h = +hours
	const isPm = ampm.toLowerCase() === "pm"
	if (isPm && h < 12) return h + 12
	if (!isPm && h === 12) return 0
	return h
}
