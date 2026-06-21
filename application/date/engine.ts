/**
 * Core conversion engine: turn raw strings into Persian (Jalali) display text.
 * Extracted from the original DateConverter.ts (fix #6).
 */
import type { FormatOptions, ParsedDate } from "../../core/models"
import { formatJalaliDateTime } from "../Jalali"
import { DATE_PATTERNS, DATE_SUBSTRING_REGEX } from "./patterns"

export function parseDateString(
	text: string | null | undefined,
): ParsedDate | null {
	if (!text || typeof text !== "string") return null
	const trimmed = text.trim()
	if (!trimmed || trimmed.length > 40) return null

	// Skip if it already looks Jalali (year 1300-1500 range at start).
	if (/^(?:[\u06F0-\u06F9\d]{4})\//.test(trimmed)) {
		const yearMatch = trimmed.match(/^(\d{4})\//)
		if (yearMatch && +yearMatch[1] >= 1300 && +yearMatch[1] <= 1500) return null
	}

	for (const pattern of DATE_PATTERNS) {
		const match = trimmed.match(pattern.regex)
		if (match) {
			if (pattern.originalFormat) {
				const formatted = pattern.originalFormat(match)
				if (formatted)
					return { formatted, original: trimmed, isSpecialFormat: true }
			}
			const date = pattern.parse(match)
			if (date) return { date, original: trimmed }
		}
	}
	return null
}

export function convertToPersian(
	text: string,
	options?: FormatOptions,
): string | null {
	const parsed = parseDateString(text)
	if (!parsed) return null
	if (parsed.isSpecialFormat) return parsed.formatted
	return formatJalaliDateTime(parsed.date, options)
}

export function replaceDatesInText(
	text: string,
	options?: FormatOptions,
): string | null {
	if (!text) return null
	let changed = false
	const result = text.replace(DATE_SUBSTRING_REGEX, (match) => {
		const converted = convertToPersian(match.trim(), options)
		if (converted) {
			changed = true
			return ` ${converted} `
		}
		return match
	})
	const normalized = result.replace(/  +/g, " ")
	return changed ? normalized : null
}

export function findDateInText(text: string): ParsedDate | null {
	if (!text || typeof text !== "string") return null
	const match = text.match(DATE_SUBSTRING_REGEX)
	if (!match) return null
	return parseDateString(match[0])
}
