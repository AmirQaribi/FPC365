/**
 * Shared, dependency-free constants for the whole extension.
 */
import type { DictionaryId, Settings } from "./models"

export const APP_NAME = "FPC365 — Fluent Persian Converter 365"
export const APP_VERSION = "1.2.1"

export const GITHUB_URL = "https://github.com/AmirQaribi/DynamicsTranslate"
export const DONATE_URL = "https://ton.app/pBKo"

/** chrome.storage keys. */
export const STORAGE_KEY = "fpc365PersianCalendarSettings"
export const REFRESH_KEY = "fpc365PersianCalendarRefresh"
export const PENDING_RELOAD_KEY = "fpc365PersianCalendarPendingReload"

/** Data-attributes used to mark / track DOM mutations. */
export const PROCESSED_ATTR = "data-fpc365-persian-processed"
export const ORIGINAL_ATTR = "data-fpc365-persian-original"
export const EDITING_ATTR = "data-fpc365-persian-editing"
export const SKIP_ATTR = "data-fpc365-persian-skip"

/** UI ids owned by the extension. */
export const RELOAD_BANNER_ID = "fpc365-refresh-banner"
export const RELOAD_STYLE_ID = "fpc365-refresh-style"

export const PERSIAN_MONTHS = [
	"فروردین",
	"اردیبهشت",
	"خرداد",
	"تیر",
	"مرداد",
	"شهریور",
	"مهر",
	"آبان",
	"آذر",
	"دی",
	"بهمن",
	"اسفند",
] as const

/**
 * Persian weekday names indexed by the JavaScript weekday number
 * (Sunday = 0, Monday = 1, ... Saturday = 6), matching WEEKDAY_NAMES in
 * application/date/dictionaries.ts. Do NOT reorder this array to Saturday-first;
 * its consumer (formatWeekdayTimePersian) indexes it with Date.getDay()-style
 * values.
 */
export const PERSIAN_WEEKDAYS = [
	"یکشنبه",
	"دوشنبه",
	"سه شنبه",
	"چهارشنبه",
	"پنج شنبه",
	"جمعه",
	"شنبه",
] as const

export const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹"

/** All supported translator dictionaries. */
export const DICTIONARY_IDS: DictionaryId[] = [
	"dynamics365",
	"salesHub",
	"fieldService",
	"oneDrive",
	"sharePoint",
	"teams",
]

/** Regex matching the Microsoft hosts where the extension is meaningful. */
export const SUPPORTED_SITE_REGEX =
	/\.dynamics\.com|\.sharepoint\.com|onedrive|office\.com|outlook\.live|teams\.microsoft/

export const DEFAULT_SETTINGS: Settings = {
	enabled: true,
	usePersianDigits: false,
	useMonthNames: true,
	convertCalendarViews: true,
	convertDatePickers: false,
	uiLanguage: "default",
	interfaceLanguage: "en",
	forceRTL: false,
	downloadedDictionaries: [],
	enabledDictionaries: [],
	showTooltip: true,
}
