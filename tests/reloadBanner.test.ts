import { describe, expect, it } from "vitest"
import { showReloadBanner } from "../presentation/components/ReloadBanner/ReloadBanner"
import { RELOAD_BANNER_ID } from "../core/constants"

describe("showReloadBanner (fix #8)", () => {
	it("injects a single banner with localized text", () => {
		showReloadBanner("fa")
		const banner = document.getElementById(RELOAD_BANNER_ID)
		expect(banner).toBeTruthy()
		const text = banner?.querySelector("[data-i18n='reloadBannerText']")
		expect(text?.textContent).toBeTruthy()
	})

	it("does not create a second banner if one already exists", () => {
		showReloadBanner("en")
		showReloadBanner("en")
		expect(document.querySelectorAll(`#${RELOAD_BANNER_ID}`).length).toBe(1)
	})

	it("removes itself when the dismiss button is clicked", () => {
		showReloadBanner("en")
		const banner = document.getElementById(RELOAD_BANNER_ID)
		const dismiss = banner?.querySelector<HTMLButtonElement>(
			'[data-action="dismiss"]',
		)
		dismiss?.click()
		expect(document.getElementById(RELOAD_BANNER_ID)).toBeNull()
	})
})
