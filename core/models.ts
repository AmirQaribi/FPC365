/**
 * Domain models & types for FPC365 — Fluent Persian Converter 365.
 * This is the innermost layer of the onion: it depends on nothing else.
 */

/** A Gregorian calendar date (1-based month/day). */
export interface GregorianParts {
	year: number
	month: number
	day: number
}

/** A Jalali (Solar Hijri) calendar date (1-based month/day). */
export interface JalaliParts {
	year: number
	month: number
	day: number
}

/** Options that control how a date is rendered as Persian text. */
export interface FormatOptions {
	usePersianDigits?: boolean
	useMonthNames?: boolean
}

/**
 * Result of parsing an arbitrary string for a date.
 * - A "calendar" result carries a real JS Date that can be reformatted.
 * - A "special" result is already-formatted Persian text (relative phrases,
 *   weekday-at-time, etc.) that cannot be represented as a single Date.
 */
export type ParsedDate =
	| {
			date: Date
			original: string
			isSpecialFormat?: false
			formatted?: undefined
	  }
	| {
			date?: undefined
			original: string
			isSpecialFormat: true
			formatted: string
	  }

export type InterfaceLanguage = "en" | "fa"
export type UiLanguage = "default" | "persian"

export type DictionaryId =
	| "dynamics365"
	| "salesHub"
	| "fieldService"
	| "oneDrive"
	| "sharePoint"
	| "teams"

/** Persisted user settings (chrome.storage.sync). */
export interface Settings {
	enabled: boolean
	usePersianDigits: boolean
	useMonthNames: boolean
	convertCalendarViews: boolean
	convertDatePickers: boolean
	uiLanguage: UiLanguage
	interfaceLanguage: InterfaceLanguage
	forceRTL: boolean
	downloadedDictionaries: DictionaryId[]
	enabledDictionaries: DictionaryId[]
	showTooltip: boolean
}

/** Messages exchanged between popup/background and the content script. */
export type RuntimeMessage = { type: "getStatus" } | { type: "refresh" }

export interface StatusResponse {
	settings: Partial<Settings>
	initialized: boolean
	frame: "top" | "child"
	ok?: boolean
}

/** A single record of a DOM change so it can be reverted later. */
export type Modification =
	| { type: "textNode"; node: Text; original: string }
	| { type: "input"; el: HTMLInputElement | HTMLTextAreaElement; original: string }
	| { type: "attr"; el: Element; attr: string; original: string }
