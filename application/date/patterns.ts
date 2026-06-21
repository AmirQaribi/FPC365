/**
 * The ordered list of date patterns recognised by the converter, plus the
 * substring regex used to find dates inside larger text nodes.
 * Extracted from the original DateConverter.ts (fix #6).
 */
import {
	formatRelativePhrasePersian,
	formatRelativeTimePersian,
	formatWeekdayTimePersian,
} from "./formatters"
import {
	parseDotDate,
	parseMonthDay,
	parseNamedMonth,
	parseRelativePhrase,
	parseRelativeTime,
	parseSlashDate,
	parseWeekdayTime,
	type RegexMatch,
} from "./parsers"

export interface DatePattern {
	regex: RegExp
	parse: (m: RegexMatch) => Date | null
	originalFormat?: (m: RegexMatch) => string | null
}

export const DATE_PATTERNS: DatePattern[] = [
	{
		regex: /^(this|last|next)\s+(week|month|year)$/i,
		parse: (m) => parseRelativePhrase(m[1], m[2]),
		originalFormat: (m) => formatRelativePhrasePersian(m),
	},
	{
		regex: /^tomorrow$/i,
		parse: () => {
			const d = new Date()
			d.setDate(d.getDate() + 1)
			return new Date(d.getFullYear(), d.getMonth(), d.getDate())
		},
		originalFormat: () => "\u0641\u0631\u062f\u0627",
	},
	// ISO: 2025-05-27 or 2025-05-27T14:30:00
	{
		regex: /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/,
		parse: (m) => buildIsoDate(m),
	},
	// US/EU slash: 5/27/2025, 27/05/2025, with optional time
	{
		regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM|am|pm))?)?$/,
		parse: (m) => parseSlashDate(m),
	},
	// Dot: 27.05.2025
	{
		regex: /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
		parse: (m) => parseDotDate(m),
	},
	// Dash EU: 27-05-2025
	{
		regex: /^(\d{1,2})-(\d{1,2})-(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
		parse: (m) => parseDotDate(m),
	},
	// Named month: May 27, 2025
	{
		regex: /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM|am|pm))?)?$/,
		parse: (m) => parseNamedMonth(m[1], +m[2], +m[3], m[4], m[5], m[6], m[7]),
	},
	// Named month: 27 May 2025
	{
		regex: /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM|am|pm))?)?$/,
		parse: (m) => parseNamedMonth(m[2], +m[1], +m[3], m[4], m[5], m[6], m[7]),
	},
	// SharePoint: Weekday at HH:MM [AM|PM]
	{
		regex: /^([A-Za-z]{3})\s+at\s+(\d{1,2}):(\d{2})(?:\s+(AM|PM|am|pm))?$/,
		parse: (m) => parseWeekdayTime(m[1], m[2], m[3], m[4]),
		originalFormat: (m) => formatWeekdayTimePersian(m[1], m[2], m[3], m[4]),
	},
	// SharePoint: Month Day (no year). SharePoint omits the year only for dates
	// in the current year, so assume the current year and do a real
	// Gregorian→Jalali conversion via parseMonthDay. Never map the English month
	// to a Persian month by index (January is NOT فروردین).
	{
		regex: /^([A-Za-z]+)\s+(\d{1,2})$/,
		parse: (m) => parseMonthDay(m[1], +m[2]),
	},
	// SharePoint: Relative time - "3m ago", "5h ago", "1d ago", "1w ago"
	{
		regex: /^(\d+)\s*([mhdw])\s+ago$/i,
		parse: (m) => parseRelativeTime(m[1], m[2]),
		originalFormat: (m) => formatRelativeTimePersian(m[1], m[2]),
	},
	{
		regex: /^today$/i,
		parse: () => {
			const d = new Date()
			return new Date(d.getFullYear(), d.getMonth(), d.getDate())
		},
		originalFormat: () => "\u0627\u0645\u0631\u0648\u0632",
	},
	{
		regex: /^yesterday$/i,
		parse: () => {
			const d = new Date()
			d.setDate(d.getDate() - 1)
			return new Date(d.getFullYear(), d.getMonth(), d.getDate())
		},
		originalFormat: () => "\u062f\u06cc\u0631\u0648\u0632",
	},
	{
		regex: /^just\s+now$/i,
		parse: () => new Date(),
		originalFormat: () => "\u0647\u0645 \u0627\u06a9\u0646\u0648\u0646",
	},
]

function buildIsoDate(m: RegexMatch): Date | null {
	const y = +m[1]
	const mo = +m[2]
	const d = +m[3]
	if (y < 1900 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > 31) return null
	const date = new Date(y, mo - 1, d, m[4] ? +m[4] : 0, m[5] ? +m[5] : 0, m[6] ? +m[6] : 0)
	if (isNaN(date.getTime())) return null
	if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null
	return date
}

export const DATE_SUBSTRING_REGEX =
	/\d{4}-\d{1,2}-\d{1,2}(?:[T\s]\d{1,2}:\d{2}(?::\d{2})?)?|\d{1,2}\/\d{1,2}\/\d{4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s*(?:AM|PM|am|pm))?)?|\d{1,2}\.\d{1,2}\.\d{4}|[A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+[A-Za-z]+\s+\d{4}|[A-Za-z]{3}\s+at\s+\d{1,2}:\d{2}(?:\s+(?:AM|PM|am|pm))?|[A-Za-z]+\s+\d{1,2}(?!\d)|\d+\s*[mhdw]\s+ago|just\s+now|today|yesterday|tomorrow|(?:this|last|next)\s+(?:week|month|year)/gi
