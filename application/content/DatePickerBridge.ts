// @ts-nocheck -- orchestration ported verbatim; bundled by the build.
/**
 * Fluent UI v9 Persian date-picker bridge (orchestrator).
 *
 * Strategy: let Fluent open its native calendar (portal popover), hide it,
 * show our Jalali picker in the same surface, and commit the user choice by
 * clicking the matching native day cell \u2014 so Fluent updates its own React state.
 *
 * The pure helpers were split into ./datepicker-bridge/{text,calendar,overlay}.ts
 * (fix #6). This file keeps the stateful wiring (settings, the cached picker,
 * the active input, and the MutationObserver).
 */
import { PersianDatePicker } from "../../presentation/components/datepicker/datepicker"
import { formatJalali, gregorianToJalali } from "../Jalali"
import {
    CAL_SELECTOR,
    commitToNative,
    findCalendar,
    getNativeSelected,
    getNavigated,
    hideNativeGrid,
    isFluentDateInput,
} from "./datepicker-bridge/calendar"
import { getOverlay, showPersianOverlay } from "./datepicker-bridge/overlay"
import { parseInputDate } from "./datepicker-bridge/text"

export function initDatePickerBridge() {

const STORAGE_KEY = "fpc365PersianCalendarSettings";
// Set to true to print diagnostics to the page console (prefixed [FPC365]).
const DEBUG = false;
const dbg = (...a) => { if (DEBUG) try { console.debug("[FPC365]", ...a); } catch (e) {} };
let settings = { enabled: true, convertDatePickers: false, usePersianDigits: false, useMonthNames: true };
let picker = null;
let activeDpInput = null;
let lastDateInputMousedownAt = 0;   // for the open/close (toggle) fix

function convertExistingFields(root) {
    if (!settings.enabled || !settings.convertDatePickers) return;
    (root || document)
        .querySelectorAll(".fui-DatePicker input, [class*='DatePicker'] input")
        .forEach((inp) => {
            if (inp.type === "hidden") return;
            const g = parseInputDate(inp.value);
            dbg("convertExistingFields: raw value =", JSON.stringify(inp.value), "-> parsed Gregorian =", g);
            if (g) showPersianOverlay(inp, persianDisplay(g));
            else { const ov = getOverlay(inp); if (ov) ov.style.display = "none"; }
        });
}

let scanTimer = null;
function scheduleScan() {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(() => convertExistingFields(), 400);
}

// \u2500\u2500 our picker \u2500\u2500
function ensurePicker() {
    // PersianDatePicker and the Jalali helpers are now ES-module imports that
    // the build bundles directly into content.js. There are no load-order
    // globals to guard against anymore \u2014 this is what used to throw the
    // "missing FPC365Jalali global" error and stop the picker from opening.
    if (!picker) picker = new PersianDatePicker({ usePersianDigits: settings.usePersianDigits });
    return picker;
}

function onCalendarMounted(cal) {
    if (!settings.enabled || !settings.convertDatePickers) return;
    if (cal.dataset.fpc365Handled) return;

    // Make sure the picker is available BEFORE we mark the calendar as handled
    // or hide the native grid \u2014 otherwise a failure would permanently break this
    // calendar (hidden native + no replacement).
    const p = ensurePicker();
    if (!p) return;

    cal.dataset.fpc365Handled = "true";

    const surface = cal.closest('[role="dialog"], .fui-PopoverSurface') || cal.parentElement;
    hideNativeGrid(cal);

    const input = activeDpInput;
    const initial = getNativeSelected(cal);
    dbg("calendar mounted. native-selected (Jalali) =", initial, "navigated =", getNavigated(cal));
    p.usePersianDigits = settings.usePersianDigits;
    p.useMonthNames = settings.useMonthNames;

    p.onSelect = async (res) => {
        if (!res) { p.hide(); return; } // (clearing handled by the field's own clear button)
        const ok = await commitToNative(cal, res.gregorian);
        if (ok && input) {
            // Draw the overlay from the EXACT Jalali day the user clicked, rather
            // than re-parsing the native field text (which may use a locale/format
            // we misread). This is the authoritative value.
            const j = res.jalali;
            const text = formatJalali(j.year, j.month, j.day, {
                usePersianDigits: settings.usePersianDigits,
                useMonthNames: settings.useMonthNames
            });
            showPersianOverlay(input, text);
        }
    };

    p.openEmbedded(surface, initial);
}

// \u2500\u2500 Persian display value (needs current settings) \u2500\u2500
function persianDisplay(g) {
    const j = gregorianToJalali(g.year, g.month, g.day);
    return formatJalali(j.year, j.month, j.day, {
        usePersianDigits: settings.usePersianDigits,
        useMonthNames: settings.useMonthNames
    });
}

// \u2500\u2500 wiring \u2500\u2500
function init() {
    try {
        chrome.storage.sync.get(STORAGE_KEY, (r) => {
            settings = { ...settings, ...(r[STORAGE_KEY] || {}) };
            convertExistingFields();                 // convert fields already on the page
            setTimeout(convertExistingFields, 1500); // catch fields CRM renders a bit later
        });
        chrome.storage.onChanged.addListener((c, area) => {
            // Fix #8: do NOT live-apply changes to fields the user is editing.
            // The reload banner (shown by ContentController) prompts a reload;
            // the bridge re-reads settings fresh on the next page load.
        });
    } catch (e) { }

    // remember which date input opened the popover
    document.addEventListener("focusin", (e) => {
        const inp = e.target.closest && e.target.closest("input");
        if (isFluentDateInput(inp)) activeDpInput = inp;
    }, true);
    document.addEventListener("mousedown", (e) => {
        const inp = e.target.closest && e.target.closest("input");
        if (isFluentDateInput(inp)) { activeDpInput = inp; lastDateInputMousedownAt = Date.now(); }
    }, true);

    // Open/close fix: clicking the text input makes Fluent open the calendar on
    // focus and then immediately TOGGLE it closed on the click \u2014 so it flashes
    // open then shut. We swallow that toggling click in the capture phase, right
    // after a date-input mousedown, so the focus-opened calendar stays open.
    document.addEventListener("click", (e) => {
        const inp = e.target.closest && e.target.closest("input");
        if (!isFluentDateInput(inp)) return;
        if (Date.now() - lastDateInputMousedownAt < 700) {
            dbg("swallowing date-input toggle click to keep the calendar open");
            e.stopImmediatePropagation();
            e.preventDefault();
        }
    }, true);

    // watch for the v9 calendar popover mounting anywhere (portal)
    const obs = new MutationObserver((muts) => {
        if (!settings.enabled || !settings.convertDatePickers) return;
        for (const m of muts) {
            for (const node of m.addedNodes) {
                const cal = findCalendar(node);
                if (cal) onCalendarMounted(cal);
            }
        }
        scheduleScan();
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
}
