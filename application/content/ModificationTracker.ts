/**
 * Tracks every DOM change the content script makes so it can be reverted
 * cleanly when the user toggles the extension off or settings change.
 *
 * Uses WeakSet / WeakMap so entries are garbage-collected with their nodes.
 */
import type { Modification } from "../../core/models"

export const MAX_RECONVERTS = 4 // after this, assume a React revert-war and stop

export class ModificationTracker {
	private processedElements = new WeakSet<Node>()
	private modifications = new WeakMap<Node, Modification>()
	private modifiedNodes: Node[] = []
	private parentConvertCounts = new WeakMap<Element, number>()

	isProcessed(node: Node): boolean {
		return this.processedElements.has(node)
	}

	markProcessed(node: Node): void {
		this.processedElements.add(node)
	}

	getConvertCount(el: Element): number {
		return this.parentConvertCounts.get(el) || 0
	}

	setConvertCount(el: Element, count: number): void {
		this.parentConvertCounts.set(el, count)
	}

	/** Record the first-seen original value for a node (never overwritten). */
	track(entry: Modification): void {
		const key: Node =
			entry.type === "textNode" ? entry.node : entry.el
		if (!key || this.modifications.has(key)) return
		this.modifications.set(key, entry)
		this.modifiedNodes.push(key)
	}

	get(key: Node): Modification | undefined {
		return this.modifications.get(key)
	}

	/** Restore only inputs to their original values (used on Save). */
	restoreAllInputs(): void {
		for (const key of this.modifiedNodes) {
			const m = this.modifications.get(key)
			if (m?.type === "input" && m.el.isConnected) m.el.value = m.original
		}
	}

	/** Revert every tracked modification and forget it. */
	revertAll(): void {
		for (let i = this.modifiedNodes.length - 1; i >= 0; i--) {
			const key = this.modifiedNodes[i]
			const m = this.modifications.get(key)
			if (!m) {
				this.modifiedNodes.splice(i, 1)
				continue
			}
			if (m.type === "textNode") {
				if (m.node.isConnected) m.node.textContent = m.original
			} else if (m.type === "input") {
				if (m.el.isConnected) {
					m.el.value = m.original
					m.el.removeAttribute("data-fpc365-persian-original")
					m.el.classList.remove("fpc365-persian-input")
				}
			} else if (m.type === "attr") {
				if (m.el.isConnected) m.el.setAttribute(m.attr, m.original)
			}
			this.modifications.delete(key)
			this.modifiedNodes.splice(i, 1)
		}
	}
}
