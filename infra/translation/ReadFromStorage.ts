/**
 * Translation dictionary persistence — "ReadFromStorage".
 *
 * NOTE: This feature is NOT READY YET. The UI translator is currently a preview
 * (see the options page). These functions define the intended contract so the
 * rest of the app can be wired up ahead of the real implementation.
 */
import type { DictionaryId } from "../../core/models"

export interface TranslationDictionary {
	id: DictionaryId
	/** Source-phrase -> translated-phrase map. */
	entries: Record<string, string>
	version?: string
	downloadedAt?: number
}

const DICTIONARY_STORAGE_PREFIX = "fpc365TranslationDictionary:"

/**
 * Read a previously-downloaded dictionary from chrome.storage.local.
 * TODO: implement once the translator feature is finalized.
 */
export async function readDictionaryFromStorage(
	id: DictionaryId,
): Promise<TranslationDictionary | null> {
	// Not ready yet — returns null so callers degrade gracefully.
	return new Promise((resolve) => {
		try {
			const key = DICTIONARY_STORAGE_PREFIX + id
			chrome.storage.local.get(key, (result) => {
				resolve((result[key] as TranslationDictionary) || null)
			})
		} catch {
			resolve(null)
		}
	})
}

/**
 * Persist a downloaded dictionary to chrome.storage.local.
 * TODO: implement once the translator feature is finalized.
 */
export async function writeDictionaryToStorage(
	_dictionary: TranslationDictionary,
): Promise<void> {
	// Not ready yet.
	return Promise.resolve()
}
