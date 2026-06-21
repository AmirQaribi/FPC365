import { describe, expect, it, vi } from "vitest"
import { SettingsRepository } from "../infra/storage/SettingsRepository"
import {
	DEFAULT_SETTINGS,
	PENDING_RELOAD_KEY,
	REFRESH_KEY,
} from "../core/constants"

describe("SettingsRepository", () => {
	it("returns defaults when nothing is stored", async () => {
		const settings = await SettingsRepository.get()
		expect(settings).toEqual(DEFAULT_SETTINGS)
	})

	it("persists and reads back a full settings object", async () => {
		const next = { ...DEFAULT_SETTINGS, enabled: false, interfaceLanguage: "fa" as const }
		await SettingsRepository.set(next)
		const read = await SettingsRepository.get()
		expect(read.enabled).toBe(false)
		expect(read.interfaceLanguage).toBe("fa")
	})

	it("merges a partial update over stored settings", async () => {
		await SettingsRepository.set({ ...DEFAULT_SETTINGS, enabled: true })
		const merged = await SettingsRepository.update({ usePersianDigits: true })
		expect(merged.enabled).toBe(true)
		expect(merged.usePersianDigits).toBe(true)
	})

	it("writes a pending-reload signal to local storage (fix #8)", async () => {
		SettingsRepository.signalPendingReload()
		const local = await new Promise<Record<string, unknown>>((resolve) =>
			chrome.storage.local.get([PENDING_RELOAD_KEY, REFRESH_KEY], resolve),
		)
		expect(local[PENDING_RELOAD_KEY]).toBeTypeOf("number")
		expect(local[REFRESH_KEY]).toBeTypeOf("number")
	})

	it("notifies onChanged listeners when sync settings change", async () => {
		const listener = vi.fn()
		SettingsRepository.onChanged(listener)
		await SettingsRepository.set({ ...DEFAULT_SETTINGS, enabled: false })
		expect(listener).toHaveBeenCalledTimes(1)
		expect(listener.mock.calls[0][0].enabled).toBe(false)
	})
})
