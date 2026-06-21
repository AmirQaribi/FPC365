/** Converts dates shown inside <input>/<textarea> fields, with edit/blur handling. */
import { EDITING_ATTR, ORIGINAL_ATTR, PROCESSED_ATTR } from "../../core/constants"
import {
	convertToPersian,
	looksLikeDateField,
	parseDateString,
	shouldSkipElement,
} from "../DateConverter"
import { formatJalaliDateTime } from "../Jalali"
import {
	formatPersianTooltip,
	getFormatOptions,
	type ProcessingContext,
} from "./ProcessingContext"

type FieldEl = HTMLInputElement | HTMLTextAreaElement

interface BoundDataset {
	fpc365PersianBound?: string
}

export function restoreInputForEditing(input: FieldEl, ctx: ProcessingContext): void {
	const mod = ctx.tracker.get(input)
	const original =
		(mod && mod.type === "input" ? mod.original : undefined) ||
		input.getAttribute(ORIGINAL_ATTR)
	if (original) {
		input.value = original
		input.setAttribute(EDITING_ATTR, "true")
	}
}

export function convertInputDisplay(input: FieldEl, ctx: ProcessingContext): void {
	const { settings, tracker } = ctx
	const currentValue = input.value?.trim()
	if (!currentValue) return

	const mod = tracker.get(input)
	const original =
		(mod && mod.type === "input" ? mod.original : undefined) ||
		input.getAttribute(ORIGINAL_ATTR)
	const source = original || currentValue
	const parsed = parseDateString(source)

	if (!settings.enabled) {
		if (parsed && parsed.date && settings.showTooltip)
			input.title = input.title || `Persian: ${formatPersianTooltip(parsed.date)}`
		input.removeAttribute(EDITING_ATTR)
		return
	}

	if (parsed && parsed.date) {
		const persian = formatJalaliDateTime(parsed.date, getFormatOptions(settings))
		if (persian && input.value !== persian) {
			if (!mod)
				tracker.track({ type: "input", el: input, original: parsed.original })
			input.setAttribute(ORIGINAL_ATTR, parsed.original)
			input.value = persian
			tracker.markProcessed(input)
			input.setAttribute(PROCESSED_ATTR, "true")
			input.classList.add("fpc365-persian-input")
			if (settings.usePersianDigits || settings.useMonthNames)
				input.classList.add("fpc365-rtl")
			else input.classList.remove("fpc365-rtl")
			if (settings.showTooltip)
				input.title = input.title || `Gregorian: ${parsed.original}`
		}
	} else if (original && !input.hasAttribute(EDITING_ATTR)) {
		const persian = convertToPersian(original, getFormatOptions(settings))
		if (persian) input.value = persian
	}

	input.removeAttribute(EDITING_ATTR)
}

export function processInput(input: FieldEl, ctx: ProcessingContext): void {
	if (shouldSkipElement(input)) return
	if (
		input.closest(
			".ms-DatePicker, [class*='DatePicker'], [class*='Calendar'], [class*='Callout'], .fui-PopoverSurface, #fpc365-refresh-banner, .pdp-root, .pdp-display-overlay",
		)
	)
		return
	if (input.type === "hidden") return

	const isDateField =
		looksLikeDateField(input) ||
		parseDateString(input.value) ||
		parseDateString(input.getAttribute(ORIGINAL_ATTR))
	if (!isDateField) return

	const dataset = input.dataset as DOMStringMap & BoundDataset
	if (!dataset.fpc365PersianBound) {
		dataset.fpc365PersianBound = "true"
		input.addEventListener("focus", () => {
			if (ctx.settings.enabled) restoreInputForEditing(input, ctx)
		})
		input.addEventListener("blur", () => {
			if (ctx.settings.enabled)
				setTimeout(() => convertInputDisplay(input, ctx), 50)
		})
		input.addEventListener("change", () => {
			if (ctx.settings.enabled)
				setTimeout(() => convertInputDisplay(input, ctx), 50)
		})
	}

	if (!input.hasAttribute(EDITING_ATTR)) convertInputDisplay(input, ctx)
}
