/**
 * Public date-conversion API.
 *
 * The implementation was split into focused modules under `./date/` (fix #6):
 *   - dictionaries.ts  month/weekday lookups
 *   - gregorian.ts     low-level date building/validation
 *   - parsers.ts       string -> Date parsers
 *   - formatters.ts    "special format" Persian formatters
 *   - patterns.ts      ordered pattern list + substring regex
 *   - engine.ts        parse/convert/replace/find
 *   - detect.ts        DOM field detection / skip heuristics
 *
 * This file re-exports the same names the rest of the app already imported, so
 * nothing else had to change.
 */
export {
	parseDateString,
	convertToPersian,
	replaceDatesInText,
	findDateInText,
} from "./date/engine"
export { looksLikeDateField, shouldSkipElement } from "./date/detect"
