/**
 * Persistence boundary for user settings.
 *
 * Wraps chrome.storage.sync (settings) and chrome.storage.local (the
 * "pending reload" signal). Everything above this layer works with the
 * strongly-typed `Settings` model and never touches chrome.storage directly.
 */
import {
	DEFAULT_SETTINGS,
	PENDING_RELOAD_KEY,
	REFRESH_KEY,
	STORAGE_KEY,
} from "../../core/constants"
import type { Settings } from "../../core/models"

export type SettingsListener = (settings: Settings) => void

export const SettingsRepository = {
	/** Read the persisted settings, merged over defaults. */
	get(): Promise<Settings> {
		return new Promise((resolve) => {
			try {
				chrome.storage.sync.get(STORAGE_KEY, (result) => {
					resolve({ ...DEFAULT_SETTINGS, ...(result[STORAGE_KEY] || {}) })
				})
			} catch {
				resolve({ ...DEFAULT_SETTINGS })
			}
		})
	},

	/** Persist a full settings object. */
	set(settings: Settings): Promise<void> {
		return new Promise((resolve) => {
			try {
				chrome.storage.sync.set({ [STORAGE_KEY]: settings }, () => resolve())
			} catch {
				resolve()
			}
		})
	},

	/** Merge a partial update into the stored settings and persist the result. */
	async update(patch: Partial<Settings>): Promise<Settings> {
		const current = await this.get()
		const next = { ...current, ...patch }
		await this.set(next)
		return next
	},

	/** Raise a "please reload the page" signal that content scripts listen for. */
	signalPendingReload(): void {
		try {
			chrome.storage.local.set({
				[PENDING_RELOAD_KEY]: Date.now(),
				[REFRESH_KEY]: Date.now(),
			})
		} catch {
			/* ignore */
		}
	},

	/** Subscribe to settings changes coming from any extension surface. */
	onChanged(listener: SettingsListener): void {
		try {
			chrome.storage.onChanged.addListener((changes, area) => {
				if (area === "sync" && changes[STORAGE_KEY]) {
					listener({
						...DEFAULT_SETTINGS,
						...(changes[STORAGE_KEY].newValue || {}),
					})
				}
			})
		} catch {
			/* ignore */
		}
	},
}
