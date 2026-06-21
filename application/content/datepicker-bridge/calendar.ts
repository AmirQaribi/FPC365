// @ts-nocheck -- DOM helpers ported verbatim; bundled by the build.
/**
 * Helpers that read from / drive Fluent's native v9 calendar popover. These are
 * pure functions over the passed-in calendar element and were split out of the
 * original DatePickerBridge.ts (fix #6).
 */
import { gregorianToJalali } from "../../Jalali"
import { parseDayLabel } from "./text"

const DEBUG = false;
const dbg = (...a) => { if (DEBUG) try { console.debug("[FPC365]", ...a); } catch (e) {} };

export const CAL_SELECTOR = ".fui-DatePicker__calendar, .fui-Calendar, [class*='fui-DatePicker__calendar'], [class*='fui-Calendar'], .ms-DatePicker";

export const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

export function isFluentDateInput(inp) {
    return !!(inp && inp.tagName === "INPUT" &&
        inp.closest(".fui-DatePicker, [class*='DatePicker']"));
}

// Locate the Fluent calendar inside a newly-added node. Fluent's exact class
// names have changed across v9 releases, so match several known hooks and
// fall back to the day-grid (the one part that is always present).
export function findCalendar(node) {
    if (!node || node.nodeType !== 1) return null;
    if (node.matches?.(CAL_SELECTOR)) return node;
    const direct = node.querySelector?.(CAL_SELECTOR);
    if (direct) return direct;
    const grid = node.matches?.("[class*='CalendarDayGrid']")
        ? node
        : node.querySelector?.("[class*='CalendarDayGrid']");
    if (grid) {
        return grid.closest(CAL_SELECTOR)
            || grid.closest('[role="dialog"], .fui-PopoverSurface')
            || grid;
    }
    return null;
}

// \u2500\u2500 read native calendar state \u2500\u2500
export function getNativeSelected(cal) {
    const b = cal.querySelector("td.fui-CalendarDayGrid__daySelected button[aria-label]")
        || cal.querySelector('td[aria-selected="true"] button[aria-label]');
    const g = b && parseDayLabel(b.getAttribute("aria-label"));
    return g ? gregorianToJalali(g.year, g.month, g.day) : null;
}

export function getNavigated(cal) {
    const b = cal.querySelector(
        "td.fui-CalendarDayGrid__dayCell:not(.fui-CalendarDayGrid__dayOutsideNavigatedMonth) button[aria-label]"
    )
        // Fluent v8 (Dynamics 365 schedule board): in-month day cells have no
        // aria-hidden; out-of-month cells carry aria-hidden / dayOutsideNavigatedMonth.
        || cal.querySelector(
            "td[role='gridcell']:not([aria-hidden='true']):not([class*='dayOutsideNavigatedMonth']) button[aria-label]:not([aria-hidden='true'])"
        );
    const g = b && parseDayLabel(b.getAttribute("aria-label"));
    return g ? { year: g.year, month: g.month } : null;
}

export async function navigateTo(cal, year, month) {
    for (let i = 0; i < 48; i++) {
        const nav = getNavigated(cal);
        if (!nav) return false;
        const diff = (year - nav.year) * 12 + (month - nav.month);
        if (diff === 0) return true;
        const btn = cal.querySelector(
            diff > 0
                ? 'button[title^="Navigate to next month"], button[title^="Next Month"]'
                : 'button[title^="Navigate to previous month"], button[title^="Previous Month"]'
        );
        if (!btn) return false;
        btn.click();
        await frame();
    }
    return false;
}

export async function commitToNative(cal, g) {
    dbg("commitToNative target Gregorian =", g);
    const navOk = await navigateTo(cal, g.year, g.month);
    dbg("navigateTo ok =", navOk, "navigated =", getNavigated(cal));
    const cells = cal.querySelectorAll(
        "td.fui-CalendarDayGrid__dayCell button[aria-label], td[role='gridcell'] button[aria-label]"
    );
    let sampled = false;
    for (const b of cells) {
        const td = b.closest("td");
        // Skip out-of-month cells in Fluent v9 (class) and v8 (aria-hidden /
        // hashed dayOutsideNavigatedMonth-NNN class).
        if (
            td.classList.contains("fui-CalendarDayGrid__dayOutsideNavigatedMonth") ||
            td.getAttribute("aria-hidden") === "true" ||
            b.getAttribute("aria-hidden") === "true" ||
            /dayOutsideNavigatedMonth/.test(td.className)
        ) continue;
        const aria = b.getAttribute("aria-label");
        const d = parseDayLabel(aria);
        if (!sampled) { dbg("sample in-month cell aria-label =", JSON.stringify(aria), "-> parsed =", d); sampled = true; }
        if (d && d.day === g.day && d.year === g.year && d.month === g.month) {
            dbg("matched cell, clicking:", JSON.stringify(aria));
            b.click();      // Fluent updates its own state + input, then closes the popover
            return true;
        }
    }
    dbg("NO matching cell found for", g, "\u2014 check the sampled aria-label format above");
    return false;
}

export function hideNativeGrid(cal) {
    // Collapse the ENTIRE native calendar. Cells stay in the DOM and remain
    // programmatically clickable (.click() works on hidden elements), so commit still works.
    Object.assign(cal.style, {
        position: "absolute",
        left: "-9999px",
        top: "0",
        opacity: "0",
        pointerEvents: "none",
        width: "1px",
        height: "1px",
        overflow: "hidden"
    });
    const surface = cal.closest('[role="dialog"], .fui-PopoverSurface');
    if (surface) {
        Object.assign(surface.style, {
            width: "auto",
            minWidth: "0",
            maxWidth: "none",
            padding: "0",
            overflow: "visible"
        });
    }
}
