/**
 * Static lookup tables shared by the date parsers and formatters.
 * Extracted from the original monolithic DateConverter.ts (fix #6).
 */

export const MONTH_NAMES: Record<string, number> = {
	jan: 1, january: 1,
	feb: 2, february: 2,
	mar: 3, march: 3,
	apr: 4, april: 4,
	may: 5,
	jun: 6, june: 6,
	jul: 7, july: 7,
	aug: 8, august: 8,
	sep: 9, sept: 9, september: 9,
	oct: 10, october: 10,
	nov: 11, november: 11,
	dec: 12, december: 12,
}

export const WEEKDAY_NAMES: Record<string, number> = {
	mon: 1, monday: 1,
	tue: 2, tuesday: 2,
	wed: 3, wednesday: 3,
	thu: 4, thursday: 4,
	fri: 5, friday: 5,
	sat: 6, saturday: 6,
	sun: 0, sunday: 0,
}

/**
 * Standalone English weekday names (full + common abbreviations) mapped to
 * Persian, used to localize calendar-view day / column headers (شنبه..جمعه).
 */
export const PERSIAN_WEEKDAY_DISPLAY: Record<string, string> = {
	saturday: "شنبه", sat: "شنبه",
	sunday: "یکشنبه", sun: "یکشنبه",
	monday: "دوشنبه", mon: "دوشنبه",
	tuesday: "سه‌شنبه", tue: "سه‌شنبه", tues: "سه‌شنبه",
	wednesday: "چهارشنبه", wed: "چهارشنبه",
	thursday: "پنج‌شنبه", thu: "پنج‌شنبه", thurs: "پنج‌شنبه",
	friday: "جمعه", fri: "جمعه",
}

export const PERSIAN_TIME_UNITS: Record<string, string> = {
	m: "\u062f\u0642\u06cc\u0642\u0647",
	h: "\u0633\u0627\u0639\u062a",
	d: "\u0631\u0648\u0632",
	w: "\u0647\u0641\u062a\u0647",
}

// Relative phrases are intentionally left disabled (passthrough), matching the
// original implementation where every entry was commented out.
export const RELATIVE_PHRASES: Record<string, string> = {}
