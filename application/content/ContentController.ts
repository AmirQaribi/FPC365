/**
 * Top-level controller for the content script. Owns the live settings, the
 * MutationObserver, debounced processing, and runtime messaging. Ported from
 * the orchestration logic in the original content/content.js.
 */
import {
	DEFAULT_SETTINGS,
	PENDING_RELOAD_KEY,
	PROCESSED_ATTR,
	STORAGE_KEY,
	SUPPORTED_SITE_REGEX,
} from "../../core/constants"
import type { RuntimeMessage, Settings, StatusResponse } from "../../core/models"
import { ModificationTracker } from "./ModificationTracker"
import type { ProcessingContext } from "./ProcessingContext"
import { walkTextNodes } from "./TextProcessor"
import { processInput } from "./InputProcessor"
import {
	processCalendarViews,
	processElementAttributes,
	processGridCells,
} from "./CollectionProcessor"
import { showReloadBanner } from "../../presentation/components/ReloadBanner/ReloadBanner"

const PROCESS_DEBOUNCE_MS = 300

export class ContentController {
	private settings: Settings = { ...DEFAULT_SETTINGS, showTooltip: true }
	private tracker = new ModificationTracker()
	private observer: MutationObserver | null = null
	private initialized = false
	private processScheduled = false
	private writing = false

	private get ctx(): ProcessingContext {
		return { settings: this.settings, tracker: this.tracker }
	}

	private get frame(): "top" | "child" {
		return window.top === window ? "top" : "child"
	}

	// ---- lifecycle -------------------------------------------------------

	async init(): Promise<void> {
		if (this.initialized) return
		await this.loadSettings()
		this.setupStorageListeners()
		this.setupMessageListener()
		this.setupSaveHook()
		this.initialized = true
		this.processPage()
		this.setupObserver()
	}

	private loadSettings(): Promise<void> {
		return new Promise((resolve) => {
			try {
				chrome.storage.sync.get(STORAGE_KEY, (result) => {
					const stored = result?.[STORAGE_KEY] as Partial<Settings> | undefined
					this.settings = { ...DEFAULT_SETTINGS, ...stored, showTooltip: true }
					resolve()
				})
			} catch {
				resolve()
			}
		})
	}

	// ---- processing ------------------------------------------------------

	private processPage(): void {
		if (!this.initialized) return
		// The popup master switch (`enabled`) turns the WHOLE extension off:
		// when it is false we touch nothing — neither date conversion nor
		// translation — matching the popup toggle semantics (see fix #3).
		if (!this.settings.enabled) return
		const root = document.body
		if (!root) return
		this.processRoot(root)
	}

	private processRoot(root: Element): void {
		const ctx = this.ctx
		this.writing = true
		this.observer?.disconnect()
		try {
			root.querySelectorAll("input, textarea").forEach((el) =>
				processInput(el as HTMLInputElement, ctx),
			)
			processGridCells(root, ctx)
			// Calendar conversion always runs in Persian mode; processCalendarViews
			// itself no-ops unless settings.enabled is true. (The dedicated
			// "Convert calendar views" toggle was removed.)
			processCalendarViews(root, ctx)
			walkTextNodes(root, ctx)
			root
				.querySelectorAll("[aria-label],[title]")
				.forEach((el) => processElementAttributes(el, ctx))
		} finally {
			this.writing = false
			if (this.observer) this.connectObserver()
		}
	}

	private scheduleProcess(): void {
		if (this.processScheduled) return
		this.processScheduled = true
		setTimeout(() => {
			this.processScheduled = false
			this.processPage()
		}, PROCESS_DEBOUNCE_MS)
	}

	// ---- observer --------------------------------------------------------

	private setupObserver(): void {
		this.observer = new MutationObserver((mutations) => {
			if (this.writing) return
			let relevant = false
			for (const m of mutations) {
				if (m.type === "childList" && m.addedNodes.length) {
					relevant = true
					break
				}
				if (
					m.type === "characterData" &&
					!m.target.parentElement?.hasAttribute(PROCESSED_ATTR)
				) {
					relevant = true
					break
				}
			}
			if (relevant) this.scheduleProcess()
		})
		this.connectObserver()
	}

	private connectObserver(): void {
		this.observer?.observe(document.documentElement, {
			childList: true,
			subtree: true,
			characterData: true,
		})
	}

	// ---- save hook -------------------------------------------------------

	/** Restore raw Gregorian values into inputs before the host page saves them. */
	private setupSaveHook(): void {
		document.addEventListener(
			"click",
			(e) => {
				const target = e.target as Element | null
				if (!target) return
				const saveBtn = target.closest(
					'button[data-id*="save"], button[name*="save"], button[aria-label*="Save"], [data-id="edit-form-save-button"]',
				)
				if (saveBtn) this.tracker.restoreAllInputs()
			},
			true,
		)
	}

	// ---- settings changes ------------------------------------------------

	private setupStorageListeners(): void {
		try {
			chrome.storage.onChanged.addListener((changes, area) => {
				// Fix #8: never live-apply setting changes. Re-processing the page
				// mid-session would mutate fields the user may be editing. Instead
				// we surface the reload banner and let the new settings take effect
				// only when the page is actually reloaded (banner button or a manual
				// tab refresh), at which point the content script reboots fresh.
				const settingsChanged = area === "sync" && !!changes[STORAGE_KEY]
				const reloadPinged = !!changes[PENDING_RELOAD_KEY]
				if (settingsChanged || reloadPinged) {
					// Localize the banner to the user's chosen interface language.
					const next = changes[STORAGE_KEY]?.newValue as
						| Partial<Settings>
						| undefined
					const lang =
						next?.interfaceLanguage ?? this.settings.interfaceLanguage ?? "en"
					showReloadBanner(lang)
				}
			})
		} catch {
			/* ignore */
		}
	}

	private fullRefresh(): void {
		this.observer?.disconnect()
		this.tracker.revertAll()
		this.clearProcessedMarks()
		this.tracker = new ModificationTracker()
		this.processPage()
		if (this.observer) this.connectObserver()
	}

	private clearProcessedMarks(): void {
		document
			.querySelectorAll(`[${PROCESSED_ATTR}]`)
			.forEach((el) => el.removeAttribute(PROCESSED_ATTR))
		document
			.querySelectorAll(".fpc365-persian-converted, .fpc365-rtl")
			.forEach((el) =>
				el.classList.remove("fpc365-persian-converted", "fpc365-rtl"),
			)
	}

	// ---- messaging -------------------------------------------------------

	private setupMessageListener(): void {
		try {
			chrome.runtime.onMessage.addListener(
				(message: RuntimeMessage, _sender, sendResponse) => {
					if (message?.type === "getStatus") {
						const response: StatusResponse & { supported: boolean } = {
							settings: this.settings,
							initialized: this.initialized,
							frame: this.frame,
							supported: SUPPORTED_SITE_REGEX.test(location.hostname),
						}
						sendResponse(response)
						return true
					}
					if (message?.type === "refresh") {
						this.fullRefresh()
						sendResponse({ ok: true, initialized: this.initialized, frame: this.frame })
						return true
					}
					return false
				},
			)
		} catch {
			/* ignore */
		}
	}
}
