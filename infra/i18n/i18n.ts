/**
 * Runtime helpers for translating the extension's own pages (popup & options).
 * Ported from the original lib/i18n.js.
 */
import type { InterfaceLanguage } from "../../core/models"
import { DEFAULT_INTERFACE_LANGUAGE, I18N_STRINGS, type I18nKey } from "./strings"

export function getTranslation(
	key: I18nKey | string,
	lang: InterfaceLanguage,
): string {
	const locale: InterfaceLanguage = lang === "fa" ? "fa" : "en"
	const table = I18N_STRINGS[locale] as Record<string, string>
	return table[key as string] || ""
}

export function translateDocument(
	lang: InterfaceLanguage = DEFAULT_INTERFACE_LANGUAGE,
): void {
	const locale: InterfaceLanguage = lang === "fa" ? "fa" : "en"

	document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
		const key = el.dataset.i18n
		if (!key) return
		const translated = getTranslation(key, locale)
		if (!translated) return
		if (el.dataset.i18nHtml === "true") el.innerHTML = translated
		else el.textContent = translated
	})

	document.querySelectorAll<HTMLElement>("[data-i18n-title]").forEach((el) => {
		const key = el.dataset.i18nTitle
		if (!key) return
		const translated = getTranslation(key, locale)
		if (translated) el.title = translated
	})

	const direction = locale === "fa" ? "rtl" : "ltr"
	document.documentElement.lang = locale
	document.documentElement.dir = direction
	if (document.body) {
		document.body.dir = direction
		document.body.classList.toggle("rtl", locale === "fa")
		document.body.classList.toggle("ltr", locale !== "fa")
	}
}

export function applyLanguageToggle(lang: InterfaceLanguage): void {
	translateDocument(lang)
	document
		.querySelectorAll<HTMLElement>(".interface-lang-card")
		.forEach((button) => {
			const selected = button.dataset.interfaceLang === lang
			button.classList.toggle("selected", selected)
			button.setAttribute("aria-pressed", selected ? "true" : "false")
		})
}
