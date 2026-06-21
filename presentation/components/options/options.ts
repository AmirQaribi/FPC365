/**
 * Options page controller. Drives the settings form, live preview, and the
 * (mock) dictionary manager. Reads/writes through the shared SettingsRepository
 * so the popup and content script stay in sync. Ported from options/options.js.
 */
import {
	DEFAULT_SETTINGS,
	DONATE_URL,
	PERSIAN_MONTHS,
} from "../../../core/constants"
import type {
	DictionaryId,
	InterfaceLanguage,
	Settings,
	UiLanguage,
} from "../../../core/models"
import { SettingsRepository } from "../../../infra/storage/SettingsRepository"
import {
	applyLanguageToggle,
	getTranslation,
} from "../../../infra/i18n/i18n"
import { gregorianToJalali, pad2, toPersianDigits } from "../../../application/Jalali"

function $(id: string): HTMLElement | null {
	return document.getElementById(id)
}
function checkbox(id: string): HTMLInputElement | null {
	return document.getElementById(id) as HTMLInputElement | null
}
function currentLang(): InterfaceLanguage {
	const toggle = $("interfaceLangToggle")
	return (toggle?.dataset.interfaceLang as InterfaceLanguage) || "en"
}

// ---- live preview ------------------------------------------------------

function updatePreview(settings: Settings): void {
	const now = new Date()
	const label = $("previewModeLabel")
	const lang = settings.interfaceLanguage || "en"
	let text: string

	if (settings.enabled) {
		const { year, month, day } = gregorianToJalali(
			now.getFullYear(),
			now.getMonth() + 1,
			now.getDate(),
		)
		text = settings.useMonthNames
			? `${day} ${PERSIAN_MONTHS[month - 1]} ${year}`
			: `${year}/${pad2(month)}/${pad2(day)}`
		if (label) label.textContent = getTranslation("previewModePersian", lang)
	} else {
		text = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
		if (label) label.textContent = getTranslation("previewModeGregorian", lang)
	}

	if (settings.usePersianDigits) text = toPersianDigits(text)
	const pv = $("preview")
	if (pv) pv.textContent = text
}

// ---- read form --------------------------------------------------------

function getSettingsFromForm(): Settings {
	const dateMode =
		(document.querySelector(".mode-card[data-mode].selected") as HTMLElement | null)
			?.dataset.mode || "persian"
	const uiLanguage =
		((document.querySelector(
			".mode-card[data-language].selected",
		) as HTMLElement | null)?.dataset.language as UiLanguage) || "default"
	const enabled = dateMode === "persian"

	const usePersianDigitsEl = checkbox("usePersianDigits")
	const useMonthNamesEl = checkbox("useMonthNames")
	const convertDatePickersEl = checkbox("convertDatePickers")
	const forceRTLEl = checkbox("forceRTL")

	if (!enabled) {
		if (usePersianDigitsEl) usePersianDigitsEl.checked = false
		if (useMonthNamesEl) useMonthNamesEl.checked = false
		if (convertDatePickersEl) convertDatePickersEl.checked = false
	}

	const items = Array.from(
		document.querySelectorAll<HTMLElement>(".dictionary-item"),
	)
	const downloadedDictionaries = items
		.filter((i) => i.dataset.downloaded === "true")
		.map((i) => i.dataset.dict as DictionaryId)
	const enabledDictionaries = items
		.filter((i) => i.dataset.enabled === "true")
		.map((i) => i.dataset.dict as DictionaryId)

	return {
		enabled,
		usePersianDigits: !!usePersianDigitsEl?.checked,
		useMonthNames: !!useMonthNamesEl?.checked,
		// Calendar-view conversion now follows the master Persian switch.
		convertCalendarViews: enabled,
		convertDatePickers: !!convertDatePickersEl?.checked,
		uiLanguage,
		interfaceLanguage: currentLang(),
		forceRTL: !!forceRTLEl?.checked,
		downloadedDictionaries,
		enabledDictionaries,
		showTooltip: true,
	}
}

// ---- UI feedback ------------------------------------------------------

let toastTimer: ReturnType<typeof setTimeout> | null = null
function showSavedToast(): void {
	let toast = $("savedToast")
	if (!toast) {
		toast = document.createElement("div")
		toast.id = "savedToast"
		toast.className = "toast-banner"
		document.body.appendChild(toast)
	}
	toast.textContent = getTranslation("saveToast", currentLang()) || "Saved changes"
	toast.classList.add("visible")
	if (toastTimer) clearTimeout(toastTimer)
	toastTimer = setTimeout(() => toast?.classList.remove("visible"), 1600)
}

function setInterfaceLanguageButton(lang: InterfaceLanguage): void {
	const toggle = $("interfaceLangToggle")
	if (!toggle) return
	toggle.dataset.interfaceLang = lang
	toggle.textContent = lang === "fa" ? "EN" : "\u0641\u0627"
	toggle.title =
		lang === "fa" ? "Switch to English" : "\u062a\u063a\u06cc\u06cc\u0631 \u0628\u0647 \u0641\u0627\u0631\u0633\u06cc"
}

function setServiceStatusBox(enabled: boolean): void {
	const box = $("serviceStatusBox")
	if (!box) return
	const lang = currentLang()
	const statusText = enabled
		? getTranslation("statusOn", lang)
		: getTranslation("statusOff", lang)
	box.textContent = `${getTranslation("statusLabel", lang)}: ${statusText}`
	box.classList.toggle("enabled", enabled)
	box.classList.toggle("disabled", !enabled)
}

function updateConditionalVisibility(settings: Settings): void {
	$("dateFeatureOptions")?.classList.toggle("hidden", !settings.enabled)
	$("translatorFeatureOptions")?.classList.toggle(
		"hidden",
		settings.uiLanguage !== "persian",
	)
}

const CHECK_SVG =
	'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12l4 4 8-8"/></svg>'
const DOT_SVG =
	'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M2 12h4"/><path d="M18 12h4"/></svg>'

function updateDictionaryButtons(settings: Settings): void {
	document.querySelectorAll<HTMLElement>(".dictionary-item").forEach((item) => {
		const id = item.dataset.dict as DictionaryId
		const downloaded = settings.downloadedDictionaries?.includes(id)
		const enabled = settings.enabledDictionaries?.includes(id)
		const downloadButton = item.querySelector(".download-button")
		const toggleButton = item.querySelector(".toggle-button")
		const clearButton = item.querySelector(".clear-button")

		item.dataset.downloaded = downloaded ? "true" : "false"
		item.dataset.enabled = enabled ? "true" : "false"
		item.classList.toggle("dictionary-item--active", !!(downloaded && enabled))

		downloadButton?.classList.toggle("hidden", !!downloaded)
		if (toggleButton) {
			toggleButton.classList.toggle("hidden", !downloaded)
			;(toggleButton as HTMLElement).title = enabled ? "Disable" : "Enable"
			toggleButton.innerHTML = enabled ? CHECK_SVG : DOT_SVG
		}
		clearButton?.classList.toggle("hidden", !downloaded)
	})
}

// ---- persistence ------------------------------------------------------

async function saveSettings(settings: Settings): Promise<void> {
	settings.showTooltip = true
	await SettingsRepository.set(settings)
	SettingsRepository.signalPendingReload()
	showSavedToast()

	updatePreview(settings)
	updateConditionalVisibility(settings)
	applyLanguageToggle(settings.interfaceLanguage || "en")
	setInterfaceLanguageButton(settings.interfaceLanguage || "en")
	setServiceStatusBox(settings.enabled)
	updateDictionaryButtons(settings)
}

function save(): void {
	void saveSettings(getSettingsFromForm())
}

// ---- form binding -----------------------------------------------------

function bindForm(settings: Settings): void {
	const dateCards = document.querySelectorAll<HTMLElement>(".mode-card[data-mode]")
	const languageCards = document.querySelectorAll<HTMLElement>(
		".mode-card[data-language]",
	)
	const interfaceLangToggle = $("interfaceLangToggle")
	const donateButton = $("donateButton")

	dateCards.forEach((c) => c.classList.remove("selected"))
	document
		.querySelector(`.mode-card[data-mode="${settings.enabled ? "persian" : "gregorian"}"]`)
		?.classList.add("selected")

	languageCards.forEach((c) => c.classList.remove("selected"))
	document
		.querySelector(`.mode-card[data-language="${settings.uiLanguage || "default"}"]`)
		?.classList.add("selected")

	setInterfaceLanguageButton(settings.interfaceLanguage || "en")
	applyLanguageToggle(settings.interfaceLanguage || "en")
	setServiceStatusBox(settings.enabled)

	const map: Array<[string, boolean]> = [
		["usePersianDigits", settings.usePersianDigits],
		["useMonthNames", settings.useMonthNames],
		["convertDatePickers", settings.convertDatePickers],
		["forceRTL", settings.forceRTL],
	]
	map.forEach(([id, value]) => {
		const el = checkbox(id)
		if (el) el.checked = value
	})

	updatePreview(settings)
	updateConditionalVisibility(settings)
	updateDictionaryButtons(settings)

	const wireCards = (cards: NodeListOf<HTMLElement>) =>
		cards.forEach((card) => {
			card.addEventListener("click", () => {
				cards.forEach((c) => c.classList.remove("selected"))
				card.classList.add("selected")
				save()
			})
			card.addEventListener("keydown", (ev) => {
				if (ev.key === "Enter" || ev.key === " ") {
					ev.preventDefault()
					card.click()
				}
			})
		})
	wireCards(dateCards)
	wireCards(languageCards)

	if (interfaceLangToggle) {
		interfaceLangToggle.addEventListener("click", () => {
			const next: InterfaceLanguage = currentLang() === "fa" ? "en" : "fa"
			setInterfaceLanguageButton(next)
			applyLanguageToggle(next)
			save()
		})
		interfaceLangToggle.addEventListener("keydown", (ev) => {
			if (ev.key === "Enter" || ev.key === " ") {
				ev.preventDefault()
				interfaceLangToggle.click()
			}
		})
	}

	document
		.querySelectorAll<HTMLInputElement>('.setting-panel input[type="checkbox"]')
		.forEach((input) => input.addEventListener("change", () => save()))

	document.querySelectorAll<HTMLElement>(".download-button").forEach((button) => {
		button.addEventListener("click", () => {
			const s = getSettingsFromForm()
			const id = button.dataset.dict as DictionaryId
			if (!s.downloadedDictionaries.includes(id)) s.downloadedDictionaries.push(id)
			if (!s.enabledDictionaries.includes(id)) s.enabledDictionaries.push(id)
			void saveSettings(s)
		})
	})

	document.querySelectorAll<HTMLElement>(".toggle-button").forEach((button) => {
		button.addEventListener("click", () => {
			const s = getSettingsFromForm()
			const id = button.dataset.dict as DictionaryId
			const idx = s.enabledDictionaries.indexOf(id)
			if (idx >= 0) s.enabledDictionaries.splice(idx, 1)
			else s.enabledDictionaries.push(id)
			void saveSettings(s)
		})
	})

	document.querySelectorAll<HTMLElement>(".clear-button").forEach((button) => {
		button.addEventListener("click", () => {
			const s = getSettingsFromForm()
			const id = button.dataset.dict as DictionaryId
			s.downloadedDictionaries = s.downloadedDictionaries.filter((e) => e !== id)
			s.enabledDictionaries = s.enabledDictionaries.filter((e) => e !== id)
			void saveSettings(s)
		})
	})

	donateButton?.addEventListener("click", () => {
		window.open(DONATE_URL, "_blank")
	})
}

async function init(): Promise<void> {
	const stored = await SettingsRepository.get()
	const settings: Settings = { ...DEFAULT_SETTINGS, ...stored, showTooltip: true }
	bindForm(settings)
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", () => void init())
} else {
	void init()
}
