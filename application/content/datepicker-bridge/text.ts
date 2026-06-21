// @ts-nocheck -- DOM/text helpers ported verbatim; bundled by the build.
/**
 * Farsi text normalization + date-string parsing helpers for the date-picker
 * bridge. These are pure (closure-free) and were split out of the original
 * DatePickerBridge.ts (fix #6).
 */
import { parseDateString } from "../../DateConverter"

// \u2500\u2500 Farsi text normalization (Arabic vs Persian yeh/kaf, bidi marks) \u2500\u2500
export function normFa(s) {
    return (s || "")
        .replace(/\u064A/g, "\u06CC").replace(/\u0643/g, "\u06A9")
        .replace(/[\u200c\u200e\u200f]/g, "").trim();
}

// Normalize Persian/Arabic-Indic digits to ASCII so numeric parsing works
// regardless of the calendar's display locale.
export function toAsciiDigits(s) {
    return (s || "")
        .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
        .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

const FALLBACK_MONTHS = [
    "\u0698\u0627\u0646\u0648\u06cc\u0647", "\u0641\u0648\u0631\u06cc\u0647", "\u0645\u0627\u0631\u0633", "\u0622\u0648\u0631\u06cc\u0644", "\u0645\u0647", "\u0698\u0648\u0626\u0646",
    "\u0698\u0648\u0626\u06cc\u0647", "\u0627\u0648\u062a", "\u0633\u067e\u062a\u0627\u0645\u0628\u0631", "\u0627\u06a9\u062a\u0628\u0631", "\u0646\u0648\u0627\u0645\u0628\u0631", "\u062f\u0633\u0627\u0645\u0628\u0631"
].map(normFa);

let monthMap = null;
function buildMonthMap() {
    const locales = [(document.documentElement.lang || "fa") + "-u-ca-gregory", "fa-u-ca-gregory"];
    for (const loc of locales) {
        try {
            const f = new Intl.DateTimeFormat(loc, { month: "long" });
            const map = {};
            for (let m = 0; m < 12; m++) map[normFa(f.format(new Date(2021, m, 15)))] = m + 1;
            return map;
        } catch (e) { }
    }
    const map = {};
    FALLBACK_MONTHS.forEach((n, i) => (map[n] = i + 1));
    return map;
}

export function monthNameToNumber(name) {
    if (!monthMap) monthMap = buildMonthMap();
    return monthMap[name] || (FALLBACK_MONTHS.indexOf(name) + 1) || null;
}

// Parse a Fluent day-cell aria-label into a Gregorian {day, month, year}.
// Fluent's exact aria-label format varies by version and locale, so accept
// several shapes instead of one rigid pattern.
export function parseDayLabel(label) {
    if (!label) return null;
    const s = toAsciiDigits(normFa(label)).trim();

    // 1) explicit comma-separated "day, monthName, year"
    let m = s.match(/^(\d{1,2})\s*,\s*(.+?)\s*,\s*(\d{3,4})$/);
    if (m) {
        const month = monthNameToNumber(normFa(m[2]));
        if (month) return { day: +m[1], month, year: +m[3] };
    }

    // 2) a month NAME appears somewhere, plus a day and a 3-4 digit year
    const yearM = s.match(/(\d{3,4})/);
    const dayM = s.match(/(?:^|[^\d])(\d{1,2})(?:[^\d]|$)/);
    if (yearM && dayM) {
        const nameTok = s.replace(/[\d.,\/\-]+/g, " ").trim();
        const month = monthNameToNumber(normFa(nameTok));
        if (month) return { day: +dayM[1], month, year: +yearM[1] };
    }

    // 3) purely numeric day/month/year separated by / - or .
    m = s.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{3,4})/);
    if (m) return { day: +m[1], month: +m[2], year: +m[3] };

    return null;
}

// Parse a Fluent date input's displayed value -> {year, month, day} (Gregorian)
export function parseInputDate(value) {
    if (!value) return null;
    // toAsciiDigits + normFa: handle Persian/Arabic digits and yeh/kaf variants
    // so a field showing "\u06f2\u06f2 \u0645\u0627\u0631\u0633 \u06f2\u06f0\u06f2\u06f6" parses the same as "22 March 2026".
    const v = toAsciiDigits(normFa(value)).trim();

    // "22 \u0645\u0627\u0631\u0633 2026" / "6 May 2026"  (day monthName year)
    let m = v.match(/(\d{1,2})\s+([^\d\/\-.,]+?)\s+(\d{3,4})/);
    if (m) {
        const month = monthNameToNumber(normFa(m[2]));
        if (month) return { year: +m[3], month, day: +m[1] };
    }
    // "March 22, 2026" / "May 6 2026"  (monthName day year)
    m = v.match(/([^\d\/\-.,]+?)\s+(\d{1,2}),?\s+(\d{3,4})/);
    if (m) {
        const month = monthNameToNumber(normFa(m[1]));
        if (month) return { year: +m[3], month, day: +m[2] };
    }
    // numeric "d/m/y" or "m/d/y" \u2014 disambiguate with the >12 rule
    m = v.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{3,4})/);
    if (m) {
        const a = +m[1], b = +m[2], year = +m[3];
        if (a > 12 && b <= 12) return { year, month: b, day: a };   // d/m/y
        if (b > 12 && a <= 12) return { year, month: a, day: b };   // m/d/y
        return { year, month: b, day: a };                          // ambiguous -> d/m/y
    }

    try {
        const p = parseDateString(value);
        if (p?.date) return { year: p.date.getFullYear(), month: p.date.getMonth() + 1, day: p.date.getDate() };
    } catch (e) { }
    return null;
}
