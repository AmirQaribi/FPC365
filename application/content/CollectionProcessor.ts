/** Converts dates in element attributes, grid cells, and calendar views. */
import { PERSIAN_WEEKDAYS, PROCESSED_ATTR } from "../../core/constants"
import { replaceDatesInText, shouldSkipElement } from "../DateConverter"
import { PERSIAN_WEEKDAY_DISPLAY, WEEKDAY_NAMES } from "../date/dictionaries"
import { formatClockHourPersian } from "../date/formatters"
import { gregorianToJalali, toPersianDigits } from "../Jalali"
import { getFormatOptions, type ProcessingContext } from "./ProcessingContext"
import { walkTextNodes } from "./TextProcessor"

const WEEKDAY_TOKEN_RE = /^[A-Za-z]{3,9}\.?$/

/**
 * Translate standalone English weekday names (e.g. "Saturday", "Sat") into
 * Persian inside calendar views, so day / column headers read شنبه..جمعه. Only
 * text nodes whose ENTIRE trimmed content is a known weekday token are touched,
 * which leaves mixed content (like "Sun 6/15") and unrelated words alone. This
 * localizes the weekday *labels*; it does not physically reorder a host grid's
 * columns into a Saturday-first layout.
 */
function processCalendarWeekdayNames(
	el: Element,
	ctx: ProcessingContext,
): void {
	const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
		acceptNode(node: Node): number {
			const parent = (node as Text).parentElement
			if (!parent || shouldSkipElement(parent)) return NodeFilter.FILTER_REJECT
			if (parent.tagName === "INPUT" || parent.tagName === "TEXTAREA")
				return NodeFilter.FILTER_REJECT
			const trimmed = node.textContent?.trim() ?? ""
			if (!WEEKDAY_TOKEN_RE.test(trimmed)) return NodeFilter.FILTER_REJECT
			const key = trimmed.replace(/\.$/, "").toLowerCase()
			return Object.prototype.hasOwnProperty.call(PERSIAN_WEEKDAY_DISPLAY, key)
				? NodeFilter.FILTER_ACCEPT
				: NodeFilter.FILTER_REJECT
		},
	})
	const nodes: Text[] = []
	while (walker.nextNode()) nodes.push(walker.currentNode as Text)
	nodes.forEach((node) => {
		if (ctx.tracker.isProcessed(node)) return
		const original = node.textContent ?? ""
		const key = original.trim().replace(/\.$/, "").toLowerCase()
		const persian = PERSIAN_WEEKDAY_DISPLAY[key]
		if (!persian) return
		ctx.tracker.track({ type: "textNode", node, original })
		ctx.tracker.markProcessed(node)
		node.textContent = original.replace(original.trim(), persian)
		const parent = node.parentElement
		if (parent) {
			parent.setAttribute(PROCESSED_ATTR, "true")
			parent.classList.add("fpc365-persian-converted", "fpc365-rtl")
		}
	})
}

export function processElementAttributes(
	el: Element,
	ctx: ProcessingContext,
): void {
	if (shouldSkipElement(el)) return
	for (const attr of ["aria-label", "title"]) {
		const value = el.getAttribute(attr)
		if (!value) continue
		const converted = replaceDatesInText(value, getFormatOptions(ctx.settings))
		if (converted && converted !== value) {
			ctx.tracker.track({ type: "attr", el, attr, original: value })
			el.setAttribute(attr, converted)
			el.setAttribute(PROCESSED_ATTR, "true")
		}
	}
}

const GRID_SELECTOR = [
	'[role="gridcell"]',
	'[data-automationid="DetailsRowCell"]',
	'[data-automationid="ReadOnlyGridCell"]',
	".public_fixedDataTableCell_cellContent",
].join(",")

export function processGridCells(root: Element, ctx: ProcessingContext): void {
	root.querySelectorAll(GRID_SELECTOR).forEach((cell) => {
		if (ctx.tracker.isProcessed(cell)) return
		walkTextNodes(cell, ctx)
		processElementAttributes(cell, ctx)
	})
}

const CALENDAR_SELECTOR = [
	'[role="presentation"]',
	'[class*="calendarItem"]',
	'[class*="eventRow"]',
	'[class*="eventContainer"]',
	'[data-automationid*="Event"]',
	'[data-automationid*="Calendar"]',
	'[class*="eventChunk"]',
	'[class*="Calendar"]',
	'[class*="calendarEvent"]',
	'[class*="mail-date"]',
	'[class*="sent-date"]',
	'[class*="received-date"]',
	'[data-automationid*="DateSent"]',
	'[data-automationid*="ReceivedDate"]',
	'[data-automationid*="calendar"]',
	'[data-automationid*="schedule"]',
	".event-container",
	'[class*="schedule"]',
].join(",")

export function processCalendarViews(root: Element, ctx: ProcessingContext): void {
	if (!ctx.settings.enabled) return
	const opts = getFormatOptions(ctx.settings)

	root.querySelectorAll(CALENDAR_SELECTOR).forEach((el) => {
		if (ctx.tracker.isProcessed(el)) return
		walkTextNodes(el, ctx)
		processElementAttributes(el, ctx)
		processCalendarWeekdayNames(el, ctx)
	})

	// Outlook (OWA) week/day calendar columns: <div data-column-date="YYYY-MM-DD">
	// with a day-number <time> and an English weekday label. These are not
	// matched by CALENDAR_SELECTOR, so handle them explicitly.
	processDayColumns(root, ctx)

	root
		.querySelectorAll("[data-date],[data-time],[data-eventdate]")
		.forEach((el) => {
			if (ctx.tracker.isProcessed(el)) return
			const dateAttr =
				el.getAttribute("data-date") ||
				el.getAttribute("data-time") ||
				el.getAttribute("data-eventdate")
			if (!dateAttr) return
			const converted = replaceDatesInText(dateAttr, opts)
			if (converted && converted !== dateAttr) {
				ctx.tracker.track({ type: "attr", el, attr: "data-date", original: dateAttr })
				el.setAttribute("data-date", converted)
				el.setAttribute(PROCESSED_ATTR, "true")
				ctx.tracker.markProcessed(el)
			}
		})

	root.querySelectorAll("time").forEach((el) => {
		if (ctx.tracker.isProcessed(el)) return
		const dateTime = el.getAttribute("datetime") || el.textContent
		if (!dateTime) return
		const converted = replaceDatesInText(dateTime, opts)
		if (converted && converted !== dateTime) {
			ctx.tracker.track({ type: "attr", el, attr: "datetime", original: dateTime })
			el.setAttribute("datetime", converted)
			el.setAttribute(PROCESSED_ATTR, "true")
			ctx.tracker.markProcessed(el)
			walkTextNodes(el, ctx)
			return
		}
		// Hour-rail labels in week/day calendar grids ("12 AM" … "11 PM") carry no
		// datetime attribute and aren't recognized by the date parser.
		const clock = formatClockHourPersian(
			el.textContent ?? "",
			ctx.settings.usePersianDigits,
		)
		if (clock) {
			replaceLeafTextNode(el, clock, ctx)
			el.setAttribute(PROCESSED_ATTR, "true")
			ctx.tracker.markProcessed(el)
		}
	})
}

/**
 * Replace the first non-empty text node inside `el` with `newText`, tracking the
 * change for reversal. Used for leaf labels (day numbers, hour labels) where we
 * keep the structure intact and only swap the visible text.
 */
function replaceLeafTextNode(
	el: Element,
	newText: string,
	ctx: ProcessingContext,
): void {
	const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
		acceptNode(node: Node): number {
			return (node.textContent?.trim() ?? "") !== ""
				? NodeFilter.FILTER_ACCEPT
				: NodeFilter.FILTER_REJECT
		},
	})
	const node = walker.nextNode() as Text | null
	if (!node) return
	if (ctx.tracker.isProcessed(node)) return
	const original = node.textContent ?? ""
	const trimmed = original.trim()
	if (trimmed === newText) return
	ctx.tracker.track({ type: "textNode", node, original })
	ctx.tracker.markProcessed(node)
	node.textContent = original.replace(trimmed, newText)
}

/**
 * Find the element in an Outlook calendar column that holds the English weekday
 * label, identified by a `title` attribute that is a known weekday name.
 */
function findWeekdayLabel(col: Element): Element | null {
	const candidates = col.querySelectorAll<HTMLElement>("[title]")
	for (const el of Array.from(candidates)) {
		const title = el.getAttribute("title")?.trim().toLowerCase() ?? ""
		if (WEEKDAY_NAMES[title] !== undefined) return el
	}
	return null
}

/**
 * Convert Outlook (OWA) calendar week/day column headers to the Persian
 * (Jalali) calendar. Each column is <div data-column-date="YYYY-MM-DD"> holding
 * a day-number <time> and an English weekday label (e.g. "Sun"). We map the ISO
 * date to its Jalali day-of-month and the weekday to its Persian name.
 */
function processDayColumns(root: Element, ctx: ProcessingContext): void {
	root.querySelectorAll<HTMLElement>("[data-column-date]").forEach((col) => {
		const iso = col.getAttribute("data-column-date") || ""
		const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
		if (!m) return
		const gy = +m[1]
		const gm = +m[2]
		const gd = +m[3]
		const { day } = gregorianToJalali(gy, gm, gd)
		const jalaliDay = ctx.settings.usePersianDigits
			? toPersianDigits(day)
			: String(day)

		// Day number lives in the first <time> of the column.
		const timeEl = col.querySelector("time")
		if (timeEl && !ctx.tracker.isProcessed(timeEl)) {
			replaceLeafTextNode(timeEl, jalaliDay, ctx)
			const title = timeEl.getAttribute("title")
			if (title && /^\d{1,2}$/.test(title.trim())) {
				ctx.tracker.track({ type: "attr", el: timeEl, attr: "title", original: title })
				timeEl.setAttribute("title", jalaliDay)
			}
			timeEl.setAttribute(PROCESSED_ATTR, "true")
			ctx.tracker.markProcessed(timeEl)
		}

		// Weekday label: descendant whose text/title is an English weekday.
		const weekdayEl = findWeekdayLabel(col)
		if (weekdayEl && !ctx.tracker.isProcessed(weekdayEl)) {
			const dow = new Date(gy, gm - 1, gd).getDay()
			const persianWeekday = PERSIAN_WEEKDAYS[dow]
			if (persianWeekday) {
				replaceLeafTextNode(weekdayEl, persianWeekday, ctx)
				const title = weekdayEl.getAttribute("title")
				if (title && WEEKDAY_NAMES[title.trim().toLowerCase()] !== undefined) {
					ctx.tracker.track({ type: "attr", el: weekdayEl, attr: "title", original: title })
					weekdayEl.setAttribute("title", persianWeekday)
				}
				weekdayEl.setAttribute(PROCESSED_ATTR, "true")
				ctx.tracker.markProcessed(weekdayEl)
			}
		}
	})
}
