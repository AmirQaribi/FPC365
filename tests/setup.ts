/**
 * Global test setup (fix #9).
 *
 * Provides an in-memory mock of the subset of the chrome.* extension API that
 * the code under test touches (chrome.storage.sync/local + chrome.storage.
 * onChanged). The store is reset before every test.
 */
import { beforeEach, vi } from "vitest"

type ChangeRecord = { oldValue?: unknown; newValue?: unknown }
type ChangeListener = (
	changes: Record<string, ChangeRecord>,
	areaName: string,
) => void

const listeners: ChangeListener[] = []

function createArea(areaName: string) {
	const store: Record<string, unknown> = {}
	return {
		__store: store,
		get: vi.fn((keys: unknown, cb: (items: Record<string, unknown>) => void) => {
			const result: Record<string, unknown> = {}
			if (typeof keys === "string") {
				result[keys] = store[keys]
			} else if (Array.isArray(keys)) {
				keys.forEach((k) => (result[k] = store[k as string]))
			} else if (keys && typeof keys === "object") {
				Object.keys(keys as Record<string, unknown>).forEach((k) => {
					result[k] = k in store ? store[k] : (keys as Record<string, unknown>)[k]
				})
			} else {
				Object.assign(result, store)
			}
			cb(result)
		}),
		set: vi.fn(
			(items: Record<string, unknown>, cb?: () => void) => {
				const changes: Record<string, ChangeRecord> = {}
				for (const [k, v] of Object.entries(items)) {
					changes[k] = { oldValue: store[k], newValue: v }
					store[k] = v
				}
				listeners.forEach((l) => l(changes, areaName))
				cb?.()
			},
		),
	}
}

const sync = createArea("sync")
const local = createArea("local")

const chromeMock = {
	storage: {
		sync,
		local,
		onChanged: {
			addListener: (fn: ChangeListener) => listeners.push(fn),
			removeListener: (fn: ChangeListener) => {
				const i = listeners.indexOf(fn)
				if (i >= 0) listeners.splice(i, 1)
			},
		},
	},
	runtime: { lastError: undefined as unknown },
}

;(globalThis as unknown as { chrome: typeof chromeMock }).chrome = chromeMock

export function resetChromeStorage(): void {
	for (const k of Object.keys(sync.__store)) delete sync.__store[k]
	for (const k of Object.keys(local.__store)) delete local.__store[k]
	listeners.length = 0
}

beforeEach(() => {
	resetChromeStorage()
	document.body.innerHTML = ""
	document.documentElement.innerHTML = "<head></head><body></body>"
})
