/**
 * "Refresh to apply changes" banner shown by the content script when settings
 * change while a supported page is open. Styling lives in ReloadBanner.scss
 * (compiled into content.css); the markup is imported from ReloadBanner.html.
 */
import { RELOAD_BANNER_ID } from "../../../core/constants"
import { getTranslation } from "../../../infra/i18n/i18n"
import type { InterfaceLanguage } from "../../../core/models"
import template from "./ReloadBanner.html?raw"

function localize(root: HTMLElement, lang: InterfaceLanguage): void {
	root.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
		const key = el.dataset.i18n
		if (!key) return
		const value = getTranslation(key, lang)
		if (value) el.textContent = value
	})
}

export function showReloadBanner(lang: InterfaceLanguage = "en"): void {
	try {
		if (document.getElementById(RELOAD_BANNER_ID)) return

		const host = document.createElement("div")
		host.innerHTML = template.trim()
		const banner = host.firstElementChild as HTMLElement | null
		if (!banner) return

		banner.id = RELOAD_BANNER_ID
		if (document.documentElement.dir === "rtl") banner.setAttribute("dir", "rtl")
		localize(banner, lang)

		banner
			.querySelector('[data-action="refresh"]')
			?.addEventListener("click", () => {
				try {
					location.reload()
				} catch {
					/* ignore */
				}
			})
		banner
			.querySelector('[data-action="dismiss"]')
			?.addEventListener("click", () => banner.remove())

		;(document.body || document.documentElement).appendChild(banner)

		// Reveal the banner WITHOUT relying solely on requestAnimationFrame.
		// rAF callbacks are paused in background / inactive tabs, so when settings
		// were changed from the options tab the banner stayed stuck at opacity:0 in
		// the (background) Microsoft tab \u2014 i.e. it "never showed up". We flush layout
		// to commit the hidden start state, then add the visible class immediately
		// (with rAF + timeout as harmless fallbacks).
		const reveal = () => banner.classList.add("fpc365-visible")
		void banner.offsetWidth // force reflow so the opacity:0 start state is applied
		reveal()
		requestAnimationFrame(reveal)
		setTimeout(reveal, 50)
	} catch {
		/* best-effort UI only */
	}
}
