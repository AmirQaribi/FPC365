// @ts-nocheck -- faithful verbatim port of the original imperative picker; bundled by esbuild.
/**
 * Persian (Jalali) date picker UI. Ported from the original
 * content/persian-datepicker.js (logic preserved verbatim) and adapted into a
 * TypeScript module that imports the Jalali helpers instead of relying on the
 * FPC365Jalali global.
 */
import { PERSIAN_MONTHS } from "../../../core/constants"
import {
	jalaaliFirstWeekday,
	jalaaliMonthLength,
	jalaliToGregorian,
	toPersianDigits,
	todayJalali,
} from "../../../application/Jalali"
import TEMPLATE from "./datepicker.html?raw"

const FA_WEEK = ["ش", "ی", "د", "س", "چ", "پ", "ج"];               // Sat..Fri
const FA_WEEK_FULL = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

class PersianDatePicker {
    constructor(opts = {}) {
        this.usePersianDigits = !!opts.usePersianDigits;
        this.useMonthNames = opts.useMonthNames !== false;
        this.embedded = false;
        this._embedded = false;   // kept in sync with this.embedded
        this.onSelect = null;
        this.mode = "day";
        this.view = null;      // { year, month } (Jalali)
        this.selected = null;  // { year, month, day }
        this.anchor = null;
        this._build();
    }

    _build() {
        const root = document.createElement("div");
        root.className = "pdp-root";
        root.setAttribute("dir", "rtl");
        root.setAttribute("data-fpc365-persian-skip", "true");
        root.style.display = "none";
        // The static shell lives in datepicker.html and is bundled in as a
        // string at build time (fix #4). We cache the header/body/footer hosts
        // and render the dynamic parts into them on each _render().
        root.innerHTML = TEMPLATE;
        this.root = root;
        this.elHeader = root.querySelector("[data-pdp-header]");
        this.elBody = root.querySelector("[data-pdp-body]");
        this.elFooter = root.querySelector("[data-pdp-footer]");
        document.documentElement.appendChild(root);
        this._bindOutside();
    }

    _digits(s) { return this.usePersianDigits ? toPersianDigits(String(s)) : String(s); }

    open(anchor, initial) {
        this.embedded = false;
        this._embedded = false;
        this.root.classList.remove("pdp-root--embedded");
        this.anchor = anchor;
        this.root.style.position = "absolute";
        this._start(initial);
    }

    openEmbedded(surface, initial) {
        // keep both flags in sync (rest of the class reads this.embedded)
        this.embedded = true;
        this._embedded = true;

        this.root.classList.add("pdp-root--embedded");

        // The same picker instance is reused (see ensurePicker). If it was
        // previously shown as a popup via open(), it still carries absolute
        // positioning + stale top/left that would push it off-screen when
        // embedded. Clear that so it flows naturally inside Fluent's popover.
        this.root.style.position = "";
        this.root.style.top = "";
        this.root.style.left = "";

        // Keep clicks inside our picker from reaching Fluent's
        // "click outside -> dismiss" listener. Bind only once — openEmbedded
        // can run many times for the cached instance.
        if (!this._stopProp) {
            this._stopProp = (e) => e.stopPropagation();
            this.root.addEventListener("mousedown", this._stopProp);
        }

        surface.appendChild(this.root);

        // IMPORTANT: do NOT call this._bindOutside() here.

        // Initialize this.view (and selected/mode) BEFORE rendering.
        // _start() falls back to today's date when `initial` is null.
        this._start(initial);
    }

    _start(initial) {
        const start = initial || todayJalali();
        this.view = { year: start.year, month: start.month };
        this.selected = initial ? { ...initial } : null;
        this.mode = "day";
        this.root.style.display = "block";
        this._render();
    }

    hide() { this.root.style.display = "none"; }

    _bindOutside() {
        if (this._embedded) return;   // embedded mode never self-dismisses
        
        this._outside = (e) => {
            if (this.embedded || this.root.style.display === "none") return;
            if (this.root.contains(e.target) || e.target === this.anchor) return;
            this.hide();
        };
        document.addEventListener("mousedown", this._outside, true);
        const repos = () => { if (!this.embedded && this.root.style.display !== "none") this._position(); };
        addEventListener("scroll", repos, true);
        addEventListener("resize", repos);
    }

    _position() {
        if (this.embedded || !this.anchor) return;
        const r = this.anchor.getBoundingClientRect();
        this.root.style.top = (r.bottom + scrollY + 4) + "px";
        this.root.style.left = (r.left + scrollX) + "px";
    }

    _render() {
        if (!this.view) this.view = todayJalali(); // safety net

        // Render into the cached shell hosts instead of blowing away the whole
        // root each time (the datepicker.html shell is preserved \u2014 fix #4).
        this.elHeader.replaceChildren(this._title(), this._nav());

        const body = [];
        if (this.mode === "day") {
            body.push(this._weekdays(), this._days());
        } else if (this.mode === "month") {
            body.push(this._months());
        } else {
            body.push(this._years());
        }
        this.elBody.replaceChildren(...body);

        this.elFooter.replaceChildren(this._todayLink(), this._clearLink());

        if (!this.embedded) this._position();
    }

    _navBtn(dir, fn) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "pdp-nav-btn";
        b.innerHTML = dir === "up"
            ? '<svg viewBox="0 0 20 20" fill="none"><path d="M5 12l5-5 5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
            : '<svg viewBox="0 0 20 20" fill="none"><path d="M5 8l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        b.addEventListener("click", fn);
        return b;
    }

    _title() {
        const title = document.createElement("button");
        title.type = "button";
        title.className = "pdp-title";
        if (this.mode === "year") {
            title.textContent = `${this._digits(this.view.year - 6)} - ${this._digits(this.view.year + 5)}`;
        } else {
            title.textContent = `${PERSIAN_MONTHS[this.view.month - 1]} ${this._digits(this.view.year)}`;
        }
        title.addEventListener("click", () => {
            this.mode = this.mode === "day" ? "month" : this.mode === "month" ? "year" : "day";
            this._render();
        });
        return title;
    }

    _nav() {
        const nav = document.createElement("div");
        nav.className = "pdp-nav";
        nav.appendChild(this._navBtn("up", () => this._step(-1)));
        nav.appendChild(this._navBtn("down", () => this._step(1)));
        return nav;
    }

    _step(dir) {
        if (this.mode === "day") {
            let m = this.view.month + dir, y = this.view.year;
            if (m < 1) { m = 12; y--; }
            if (m > 12) { m = 1; y++; }
            this.view = { year: y, month: m };
        } else if (this.mode === "month") {
            this.view = { ...this.view, year: this.view.year + dir };
        } else {
            this.view = { ...this.view, year: this.view.year + dir * 12 };
        }
        this._render();
    }

    _weekdays() {
        const w = document.createElement("div");
        w.className = "pdp-weekdays";
        FA_WEEK.forEach((d, i) => {
            const c = document.createElement("div");
            c.className = "pdp-weekday";
            c.title = FA_WEEK_FULL[i];
            c.textContent = d;
            w.appendChild(c);
        });
        return w;
    }

    _days() {
        const grid = document.createElement("div");
        grid.className = "pdp-grid";
        const { year, month } = this.view;
        const firstW = jalaaliFirstWeekday(year, month); // 0 = Saturday
        const len = jalaaliMonthLength(year, month);
        const today = todayJalali();

        const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
        const prevLen = jalaaliMonthLength(prev.year, prev.month);
        for (let i = 0; i < firstW; i++) {
            const d = prevLen - firstW + 1 + i;
            grid.appendChild(this._dayCell(d, { ...prev, day: d }, true, today));
        }
        for (let d = 1; d <= len; d++) {
            grid.appendChild(this._dayCell(d, { year, month, day: d }, false, today));
        }
        const total = firstW + len;
        const cells = Math.ceil(total / 7) * 7;
        const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
        let nd = 1;
        for (let i = total; i < cells; i++) {
            grid.appendChild(this._dayCell(nd, { ...next, day: nd }, true, today));
            nd++;
        }
        return grid;
    }

    _dayCell(label, jdate, outside, today) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "pdp-day";
        if (outside) b.classList.add("pdp-day--outside");
        if (today && jdate.year === today.year && jdate.month === today.month && jdate.day === today.day) {
            b.classList.add("pdp-day--today");
        }
        if (this.selected && jdate.year === this.selected.year && jdate.month === this.selected.month && jdate.day === this.selected.day) {
            b.classList.add("pdp-day--selected");
        }
        b.textContent = this._digits(label);
        b.addEventListener("click", () => this._commit(jdate));
        return b;
    }

    _months() {
        const wrap = document.createElement("div");
        wrap.className = "pdp-months";
        PERSIAN_MONTHS.forEach((name, i) => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "pdp-month";
            if (this.selected && this.selected.year === this.view.year && this.selected.month === i + 1) {
                b.classList.add("pdp-month--selected");
            }
            b.textContent = name;
            b.addEventListener("click", () => { this.view = { ...this.view, month: i + 1 }; this.mode = "day"; this._render(); });
            wrap.appendChild(b);
        });
        return wrap;
    }

    _years() {
        const wrap = document.createElement("div");
        wrap.className = "pdp-years";
        const start = this.view.year - 6;
        for (let i = 0; i < 12; i++) {
            const y = start + i;
            const b = document.createElement("button");
            b.type = "button";
            b.className = "pdp-year";
            if (this.selected && this.selected.year === y) b.classList.add("pdp-year--selected");
            b.textContent = this._digits(y);
            b.addEventListener("click", () => { this.view = { ...this.view, year: y }; this.mode = "month"; this._render(); });
            wrap.appendChild(b);
        }
        return wrap;
    }

    _todayLink() {
        const today = document.createElement("button");
        today.type = "button";
        today.className = "pdp-link";
        today.textContent = "امروز";
        today.addEventListener("click", () => this._commit(todayJalali()));
        return today;
    }

    _clearLink() {
        const clear = document.createElement("button");
        clear.type = "button";
        clear.className = "pdp-link";
        clear.textContent = "پاک کردن";
        clear.addEventListener("click", () => { this.selected = null; if (this.onSelect) this.onSelect(null); this.hide(); });
        return clear;
    }

    _commit(jdate) {
        this.selected = { ...jdate };
        const g = jalaliToGregorian(jdate.year, jdate.month, jdate.day);
        if (this.onSelect) this.onSelect({ jalali: jdate, gregorian: { year: g.year, month: g.month, day: g.day } });
        this.hide();
    }
}


export { PersianDatePicker }
