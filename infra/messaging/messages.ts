/**
 * Thin wrappers around chrome.runtime / chrome.tabs messaging so the rest of
 * the app never touches the raw extension API directly.
 */
import type { RuntimeMessage, StatusResponse } from "../../core"

export function onRuntimeMessage(
	handler: (
		message: RuntimeMessage,
		sender: chrome.runtime.MessageSender,
		sendResponse: (response?: unknown) => void,
	) => boolean | void,
): void {
	chrome.runtime.onMessage.addListener(handler)
}

export function sendToTab(
	tabId: number,
	message: RuntimeMessage,
): Promise<StatusResponse | undefined> {
	return new Promise((resolve) => {
		try {
			chrome.tabs.sendMessage(tabId, message, (response) => {
				// Swallow "no receiving end" errors — the content script may not be present.
				void chrome.runtime.lastError
				resolve(response as StatusResponse | undefined)
			})
		} catch {
			resolve(undefined)
		}
	})
}

export function openOptionsPage(): void {
	if (chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage()
}

export function reloadTab(tabId: number): void {
	try {
		chrome.tabs.reload(tabId)
	} catch {
		/* ignore */
	}
}
