/** Converts dates inside plain text nodes. */
import {
	PROCESSED_ATTR,
	SKIP_ATTR,
} from "../../core/constants"
import {
	convertToPersian,
	findDateInText,
	replaceDatesInText,
	shouldSkipElement,
} from "../DateConverter"
import { MAX_RECONVERTS } from "./ModificationTracker"
import {
	formatPersianTooltip,
	getFormatOptions,
	type ProcessingContext,
} from "./ProcessingContext"

export function processTextNode(textNode: Text, ctx: ProcessingContext): void {
	const { settings, tracker } = ctx
	if (tracker.isProcessed(textNode)) return
	const parent = textNode.parentElement
	if (!parent || shouldSkipElement(parent)) return

	const count = tracker.getConvertCount(parent)
	if (count >= MAX_RECONVERTS) {
		parent.setAttribute(SKIP_ATTR, "true")
		return
	}

	const text = textNode.textContent
	if (!text || !text.trim()) return

	if (!settings.enabled && settings.showTooltip) {
		const parsed = findDateInText(text)
		if (parsed && parsed.date)
			parent.title = parent.title || `Persian: ${formatPersianTooltip(parsed.date)}`
		return
	}

	const converted =
		convertToPersian(text.trim(), getFormatOptions(settings)) ||
		replaceDatesInText(text, getFormatOptions(settings))

	if (!converted || converted === text) return

	tracker.track({ type: "textNode", node: textNode, original: text })
	tracker.markProcessed(textNode)
	textNode.textContent = converted
	parent.setAttribute(PROCESSED_ATTR, "true")
	parent.title = parent.title || `Gregorian: ${text.trim()}`

	parent.classList.add("fpc365-persian-converted")
	if (settings.usePersianDigits || settings.useMonthNames)
		parent.classList.add("fpc365-rtl")
	else parent.classList.remove("fpc365-rtl")

	tracker.setConvertCount(parent, count + 1)
}

/** Reusable TreeWalker filter — avoids per-walk closure allocation. */
const textNodeFilter: NodeFilter = {
	acceptNode(node: Node): number {
		const parent = (node as Text).parentElement
		if (!parent) return NodeFilter.FILTER_REJECT
		if (shouldSkipElement(parent)) return NodeFilter.FILTER_REJECT
		if (parent.tagName === "INPUT" || parent.tagName === "TEXTAREA")
			return NodeFilter.FILTER_REJECT
		if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT
		return NodeFilter.FILTER_ACCEPT
	},
}

export function walkTextNodes(root: Node, ctx: ProcessingContext): void {
	const walker = document.createTreeWalker(
		root,
		NodeFilter.SHOW_TEXT,
		textNodeFilter,
	)
	const nodes: Text[] = []
	while (walker.nextNode()) nodes.push(walker.currentNode as Text)
	nodes.forEach((n) => processTextNode(n, ctx))
}
