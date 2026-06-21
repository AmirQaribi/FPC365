/**
 * Popup UI controller. Talks to the shared SettingsRepository (so the popup,
 * options page and content script all read/write the SAME storage location and
 * key) and the i18n layer. Ported from the original popup/popup.js.
 */
import { APP_VERSION, SUPPORTED_SITE_REGEX } from "../../../core/constants"
import type { InterfaceLanguage, Settings } from "../../../core/models"
import { SettingsRepository } from "../../../infra/storage/SettingsRepository"
import {
	applyLanguageToggle,
	getTranslation,
} from "../../../infra/i18n/i18n"

function $(id: string): HTMLElement | null {
	return document.getElementById(id)
}

function setInterfaceLanguageButton(lang: InterfaceLanguage): void {
	const btn = $("interfaceLangToggle")
	if (!btn) return
	btn.dataset.interfaceLang = lang
	btn.textContent = lang === "fa" ? "EN" : "\u0641\u0627"
	btn.title = lang === "fa" ? "Switch to English" : "\u062a\u063a\u06cc\u06cc\u0631 \u0628\u0647 \u0641\u0627\u0631\u0633\u06cc"
}

function applyInterface(lang: InterfaceLanguage): void {
	applyLanguageToggle(lang)
	setInterfaceLanguageButton(lang)
}

interface GetStatusResponse {
	settings?: Partial<Settings>
	enabled?: boolean
	initialized?: boolean
	frame?: "top" | "child"
	supported?: boolean
}

function reloadActiveTab(): void {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		const id = tabs[0]?.id
		if (typeof id === "number") chrome.tabs.reload(id)
	})
}

function updateSiteStatus(lang: InterfaceLanguage): void {
	const statusEl = $("siteStatus")
	if (!statusEl) return

	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		const tab = tabs[0]
		const label = getTranslation("statusLabel", lang)

		if (!tab?.id) {
			statusEl.textContent = getTranslation("siteStatusNotSupported", lang)
			return
		}

		const urlSupported = !!tab.url && SUPPORTED_SITE_REGEX.test(tab.url)

		chrome.tabs.sendMessage(tab.id, { type: "getStatus" }, (resp?: GetStatusResponse) => {
			if (chrome.runtime.lastError || !resp) {
				// Content script not injected on this page.
				statusEl.textContent = urlSupported
					? getTranslation("siteStatusInjected", lang)
					: getTranslation("siteStatusNotSupported", lang)
				return
			}

			const enabled = resp.settings?.enabled ?? resp.enabled ?? false
			const on = enabled
				? getTranslation("statusOn", lang)
				: getTranslation("statusOff", lang)
			const ready = resp.initialized
				? getTranslation("statusReady", lang)
				: getTranslation("statusLoading", lang)
			// const frame = resp.frame ? `, ${resp.frame}` : ""
			statusEl.textContent = `${label}: ${on} (${ready})`
		})
	})
}

async function init(): Promise<void> {
	const versionEl = $("appVersion")
	if (versionEl) versionEl.textContent = APP_VERSION

	const toggle = $("enabledToggle") as HTMLInputElement | null
	const openOptions = $("openOptions")
	const interfaceLangToggle = $("interfaceLangToggle")

	const settings = await SettingsRepository.get()
	let lang: InterfaceLanguage = settings.interfaceLanguage || "en"

	if (toggle) toggle.checked = settings.enabled
	applyInterface(lang)
	updateSiteStatus(lang)

	toggle?.addEventListener("change", async () => {
		await SettingsRepository.update({ enabled: toggle.checked })
		SettingsRepository.signalPendingReload()
		reloadActiveTab()
	})

	interfaceLangToggle?.addEventListener("click", async () => {
		lang = lang === "fa" ? "en" : "fa"
		applyInterface(lang)
		await SettingsRepository.update({ interfaceLanguage: lang })
		updateSiteStatus(lang)
	})
	interfaceLangToggle?.addEventListener("keydown", (ev) => {
		if (ev.key === "Enter" || ev.key === " ") {
			ev.preventDefault()
			;(interfaceLangToggle as HTMLElement).click()
		}
	})

	openOptions?.addEventListener("click", (ev) => {
		ev.preventDefault()
		if (chrome.runtime.openOptionsPage) {
			chrome.runtime.openOptionsPage()
		} else {
			window.open(chrome.runtime.getURL("options.html"))
		}
	})

	// Keep the popup in sync if settings change elsewhere while it is open.
	SettingsRepository.onChanged((next) => {
		if (toggle) toggle.checked = next.enabled
		lang = next.interfaceLanguage || lang
		applyInterface(lang)
		updateSiteStatus(lang)
	})
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", () => void init())
} else {
	void init()
}
