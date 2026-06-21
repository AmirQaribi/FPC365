// @ts-nocheck -- DOM helpers ported verbatim; bundled by the build.
/**
 * The Persian "display overlay" drawn on top of a Fluent date input so the
 * field reads in Jalali while Fluent keeps its own Gregorian value. Split out of
 * the original DatePickerBridge.ts (fix #6).
 */
const overlays = new WeakMap();

export function getOverlay(input) {
    return overlays.get(input);
}

export function hideOverlay(input) {
    const ov = overlays.get(input);
    if (ov) ov.style.display = "none";
}

export function positionOverlay(input, ov) {
    if (!input.isConnected) { ov.style.display = "none"; return; }
    const r = input.getBoundingClientRect();
    if (!r.width && !r.height) { ov.style.display = "none"; return; }
    const cs = getComputedStyle(input);
    Object.assign(ov.style, {
        top: (r.top + scrollY) + "px", left: (r.left + scrollX) + "px",
        width: r.width + "px", height: r.height + "px",
        background: cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)" ? cs.backgroundColor : "#fff",
        color: cs.color, fontSize: cs.fontSize, borderRadius: cs.borderRadius, display: "flex"
    });
}

export function showPersianOverlay(input, text) {
    let ov = overlays.get(input);
    if (!ov) {
        ov = document.createElement("div");
        ov.className = "pdp-display-overlay";
        ov.setAttribute("dir", "rtl");
        ov.setAttribute("data-fpc365-persian-skip", "true");
        ov.addEventListener("mousedown", (e) => {
            e.preventDefault(); e.stopPropagation();
            input.click();   // reopen the native picker -> our observer takes over
        });
        document.documentElement.appendChild(ov);
        overlays.set(input, ov);
        const repos = () => positionOverlay(input, ov);
        addEventListener("scroll", repos, true);
        addEventListener("resize", repos);
    }
    ov.textContent = text;
    positionOverlay(input, ov);
}
