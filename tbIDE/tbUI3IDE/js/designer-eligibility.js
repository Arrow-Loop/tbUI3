/* Active-project gate for the TabView designer. The IDE's project Settings and
 * compiler-published control list are independent inputs. Both must agree. */
(function createDesignerEligibility(api, createAdapter) {
    'use strict';
    const packageId = '{abd18105-b38a-427b-9933-289331d44da7}';
    const tabViewId = '{ff14322e-c9bc-4f3a-bce8-0fde58f230e0}';
    const tabPageId = '{1681a635-13c8-47f3-b96a-fe8123c9f708}';
    const contextClass = 'tbui3-tabview-context';
    const lower = value => typeof value === 'string' ? value.toLowerCase() : '';
    const pageCommands = ['New', 'Delete', 'Left', 'Right', 'Refresh', 'Diagnostics'];
    const document = api.document;
    const style = document.createElement('style');
    const selectors = pageCommands.map(name => '#addinButton-tbUI3Tab' + name);
    selectors.push('.tbui3-ribbon-group[aria-label="MultiPage"]');
    style.textContent = selectors.map(s => 'html:not(.' + contextClass + ') ' + s).join(',') + '{display:none!important}';
    document.head.appendChild(style);

    let project, settingsEntry, compiler, controls, staleControls;
    let referenced = false, request, validUntil = 0, nextRead = 0;
    let adapter, activeDesigner, disposed = false;

    function deactivate() {
        document.documentElement.classList.remove(contextClass);
        const previous = adapter;
        adapter = activeDesigner = undefined;
        previous?.dispose();
    }

    function resetReference() {
        referenced = false;
        request = undefined;
        validUntil = nextRead = 0;
        deactivate();
    }

    function sample() {
        const input = api.projectState();
        if (input?.project !== project || input?.settings !== settingsEntry || input?.compiler !== compiler) {
            // A compiler can briefly retain the old project's list during open/restart.
            if (controls) staleControls = controls;
            project = input?.project;
            settingsEntry = input?.settings;
            compiler = input?.compiler;
            resetReference();
        }
        controls = input?.controls;
        if (controls && controls !== staleControls) staleControls = undefined;
        return input;
    }

    function hasReference(settings) {
        const references = settings?.['project.references'];
        if (!Array.isArray(references)) return false;
        const matches = references.filter(ref => lower(ref?.id) === packageId);
        return matches.length === 1 && (matches[0].isDisabled == null || matches[0].isDisabled === false);
    }

    function currentDesigner() {
        if (disposed) return;
        const input = sample();
        if (!input || !referenced || api.now() >= validUntil || !Array.isArray(controls) ||
            controls === staleControls) return;
        // The active designer must already have received this compiler response.
        // The raw list stays complete even when the visible toolbox is filtered.
        const designer = api.formGlobals();
        if (!designer?.designer || designer.customControlsArray !== controls ||
            !Array.isArray(designer.allControls) || !Array.isArray(designer.selectedControls) ||
            designer.designerContainerOUTER?.parentNode?.isReportMode ||
            !['form', 'mdiform'].includes(lower(designer.designer.properties?._className))) return;
        const resolved = (name, clsid) => controls.some(control =>
            lower(control.package) === 'tbui3' && lower(control.name) === name && lower(control.clsid) === clsid);
        if (resolved('ui3tabview', tabViewId) && resolved('ui3tabpage', tabPageId)) return designer;
    }

    function selectedHost(designer) {
        if (designer?.selectedControls.length !== 1) return null;
        for (let node = designer.selectedControls[0]; node && node !== designer.designer; node = node.parentElement) {
            if (designer.allControls.includes(node) && !node.isDeleted &&
                lower(node.properties?._className) === 'tbui3.ui3tabview' &&
                lower(node.properties?._clsid) === tabViewId) return node;
        }
        return null;
    }

    function reconcile() {
        const designer = currentDesigner();
        if (activeDesigner !== designer) {
            deactivate();
            if (designer) {
                activeDesigner = designer;
                adapter = createAdapter(g => g === activeDesigner && g === currentDesigner());
                adapter.install();
            }
        }
        document.documentElement.classList.toggle(contextClass, !!adapter && !!selectedHost(designer));
    }

    function refresh() {
        if (disposed) return;
        try {
            const input = sample();
            const now = api.now();
            if (request && now >= request.deadline) resetReference();
            if (input && !request && now >= nextRead) {
                const pending = {deadline: now + 1000};
                request = pending;
                nextRead = now + 500;
                api.readSettings(settingsEntry, settings => {
                    if (disposed || request !== pending) return;
                    try {
                        sample();
                        if (request !== pending) return;
                        request = undefined;
                        referenced = hasReference(settings);
                        validUntil = api.now() + 1000;
                        reconcile();
                    } catch (_) { resetReference(); }
                });
            }
            reconcile();
        } catch (_) { resetReference(); }
    }

    const timer = api.setInterval(refresh, 150);
    refresh();
    return {
        invalidate() { resetReference(); refresh(); },
        selectedHost() { return adapter && selectedHost(currentDesigner()); },
        run(command) {
            refresh();
            if (!adapter || !selectedHost(currentDesigner())) return 'TabView designer context unavailable.';
            if (command === 'refresh') { deactivate(); reconcile(); }
            return adapter?.run(command) || '';
        },
        get lastError() { return adapter?.lastError || ''; },
        dispose() {
            disposed = true;
            api.clearInterval(timer);
            resetReference();
            style.remove();
        }
    };
})
