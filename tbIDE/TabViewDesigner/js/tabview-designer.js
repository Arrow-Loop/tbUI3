/* tbUI3 designer adapter. IDE BETA 1043, plus the BETA 1033 insertion probe.
 * Native controls own geometry and persistence. This adapter only suppresses inactive
 * page DOM nodes and calls the IDE's own edit/undo functions. No clipboard or input simulation.
 * Kept as a factory so tests can supply an isolated IDE facade.
 */
(function createTabViewDesigner(api) {
    'use strict';
    const version = 3;
    const hostClass = 'tbui3.ui3tabview', pageClass = 'tbui3.ui3tabpage';
    const pageClsid = '{1681A635-13C8-47F3-B96A-FE8123C9F708}';
    const required = ['getCurrentFormEditorGlobals', 'preparePaste', 'deserializeControls',
        'prepareForMultipleChangeProperties', 'handleMultipleChangeProperties', 'doPaste',
        'getTopLeftOfAllControls', 'changedSelectedControls', 'unselectAllControls',
        'changeProperty', 'undoPoint', 'getImageFromServer', 'syncPropertySheet',
        'deleteSelectedControls', 'updateAllControlDragPoints'];
    const hiddenClass = 'tbui3-inactive-page';
    const touched = new Set(), desires = new WeakMap(), firstHeaders = new WeakMap();
    const requestNumbers = new WeakMap(), selections = new WeakMap();
    const pendingNewPages = new WeakMap();
    let timer, disposed = false, busy = false, error = '', style;
    const kind = c => String(c?.properties?._className || '').toLowerCase();
    const name = c => String(c?.properties?.Name || '');
    const sameName = (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase();
    function supported() { return required.every(k => typeof api[k] === 'function'); }
    function globals() {
        const g = api.getCurrentFormEditorGlobals();
        if (!g?.designer || !Array.isArray(g.allControls) || !Array.isArray(g.selectedControls)) return null;
        // Report designers and control-definition designers are not consumer Forms.
        if (g.designerContainerOUTER?.parentNode?.isReportMode) return null;
        if (!['form', 'mdiform'].includes(kind(g.designer))) return null;
        return g;
    }
    function ready(g) {
        return g && !busy && !g.isDragging && !g.isSyncingToLiveForm && !g.isInitialSync &&
            !g.pendingChangesCount && !g.outstandingSerializationRequests && !g.multiChangeNestCount;
    }
    function pages(g, host) {
        return g.allControls.filter(c => !c.isDeleted && kind(c) === pageClass && c.parentElement === host)
            .sort((a, b) => (Number(a.properties.PageOrder) || 0) - (Number(b.properties.PageOrder) || 0) ||
                (name(a).toLowerCase() < name(b).toLowerCase() ? -1 : name(a).toLowerCase() > name(b).toLowerCase() ? 1 : 0));
    }
    function owner(c) {
        for (let at = c; at; at = at.parentElement) if (kind(at) === hostClass) return at;
        return null;
    }
    function selectedHost(g) { return g.selectedControls.length === 1 ? owner(g.selectedControls[0]) : null; }
    function active(g, host) {
        const list = pages(g, host), desired = desires.get(host);
        return list.find(c => sameName(name(c), desired || host.properties.SelectedPage)) || list[0];
    }
    function revealPage(c, host) {
        for (let at = c; at && at !== host; at = at.parentElement)
            if (kind(at) === pageClass && at.parentElement === host) return at;
        return null;
    }
    function choose(g, controls) {
        api.unselectAllControls(g);
        g.selectedControls = controls;
        for (const c of controls) { c.isSelected = true; c.classList.add('baseControlSelected'); }
        api.changedSelectedControls(g);
        api.syncPropertySheet(g);
        api.updateAllControlDragPoints(g);
    }
    function edit(g, action, checkpoint = true) {
        if (!ready(g)) throw new Error('Designer is waiting for the compiler; retry when it settles.');
        busy = true;
        let started = false;
        try { api.prepareForMultipleChangeProperties(g); started = true; action(); }
        finally {
            try { if (started) api.handleMultipleChangeProperties(g); }
            finally { busy = false; if (started && checkpoint) api.undoPoint(g); }
        }
    }
    function setPage(g, host, page, selectPage = false) {
        if (!page) return;
        if (!sameName(host.properties.SelectedPage, name(page))) {
            edit(g, () => api.changeProperty(g, host, 'SelectedPage', name(page)));
            desires.set(host, name(page));
            api.getImageFromServer(g, host);
        }
        if (selectPage) choose(g, [page]);
        display(g, host);
    }
    function display(g, host) {
        const current = active(g, host);
        for (const page of pages(g, host)) {
            page.classList.toggle(hiddenClass, page !== current);
            touched.add(page);
            // Resize handles are siblings in the IDE, outside the hidden page subtree.
            for (const c of g.allControls) {
                if (c === page || page.contains(c)) {
                    for (const key of ['draggerTopLeft', 'draggerTop', 'draggerTopRight', 'draggerLeft',
                        'draggerRight', 'draggerBottomLeft', 'draggerBottom', 'draggerBottomRight']) {
                        const handle = c[key];
                        if (handle) { handle.classList.toggle(hiddenClass, page !== current); touched.add(handle); }
                    }
                }
            }
        }
    }
    function layout(g, host) {
        const list = pages(g, host), width = Number(host.properties.Width);
        if (!(width > 0)) return null;
        const add = host.properties.IsAddTabButtonVisible !== false;
        const available = width - (add ? 35 : 0);
        const size = Math.max(100, Math.min(240, list.length ? available / list.length : 100));
        const slots = Math.max(0, Math.floor(available / size));
        const current = list.indexOf(active(g, host));
        let first = firstHeaders.get(host) || 0;
        if (current >= 0) {
            if (current < first) first = current;
            if (slots > 0 && current >= first + slots) first = current - slots + 1;
        }
        if (first >= list.length) first = 0;
        firstHeaders.set(host, first);
        return { list, size, first, count: Math.min(slots, list.length - first), add };
    }
    function newPage(g, host) {
        if (!host) throw new Error('Select a UI3TabView or one of its pages first.');
        if (!ready(g)) throw new Error('Designer is waiting for the compiler; retry when it settles.');
        if (pendingNewPages.has(g)) throw new Error('Designer is finishing the new page; retry when it settles.');
        const list = pages(g, host);
        let number = 1;
        while (g.allControls.some(c => sameName(name(c), 'UI3TabPage' + number))) number++;
        const nextName = 'UI3TabPage' + number;
        const data = [{ _className: 'tbUI3.UI3TabPage', _clsid: pageClsid, Name: nextName,
            Caption: 'Page ' + number, PageOrder: list.reduce((n, p) => Math.max(n, Number(p.properties.PageOrder) || 0), -1) + 1,
            Left: 0, Top: 40, Width: Math.max(1, Number(host.properties.Width) || 1),
            Height: Math.max(1, (Number(host.properties.Height) || 41) - 40),
            Visible: true, TabStop: false, Index: -1, _children: [] }];
        // preparePaste normally chooses the *parent* of a selected custom container.
        // Override that target explicitly so the page is never nested in the active page.
        let created;
        const previousSelection = g.selectedControls.slice();
        try { edit(g, () => {
            const paste = api.preparePaste(g);
            paste.parentContainer = host;
            paste.wasContainerSelection = false;
            paste.wasNoSelection = false;
            created = api.deserializeControls(g, JSON.stringify(data), host, false, false);
            if (!created?.length || created[0].parentElement !== host) throw new Error('IDE did not insert a direct page child.');
            // doPaste includes a +10 offset for ordinary paste. Neutralize its positioning,
            // while retaining selection, dirty-state, snapshots and anchoring behavior.
            const top = api.getTopLeftOfAllControls(g, created);
            paste.lowestPointOfSelection = { x: top.x, y: top.y - 10 };
            api.doPaste(g, paste, created, false);
            api.changeProperty(g, host, 'SelectedPage', nextName);
        }, false); } catch (e) {
            api.undoPoint(g);
            choose(g, previousSelection.filter(c => !c.isDeleted));
            throw e;
        }
        desires.set(host, nextName);
        // The compiler initializes a fresh UserControl from its PropertyBag defaults.
        // Public fields in insertion JSON are not proof that its setters ran. Apply them
        // through native changeProperty once the new control has a compiler-assigned ID.
        pendingNewPages.set(g, { host, page: created[0], caption: data[0].Caption, order: data[0].PageOrder });
        choose(g, created);
        selections.set(g, created[0]);
        if (ready(g) && (!g.isInFullFormMode || created[0].formDesignerControlId !== undefined)) finishNewPage(g);
        display(g, host);
        return nextName;
    }
    function finishNewPage(g) {
        const pending = pendingNewPages.get(g);
        if (!pending || !ready(g)) return false;
        if (!g.allControls.includes(pending.page) || pending.page.isDeleted) {
            pendingNewPages.delete(g); api.undoPoint(g); return true;
        }
        if (g.isInFullFormMode && pending.page.formDesignerControlId === undefined) return false;
        try {
            edit(g, () => {
                api.changeProperty(g, pending.page, 'Caption', pending.caption);
                api.changeProperty(g, pending.page, 'PageOrder', pending.order);
            });
            api.getImageFromServer(g, pending.host);
        } finally { pendingNewPages.delete(g); }
        return true;
    }
    function initializeHarness(g) {
        // Only our explicitly marked fixture gets first-open initialization. No page Tag
        // is used for membership; user forms and user property values are left alone.
        const form = g.designer.properties;
        if (form.Tag !== 'tbUI3:MultiPageHarness:1' ||
            String(form.FormDesignerId).replace(/[{}]/g, '').toUpperCase() !== 'B64F9C2B-DC41-4C4E-8C0F-7147B529D994') return false;
        const byName = n => g.allControls.find(c => sameName(name(c), n));
        const host = byName('UI3TabView1');
        const seeds = [['pgGeneral', 'General', 0], ['pgDetails', 'Details', 1], ['pgFinish', 'Finish', 2]];
        if (!host || seeds.some(s => !byName(s[0]))) return false;
        edit(g, () => {
            for (const [n, caption, order] of seeds) {
                api.changeProperty(g, byName(n), 'Caption', caption);
                api.changeProperty(g, byName(n), 'PageOrder', order);
            }
            for (const [i, caption] of ['General page action', 'Open Finish page', 'Return to General'].entries()) {
                const button = byName('cmdPage' + (i + 1));
                if (button) { api.changeProperty(g, button, 'Caption', caption); api.changeProperty(g, button, 'Style', 0); }
            }
            api.changeProperty(g, host, 'SelectedPage', 'pgGeneral');
            api.changeProperty(g, host, 'IsAddTabButtonVisible', true);
            api.changeProperty(g, g.designer, 'Tag', '');
        });
        desires.set(host, 'pgGeneral'); api.getImageFromServer(g, host);
        choose(g, [host]);
        selections.set(g, g.selectedControls[0]);
        return true;
    }
    function move(g, host, direction) {
        const list = pages(g, host), current = active(g, host), from = list.indexOf(current), to = from + direction;
        if (from < 0 || to < 0 || to >= list.length) return;
        [list[from], list[to]] = [list[to], list[from]];
        edit(g, () => list.forEach((p, i) => api.changeProperty(g, p, 'PageOrder', i)));
        api.getImageFromServer(g, host);
    }
    function remove(g, host) {
        const page = active(g, host);
        if (!page) return;
        const list = pages(g, host), index = list.indexOf(page), next = list[index + 1] || list[index - 1];
        edit(g, () => {
            choose(g, [page]);
            api.deleteSelectedControls(g);
            api.changeProperty(g, host, 'SelectedPage', next ? name(next) : '');
        });
        desires.set(host, next ? name(next) : '');
        choose(g, [host]);
        api.getImageFromServer(g, host);
    }
    function run(command) {
        try {
            if (command === 'diagnostics') return diagnostics();
            if (disposed) throw new Error('Adapter disabled; use TabView refresh to reinstall it.');
            if (!supported()) throw new Error('Unsupported IDE designer internals; adapter disabled.');
            const g = globals();
            if (!g) throw new Error('Open a consumer Form designer first.');
            const host = selectedHost(g);
            if (!host) {
                const detail = g.selectedControls.map(c => name(c) + ' [' + kind(c) + ']').join(', ') || '(none)';
                throw new Error('Select a UI3TabView or one of its children first. Current selection: ' + detail);
            }
            if (!ready(g)) throw new Error('Designer is waiting for the compiler; retry when it settles.');
            if (pendingNewPages.has(g)) throw new Error('Designer is finishing the new page; retry when it settles.');
            if (command === 'new') return newPage(g, host);
            if (command === 'left') move(g, host, -1);
            else if (command === 'right') move(g, host, 1);
            else if (command === 'delete') remove(g, host);
            else if (command !== 'refresh') throw new Error('Unknown designer command.');
            tick();
            return 'OK';
        } catch (e) { error = String(e.message || e); return 'TabView Designer: ' + error; }
    }
    function diagnostics() {
        // Read-only and deliberately bypasses consumer/class filters: report why a
        // real IDE state was rejected instead of hiding it behind another generic error.
        const g = typeof api.getCurrentFormEditorGlobals === 'function' ? api.getCurrentFormEditorGlobals() : null;
        const missing = required.filter(k => typeof api[k] !== 'function');
        const root = g?.designer?.properties || {};
        const report = { adapter: version, missing, supported: supported(), consumerAccepted: !!(supported() && globals()),
            form: { name: root.Name, className: root._className, clsid: root._clsid, formId: root.FormDesignerId,
                marker: String(root.Tag || '').startsWith('tbUI3:') ? root.Tag : '(not a fixture marker)', backColor: root.BackColor },
            pending: { properties: g?.pendingChangesCount, snapshots: g?.outstandingSerializationRequests, dragging: g?.isDragging },
            selection: (g?.selectedControls || []).map(c => ({ name: name(c), className: kind(c), clsid: c.properties?._clsid,
                parent: name(c.parentElement), parentClass: kind(c.parentElement) })), controls: [], lastError: error };
        for (const c of g?.allControls || []) {
            const cls = kind(c);
            if (!cls.includes('ui3tab')) continue;
            let computed = {};
            try { computed = api.document.defaultView.getComputedStyle(c); } catch (_) {}
            const image = String(c.imageData || '');
            let checksum = 2166136261;
            for (let i = 0; i < image.length; i++) checksum = Math.imul(checksum ^ image.charCodeAt(i), 16777619) >>> 0;
            let pngSize = '(unavailable)';
            try {
                const bytes = api.document.defaultView.atob(image.slice(0, 44));
                const u32 = at => ((bytes.charCodeAt(at) * 16777216) + (bytes.charCodeAt(at+1) << 16) +
                    (bytes.charCodeAt(at+2) << 8) + bytes.charCodeAt(at+3)) >>> 0;
                pngSize = u32(16) + 'x' + u32(20);
            } catch (_) {}
            report.controls.push({ name: name(c), className: cls, clsid: c.properties?._clsid,
                nativeId: c.formDesignerControlId, parent: name(c.parentElement),
                caption: c.properties?.Caption, order: c.properties?.PageOrder, selectedPage: c.properties?.SelectedPage,
                geometry: [c.properties?.Left, c.properties?.Top, c.properties?.Width, c.properties?.Height],
                hiddenByAdapter: c.classList.contains(hiddenClass),
                style: { display: computed.display, color: computed.backgroundColor, size: computed.backgroundSize,
                    inlineImageLength: String(c.style?.backgroundImage || '').length,
                    computedImageLength: String(computed.backgroundImage || '').length },
                snapshot: { encodedLength: image.length, pngSize, checksum: checksum.toString(16) } });
        }
        return 'DIAGNOSTICS ' + JSON.stringify(report);
    }
    function tick() {
        if (disposed || !supported()) return;
        for (const node of touched) if (node.isConnected === false) {
            node.classList.remove(hiddenClass); touched.delete(node);
        }
        const g = globals();
        if (!g) return;
        const hosts = g.allControls.filter(c => kind(c) === hostClass && !c.isDeleted);
        if (ready(g)) {
            if (pendingNewPages.has(g)) {
                finishNewPage(g);
                for (const host of hosts) display(g, host);
                return;
            }
            if (initializeHarness(g)) {
                for (const host of hosts) display(g, host);
                return;
            }
            // Only a *new* Properties/list selection should reveal a hidden child's page.
            // A tab switch must not be undone by the old selection on the next timer tick.
            const previous = selections.get(g), selection = g.selectedControls[0];
            selections.set(g, selection);
            for (const host of hosts) {
                desires.delete(host);
                const selected = previous !== selection ? revealPage(selection, host) : null;
                if (selected && selected !== active(g, host)) { setPage(g, host, selected); break; }
                const request = Number(host.properties.DesignerNewPageRequest) || 0;
                const last = requestNumbers.has(host) ? requestNumbers.get(host) : request;
                requestNumbers.set(host, request);
                if (request && request !== last) { newPage(g, host); break; }
            }
        }
        for (const host of hosts) display(g, host);
    }
    function pointer(event) {
        if (disposed || event.button !== 0 || !supported()) return;
        const g = globals();
        if (!ready(g) || pendingNewPages.has(g)) return;
        // Deepest host first, so nested TabViews receive their own header clicks.
        const hosts = g.allControls.filter(c => kind(c) === hostClass && !c.isDeleted).reverse();
        for (const host of hosts) {
            if (!host.contains(event.target) || host.closest('.' + hiddenClass)) continue;
            const rect = host.getBoundingClientRect(), info = layout(g, host);
            if (!info || !rect.width || !rect.height) continue;
            const x = (event.clientX - rect.left) * Number(host.properties.Width) / rect.width;
            const y = (event.clientY - rect.top) * Number(host.properties.Height) / rect.height;
            if (y < 8 || y >= 40 || x < 0) continue;
            const index = Math.floor(x / info.size);
            const addX = info.count * info.size + 3;
            const isNew = info.add && x >= addX && x < addX + 32;
            if (!isNew && index >= info.count) continue;
            event.preventDefault(); event.stopImmediatePropagation();
            try {
                if (isNew) newPage(g, host);
                else setPage(g, host, info.list[info.first + index], true);
                selections.set(g, g.selectedControls[0]);
            } catch (e) { error = String(e.message || e); }
            return;
        }
    }
    function dispose() {
        disposed = true;
        if (timer) api.clearInterval(timer);
        api.document?.removeEventListener('pointerdown', pointer, true);
        for (const node of touched) node.classList.remove(hiddenClass);
        touched.clear();
        style?.remove();
    }
    function install() {
        if (!supported()) return 'Unsupported IDE designer internals; no hooks installed.';
        style = api.document.createElement('style');
        // A narrow designer-only rule must win the IDE's inline display styles.
        style.textContent = '.' + hiddenClass + '{display:none!important}';
        api.document.head.appendChild(style);
        api.document.addEventListener('pointerdown', pointer, true);
        timer = api.setInterval(() => {
            try { tick(); } catch (e) { error = String(e.message || e); dispose(); }
        }, 150);
        tick();
        return 'TabView Designer adapter v' + version + ' installed';
    }
    return { version, install, dispose, run, tick, diagnostics, supported, get lastError() { return error; } };
})
