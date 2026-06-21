/** Shared state passed to every DOM processor in the content script. */
import type { FormatOptions, Settings } from "../../core/models"
import { gregorianToJalali, toPersianDigits } from "../Jalali"
import { PERSIAN_MONTHS } from "../../core/constants"
import type { ModificationTracker } from "./ModificationTracker"

export interface ProcessingContext {
	settings: Settings
	tracker: ModificationTracker
}

export function getFormatOptions(settings: Settings): FormatOptions {
	return {
		usePersianDigits: settings.usePersianDigits,
		useMonthNames: settings.useMonthNames !== false,
	}
}

/** Build a short Persian date string for hover tooltips. */
export function formatPersianTooltip(date: Date): string {
	if (!date || typeof date.getFullYear !== "function") return ""
	const { year, month, day } = gregorianToJalali(
		date.getFullYear(),
		date.getMonth() + 1,
		date.getDate(),
	)
	return `${toPersianDigits(String(day))} ${PERSIAN_MONTHS[month - 1]} ${toPersianDigits(
		String(year),
	)}`
}
