/**
 * Translation dictionary download.
 *
 * NOTE: This feature is NOT READY YET. The dictionary manager in the options
 * page is a preview. This module sketches the intended download contract.
 */
import type { DictionaryId } from "../../core/models"
import type { TranslationDictionary } from "./ReadFromStorage"

/**
 * Download a dictionary by id from the remote source.
 * TODO: implement real network fetching + integrity checks.
 */
export async function downloadDictionary(
	_id: DictionaryId,
): Promise<TranslationDictionary | null> {
	// Not ready yet.
	return Promise.resolve(null)
}

/** Whether the translator/download pipeline is available. Always false for now. */
export function isTranslationDownloadReady(): boolean {
	return false
}
