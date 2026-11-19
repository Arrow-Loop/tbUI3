/* Existing Toolbox controls translated from WinUI 3 templates.
   Source/version/state records: COMPONENT_FIDELITY.md. No third-party UI library. */
(function () {
  "use strict";
  const localAssets = new Map();
  const initializeAssets = (root=document) => root.querySelectorAll('[data-asset]').forEach(image=>{const uri=localAssets.get(image.dataset.asset);if(uri)image.setAttribute('src',uri);});
  const registerAssets = records => {for(const [name,uri] of Object.entries(records)){if(!/^[A-Za-z0-9_.\/-]{1,128}$/.test(name)||typeof uri!=='string'||!/^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(uri))throw new TypeError('Invalid embedded image asset');localAssets.set(name,uri);}initializeAssets();};
  let sequence = 0;
  const nextId = () => "winui-control-" + (++sequence);

  const comboBoxes=new WeakMap();
  function initializeComboBox(select) {
    if (comboBoxes.has(select)) { comboBoxes.get(select).configure(); return; }
    if (select.dataset.winuiInitialized) return;
    select.dataset.winuiInitialized = "true";
    const labels = Array.from(select.labels || []);
    const wrapper = document.createElement("div");
    wrapper.className = "combo-box";
    if (select.dataset.width) wrapper.dataset.width = select.dataset.width;
    if (select.classList.contains("settings-row__control")) wrapper.classList.add("settings-row__control");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "select-field";
    const selectionLabel = document.createElement("span");
    selectionLabel.className = "combo-box__selection";
    button.append(selectionLabel);
    button.setAttribute("role", "combobox");
    button.setAttribute("aria-haspopup", "listbox");
    button.setAttribute("aria-expanded", "false");
    const list = document.createElement("div");
    list.className = "combo-box__list";
    list.id = nextId();
    list.setAttribute("role", "listbox");
    button.setAttribute("aria-controls", list.id);
    const labelIds = labels.map(label => {
      const text = label.querySelector(".field__label") || label;
      if (!text.id) text.id = nextId();
      return text.id;
    });
    if (select.getAttribute("aria-label")) button.setAttribute("aria-label", select.getAttribute("aria-label"));
    else if (select.getAttribute("aria-labelledby")) button.setAttribute("aria-labelledby", select.getAttribute("aria-labelledby"));
    else if (labelIds.length) button.setAttribute("aria-labelledby", labelIds.join(" "));
    if (select.getAttribute("aria-describedby")) button.setAttribute("aria-describedby", select.getAttribute("aria-describedby"));
    select.replaceWith(wrapper);
    select.classList.remove("select-field", "settings-row__control");
    select.classList.add("combo-box__source");
    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");
    wrapper.append(select, button, list);
    // The editor and arrow form one focus/dismissal boundary.
    const popup = createPopup(list, button, { matchWidth: true, anchor: wrapper, lightDismiss: false, onClose: () => {
      editor?.setAttribute("aria-expanded", "false");
      editor?.removeAttribute("aria-activedescendant");
      button.removeAttribute("aria-activedescendant");
    } });
    let editor, retainedEditor, composing = false, dirty = false, notifying = false, changingMode = false;
    let currentText = "", pendingText = false, textParameter, configuration;
    const originalButtonName = button.getAttribute("aria-label"), originalLabelledBy = button.getAttribute("aria-labelledby");
    let active = select.selectedIndex;
    let search = "", searchTimer;
    const isOpen = () => popup.isOpen();
    const enabled = index => index >= 0 && index < select.options.length && !select.options[index].disabled && !select.options[index].parentElement.disabled;
    const searchEnabled = () => select.dataset.textSearchEnabled !== "false";
    const optionText = index => select.options[index].textContent.trimStart();
    const findMatch = (text, exact = false) => text.length ? Array.from(select.options).findIndex((option, index) =>
      enabled(index) && (exact ? optionText(index).toLocaleLowerCase() === text.toLocaleLowerCase() : optionText(index).toLocaleLowerCase().startsWith(text.toLocaleLowerCase()))) : -1;
    function notify() {
      notifying = true;
      try {
        select.dispatchEvent(new Event("input", { bubbles: true }));
        select.dispatchEvent(new Event("change", { bubbles: true }));
      } finally { notifying = false; }
    }
    function updateText(complete) {
      if (!editor || select.disabled || composing) return;
      const text = editor.value;
      const match = searchEnabled() ? findMatch(text, !complete) : -1;
      // Only append at the end; never replace a middle edit, deletion or IME preedit.
      if (complete && match >= 0 && editor.selectionStart === text.length && editor.selectionEnd === text.length) {
        editor.value = optionText(match);
        editor.setSelectionRange(text.length, editor.value.length);
      }
      dirty = true;
      currentText = editor.value;
      select.dataset.customValue = editor.value;
      select.selectedIndex = -1;
      selectionLabel.textContent = editor.value || select.dataset.placeholder || "";
      Array.from(list.children).forEach(item => item.setAttribute("aria-selected", "false"));
      highlight(match);
      notify();
    }
    function submitText() {
      if (!editor || !dirty || composing || select.disabled) return;
      const index = findMatch(editor.value, true);
      if (index >= 0) { choose(index); return; }
      const submitted = new CustomEvent("textSubmitted", { bubbles: true, cancelable: true, detail: { text: editor.value } });
      dirty = false;
      if (wrapper.dispatchEvent(submitted)) {
        // The application may have added a matching item while handling TextSubmitted.
        const added = findMatch(editor.value, true);
        if (added >= 0) choose(added);
        else { select.dataset.customValue = editor.value; select.selectedIndex = -1; }
      }
    }
    function createEditor() {
      editor = document.createElement("input");
      editor.type = "text";
      editor.className = "text-field text-control__input combo-box__editor";
      editor.autocomplete = "off";
      editor.setAttribute("role", "combobox");
      editor.setAttribute("aria-haspopup", "listbox");
      for (const name of ["aria-label", "aria-labelledby", "aria-describedby"]) {
        if (button.hasAttribute(name)) editor.setAttribute(name, button.getAttribute(name));
      }
      if (!editor.hasAttribute("aria-label") && !editor.hasAttribute("aria-labelledby")) editor.setAttribute("aria-label", "Editable ComboBox");
      editor.placeholder = select.dataset.placeholder || "";
      editor.setAttribute("aria-controls", list.id);
      wrapper.append(editor);
      editor.addEventListener("input", event => {
        if (!event.isComposing) updateText(["insertText", "insertFromPaste", "insertFromDrop", "insertReplacementText"].includes(event.inputType));
      });
      editor.addEventListener("compositionstart", () => { composing = true; });
      editor.addEventListener("compositionend", () => { composing = false; updateText(false); });
      editor.addEventListener("keydown", event => {
        if (composing || event.isComposing || event.keyCode === 229) return;
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          if (event.altKey && event.key === "ArrowUp") { close(); return; }
          if (!isOpen()) { open(); return; }
          if (event.altKey) return;
          const direction = event.key === "ArrowDown" ? 1 : -1;
          let index = active;
          if (index < 0) index = direction > 0 ? -1 : select.options.length;
          do { index += direction; } while (index >= 0 && index < select.options.length && !enabled(index));
          if (enabled(index)) { highlight(index); editor.value = optionText(index); select.dataset.customValue = editor.value; dirty = true; }
        } else if (event.key === "Enter") {
          event.preventDefault();
          // Stop an enclosing dialog from treating this as its default action.
          event.stopPropagation();
          if (isOpen() && enabled(active)) choose(active); else submitText();
          close();
        } else if (event.key === "Escape") { close(); }
        else if (event.key === "Tab") { submitText(); close(); }
      });
      retainedEditor = editor;
    }
    function configureEditing() {
      const desired = select.dataset.editable === "true";
      if (desired === Boolean(editor)) return;
      const focused = wrapper.contains(document.activeElement);
      changingMode = true;
      try {
        close(); composing = false; dirty = false; search = ""; clearTimeout(searchTimer);
        if (desired) {
          if (retainedEditor) { editor = retainedEditor; wrapper.append(editor); } else createEditor();
          wrapper.classList.add("combo-box--editable");
          for (const name of ["aria-label","aria-labelledby","aria-describedby"]) {
            const value = select.getAttribute(name) ?? (name === "aria-label" ? originalButtonName : name === "aria-labelledby" ? originalLabelledBy : button.getAttribute(name));
            if (value === null) editor.removeAttribute(name); else editor.setAttribute(name,value);
          }
          if (!editor.hasAttribute("aria-label") && !editor.hasAttribute("aria-labelledby")) editor.setAttribute("aria-label","Editable ComboBox");
          const caption = editor.getAttribute("aria-label") || (editor.getAttribute("aria-labelledby") || "").split(/\s+/).map(id=>document.getElementById(id)?.textContent || "").join(" ").trim() || labels[0]?.querySelector(".field__label")?.textContent.trim() || "options";
          button.removeAttribute("aria-labelledby"); button.setAttribute("aria-label","Open " + caption);
          if (pendingText) { pendingText = false; writeText(currentText); }
          else { currentText = select.selectedOptions[0]?.textContent ?? ""; editor.value = currentText; }
          editor.disabled = select.disabled;
        } else {
          const removed = editor; editor = undefined; removed.remove(); removed.value = "";
          delete select.dataset.customValue; currentText = ""; pendingText = false;
          wrapper.classList.remove("combo-box--editable");
          if (originalButtonName === null) button.removeAttribute("aria-label"); else button.setAttribute("aria-label",originalButtonName);
          if (originalLabelledBy === null) button.removeAttribute("aria-labelledby"); else button.setAttribute("aria-labelledby",originalLabelledBy);
        }
        if (focused) (editor || button).focus({preventScroll:true});
      } finally { changingMode = false; }
    }
    function writeText(value) {
      if (value !== null && typeof value !== "string") throw new TypeError("ComboBox text must be a string or null");
      currentText = value ?? ""; pendingText = !editor;
      if (editor) { editor.value = currentText; select.dataset.customValue = currentText; select.selectedIndex = -1; dirty = true; active = findMatch(currentText,true); }
    }
    function heightLimit() {
      const raw = select.getAttribute("data-max-drop-down-height");
      if (raw === null) return Infinity;
      const value = Number(raw);
      if (!raw.trim() || !Number.isFinite(value) || value < 0) throw new RangeError("MaxDropDownHeight must be a finite nonnegative number");
      return value;
    }
    function configure(force = false) {
      const signature = JSON.stringify(["data-editable","data-text-search-enabled","data-placeholder","data-text","data-max-drop-down-height","disabled"].map(name=>select.getAttribute(name)));
      if (!force && signature === configuration) return;
      configureEditing();
      const value = select.getAttribute("data-text");
      if (value !== textParameter) { const hadText = textParameter !== undefined && textParameter !== null; textParameter = value; if (value !== null || hadText) writeText(value); }
      const limit = heightLimit();
      if (limit === Infinity) list.style.removeProperty("--popup-max-height"); else list.style.setProperty("--popup-max-height",limit + "px");
      refresh(); if (isOpen()) popup.position();
      configuration = signature;
      if (select.hasAttribute("data-header") || select.hasAttribute("data-description")) initializeFieldHeader(select);
    }
    function refresh() {
      button.disabled = select.disabled;
      if (editor) {
        editor.disabled = select.disabled;
        editor.placeholder = select.dataset.placeholder || "";
        editor.setAttribute("aria-expanded", String(isOpen()));
        editor.setAttribute("aria-autocomplete", searchEnabled() ? "both" : "none");
        if (document.activeElement !== editor) editor.value = select.dataset.customValue ?? select.selectedOptions[0]?.textContent ?? "";
      }
      wrapper.toggleAttribute("data-control-disabled", select.disabled);
      wrapper.setAttribute("aria-disabled", String(select.disabled));
      selectionLabel.textContent = select.selectedOptions[0]?.textContent || select.dataset.placeholder || "";
      list.replaceChildren();
      Array.from(select.options).forEach((option, index) => {
        const item = document.createElement("div");
        item.className = "combo-box__option";
        item.id = list.id + "-" + index;
        item.setAttribute("role", "option");
        item.setAttribute("aria-selected", String(index === select.selectedIndex));
        item.setAttribute("aria-disabled", String(!enabled(index)));
        item.textContent = option.textContent;
        item.addEventListener("pointermove", () => { if (enabled(index)) highlight(index); });
        item.addEventListener("pointerdown", event => event.preventDefault());
        item.addEventListener("click", () => { if (enabled(index)) { choose(index); close(); button.focus(); } });
        list.append(item);
      });
      if (select.disabled) close();
      else if (isOpen()) highlight(enabled(active) ? active : -1);
    }
    function highlight(index) {
      active = index;
      Array.from(list.children).forEach((item, itemIndex) => item.classList.toggle("is-highlighted", itemIndex === index));
      for (const target of [button, editor].filter(Boolean)) {
        if (isOpen() && list.children[index]) target.setAttribute("aria-activedescendant", list.children[index].id);
        else target.removeAttribute("aria-activedescendant");
      }
      if (isOpen() && list.children[index]) list.children[index].scrollIntoView({ block: "nearest" });
    }
    function choose(index) {
      if (!enabled(index)) return;
      const changed = select.selectedIndex !== index || select.dataset.customValue !== undefined;
      dirty = false;
      delete select.dataset.customValue;
      select.selectedIndex = index;
      if (editor) { editor.value = optionText(index); currentText = editor.value; }
      refresh();
      highlight(index);
      if (changed) notify();
    }
    function open() {
      if (select.disabled) return;
      refresh();
      popup.show();
      editor?.setAttribute("aria-expanded", String(isOpen()));
      const match = editor && searchEnabled() ? findMatch(editor.value) : -1;
      highlight(editor && dirty ? match : match >= 0 ? match : enabled(select.selectedIndex) ? select.selectedIndex : Array.from(select.options).findIndex((_, index) => enabled(index)));
    }
    function close() {
      popup.close(false);
      editor?.setAttribute("aria-expanded", "false");
      editor?.removeAttribute("aria-activedescendant");
      button.removeAttribute("aria-activedescendant");
    }
    button.addEventListener("click", () => { if (isOpen()) close(); else open(); });
    button.addEventListener("keydown", event => {
      let destination = active;
      if (event.key === "Escape") { if (isOpen()) { event.preventDefault(); close(); } return; }
      if (event.key === "Tab") { submitText(); close(); return; }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (isOpen()) { choose(active); close(); } else open();
        return;
      }
      if (event.altKey && event.key === "ArrowDown") { event.preventDefault(); open(); return; }
      if (event.altKey && event.key === "ArrowUp") { event.preventDefault(); close(); return; }
      if (event.key === "Home") destination = 0;
      else if (event.key === "End") destination = select.options.length - 1;
      else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        const direction = event.key === "ArrowDown" ? 1 : -1;
        destination = isOpen() ? active : select.selectedIndex;
        do { destination += direction; } while (destination >= 0 && destination < select.options.length && !enabled(destination));
      } else if (searchEnabled() && event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
        search += event.key.toLocaleLowerCase();
        window.clearTimeout(searchTimer);
        searchTimer = window.setTimeout(() => { search = ""; }, 700);
        destination = findMatch(search);
      } else return;
      event.preventDefault();
      if (event.key === "Home") while (destination < select.options.length && !enabled(destination)) destination++;
      if (event.key === "End") while (destination >= 0 && !enabled(destination)) destination--;
      if (enabled(destination)) { if (isOpen()) highlight(destination); else choose(destination); }
    });
    document.addEventListener("pointerdown", event => { if (!wrapper.contains(event.target)) { submitText(); close(); } });
    wrapper.addEventListener("focusout", event => {
      if (!changingMode && !wrapper.contains(event.relatedTarget)) { submitText(); close(); }
    });
    const synchronize=() => {
      if (notifying) return;
      dirty = false;
      if (select.selectedIndex >= 0) delete select.dataset.customValue;
      if (editor) editor.value = select.dataset.customValue ?? select.selectedOptions[0]?.textContent ?? "";
      active = select.selectedIndex;
      refresh();
    };
    select.addEventListener("change",synchronize);
    select.form?.addEventListener("reset", () => window.setTimeout(() => {
      dirty = false; delete select.dataset.customValue; active = select.selectedIndex;
      if (editor) editor.value = select.selectedOptions[0]?.textContent ?? "";
      refresh(); close();
    }, 0));
    new MutationObserver(records=>{configure(true);if(records.some(record=>record.attributeName==="data-drop-down-open"))select.hasAttribute("data-drop-down-open")?api.open():close();}).observe(select, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["disabled", "selected", "label", "data-text-search-enabled", "data-placeholder", "data-drop-down-open", "data-editable", "data-text", "data-max-drop-down-height"] });
    labels.forEach(label => label.addEventListener("click", event => {
      if (!event.composedPath().includes(wrapper)) { event.preventDefault(); (editor || button).focus(); }
    }));
    const parameter = (name,value) => {
      const host = select.closest('winui-combo-box');
      if (host) { if (value === null) host.removeAttribute(name); else host.setAttribute(name,value); }
      else { if (value === null) select.removeAttribute('data-'+name); else select.setAttribute('data-'+name,value); }
      configure();
    };
    const booleanParameter = (name,value) => { if (typeof value !== 'boolean') throw new TypeError(name+' must be Boolean'); parameter(name,String(value)); };
    const api=Object.freeze({
      get isEditable(){return Boolean(editor);},setEditable:value=>booleanParameter('editable',value),
      get isTextSearchEnabled(){return searchEnabled();},setTextSearchEnabled:value=>booleanParameter('text-search-enabled',value),
      get text(){return editor?.value ?? currentText;},setText:value=>{writeText(value);refresh();if(isOpen())highlight(active);},
      get selectionBoxItem(){return select.selectedOptions[0]?.textContent ?? (editor ? editor.value : null);},
      get maxDropDownHeight(){return heightLimit();},setMaxDropDownHeight:value=>{if(value!==null&&value!==Infinity&&(!Number.isFinite(value)||value<0))throw new RangeError('MaxDropDownHeight must be nonnegative');parameter('max-drop-down-height',value===null||value===Infinity?null:String(value));},
      get isDropDownOpen(){return isOpen();},open:()=>{if(!select.disabled){(editor||button).focus({preventScroll:true});open();}return isOpen();},close,setOpen:value=>{if(typeof value!=='boolean')throw new TypeError('Open state must be Boolean');return value?api.open():(close(),false);}});
    comboBoxes.set(select,{api,wrapper,synchronize,configure,get targets(){return[select,button,...editor?[editor]:[]];}});
    configure();
    initializeInputMetadata(select);
    if(select.hasAttribute('data-description'))initializeFieldHeader(select);
    if(select.hasAttribute('data-drop-down-open'))api.open();
  }

  const dialogs = new WeakMap();
  function initializeDialog(backdrop) {
    if(dialogs.has(backdrop))return;
    backdrop.dataset.winuiInitialized='true';
    const dialog=backdrop.querySelector('[role="dialog"]')||backdrop;
    dialog.tabIndex=-1;dialog.setAttribute('aria-modal','true');
    const controls=()=>focusables(backdrop).filter(item=>!item.closest('[data-control-disabled]'));
    const actions=()=>Array.from(backdrop.querySelectorAll('[data-close-modal]')).filter(button=>!button.hidden);
    let opener,previousInert=[],resolve,promise;
    function close(result='none'){
      if(!backdrop.classList.contains('is-active'))return;
      const event=new CustomEvent('closing',{bubbles:true,cancelable:true,detail:{result}});if(!backdrop.dispatchEvent(event))return;
      backdrop.classList.remove('is-active');backdrop.setAttribute('aria-hidden','true');
      previousInert.forEach(([element,inert])=>element.inert=inert);previousInert=[];
      if(opener?.isConnected)opener.focus({preventScroll:true});
      emit(backdrop,'closed',{result});resolve?.(result);resolve=null;promise=null;
    }
    function show(source=document.activeElement){
      if(promise)return promise;
      if(document.querySelector('[data-modal].is-active'))return Promise.reject(new Error('A ContentDialog is already open'));
      popupInstances.forEach(popup=>popup.close(false));
      opener=source;promise=new Promise(done=>resolve=done);
      for(let branch=backdrop;branch.parentElement&&branch!==document.body;branch=branch.parentElement){
        Array.from(branch.parentElement.children).filter(element=>element!==branch&&element instanceof HTMLElement&&!['STYLE','SCRIPT'].includes(element.tagName)).forEach(element=>{previousInert.push([element,element.inert]);element.inert=true;});
      }
      backdrop.classList.add('is-active');backdrop.setAttribute('aria-hidden','false');
      const sound=backdrop.dataset.systemSound||'none';
      if(['default','error','warning','question','information'].includes(sound))window.chrome?.webview?.postMessage(JSON.stringify({type:'contentDialogSound',sound}));
      const requested=backdrop.dataset.defaultButton||'legacy';
      const target=requested==='legacy'?actions().find(button=>button.hasAttribute('data-dialog-default')):requested==='none'?undefined:actions().find(button=>button.dataset.dialogAction===requested);
      if(requested!=='legacy')actions().forEach(button=>button.classList.toggle('button--primary',button===target));
      (target&&!target.disabled?target:controls()[0]||dialog).focus({preventScroll:true});emit(backdrop,'opened',{});
      return promise;
    }
    const dialogRoot=backdrop.getRootNode();
    dialogRoot.querySelectorAll('[data-open-modal]').forEach(button=>{
      const target=button.dataset.openModal?(button.dataset.openModal===backdrop.id?backdrop:scopedId(backdrop,button.dataset.openModal)):dialogRoot.querySelector('[data-modal]');
      if(target===backdrop)button.addEventListener('click',()=>show(button));
    });
    backdrop.querySelectorAll('[data-close-modal]').forEach(button=>button.addEventListener('click',()=>close(button.dataset.dialogAction==='close'?'none':button.dataset.dialogAction||'none')));
    backdrop.addEventListener('keydown',event=>{
      if(!backdrop.classList.contains('is-active'))return;
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();}
      if(event.key==='Enter'&&!event.target.closest('button,textarea,[contenteditable]')){
        const target=backdrop.dataset.defaultButton==='none'?undefined:actions().find(button=>backdrop.dataset.defaultButton?button.dataset.dialogAction===backdrop.dataset.defaultButton:button.hasAttribute('data-dialog-default'));
        if(target&&!target.disabled){event.preventDefault();target.click();}
      }
      if(event.key==='Tab'){
        const list=controls(),first=list[0],last=list.at(-1);
        if(!list.length){event.preventDefault();dialog.focus();}
        else if(!list.includes(document.activeElement)){event.preventDefault();(event.shiftKey?last:first).focus();}
        else if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      }
    });
    backdrop.setAttribute('aria-hidden','true');dialogs.set(backdrop,{show,hide:close});
  }

  const menuControllers = new WeakMap();
  const preparedMenuItems=new WeakSet();
  const scopedId=(node,id)=>id&&(node.getRootNode().querySelector?.('#'+CSS.escape(id))||node.ownerDocument.getElementById(id));
  function initializeMenu(menu) {
    if (menuControllers.has(menu)) {menuControllers.get(menu).refresh();return;}
    const owner = scopedId(menu,menu.dataset.submenuFor);
    const anchor = menu.closest('.menu-anchor');
    const contextTarget=scopedId(menu,menu.dataset.contextTarget);
    const trigger = owner || anchor?.querySelector('[data-toggle-menu]') || contextTarget;
    if (!trigger) return;
    menu.dataset.winuiInitialized = 'true';
    if (!menu.id) menu.id = nextId();
    menu.setAttribute('role','menu');
    trigger.setAttribute('aria-controls',menu.id);trigger.setAttribute('aria-haspopup','menu');trigger.setAttribute('aria-expanded','false');
    const appBarAnchor=trigger.matches('.appbar-button');
    menu.toggleAttribute('data-appbar-anchor',appBarAnchor);
    const popup=createPopup(menu,trigger,{anchor:trigger.closest('.split-button')||trigger,placement:owner?'side':undefined,getRect:appBarAnchor?()=>{
      // The compact face excludes layout-only space below the native hit area.
      // Measure the canonical backplate instead of repeating its CSS margins.
      const rect=trigger.getBoundingClientRect(),face=getComputedStyle(trigger,'::before');
      const inset=name=>Math.max(0,parseFloat(face[name])||0);
      const left=rect.left+inset('left'),top=rect.top+inset('top'),right=rect.right-inset('right'),bottom=rect.bottom-inset('bottom');
      return {left,top,right,bottom,width:Math.max(0,right-left),height:Math.max(0,bottom-top)};
    }:undefined});
    const items=()=>Array.from(menu.querySelectorAll('.flyout-menu__item')).filter(item=>item.closest('[data-menu]')===menu&&!disabledItem(item));
    const parent=()=>owner?.closest('[data-menu]');
    const root=()=>{let current=menu;while(current.dataset.submenuFor){current=scopedId(current,current.dataset.submenuFor).closest('[data-menu]');}return current;};
    let timer,search={};
    function close(restore=false){clearTimeout(timer);popup.close(restore);}
    function open(last=false,point){popup.show(point);(last?items().at(-1):items()[0])?.focus({preventScroll:true});}
    function child(item){return item&&scopedId(item,item.dataset.submenu);}
    function expand(item,focus=true){const panel=child(item);if(!panel)return;initializeMenu(panel);const controller=menuControllers.get(panel);if(focus)controller.open();else controller.popup.show();}
    function invoke(item){
      if(disabledItem(item))return;
      if(child(item)&&!item.hasAttribute('data-split-command')){expand(item);return;}
      if(item.hasAttribute('data-menu-toggle'))item.setAttribute('aria-checked',String(item.getAttribute('aria-checked')!=='true'));
      if(item.dataset.menuRadio){root().querySelectorAll('[data-menu-radio]').forEach(peer=>{if(peer.dataset.menuRadio===item.dataset.menuRadio)peer.setAttribute('aria-checked',String(peer===item));});}
      root().querySelectorAll('[data-menu-toggle],[data-menu-radio]').forEach(button=>{const host=button.closest('winui-toggle-menu-item,winui-radio-menu-item');if(host)host.toggleAttribute('checked',button.getAttribute('aria-checked')==='true');});
      emit(menu,'itemInvoked',{item,value:item.dataset.value||item.textContent.trim(),checked:item.getAttribute('aria-checked')==='true'});
      menuControllers.get(root()).close(true);
    }
    function refresh(){menu.querySelectorAll('.flyout-menu__item').forEach(item=>{
      if(item.closest('[data-menu]')!==menu)return;
      item.tabIndex=-1;item.setAttribute('role',item.hasAttribute('data-menu-toggle')?'menuitemcheckbox':item.dataset.menuRadio?'menuitemradio':'menuitem');
      if((item.hasAttribute('data-menu-toggle')||item.dataset.menuRadio)&&!item.hasAttribute('aria-checked'))item.setAttribute('aria-checked','false');
      if(item.dataset.submenu){if(!item.id)item.id=nextId();const panel=child(item);if(panel)panel.dataset.submenuFor=item.id;item.setAttribute('aria-haspopup','menu');if(!item.hasAttribute('aria-expanded'))item.setAttribute('aria-expanded','false');}
      if(preparedMenuItems.has(item))return;preparedMenuItems.add(item);
      item.addEventListener('pointerenter',()=>{clearTimeout(timer);timer=setTimeout(()=>{if(!popup.isOpen())return;if(child(item))expand(item,false);else menu.querySelectorAll('[data-menu]').forEach(panel=>menuControllers.get(panel)?.close());},parseFloat(getComputedStyle(menu).getPropertyValue('--menu-show-delay')));});
      item.addEventListener('pointerleave',()=>clearTimeout(timer));
    });menu.querySelectorAll('[data-menu]').forEach(initializeMenu);}
    refresh();
    menu.addEventListener('keydown',event=>{
      if(event.target.closest('[data-menu]')!==menu)return;
      const list=items(),item=list.find(item=>item===event.target),index=list.indexOf(item),rtl=getComputedStyle(menu).direction==='rtl';let next;
      if(event.key==='ArrowDown')next=list[(index+1)%list.length];else if(event.key==='ArrowUp')next=list[(index+list.length-1)%list.length];
      else if(event.key==='Home')next=list[0];else if(event.key==='End')next=list.at(-1);
      else if(event.key===(rtl?'ArrowLeft':'ArrowRight')&&child(item)){event.preventDefault();event.stopPropagation();expand(item);return;}
      else if(event.key===(rtl?'ArrowRight':'ArrowLeft')&&parent()){event.preventDefault();event.stopPropagation();close(true);return;}
      else next=typeAhead(list,item,event.key,search);
      if(next){event.preventDefault();event.stopPropagation();next.focus({preventScroll:true});}
    });
    menu.addEventListener('click',event=>{const item=event.target.closest('.flyout-menu__item');if(!item||item.closest('[data-menu]')!==menu)return;invoke(item);});
    menu.addEventListener('click',event=>{const button=event.target.closest('[data-menu-expander]');if(button&&button.closest('[data-menu]')===menu){event.stopPropagation();expand(scopedId(button,button.dataset.menuExpander));}});
    if(!owner){
      if(!contextTarget)trigger.addEventListener('click',()=>popup.isOpen()?close(true):open());
      if(!contextTarget)trigger.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();open(event.key==='ArrowUp');}});
      else contextTarget.addEventListener('keydown',event=>{if(event.key==='ContextMenu'||event.shiftKey&&event.key==='F10'){event.preventDefault();emit(menu,'contextRequested',{target:event.target});const target=event.target.closest('[data-list-item]')||contextTarget;open(false,target.getBoundingClientRect());}});
      if(contextTarget)contextTarget.addEventListener('contextmenu',event=>{event.preventDefault();emit(menu,'contextRequested',{target:event.target});open(false,{left:event.clientX,top:event.clientY,right:event.clientX+1,bottom:event.clientY+1,width:1,height:1});});
      if(trigger.dataset.contextTarget)document.getElementById(trigger.dataset.contextTarget)?.addEventListener('contextmenu',event=>{event.preventDefault();open(false,{left:event.clientX,top:event.clientY,right:event.clientX+1,bottom:event.clientY+1,width:1,height:1});});
    }
    menuControllers.set(menu,{open,close,popup,refresh});
    menu.querySelectorAll('[data-menu]').forEach(initializeMenu);
  }

  const popupInstances = new Set();
  const suggestions = new WeakMap();
  const numbers = new WeakMap();
  const navigations = new WeakMap();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  window.chrome?.webview?.addEventListener('message',event=>{
    let value=event.data;if(typeof value==='string'){try{value=JSON.parse(value);}catch{return;}}
    if(value?.type==='winUISettings'&&value.schemaVersion===1&&Number.isInteger(value.menuShowDelay)&&value.menuShowDelay>=0&&value.menuShowDelay<=2147483647)document.documentElement.style.setProperty('--menu-show-delay',value.menuShowDelay+'ms');
  });
  const focusables = element => Array.from(element.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')).filter(e => e.getClientRects().length);

  function createPopup(panel, trigger, options = {}) {
    const lifetime=new AbortController();let disposed=false;
    const placementAnchor = options.anchor || trigger;
    panel.classList.add('winui-popup');
    panel.setAttribute('popover', 'manual');
    if (!panel.id) panel.id = nextId();
    if (options.expanded !== false) {
      trigger.setAttribute('aria-controls', panel.id);
      trigger.setAttribute('aria-expanded', 'false');
    }
    let open = false, pointAnchor;
    function position() {
      if (!open) return;
      const rect = pointAnchor || options.getRect?.() || placementAnchor.getBoundingClientRect();
      if (!trigger.isConnected || !placementAnchor.isConnected || !rect.width || !rect.height) { close(false); return; }
      let visible = { left: Math.max(0, rect.left), top: Math.max(0, rect.top), right: Math.min(window.innerWidth, rect.right), bottom: Math.min(window.innerHeight, rect.bottom) };
      for (let ancestor = options.viewportAnchor ? null : placementAnchor.parentElement; ancestor; ancestor = ancestor.parentElement) {
        if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(ancestor).overflow)) {
          const clip = ancestor.getBoundingClientRect();
          visible = { left: Math.max(visible.left, clip.left), top: Math.max(visible.top, clip.top), right: Math.min(visible.right, clip.right), bottom: Math.min(visible.bottom, clip.bottom) };
        }
        if (ancestor.matches(':popover-open')) break;
      }
      if (visible.right <= visible.left || visible.bottom <= visible.top) { close(false); return; }
      const inset = parseFloat(getComputedStyle(panel).getPropertyValue(options.viewportAnchor ? '--teaching-placement-margin' : '--popup-viewport-inset'));
      const gap = parseFloat(getComputedStyle(panel).getPropertyValue('--popup-anchor-gap'));
      const width = Math.max(0, window.innerWidth - inset * 2);
      panel.style.setProperty('--popup-available-width', width + 'px');
      if (options.matchWidth) panel.style.setProperty('--popup-anchor-width', Math.min(rect.width, width) + 'px');
      panel.style.setProperty('--popup-available-height', Math.max(0, window.innerHeight - inset * 2) + 'px');
      const size = panel.getBoundingClientRect();
      if (options.viewportAnchor) {
        // TeachingTip.cpp PositionUntargetedPopup: Auto uses bottom-center, without an anchor gap.
        const topPlacement = options.placement === 'top';
        panel.dataset.placement = topPlacement ? 'top' : 'bottom';
        panel.style.setProperty('--popup-x', Math.max(inset, (window.innerWidth - size.width) / 2) + 'px');
        panel.style.setProperty('--popup-y', Math.max(inset, topPlacement ? inset : window.innerHeight - inset - size.height) + 'px');
        return;
      }
      if(options.highlightAnchor){
        panel.style.setProperty('--popup-available-height',Math.max(0,innerHeight-inset*2)+'px');
        const band=options.highlightAnchor.getBoundingClientRect(),box=panel.getBoundingClientRect();
        panel.style.setProperty('--popup-x',Math.max(inset,Math.min(rect.left+(rect.width-box.width)/2,innerWidth-box.width-inset))+'px');
        panel.style.setProperty('--popup-y',Math.max(inset,Math.min(rect.top+rect.height/2-(band.top-box.top+band.height/2),innerHeight-box.height-inset))+'px');
        panel.dataset.placement='overlay';return;
      }
      const below = window.innerHeight - rect.bottom - gap - inset;
      const above = rect.top - gap - inset;
      const topPlacement = options.placement==='top' ? above>=size.height || above>below : below < size.height && above > below;
      panel.dataset.placement = topPlacement ? 'top' : 'bottom';
      const available = Math.max(0, topPlacement ? above : below);
      panel.style.setProperty('--popup-available-height', available + 'px');
      const height = Math.min(size.height, available);
      let left = Math.max(inset, Math.min(options.alignEnd ? (getComputedStyle(trigger).direction === 'rtl' ? rect.left : rect.right - size.width) : options.alignCenter ? rect.left + (rect.width - size.width) / 2 : rect.left, window.innerWidth - size.width - inset));
      let top = Math.max(inset, topPlacement ? rect.top - gap - height : rect.bottom + gap);
      if(['side','right','left'].includes(options.placement)){
        panel.style.setProperty('--popup-available-height',Math.max(0,window.innerHeight-inset*2)+'px');
        const rtl=getComputedStyle(trigger).direction==='rtl',right=rect.right,leftSide=rect.left-size.width;
        const fitsRight=rect.right+size.width<=window.innerWidth-inset,fitsLeft=leftSide>=inset;
        const preferLeft=options.placement==='left'||options.placement==='side'&&rtl;const onLeft=preferLeft?fitsLeft:!fitsRight&&fitsLeft;
        left=Math.max(inset,Math.min(onLeft?leftSide:right,window.innerWidth-size.width-inset));
        const targetTop=options.placement==='side'?rect.top:rect.top+(rect.height-panel.getBoundingClientRect().height)/2;top=Math.max(inset,Math.min(targetTop,window.innerHeight-panel.getBoundingClientRect().height-inset));panel.dataset.placement=onLeft?'left':'right';
      }
      top=Math.max(inset,Math.min(top+(options.offsetY||0),window.innerHeight-Math.min(panel.getBoundingClientRect().height,window.innerHeight-inset*2)-inset));
      left=Math.max(inset,Math.min(left+(options.offsetX||0),window.innerWidth-size.width-inset));
      panel.style.setProperty('--popup-x', left + 'px');
      panel.style.setProperty('--popup-y', top + 'px');
      panel.style.setProperty('--popup-tail-x', Math.max(inset, Math.min(rect.left + rect.width / 2 - left, size.width - inset)) + 'px');
    }
    function close(restore = false) {
      if (!open) return;
      open = false;
      panel.getAnimations().forEach(animation=>animation.cancel());
      popupInstances.forEach(child=>{if(child.panel!==panel&&(panel.contains(child.panel)||panel.contains(child.trigger)))child.close(false);});
      if (panel.matches(':popover-open')) panel.hidePopover();
      panel.classList.remove('is-active');
      panel.setAttribute('aria-hidden', 'true');
      if (options.expanded !== false) trigger.setAttribute('aria-expanded', 'false');
      options.onClose?.();
      if (restore && trigger.isConnected && !trigger.disabled) trigger.focus({ preventScroll: true });
    }
    function show(anchor) {
      if(disposed)return;
      pointAnchor = anchor;
      const modal=document.querySelector('[data-modal].is-active');
      if (trigger.disabled || trigger.closest('[inert],[data-control-disabled]') || modal&&!modal.contains(trigger)) return;
      popupInstances.forEach(p => { if (p!==api&&(p.panel===panel||!p.panel.contains(panel)&&!p.panel.contains(trigger))) p.close(false); });
      open = true;
      panel.classList.add('is-active');
      panel.setAttribute('aria-hidden', 'false');
      if (options.expanded !== false) trigger.setAttribute('aria-expanded', 'true');
      if (panel.showPopover && !panel.matches(':popover-open')) panel.showPopover();
      position();
      if(!reducedMotion.matches&&!panel.classList.contains('tool-tip')){
        const metrics=getComputedStyle(panel),distance=parseFloat(metrics.getPropertyValue('--popup-slide-distance')),duration=parseFloat(metrics.getPropertyValue('--motion-normal'));
        const placement=panel.dataset.placement,offset=placement==='top'?distance:-distance;
        panel.animate([{opacity:0,translate:placement==='left'?-distance+'px 0':placement==='right'?distance+'px 0':'0 '+offset+'px'},{opacity:1,translate:'0 0'}],{duration,easing:metrics.getPropertyValue('--popup-open-easing').trim()});
      }
      if (options.focus) (focusables(panel)[0] || panel).focus({ preventScroll: true });
      options.onOpen?.();
    }
    panel.setAttribute('aria-hidden', 'true');
    reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)panel.getAnimations().forEach(animation=>animation.cancel());},{signal:lifetime.signal});
    const api = { panel, trigger, show, close, position, configure:values=>{Object.assign(options,values);position();}, isOpen: () => open, dispose:()=>{close(false);disposed=true;lifetime.abort();popupInstances.delete(api);} };
    popupInstances.add(api);
    function ownsTarget(target,visited=new Set()) {
      if(panel.contains(target)||trigger.contains(target))return true;
      visited.add(api);
      return Array.from(popupInstances).some(child=>!visited.has(child)&&child.isOpen()&&panel.contains(child.trigger)&&child.ownsTarget(target,visited));
    }
    api.ownsTarget=ownsTarget;
    document.addEventListener('pointerdown', e => {
      if (open && options.lightDismiss !== false && !ownsTarget(e.target)) close(false);
    }, {capture:true,signal:lifetime.signal});
    document.addEventListener('keydown', e => {
      if (!open) return;
      if (e.key === 'Escape') { if(Array.from(popupInstances).some(child=>child!==api&&child.isOpen()&&(panel.contains(child.panel)||panel.contains(child.trigger))))return; e.preventDefault(); e.stopImmediatePropagation(); close(true); }
      else if (e.key === 'Tab' && options.dismissOnTab !== false) close(panel.contains(document.activeElement));
    }, {capture:true,signal:lifetime.signal});
    document.addEventListener('focusin', e => {
      if (open && options.lightDismiss !== false && !ownsTarget(e.target)) close(false);
    },{signal:lifetime.signal});
    return api;
  }
  window.addEventListener('resize', () => popupInstances.forEach(p => p.position()));
  document.addEventListener('scroll', () => popupInstances.forEach(p => p.position()), true);
  document.addEventListener('visibilitychange', () => { if (document.hidden) popupInstances.forEach(p => p.close(false)); });
  document.addEventListener('click', e => { if (e.target.closest('[data-open-modal]')) popupInstances.forEach(p => p.close(false)); }, true);

  function initializeToggleButton(button) {
    if (button.dataset.winuiInitialized) return;
    button.dataset.winuiInitialized = 'true';
    if (!button.hasAttribute('aria-pressed')) button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => {
      if (button.disabled) return;
      const checked = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(checked));
      button.dispatchEvent(new CustomEvent('checkedChanged', { bubbles: true, detail: { checked } }));
    });
  }

  function initializeThemeToggle(button) {
    if(button.dataset.themeToggleInitialized)return;button.dataset.themeToggleInitialized='true';
    initializeToggleButton(button);
    const update=()=>{const light=document.documentElement.dataset.theme==='light';button.setAttribute('aria-pressed',String(light));button.setAttribute('aria-label',light?'Switch to dark theme':'Switch to light theme');};
    button.addEventListener('checkedChanged',event=>window.WinUITheme?.setPreference(event.detail.checked?'light':'dark'));
    new MutationObserver(update).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});update();
  }

  const tooltips = new WeakMap();
  function initializeTooltip(trigger) {
    const existing = tooltips.get(trigger);
    if (existing) { existing.panel.textContent = trigger.dataset.tooltip || '';existing.popup.configure({placement:trigger.dataset.tooltipPlacement||'top',offsetX:Number(trigger.dataset.tooltipOffsetX)||0,offsetY:Number(trigger.dataset.tooltipOffsetY)||0}); if (!trigger.dataset.tooltip) existing.popup.close(false); return; }
    if (!trigger.dataset.tooltip) return;
    trigger.dataset.winuiTooltipInitialized = 'true';
    const panel = document.createElement('div');
    panel.className = 'tool-tip'; panel.setAttribute('role', 'tooltip');
    panel.textContent = trigger.dataset.tooltip;
    trigger.after(panel);
    let pointerPoint, keyboardInput=false;
    const number=name=>{const value=Number(trigger.dataset[name]||0);return Number.isFinite(value)?Math.max(-10000,Math.min(10000,value)):0;};
    const popup = createPopup(panel, trigger, { expanded: false, dismissOnTab: true, alignCenter:true, placement:trigger.dataset.tooltipPlacement||'top',offsetX:number('tooltipOffsetX'),offsetY:number('tooltipOffsetY'),getRect:()=>{
      const rect=trigger.getBoundingClientRect(),values=(trigger.dataset.tooltipRect||'').split(',').map(Number);
      if(!keyboardInput&&pointerPoint){
        let {x,y}=pointerPoint;
        if(values.length===4&&values.every(Number.isFinite)&&values[2]>0&&values[3]>0){
          const left=rect.left+values[0],top=rect.top+values[1];
          if(x>=left&&x<=left+values[2]&&y>=top&&y<=top+values[3]){
            const side=trigger.dataset.tooltipPlacement||'top';if(side==='left')x=left;else if(side==='right')x=left+values[2];else y=side==='bottom'?top+values[3]:top;
          }
        }
        // Popup visibility requires a nonzero rect; center the 1px box on the pointer.
        return {left:x-0.5,top:y-0.5,right:x+0.5,bottom:y+0.5,width:1,height:1};
      }
      if(values.length!==4||values.some(value=>!Number.isFinite(value))||values[2]<=0||values[3]<=0)return rect;
      return {left:rect.left+values[0],top:rect.top+values[1],right:rect.left+values[0]+values[2],bottom:rect.top+values[1]+values[3],width:values[2],height:values[3]};
    }});
    trigger.setAttribute('aria-describedby', [trigger.getAttribute('aria-describedby'), panel.id].filter(Boolean).join(' '));
    tooltips.set(trigger, { panel, popup });
    new MutationObserver(()=>initializeTooltip(trigger)).observe(trigger,{attributes:true,attributeFilter:['data-tooltip','data-tooltip-placement','data-tooltip-offset-x','data-tooltip-offset-y','data-tooltip-rect']});
    let timer;
    const hide = () => { clearTimeout(timer); popup.close(false); };
    const schedule = keyboard => { clearTimeout(timer); keyboardInput=!!keyboard;panel.dataset.tooltipInput=keyboard?'keyboard':'pointer'; const key = keyboard ? '--tooltip-focus-delay' : '--tooltip-initial-delay'; timer = setTimeout(() => {if(trigger.dataset.tooltip)popup.show();}, parseFloat(getComputedStyle(panel).getPropertyValue(key))); };
    trigger.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') {pointerPoint={x:e.clientX,y:e.clientY};schedule();} });
    trigger.addEventListener('pointermove',e=>{if(!popup.isOpen())pointerPoint={x:e.clientX,y:e.clientY};});
    trigger.addEventListener('pointerleave', () => { if (!popup.isOpen()) hide(); });
    trigger.addEventListener('focus', () => schedule(true));
    trigger.addEventListener('blur', hide);
    trigger.addEventListener('pointerdown', hide);
    panel.addEventListener('pointerenter', () => clearTimeout(timer));
    document.addEventListener('pointermove', e => {
      if (!popup.isOpen()) return;
      const a = trigger.getBoundingClientRect(), b = panel.getBoundingClientRect();
      if (e.clientX < Math.min(a.left, b.left) || e.clientX > Math.max(a.right, b.right) || e.clientY < Math.min(a.top, b.top) || e.clientY > Math.max(a.bottom, b.bottom)) hide();
    });
    trigger.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
  }

  const flyoutBindings=new WeakMap();
  function bindFlyout(panel,trigger) {
    const previous=flyoutBindings.get(trigger);if(previous?.panel===panel)return previous;
    if(previous){const restore=previous.panel.contains(document.activeElement);previous.dispose();if(restore&&!trigger.disabled)trigger.focus({preventScroll:true});}
    if(!panel){flyoutBindings.delete(trigger);trigger.removeAttribute('aria-haspopup');trigger.removeAttribute('aria-controls');trigger.removeAttribute('aria-expanded');return null;}
    const lifetime=new AbortController();
    panel.dataset.winuiInitialized = 'true';
    const teaching = panel.classList.contains('teaching-tip');
    panel.setAttribute('role', 'dialog'); panel.tabIndex = -1;
    trigger.setAttribute('aria-haspopup', 'dialog');
    const untargeted = teaching && panel.dataset.targeted === 'false';
    const popup = createPopup(panel, trigger, { placement:panel.dataset.placement||undefined,viewportAnchor:untargeted,getRect:untargeted?()=>({left:0,top:0,right:innerWidth,bottom:innerHeight,width:innerWidth,height:innerHeight}):undefined,focus: true, lightDismiss: !teaching || panel.dataset.lightDismiss === 'true', dismissOnTab: !teaching });
    trigger.addEventListener('click', () => { if (popup.isOpen()) popup.close(true); else popup.show(); },{signal:lifetime.signal});
    panel.addEventListener('click',event=>{if(event.target.closest('[data-close-popup]')&&event.target.closest('[data-popup],.flyout,.teaching-tip')===panel)popup.close(true);},{signal:lifetime.signal});
    const binding={panel,popup,dispose:()=>{lifetime.abort();popup.dispose();}};flyoutBindings.set(trigger,binding);return binding;
  }
  function initializeFlyout(panel) {
    document.querySelectorAll('[data-open-popup]').forEach(trigger=>{if(trigger.dataset.openPopup===panel.id)bindFlyout(panel,trigger);});
  }

  function initializeAutoSuggest(host) {
    if (host.dataset.winuiInitialized) return;
    host.dataset.winuiInitialized = 'true';
    const input = host.querySelector('input');
    const list = host.querySelector('[role="listbox"]');
    const status = host.querySelector('[role="status"]');
    const queryButton = host.querySelector('[data-query]');
    let request = 0, active = -1, items = [], provider, controller, composing = false, restoringFocus = false;
    const defaultItems = JSON.parse(host.dataset.items || '[]');
    input.setAttribute('role', 'combobox'); input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-haspopup', 'listbox');
    const popup = createPopup(list, input, { matchWidth: true, onClose: () => { request++; controller?.abort(); active = -1; input.removeAttribute('aria-activedescendant'); } });
    provider = query => defaultItems.filter(item => String(item).toLocaleLowerCase().includes(query.toLocaleLowerCase()));
    function highlight(index) {
      active = index;
      Array.from(list.children).forEach((e, i) => e.setAttribute('aria-selected', String(i === index)));
      if (active >= 0 && list.children[active]) {
        input.setAttribute('aria-activedescendant', list.children[active].id);
        list.children[active].scrollIntoView({ block: 'nearest' });
      } else input.removeAttribute('aria-activedescendant');
    }
    function submit() {
      const suggestion = items[active];
      if (active >= 0) {
        input.value = String(suggestion);
        host.dispatchEvent(new CustomEvent('suggestionChosen', { bubbles: true, detail: { selectedItem: suggestion } }));
      }
      request++; controller?.abort(); popup.close(false);
      host.dispatchEvent(new CustomEvent('querySubmitted', { bubbles: true, detail: { queryText: input.value, chosenSuggestion: suggestion ?? null } }));
    }
    async function refresh(force=false) {
      controller?.abort(); popup.close(false); items = []; list.replaceChildren(); controller = new AbortController();
      const token = ++request, query = input.value;
      if (!query && !force || input.disabled || composing) { items = []; popup.close(false); status.textContent = ''; return; }
      try {
        const result = await provider(query, { signal: controller.signal });
        if (token !== request || controller.signal.aborted || input.disabled || document.activeElement !== input) return;
        items = Array.isArray(result) ? result.slice(0, 100) : [];
        list.replaceChildren(); active = -1;
        items.forEach((item, i) => {
          const option = document.createElement('div'); option.className = 'suggestion-item';
          option.id = list.id + '-' + i; option.setAttribute('role', 'option'); option.setAttribute('aria-selected', 'false');
          option.textContent = String(item);
          option.addEventListener('pointerdown', e => e.preventDefault());
          option.addEventListener('pointermove', () => highlight(i));
          option.addEventListener('click', () => { highlight(i); submit(); input.focus({ preventScroll: true }); });
          list.append(option);
        });
        status.textContent = items.length ? items.length + ' suggestions available.' : 'No suggestions.';
        if (items.length) popup.show(); else popup.close(false);
        input.removeAttribute('aria-activedescendant');
      } catch (error) {
        if (token !== request || error.name === 'AbortError') return;
        items = []; popup.close(false); status.textContent = 'Suggestions could not be loaded.';
      }
    }
    input.addEventListener('input', () => { if (!composing) refresh(); });
    input.addEventListener('compositionstart', () => { composing = true; request++; controller?.abort(); popup.close(false); });
    input.addEventListener('compositionend', () => { composing = false; refresh(); });
    input.addEventListener('focus', () => { if (!restoringFocus) refresh(); });
    input.addEventListener('blur', () => { request++; controller?.abort(); });
    input.addEventListener('keydown', e => {
      if (e.isComposing || composing) return;
      if (e.key === 'Escape') { request++; controller?.abort(); items = []; popup.close(false); input.removeAttribute('aria-activedescendant'); }
      else if (e.key === 'Enter') { e.preventDefault(); submit(); }
      else if (items.length && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
        e.preventDefault(); if (!popup.isOpen()) popup.show();
        if (e.key === 'ArrowDown') highlight((active + 1) % items.length);
        if (e.key === 'ArrowUp') highlight(active < 0 ? items.length - 1 : (active + items.length - 1) % items.length);
        if (e.key === 'Home') highlight(0);
        if (e.key === 'End') highlight(items.length - 1);
      }
    });
    queryButton?.addEventListener('click', () => { submit(); restoringFocus = true; input.focus({ preventScroll: true }); restoringFocus = false; });
    new MutationObserver(() => { if (queryButton) queryButton.disabled = input.disabled; if (input.disabled) { request++; controller?.abort(); popup.close(false); } }).observe(input, { attributes: true, attributeFilter: ['disabled'] });
    const close=()=>{request++;controller?.abort();items=[];active=-1;popup.close(false);input.removeAttribute('aria-activedescendant');};
    const open=async()=>{if(input.disabled||composing)return false;restoringFocus=true;input.focus({preventScroll:true});restoringFocus=false;await refresh(true);return popup.isOpen();};
    suggestions.set(host, {get isOpen(){return popup.isOpen();},open,close,setProvider: next => { if (typeof next !== 'function') throw new TypeError('Suggestion provider must be a function'); provider = next; request++; controller?.abort(); refresh(); }, refresh });
  }

  function parseExpression(text, expressions, locale) {
    const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
    const decimal = parts.find(p => p.type === 'decimal')?.value || '.';
    const group = parts.find(p => p.type === 'group')?.value;
    let normalized = text.trim();
    if (group && normalized.includes(group)) {
      // Validate each grouped numeric token against the locale's own grouping.
      const numeric = new RegExp('[0-9' + group.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + decimal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ']+', 'g');
      normalized = normalized.replace(numeric, token => {
        if (!token.includes(group)) return token;
        const integer = token.split(decimal)[0];
        const raw = integer.split(group).join('');
        const expected = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Number(raw));
        if (integer !== expected || token.split(decimal).slice(1).some(part => part.includes(group))) throw new Error('Invalid grouping');
        return token.split(group).join('');
      });
    }
    normalized = normalized.split(decimal).join('.').replaceAll('\u2212', '-');
    if (!normalized) return null;
    if (normalized.length > 256) throw new Error('Numeric input is too long');
    if (!expressions) {
      if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(normalized)) throw new Error('Invalid number');
      const value = Number(normalized); if (!Number.isFinite(value)) throw new Error('Invalid number'); return value;
    }
    const tokens = normalized.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|[()+*/^-]/g) || [];
    if (tokens.join('') !== normalized.replace(/\s/g, '')) throw new Error('Invalid expression');
    let index = 0, depth = 0;
    function primary() {
      if (++depth > 64) throw new Error('Expression is too deeply nested');
      const token = tokens[index++]; let result;
      if (token === '+' || token === '-') result = (token === '-' ? -1 : 1) * primary();
      else if (token === '(') { result = sum(); if (tokens[index++] !== ')') throw new Error('Unclosed parentheses'); }
      else { result = Number(token); if (!token || !Number.isFinite(result)) throw new Error('Expected a number'); }
      depth--; return result;
    }
    function power() { let value=primary(); if(tokens[index]==='^'){index++; value=Math.pow(value,power());} return value; }
    function product() { let value = power(); while (tokens[index] === '*' || tokens[index] === '/') { const op = tokens[index++], rhs = power(); value = op === '*' ? value * rhs : value / rhs; } return value; }
    function sum() { let value = product(); while (tokens[index] === '+' || tokens[index] === '-') { const op = tokens[index++], rhs = product(); value = op === '+' ? value + rhs : value - rhs; } return value; }
    const result = sum(); if (index !== tokens.length || !Number.isFinite(result)) throw new Error('Invalid expression'); return result;
  }

  function initializeNumberBox(host) {
    if (host.dataset.winuiInitialized) return;
    host.dataset.winuiInitialized = 'true';
    const input = host.querySelector('input'); const status = host.querySelector('[role="status"]');
    const up = host.querySelector('[data-step="1"]'), down = host.querySelector('[data-step="-1"]');
    let min,max,small,large,locale,fraction,format;
    function readConfiguration(){
    min = host.dataset.minimum === undefined ? -Infinity : Number(host.dataset.minimum);
    max = host.dataset.maximum === undefined ? Infinity : Number(host.dataset.maximum);
    small = Number(host.dataset.smallChange || 1);large = Number(host.dataset.largeChange || 10);
    locale = host.dataset.locale || document.documentElement.lang || navigator.language;
    fraction=host.dataset.fractionDigits===undefined?null:Math.max(0,Math.min(12,Number(host.dataset.fractionDigits)||0));
    format = new Intl.NumberFormat(locale, { useGrouping: false, minimumFractionDigits:fraction??0, maximumFractionDigits:fraction??12 });
    }
    readConfiguration();
    let value = null;
    input.setAttribute('role', 'spinbutton'); input.inputMode = 'decimal';
    if (Number.isFinite(min)) input.setAttribute('aria-valuemin', String(min));
    if (Number.isFinite(max)) input.setAttribute('aria-valuemax', String(max));
    function setValue(next) {
      const previous = value;
      if(next !== null && Number(host.dataset.roundingIncrement)>0)next=Math.round(next/Number(host.dataset.roundingIncrement))*Number(host.dataset.roundingIncrement);
      value = next === null ? null : host.dataset.validationMode === 'disabled' ? next : Math.max(min, Math.min(max, next));
      input.value = value === null ? '' : format.format(value);
      if (value === null) { input.removeAttribute('aria-valuenow'); input.removeAttribute('aria-valuetext'); }
      else { input.setAttribute('aria-valuenow', String(value)); input.setAttribute('aria-valuetext', input.value); }
      updateButtons();
      if (!Object.is(previous, value)) host.dispatchEvent(new CustomEvent('valueChanged', { bubbles: true, detail: { oldValue: previous, newValue: value } }));
    }
    function updateButtons() {
      const bounded = host.dataset.validationMode !== 'disabled' && host.dataset.wrap !== 'true';
      up.disabled = input.disabled || bounded && value !== null && value >= max;
      down.disabled = input.disabled || bounded && value !== null && value <= min;
    }
    function commit() {
      try { setValue(parseExpression(input.value, host.dataset.acceptsExpression === 'true', locale)); status.textContent = ''; return true; }
      catch { if(host.dataset.validationMode === 'disabled'){status.textContent = 'Invalid numeric input.';updateButtons();}else{setValue(value);status.textContent = 'Invalid numeric input was restored to the previous value.';}return false; }
    }
    function step(change) {
      if (input.disabled) return;
      commit();
      let next = (value ?? (Number.isFinite(min) ? min : 0)) + change;
      if (host.dataset.wrap === 'true' && Number.isFinite(min) && Number.isFinite(max)) { if (next > max) next = min; else if (next < min) next = max; }
      setValue(Number(next.toPrecision(15)));
    }
    let spinPopup;const buttonOrder=[...host.querySelectorAll('[data-step]')];
    function placeSpinners(){
      if(host.dataset.spinPlacement==='compact'){
        if(!spinPopup){const panel=document.createElement('div');panel.className='number-box__popup';up.before(panel);panel.append(up,down);spinPopup=createPopup(panel,input,{expanded:false});}
      }else if(spinPopup){const panel=spinPopup.panel;spinPopup.dispose();spinPopup=null;panel.before(...buttonOrder);panel.remove();}
    }
    placeSpinners();input.addEventListener('focus',()=>{if(host.dataset.spinPlacement==='compact')spinPopup?.show();});host.addEventListener('focusout',event=>{if(!host.contains(event.relatedTarget))spinPopup?.close(false);});
    input.addEventListener('blur', commit);
    input.addEventListener('keydown', e => {
      const changes = { ArrowUp: small, ArrowDown: -small, PageUp: large, PageDown: -large };
      if (e.key in changes) { e.preventDefault(); step(changes[e.key]); }
      else if (e.key === 'Enter') { e.preventDefault(); commit(); }
      else if (e.key === 'Escape') { e.preventDefault(); setValue(value); status.textContent = ''; }
    });
    for (const button of [up, down]) {
      button.tabIndex = -1;
      let delayTimer, repeatTimer, pointerClick = false;
      const stop = () => { clearTimeout(delayTimer); clearInterval(repeatTimer); };
      const advance = () => { if (button.disabled || input.disabled || !button.isConnected) stop(); else step(Number(button.dataset.step) * small); };
      button.addEventListener('pointerdown', e => {
        if (e.button !== 0 || button.disabled) return;
        e.preventDefault(); stop(); pointerClick = true; button.setPointerCapture(e.pointerId);
        input.focus({ preventScroll: true }); advance();
        const computed = getComputedStyle(host);
        delayTimer = setTimeout(() => { advance(); repeatTimer = setInterval(advance, parseFloat(computed.getPropertyValue('--number-repeat-interval'))); }, parseFloat(computed.getPropertyValue('--number-repeat-delay')));
      });
      for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(event, stop);
      window.addEventListener('blur', stop);
      document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
      button.addEventListener('click', e => {
        if (!pointerClick || e.detail === 0) advance();
        pointerClick = false; input.focus({ preventScroll: true });
      });
    }
    commit();
    new MutationObserver(updateButtons).observe(input, { attributes: true, attributeFilter: ['disabled'] });
    numbers.set(host, { configure:(validateText=false,preserveText=false)=>{readConfiguration();placeSpinners();if(input.disabled)spinPopup?.close(false);if(Number.isFinite(min))input.setAttribute('aria-valuemin',String(min));else input.removeAttribute('aria-valuemin');if(Number.isFinite(max))input.setAttribute('aria-valuemax',String(max));else input.removeAttribute('aria-valuemax');if(preserveText)updateButtons();else if(validateText){commit();updateButtons();}else setValue(value);}, get text(){return input.value;}, setText:next=>{if(typeof next!=='string')throw new TypeError('Text must be text');input.value=next;return commit();}, get value() { return value; }, setValue: next => { if (next !== null && !Number.isFinite(next)) throw new TypeError('Value must be finite or null'); setValue(next); }, commit });
  }

  function initializeSlider(host) {
    if (host.dataset.winuiInitialized) return;
    host.dataset.winuiInitialized='true';
    const input=host.querySelector('input[type="range"]');
    const output=host.querySelector('output')||(input.id&&document.querySelector('output[for="'+CSS.escape(input.id)+'"]'));
    const ticksMode=()=>host.dataset.snapsTo==='ticks';
    const interval=()=>Number(host.dataset.tickFrequency)||0;
    const reversed=()=>host.dataset.directionReversed==='true';
    function snap(value,frequency=interval()){
      const min=Number(input.min||0),max=Number(input.max||100);value=Math.max(min,Math.min(max,value));
      if(!ticksMode()||frequency<=0)return value;
      // Slider::GetClosestStep uses zero-based multiples and chooses the lower tie.
      const previous=Math.max(min,Math.floor(value/frequency)*frequency),next=Math.min(max,Math.ceil(value/frequency)*frequency);
      return next-value<value-previous?next:previous;
    }
    function stepped(value,delta,forward){
      if(delta<=0)return value;const max=Number(input.max||100);
      if(!forward&&Math.abs(value-max)<1e-10&&Math.abs(max/delta-Math.round(max/delta))>1e-10)return Math.max(Number(input.min||0),Math.floor(max/delta)*delta);
      return snap(value+(forward?delta:-delta),delta);
    }
    function refresh(){
      const snaps=host.dataset.snapsTo||'step-values';enumValue(snaps,['step-values','ticks'],'Slider snapping');
      if(ticksMode()&&input.getAttribute('step')!=='any')input.setAttribute('step','any');
      const min=Number(input.min||0),max=Number(input.max||100);if(ticksMode())input.value=String(snap(Number(input.value)));
      const value=Number(input.value);host.style.setProperty('--slider-value',String(max===min?0:(value-min)/(max-min)));
      host.classList.toggle('is-disabled',input.disabled);input.setAttribute('aria-orientation',host.dataset.orientation==='vertical'?'vertical':'horizontal');
      if(host.hasAttribute('data-thumb-tooltip-enabled'))enumValue(host.dataset.thumbTooltipEnabled,['true','false'],'Thumb ToolTip enabled');
      const placement=host.getAttribute('data-tick-placement');if(placement!==null)enumValue(placement,['none','top-left','bottom-right','outside','inline'],'TickPlacement');
      const sides=interval()<=0||placement==='none'?[]:placement==='outside'?['top-left','bottom-right']:[placement||'legacy'];
      for(const row of host.querySelectorAll('.slider__ticks'))if(!sides.includes(row.dataset.tickSide||'legacy'))row.remove();
      for(const side of sides){
        input.removeAttribute('list');let ticks=[...host.querySelectorAll('.slider__ticks')].find(row=>(row.dataset.tickSide||'legacy')===side);if(!ticks){ticks=element('span','slider__ticks');ticks.setAttribute('aria-hidden','true');host.append(ticks);}ticks.dataset.tickSide=side;ticks.replaceChildren();
        const frequency=interval(),count=Math.min(1000,Math.floor((max-min)/frequency)),vertical=host.dataset.orientation==='vertical';
        const flipped=vertical?reversed():getComputedStyle(input).direction==='rtl';
        for(let index=0;index<=count;index++){const tick=element('span','slider__tick'),position=max===min?0:index*frequency/(max-min);tick.style.setProperty('--tick-position',String((flipped?1-position:position)*100)+'%');if(side==='inline'){const length=vertical?input.clientHeight:input.clientWidth,thumb=parseFloat(getComputedStyle(input).getPropertyValue('--slider-thumb-size'));tick.hidden=Math.abs(position-(max===min?0:(value-min)/(max-min)))*Math.max(0,length-thumb)<thumb/2;}ticks.append(tick);}
      }
      refreshThumbToolTip();
      if(output)output.value=input.value;input.setAttribute('aria-valuetext',input.value+(host.dataset.unit||''));
    }
    let thumbToolTip,thumbPopup,converter=null,pointerActive=false,hoverTimer;
    const toolTipEnabled=()=>host.dataset.thumbTooltipEnabled!=='false';
    function thumbRect(){
      const rect=input.getBoundingClientRect();if(!rect.width||!rect.height)return rect;
      const size=parseFloat(getComputedStyle(input).getPropertyValue('--slider-thumb-size')),min=Number(input.min||0),max=Number(input.max||100),ratio=max===min?0:(Number(input.value)-min)/(max-min),vertical=host.dataset.orientation==='vertical';
      const position=vertical?(reversed()?ratio:1-ratio):(getComputedStyle(input).direction==='rtl'?1-ratio:ratio);
      const left=vertical?rect.left+(rect.width-size)/2:rect.left+Math.max(0,rect.width-size)*position,top=vertical?rect.top+Math.max(0,rect.height-size)*position:rect.top+(rect.height-size)/2;
      return{left,top,right:left+size,bottom:top+size,width:size,height:size};
    }
    function toolTipText(){
      const value=Number(input.value),step=Number(host.dataset.stepFrequency||input.step||1);
      if(converter){const text=converter(value,{stepFrequency:step,minimum:Number(input.min||0),maximum:Number(input.max||100),orientation:host.dataset.orientation||'horizontal'});if(text!==null&&typeof text!=='string')throw new TypeError('Thumb ToolTip converter must return a string or null');return text;}
      let frequency=Number.isFinite(step)?Math.abs(step):1,places=0;while(Math.abs(frequency%1)>0.00001&&places<4){places++;frequency*=10;}return value.toFixed(places);
    }
    function hideThumbToolTip(){clearTimeout(hoverTimer);hoverTimer=undefined;thumbPopup?.close(false);}
    function refreshThumbToolTip(){
      if(!thumbToolTip)return false;
      if(!toolTipEnabled()||input.disabled){hideThumbToolTip();return false;}
      const text=toolTipText();if(text===null){hideThumbToolTip();return false;}thumbToolTip.textContent=text;
      thumbPopup.configure({placement:host.dataset.orientation==='vertical'?'left':'top'});return true;
    }
    function showThumbToolTip(){
      if(!toolTipEnabled()||input.disabled)return;
      if(!thumbToolTip){thumbToolTip=element('div','tool-tip slider__thumb-tooltip');thumbToolTip.setAttribute('role','tooltip');host.append(thumbToolTip);thumbPopup=createPopup(thumbToolTip,input,{expanded:false,alignCenter:true,getRect:thumbRect,placement:host.dataset.orientation==='vertical'?'left':'top'});}
      if(refreshThumbToolTip())thumbPopup.show();
    }
    input.addEventListener('focus',()=>{if(input.matches(':focus-visible'))showThumbToolTip();});
    input.addEventListener('blur',hideThumbToolTip);
    input.addEventListener('pointerdown',event=>{if(event.button!==0||input.disabled)return;pointerActive=true;showThumbToolTip();});
    input.addEventListener('pointermove',event=>{
      if(pointerActive){thumbPopup?.position();return;}
      const rect=thumbRect(),near=event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom;
      if(!near){if(!input.matches(':focus-visible'))hideThumbToolTip();return;}
      if(!hoverTimer&&!thumbPopup?.isOpen())hoverTimer=setTimeout(()=>{hoverTimer=undefined;showThumbToolTip();},parseFloat(getComputedStyle(input).getPropertyValue('--tooltip-initial-delay')));
    });
    input.addEventListener('pointerleave',()=>{if(!pointerActive&&!input.matches(':focus-visible'))hideThumbToolTip();});
    for(const name of ['pointerup','pointercancel'])document.addEventListener(name,()=>{if(pointerActive){pointerActive=false;hideThumbToolTip();}});
    const configureParameter=(name,value)=>{const owner=host.closest('winui-slider');if(owner){if(value===null)owner.removeAttribute(name);else owner.setAttribute(name,value);}else{if(value===null)host.removeAttribute('data-'+name);else host.setAttribute('data-'+name,value);}refresh();};
    const setValue=value=>{if(!Number.isFinite(value))throw new TypeError('Value must be finite');input.value=String(ticksMode()?snap(value):value);input.dispatchEvent(new Event('input',{bubbles:true}));};
    sliderControls.set(host,{refresh,get value(){return Number(input.value);},setValue,get isDirectionReversed(){return reversed();},get snapsTo(){return host.dataset.snapsTo||'step-values';},get tickPlacement(){return host.getAttribute('data-tick-placement');},setTickPlacement:value=>{if(value!==null)enumValue(value,['none','top-left','bottom-right','outside','inline'],'TickPlacement');configureParameter('tick-placement',value);},get isThumbToolTipEnabled(){return toolTipEnabled();},setThumbToolTipEnabled:value=>{if(typeof value!=='boolean')throw new TypeError('ToolTip enabled state must be Boolean');configureParameter('thumb-tooltip-enabled',String(value));},get thumbToolTipValueConverter(){return converter;},setThumbToolTipValueConverter:value=>{if(value!==null&&typeof value!=='function')throw new TypeError('Converter must be a function or null');converter=value;refreshThumbToolTip();}});
    input.addEventListener('input',refresh);input.addEventListener('change',refresh);
    input.addEventListener('keydown',event=>{
      if(input.disabled)return;
      const arrows=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'];
      if(arrows.includes(event.key)&&(reversed()||ticksMode()||host.dataset.smallChange)){
        event.preventDefault();const rtl=getComputedStyle(host).direction==='rtl',horizontal=['ArrowLeft','ArrowRight'].includes(event.key),positive=['ArrowRight','ArrowUp'].includes(event.key);
        const forward=positive!==(horizontal?(rtl!==reversed()):reversed());
        let change=ticksMode()?interval():Number(host.dataset.smallChange||host.dataset.stepFrequency||input.step);if(!Number.isFinite(change))change=1;
        if(ticksMode()&&change<=0)return;
        let value=ticksMode()?stepped(Number(input.value),change,forward):Number(input.value)+(forward?change:-change);
        if(!ticksMode()){const step=Number(input.step)||1,min=Number(input.min)||0;value=min+Math.round((value-min)/step)*step;}
        setValue(value);input.dispatchEvent(new Event('change',{bubbles:true}));return;
      }
      if(ticksMode()&&['Home','End'].includes(event.key)){event.preventDefault();input.value=event.key==='Home'?(input.min||'0'):(input.max||'100');input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));return;}
      if(!['PageUp','PageDown'].includes(event.key))return;
      event.preventDefault();let change=Number(host.dataset.largeChange||10);if(ticksMode()&&interval()>0)change=Math.floor(change/interval()+0.5)*interval();
      const direction=(event.key==='PageUp'?1:-1)*(reversed()?-1:1);setValue(ticksMode()?stepped(Number(input.value),change,direction>0):Number(input.value)+change*direction);input.dispatchEvent(new Event('change',{bubbles:true}));
    });
    input.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(event.key)&&!event.ctrlKey&&!event.altKey&&!event.metaKey)showThumbToolTip();});
    new ResizeObserver(refresh).observe(input);
    new MutationObserver(refresh).observe(host,{attributes:true,attributeFilter:['data-tick-placement','data-thumb-tooltip-enabled']});
    new MutationObserver(refresh).observe(input,{attributes:true,attributeFilter:['disabled','min','max','value','step']});refresh();
  }

  // NavigationView.cpp stretch/settle motion. Repeated selection/layout calls do
  // not cancel an animation whose destination has not changed.
  function selectionMotion(indicator) {
    let animation,target,deadline=0;
    function hide(){animation?.cancel();animation=null;target=null;if(!indicator.hidden)indicator.hidden=true;}
    function move({axis,position,size,positionProperty,sizeProperty,animate=false}){
      const same=target&&target.axis===axis&&target.positionProperty===positionProperty&&Math.abs(target.position-position)<0.1&&Math.abs(target.size-size)<0.1;
      if(same&&!indicator.hidden){if(reducedMotion.matches){animation?.cancel();animation=null;}return;}
      const metrics=getComputedStyle(indicator),duration=parseFloat(metrics.getPropertyValue('--nav-animation-duration')),parent=indicator.offsetParent,old=indicator.getBoundingClientRect(),bounds=parent?.getBoundingClientRect(),wasVisible=!indicator.hidden&&target?.axis===axis;
      const from=wasVisible&&bounds?(axis==='x'?old.left-bounds.left-parent.clientLeft+parent.scrollLeft-indicator.offsetLeft:old.top-bounds.top-parent.clientTop+parent.scrollTop-indicator.offsetTop):position;
      const oldSize=wasVisible?(axis==='x'?old.width:old.height):size/2;
      const running=animation&&animation.playState!=='finished'&&animation.playState!=='idle',remaining=animate?duration:running?Math.max(0,deadline-performance.now()):0;
      animation?.cancel();animation=null;target={axis,position,size,positionProperty};
      indicator.style.setProperty(positionProperty,position+'px');if(sizeProperty)indicator.style.setProperty(sizeProperty,size+'px');if(indicator.hidden)indicator.hidden=false;
      if(reducedMotion.matches||remaining<=0||!size||wasVisible&&Math.abs(from-position)<0.1&&Math.abs(oldSize-size)<0.1)return;
      const min=Math.min(from,position),max=Math.max(from+oldSize,position+size),translate=axis==='x'?'translateX':'translateY',scale=axis==='x'?'scaleX':'scaleY';
      const transform=(offset,stretch)=>translate+'('+offset+'px) '+scale+'('+stretch+')';
      const next=indicator.animate([{transform:transform(from,oldSize/size),offset:0,easing:metrics.getPropertyValue('--nav-stretch-easing').trim()},{transform:transform(min,(max-min)/size),offset:0.333,easing:metrics.getPropertyValue('--nav-settle-easing').trim()},{transform:transform(position,1),offset:1}],{duration:remaining});
      animation=next;deadline=performance.now()+remaining;next.onfinish=()=>{if(animation===next)animation=null;};
    }
    reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches){animation?.cancel();animation=null;}});
    return {move,hide};
  }

  function initializeNavigation(nav) {
    if (nav.dataset.winuiInitialized) return;
    nav.dataset.winuiInitialized = 'true';
    const indicator = document.createElement('span'); indicator.className = 'nav-indicator'; indicator.setAttribute('aria-hidden', 'true'); indicator.hidden=true; nav.append(indicator);
    let selected = nav.querySelector('.nav-item.is-active');
    const target = button => (nav.closest('[data-navigation-catalog][data-pane-open="false"]') ? button.closest('.nav-group')?.querySelector('summary') : null) || button.closest('.nav-group:not([open]), .navigation-view__branch:not([open])')?.querySelector('summary') || button;
    const offset = button => { const visible = target(button); return visible.getBoundingClientRect().top - nav.getBoundingClientRect().top + nav.scrollTop + (visible.offsetHeight - parseFloat(getComputedStyle(indicator).height)) / 2; };
    const motion=selectionMotion(indicator);
    function select(button, animate = true) {
      if (!button || button.disabled || button.dataset.selectsOnInvoked==='false') return;
      selected=button;
      const horizontal=nav.classList.contains('nav-list--horizontal');
      nav.querySelectorAll('.nav-item').forEach(item=>{item.classList.toggle('is-active',item===button);if(item===button)item.setAttribute('aria-current',horizontal?'page':'location');else item.removeAttribute('aria-current');});
      if(!target(button).getClientRects().length){motion.hide();return;}
      if(horizontal){const bounds=nav.getBoundingClientRect(),rect=button.getBoundingClientRect(),width=parseFloat(getComputedStyle(indicator).getPropertyValue('--selector-pill-width'));motion.move({axis:'x',position:rect.left-bounds.left-nav.clientLeft+nav.scrollLeft+(rect.width-width)/2,size:width,positionProperty:'--nav-horizontal-position',sizeProperty:'--nav-horizontal-width',animate});}
      else{const height=parseFloat(getComputedStyle(indicator).height);motion.move({axis:'y',position:offset(button),size:height,positionProperty:'--nav-position',animate});}
    }
    nav.addEventListener('click', e => { const button = e.target.closest('.nav-item:not(summary)'); if (button?.closest('.nav-list') === nav) select(button); });
    nav.addEventListener('keydown', e => {
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
      const items = Array.from(nav.querySelectorAll('.nav-item:not(:disabled):not([aria-disabled="true"]), .nav-group__summary:not([aria-disabled="true"])')).filter(item => item.offsetHeight > 0), index = items.indexOf(document.activeElement);
      const next = e.key === 'Home' ? items[0] : e.key === 'End' ? items[items.length - 1] : items[(index + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length];
      if (next) { e.preventDefault(); next.focus({ preventScroll: true }); next.scrollIntoView({ block: 'nearest' }); if (next.matches('.nav-item:not(summary)')) next.click(); }
    });
    new ResizeObserver(() => { if (selected) select(selected, false); }).observe(nav);
    nav.querySelectorAll('.nav-group').forEach(group => group.addEventListener('toggle', () => { if (!group.open && group.contains(document.activeElement) && document.activeElement !== group.querySelector('summary')) group.querySelector('summary').focus({ preventScroll: true }); if (selected && (Math.abs(offset(selected) - parseFloat(indicator.style.getPropertyValue('--nav-position'))) > 0.5 || indicator.hidden !== (target(selected).offsetHeight === 0))) select(selected, false); }));
    reducedMotion.addEventListener('change', () => { if (selected) select(selected, false); });
    if (selected) select(selected, false);
    navigations.set(nav, { select, clear(){selected=null;nav.querySelectorAll('.nav-item').forEach(item=>{item.classList.remove('is-active');item.removeAttribute('aria-current');});motion.hide();} });
  }

  // Pass 2: Gallery/XAML source and supported contracts are in PASS2_FIDELITY.md.
  const collections = new WeakMap(), trees = new WeakMap(), breadcrumbs = new WeakMap(), tabViews = new WeakMap(), selectors = new WeakMap(), splitViews = new WeakMap();
  const disabledItem = item => item.getAttribute('aria-disabled') === 'true' || item.disabled;
  const emit = (host, name, detail) => host.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
  const focusItem = item => { item?.focus({ preventScroll: true }); item?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); };
  function typeAhead(items, current, key, state) {
    if (key.length !== 1 || key === ' ') return null;
    const now = performance.now();
    state.text = now - (state.time || 0) > 700 ? key : (state.text || '') + key;
    state.time = now;
    const text = state.text.toLocaleLowerCase();
    const repeated = [...text].every(c => c === text[0]);
    const query = repeated ? text[0] : text;
    const start = repeated || text.length === 1 ? items.indexOf(current) + 1 : items.indexOf(current);
    for (let n = 0; n < items.length; n++) {
      const item = items[(Math.max(0, start) + n) % items.length];
      if ((item.dataset.itemLabel || item.textContent).trim().toLocaleLowerCase().startsWith(query)) return item;
    }
    return null;
  }
  function collectionIndicator(host, selectedRow) {
    let current;
    const bar=document.createElement('span');bar.className='collection-indicator';bar.setAttribute('aria-hidden','true');bar.hidden=true;host.append(bar);
    const motion=selectionMotion(bar);
    function position(animate=false){
      const row=selectedRow();if(!row||!row.getClientRects().length){motion.hide();current=null;return;}
      const bounds=host.getBoundingClientRect(),rect=row.getBoundingClientRect(),height=Math.max(16,rect.height-40),top=rect.top-bounds.top-host.clientTop+host.scrollTop+(rect.height-height)/2,left=rect.left-bounds.left-host.clientLeft+host.scrollLeft+4;
      bar.style.setProperty('--collection-indicator-left',left+'px');
      motion.move({axis:'y',position:top,size:height,positionProperty:'--collection-indicator-top',sizeProperty:'--collection-indicator-height',animate:animate&&row!==current});current=row;
    }
    new ResizeObserver(()=>position()).observe(host);host.addEventListener('scroll',()=>position(),{passive:true});
    return {position,bar};
  }

  let listDrag;
  function initializeListView(host) {
    if(collections.has(host))return;
    host.setAttribute('role','listbox');let active,anchor,search={},dragged,records=null,filter=()=>true,template;
    const mode=()=>host.dataset.selectionMode||'single';
    const items=()=>[...host.querySelectorAll(':scope > [data-list-item]')];
    const enabled=()=>items().filter(item=>!item.hidden&&!disabledItem(item));
    const selected=()=>items().filter(item=>item.getAttribute('aria-selected')==='true');
    const indicator=collectionIndicator(host,()=>mode()==='single'?selected()[0]:null);
    const announce=()=>{indicator.position(true);emit(host,'selectionChanged',{selectedItems:selected(),values:selected().map(item=>item.dataset.value)});};
    function refresh(){
      host.setAttribute('aria-multiselectable',String(['multiple','extended'].includes(mode())));
      if(!enabled().includes(active))active=enabled().find(item=>item.getAttribute('aria-selected')==='true')||enabled()[0];
      let kept=false;const visible=items().filter(item=>!item.hidden);
      items().forEach(item=>{item.setAttribute('role','option');if(!item.id)item.id=nextId();item.draggable=host.dataset.canReorder==='true'&&!disabledItem(item);
        let checked=item.getAttribute('aria-selected')==='true'&&!disabledItem(item)&&mode()!=='none';if(mode()==='single'&&checked){if(kept)checked=false;kept=true;}
        item.setAttribute('aria-selected',String(checked));item.tabIndex=item===active?0:-1;item.setAttribute('aria-setsize',String(visible.length));item.setAttribute('aria-posinset',String(visible.indexOf(item)+1));
      });host.tabIndex=active?-1:0;if(!host.contains(indicator.bar))host.append(indicator.bar);indicator.position();
    }
    function select(item,event={}){
      if(!item||disabledItem(item)||mode()==='none')return;
      const list=enabled(),before=selected();
      if(event.shiftKey&&mode()==='extended'&&list.includes(anchor)){
        const a=list.indexOf(anchor),b=list.indexOf(item);list.forEach((row,index)=>row.setAttribute('aria-selected',String(index>=Math.min(a,b)&&index<=Math.max(a,b)||event.ctrlKey&&before.includes(row))));
      }else if(mode()==='multiple'||mode()==='extended'&&(event.ctrlKey||event.metaKey)){item.setAttribute('aria-selected',String(!before.includes(item)));anchor=item;}
      else{items().forEach(row=>row.setAttribute('aria-selected',String(row===item)));anchor=item;}
      announce();
    }
    host.addEventListener('click',event=>{const item=event.target.closest('[data-list-item]');if(item?.parentElement!==host||disabledItem(item))return;active=item;refresh();focusItem(item);select(item,event);if(host.dataset.itemClick==='true')emit(host,'itemInvoked',{item,value:item.dataset.value});});
    host.addEventListener('focusin',event=>{if(enabled().includes(event.target)){active=event.target;refresh();}});
    host.addEventListener('keydown',event=>{
      const list=enabled();if(!list.length)return;const current=list.includes(document.activeElement)?document.activeElement:active,index=list.indexOf(current);
      if(event.altKey&&host.dataset.canReorder==='true'&&['ArrowUp','ArrowDown'].includes(event.key)){
        event.preventDefault();const next=list[index+(event.key==='ArrowDown'?1:-1)];if(next){if(event.key==='ArrowDown')next.after(current);else next.before(current);refresh();focusItem(current);emit(host,'itemsReordered',{values:items().map(item=>item.dataset.value)});}return;
      }
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='a'&&['multiple','extended'].includes(mode())){event.preventDefault();list.forEach(item=>item.setAttribute('aria-selected','true'));announce();return;}
      if(event.key===' '||event.key==='Enter'){event.preventDefault();select(current,event);if(event.key==='Enter'&&host.dataset.itemClick==='true')emit(host,'itemInvoked',{item:current,value:current.dataset.value});return;}
      const page=Math.max(1,Math.floor(host.clientHeight/(current?.offsetHeight||40)));
      const next=event.key==='Home'?list[0]:event.key==='End'?list.at(-1):event.key==='ArrowDown'?list[Math.min(index+1,list.length-1)]:event.key==='ArrowUp'?list[Math.max(0,index-1)]:event.key==='PageDown'?list[Math.min(index+page,list.length-1)]:event.key==='PageUp'?list[Math.max(0,index-page)]:!event.ctrlKey&&!event.metaKey?typeAhead(list,current,event.key,search):null;
      if(next){event.preventDefault();active=next;refresh();focusItem(next);if(mode()==='single'&&!event.ctrlKey||mode()==='extended'&&(!event.ctrlKey||event.shiftKey))select(next,event);}
    });
    host.addEventListener('dragstart',event=>{dragged=event.target.closest('[data-list-item]');if(!dragged||disabledItem(dragged)){event.preventDefault();return;}event.dataTransfer.setData('text/x-winui-list',dragged.dataset.value);event.dataTransfer.effectAllowed='move';listDrag={source:host,nodes:selected().includes(dragged)?selected():[dragged]};emit(host,'dragItemsStarting',{items:listDrag.nodes});});
    host.addEventListener('dragover',event=>{if(listDrag&&(listDrag.source===host||host.dataset.transferGroup&&host.dataset.transferGroup===listDrag.source.dataset.transferGroup)){event.preventDefault();event.dataTransfer.dropEffect='move';}});
    host.addEventListener('drop',event=>{
      if(!listDrag||(listDrag.source!==host&&(!host.dataset.transferGroup||host.dataset.transferGroup!==listDrag.source.dataset.transferGroup)))return;
      const source=listDrag.source,target=event.target.closest('[data-list-item]'),nodes=listDrag.nodes;if(target&&nodes.includes(target))return;event.preventDefault();
      const after=target&&event.clientY>target.getBoundingClientRect().top+target.getBoundingClientRect().height/2,position=target?(after?target.nextSibling:target):null;
      for(const node of nodes)host.insertBefore(node,position);
      collections.get(source).commitTransfer(nodes,false);collections.get(host).commitTransfer(nodes,true);
      emit(host,'itemsReordered',{values:items().map(item=>item.dataset.value)});if(source!==host)emit(host,'itemsTransferred',{source,values:nodes.map(item=>item.dataset.value)});
      dragged=null;listDrag=null;
    });
    host.addEventListener('dragend',()=>{dragged=null;listDrag=null;});
    host.addEventListener('contextmenu',event=>{const item=event.target.closest('[data-list-item]');if(item?.parentElement===host&&!disabledItem(item)){active=item;refresh();select(item);}});
    new MutationObserver(refresh).observe(host,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-disabled','data-selection-mode','hidden']});
    function render(){
      const saved=new Set(selected().map(item=>item.dataset.value));host.replaceChildren();let previousGroup;
      for(const record of records.filter(filter)){
        if(record.group&&previousGroup!==record.group){previousGroup=record.group;const header=document.createElement('div');header.className='list-view__group-header';header.setAttribute('role','presentation');header.textContent=record.group;host.append(header);}
        const item=document.createElement('div');item.winUIRecord=record;item.className='list-view__item';item.dataset.listItem='';item.dataset.value=String(record.value);item.dataset.itemLabel=String(record.label);if(record.disabled)item.setAttribute('aria-disabled','true');if(saved.has(item.dataset.value))item.setAttribute('aria-selected','true');
        if(template){const content=template(record);if(!(content instanceof Node))throw new TypeError('Item template must return a Node');item.append(content);}else{item.textContent=record.label;if(record.description){const description=document.createElement('span');description.className='list-view__description';description.textContent=record.description;item.append(description);}}
        host.append(item);
      }active=anchor=null;refresh();
    }
    refresh();collections.set(host,{refresh,getSelectedItems:selected,commitTransfer(nodes,adding){
      if(records){const values=new Set(nodes.map(node=>node.dataset.value));records=records.filter(record=>!values.has(String(record.value)));if(adding)records.push(...nodes.map(node=>node.winUIRecord||{value:node.dataset.value,label:node.dataset.itemLabel}));
        const order=new Map(items().map((node,index)=>[node.dataset.value,index]));records.sort((a,b)=>order.has(String(a.value))&&order.has(String(b.value))?order.get(String(a.value))-order.get(String(b.value)):0);
      }refresh();announce();
    },remove(value){if(records){records=records.filter(record=>String(record.value)!==String(value));render();}else items().find(item=>item.dataset.value===String(value))?.remove();refresh();announce();},setItems(next){if(!Array.isArray(next)||next.length>10000)throw new RangeError('ListView supports at most 10000 records per view; filter larger datasets.');if(new Set(next.map(record=>String(record.value))).size!==next.length)throw new TypeError('Item values must be unique');records=next.slice();render();announce();},setFilter(predicate){if(typeof predicate!=='function')throw new TypeError('Expected filter function');filter=predicate;if(records)render();},setTemplate(renderItem){template=renderItem;if(records)render();},scrollIntoView(value){focusItem(items().find(item=>item.dataset.value===String(value)));},getScrollPosition:()=>host.scrollTop,restoreScrollPosition:position=>host.scrollTop=Math.max(0,Number(position)||0)});
  }

  function initializeTreeView(host) {
    if (trees.has(host)) return;
    host.setAttribute('role','tree'); let active, search={},template;
    const all=()=>Array.from(host.querySelectorAll('[data-tree-item]'));
    const group=item=>item.querySelector(':scope > [role="group"]');
    const indicator=collectionIndicator(host,()=>host.dataset.selectionMode==='multiple'?null:all().find(item=>item.getAttribute('aria-selected')==='true')?.querySelector(':scope > .tree-view__row'));
    const visible=()=>all().filter(item=>!disabledItem(item) && !item.closest('[hidden]') && !item.parentElement.closest('[aria-disabled="true"]'));
    function refresh() {
      host.setAttribute('aria-multiselectable',String(host.dataset.selectionMode==='multiple'));
      all().forEach(item=>{
        if(host.dataset.selectionMode==='multiple'){
          const row=item.querySelector(':scope > .tree-view__row');
          if(row&&!row.querySelector('.tree-view__check')){const check=document.createElement('span');check.className='tree-view__check';check.setAttribute('aria-hidden','true');row.querySelector('.tree-view__chevron').before(check);}
        }
        if(host.dataset.selectionMode==='multiple'&&item.getAttribute('aria-checked')!=='mixed')item.setAttribute('aria-checked',item.getAttribute('aria-selected')==='true'?'true':'false');
        item.setAttribute('role','treeitem'); if(!item.id)item.id=nextId();
        const children=group(item);
        let depth=1, parent=item.parentElement.closest('[data-tree-item]');while(parent){depth++;parent=parent.parentElement.closest('[data-tree-item]');}
        item.setAttribute('aria-level',String(depth));
        item.querySelector(':scope > .tree-view__row')?.style.setProperty('--tree-row-indent',((depth-1)*parseFloat(getComputedStyle(host).getPropertyValue('--tree-indent')))+'px');
        const siblings=Array.from(item.parentElement.children).filter(row=>row.hasAttribute('data-tree-item'));
        item.setAttribute('aria-posinset',String(siblings.indexOf(item)+1)); item.setAttribute('aria-setsize',String(siblings.length));
        if(children){const open=item.getAttribute('aria-expanded')==='true';item.setAttribute('aria-expanded',String(open));children.hidden=!open;}
        if(!item.hasAttribute('aria-selected'))item.setAttribute('aria-selected','false');
      });
      if(!visible().includes(active))active=visible().find(item=>item.getAttribute('aria-selected')==='true')||visible()[0];
      all().forEach(item=>item.tabIndex=item===active?0:-1);host.tabIndex=active?-1:0;if(!host.contains(indicator.bar))host.append(indicator.bar);indicator.position();
    }
    function expand(item, open) {
      if(!group(item) || disabledItem(item))return;
      const restoreFocus=!open && group(item).contains(document.activeElement);if(restoreFocus)active=item;
      item.setAttribute('aria-expanded',String(open));refresh();
      if(restoreFocus)focusItem(item);
      emit(host,open?'expanding':'collapsed',{item});
    }
    function select(item) {
      if(disabledItem(item))return;
      if(host.dataset.selectionMode==='multiple'){
        const value=item.getAttribute('aria-selected')!=='true';
        [item,...item.querySelectorAll('[data-tree-item]')].filter(row=>!disabledItem(row)).forEach(row=>row.setAttribute('aria-selected',String(value)));
        for(let parent=item.parentElement.closest('[data-tree-item]');parent;parent=parent.parentElement.closest('[data-tree-item]')){
          const children=[...parent.querySelector(':scope > [role="group"]').children];
          const count=children.filter(row=>row.getAttribute('aria-selected')==='true').length;
          parent.setAttribute('aria-selected',String(count===children.length));parent.setAttribute('aria-checked',count===children.length?'true':count?'mixed':'false');
        }
        refresh();emit(host,'selectionChanged',{selectedItems:all().filter(row=>row.getAttribute('aria-selected')==='true'),values:all().filter(row=>row.getAttribute('aria-selected')==='true').map(row=>row.dataset.value)});return;
      }
      const changed=item.getAttribute('aria-selected')!=='true';
      all().forEach(row=>row.setAttribute('aria-selected',String(row===item)));
      indicator.position(changed);if(changed)emit(host,'selectionChanged',{selectedItems:[item],values:[item.dataset.value]});
    }
    host.addEventListener('click',event=>{
      const item=event.target.closest('[data-tree-item]');if(!item || !host.contains(item) || disabledItem(item))return;
      active=item;refresh();focusItem(item);
      if(event.target.closest('[data-tree-toggle]'))expand(item,item.getAttribute('aria-expanded')!=='true');else select(item);
    });
    host.addEventListener('focusin',event=>{if(visible().includes(event.target)){active=event.target;refresh();}});
    host.addEventListener('keydown',event=>{
      const list=visible(),item=document.activeElement;if(!list.includes(item) || event.altKey || event.ctrlKey || event.metaKey)return;
      const i=list.indexOf(item), rtl=getComputedStyle(host).direction==='rtl';let destination;
      if(event.key===(rtl?'ArrowLeft':'ArrowRight')){if(group(item) && item.getAttribute('aria-expanded')!=='true')expand(item,true);else if(group(item))destination=Array.from(group(item).children).find(row=>!disabledItem(row));}
      else if(event.key===(rtl?'ArrowRight':'ArrowLeft')){if(group(item) && item.getAttribute('aria-expanded')==='true')expand(item,false);else destination=item.parentElement.closest('[data-tree-item]');}
      else if(event.key==='ArrowDown')destination=list[Math.min(i+1,list.length-1)];
      else if(event.key==='ArrowUp')destination=list[Math.max(0,i-1)];
      else if(event.key==='Home')destination=list[0];else if(event.key==='End')destination=list.at(-1);
      else if(event.key===' ' || event.key==='Enter'){select(item);if(event.key==='Enter')emit(host,'itemInvoked',{item,value:item.dataset.value});}
      else destination=typeAhead(list,item,event.key,search);
      if(destination){active=destination;refresh();focusItem(destination);}
      if(destination || ['ArrowLeft','ArrowRight',' ','Enter'].includes(event.key))event.preventDefault();
    });
    new MutationObserver(refresh).observe(host,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-disabled']});
    initializeTreeDrag(host,refresh);
    refresh();trees.set(host,{refresh,expand,setTemplate(renderer){if(typeof renderer!=='function')throw new TypeError('TreeView template must return a Node');template=renderer;},setItems(records){
      const build=records=>records.map(record=>{const item=document.createElement('div');item.className='tree-view__item';item.dataset.treeItem='';item.dataset.value=String(record.value);item.dataset.itemLabel=record.label;if(record.children)item.setAttribute('aria-expanded',String(record.expanded===true));
        const row=document.createElement('div');row.className='tree-view__row';const arrow=document.createElement('span');arrow.className='tree-view__chevron';arrow.dataset.treeToggle='';arrow.setAttribute('aria-hidden','true');row.append(arrow);
        if(template){const content=template(record);if(!(content instanceof Node))throw new TypeError('TreeView template must return a Node');row.append(content);}else row.append(document.createTextNode(record.label));item.append(row);
        if(record.children){const group=document.createElement('div');group.className='tree-view__group';group.setAttribute('role','group');group.append(...build(record.children));item.append(group);}return item;});host.replaceChildren(...build(records));active=null;refresh();
    },getSelectedItems:()=>all().filter(item=>item.getAttribute('aria-selected')==='true')});
  }

  function initializeBreadcrumb(host) {
    if(breadcrumbs.has(host))return;
    const strip=host.querySelector('[data-breadcrumb-items]'), overflow=host.querySelector('[data-breadcrumb-overflow]'), menu=host.querySelector('[data-breadcrumb-menu]');
    const popup=createPopup(menu,overflow,{focus:true}); overflow.setAttribute('aria-haspopup','menu');
    let records=[],template=record=>document.createTextNode(record.label);
    const items=()=>Array.from(strip.children);let hiddenSignature='';
    function invoke(index){const item=items()[index];if(index===items().length-1||disabledItem(item))return;emit(host,'itemInvoked',{index,value:item.dataset.value,label:item.textContent,item:records[index]});}
    function layout(){
      const list=items();list.forEach(item=>item.hidden=false);
      if(!list.length){overflow.hidden=true;popup.close(false);return;}
      if(list.at(-1).tagName==='BUTTON'){const button=list.at(-1),current=document.createElement('span');current.className=button.className;current.dataset.breadcrumbItem='';current.dataset.value=button.dataset.value;current.append(...button.childNodes);const authored=current.querySelector('winui-breadcrumb-bar-item'),state=authoredCollectionItems.get(authored);if(state)state.container=current;if(button.hasAttribute('aria-disabled'))current.setAttribute('aria-disabled',button.getAttribute('aria-disabled'));button.replaceWith(current);list[list.length-1]=current;}
      list.forEach((item,i)=>{if(i===list.length-1)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current');});
      const widths=list.map(item=>Math.max(item.getBoundingClientRect().width,item.scrollWidth)), available=host.clientWidth;
      if(widths.reduce((a,b)=>a+b,0)<=available){overflow.hidden=true;popup.close(false);return;}
      overflow.hidden=false;let total=widths.reduce((a,b)=>a+b,0)+overflow.getBoundingClientRect().width, hidden=[];
      for(let i=0;i<list.length-1 && total>available;i++){list[i].hidden=true;hidden.push(i);total-=widths[i];}
      if(hidden.length===0 && list.length>1){list[0].hidden=true;hidden=[0];}
      const signature=hidden.map(index=>index+':'+list[index].dataset.value+':'+list[index].textContent).join('|');
      if(signature!==hiddenSignature){const focusInMenu=menu.contains(document.activeElement);hiddenSignature=signature;menu.replaceChildren();hidden.forEach(index=>{const button=document.createElement('button');button.type='button';button.className='flyout-menu__item';button.setAttribute('role','menuitem');button.disabled=disabledItem(list[index]);button.textContent=list[index].textContent;button.addEventListener('click',()=>{popup.close(true);invoke(index);});menu.append(button);});if(focusInMenu)menu.firstElementChild?.focus({preventScroll:true});}
      if(hidden.includes(list.indexOf(document.activeElement)))overflow.focus({preventScroll:true});
      if(popup.isOpen())popup.position();
    }
    strip.addEventListener('click',event=>{const i=items().indexOf(event.target.closest('[data-breadcrumb-item]'));if(i>=0)invoke(i);});
    overflow.addEventListener('click',()=>{if(popup.isOpen())popup.close(true);else popup.show();});
    overflow.addEventListener('keydown',event=>{if(event.key==='ArrowDown'){event.preventDefault();popup.show();}});
    menu.addEventListener('keydown',event=>{const list=Array.from(menu.children),i=list.indexOf(document.activeElement);const next=event.key==='Home'?list[0]:event.key==='End'?list.at(-1):event.key==='ArrowDown'?list[(i+1)%list.length]:event.key==='ArrowUp'?list[(i+list.length-1)%list.length]:null;if(next){event.preventDefault();next.focus();}});
    host.addEventListener('keydown',event=>{
      if(menu.contains(event.target))return;
      const list=[overflow,...items()].filter(item=>!item.hidden&&item.tagName==='BUTTON'&&!disabledItem(item)),i=list.indexOf(document.activeElement),rtl=getComputedStyle(host).direction==='rtl';
      const next=event.key==='Home'?list[0]:event.key==='End'?list.at(-1):event.key===(rtl?'ArrowLeft':'ArrowRight')?list[Math.min(i+1,list.length-1)]:event.key===(rtl?'ArrowRight':'ArrowLeft')?list[Math.max(0,i-1)]:null;
      if(next){event.preventDefault();next.focus();}
    });
    new ResizeObserver(layout).observe(host);document.fonts?.ready.then(layout);layout();
    breadcrumbs.set(host,{refresh:layout,setTemplate(renderer){if(typeof renderer!=='function')throw new TypeError('A BreadcrumbBar template must return a Node');template=renderer;this.setItems(records);},setItems(nextRecords){records=nextRecords;const focused=strip.contains(document.activeElement),value=document.activeElement.dataset.value;popup.close(false);strip.replaceChildren();hiddenSignature='';records.forEach(record=>{const button=document.createElement('button');button.type='button';button.className='breadcrumb-bar__item';button.dataset.breadcrumbItem='';button.dataset.value=String(record.value);button.setAttribute('aria-label',String(record.label||record.Name||record.name||''));const content=template(record);if(!(content instanceof Node))throw new TypeError('A BreadcrumbBar template must return a Node');button.append(content);strip.append(button);});layout();if(focused){const buttons=items().filter(item=>!item.hidden&&item.tagName==='BUTTON'),target=buttons.find(item=>item.dataset.value===value)||buttons.at(-1)||(!overflow.hidden?overflow:host);if(target===host)host.tabIndex=0;target.focus({preventScroll:true});}}});
  }

  function initializeTabView(host) {
    if(tabViews.has(host))return;
    host.querySelector('[data-tab-panels]').classList.add('tab-view__panels');
    const strip=host.querySelector('[data-tab-view-list]'), add=host.querySelector('[data-tab-add]'), previous=host.querySelector('[data-tab-previous]'), next=host.querySelector('[data-tab-next]');
    strip.setAttribute('role','tablist');let selected,dragged;
    const fixedTabs=()=>host.dataset.fixedTabs==='true';
    const requestAdd=()=>{if(!fixedTabs())emit(host,'addTabRequested',{});};
    strip.addEventListener('dragstart',event=>{const tab=event.target.closest('[data-document-tab]');if(!tab||disabledItem(tab))return;dragged=tab.parentElement;event.dataTransfer.setData('text/x-winui-tab',host.id || 'local');event.dataTransfer.effectAllowed='move';});
    strip.addEventListener('dragover',event=>{if(dragged&&event.target.closest('.tab-view__item')){event.preventDefault();event.dataTransfer.dropEffect='move';}});
    strip.addEventListener('drop',event=>{const target=event.target.closest('.tab-view__item');if(!dragged||!target||target===dragged)return;event.preventDefault();const rect=target.getBoundingClientRect();strip.insertBefore(dragged,event.clientX>rect.left+rect.width/2?target.nextSibling:target);emit(host,'tabsReordered',{values:tabs().map(tab=>tab.dataset.value)});dragged=null;refresh();});
    strip.addEventListener('dragend',()=>dragged=null);
    const tabs=()=>Array.from(strip.querySelectorAll('[data-document-tab]')).filter(tab=>tab.closest('[data-tab-view]')===host);
    const enabled=()=>tabs().filter(tab=>!disabledItem(tab));
    const panel=tab=>tab?scopedId(host,tab.getAttribute('aria-controls')):null;
    function refresh(){
      if(!enabled().includes(selected))selected=enabled().find(tab=>tab.getAttribute('aria-selected')==='true')||enabled()[0];
      tabs().forEach(tab=>{
        const item=tab.parentElement;let shape=item.querySelector('.tab-view__shape');if(!shape){shape=document.createElementNS('http://www.w3.org/2000/svg','svg');shape.classList.add('tab-view__shape');shape.setAttribute('aria-hidden','true');shape.append(document.createElementNS('http://www.w3.org/2000/svg','path'));item.prepend(shape);}
        const rect=item.getBoundingClientRect(),width=rect.width,height=rect.height,metrics=getComputedStyle(item),foot=parseFloat(metrics.getPropertyValue('--tab-foot-radius')),corner=parseFloat(metrics.getPropertyValue('--tab-top-radius'));shape.setAttribute('viewBox','0 0 '+(width+2*foot)+' '+height);shape.setAttribute('preserveAspectRatio','none');shape.firstElementChild.setAttribute('d','M0 '+height+' a'+foot+','+foot+' 0 0 0 '+foot+',-'+foot+' L'+foot+','+corner+' a'+corner+','+corner+' 0 0 1 '+corner+',-'+corner+' l'+Math.max(0,width-2*corner)+',0 a'+corner+','+corner+' 0 0 1 '+corner+','+corner+' l0,'+Math.max(0,height-foot-corner)+' a'+foot+','+foot+' 0 0 0 '+foot+','+foot+' Z');tab.draggable=host.dataset.canReorder!=='false'&&!disabledItem(tab);if(!tab.id)tab.id=nextId();tab.setAttribute('role','tab');tab.setAttribute('aria-selected',String(tab===selected));tab.tabIndex=tab===selected?0:-1;
        const content=panel(tab);if(content){content.hidden=tab!==selected;content.setAttribute('role','tabpanel');content.setAttribute('aria-labelledby',tab.id);content.tabIndex=0;}
        const close=tab.parentElement.querySelector('[data-tab-close]');if(close){close.disabled=disabledItem(tab);close.tabIndex=tab===selected?0:-1;close.setAttribute('aria-label','Close '+tab.textContent.trim());}
      });
      previous.disabled=strip.scrollLeft<=1;next.disabled=strip.scrollLeft+strip.clientWidth>=strip.scrollWidth-1;
      if(fixedTabs()&&document.activeElement.closest('[data-tab-view]')===host&&document.activeElement.matches('[data-tab-add],[data-tab-close]'))selected?.focus({preventScroll:true});
      if(selected){const body=panel(selected),tabRect=selected.parentElement.getBoundingClientRect(),bounds=body?.getBoundingClientRect(),clip=strip.getBoundingClientRect(),foot=parseFloat(getComputedStyle(selected.parentElement).getPropertyValue('--tab-foot-radius'));if(body&&bounds){const start=Math.max(0,Math.max(tabRect.left-foot,clip.left)-bounds.left),end=Math.max(start,Math.min(bounds.width,Math.min(tabRect.right+foot,clip.right)-bounds.left));body.style.setProperty('--tab-join-start',start+'px');body.style.setProperty('--tab-join-end',end+'px');}}
      const empty=host.querySelector('[data-tab-empty]');if(empty)empty.hidden=!!selected;
    }
    function select(tab,focus=false){if(!enabled().includes(tab))return;const changed=selected!==tab;selected=tab;refresh();tab.scrollIntoView({block:'nearest',inline:'nearest'});if(focus)tab.focus({preventScroll:true});if(changed)emit(host,'selectionChanged',{selectedItem:publicTab(tab),value:tab.dataset.value});}
    function close(tab){
      if(fixedTabs()||host.dataset.tabsClosable==='false')return;
      if(!enabled().includes(tab)||tab.parentElement.getAttribute('closable')==='false')return;
      const event=new CustomEvent('tabCloseRequested',{bubbles:true,cancelable:true,detail:{tab:publicTab(tab),value:tab.dataset.value}});if(!host.dispatchEvent(event))return;
      const list=enabled(),i=list.indexOf(tab),wasSelected=selected===tab,focused=tab.parentElement.contains(document.activeElement);
      if(wasSelected)selected=list[i+1]||list[i-1];panel(tab)?.remove();tab.parentElement.remove();refresh();
      if(wasSelected)emit(host,'selectionChanged',{selectedItem:publicTab(selected)||null,value:selected?.dataset.value||null});
      if(focused){if(selected)focusItem(selected);else add.focus({preventScroll:true});}
      emit(host,'tabClosed',{value:tab.dataset.value});
    }
    strip.addEventListener('click',event=>{const tab=event.target.closest('[data-document-tab]');if(tab)select(tab);const closeButton=event.target.closest('[data-tab-close]');if(closeButton)close(closeButton.parentElement.querySelector('[data-document-tab]'));});
    host.addEventListener('keydown',event=>{
      const tab=event.target.closest('[data-document-tab]')||event.target.closest('[data-tab-close]')?.parentElement.querySelector('[data-document-tab]'),list=enabled();
      if(event.defaultPrevented||event.target.closest('[data-tab-view]')!==host)return;
      const activeModal=document.querySelector('[data-modal].is-active');if(activeModal&&!activeModal.contains(host))return;
      if(event.ctrlKey && /^[1-9]$/.test(event.key)){event.preventDefault();select(event.key==='9'?list.at(-1):list[Number(event.key)-1],true);return;}
      if(event.ctrlKey&&event.key.toLowerCase()==='t'){event.preventDefault();requestAdd();return;}
      if((event.ctrlKey||event.metaKey)&&(event.key==='F4'||event.key.toLowerCase()==='w')){if(selected){event.preventDefault();close(selected);}return;}
      if(event.ctrlKey&&event.key==='Tab'){event.preventDefault();const i=list.indexOf(selected);if(list.length)select(list[(i+(event.shiftKey?list.length-1:1))%list.length],true);return;}
      if(!tab || !list.length)return;
      const i=list.indexOf(tab),rtl=getComputedStyle(host).direction==='rtl';let target=event.key==='Home'?list[0]:event.key==='End'?list.at(-1):event.key===(rtl?'ArrowLeft':'ArrowRight')?list[(i+1)%list.length]:event.key===(rtl?'ArrowRight':'ArrowLeft')?list[(i+list.length-1)%list.length]:null;
      if(target){event.preventDefault();select(target,true);}
    });
    previous.addEventListener('click',()=>strip.scrollBy({left:-strip.clientWidth,behavior:'auto'}));next.addEventListener('click',()=>strip.scrollBy({left:strip.clientWidth,behavior:'auto'}));
    strip.addEventListener('scroll',refresh);new ResizeObserver(refresh).observe(strip);
    add.addEventListener('click',requestAdd);
    new MutationObserver(refresh).observe(host,{attributes:true,attributeFilter:['data-fixed-tabs']});
    refresh();tabViews.set(host,{get selectedItem(){return selected;},refresh,select,close,setFixedTabs(value){host.dataset.fixedTabs=String(!!value);refresh();},addTab({label,value,content,closable=true,icon}){
      const container=document.createElement('div');container.className='tab-view__item';
      const tab=document.createElement('button');tab.type='button';tab.className='tab-view__tab';tab.dataset.documentTab='';tab.dataset.value=String(value);tab.textContent=String(label);if(icon){const glyph=document.createElement('span');glyph.className='glyph tab-view__icon';glyph.textContent=icon;glyph.setAttribute('aria-hidden','true');tab.prepend(glyph);}container.append(tab);
      if(closable){const close=document.createElement('button');close.type='button';close.className='tab-view__close';close.dataset.tabClose='';close.innerHTML='<span class="glyph" aria-hidden="true">&#xE711;</span>';container.append(close);}
      const body=document.createElement('div');body.className='tab-view__panel';body.id=nextId();if(content instanceof Node)body.append(content);else body.textContent=String(content||'');tab.setAttribute('aria-controls',body.id);
      strip.append(container);host.querySelector('[data-tab-panels]').append(body);select(tab,true);return tab;
    }});
  }

  function initializeSelectorBar(host) {
    if(selectors.has(host))return;host.setAttribute('role','listbox');
    const indicator=document.createElement('span');indicator.className='selector-indicator';indicator.setAttribute('aria-hidden','true');host.append(indicator);
    let selected;
    const items=()=>[...host.querySelectorAll('[data-selector-item]')].filter(item=>!disabledItem(item));
    const motion=selectionMotion(indicator);
    function position(animate=false){
      if(!selected||!selected.getClientRects().length){motion.hide();return;}
      const rect=selected.getBoundingClientRect(),parent=host.getBoundingClientRect(),width=parseFloat(getComputedStyle(indicator).getPropertyValue('--selector-pill-width'));
      motion.move({axis:'x',position:rect.left-parent.left-host.clientLeft+host.scrollLeft+(rect.width-width)/2,size:width,positionProperty:'--selector-position',sizeProperty:'--selector-indicator-width',animate});
    }
    function select(item,focus=true,notify=true){if(!item||disabledItem(item))return;const previous=selected,oldIndex=items().indexOf(selected);selected=item;host.querySelectorAll('[data-selector-item]').forEach(peer=>{peer.setAttribute('aria-selected',String(peer===item));peer.tabIndex=peer===item?0:-1;});if(item.dataset.selectorPage){host.querySelectorAll('[data-selector-item]').forEach(peer=>{const panel=scopedId(host,peer.dataset.selectorPage);if(panel)panel.hidden=peer!==item;});const panel=scopedId(host,item.dataset.selectorPage);if(previous&&previous!==item&&panel&&!reducedMotion.matches){const direction=items().indexOf(item)>=oldIndex?1:-1,metrics=getComputedStyle(panel);panel.animate([{translate:direction*panel.getBoundingClientRect().width+'px 0',opacity:0},{translate:'0 0',opacity:1}],{duration:parseFloat(metrics.getPropertyValue('--motion-normal')),easing:metrics.getPropertyValue('--motion-easing').trim()});}}position(previous&&previous!==item);if(focus)item.focus();if(notify&&previous!==item)emit(host,'selectionChanged',{selectedItem:item,value:item.dataset.value});}
    function refresh(){host.querySelectorAll('[data-selector-item]').forEach(item=>item.setAttribute('role','option'));const list=items();if(!list.includes(selected))select(list.find(item=>item.getAttribute('aria-selected')==='true')||list[0],false,false);else position();}
    host.addEventListener('click',event=>{const item=event.target.closest('[data-selector-item]');if(item?.closest('[data-selector-bar]')===host)select(item);});
    host.addEventListener('keydown',event=>{const list=items(),index=list.indexOf(event.target),rtl=getComputedStyle(host).direction==='rtl';let next;if(event.key==='Home')next=list[0];if(event.key==='End')next=list.at(-1);if(event.key===(rtl?'ArrowLeft':'ArrowRight'))next=list[(index+1)%list.length];if(event.key===(rtl?'ArrowRight':'ArrowLeft'))next=list[(index+list.length-1)%list.length];if(next){event.preventDefault();select(next);}});
    new ResizeObserver(()=>position()).observe(host);new MutationObserver(refresh).observe(host,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','aria-disabled']});
    refresh();selectors.set(host,{select,refresh,setItems(records){host.querySelectorAll('[data-selector-item]').forEach(item=>item.remove());records.forEach(record=>{const item=document.createElement('button');item.type='button';item.className='selector-bar__item';item.dataset.selectorItem='';item.dataset.value=record.value;item.textContent=record.label;if(record.icon){const icon=document.createElement('span');icon.className='glyph';icon.textContent=record.icon;item.prepend(icon);}indicator.before(item);});selected=null;refresh();}});
  }

  function initializeSplitView(host) {
    if(splitViews.has(host))return;
    const pane=host.querySelector('[data-split-pane]'),content=host.querySelector('[data-split-content]'),overlay=host.querySelector('[data-split-overlay]');
    if(!pane||!content||!overlay)throw new TypeError('SplitView requires pane, content and light-dismiss parts');
    if(!host.id)host.id=nextId();if(!pane.id)pane.id=nextId();
    const toggles=[...host.querySelectorAll('[data-split-toggle]'),...host.getRootNode().querySelectorAll('[data-split-target]')].filter(node=>host.contains(node)||node.dataset.splitTarget===host.id);
    let open=host.dataset.paneOpen==='true',opener,animations=[],revision=0,configuration;
    const config=()=>[host.dataset.displayMode,host.dataset.panePlacement,host.dataset.openPaneLength,host.dataset.compactPaneLength].join('|');
    const mode=()=>host.dataset.displayMode||'overlay',right=()=>host.dataset.panePlacement==='right',compact=()=>mode().startsWith('compact'),isOverlay=()=>mode().endsWith('overlay');
    const length=(value,fallback)=>value!==undefined&&/^\d+(\.\d+)?$/.test(value)?Math.min(10000,Number(value)):fallback;
    function cancel(){revision++;animations.forEach(animation=>animation.cancel());animations=[];}
    function render(transition=false){
      configuration=config();const beforePane=getComputedStyle(pane),fromTransform=beforePane.transform,fromClip=beforePane.clipPath,fromContent=content.getBoundingClientRect(),wasHidden=pane.hidden;
      cancel();const ticket=revision,metrics=getComputedStyle(host),o=length(host.dataset.openPaneLength,parseFloat(metrics.getPropertyValue('--split-open-width'))),c=length(host.dataset.compactPaneLength,parseFloat(metrics.getPropertyValue('--split-compact-width')));
      host.style.setProperty('--split-open-length',o+'px');host.style.setProperty('--split-compact-length',c+'px');host.dataset.paneOpen=String(open);
      const reserve=mode()==='inline'||mode()==='compact-inline'?open?o:compact()?c:0:compact()?c:0;
      host.style.setProperty('--split-reserved-width',reserve+'px');
      pane.hidden=false;pane.inert=!open&&!compact();content.inert=open&&isOverlay();overlay.hidden=!(open&&isOverlay());
      for(const toggle of toggles){toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-controls',pane.id);if(toggle.hasAttribute('data-toggle-button'))toggle.setAttribute('aria-pressed',String(open));}
      if(!transition||reducedMotion.matches){if(!open&&!compact())pane.hidden=true;return;}
      const duration=parseFloat(metrics.getPropertyValue('--split-'+(isOverlay()?'overlay-':'')+(open?'open':'close')+'-duration')),easing=metrics.getPropertyValue(isOverlay()?'--split-overlay-easing':'--split-inline-easing').trim();
      if(!duration){if(!open&&!compact())pane.hidden=true;return;}
      const after=getComputedStyle(pane),toTransform=after.transform,toClip=after.clipPath,afterContent=content.getBoundingClientRect();
      const off=(right()?1:-1)*o,startTransform=wasHidden?'translateX('+off+'px)':fromTransform;
      animations.push(pane.animate([{transform:startTransform,clipPath:wasHidden?toClip:fromClip},{transform:toTransform,clipPath:toClip}],{duration,easing}));
      const shift=fromContent.left-afterContent.left;if(shift)animations.push(content.animate([{transform:'translateX('+shift+'px)'},{transform:'translateX(0)'}],{duration:open?Math.max(0,duration-0.01):duration,easing}));
      Promise.allSettled(animations.map(animation=>animation.finished)).then(()=>{if(ticket!==revision)return;animations=[];if(!open&&!compact())pane.hidden=true;emit(host,open?'paneOpened':'paneClosed',{});});
    }
    function setOpen(value,focus=true){
      value=!!value;if(value===open)return;
      const focused=pane.contains(document.activeElement)||document.activeElement===overlay,before=document.activeElement;open=value;
      if(open)opener=before;emit(host,open?'paneOpening':'paneClosing',{});render(true);
      if(open&&focus&&isOverlay())focusables(pane)[0]?.focus({preventScroll:true});
      else if(!open&&focused)(opener?.isConnected&&!opener.closest('[inert]')?opener:toggles[0])?.focus({preventScroll:true});
      if(reducedMotion.matches)emit(host,open?'paneOpened':'paneClosed',{});
    }
    function setMode(value){if(!['inline','overlay','compact-inline','compact-overlay'].includes(value))throw new RangeError('Unknown SplitView mode');host.dataset.displayMode=value;render();emit(host,'displayModeChanged',{mode:value});}
    function setPlacement(value){if(!['left','right'].includes(value))throw new RangeError('Unknown SplitView placement');host.dataset.panePlacement=value;render();}
    function setPaneLengths(openLength,compactLength){for(const value of [openLength,compactLength])if(!Number.isFinite(value)||value<0||value>10000)throw new RangeError('Invalid SplitView pane length');host.dataset.openPaneLength=String(openLength);host.dataset.compactPaneLength=String(compactLength);render();}
    toggles.forEach(toggle=>{if(toggle.hasAttribute('data-toggle-button'))initializeToggleButton(toggle);toggle.addEventListener('click',()=>setOpen(!open));});overlay.addEventListener('pointerdown',event=>event.preventDefault());overlay.addEventListener('click',()=>setOpen(false));
    host.addEventListener('keydown',event=>{if(!open||!isOverlay())return;if(event.key==='Escape'){event.preventDefault();setOpen(false);}else if(event.key==='Tab'){const list=focusables(pane);if(!list.length){event.preventDefault();return;}const index=list.indexOf(document.activeElement);if(event.shiftKey&&index<=0){event.preventDefault();list.at(-1).focus();}else if(!event.shiftKey&&(index<0||index===list.length-1)){event.preventDefault();list[0].focus();}}});
    new MutationObserver(()=>{if(config()!==configuration)render();}).observe(host,{attributes:true,attributeFilter:['data-display-mode','data-pane-placement','data-open-pane-length','data-compact-pane-length']});
    reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)render();});
    splitViews.set(host,{setOpen,setMode,setPlacement,setPaneLengths,get isPaneOpen(){return open;}});render();
  }


  // WinUI IsEnabled translation for a control or composition. Preserve selection,
  // expansion and originally disabled children; disabling is not a reset command.
  const enabledStates = new WeakMap();
  function setEnabled(host, enabled) {
    if (!(host instanceof HTMLElement)) throw new TypeError('Expected a control element');
    enabled = !!enabled;
    const prior = enabledStates.get(host);
    if (enabled) {
      if (!prior) return;
      prior.observer.disconnect();
      for (const type of prior.events) host.removeEventListener(type, prior.guard, true);
      for (const [node, state] of prior.nodes) {
        if ('disabled' in state) node.disabled = state.disabled;
        for (const [name, value] of Object.entries(state.attributes)) {
          if (value === null) node.removeAttribute(name); else node.setAttribute(name, value);
        }
      }
      enabledStates.delete(host);
      if(host.matches('winui-expander'))hydrateExpander(host);if(host.matches('winui-split-view'))hydrateSplitView(host);host.querySelectorAll('winui-expander').forEach(hydrateExpander);host.querySelectorAll('winui-split-view').forEach(hydrateSplitView);
      if(host.matches(navigationTags))hydrateNavigationView(host);host.querySelectorAll(navigationTags).forEach(hydrateNavigationView);host.querySelectorAll(navigationItemTags).forEach(hydrateNavigationItem);
      if(host.matches(collectionTags))hydrateCollection(host);host.querySelectorAll(collectionTags).forEach(hydrateCollection);
      const statusOwner=host.closest(statusTags);if(statusOwner)hydrateStatus(statusOwner);host.querySelectorAll(statusTags).forEach(hydrateStatus);
      if(host.matches(namedTags))hydrateNamed(host);host.querySelectorAll(namedTags).forEach(hydrateNamed);
      if(host.matches(tokenTags))hydrateToken(host);host.querySelectorAll(tokenTags).forEach(hydrateToken);
      if(inputControls.has(host))updateInput(host,'disabled');
      host.querySelectorAll(inputTags).forEach(node=>updateInput(node,'disabled'));
      if(menuHeaders.has(host))hydrateMenuHeader(host);host.querySelectorAll('winui-menu-bar-item').forEach(hydrateMenuHeader);
      if(actionControls.has(host))updateAction(host);
      host.querySelectorAll(actionTags).forEach(updateAction);
      if(authoredMenuItems.has(host))hydrateMenuItem(host);
      host.querySelectorAll(menuItemTags).forEach(hydrateMenuItem);
      if(selectionControls.has(host))updateSelection(host,'disabled');
      host.querySelectorAll(selectionTags).forEach(node=>updateSelection(node,'disabled'));
      if (authoredButtons.has(host)) updateAuthoredButton(host);
      host.querySelectorAll('winui-appbar-button,winui-appbar-toggle-button').forEach(updateAuthoredButton);
      // Recompute the current enabled keyboard entry, retaining selected records.
      for (const [selector, map] of [['[data-list-view]',collections],['[data-tree-view]',trees],['[data-tab-view]',tabViews],['[data-selector-bar]',selectors]]) {
        host.querySelectorAll(selector).forEach(node=>map.get(node)?.refresh());
        if (host.matches(selector)) map.get(host)?.refresh();
      }
      return;
    }
    if (prior) return;
    const previousFocus = document.activeElement;
    popupInstances.forEach(api => api.close(false));
    const nodes = new Map(), events = ['click','dblclick','pointerdown','keydown','beforeinput','submit','focusin','contextmenu','dragstart','dragover','drop'];
    const capture = node => {
      if (!nodes.has(node)) nodes.set(node,{attributes:{tabindex:node.getAttribute('tabindex')}});
      return nodes.get(node);
    };
    const controlSelector='[data-list-view],[data-tree-view],[data-tab-view],[data-selector-bar],[data-split-view],.disclosure,[data-navigation-view],[data-navigation-item],.nav-group__summary';
    const decorate = node => {
      const state=capture(node);
      for(const name of ['aria-disabled','data-control-disabled'])if(!(name in state.attributes))state.attributes[name]=node.getAttribute(name);
      if(node.getAttribute('aria-disabled')!=='true')node.setAttribute('aria-disabled','true');
      if(!node.hasAttribute('data-control-disabled'))node.setAttribute('data-control-disabled','');
    };
    const apply = () => {
      decorate(host);host.querySelectorAll(controlSelector).forEach(decorate);
      const candidates=[host,...host.querySelectorAll('button,input,select,textarea,a[href],summary,[tabindex]')];
      for(const node of candidates){
        const state=capture(node);
        // Model selection buttons keep their state. The disabled root blocks input
        // and exposes inherited aria-disabled, while tabindex removes keyboard entry.
        if('disabled' in node && !node.matches('winui-tag,'+namedTags) && !authoredButtons.has(node) && !authoredNavigationItems.has(node) && !selectionControls.has(node) && !actionControls.has(node) && !inputControls.has(node) && !authoredMenuItems.has(node) && !node.matches('[data-selector-item],[data-document-tab]')){
          if(!('disabled' in state))state.disabled=node.disabled;
          if(!node.disabled)node.disabled=true;
        }
        if(node.matches('a[href]'))decorate(node);
        if(node.getAttribute('tabindex')!=='-1')node.setAttribute('tabindex','-1');
      }
    };
    const focusDialog = () => {
      const dialog = host.closest('[role="dialog"]');
      if (dialog && dialog !== host && dialog.getClientRects().length) {
        if (!dialog.hasAttribute('tabindex')) dialog.tabIndex = -1;
        dialog.focus({ preventScroll: true });
      }
    };
    const guard = event => {
      if(event.type==='keydown' && event.key==='Escape')return; // overlay dismissal stays available
      event.preventDefault();event.stopImmediatePropagation();
      if(event.type==='focusin') { event.target.blur(); focusDialog(); }
    };
    events.forEach(type=>host.addEventListener(type,guard,true));
    const observer=new MutationObserver(apply);
    enabledStates.set(host,{nodes,events,guard,observer});apply();
    observer.observe(host,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','tabindex']});
    if(host.contains(previousFocus)) { previousFocus.blur(); focusDialog(); }
  }

  function initializeTextBorder(input) {
    if(input.parentElement.classList.contains('text-control')||input.classList.contains('combo-box__editor'))return;
    const wrapper=document.createElement('span');wrapper.className='text-control';
    if(input.dataset.width){wrapper.dataset.width=input.dataset.width;if(!input.hasAttribute('data-header'))delete input.dataset.width;}input.before(wrapper);wrapper.append(input);input.classList.add('text-control__input');
  }

  function initializeTitleBar(host) {
    if (host.dataset.titlebarInitialized) return;
    host.dataset.titlebarInitialized = 'true';
    const bridge = window.chrome?.webview;
    if (!bridge) return;
    const send = action => bridge.postMessage(JSON.stringify({ type: 'titleBar', action }));
    const interactive = target => target.closest('[data-titlebar-interactive],input,button,a,select,textarea,[contenteditable]');
    host.addEventListener('mousedown', event => {
      if (event.button !== 0 || interactive(event.target)) return;
      event.preventDefault();
      send(event.detail === 2 ? 'maximize' : 'drag');
    });
    host.addEventListener('contextmenu', event => {
      if (interactive(event.target)) return;
      event.preventDefault(); send('menu');
    });
    bridge.addEventListener('message', event => {
      const snapshot = event.data;
      if (snapshot?.type !== 'titleBarSnapshot' || snapshot.schemaVersion !== 1 || !Number.isFinite(snapshot.captionInset) || snapshot.captionInset < 0 || snapshot.captionInset > 512 || typeof snapshot.maximized !== 'boolean' || typeof snapshot.active !== 'boolean') return;
      host.style.setProperty('--titlebar-caption-inset', snapshot.captionInset + 'px');
      host.classList.toggle('app-titlebar--inactive', snapshot.active === false);
    });
    send('ready');
  }

  function initializeCheckBox(host) {
    if(host.dataset.checkInitialized)return;host.dataset.checkInitialized='true';
    if(host.matches('input')){
      let state=host.indeterminate?null:host.checked;
      host.addEventListener('click',()=>{state=state===false?true:state===true?null:false;host.checked=state===true;host.indeterminate=state===null;});
    }else{
      const parent=host.querySelector('[data-check-all]'),children=[...host.querySelectorAll('[data-check-child]')];
      const refresh=()=>{const checked=children.filter(child=>child.checked).length;parent.checked=checked===children.length;parent.indeterminate=checked>0&&checked<children.length;};
      parent.addEventListener('change',()=>{children.filter(child=>!child.disabled).forEach(child=>child.checked=parent.checked);refresh();});children.forEach(child=>child.addEventListener('change',refresh));refresh();
    }
  }
  function initializeRadioButtons(host){
    if(host.dataset.radioInitialized)return;host.dataset.radioInitialized='true';host.setAttribute('role','radiogroup');
    const radios=[...host.querySelectorAll('input[type="radio"]')];
    host.addEventListener('keydown',event=>{if(!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      const enabled=radios.filter(radio=>!radio.disabled),index=enabled.indexOf(document.activeElement);if(index<0)return;event.preventDefault();
      const next=event.key==='Home'?enabled[0]:event.key==='End'?enabled.at(-1):enabled[(index+(['ArrowDown','ArrowRight'].includes(event.key)?1:enabled.length-1))%enabled.length];next.checked=true;next.focus();next.dispatchEvent(new Event('change',{bubbles:true}));
    });
  }
  const infoBars=new WeakMap();
  function initializeInfoBar(host){
    if(infoBars.has(host))return;
    host.dataset.infoInitialized='true';
    const close=document.createElement('button');close.type='button';close.className='button button--subtle button--icon info-bar__close';close.setAttribute('aria-label','Close InfoBar');close.innerHTML='<span class="glyph" aria-hidden="true">&#xE711;</span>';host.append(close);
    const hide=()=>{if(host.hidden)return;const event=new CustomEvent('closing',{bubbles:true,cancelable:true});if(host.dispatchEvent(event)){host.hidden=true;emit(host,'closed',{});}};
    close.addEventListener('click',hide);
    const update=()=>close.hidden=host.dataset.closable!=='true';update();new MutationObserver(update).observe(host,{attributes:true,attributeFilter:['data-closable']});
    infoBars.set(host,{show:()=>{host.hidden=false;},hide,close});
  }
  function initializeTreeDrag(host,refresh){
    if(host.dataset.canDrag!=='true')return;let dragged;
    host.addEventListener('pointerdown',event=>{const item=event.target.closest('[data-tree-item]');if(item)item.draggable=true;});
    host.addEventListener('dragstart',event=>{dragged=event.target.closest('[data-tree-item]');if(!dragged||disabledItem(dragged)){event.preventDefault();return;}event.dataTransfer.setData('text/x-winui-tree',dragged.dataset.value);event.dataTransfer.effectAllowed='move';});
    host.addEventListener('dragover',event=>{const target=event.target.closest('[data-tree-item]');if(dragged&&target&&target!==dragged&&!dragged.contains(target)){event.preventDefault();event.dataTransfer.dropEffect='move';}});
    host.addEventListener('drop',event=>{const target=event.target.closest('[data-tree-item]');if(!dragged||!target||target===dragged||dragged.contains(target))return;event.preventDefault();const group=target.querySelector(':scope > [role="group"]');if(group){group.append(dragged);target.setAttribute('aria-expanded','true');}else target.before(dragged);emit(host,'itemsReordered',{value:dragged.dataset.value,target:target.dataset.value});dragged=null;refresh();});
    host.addEventListener('dragend',()=>dragged=null);
  }
  const navigationViews=new WeakMap();
  function initializeNavigationView(host){
    if(navigationViews.has(host))return;
    const pane=host.querySelector(':scope > [data-navigation-pane]'),toggle=pane.querySelector(':scope > [data-navigation-toggle]'),content=host.querySelector(':scope > [data-navigation-content]'),list=pane.querySelector('[data-navigation-items]'),overlay=host.querySelector(':scope > [data-navigation-overlay]');
    let requested=host.dataset.paneDisplayMode||'auto',explicitOpen=host.hasAttribute('data-pane-open'),open=explicitOpen?host.dataset.paneOpen==='true':requested==='left'||host.clientWidth>=1008,selected;
    initializeNavigation(list);
    // IsBackButtonVisible / IsBackEnabled: attach to a local title-bar host when present.
    // A Gallery sample without its own demo title bar must never take the real application title bar.
    let back=pane.querySelector(':scope > [data-navigation-back]');
    if(!back){
      back=document.createElement('button');back.type='button';back.className='button button--subtle button--icon navigation-view__back';
      back.dataset.navigationBack='';back.setAttribute('aria-label','Back');back.hidden=true;
      const glyph=document.createElement('span');glyph.className='glyph';glyph.setAttribute('aria-hidden','true');glyph.textContent='\uE72B';back.append(glyph);
      toggle.before(back);
    }
    back.classList.add('navigation-view__back');
    const demoTitlebar=host.closest('[data-navigation-demo-window]')?.querySelector('[data-navigation-titlebar-host]');
    const titlebar=demoTitlebar||(!host.closest('[data-gallery-sample]')?host.closest('.app-window')?.querySelector(':scope > [data-titlebar]'):null);
    let backVisible=host.hasAttribute('data-back-button-visible')?host.dataset.backButtonVisible==='true':!back.hidden;
    let backEnabled=!back.disabled;
    // Toolkit-specific translation of Gallery MainWindow TitleBar.IsPaneToggleButtonVisible:
    // keep NavigationView's existing pane toggle as the sole action owner.
    let paneTogglePlacement=host.dataset.paneTogglePlacement==='beside-back'?'beside-back':'pane';
    function syncTitlebarButtons(){
      const owner=titlebar?.querySelector(':scope > [data-navigation-back]');
      const integrated=!!(backVisible&&titlebar&&(!owner||owner===back));
      if(integrated){
        if(back.parentElement!==titlebar)titlebar.prepend(back);
      }else if(back.parentElement!==pane){
        pane.prepend(back);
      }
      back.hidden=!backVisible;
      back.disabled=!backEnabled;
      back.toggleAttribute('data-navigation-titlebar-integrated',integrated);
      const toggleOwner=titlebar?.querySelector(':scope > [data-navigation-toggle]');
      const besideBack=integrated&&paneTogglePlacement==='beside-back'&&(!toggleOwner||toggleOwner===toggle);
      if(besideBack){
        if(toggle.parentElement!==titlebar||toggle.previousElementSibling!==back)back.after(toggle);
      }else if(toggle.parentElement!==pane){
        if(back.parentElement===pane)back.after(toggle);
        else pane.prepend(toggle);
      }
      toggle.toggleAttribute('data-navigation-titlebar-integrated',besideBack);
      host.dataset.backButtonVisible=String(backVisible);
      host.dataset.paneTogglePlacement=paneTogglePlacement;
      host.dataset.paneToggleInTitlebar=String(besideBack);
      if(titlebar?.matches('[data-titlebar]'))
        titlebar.classList.toggle('app-titlebar--navigation-back',!!titlebar.querySelector(':scope > [data-navigation-back]'));
    }
    function setBackButtonVisible(value){backVisible=!!value;syncTitlebarButtons();}
    function setBackEnabled(value){backEnabled=!!value;syncTitlebarButtons();}
    function setPaneTogglePlacement(value){
      if(value!=='pane'&&value!=='beside-back')throw new RangeError('Unknown PaneTogglePlacement');
      paneTogglePlacement=value;
      syncTitlebarButtons();
    }
    syncTitlebarButtons();
    const settings=pane.querySelector('[data-value="settings"]');if(settings)settings.setAttribute('aria-label','Settings');
    const items=()=>[...list.querySelectorAll('[data-navigation-item]'),...pane.querySelectorAll(':scope > .navigation-view__footer [data-navigation-item]')].filter(item=>item.closest('[data-navigation-view]')===host&&!disabledItem(item)&&!item.closest('[hidden]')&&item.getClientRects().length);
    function select(item){
      if(!item||disabledItem(item)||item.dataset.selectsOnInvoked==='false')return;selected=item;
      [...list.querySelectorAll('[data-navigation-item]'),...pane.querySelectorAll(':scope > .navigation-view__footer [data-navigation-item]')].forEach(peer=>{peer.classList.toggle('is-active',peer===item);if(peer===item)peer.setAttribute('aria-current','page');else peer.removeAttribute('aria-current');});
      if(list.contains(item))navigations.get(list).select(item);else navigations.get(list).clear();
      const result=[...content.querySelectorAll('[data-navigation-result]')].find(node=>node.closest('[data-navigation-view]')===host);if(result&&!authoredNavigationViews.has(host))result.textContent=item.dataset.navigationContent||item.querySelector('span:not(.glyph)')?.textContent||item.textContent.trim();
      emit(host,'selectionChanged',{selectedItem:navigationPublicItem(item),value:item.dataset.value});
      if(['left-minimal','left-compact'].includes(host.dataset.effectiveMode)&&open)setOpen(false);
    }
    function layout(){
      const width=host.clientWidth,mode=requested==='auto'?((host.dataset.responsiveMode==='top'||host.dataset.galleryNavigation==='responsive')?(width>=641?'top':'left-minimal'):width>=1008?'left':width>=641?'left-compact':'left-minimal'):requested;
      if(!explicitOpen)open=mode==='left';const previousMode=host.dataset.effectiveMode;if(previousMode&&previousMode!==mode)list.querySelectorAll('.navigation-view__branch[open]').forEach(branch=>branch.open=false);
      host.dataset.effectiveMode=mode;host.dataset.paneOpen=String(open);toggle?.setAttribute('aria-expanded',String(open));list.classList.toggle('nav-list--horizontal',mode==='top');pane.querySelectorAll('[data-navigation-item]').forEach(item=>item.classList.toggle('nav-item--top',mode==='top'));
      list.querySelectorAll('.navigation-view__children').forEach(children=>{if(mode!=='top'){children.classList.remove('winui-popup');children.removeAttribute('popover');}else{children.classList.add('winui-popup');children.setAttribute('popover','manual');}});
      const minimal=mode==='left-minimal',modal=open&&['left-minimal','left-compact'].includes(mode);
      list.inert=minimal&&!open;const footer=pane.querySelector('.navigation-view__footer');if(footer)footer.inert=minimal&&!open;content.inert=modal;if(overlay)overlay.hidden=!modal;
      if(selected&&list.contains(selected))navigations.get(list).select(selected,false);
    }
    function setOpen(value){explicitOpen=true;open=!!value;layout();emit(host,open?'paneOpened':'paneClosed',{});}
    list.querySelectorAll('.navigation-view__branch').forEach(branch=>{const summary=branch.querySelector('summary'),children=branch.querySelector('.navigation-view__children'),popup=createPopup(children,summary,{expanded:false});branch.addEventListener('toggle',()=>{summary.setAttribute('aria-expanded',String(branch.open));if(host.dataset.effectiveMode==='top'){children.classList.add('winui-popup');children.setAttribute('popover','manual');if(branch.open)popup.show();else popup.close(false);}else{popup.close(false);children.classList.remove('winui-popup');children.removeAttribute('popover');}});});
    host.addEventListener('click',event=>{if(event.target.closest('[data-navigation-chevron]'))return;const item=event.target.closest('[data-navigation-item]');if(item&&item.closest('[data-navigation-view]')===host)select(item);});toggle?.addEventListener('click',()=>setOpen(!open));overlay?.addEventListener('click',()=>setOpen(false));back.addEventListener('click',()=>emit(host,'backRequested',{}));
    host.addEventListener('keydown',event=>{if(event.key==='Escape'&&open&&pane.contains(event.target)){event.preventDefault();setOpen(false);toggle?.focus();return;}const available=items(),index=available.indexOf(event.target);if(index<0)return;const top=host.dataset.effectiveMode==='top',rtl=getComputedStyle(host).direction==='rtl';let next;if(event.key==='Home')next=available[0];if(event.key==='End')next=available.at(-1);if(event.key===(top?(rtl?'ArrowLeft':'ArrowRight'):'ArrowDown'))next=available[(index+1)%available.length];if(event.key===(top?(rtl?'ArrowRight':'ArrowLeft'):'ArrowUp'))next=available[(index+available.length-1)%available.length];if(next){event.preventDefault();next.focus();if(host.dataset.selectionFollowsFocus==='true')select(next);}});
    new ResizeObserver(layout).observe(host);layout();
    navigationViews.set(host,{get isPaneOpen(){return open;},get selectedItem(){return selected;},select,setOpen,setBackButtonVisible,setBackEnabled,getBackButton:()=>back,setPaneTogglePlacement,getPaneToggleButton:()=>toggle,setMode(mode){if(!['auto','top','left','left-compact','left-minimal'].includes(mode))throw new RangeError('Unknown PaneDisplayMode');requested=mode;layout();},setItems(records){list.querySelectorAll('[data-navigation-item],.nav-group-label,.navigation-view__separator').forEach(item=>item.remove());records.forEach(record=>{let node;if(record.kind==='header'){node=document.createElement('div');node.className='nav-group-label';node.textContent=record.label;}else if(record.kind==='separator'){node=document.createElement('hr');node.className='navigation-view__separator';}else{node=document.createElement('button');node.type='button';node.className='nav-item';node.dataset.navigationItem='';node.dataset.value=record.value;const label=document.createElement('span');label.textContent=record.label;node.append(label);if(record.icon){const icon=document.createElement('span');icon.className='glyph';icon.textContent=record.icon;node.prepend(icon);}if(record.tooltip)node.title=record.tooltip;}list.append(node);});layout();}});
  }

  function initializeSplitColor(host){
    if(host.dataset.colorInitialized)return;host.dataset.colorInitialized='true';
    const editor=host.closest('[data-gallery-sample]')?.querySelector('[data-color-editor]') || document.getElementById(host.dataset.editor);
    let selection;
    document.addEventListener('selectionchange',()=>{const range=getSelection()?.rangeCount?getSelection().getRangeAt(0):null;if(range&&editor?.contains(range.commonAncestorContainer))selection=range.cloneRange();});
    host.querySelectorAll('button[data-color]').forEach(button=>button.addEventListener('click',()=>{host.dataset.currentColor=button.dataset.color;host.querySelector('span[data-color]').dataset.color=button.dataset.color;}));
    host.querySelector('[data-apply-color]').addEventListener('click',()=>{
      if(!editor||!selection||!editor.contains(selection.commonAncestorContainer))return;
      const span=document.createElement('span');span.className='rich-edit__run rich-edit__run--'+host.dataset.currentColor;
      span.append(selection.extractContents());selection.insertNode(span);selection.selectNodeContents(span);getSelection().removeAllRanges();getSelection().addRange(selection);editor.focus();
      emit(host,'colorApplied',{color:host.dataset.currentColor});
    });
  }

  function initializeProgressRing(host){
    if(host.dataset.ringInitialized||host.tagName.toLowerCase()==='svg')return;host.dataset.ringInitialized='true';
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 16 16');svg.setAttribute('aria-hidden','true');svg.classList.add('progress-ring__radial');
    const background=document.createElementNS(svg.namespaceURI,'circle');background.classList.add('progress-ring__background');background.setAttribute('cx','8');background.setAttribute('cy','8');background.setAttribute('r','7');svg.append(background);
    const group=document.createElementNS(svg.namespaceURI,'g');group.classList.add('progress-ring__rotation');
    for(const name of ['grow','shrink']){const circle=document.createElementNS(svg.namespaceURI,'circle');circle.setAttribute('cx','8');circle.setAttribute('cy','8');circle.setAttribute('r','7');circle.setAttribute('pathLength','100');circle.classList.add('progress-ring__arc','progress-ring__arc--'+name);group.append(circle);}
    svg.append(group);host.append(svg);
  }

  function initializeProcessStatus(host){
    if(host.dataset.processInitialized)return;host.dataset.processInitialized='true';
    const update=()=>host.style.setProperty('--process-visible-rows',String(Math.max(1,Math.min(200,Math.floor(Number(host.dataset.processRows)||3)))));
    new MutationObserver(update).observe(host,{attributes:true,attributeFilter:['data-process-rows']});update();
  }
  const progressBars=new WeakMap();
  function initializeProgressBar(progress){
    if(progressBars.has(progress))return;
    progress.dataset.progressInitialized='true';
    const host=document.createElement('span');host.className='progress-control';if(progress.dataset.width){host.dataset.width=progress.dataset.width;delete progress.dataset.width;}progress.before(host);host.append(progress);
    for(const name of ['first','second']){const band=document.createElement('span');band.className='progress-control__band progress-control__band--'+name;band.setAttribute('aria-hidden','true');host.append(band);}
    const update=()=>{for(const [attribute,css]of [['data-paused','progress-bar--paused'],['data-error','progress-bar--error']])if(progress.hasAttribute(attribute))progress.classList.add(css);else progress.classList.remove(css);};
    if(progress.hasAttribute('data-paused')||progress.hasAttribute('data-error'))update();new MutationObserver(update).observe(progress,{attributes:true,attributeFilter:['data-paused','data-error']});
    progressBars.set(progress,Object.freeze({get value(){return progress.value;},setValue:value=>{if(!Number.isFinite(value))throw new TypeError('Progress value must be finite');progress.value=value;},get isIndeterminate(){return !progress.hasAttribute('value');},setIndeterminate:value=>{if(value)progress.removeAttribute('value');else if(!progress.hasAttribute('value'))progress.value=0;},setPaused:value=>progress.toggleAttribute('data-paused',Boolean(value)),setError:value=>progress.toggleAttribute('data-error',Boolean(value))}));
  }

  function initializeSizing(host){
    if(host.dataset.sizeInitialized)return;host.dataset.sizeInitialized='true';host.classList.add('sized-control');
    const update=()=>{for(const dimension of ['width','height']){const value=host.dataset[dimension];if(value&&/^\d+(\.\d+)?$/.test(value))host.style.setProperty('--control-'+dimension+'-parameter',Math.min(10000,Number(value))+'px');else host.style.removeProperty('--control-'+dimension+'-parameter');}};
    update();new MutationObserver(update).observe(host,{attributes:true,attributeFilter:['data-width','data-height']});
  }
  const expanders=new WeakMap();
  function initializeExpander(host){
    if(expanders.has(host))return expanders.get(host);
    const summary=host.querySelector('summary'),content=host.querySelector('.disclosure__content');if(!summary||!content)return;
    host.dataset.expanderInitialized='true';let animation,expanded=host.open;
    function setExpanded(value){
      value=!!value;if(value===expanded)return;expanded=value;animation?.cancel();animation=null;
      emit(host,value?'expanding':'collapsing',{isExpanded:value});
      emit(host,'expandedChanged',{isExpanded:value});
      if(value)host.open=true;
      const height=content.getBoundingClientRect().height,closing=!value;
      const finish=()=>{host.open=value;animation=null;emit(host,value?'expanded':'collapsed',{isExpanded:value});};
      if(reducedMotion.matches){finish();return;}
      const metrics=getComputedStyle(host);
      animation=content.animate([{height:closing?height+'px':'0px',translate:'0 '+(closing?0:(host.dataset.direction==='up'?height:-height))+'px',overflow:'hidden'},{height:closing?'0px':height+'px',translate:'0 '+(closing?(host.dataset.direction==='up'?height:-height):0)+'px',overflow:'hidden'}],{duration:parseFloat(metrics.getPropertyValue(closing?'--expander-collapse-duration':'--expander-expand-duration')),easing:metrics.getPropertyValue(closing?'--expander-collapse-easing':'--motion-easing').trim()});animation.onfinish=finish;
    }
    summary.addEventListener('click',event=>{if(host.dataset.controlDisabled)return;event.preventDefault();setExpanded(!expanded);});
    host.addEventListener('toggle',()=>{if(!animation&&expanded!==host.open){expanded=host.open;emit(host,'expandedChanged',{isExpanded:expanded});emit(host,expanded?'expanded':'collapsed',{isExpanded:expanded});}});
    const api={setExpanded,get isExpanded(){return expanded;}};expanders.set(host,api);return api;
  }
  async function copyText(text){
    try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(String(text));return true;}}catch{}
    const before=document.activeElement,selection=getSelection(),ranges=Array.from({length:selection.rangeCount},(_,i)=>selection.getRangeAt(i).cloneRange()),field=document.createElement('textarea');field.className='source-copy-buffer';field.value=String(text);document.body.append(field);field.focus({preventScroll:true});field.select();let copied=false;try{copied=document.execCommand('copy');}catch{}field.remove();selection.removeAllRanges();ranges.forEach(range=>selection.addRange(range));before?.focus({preventScroll:true});return copied;
  }
  function initializeCopyValue(button){if(button.dataset.copyInitialized)return;button.dataset.copyInitialized='true';button.addEventListener('click',async()=>{const copied=await copyText(button.dataset.copyValue);emit(button,'copied',{copied,text:button.dataset.copyValue});});}
  function initializeSourceDrawer(drawer){
    if(drawer.dataset.copyInitialized)return;drawer.dataset.copyInitialized='true';
    drawer.querySelectorAll('[data-copy-source]').forEach(button=>button.addEventListener('click',async()=>{const block=button.closest('.source-code')||drawer,source=block.querySelector('code').textContent,status=block.querySelector('[data-copy-status]'),copied=await copyText(source);
      if(status)status.textContent=copied?'Copied to clipboard.':'Select the code and copy it.';
    }));
  }
  // Pass 3 controls. Gallery source and sample contracts: PASS3_GALLERY_CONTRACT.md.
  const appBars = new WeakMap(), commandBars = new WeakMap(), menuBars = new WeakMap(), calendars = new WeakMap(), timePickers = new WeakMap();
  let dateTimeRegion;
  const regionalLocale = host => { for(const candidate of [host.lang,dateTimeRegion?.locale,navigator.language,'en-US']) { if(!candidate)continue;try{return Intl.getCanonicalLocales(candidate.replace(/_/g,'-').split('@')[0])[0];}catch{}} return 'en-US'; };
  window.chrome?.webview?.addEventListener('message', event => {
    let data=event.data; if(typeof data==='string'){try{data=JSON.parse(data);}catch{return;}}
    if(data?.type!=='winUIRegionSettings'||data.schemaVersion!==1||typeof data.locale!=='string'||data.locale.length>84||![12,24].includes(data.hourClock))return;
    try { new Intl.DateTimeFormat(data.locale); } catch { return; }
    if(dateTimeRegion?.locale===data.locale&&dateTimeRegion?.hourClock===data.hourClock)return;
    dateTimeRegion={locale:data.locale,hourClock:data.hourClock};
    window.dispatchEvent(new Event('winuiRegionChanged'));
  });
  const descendants = (root, selector) => Array.from(root.querySelectorAll(selector));
  const visibleControl = node => node.isConnected && node.getClientRects().length && !disabledItem(node) && !node.closest('[inert],[hidden]');
  const eventFor = (node, name, detail) => node.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
  const element = (tag, className, text) => { const node = document.createElement(tag); node.className = className; if (text !== undefined) node.textContent = text; return node; };
  const controlButton = (className, text, label) => { const node = element('button', className, text); node.type = 'button'; if (label) node.setAttribute('aria-label', label); return node; };
  // Concise light-DOM authoring. See AUTHORING_CONTRACT.md. Constructors and
  // connection callbacks never hydrate partially parsed application children.
  const authoredButtons = new WeakMap(), authoredBars = new WeakMap(), appBarSeparators = new WeakMap(), commandOwners = new WeakMap();
  function calculatedSettings(values) {
    const object={};for(const name of Object.keys(values))Object.defineProperty(object,name,{enumerable:true,get:()=>values[name]});
    return {values,object:Object.freeze(object)};
  }
  const templateRect=(width=0,height=0)=>Object.freeze({x:0,y:0,width,height});
  const zeroThickness=Object.freeze({left:0,top:0,right:0,bottom:0});
  const commandTags = 'winui-appbar-button,winui-appbar-toggle-button,winui-appbar-separator';
  const commandElements = commandTags + ',button[data-appbar],.appbar-separator';
  function commandSlotChanged(node) { commandOwners.get(node)?.model.slotChanged(node); }
  // BEGIN GENERATED SEGOE NAMES
  // Microsoft Gallery 05939cc7d48fc0d7288ff3c89ced86cf1a08eb9d; MIT notice in icon-library.b64.
  const commandSymbols = {"GlobalNavButton":"E700","Wifi":"E701","Bluetooth":"E702","Connect":"E703","InternetSharing":"E704","VPN":"E705","Brightness":"E706","MapPin":"E707","QuietHours":"E708","Airplane":"E709","Tablet":"E70A","QuickNote":"E70B","RememberedDevice":"E70C","ChevronDown":"E70D","ChevronUp":"E70E","Edit":"E70F","Add":"E710","Cancel":"E711","More":"E712","Settings":"E713","Video":"E714","Mail":"E715","People":"E716","Phone":"E717","Pin":"E718","Shop":"E719","Stop":"E71A","Link":"E71B","Filter":"E71C","AllApps":"E71D","Zoom":"E71E","ZoomOut":"E71F","Microphone":"E720","Search":"E721","Camera":"E722","Attach":"E723","Send":"E724","SendFill":"E725","WalkSolid":"E726","InPrivate":"E727","FavoriteList":"E728","PageSolid":"E729","Forward":"E72A","Back":"E72B","Refresh":"E72C","Share":"E72D","Lock":"E72E","ReportHacked":"E730","EMI":"E731","Blocked":"E733","FavoriteStar":"E734","FavoriteStarFill":"E735","ReadingMode":"E736","Favicon":"E737","Remove":"E738","Checkbox":"E739","CheckboxComposite":"E73A","CheckboxFill":"E73B","CheckboxIndeterminate":"E73C","CheckboxCompositeReversed":"E73D","CheckMark":"E73E","BackToWindow":"E73F","FullScreen":"E740","ResizeTouchLarger":"E741","ResizeTouchSmaller":"E742","ResizeMouseSmall":"E743","ResizeMouseMedium":"E744","ResizeMouseWide":"E745","ResizeMouseTall":"E746","ResizeMouseLarge":"E747","SwitchUser":"E748","Print":"E749","Up":"E74A","Down":"E74B","OEM":"E74C","Delete":"E74D","Save":"E74E","Mute":"E74F","BackSpaceQWERTY":"E750","ReturnKey":"E751","UpArrowShiftKey":"E752","Cloud":"E753","Flashlight":"E754","RotationLock":"E755","CommandPrompt":"E756","SIPMove":"E759","SIPUndock":"E75A","SIPRedock":"E75B","EraseTool":"E75C","UnderscoreSpace":"E75D","GripperTool":"E75E","Dialpad":"E75F","PageLeft":"E760","PageRight":"E761","MultiSelect":"E762","KeyboardLeftHanded":"E763","KeyboardRightHanded":"E764","KeyboardClassic":"E765","KeyboardSplit":"E766","Volume":"E767","Play":"E768","Pause":"E769","ChevronLeft":"E76B","ChevronRight":"E76C","InkingTool":"E76D","Emoji2":"E76E","GripperBarHorizontal":"E76F","System":"E770","Personalize":"E771","Devices":"E772","SearchAndApps":"E773","Globe":"E774","TimeLanguage":"E775","EaseOfAccess":"E776","UpdateRestore":"E777","HangUp":"E778","ContactInfo":"E779","Unpin":"E77A","Contact":"E77B","Memo":"E77C","IncomingCall":"E77E","Paste":"E77F","PhoneBook":"E780","LEDLight":"E781","Error":"E783","GripperBarVertical":"E784","Unlock":"E785","Slideshow":"E786","Calendar":"E787","GripperResize":"E788","Megaphone":"E789","Trim":"E78A","NewWindow":"E78B","SaveLocal":"E78C","Color":"E790","DataSense":"E791","SaveAs":"E792","Light":"E793","Effects":"E794","AspectRatio":"E799","Contrast":"E7A1","DataSenseBar":"E7A5","Redo":"E7A6","Undo":"E7A7","Crop":"E7A8","PhotoCollection":"E7AA","OpenWith":"E7AC","Rotate":"E7AD","RedEye":"E7B3","SetlockScreen":"E7B5","MapPin2":"E7B7","Package":"E7B8","Warning":"E7BA","ReadingList":"E7BC","Education":"E7BE","ShoppingCart":"E7BF","Train":"E7C0","Flag":"E7C1","Move":"E7C2","Page":"E7C3","TaskView":"E7C4","BrowsePhotos":"E7C5","HalfStarLeft":"E7C6","HalfStarRight":"E7C7","Record":"E7C8","TouchPointer":"E7C9","LangJPN":"E7DE","Ferry":"E7E3","Highlight":"E7E6","ActionCenterNotification":"E7E7","PowerButton":"E7E8","ResizeTouchNarrower":"E7EA","ResizeTouchShorter":"E7EB","DrivingMode":"E7EC","RingerSilent":"E7ED","OtherUser":"E7EE","Admin":"E7EF","CC":"E7F0","SDCard":"E7F1","CallForwarding":"E7F2","SettingsDisplaySound":"E7F3","TVMonitor":"E7F4","Speakers":"E7F5","Headphone":"E7F6","DeviceLaptopPic":"E7F7","DeviceLaptopNoPic":"E7F8","DeviceMonitorRightPic":"E7F9","DeviceMonitorLeftPic":"E7FA","DeviceMonitorNoPic":"E7FB","Game":"E7FC","HorizontalTabKey":"E7FD","Nav2DMapView":"E800","StreetsideSplitMinimize":"E802","StreetsideSplitExpand":"E803","Car":"E804","Walk":"E805","Bus":"E806","TiltUp":"E809","TiltDown":"E80A","CallControl":"E80B","RotateMapRight":"E80C","RotateMapLeft":"E80D","Home":"E80F","ParkingLocation":"E811","MapCompassTop":"E812","MapCompassBottom":"E813","IncidentTriangle":"E814","Touch":"E815","MapDirections":"E816","StartPoint":"E819","StopPoint":"E81A","EndPoint":"E81B","History":"E81C","Location":"E81D","MapLayers":"E81E","Accident":"E81F","Work":"E821","Construction":"E822","Recent":"E823","Bank":"E825","DownloadMap":"E826","InkingToolFill2":"E829","HighlightFill2":"E82A","EraseToolFill":"E82B","EraseToolFill2":"E82C","Dictionary":"E82D","DictionaryAdd":"E82E","ToolTip":"E82F","ChromeBack":"E830","ProvisioningPackage":"E835","AddRemoteDevice":"E836","FolderOpen":"E838","Ethernet":"E839","ShareBroadband":"E83A","DirectAccess":"E83B","DialUp":"E83C","DefenderApp":"E83D","BatteryCharging9":"E83E","Battery10":"E83F","Pinned":"E840","PinFill":"E841","PinnedFill":"E842","PeriodKey":"E843","PuncKey":"E844","RevToggleKey":"E845","RightArrowKeyTime1":"E846","RightArrowKeyTime2":"E847","LeftQuote":"E848","RightQuote":"E849","DownShiftKey":"E84A","UpShiftKey":"E84B","PuncKey0":"E84C","PuncKeyLeftBottom":"E84D","RightArrowKeyTime3":"E84E","RightArrowKeyTime4":"E84F","Battery0":"E850","Battery1":"E851","Battery2":"E852","Battery3":"E853","Battery4":"E854","Battery5":"E855","Battery6":"E856","Battery7":"E857","Battery8":"E858","Battery9":"E859","BatteryCharging0":"E85A","BatteryCharging1":"E85B","BatteryCharging2":"E85C","BatteryCharging3":"E85D","BatteryCharging4":"E85E","BatteryCharging5":"E85F","BatteryCharging6":"E860","BatteryCharging7":"E861","BatteryCharging8":"E862","BatterySaver0":"E863","BatterySaver1":"E864","BatterySaver2":"E865","BatterySaver3":"E866","BatterySaver4":"E867","BatterySaver5":"E868","BatterySaver6":"E869","BatterySaver7":"E86A","BatterySaver8":"E86B","SignalBars1":"E86C","SignalBars2":"E86D","SignalBars3":"E86E","SignalBars4":"E86F","SignalBars5":"E870","SignalNotConnected":"E871","Wifi1":"E872","Wifi2":"E873","Wifi3":"E874","MobSIMLock":"E875","MobSIMMissing":"E876","Vibrate":"E877","RoamingInternational":"E878","RoamingDomestic":"E879","CallForwardInternational":"E87A","CallForwardRoaming":"E87B","JpnRomanji":"E87C","JpnRomanjiLock":"E87D","JpnRomanjiShift":"E87E","JpnRomanjiShiftLock":"E87F","StatusDataTransfer":"E880","StatusDataTransferVPN":"E881","StatusDualSIM2":"E882","StatusDualSIM2VPN":"E883","StatusDualSIM1":"E884","StatusDualSIM1VPN":"E885","StatusSGLTE":"E886","StatusSGLTECell":"E887","StatusSGLTEDataVPN":"E888","StatusVPN":"E889","WifiHotspot":"E88A","LanguageKor":"E88B","LanguageCht":"E88C","LanguageChs":"E88D","USB":"E88E","InkingToolFill":"E88F","View":"E890","HighlightFill":"E891","Previous":"E892","Next":"E893","Clear":"E894","Sync":"E895","Download":"E896","Help":"E897","Upload":"E898","Emoji":"E899","TwoPage":"E89A","LeaveChat":"E89B","MailForward":"E89C","RotateCamera":"E89E","ClosePane":"E89F","OpenPane":"E8A0","PreviewLink":"E8A1","AttachCamera":"E8A2","ZoomIn":"E8A3","Bookmarks":"E8A4","Document":"E8A5","ProtectedDocument":"E8A6","OpenInNewWindow":"E8A7","MailFill":"E8A8","ViewAll":"E8A9","VideoChat":"E8AA","Switch":"E8AB","Rename":"E8AC","Go":"E8AD","SurfaceHub":"E8AE","Remote":"E8AF","Click":"E8B0","Shuffle":"E8B1","Movies":"E8B2","SelectAll":"E8B3","Orientation":"E8B4","Import":"E8B5","ImportAll":"E8B6","Folder":"E8B7","Webcam":"E8B8","Picture":"E8B9","Caption":"E8BA","ChromeClose":"E8BB","ShowResults":"E8BC","Message":"E8BD","Leaf":"E8BE","CalendarDay":"E8BF","CalendarWeek":"E8C0","Characters":"E8C1","MailReplyAll":"E8C2","Read":"E8C3","ShowBcc":"E8C4","HideBcc":"E8C5","Cut":"E8C6","PaymentCard":"E8C7","Copy":"E8C8","Important":"E8C9","MailReply":"E8CA","Sort":"E8CB","MobileTablet":"E8CC","DisconnectDrive":"E8CD","MapDrive":"E8CE","ContactPresence":"E8CF","Priority":"E8D0","GotoToday":"E8D1","Font":"E8D2","FontColor":"E8D3","Contact2":"E8D4","FolderFill":"E8D5","Audio":"E8D6","Permissions":"E8D7","DisableUpdates":"E8D8","Unfavorite":"E8D9","OpenLocal":"E8DA","Italic":"E8DB","Underline":"E8DC","Bold":"E8DD","MoveToFolder":"E8DE","LikeDislike":"E8DF","Dislike":"E8E0","Like":"E8E1","AlignRight":"E8E2","AlignCenter":"E8E3","AlignLeft":"E8E4","OpenFile":"E8E5","ClearSelection":"E8E6","FontDecrease":"E8E7","FontIncrease":"E8E8","FontSize":"E8E9","CellPhone":"E8EA","Reshare":"E8EB","Tag":"E8EC","RepeatOne":"E8ED","RepeatAll":"E8EE","Calculator":"E8EF","Directions":"E8F0","Library":"E8F1","ChatBubbles":"E8F2","PostUpdate":"E8F3","NewFolder":"E8F4","CalendarReply":"E8F5","UnsyncFolder":"E8F6","SyncFolder":"E8F7","BlockContact":"E8F8","SwitchApps":"E8F9","AddFriend":"E8FA","Accept":"E8FB","GoToStart":"E8FC","BulletedList":"E8FD","Scan":"E8FE","Preview":"E8FF","Group":"E902","ZeroBars":"E904","OneBar":"E905","TwoBars":"E906","ThreeBars":"E907","FourBars":"E908","World":"E909","Comment":"E90A","MusicInfo":"E90B","DockLeft":"E90C","DockRight":"E90D","DockBottom":"E90E","Repair":"E90F","Accounts":"E910","DullSound":"E911","Manage":"E912","Street":"E913","Printer3D":"E914","RadioBullet":"E915","Stopwatch":"E916","Clock":"E917","Photo":"E91B","ActionCenter":"E91C","FullCircleMask":"E91F","ChromeMinimize":"E921","ChromeMaximize":"E922","ChromeRestore":"E923","Annotation":"E924","BackSpaceQWERTYSm":"E925","BackSpaceQWERTYMd":"E926","Swipe":"E927","Fingerprint":"E928","Handwriting":"E929","ChromeBackToWindow":"E92C","ChromeFullScreen":"E92D","KeyboardStandard":"E92E","KeyboardDismiss":"E92F","Completed":"E930","ChromeAnnotate":"E931","Label":"E932","IBeam":"E933","IBeamOutline":"E934","FlickDown":"E935","FlickUp":"E936","FlickLeft":"E937","FlickRight":"E938","FeedbackApp":"E939","MiniExpand":"E93A","MusicAlbum":"E93C","Streaming":"E93E","Code":"E943","ReturnToWindow":"E944","LightningBolt":"E945","Info":"E946","CalculatorMultiply":"E947","CalculatorAddition":"E948","CalculatorSubtract":"E949","CalculatorDivide":"E94A","CalculatorSquareroot":"E94B","CalculatorPercentage":"E94C","CalculatorNegate":"E94D","CalculatorEqualTo":"E94E","CalculatorBackspace":"E94F","Component":"E950","DMC":"E951","Dock":"E952","MultimediaDMS":"E953","MultimediaDVR":"E954","MultimediaPMP":"E955","PrintfaxPrinterFile":"E956","Sensor":"E957","StorageOptical":"E958","Communications":"E95A","Headset":"E95B","Projector":"E95D","Health":"E95E","Wire":"E95F","Webcam2":"E960","Input":"E961","Mouse":"E962","Smartcard":"E963","SmartcardVirtual":"E964","MediaStorageTower":"E965","ReturnKeySm":"E966","GameConsole":"E967","Network":"E968","StorageNetworkWireless":"E969","StorageTape":"E96A","ChevronUpSmall":"E96D","ChevronDownSmall":"E96E","ChevronLeftSmall":"E96F","ChevronRightSmall":"E970","ChevronUpMed":"E971","ChevronDownMed":"E972","ChevronLeftMed":"E973","ChevronRightMed":"E974","Devices2":"E975","ExpandTile":"E976","PC1":"E977","PresenceChicklet":"E978","PresenceChickletVideo":"E979","Reply":"E97A","SetTile":"E97B","Type":"E97C","Korean":"E97D","HalfAlpha":"E97E","FullAlpha":"E97F","Key12On":"E980","ChineseChangjie":"E981","QWERTYOn":"E982","QWERTYOff":"E983","ChineseQuick":"E984","Japanese":"E985","FullHiragana":"E986","FullKatakana":"E987","HalfKatakana":"E988","ChineseBoPoMoFo":"E989","ChinesePinyin":"E98A","ConstructionCone":"E98F","XboxOneConsole":"E990","Volume0":"E992","Volume1":"E993","Volume2":"E994","Volume3":"E995","BatteryUnknown":"E996","WifiAttentionOverlay":"E998","Robot":"E99A","TapAndSend":"E9A1","TextBulletListSquareSparkle":"E9A3","TextBulletListSquare":"E9A4","FitPage":"E9A6","PasswordKeyShow":"E9A8","PasswordKeyHide":"E9A9","BidiLtr":"E9AA","BidiRtl":"E9AB","ForwardSm":"E9AC","CommaKey":"E9AD","DashKey":"E9AE","DullSoundKey":"E9AF","HalfDullSound":"E9B0","RightDoubleQuote":"E9B1","LeftDoubleQuote":"E9B2","PuncKeyRightBottom":"E9B3","PuncKey1":"E9B4","PuncKey2":"E9B5","PuncKey3":"E9B6","PuncKey4":"E9B7","PuncKey5":"E9B8","PuncKey6":"E9B9","PuncKey9":"E9BA","PuncKey7":"E9BB","PuncKey8":"E9BC","Frigid":"E9CA","Unknown":"E9CE","AreaChart":"E9D2","CheckList":"E9D5","Diagnostic":"E9D9","Equalizer":"E9E9","Process":"E9F3","Processing":"E9F5","ReportDocument":"E9F9","VideoSolid":"EA0C","MixedMediaBadge":"EA0D","DisconnectDisplay":"EA14","Shield":"EA18","Info2":"EA1F","ActionCenterAsterisk":"EA21","Beta":"EA24","SaveCopy":"EA35","List":"EA37","Asterisk":"EA38","ErrorBadge":"EA39","CircleRing":"EA3A","CircleFill":"EA3B","MergeCall":"EA3C","PrivateCall":"EA3D","Record2":"EA3F","AllAppsMirrored":"EA40","BookmarksMirrored":"EA41","BulletedListMirrored":"EA42","CallForwardInternationalMirrored":"EA43","CallForwardRoamingMirrored":"EA44","ChromeBackMirrored":"EA47","ClearSelectionMirrored":"EA48","ClosePaneMirrored":"EA49","ContactInfoMirrored":"EA4A","DockRightMirrored":"EA4B","DockLeftMirrored":"EA4C","ExpandTileMirrored":"EA4E","GoMirrored":"EA4F","GripperResizeMirrored":"EA50","HelpMirrored":"EA51","ImportMirrored":"EA52","ImportAllMirrored":"EA53","LeaveChatMirrored":"EA54","ListMirrored":"EA55","MailForwardMirrored":"EA56","MailReplyMirrored":"EA57","MailReplyAllMirrored":"EA58","OpenPaneMirrored":"EA5B","OpenWithMirrored":"EA5C","ParkingLocationMirrored":"EA5E","ResizeMouseMediumMirrored":"EA5F","ResizeMouseSmallMirrored":"EA60","ResizeMouseTallMirrored":"EA61","ResizeTouchNarrowerMirrored":"EA62","SendMirrored":"EA63","SendFillMirrored":"EA64","ShowResultsMirrored":"EA65","Media":"EA69","SyncError":"EA6A","Devices3":"EA6C","SlowMotionOn":"EA79","Lightbulb":"EA80","StatusCircle":"EA81","StatusTriangle":"EA82","StatusError":"EA83","StatusWarning":"EA84","VolumeDisabled":"EA85","Puzzle":"EA86","CalendarSolid":"EA89","HomeSolid":"EA8A","ParkingLocationSolid":"EA8B","ContactSolid":"EA8C","ConstructionSolid":"EA8D","AccidentSolid":"EA8E","Ringer":"EA8F","PDF":"EA90","ThoughtBubble":"EA91","HeartBroken":"EA92","BatteryCharging10":"EA93","BatterySaver9":"EA94","BatterySaver10":"EA95","CallForwardingMirrored":"EA97","MultiSelectMirrored":"EA98","Broom":"EA99","SignalBarsAni1":"EAA1","SignalBarsAni2":"EAA2","SignalBarsAni3":"EAA3","EthernetAni1":"EAA4","WifiAni1":"EAA5","WifiAni2":"EAA8","EmojiEdit":"EAAA","SurfaceTypecover":"EAAE","ChatSparkle":"EAB7","CellFlowVertical":"EABB","WindowsStudioEffects":"EABC","PortraitBlur":"EABE","ForwardCall":"EAC2","DesktopLeafTwo":"EAC7","Emojiplay":"EAD4","EmojiBrush":"EAD5","EyeTracking":"EAD6","EyeTrackingText":"EAD7","LiveCaptionsSparkle":"EAD8","Trackers":"EADF","Market":"EAFC","PieSingle":"EB05","StockUp":"EB0F","StockDown":"EB11","MobBatteryUnknownCharging":"EB17","ClicktoDoOff":"EB19","BatteryUnknownCharging":"EB1A","ClicktoDo":"EB1D","Glasses2":"EB25","StatusSquareOuter":"EB33","StatusSquarePause":"EB34","GenericApp":"EB3B","Design":"EB3C","Website":"EB41","Drop":"EB42","Radar":"EB44","BusSolid":"EB47","FerrySolid":"EB48","StartPointSolid":"EB49","StopPointSolid":"EB4A","EndPointSolid":"EB4B","AirplaneSolid":"EB4C","TrainSolid":"EB4D","WorkSolid":"EB4E","ReminderFill":"EB4F","Reminder":"EB50","Heart":"EB51","HeartFill":"EB52","EthernetError":"EB55","EthernetWarning":"EB56","StatusConnecting1":"EB57","StatusConnecting2":"EB58","StatusUnsecure":"EB59","WifiError0":"EB5A","WifiError1":"EB5B","WifiError2":"EB5C","WifiError3":"EB5D","WifiError4":"EB5E","WifiWarning0":"EB5F","WifiWarning1":"EB60","WifiWarning2":"EB61","WifiWarning3":"EB62","WifiWarning4":"EB63","Devices4":"EB66","NUIIris":"EB67","NUIFace":"EB68","GatewayRouter":"EB77","SummarizeSparkle":"EB78","EditMirrored":"EB7E","NUIFPStartSlideHand":"EB82","NUIFPStartSlideAction":"EB83","NUIFPContinueSlideHand":"EB84","NUIFPContinueSlideAction":"EB85","NUIFPRollRightHand":"EB86","NUIFPRollRightHandAction":"EB87","NUIFPRollLeftHand":"EB88","NUIFPRollLeftAction":"EB89","NUIFPPressHand":"EB8A","NUIFPPressAction":"EB8B","NUIFPPressRepeatHand":"EB8C","NUIFPPressRepeatAction":"EB8D","StatusErrorFull":"EB90","TaskViewExpanded":"EB91","Certificate":"EB95","BackSpaceQWERTYLg":"EB96","ReturnKeyLg":"EB97","FastForward":"EB9D","Rewind":"EB9E","Photo2":"EB9F","MobBattery0":"EBA0","MobBattery1":"EBA1","MobBattery2":"EBA2","MobBattery3":"EBA3","MobBattery4":"EBA4","MobBattery5":"EBA5","MobBattery6":"EBA6","MobBattery7":"EBA7","MobBattery8":"EBA8","MobBattery9":"EBA9","MobBattery10":"EBAA","MobBatteryCharging0":"EBAB","MobBatteryCharging1":"EBAC","MobBatteryCharging2":"EBAD","MobBatteryCharging3":"EBAE","MobBatteryCharging4":"EBAF","MobBatteryCharging5":"EBB0","MobBatteryCharging6":"EBB1","MobBatteryCharging7":"EBB2","MobBatteryCharging8":"EBB3","MobBatteryCharging9":"EBB4","MobBatteryCharging10":"EBB5","MobBatterySaver0":"EBB6","MobBatterySaver1":"EBB7","MobBatterySaver2":"EBB8","MobBatterySaver3":"EBB9","MobBatterySaver4":"EBBA","MobBatterySaver5":"EBBB","MobBatterySaver6":"EBBC","MobBatterySaver7":"EBBD","MobBatterySaver8":"EBBE","MobBatterySaver9":"EBBF","MobBatterySaver10":"EBC0","DictionaryCloud":"EBC3","ResetDrive":"EBC4","VolumeBars":"EBC5","Project":"EBC6","SystemInPrivate":"EBC8","SystemInPrivateFilled":"EBC9","AdjustHologram":"EBD2","CloudDownload":"EBD3","MobWifiCallBars":"EBD4","MobWifiCall0":"EBD5","MobWifiCall1":"EBD6","MobWifiCall2":"EBD7","MobWifiCall3":"EBD8","MobWifiCall4":"EBD9","Family":"EBDA","LockFeedback":"EBDB","DeviceDiscovery":"EBDE","WindDirection":"EBE6","RightArrowKeyTime0":"EBE7","Bug":"EBE8","TabletMode":"EBFC","StatusCircleLeft":"EBFD","StatusTriangleLeft":"EBFE","StatusErrorLeft":"EBFF","StatusWarningLeft":"EC00","MobBatteryUnknown":"EC02","NetworkTower":"EC05","CityNext":"EC06","CityNext2":"EC07","Courthouse":"EC08","Groceries":"EC09","Sustainable":"EC0A","BuildingEnergy":"EC0B","ToggleFilled":"EC11","ToggleBorder":"EC12","SliderThumb":"EC13","ToggleThumb":"EC14","MiracastLogoSmall":"EC15","MiracastLogoLarge":"EC16","PLAP":"EC19","Badge":"EC1B","SignalRoaming":"EC1E","MobileLocked":"EC20","InsiderHubApp":"EC24","PersonalFolder":"EC25","HomeGroup":"EC26","MyNetwork":"EC27","KeyboardFull":"EC31","Cafe":"EC32","FormatText":"EC34","MobSignal1":"EC37","MobSignal2":"EC38","MobSignal3":"EC39","MobSignal4":"EC3A","MobSignal5":"EC3B","MobWifi1":"EC3C","MobWifi2":"EC3D","MobWifi3":"EC3E","MobWifi4":"EC3F","MobAirplane":"EC40","MobBluetooth":"EC41","MobActionCenter":"EC42","MobLocation":"EC43","MobWifiHotspot":"EC44","LanguageJpn":"EC45","MobQuietHours":"EC46","MobDrivingMode":"EC47","SpeedOff":"EC48","SpeedMedium":"EC49","SpeedHigh":"EC4A","ThisPC":"EC4E","MusicNote":"EC4F","FileExplorer":"EC50","FileExplorerApp":"EC51","LeftArrowKeyTime0":"EC52","MicOff":"EC54","MicSleep":"EC55","MicError":"EC56","PlaybackRate1x":"EC57","PlaybackRateOther":"EC58","CashDrawer":"EC59","BarcodeScanner":"EC5A","ReceiptPrinter":"EC5B","MagStripeReader":"EC5C","CompletedSolid":"EC61","CompanionApp":"EC64","Favicon2":"EC6C","SwipeRevealArt":"EC6D","MicOn":"EC71","MicClipping":"EC72","TabletSelected":"EC74","MobileSelected":"EC75","LaptopSelected":"EC76","TVMonitorSelected":"EC77","DeveloperTools":"EC7A","MobCallForwarding":"EC7E","MobCallForwardingMirrored":"EC7F","BodyCam":"EC80","PoliceCar":"EC81","UpdateStatusDot2":"EC83","Draw":"EC87","DrawSolid":"EC88","LowerBrightness":"EC8A","ScrollUpDown":"EC8F","Uninstall":"EC91","DateTime":"EC92","HoloLens":"EC94","CloudNotSynced":"EC9C","Tiles":"ECA5","PartyLeader":"ECA7","AppIconDefault":"ECAA","Calories":"ECAD","POI":"ECAF","BandBattery0":"ECB9","BandBattery1":"ECBA","BandBattery2":"ECBB","BandBattery3":"ECBC","BandBattery4":"ECBD","BandBattery5":"ECBE","BandBattery6":"ECBF","AddSurfaceHub":"ECC4","DevUpdate":"ECC5","Unit":"ECC6","AddTo":"ECC8","RemoveFrom":"ECC9","RadioBtnOff":"ECCA","RadioBtnOn":"ECCB","RadioBullet2":"ECCC","ExploreContent":"ECCD","Blocked2":"ECE4","ScrollMode":"ECE7","ZoomMode":"ECE8","PanMode":"ECE9","WiredUSB":"ECF0","WirelessUSB":"ECF1","USBSafeConnect":"ECF3","ActionCenterNotificationMirrored":"ED0C","ActionCenterMirrored":"ED0D","SubscriptionAdd":"ED0E","ResetDevice":"ED10","SubscriptionAddMirrored":"ED11","QRCode":"ED14","Feedback":"ED15","Hide":"ED1A","Subtitles":"ED1E","SubtitlesAudio":"ED1F","RestartUpdate2":"ED21","OpenFolderHorizontal":"ED25","CalendarMirrored":"ED28","MobeSIM":"ED2A","MobeSIMNoProfile":"ED2B","MobeSIMLocked":"ED2C","MobeSIMBusy":"ED2D","SignalError":"ED2E","StreamingEnterprise":"ED2F","Headphone0":"ED30","Headphone1":"ED31","Headphone2":"ED32","Headphone3":"ED33","Apps":"ED35","SearchSparkle":"ED37","KeyboardBrightness":"ED39","KeyboardLowerBrightness":"ED3A","SkipBack10":"ED3C","SkipForward30":"ED3D","TreeFolderFolder":"ED41","TreeFolderFolderFill":"ED42","TreeFolderFolderOpen":"ED43","TreeFolderFolderOpenFill":"ED44","MultimediaDMP":"ED47","KeyboardOneHanded":"ED4C","Narrator":"ED4D","EmojiTabPeople":"ED53","EmojiTabSmilesAnimals":"ED54","EmojiTabCelebrationObjects":"ED55","EmojiTabFoodPlants":"ED56","EmojiTabTransitPlaces":"ED57","EmojiTabSymbols":"ED58","EmojiTabTextSmiles":"ED59","EmojiTabFavorites":"ED5A","EmojiSwatch":"ED5B","ConnectApp":"ED5C","CompanionDeviceFramework":"ED5D","Ruler":"ED5E","FingerInking":"ED5F","StrokeErase":"ED60","PointErase":"ED61","ClearAllInk":"ED62","Pencil":"ED63","Marker":"ED64","InkingCaret":"ED65","InkingColorOutline":"ED66","InkingColorFill":"ED67","HardDrive":"EDA2","NetworkAdapter":"EDA3","Touchscreen":"EDA4","NetworkPrinter":"EDA5","CloudPrinter":"EDA6","KeyboardShortcut":"EDA7","BrushSize":"EDA8","NarratorForward":"EDA9","NarratorForwardMirrored":"EDAA","SyncBadge12":"EDAB","RingerBadge12":"EDAC","AsteriskBadge12":"EDAD","ErrorBadge12":"EDAE","CircleRingBadge12":"EDAF","CircleFillBadge12":"EDB0","ImportantBadge12":"EDB1","MailBadge12":"EDB3","PauseBadge12":"EDB4","PlayBadge12":"EDB5","PenWorkspace":"EDC6","CaretLeft8":"EDD5","CaretRight8":"EDD6","CaretUp8":"EDD7","CaretDown8":"EDD8","CaretLeftSolid8":"EDD9","CaretRightSolid8":"EDDA","CaretUpSolid8":"EDDB","CaretDownSolid8":"EDDC","Strikethrough":"EDE0","Export":"EDE1","ExportMirrored":"EDE2","ButtonMenu":"EDE3","CloudSearch":"EDE4","PinyinIMELogo":"EDE5","CalligraphyPen":"EDFB","ReplyMirrored":"EE35","LockscreenDesktop":"EE3F","TaskViewSettings":"EE40","FullHiraganaPrivateMode":"EE41","FullKatakanaPrivateMode":"EE42","HalfAlphaPrivateMode":"EE43","HalfKatakanaPrivateMode":"EE44","FullAlphaPrivateMode":"EE45","MiniExpand2Mirrored":"EE47","MiniContract2Mirrored":"EE49","Play36":"EE4A","PenPalette":"EE56","GuestUser":"EE57","SettingsBattery":"EE63","TaskbarPhone":"EE64","LockScreenGlance":"EE65","GenericScan":"EE6F","ImageExport":"EE71","WifiEthernet":"EE77","ActionCenterQuiet":"EE79","ActionCenterQuietNotification":"EE7A","FIDOPasskey":"EE7E","TrackersMirrored":"EE92","DateTimeMirrored":"EE93","Wheel":"EE94","StopSolid":"EE95","RAM":"EEA0","CPU":"EEA1","VirtualMachineGroup":"EEA3","ButtonView2":"EECA","PenWorkspaceMirrored":"EF15","PenPaletteMirrored":"EF16","StrokeEraseMirrored":"EF17","PointEraseMirrored":"EF18","ClearAllInkMirrored":"EF19","BackgroundToggle":"EF1F","Marquee":"EF20","ChromeCloseContrast":"EF2C","ChromeMinimizeContrast":"EF2D","ChromeMaximizeContrast":"EF2E","ChromeRestoreContrast":"EF2F","TrafficLight":"EF31","Replay":"EF3B","Eyedropper":"EF3C","LineDisplay":"EF3D","PINPad":"EF3E","SignatureCapture":"EF3F","ChipCardCreditCardReader":"EF40","MarketDown":"EF42","PlayerSettings":"EF58","TextEdit":"EF60","LandscapeOrientation":"EF6B","Flow":"EF90","PauseDurationVoice":"EF91","Touchpad":"EFA5","Speech":"EFA9","AppIconDefaultAdd":"EFDA","CRMScheduleReports":"EFFF","KnowledgeArticle":"F000","Relationship":"F003","ZipFolder":"F012","Widget":"F034","WidgetGear":"F035","WidgetAdd":"F036","PasteSparkle":"F03D","AdvancedPaste":"F03E","PortraitLight":"F06C","DefaultAPN":"F080","UserAPN":"F081","DoublePinyin":"F085","BlueLight":"F08C","CaretSolidLeft":"F08D","CaretSolidDown":"F08E","CaretSolidRight":"F08F","CaretSolidUp":"F090","ButtonA":"F093","ButtonB":"F094","ButtonY":"F095","ButtonX":"F096","ArrowUp8":"F0AD","ArrowDown8":"F0AE","ArrowRight8":"F0AF","ArrowLeft8":"F0B0","QuarentinedItems":"F0B2","QuarentinedItemsMirrored":"F0B3","Protractor":"F0B4","ChecklistMirrored":"F0B5","StatusCircle7":"F0B6","StatusCheckmark7":"F0B7","StatusErrorCircle7":"F0B8","Connected":"F0B9","PencilFill":"F0C6","CalligraphyFill":"F0C7","QuarterStarLeft":"F0CA","QuarterStarRight":"F0CB","ThreeQuarterStarLeft":"F0CC","ThreeQuarterStarRight":"F0CD","QuietHoursBadge12":"F0CE","BackMirrored":"F0D2","ForwardMirrored":"F0D3","ChromeBackContrast":"F0D5","ChromeBackContrastMirrored":"F0D6","ChromeBackToWindowContrast":"F0D7","ChromeFullScreenContrast":"F0D8","GridView":"F0E2","ClipboardList":"F0E3","ClipboardListMirrored":"F0E4","OutlineQuarterStarLeft":"F0E5","OutlineQuarterStarRight":"F0E6","OutlineHalfStarLeft":"F0E7","OutlineHalfStarRight":"F0E8","OutlineThreeQuarterStarLeft":"F0E9","OutlineThreeQuarterStarRight":"F0EA","SpatialVolume0":"F0EB","SpatialVolume1":"F0EC","SpatialVolume2":"F0ED","SpatialVolume3":"F0EE","ApplicationGuard":"F0EF","OutlineStarLeftHalf":"F0F7","OutlineStarRightHalf":"F0F8","ChromeAnnotateContrast":"F0F9","DefenderBadge12":"F0FB","DetachablePC":"F103","LeftStick":"F108","RightStick":"F109","TriggerLeft":"F10A","TriggerRight":"F10B","BumperLeft":"F10C","BumperRight":"F10D","Dpad":"F10E","EnglishPunctuation":"F110","ChinesePunctuation":"F111","ReadOutLoud":"F112","ProjectToDevice":"F117","HMD":"F119","CtrlSpatialRight":"F11B","TaskManagerApp":"F120","PaginationDotOutline10":"F126","PaginationDotSolid10":"F127","StrokeErase2":"F128","SmallErase":"F129","LargeErase":"F12A","FolderHorizontal":"F12B","MicrophoneListening":"F12E","StatusExclamationCircle7":"F12F","Video360":"F131","GiftboxOpen":"F133","StatusCircleOuter":"F136","StatusCircleInner":"F137","StatusCircleRing":"F138","StatusTriangleOuter":"F139","StatusTriangleInner":"F13A","StatusTriangleExclamation":"F13B","StatusCircleExclamation":"F13C","StatusCircleErrorX":"F13D","StatusCircleCheckmark":"F13E","StatusCircleInfo":"F13F","StatusCircleBlock":"F140","StatusCircleBlock2":"F141","StatusCircleQuestionMark":"F142","StatusCircleSync":"F143","Dial1":"F146","Dial2":"F147","Dial3":"F148","Dial4":"F149","Dial5":"F14A","Dial6":"F14B","Dial7":"F14C","Dial8":"F14D","Dial9":"F14E","Dial10":"F14F","Dial11":"F150","Dial12":"F151","Dial13":"F152","Dial14":"F153","Dial15":"F154","Dial16":"F155","DialShape1":"F156","DialShape2":"F157","DialShape3":"F158","DialShape4":"F159","ClosedCaptionsInternational":"F15F","TollSolid":"F161","TrafficCongestionSolid":"F163","ExploreContentSingle":"F164","CollapseContent":"F165","CollapseContentSingle":"F166","InfoSolid":"F167","GroupList":"F168","CaretBottomRightSolidCenter8":"F169","ProgressRingDots":"F16A","Checkbox14":"F16B","CheckboxComposite14":"F16C","CheckboxIndeterminateCombo14":"F16D","CheckboxIndeterminateCombo":"F16E","StatusPause7":"F175","StatusDiamondOuter":"F178","StatusDiamondInner":"F179","CharacterAppearance":"F17F","Lexicon":"F180","ScreenTime":"F182","HeadlessDevice":"F191","NetworkSharing":"F193","Beaker":"F196","EyeGaze":"F19D","ToggleLeft":"F19E","ToggleRight":"F19F","WindowsInsider":"F1AD","PowerButtonUpdate2":"F1B1","LassoSparkle":"F1B9","SquareSparkle":"F1BA","TextCursor2":"F1BB","Lasso":"F1BE","ChromeSwitch":"F1CB","ChromeSwitchContast":"F1CC","TranslateSparkle":"F1D4","RefineSparkle":"F1D5","ReformatSparkle":"F1D6","StatusCheckmark":"F1D8","StatusCheckmarkLeft":"F1D9","LeafTwo":"F1E8","GridviewGroup":"F207","KeyboardLeftAligned":"F20C","KeyboardRightAligned":"F20D","KeyboardSettings":"F210","NetworkPhysical":"F211","IOT":"F22C","UnknownMirrored":"F22E","GridViewSmall":"F232","ViewDashboard":"F246","ExploitProtectionSettings":"F259","KeyboardNarrow":"F260","Keyboard12Key":"F261","KeyboardDock":"F26B","KeyboardUndock":"F26C","KeyboardLeftDock":"F26D","KeyboardRightDock":"F26E","Ear":"F270","PointerHand":"F271","Bullseye":"F272","ActionFramework":"F277","Earbudsingle":"F27C","HearingAid":"F27F","MobSnooze":"F285","DocumentApproval":"F28B","MobNotificationBell":"F2A3","MobNotificationBellFilled":"F2A5","MobSnoozeFilled":"F2A8","LocaleLanguage":"F2B7","BulletedList2":"F2C7","BulletedList2Mirrored":"F2C8","CirclePause":"F2D9","Restart3":"F305","PassiveAuthentication":"F32A","Emoji4":"F353","ColorSolid":"F354","NetworkOffline":"F384","NetworkConnected":"F385","NetworkConnectedCheckmark":"F386","NFCBadge":"F39B","SignOut":"F3B1","LikeSolid":"F3BF","DislikeSolid":"F3C0","StatusInfo":"F3CC","StatusInfoLeft":"F3CD","NearbySharing":"F3E2","CtrlSpatialLeft":"F3E7","InteractiveDashboard":"F404","DeclineCall":"F405","ClippingTool":"F406","RectangularClipping":"F407","FreeFormClipping":"F408","CopyTo":"F413","IDBadge":"F427","SpeedHigh2":"F42F","BatterySaver":"F432","DynamicLock":"F439","PenTips":"F45E","PenTipsMirrored":"F45F","HWPJoin":"F460","HWPInsert":"F461","HWPStrikeThrough":"F462","HWPScratchOut":"F463","HWPSplit":"F464","HWPNewLine":"F465","HWPOverwrite":"F466","PhoneResumeAlert":"F470","MobWifiWarning1":"F473","MobWifiWarning2":"F474","MobWifiWarning3":"F475","MobWifiWarning4":"F476","MicLocationCombo":"F47F","Globe2":"F49A","SpecialEffectSize":"F4A5","GIF":"F4A9","Sticker2":"F4AA","Snooze":"F4BD","SurfaceHubSelected":"F4BE","HoloLensSelected":"F4BF","Earbud":"F4C0","MixVolumes":"F4C3","Safe":"F540","LaptopSecure":"F552","PrintDefault":"F56D","PageMirrored":"F56E","LandscapeOrientationMirrored":"F56F","ColorOff":"F570","PrintAllPages":"F571","PrintCustomRange":"F572","PageMarginPortraitNarrow":"F573","PageMarginPortraitNormal":"F574","PageMarginPortraitModerate":"F575","PageMarginPortraitWide":"F576","PageMarginLandscapeNarrow":"F577","PageMarginLandscapeNormal":"F578","PageMarginLandscapeModerate":"F579","PageMarginLandscapeWide":"F57A","CollateLandscape":"F57B","CollatePortrait":"F57C","CollatePortraitSeparated":"F57D","DuplexLandscapeOneSided":"F57E","DuplexLandscapeOneSidedMirrored":"F57F","DuplexLandscapeTwoSidedLongEdge":"F580","DuplexLandscapeTwoSidedLongEdgeMirrored":"F581","DuplexLandscapeTwoSidedShortEdge":"F582","DuplexLandscapeTwoSidedShortEdgeMirrored":"F583","DuplexPortraitOneSided":"F584","DuplexPortraitOneSidedMirrored":"F585","DuplexPortraitTwoSidedLongEdge":"F586","DuplexPortraitTwoSidedLongEdgeMirrored":"F587","DuplexPortraitTwoSidedShortEdge":"F588","DuplexPortraitTwoSidedShortEdgeMirrored":"F589","PPSOneLandscape":"F58A","PPSTwoLandscape":"F58B","PPSTwoPortrait":"F58C","PPSFourLandscape":"F58D","PPSFourPortrait":"F58E","HolePunchOff":"F58F","HolePunchPortraitLeft":"F590","HolePunchPortraitRight":"F591","HolePunchPortraitTop":"F592","HolePunchPortraitBottom":"F593","HolePunchLandscapeLeft":"F594","HolePunchLandscapeRight":"F595","HolePunchLandscapeTop":"F596","HolePunchLandscapeBottom":"F597","StaplingOff":"F598","StaplingPortraitTopLeft":"F599","StaplingPortraitTopRight":"F59A","StaplingPortraitBottomRight":"F59B","StaplingPortraitTwoLeft":"F59C","StaplingPortraitTwoRight":"F59D","StaplingPortraitTwoTop":"F59E","StaplingPortraitTwoBottom":"F59F","StaplingPortraitBookBinding":"F5A0","StaplingLandscapeTopLeft":"F5A1","StaplingLandscapeTopRight":"F5A2","StaplingLandscapeBottomLeft":"F5A3","StaplingLandscapeBottomRight":"F5A4","StaplingLandscapeTwoLeft":"F5A5","StaplingLandscapeTwoRight":"F5A6","StaplingLandscapeTwoTop":"F5A7","StaplingLandscapeTwoBottom":"F5A8","StaplingLandscapeBookBinding":"F5A9","StatusDataTransferRoaming":"F5AA","MobSIMError":"F5AB","CollateLandscapeSeparated":"F5AC","PPSOnePortrait":"F5AD","StaplingPortraitBottomLeft":"F5AE","PlaySolid":"F5B0","ShieldLock":"F5B4","Chess":"F5B5","POILocationFound":"F5CA","RepeatOff":"F5E7","Set":"F5ED","SetSolid":"F5EE","FuzzyReading":"F5EF","VerticalBattery0":"F5F2","VerticalBattery1":"F5F3","VerticalBattery2":"F5F4","VerticalBattery3":"F5F5","VerticalBattery4":"F5F6","VerticalBattery5":"F5F7","VerticalBattery6":"F5F8","VerticalBattery7":"F5F9","VerticalBattery8":"F5FA","VerticalBattery9":"F5FB","VerticalBattery10":"F5FC","VerticalBatteryCharging0":"F5FD","VerticalBatteryCharging1":"F5FE","VerticalBatteryCharging2":"F5FF","VerticalBatteryCharging3":"F600","VerticalBatteryCharging4":"F601","VerticalBatteryCharging5":"F602","VerticalBatteryCharging6":"F603","VerticalBatteryCharging7":"F604","VerticalBatteryCharging8":"F605","VerticalBatteryCharging9":"F606","VerticalBatteryCharging10":"F607","VerticalBatteryUnknown":"F608","SIMError":"F618","SIMMissing":"F619","SIMLock":"F61A","eSIM":"F61B","eSIMNoProfile":"F61C","eSIMLocked":"F61D","eSIMBusy":"F61E","NoiseCancelation":"F61F","NoiseCancelationOff":"F620","MusicSharing":"F623","MusicSharingOff":"F624","CircleShapeSolid":"F63C","WifiCallBars":"F657","WifiCall0":"F658","WifiCall1":"F659","WifiCall2":"F65A","WifiCall3":"F65B","WifiCall4":"F65C","Pen":"F67B","TextSelect":"F683","TextNavigate":"F684","PinyinIMELogo2":"F698","UserRemove":"F69B","CHTLanguageBar":"F69E","ComposeMode":"F6A9","ExpressiveInputEntry":"F6B8","EmojiTabMoreSymbols":"F6BA","PhoneScreen":"F6C4","AlertUrgent":"F6C5","PhoneDesktop":"F6C6","PenSparkle":"F6C7","WebSearch":"F6FA","Kiosk":"F712","RTTLogo":"F714","VoiceCall":"F715","GoToMessage":"F716","ReturnToCall":"F71A","StartPresenting":"F71C","StopPresenting":"F71D","ProductivityMode":"F71E","WarningSolid":"F736","SetHistoryStatus":"F738","SetHistoryStatus2":"F739","Keyboardsettings20":"F73D","OneHandedRight20":"F73E","OneHandedLeft20":"F73F","Split20":"F740","Full20":"F741","Handwriting20":"F742","ChevronLeft20":"F743","ChevronLeft32":"F744","ChevronRight20":"F745","ChevronRight32":"F746","ShieldTask":"F760","Event12":"F763","MicOff2":"F781","DeliveryOptimization":"F785","CancelMedium":"F78A","SearchMedium":"F78B","AcceptMedium":"F78C","RevealPasswordMedium":"F78D","DeleteWord":"F7AD","DeleteWordFill":"F7AE","DeleteLines":"F7AF","DeleteLinesFill":"F7B0","InstertWords":"F7B1","InstertWordsFill":"F7B2","JoinWords":"F7B3","JoinWordsFill":"F7B4","OverwriteWords":"F7B5","OverwriteWordsFill":"F7B6","AddNewLine":"F7B7","AddNewLineFill":"F7B8","OverwriteWordsKorean":"F7B9","OverwriteWordsFillKorean":"F7BA","EducationIcon":"F7BB","LearningTools":"F7DB","Task":"F7EC","WindowSnipping":"F7ED","VideoCapture":"F7EE","StatusSecured":"F809","NarratorApp":"F83B","PowerButtonUpdate":"F83D","RestartUpdate":"F83E","UpdateStatusDot":"F83F","Eject":"F847","Spelling":"F87B","SpellingKorean":"F87C","SpellingSerbian":"F87D","SpellingChinese":"F87E","FolderSelect":"F89A","SmartScreen":"F8A5","ExploitProtection":"F8A6","AddBold":"F8AA","SubtractBold":"F8AB","BackSolidBold":"F8AC","ForwardSolidBold":"F8AD","PauseBold":"F8AE","ClickSolid":"F8AF","SettingsSolid":"F8B0","MicrophoneSolidBold":"F8B1","SpeechSolidBold":"F8B2","ClickedOutLoudSolidBold":"F8B3","CopilotVoice":"F8B4","VPNOverlay":"F8C0","VPNRoamingOverly":"F8C1","WifiVPN3":"F8C2","WifiVPN4":"F8C3","WifiVPN5":"F8C4","SignalBarsVPN2":"F8C5","SignalBarsVPN3":"F8C6","SignalBarsVPN4":"F8C7","SignalBarsVPN5":"F8C8","SignalBarsVPNRoaming3":"F8C9","SignalBarsVPNRoaming4":"F8CA","SignalBarsVPNRoaming5":"F8CB","EthernetVPN":"F8CC"};
  // END GENERATED SEGOE NAMES
  function commandGlyph(value) {
    if (Object.hasOwn(commandSymbols, value)) return String.fromCodePoint(parseInt(commandSymbols[value], 16));
    if (/^glyph:[0-9a-f]{4,6}$/i.test(value)) {
      const code = parseInt(value.slice(6), 16);
      if (code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff)) return String.fromCodePoint(code);
    }
    throw new RangeError('Unknown WinUI command icon: ' + value);
  }
  const commandOwner = button => authoredButtons.has(button.parentElement) ? button.parentElement : button;
  const enumValue = (value, values, name) => { if (!values.includes(value)) throw new RangeError('Invalid ' + name + ': ' + value); return value; };
  function overflowOrder(value = '0') {
    if (!/^-?\d+$/.test(String(value)) || !Number.isInteger(Number(value)) || Number(value) < -2147483648 || Number(value) > 2147483647) throw new RangeError('DynamicOverflowOrder must be an Int32');
    return Number(value);
  }
  function commandValue(node, attribute, fallback) {
    return node.getAttribute(node.matches(commandTags) ? attribute : 'data-' + attribute) ?? fallback;
  }
  function updateCommandPresentation(button) {
    const node = commandOwner(button), bar = node.closest('[data-command-bar]');
    const position = enumValue(commandValue(node, 'label-position', 'default'), ['default','collapsed'], 'LabelPosition');
    const inherited = bar?.dataset.labelPosition || 'bottom';
    button.dataset.effectiveLabelPosition = position === 'collapsed' ? 'collapsed' : inherited;
    const compact = node.matches(commandTags) ? node.hasAttribute('is-compact') : button.dataset.isCompact === 'true' || button.classList.contains('appbar-button--compact');
    button.classList.toggle('appbar-button--compact', compact);
    overflowOrder(commandValue(node, 'dynamic-overflow-order', '0'));
    const label = button.querySelector('.appbar-button__label')?.textContent;
    const hiddenLabel = !button.hasAttribute('data-command-overflow') && (button.dataset.effectiveLabelPosition === 'collapsed' || compact && inherited !== 'right');
    if (label && hiddenLabel && (!button.hasAttribute('aria-label') || button.hasAttribute('data-command-auto-label'))) { button.setAttribute('aria-label', label); button.dataset.commandAutoLabel = ''; }
    else if (!hiddenLabel && button.hasAttribute('data-command-auto-label')) { button.removeAttribute('aria-label'); delete button.dataset.commandAutoLabel; }
  }
  function invalidateCommand(node) { commandBars.get(node.closest('[data-command-bar]'))?.invalidate(); }
  function separatorApi(node) {
    if (!appBarSeparators.has(node)) {
      let compact = node.hasAttribute('is-compact') || node.dataset.isCompact === 'true';
      appBarSeparators.set(node, {
        get isCompact() { return compact; },
        setCompact(value) { if (typeof value !== 'boolean') throw new TypeError('IsCompact must be boolean'); compact = value; node.dataset.isCompact = String(value); if (node.matches(commandTags)) node.toggleAttribute('is-compact', value); invalidateCommand(node); },
        get dynamicOverflowOrder() { return overflowOrder(commandValue(node, 'dynamic-overflow-order', '0')); },
        setDynamicOverflowOrder(value) { node.setAttribute(node.matches(commandTags) ? 'dynamic-overflow-order' : 'data-dynamic-overflow-order', String(overflowOrder(value))); invalidateCommand(node); },
        get isInOverflow() { return node.hasAttribute('data-command-overflow'); }
      });
    }
    return appBarSeparators.get(node);
  }
  function commandSlotNodes(host,name,holder) {
    return [...Array.from(host.children).filter(node=>node.getAttribute('slot')===name),...(holder?Array.from(holder.children).filter(node=>node.getAttribute('slot')===name):[])];
  }
  function updateCommandResources(host) {
    const state=authoredButtons.get(host);if(!state||state.changingResources)return;
    const artwork=commandSlotNodes(host,'icon',state.icon);if(artwork.length>1)throw new TypeError('Only one command icon slot is supported');
    if(artwork[0]&&!['img','svg'].includes(artwork[0].localName))throw new TypeError('Icon artwork must be img or svg');
    state.artwork=artwork[0]||null;
    const declared=commandSlotNodes(host,'flyout');if(declared.length>1||declared.length&&host.hasAttribute('flyout'))throw new TypeError('Supply one flyout declaration or target ID');
    const id=host.getAttribute('flyout'),panel=declared[0]||(id?host.ownerDocument.getElementById(id):null),button=state.button;
    if(panel){
      if(!(panel instanceof HTMLElement)||panel.ownerDocument!==host.ownerDocument)throw new TypeError('Flyout must be an HTML surface from the same document');
      if(!panel.id){panel.id=nextId();panel.dataset.commandGeneratedId='';}
      button.dataset.openPopup=panel.id;bindFlyout(panel,button);
      if(button.disabled)flyoutBindings.get(button)?.popup.close(false);
    }else{bindFlyout(null,button);if(id)button.dataset.openPopup=id;else delete button.dataset.openPopup;}
    state.flyout=panel||null;
  }
  function replaceCommandResource(host,kind,value) {
    if(!host.matches('winui-appbar-button,winui-appbar-toggle-button'))throw new TypeError('Resource setters require an authored command host');
    const state=authoredButtons.get(host);if(!state)hydrateCommand(host);
    const current=authoredButtons.get(host);
    const restoreFocus=kind==='flyout'&&current.flyout?.contains(document.activeElement);
    if(kind==='icon'&&typeof value==='string')commandGlyph(value);
    if(kind==='font-icon'&&value!==null&&typeof value!=='string')throw new TypeError('Font icon must be text or null');
    if(kind==='flyout'&&typeof value==='string'){const target=host.ownerDocument.getElementById(value);if(!target)throw new RangeError('Flyout target not found: '+value);value=target;}
    if(value!==null&&typeof value!=='string'&&(!(value instanceof Element)||value.ownerDocument!==host.ownerDocument||value===host||value.contains(host)))throw new TypeError('Resource must be an element from the same document');
    if(kind==='icon'&&value instanceof Element&&!['img','svg'].includes(value.localName))throw new TypeError('Icon artwork must be img or svg');
    if(kind==='flyout'&&value!==null&&!(value instanceof HTMLElement))throw new TypeError('Flyout must be an HTML surface');
    current.changingResources=true;
    try{
      if(kind==='icon'||kind==='font-icon'){
        commandSlotNodes(host,'icon',current.icon).forEach(node=>{if(node!==value)node.remove();});host.removeAttribute('icon');host.removeAttribute('font-icon');
        if(value instanceof Element){value.slot='icon';if(value.parentElement!==current.icon)host.append(value);}else if(value!==null)host.setAttribute(kind,value);
      }else{
        commandSlotNodes(host,'flyout').forEach(node=>{if(node!==value)node.remove();});host.removeAttribute('flyout');
        if(value){if(!value.parentNode||!value.isConnected){value.slot='flyout';host.append(value);}else if(value.parentElement===host&&value.getAttribute('slot')==='flyout'){}else{if(!value.id)value.id=nextId();host.setAttribute('flyout',value.id);}}
      }
    }finally{current.changingResources=false;}
    updateAuthoredButton(host);
    if(restoreFocus&&!current.button.disabled)current.button.focus({preventScroll:true});
  }
  function updateBitmapIcon(button) {
    const bitmap=button.querySelector('[data-appbar-bitmap]'),holder=bitmap?.parentElement;
    if(!holder)return;
    const uri=bitmap.getAttribute('src')||'';
    if(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(uri))holder.style.setProperty('--appbar-bitmap','url("'+uri+'")');
    else holder.style.removeProperty('--appbar-bitmap');
  }
  function renderAuthoredCommand(host) {
    const state = authoredButtons.get(host);
    if (!state||state.changingResources) return;
    updateCommandResources(host);
    const { button, icon, label } = state;
    let artwork=state.artwork,symbol=host.getAttribute('icon'),font=host.getAttribute('font-icon');
    if ([Boolean(symbol), Boolean(font), Boolean(artwork)].filter(Boolean).length > 1) throw new TypeError('Supply one command icon representation');
    const metadata=commandMetadata(button);
    if(!symbol&&!font&&!artwork){
      const source=metadata?.iconSource;
      if(source instanceof Element){
        if(state.metadataSource!==source||state.metadataVersion!==metadata.iconVersion){state.metadataArtwork=source.cloneNode(true);state.metadataArtwork.removeAttribute('slot');state.metadataSource=source;state.metadataVersion=metadata.iconVersion;}
        artwork=state.metadataArtwork;
      }else if(typeof source==='string')symbol=source;
      else if(source)font=source.fontIcon;
    }
    state.effectiveIcon=artwork||symbol||null;state.effectiveFontIcon=font||null;
    icon.className = artwork || font ? 'appbar-button__icon' : 'glyph';
    if (artwork?.localName === 'img') icon.classList.add('appbar-button__icon--bitmap');
    icon.hidden = !symbol && !font && !artwork;
    if (symbol) {const glyph=commandGlyph(symbol);if(icon.textContent!==glyph)icon.textContent=glyph;}
    else if (font) { icon.classList.add('appbar-button__icon--font'); if(icon.textContent!==font)icon.textContent=font; }
    else if (artwork) {
      if(artwork.parentElement!==icon)icon.replaceChildren(artwork);
      if(artwork.localName==='img'){artwork.dataset.appbarBitmap='';artwork.alt='';updateBitmapIcon(button);}
      else{icon.style.removeProperty('--appbar-bitmap');artwork.querySelectorAll('path').forEach(path=>path.classList.add('appbar-button__path'));}
    }else if(icon.childNodes.length)icon.replaceChildren();
    if(artwork?.localName!=='img')icon.style.removeProperty('--appbar-bitmap');
    const text=host.getAttribute('label')||metadata?.label||'';if(label.textContent!==text)label.textContent=text;
  }
  function updateAuthoredButton(host) {
    const state=authoredButtons.get(host);if(!state||state.changingResources)return;
    renderAuthoredCommand(host);
    const {button,label}=state;
    button.disabled = host.hasAttribute('disabled') || Boolean(host.closest('[data-control-disabled]'));
    for (const name of ['aria-label']) {
      if (host.hasAttribute(name)) button.setAttribute(name, host.getAttribute(name));
      else button.removeAttribute(name);
    }
    delete button.dataset.commandAutoLabel;
    button.dataset.allowFocusOnInteraction = String(host.hasAttribute('allow-focus-on-interaction'));
    const tooltip = host.getAttribute('tooltip') || commandMetadata(button)?.description || '';
    if (tooltip) button.dataset.tooltip = tooltip; else delete button.dataset.tooltip;
    if (host.localName === 'winui-appbar-toggle-button') {
      button.dataset.appbarToggle = '';
      if (host.hasAttribute('three-state')) button.dataset.appbarThreeState = 'true';
      else delete button.dataset.appbarThreeState;
      const checked = host.getAttribute('checked') || 'false';
      if (!['false','true','mixed'].includes(checked) || checked === 'mixed' && !host.hasAttribute('three-state')) throw new RangeError('Invalid command checked state');
      if (appBars.has(button)) appBars.get(button).setChecked(checked === 'mixed' ? null : checked === 'true', false);
      else button.setAttribute('aria-pressed', checked);
    }
    initializeTooltip(button);
    updateCommandData(button);
    updateCommandPresentation(button);
    invalidateCommand(host);
  }
  function hydrateCommand(host) {
    if (host.localName === 'winui-appbar-separator') {
      overflowOrder(host.getAttribute('dynamic-overflow-order') ?? '0');
      separatorApi(host);
      host.classList.add('appbar-separator'); host.setAttribute('role', 'separator'); return host;
    }
    if (!authoredButtons.has(host)) {
      const artwork = host.querySelector(':scope > [slot="icon"]');
      if (host.querySelectorAll(':scope > [slot="icon"]').length > 1) throw new TypeError('Only one command icon slot is supported');
      const button = controlButton('appbar-button'); button.dataset.appbar = '';
      const icon = element('span', 'glyph'), label = element('span', 'appbar-button__label');
      icon.setAttribute('aria-hidden', 'true');
      if (artwork) {
        icon.append(artwork);
        if (artwork.localName === 'img') { icon.classList.add('appbar-button__icon--bitmap'); artwork.dataset.appbarBitmap = ''; artwork.alt = ''; }
        if (artwork.localName === 'svg') artwork.querySelectorAll('path').forEach(path => path.classList.add('appbar-button__path'));
      }
      button.append(icon, label); host.append(button); host.classList.add('winui-command');
      authoredButtons.set(host, { button, icon, label, artwork });
      updateAuthoredButton(host);
      if (artwork?.localName === 'img') icon.classList.add('appbar-button__icon--bitmap');
      new MutationObserver(records=>{
        const state=authoredButtons.get(host);
        if(records.some(record=>record.type==='attributes'?record.target===state.artwork||state.artwork?.contains(record.target)||record.target.parentElement===host&&['icon','flyout'].includes(record.target.getAttribute('slot')):record.target===state.icon||state.artwork?.contains(record.target)||record.target===host&&[...record.addedNodes,...record.removedNodes].some(node=>node instanceof Element&&['icon','flyout'].includes(node.getAttribute('slot')))))updateAuthoredButton(host);
      }).observe(host,{childList:true,subtree:true,attributes:true,attributeFilter:['slot','src','viewBox','d']});
      button.addEventListener('checkedChanged', event => {
        const value = event.detail.checked === null ? 'mixed' : String(event.detail.checked);
        if (host.getAttribute('checked') !== value) host.setAttribute('checked', value);
      });
      initializeAppBar(button);
    }
    updateCommandResources(host);updateCommandData(authoredButtons.get(host).button);
    return authoredButtons.get(host).button;
  }
  function hydrateCommandBar(host) {
    if(commandBars.has(host))return;
    if (!authoredBars.has(host)) {
      const primary = element('div', 'command-bar__primary'), secondary = element('div', 'command-bar__overflow');
      const more = controlButton('command-bar__more glyph', '\uE712', host.getAttribute('more-label') || 'More');
      primary.dataset.primaryCommands = ''; secondary.dataset.secondaryCommands = ''; more.dataset.commandMore = '';
      host.classList.add('command-bar'); host.dataset.commandBar = '';
      host.classList.toggle('command-bar--unconstrained', host.hasAttribute('unconstrained'));
      const position = host.getAttribute('default-label-position') ?? host.getAttribute('label-position') ?? 'bottom';
      enumValue(position, ['bottom','right','collapsed'], 'DefaultLabelPosition');
      host.dataset.labelPosition = position;
      host.append(primary, more, secondary); authoredBars.set(host, { primary, secondary });
    }
    const { primary, secondary } = authoredBars.get(host);
    Array.from(host.children).filter(node => node.matches(commandElements)&&node.getAttribute('slot')!=='content').forEach(node => {
      if(node.matches(commandTags))hydrateCommand(node);
      if (node.hasAttribute('slot') && !['','secondary'].includes(node.getAttribute('slot'))) throw new RangeError('Unknown CommandBar command slot');
      (node.getAttribute('slot') === 'secondary' ? secondary : primary).append(node);
    });
  }
  function contentPath(value,path='') {
    if(path===''||path==='.')return value;
    const parts=path.split('.');if(parts.some(part=>!/^([A-Za-z_$][\w$]*|\d+)$/.test(part)||['__proto__','prototype','constructor'].includes(part)))throw new TypeError('Binding paths contain only safe property names');
    for(const part of parts){if(value===null||value===undefined||!Object.hasOwn(Object(value),part))return undefined;value=value[part];}return value;
  }
  function templateElement(value,host) {
    if(value!==null&&typeof value!=='function'&&(!(value instanceof HTMLTemplateElement)||value.ownerDocument!==host.ownerDocument))throw new TypeError('ContentTemplate must be an HTML template, renderer function or null');return value;
  }
  function templateSelector(value,host) {
    if(value!==null&&typeof value!=='function'&&(!value||typeof value.selectTemplate!=='function')||value instanceof Element&&value.ownerDocument!==host.ownerDocument)throw new TypeError('ContentTemplateSelector must select a template synchronously');return value;
  }
  customElements.define('winui-data-template-selector',class extends HTMLElement {
    connectedCallback(){this.hidden=true;}
    selectTemplate(value){
      const key=contentPath(value,this.getAttribute('path')||''),templates=Array.from(this.children).filter(node=>node instanceof HTMLTemplateElement);
      const defaults=templates.filter(node=>!node.hasAttribute('value'));if(defaults.length>1)throw new TypeError('A selector has one default template');
      const cases=templates.filter(node=>node.hasAttribute('value'));if(new Set(cases.map(node=>node.getAttribute('value'))).size!==cases.length)throw new TypeError('Selector values must be unique');
      return cases.find(node=>node.getAttribute('value')===String(key??''))||defaults[0]||null;
    }
  });
  function contentNodes(host,state) {
    const nodes=[...commandSlotNodes(host,'content',state.contentHost),...(state.contentStash?Array.from(state.contentStash.children).filter(node=>node.slot==='content'):[])],retained=state.contentValue;
    if(retained instanceof Element&&retained.slot==='content'&&(state.contentHost?.contains(retained)||state.contentStash?.contains(retained))&&!nodes.includes(retained))nodes.push(retained);return nodes;
  }
  function contentProperty(host,state,kind) {
    const name=kind==='template'?'content-template':'content-template-selector',nodes=Array.from(host.children).filter(node=>node.slot===name),raw=host.getAttribute(name),old=state.contentProperties?.[kind];
    if(nodes.length>1||nodes.length&&raw!==null)throw new TypeError('Use one '+name+' declaration or ID');
    const same=old&&raw===old.raw&&nodes.length===old.nodes.length&&nodes.every((node,index)=>node===old.nodes[index]);
    let value=same&&old.api?old.value:nodes[0]||null;
    if(!value&&raw){const root=host.getRootNode();value=root.getElementById?.(raw)||Array.from(root.querySelectorAll?.('[id]')||[]).find(node=>node.id===raw)||host.ownerDocument.getElementById(raw);if(!value)throw new RangeError(name+' target not found: '+raw);}
    (kind==='template'?templateElement:templateSelector)(value,host);return {raw,nodes,value,api:Boolean(same&&old.api)};
  }
  function scopeContentIds(root) {
    const nodes=[root,...root.querySelectorAll('*')],ids=new Map();for(const node of nodes)if(node.id){if(ids.has(node.id))throw new TypeError('Template IDs must be unique within the template');const old=node.id;node.id=nextId();ids.set(old,node.id);}
    for(const node of nodes)for(const attribute of Array.from(node.attributes)){
      if(['for','list','form','headers','aria-labelledby','aria-describedby','aria-controls','aria-owns','aria-activedescendant'].includes(attribute.name))node.setAttribute(attribute.name,attribute.value.split(/\s+/).map(id=>ids.get(id)||id).join(' '));
      else if(['href','xlink:href'].includes(attribute.name)&&attribute.value.startsWith('#')&&ids.has(attribute.value.slice(1)))node.setAttribute(attribute.name,'#'+ids.get(attribute.value.slice(1)));
      else if(/url\(#/.test(attribute.value))node.setAttribute(attribute.name,attribute.value.replace(/url\(#([^\)]+)\)/g,(match,id)=>ids.has(id)?'url(#'+ids.get(id)+')':match));
    }
  }
  function instantiateContentTemplate(template,value,host) {
    let root;
    if(template instanceof HTMLTemplateElement){if(Array.from(template.content.querySelectorAll('*')).some(node=>Array.from(node.attributes).some(attribute=>attribute.name==='style'||/^on/i.test(attribute.name))))throw new TypeError('Templates use shared CSS and JavaScript listeners');const fragment=host.ownerDocument.importNode(template.content,true),nodes=Array.from(fragment.childNodes).filter(node=>node.nodeType===1||node.nodeType===3&&node.textContent.trim());if(nodes.length>1||nodes[0]&&!(nodes[0] instanceof Element))throw new TypeError('A content template has one element root or is empty');root=nodes[0]||null;root?.remove();}
    else root=template(value,host);
    if(root===null)return {root:null,bindings:[]};
    if(!(root instanceof Element)||root.ownerDocument!==host.ownerDocument||root.parentNode||root===host||root.contains(host))throw new TypeError('A renderer returns one detached element from this document or null');
    if(root.matches('script,style,link')||root.querySelector('script,style,link'))throw new TypeError('Keep scripts and styles outside content templates');
    root.removeAttribute('slot');scopeContentIds(root);const bindings=[];
    for(const node of [root,...root.querySelectorAll('[data-bind-text],[data-bind-value],[data-bind-checked]')])for(const [attribute,property]of [['data-bind-text','textContent'],['data-bind-value','value'],['data-bind-checked','checked']])if(node.hasAttribute(attribute)){
      if(property==='textContent'&&(node.localName.includes('-')||node.matches('input,textarea,select')))throw new TypeError('Text binding belongs on an application text element');
      if(property==='value'&&!node.matches('input,textarea')||property==='checked'&&!node.matches('input[type="checkbox"],input[type="radio"]'))throw new TypeError('Value/checked bindings require the corresponding native field');
      const path=node.getAttribute(attribute);contentPath(undefined,path);bindings.push({node,property,path,applied:false});
    }
    return {root,bindings};
  }
  function watchContentTemplates(host,state,sources) {
    const templates=[...new Set(sources.flatMap(source=>source instanceof HTMLTemplateElement?[source]:source instanceof Element?Array.from(source.querySelectorAll('template')):[]))];
    const nodes=[...new Set([...sources.filter(source=>source instanceof Element),...templates.map(template=>template.content)])];
    if(state.contentWatches?.length===nodes.length&&nodes.every((node,index)=>node===state.contentWatches[index]))return;
    state.contentObserver?.disconnect();state.contentWatches=nodes;
    state.contentObserver=new MutationObserver(records=>{state.selectionDirty=true;if(state.selectedTemplate instanceof HTMLTemplateElement&&records.some(record=>record.target===state.selectedTemplate||state.selectedTemplate.content.contains(record.target)))state.templateDirty=true;syncBarContent(host);});
    for(const node of nodes)state.contentObserver.observe(node,{attributes:true,childList:true,characterData:true,subtree:true});
  }
  function syncBarContent(host,changes={}) {
    const state=authoredBars.get(host);if(!state||state.changingContent)return;
    state.changingContent=true;
    try{
      const nodes=contentNodes(host,state),raw=host.getAttribute('content'),has=name=>Object.hasOwn(changes,name);
      if(nodes.length>1||nodes.length&&raw!==null)throw new TypeError('Supply one content element or a content attribute');
      let value=has('content')?changes.content:nodes[0]||(raw===state.contentAttribute&&state.contentApi?state.contentValue:raw);
      const properties={template:contentProperty(host,state,'template'),selector:contentProperty(host,state,'selector')};
      for(const kind of ['template','selector'])if(has(kind))properties[kind]={...properties[kind],value:changes[kind],api:true};
      const template=templateElement(properties.template.value,host),selector=templateSelector(properties.selector.value,host);
      if(value!==null&&!(value instanceof Element)&&!['string','number','boolean','object'].includes(typeof value)||typeof value==='number'&&!Number.isFinite(value)||has('content')&&value!==null&&typeof value==='object'&&!(value instanceof Element)&&!template&&!selector)throw new TypeError('Object content requires a template or selector');
      if(value instanceof Element&&(value.ownerDocument!==host.ownerDocument||value===host||value.contains(host)||commandOwners.has(value)))throw new TypeError('Content requires an unowned element from the same document');
      state.pendingContent={value,template,selector};
      const selectAgain=state.selectionDirty||changes.force||template!==state.contentProperties?.template.value||selector!==state.lastSelector||!Object.is(value,state.lastContent);
      const selected=template||(selector?(selectAgain?(typeof selector==='function'?selector(value,host):selector.selectTemplate(value,host)):state.selectedTemplate):null);templateElement(selected,host);
      const rebuild=selected!==state.selectedTemplate||state.templateDirty||selected&&typeof selected==='function'&&(changes.force||!Object.is(value,state.lastContent));
      const instance=selected?(rebuild?instantiateContentTemplate(selected,value,host):{root:state.contentTemplateRoot,bindings:state.contentBindings||[]}):{root:null,bindings:[]};
      const updates=instance.bindings.map(binding=>{const data=contentPath(value,binding.path),next=binding.property==='checked'?Boolean(data):String(data??'');return {binding,next};});
      // Validation/rendering above leaves the current tree intact on errors.
      if(has('content')){
        for(const node of nodes)if(node!==value)node.remove();host.removeAttribute('content');
        if(value instanceof Element){value.slot='content';if(!state.contentHost?.contains(value)&&!state.contentStash?.contains(value))host.prepend(value);}
        else if(value!==null&&typeof value!=='object')host.setAttribute('content',String(value));
        state.contentApi=!(value instanceof Element);
      }else if(raw!==state.contentAttribute||nodes.length)state.contentApi=false;
      for(const kind of ['template','selector'])if(has(kind)){
        const name=kind==='template'?'content-template':'content-template-selector',property=properties[kind],item=property.value;
        property.nodes.forEach(node=>{if(node!==item)node.remove();});host.removeAttribute(name);
        if(item instanceof Element){if(item.isConnected&&item.parentElement!==host){if(!item.id)item.id=nextId();host.setAttribute(name,item.id);}else{item.slot=name;if(item.parentElement!==host)host.append(item);}}
        property.raw=host.getAttribute(name);property.nodes=Array.from(host.children).filter(node=>node.slot===name);
      }
      if((selected||value!==null)&&!state.contentHost){state.contentHost=element('div','command-bar__content');host.prepend(state.contentHost);}
      const holder=state.contentHost,shown=selected?instance.root:value instanceof Element?value:null;
      const replacing=holder&&(shown?!holder.contains(shown):holder.textContent!==(selected?'':String(value??''))||Boolean(state.contentTemplateRoot));
      const restoreFocus=replacing&&holder.contains(document.activeElement);
      if(holder){
        if(selected&&value instanceof Element&&!state.contentStash?.contains(value)){
          if(!state.contentStash){state.contentStash=element('div');state.contentStash.hidden=true;host.append(state.contentStash);}
          let wrapper=value;while(wrapper.parentElement&&wrapper.parentElement!==holder&&wrapper.parentElement!==host)wrapper=wrapper.parentElement;state.contentStash.append(wrapper);
        }
        if(shown&&!holder.contains(shown)){
          for(const popup of popupInstances)if(holder.contains(popup.trigger)||holder.contains(popup.panel))popup.close(false);
          let wrapper=shown;while(wrapper.parentElement&&wrapper.parentElement!==state.contentStash&&wrapper.parentElement!==host)wrapper=wrapper.parentElement;holder.replaceChildren(wrapper);
        }else if(!shown){const text=selected?'':String(value??'');if(holder.textContent!==text||state.contentTemplateRoot)holder.textContent=text;}
        holder.hidden=selected?!instance.root:value===null;
        for(const {binding,next}of updates)if(!binding.applied||binding.last!==next){binding.node[binding.property]=next;binding.last=next;binding.applied=true;}
      }
      Object.assign(state,{contentAttribute:host.getAttribute('content'),contentValue:value,contentProperties:properties,selectedTemplate:selected,contentTemplateRoot:instance.root,contentBindings:instance.bindings,lastContent:value,lastSelector:selector,selectionDirty:false,templateDirty:false});
      if(holder&&rebuild&&instance.root)initialize(holder);
      watchContentTemplates(host,state,[template,selector,selected]);
      if(restoreFocus){const target=instance.root&&focusables(instance.root)[0]||host.querySelector('[data-command-more]:not([hidden])')||host.querySelector('[data-primary-commands] button:not(:disabled)');target?.focus({preventScroll:true});}
      commandBars.get(host)?.invalidate();return instance.root;
    }finally{state.pendingContent=null;state.changingContent=false;}
  }
  function setBarContent(host,value) {
    const state=authoredBars.get(host);if(!state)throw new TypeError('Content setters require an authored CommandBar');if(state.changingContent)throw new Error('Content cannot change during rendering');return syncBarContent(host,{content:value});
  }
  function setBarTemplate(host,kind,value) {
    const state=authoredBars.get(host);if(!state)throw new TypeError('Template setters require an authored CommandBar');if(state.changingContent)throw new Error('Templates cannot change during rendering');return syncBarContent(host,{[kind]:value});
  }
  // Selection authoring uses the existing light-DOM templates and Master CSS.
  const selectionTags='winui-check-box,winui-radio-button,winui-toggle-button,winui-toggle-switch';
  const selectionControls=new WeakMap(),radioParents=new WeakMap();
  function selectionState(value){
    if(value===true||value===false||value===null)return value;
    if(value==='true')return true;if(value==='false')return false;if(value==='mixed')return null;
    throw new TypeError('Checked must be true, false or null (checked="mixed")');
  }
  function selectionGroup(host){
    if(host.getAttribute('group-name'))return host.getAttribute('group-name');
    const parent=host.parentNode||host;if(!radioParents.has(parent))radioParents.set(parent,nextId());return radioParents.get(parent);
  }
  function hydrateSelection(host){
    if(selectionControls.has(host))return selectionControls.get(host);
    const kind=host.localName,button=kind==='winui-toggle-button',radio=kind==='winui-radio-button',isSwitch=kind==='winui-toggle-switch';
    const authored=[...host.childNodes],label=document.createElement(button?'button':'label'),control=button?label:document.createElement('input'),text=document.createElement('span');
    label.className=button?'button button--toggle':isSwitch?'field':'choice';control.type=button?'button':radio?'radio':'checkbox';
    if(button){control.dataset.toggleButton='';control.dataset.winuiInitialized='true';}
    const state={host,kind,label,control,text,authored,checked:false,api:null};selectionControls.set(host,state);
    if(isSwitch){
      const header=document.createElement('span'),row=document.createElement('span'),track=document.createElement('span');header.className='field__label';row.className='toggle';control.className='toggle__input';control.setAttribute('role','switch');track.className='toggle__track';track.setAttribute('aria-hidden','true');text.dataset.switchText='';row.append(control,track,text);label.append(header,row);state.header=header;
    }else{if(!button)label.append(control);text.append(...authored);label.append(text);}
    host.replaceChildren(label);
    function notify(previous){
      const value=state.checked;if(previous===value)return;
      emit(host,isSwitch?'toggled':'checkedChanged',{checked:value,isOn:isSwitch?value:undefined});
      if(!isSwitch)emit(host,value===null?'indeterminate':value?'checked':'unchecked',{checked:value});
    }
    function write(value,notifyChange=true){
      value=selectionState(value);if(isSwitch&&value===null)throw new TypeError('IsOn must be boolean');const previous=state.checked;
      state.checked=value;if(button)control.setAttribute('aria-pressed',value===null?'mixed':String(value));else{control.checked=value===true;control.indeterminate=value===null;}
      if(isSwitch)text.textContent=host.getAttribute(value?'on-content':'off-content')??(value?'On':'Off');
      if(notifyChange)notify(previous);
      if(radio&&value===true)syncRadioPeers(state,notifyChange);
    }
    state.write=write;state.notify=notify;
    const read=()=>button?state.checked:control.indeterminate?null:control.checked;
    state.sync=()=>{state.checked=read();if(isSwitch)text.textContent=host.getAttribute(state.checked?'on-content':'off-content')??(state.checked?'On':'Off');};
    if(button){control.addEventListener('click',()=>{if(control.disabled||control.closest('[inert]'))return;write(state.checked===null?false:state.checked?host.hasAttribute('three-state')?null:false:true);});}
    else{
      // Capture native state before the browser's checkbox pre-activation clears mixed.
      const snapshot=()=>{state.checked=read();};control.addEventListener('pointerdown',snapshot);control.addEventListener('keydown',event=>{if(event.key===' ')snapshot();});
      control.addEventListener('click',event=>{
        if(control.disabled||control.closest('[inert]')){event.preventDefault();return;}
        const previous=state.checked;
        if(!radio&&!isSwitch&&!host.hasAttribute('select-all')&&(host.hasAttribute('three-state')||previous===null))write(previous===null?false:previous?null:true,false);
        else state.sync();
        notify(previous);
        if(radio&&control.checked)syncRadioPeers(state,true);
      });
      // Legacy group helpers and application changes use the normal change event.
      control.addEventListener('change',()=>{const previous=state.checked;state.sync();notify(previous);if(radio&&control.checked)syncRadioPeers(state,true);});
    }
    const api=isSwitch?{
      get isOn(){return Boolean(read());},setOn:value=>{if(typeof value!=='boolean')throw new TypeError('IsOn must be boolean');write(value);},
      get header(){return host.getAttribute('header')??'';},setHeader:value=>setText('header',value),
      get onContent(){return host.getAttribute('on-content')??'On';},setOnContent:value=>setText('on-content',value),
      get offContent(){return host.getAttribute('off-content')??'Off';},setOffContent:value=>setText('off-content',value)
    }:{
      get checked(){return read();},setChecked:value=>write(value),
      get isThreeState(){return host.hasAttribute('three-state');},setThreeState:value=>{if(typeof value!=='boolean')throw new TypeError('IsThreeState must be boolean');host.toggleAttribute('three-state',value);},
      get content(){return text.textContent;},setContent:value=>{if(typeof value!=='string')throw new TypeError('Content must be text');host.setAttribute('content',value);}
    };
    if(radio)Object.defineProperties(api,{groupName:{get:()=>host.getAttribute('group-name')??''},setGroupName:{value:value=>setText('group-name',value)}});
    state.api=Object.freeze(api);
    function setText(name,value){if(typeof value!=='string')throw new TypeError(name+' must be text');host.setAttribute(name,value);}
    updateSelection(host,null,false);return state;
  }
  function updateSelection(host,name=null,notify=true){
    const state=selectionControls.get(host);if(!state)return;
    const{control,text,header}=state,isSwitch=host.localName==='winui-toggle-switch';
    if(name===null||name==='checked'||name==='is-on')state.write(isSwitch?host.hasAttribute('is-on'):selectionState(host.getAttribute('checked')??'false'),notify);
    if(!isSwitch&&(name===null||name==='content')){if(host.hasAttribute('content'))text.textContent=host.getAttribute('content');else if(name==='content')text.replaceChildren(...state.authored);}
    if(header){header.textContent=host.getAttribute('header')??'';text.dataset.onText=host.getAttribute('on-content')??'On';text.dataset.offText=host.getAttribute('off-content')??'Off';state.sync();}
    control.disabled=host.hasAttribute('disabled')||!!host.closest('[data-control-disabled]');
    for(const attr of ['aria-label','aria-describedby','tabindex']){if(host.hasAttribute(attr))control.setAttribute(attr,host.getAttribute(attr));else control.removeAttribute(attr);}
    if(host.localName==='winui-radio-button'){control.name=selectionGroup(host);control.value=host.getAttribute('value')??host.getAttribute('content')??'on';if(control.checked)syncRadioPeers(state,notify);}
    if(host.hasAttribute('select-all'))control.dataset.checkAll='';else delete control.dataset.checkAll;
    if(host.hasAttribute('group-item'))control.dataset.checkChild='';else delete control.dataset.checkChild;
    if(host.hasAttribute('three-state'))control.dataset.selectionThreeState='';else delete control.dataset.selectionThreeState;
  }
  for(const name of selectionTags.split(','))customElements.define(name,class extends HTMLElement{
    static observedAttributes=['content','checked','three-state','is-on','header','on-content','off-content','group-name','value','disabled','aria-label','aria-describedby','tabindex','select-all','group-item'];
    attributeChangedCallback(name){updateSelection(this,name);}
    connectedCallback(){if(selectionControls.has(this))updateSelection(this,'group-name');}
    get disabled(){return this.hasAttribute('disabled');}set disabled(value){this.toggleAttribute('disabled',Boolean(value));}
    click(){const state=hydrateSelection(this);state.sync();if(!this.closest('[inert]'))state.control.click();}
    focus(options){hydrateSelection(this).control.focus(options);}
  });
  function syncRadioPeers(state,notify){
    for(const peer of state.host.getRootNode().querySelectorAll('winui-radio-button')){const other=selectionControls.get(peer);if(other&&other!==state&&other.control.name===state.control.name&&other.control.form===state.control.form){const previous=other.checked;other.sync();if(notify)other.notify(previous);}}
  }
  function selectionApi(host,tag){if(!(host instanceof HTMLElement)||host.localName!==tag)throw new TypeError('Expected '+tag);return hydrateSelection(host).api;}
  function initializeToggleSwitch(input){
    if(input.dataset.switchInitialized)return;input.dataset.switchInitialized='true';
    const text=input.parentElement.querySelector('[data-switch-text]');if(!text)return;
    const sync=()=>text.textContent=input.checked?(text.dataset.onText??'On'):(text.dataset.offText??'Off');input.addEventListener('change',sync);new MutationObserver(sync).observe(text,{attributes:true,attributeFilter:['data-on-text','data-off-text']});sync();
  }

  // Concise action controls retain the existing native buttons and popup engine.
  const actionTags='winui-drop-down-button,winui-split-button';
  const actionControls=new WeakMap(),authoredMenuItems=new WeakMap(),buttonIcons=new WeakMap();
  const menuItemTags='winui-menu-item,winui-toggle-menu-item,winui-radio-menu-item,winui-menu-sub-item,winui-split-menu-item,winui-menu-separator';
  function hydrateMenuItem(host){
    if(host.localName==='winui-menu-separator'){if(!host.firstElementChild){const line=element(host.closest('winui-menu-bar')?'hr':'div','flyout-menu__separator');line.setAttribute('role','separator');host.append(line);}return host;}
    let state=authoredMenuItems.get(host);const toggle=host.localName==='winui-toggle-menu-item',radio=host.localName==='winui-radio-menu-item',branch=host.matches('winui-menu-sub-item,winui-split-menu-item'),split=host.localName==='winui-split-menu-item';
    if(!state){
      const children=[...host.childNodes],button=controlButton('flyout-menu__item'),icon=element('span','glyph'),text=document.createTextNode('');icon.setAttribute('aria-hidden','true');button.tabIndex=-1;button.append(icon,text);
      state={button,icon,text};authoredMenuItems.set(host,state);
      if(toggle||radio){const check=element('span','glyph flyout-menu__check');check.setAttribute('aria-hidden','true');button.prepend(check);state.check=check;}
      if(branch){
        const panel=element('div','flyout-menu');panel.dataset.menu='';panel.id=host.getAttribute('menu-id')||nextId();button.id=host.getAttribute('item-id')||nextId();button.dataset.submenu=panel.id;panel.dataset.submenuFor=button.id;state.panel=panel;
        const arrow=element('span','glyph flyout-menu__chevron','\uE974');arrow.setAttribute('aria-hidden','true');
        if(split){host.classList.add('flyout-menu__split');button.dataset.splitCommand='';const expander=controlButton('flyout-menu__expander');expander.dataset.menuExpander=button.id;expander.tabIndex=-1;expander.append(arrow);state.expander=expander;host.replaceChildren(button,expander,panel);}
        else{host.classList.add('flyout-menu__branch');button.append(arrow);host.replaceChildren(button,panel);}
        children.forEach(node=>panel.append(node));
      }else host.replaceChildren(button);
    }
    const value=host.getAttribute('icon');state.icon.hidden=!value;state.icon.textContent=value?commandGlyph(value):'';state.text.data=host.getAttribute('text')??'';state.button.dataset.value=host.getAttribute('value')??state.text.data;
    state.button.disabled=host.hasAttribute('disabled')||!!host.closest('[data-control-disabled]');
    state.button.setAttribute('role',toggle?'menuitemcheckbox':radio?'menuitemradio':'menuitem');
    if(toggle)state.button.dataset.menuToggle='';if(radio)state.button.dataset.menuRadio=host.getAttribute('group-name')||'default';
    if(state.check){state.check.textContent=host.getAttribute('check-icon')?commandGlyph(host.getAttribute('check-icon')):radio?'\uE915':'\uE73E';state.button.setAttribute('aria-checked',String(host.hasAttribute('checked')));}
    if(radio&&host.hasAttribute('checked')){
      const owner=host.closest('winui-menu-flyout,winui-menu-bar,winui-drop-down-button,winui-split-button');
      owner?.querySelectorAll('winui-radio-menu-item[checked]').forEach(peer=>{if(peer!==host&&(peer.getAttribute('group-name')||'default')===(host.getAttribute('group-name')||'default'))peer.removeAttribute('checked');});
    }
    if(host.hasAttribute('aria-label'))state.button.setAttribute('aria-label',host.getAttribute('aria-label'));else state.button.removeAttribute('aria-label');
    if(state.expander){state.expander.setAttribute('aria-label',host.getAttribute('expander-label')||'More '+state.text.data+' options');state.expander.disabled=state.button.disabled;}
    if(state.panel){for(const node of [...host.children])if(node!==state.button&&node!==state.expander&&node!==state.panel)state.panel.append(node);[...state.panel.children].filter(node=>node.matches(menuItemTags)).forEach(hydrateMenuItem);}
    return state.button;
  }
  function hydrateAction(host){
    let state=actionControls.get(host);
    if(!state){
      const split=host.localName==='winui-split-button',authored=[...host.childNodes],anchor=element('div','menu-anchor'),bar=split?element('div','split-button'):anchor;
      const primary=controlButton(split?'button split-button__primary':'button button--dropdown'),secondary=split?controlButton('button split-button__secondary'):primary,icon=element('span','glyph'),text=document.createTextNode(''),chevron=element('span','dropdown-chevron','\uE70D'),panel=element('div','flyout-menu');
      icon.setAttribute('aria-hidden','true');icon.dataset.dropdownIcon='';chevron.setAttribute('aria-hidden','true');secondary.dataset.toggleMenu='';panel.dataset.menu='';
      primary.append(icon,text);secondary.append(chevron);if(split){const menuAnchor=element('div','menu-anchor');menuAnchor.append(secondary,panel);bar.append(primary,menuAnchor);anchor.append(bar);}else{anchor.append(primary,panel);}
      const content=authored.filter(node=>node instanceof Element&&node.getAttribute('slot')==='content');
      if(content.length>1)throw new TypeError('Only one action content slot is supported');
      state={host,anchor,bar,primary,secondary,icon,text,panel,content:content[0]||null};actionControls.set(host,state);
      if(state.content)primary.insertBefore(state.content,split?null:chevron);
      for(const node of authored)if(node!==state.content&&(node.nodeType!==Node.TEXT_NODE||node.textContent.trim()))panel.append(node);
      host.replaceChildren(anchor);
      primary.addEventListener('click',()=>{if(split&&!primary.disabled&&!primary.closest('[inert]'))emit(host,'primaryInvoked',{});});
      state.api=Object.freeze({get content(){return host.getAttribute('content')??'';},setContent:value=>setText('content',value),get icon(){return host.getAttribute('icon')||null;},setIcon:value=>{if(value!==null)commandGlyph(value);if(value===null)host.removeAttribute('icon');else host.setAttribute('icon',value);},get flyout(){return panel;},get isFlyoutOpen(){return !!menuControllers.get(panel)?.popup.isOpen();},openFlyout:()=>{if(!secondary.disabled&&!host.closest('[inert]'))menuControllers.get(panel)?.open();},closeFlyout:()=>menuControllers.get(panel)?.close(true)});
      function setText(name,value){if(typeof value!=='string')throw new TypeError(name+' must be text');host.setAttribute(name,value);}
    }
    // New declarative rows can be appended, then initialized as one complete fragment.
    for(const node of [...host.children])if(node!==state.anchor&&node.getAttribute('slot')!=='content')state.panel.append(node);
    state.panel.querySelectorAll(menuItemTags).forEach(hydrateMenuItem);
    for(const item of state.panel.querySelectorAll('.flyout-menu__item')){item.tabIndex=-1;if(!item.hasAttribute('role'))item.setAttribute('role','menuitem');}
    updateAction(host);initializeMenu(state.panel);return state;
  }
  function updateAction(host){
    const state=actionControls.get(host);if(!state)return;
    const split=host.localName==='winui-split-button',value=host.getAttribute('icon');
    state.icon.hidden=!value;state.icon.textContent=value?commandGlyph(value):'';state.text.data=state.content?'':host.getAttribute('content')??'';
    state.primary.disabled=state.secondary.disabled=host.hasAttribute('disabled')||!!host.closest('[data-control-disabled]');
    state.primary.classList.toggle('split-button__primary--swatch',split&&host.getAttribute('appearance')==='swatch');
    if(state.flyoutClasses)state.panel.classList.remove(...state.flyoutClasses);
    state.flyoutClasses=(host.getAttribute('flyout-class')||'').split(/\s+/).filter(name=>name&&!['flyout-menu','winui-popup','is-active'].includes(name));
    state.panel.classList.add(...state.flyoutClasses);
    for(const name of ['aria-label','aria-describedby','tabindex']){if(host.hasAttribute(name))state.primary.setAttribute(name,host.getAttribute(name));else state.primary.removeAttribute(name);}
    if(split)state.secondary.setAttribute('aria-label',host.getAttribute('secondary-label')||(host.getAttribute('content')?host.getAttribute('content')+' options':'Options'));
    if(state.secondary.disabled)menuControllers.get(state.panel)?.close(false);
  }
  function actionApi(host,tag){if(!(host instanceof HTMLElement)||host.localName!==tag)throw new TypeError('Expected '+tag);return hydrateAction(host).api;}
  for(const tag of actionTags.split(','))customElements.define(tag,class extends HTMLElement{
    static observedAttributes=['content','icon','disabled','appearance','flyout-class','secondary-label','aria-label','aria-describedby','tabindex'];
    attributeChangedCallback(){updateAction(this);}
    disconnectedCallback(){const state=actionControls.get(this);if(state)menuControllers.get(state.panel)?.close(false);}
    get disabled(){return this.hasAttribute('disabled');}set disabled(value){this.toggleAttribute('disabled',Boolean(value));}
    click(){const state=hydrateAction(this);if(!this.closest('[inert]'))state.primary.click();}
    focus(options){hydrateAction(this).primary.focus(options);}
  });
  for(const tag of menuItemTags.split(','))customElements.define(tag,class extends HTMLElement{
    static observedAttributes=['text','icon','value','disabled','aria-label','checked','group-name','check-icon','expander-label'];
    attributeChangedCallback(){if(authoredMenuItems.has(this))hydrateMenuItem(this);}
    focus(options){hydrateMenuItem(this).focus(options);}
  });
  function initializeButtonIcon(button){
    let state=buttonIcons.get(button);if(!state){const icon=element('span','button__image');icon.setAttribute('aria-hidden','true');button.prepend(icon);state={icon,key:null};buttonIcons.set(button,state);new MutationObserver(()=>initializeButtonIcon(button)).observe(button,{attributes:true,attributeFilter:['data-button-icon']});}
    if(state.icon.parentElement!==button)button.prepend(state.icon);
    const key=button.getAttribute('data-button-icon')||'';if(state.key===key)return;state.key=key;state.icon.hidden=!key;if(!key){state.icon.replaceChildren();return;}state.icon.dataset.icon=key;
    const icons=window.WinUIIcons;if(!icons)throw new Error('Graphical buttons require the complete Toolkit icon module');
    icons.request().then(()=>{if(state.key===key)icons.initialize(state.icon);}).catch(error=>emit(button,'iconLoadFailed',{error}));
  }

  const surfaceStates=new WeakMap(),menuHeaders=new WeakMap(),menuAssociations=new WeakMap();
  const surfaceTags='winui-flyout,winui-teaching-tip';
  function hydrateMenuSurface(host){
    host.classList.add('flyout-menu','winui-popup');host.dataset.menu='';if(!host.id)host.id=nextId();
    [...host.children].filter(node=>node.matches(menuItemTags)).forEach(hydrateMenuItem);
    return host;
  }
  function hydrateMenuHeader(host){
    let state=menuHeaders.get(host);
    if(!state){const children=[...host.childNodes],anchor=element('div','menu-anchor'),button=controlButton('button button--subtle menu-bar__heading'),panel=element('div','flyout-menu');
      panel.dataset.menu='';panel.id=host.getAttribute('menu-id')||nextId();button.dataset.menuHeading='';button.dataset.toggleMenu='';button.dataset.toggleMenuTarget=panel.id;anchor.append(button,panel);children.forEach(node=>panel.append(node));host.replaceChildren(anchor);state={anchor,button,panel};menuHeaders.set(host,state);}
    for(const node of [...host.children])if(node!==state.anchor)state.panel.append(node);
    [...state.panel.children].filter(node=>node.matches(menuItemTags)).forEach(hydrateMenuItem);
    state.button.textContent=host.getAttribute('title')||'';state.button.disabled=host.hasAttribute('disabled')||!!host.closest('[data-control-disabled]');
    if(state.button.disabled)menuControllers.get(state.panel)?.close(false);return state;
  }
  function hydrateMenuBar(host){
    host.classList.add('menu-bar');host.dataset.menuBar='';
    [...host.children].filter(node=>node.localName==='winui-menu-bar-item').forEach(hydrateMenuHeader);initializeMenuBar(host);
    host.querySelectorAll('[data-menu]').forEach(initializeMenu);
  }
  function associateMenu(trigger,host){
    trigger=authoredButtons.get(trigger)?.button||trigger;
    if(!host||host.localName!=='winui-menu-flyout')throw new TypeError('data-menu-flyout must name winui-menu-flyout');
    const existing=menuAssociations.get(host);if(existing&&existing!==trigger)throw new TypeError('A declarative MenuFlyout has one trigger');
    hydrateMenuSurface(host);let anchor=trigger.closest('.menu-anchor');if(!anchor){anchor=element('div','menu-anchor');trigger.before(anchor);anchor.append(trigger);}if(host.parentElement!==anchor)anchor.append(host);trigger.dataset.toggleMenu='';menuAssociations.set(host,trigger);initializeMenu(host);
  }
  function hydrateSurface(host){
    let state=surfaceStates.get(host);const teaching=host.localName==='winui-teaching-tip';
    if(!state){const nodes=[...host.childNodes],body=element('div',teaching?'teaching-tip__content':'flyout__content');host.classList.add(teaching?'teaching-tip':'flyout','winui-popup');host.dataset.popup='';host.replaceChildren(body);state={host,body,bindings:new Map(),teaching};surfaceStates.set(host,state);
      if(teaching){state.icon=element('span','glyph');state.icon.setAttribute('aria-hidden','true');state.title=element('strong','');state.subtitle=element('p','');state.action=controlButton('button');state.action.dataset.teachingAction='';state.close=controlButton('button');state.close.dataset.closePopup='';body.append(state.icon,state.title,state.subtitle);state.action.addEventListener('click',()=>emit(host,'actionButtonClick',{}));state.close.addEventListener('click',()=>emit(host,'closeButtonClick',{}));}
      for(const node of nodes){if(teaching&&node instanceof Element&&node.slot==='hero'){node.classList.add('teaching-tip__hero');host.prepend(node);state.hero=node;}else body.append(node);}
      if(teaching)body.append(state.action,state.close);
    }
    for(const node of [...host.childNodes])if(node!==state.body&&node!==state.hero){if(teaching&&node instanceof Element&&node.slot==='hero'){state.hero?.remove();node.classList.add('teaching-tip__hero');state.hero=node;host.insertBefore(node,state.body);}else state.body.insertBefore(node,teaching?state.action:null);}
    updateSurface(host);return state;
  }
  function updateSurface(host){
    const state=surfaceStates.get(host);if(!state)return;
    if(state.teaching){const {icon,title,subtitle,action,close}=state;
      title.textContent=host.getAttribute('title')||'';title.hidden=!title.textContent;subtitle.textContent=host.getAttribute('subtitle')||'';subtitle.hidden=!subtitle.textContent;
      icon.hidden=!host.hasAttribute('icon');icon.textContent=host.hasAttribute('icon')?commandGlyph(host.getAttribute('icon')):'';
      action.textContent=host.getAttribute('action-button-content')||'';action.hidden=!action.textContent;
      const closeText=host.getAttribute('close-button-content');close.className=closeText?'button':'button button--subtle button--icon';close.replaceChildren();
      if(closeText)close.textContent=closeText;else{const glyph=element('span','glyph','\uE711');glyph.setAttribute('aria-hidden','true');close.append(glyph);}close.setAttribute('aria-label',host.getAttribute('close-label')||closeText||'Close TeachingTip');
      host.dataset.targeted=String(host.hasAttribute('target'));host.dataset.lightDismiss=String(host.hasAttribute('light-dismiss'));
      host.dataset.placement=host.getAttribute('placement')||'auto';
    }else if(host.hasAttribute('placement'))host.dataset.placement=host.getAttribute('placement');else delete host.dataset.placement;
    if(state.teaching&&(!host.hasAttribute('aria-label')||host.getAttribute('aria-label')===state.autoLabel)){state.autoLabel=host.getAttribute('title')||'';if(state.autoLabel)host.setAttribute('aria-label',state.autoLabel);else host.removeAttribute('aria-label');}
    for(const binding of state.bindings.values())binding.popup.configure(surfaceOptions(state));
  }
  function surfaceOptions(state){
    const host=state.host,untargeted=state.teaching&&!host.hasAttribute('target');
    return {placement:host.getAttribute('placement')||undefined,viewportAnchor:untargeted,getRect:untargeted?()=>({left:0,top:0,right:innerWidth,bottom:innerHeight,width:innerWidth,height:innerHeight}):state.teaching&&host.hasAttribute('target')?()=>scopedId(host,host.getAttribute('target')).getBoundingClientRect():undefined,lightDismiss:!state.teaching||host.hasAttribute('light-dismiss'),onOpen:()=>emit(host,'opened',{}),onClose:()=>emit(host,'closed',{})};
  }
  function associateSurface(trigger,host){
    trigger=namedRoot(trigger);
    if(!host?.matches(surfaceTags))throw new TypeError('data-flyout must name a Flyout or TeachingTip');
    const state=hydrateSurface(host),target=host.hasAttribute('target')?namedRoot(scopedId(host,host.getAttribute('target'))):trigger;
    if(!target)throw new RangeError('TeachingTip target not found');
    // Binding owns activation; placement can use a separate explicit target.
    const binding=bindFlyout(host,trigger);binding.popup.configure({...surfaceOptions(state),getRect:state.teaching&&host.hasAttribute('target')?()=>target.getBoundingClientRect():surfaceOptions(state).getRect});state.bindings.set(trigger,binding);
    return binding;
  }
  function surfaceApi(host){
    if(!host.matches(surfaceTags))throw new TypeError('Expected a Flyout or TeachingTip');const state=hydrateSurface(host);
    return state.api||(state.api=Object.freeze({get isOpen(){return [...state.bindings.values()].some(binding=>binding.popup.isOpen());},showAt:trigger=>associateSurface(trigger,host).popup.show(),hide:()=>state.bindings.forEach(binding=>binding.popup.close(true)),refresh:()=>hydrateSurface(host)}));
  }
  for(const tag of surfaceTags.split(','))customElements.define(tag,class extends HTMLElement{
    static observedAttributes=['title','subtitle','icon','placement','target','light-dismiss','action-button-content','close-button-content','close-label'];
    attributeChangedCallback(){updateSurface(this);}
    disconnectedCallback(){surfaceStates.get(this)?.bindings.forEach(binding=>binding.popup.close(false));}
  });
  customElements.define('winui-menu-flyout',class extends HTMLElement{disconnectedCallback(){menuControllers.get(this)?.close(false);}});
  customElements.define('winui-menu-bar',class extends HTMLElement{disconnectedCallback(){this.querySelectorAll('[data-menu]').forEach(menu=>menuControllers.get(menu)?.close(false));}});
  customElements.define('winui-menu-bar-item',class extends HTMLElement{
    static observedAttributes=['title','disabled'];attributeChangedCallback(){if(menuHeaders.has(this))hydrateMenuHeader(this);}
  });

  const statusControls=new WeakMap();
  const statusTags='winui-info-badge,winui-info-bar,winui-progress-ring,winui-content-dialog';
  const finiteAttribute=(host,name,fallback)=>{const value=host.hasAttribute(name)?Number(host.getAttribute(name)):fallback;if(!Number.isFinite(value))throw new TypeError(name+' must be finite');return value;};
  function statusSizing(host,target){
    for(const name of ['width','height']){if(host.hasAttribute(name)){target.dataset[name]=host.getAttribute(name);initializeSizing(target);}else delete target.dataset[name];}
  }
  function hydrateBadge(host){
    let state=statusControls.get(host);if(!state){const value=element('span','info-badge__value'),icon=element('span','info-badge__icon');icon.setAttribute('aria-hidden','true');host.classList.add('info-badge');host.setAttribute('role','img');host.replaceChildren(value,icon);state={value,icon};statusControls.set(host,state);state.api=Object.freeze({get value(){return state.number;},setValue:value=>{if(!Number.isInteger(value))throw new TypeError('Badge value must be an integer');host.setAttribute('value',String(value));}});}
    const value=finiteAttribute(host,'value',-1);if(!Number.isInteger(value)||value< -1||value>2147483647)throw new RangeError('Badge value must be an Int32 of at least -1');state.number=value;
    const icon=host.getAttribute('icon');state.value.textContent=String(value);state.value.hidden=value<0;state.icon.textContent=icon?commandGlyph(icon):'';state.icon.hidden=value>=0||!icon;host.classList.toggle('info-badge--dot',value<0&&!icon);
    const appearance=host.getAttribute('appearance')||'accent';enumValue(appearance,['accent','attention','informational','success','caution','critical'],'Badge appearance');for(const name of ['attention','informational','success','caution','critical'])host.classList.toggle('info-badge--'+name,appearance===name);
    if(host.hasAttribute('opacity')){const opacity=finiteAttribute(host,'opacity',1);if(opacity<0||opacity>1)throw new RangeError('Opacity must be between zero and one');host.style.setProperty('--badge-opacity',String(opacity));state.opacityApplied=true;}else if(state.opacityApplied){host.style.removeProperty('--badge-opacity');state.opacityApplied=false;}
    if(!host.hasAttribute('aria-label')||host.getAttribute('aria-label')===state.autoLabel){state.autoLabel=value>=0?String(value):icon?'Notification':'New activity';host.setAttribute('aria-label',state.autoLabel);}return state;
  }
  function hydrateInfo(host){
    let state=statusControls.get(host);if(!state){const children=[...host.childNodes].filter(node=>node.nodeType!==Node.TEXT_NODE||node.textContent.trim()),expanded=children.some(node=>node instanceof Element&&['action','content'].includes(node.slot)),icon=element('span','info-bar__icon'),body=element('div',''),title=element(expanded?'strong':'div',expanded?'':'info-bar__title'),message=element(expanded?'p':'div',expanded?'':'info-bar__message');icon.setAttribute('aria-hidden','true');body.append(title,message);body.append(...children);host.classList.add('info-bar');host.dataset.infoBar='';host.replaceChildren(icon,body);state={icon,body,title,message};statusControls.set(host,state);initializeInfoBar(host);host.addEventListener('closed',()=>host.removeAttribute('open'));state.api=Object.freeze({get isOpen(){return !host.hidden;},get message(){return host.getAttribute('message')||'';},show:()=>host.setAttribute('open',''),hide:()=>infoBars.get(host).hide()});}
    for(const node of [...host.children])if(node!==state.icon&&node!==state.body&&node!==infoBars.get(host).close)state.body.append(node);
    const severity=host.getAttribute('severity')||'informational';enumValue(severity,['informational','success','warning','error'],'InfoBar severity');for(const[name,css]of Object.entries({informational:'info',success:'success',warning:'warning',error:'danger'}))host.classList.toggle('info-bar--'+css,severity===name);
    state.title.textContent=host.getAttribute('title')||'';state.title.hidden=!state.title.textContent;state.message.textContent=host.getAttribute('message')||'';state.message.hidden=!state.message.textContent;host.dataset.closable=String(!host.hasAttribute('not-closable'));host.dataset.iconVisible=String(!host.hasAttribute('hide-icon'));host.hidden=!host.hasAttribute('open');host.setAttribute('role',severity==='error'||severity==='warning'?'alert':'status');return state;
  }
  function hydrateRing(host){
    let state=statusControls.get(host);if(!state){state={};statusControls.set(host,state);state.api=Object.freeze({get value(){return state.value;},setValue:value=>{if(!Number.isFinite(value))throw new TypeError('Value must be finite');host.setAttribute('value',String(value));},get isActive(){return host.hasAttribute('active');},setActive:value=>host.toggleAttribute('active',Boolean(value)),get isIndeterminate(){return !host.hasAttribute('determinate');},setIndeterminate:value=>host.toggleAttribute('determinate',!value)});}
    const determinate=host.hasAttribute('determinate'),min=finiteAttribute(host,'minimum',0),max=finiteAttribute(host,'maximum',100);if(max<min)throw new RangeError('Maximum must be at least Minimum');state.value=Math.max(min,Math.min(max,finiteAttribute(host,'value',0)));
    if(!state.root||state.determinate!==determinate){state.determinate=determinate;
      if(determinate){const root=document.createElementNS('http://www.w3.org/2000/svg','svg');root.setAttribute('viewBox','0 0 32 32');root.classList.add('progress-ring','progress-ring--determinate');for(const name of ['track','value']){const circle=document.createElementNS(root.namespaceURI,'circle');circle.setAttribute('cx','16');circle.setAttribute('cy','16');circle.setAttribute('r','14');circle.classList.add('progress-ring__'+name);if(name==='value'){circle.setAttribute('pathLength','100');state.circle=circle;}root.append(circle);}state.root=root;}
      else{state.root=element('span','progress-ring');initializeProgressRing(state.root);}host.replaceChildren(state.root);
    }
    const root=state.root;root.setAttribute('role','progressbar');root.setAttribute('aria-label',host.getAttribute('aria-label')||'Progress');root.dataset.active=String(host.hasAttribute('active'));root.dataset.backgroundVisible=String(host.hasAttribute('background-visible'));
    if(determinate){root.setAttribute('aria-valuemin',String(min));root.setAttribute('aria-valuemax',String(max));root.setAttribute('aria-valuenow',String(state.value));state.circle.setAttribute('stroke-dasharray',String(max===min?0:(state.value-min)/(max-min)*100)+' 100');}statusSizing(host,root);return state;
  }
  function hydrateContentDialog(host){
    let state=statusControls.get(host);if(!state){const nodes=[...host.childNodes],dialog=element('section','modal'),body=element('div','modal__content'),title=element('h2','modal__title'),actions=element('div','modal-actions');host.classList.add('modal-backdrop');host.dataset.modal='';dialog.setAttribute('role','dialog');title.id=(host.id||nextId())+'-title';dialog.setAttribute('aria-labelledby',title.id);body.append(title);
      for(const node of nodes){if(node instanceof Element&&node.slot==='title-prefix')body.insertBefore(node,title);else body.append(node);}dialog.append(body,actions);host.replaceChildren(dialog);state={dialog,body,title,actions,buttons:{}};statusControls.set(host,state);
      for(const name of ['primary','secondary','close']){const button=controlButton('button');button.dataset.closeModal='';button.dataset.dialogAction=name;actions.append(button);state.buttons[name]=button;}
      updateContentDialog(host,state);initializeDialog(host);state.api=dialogs.get(host);
    }
    for(const node of [...host.childNodes])if(node!==state.dialog)state.body.append(node);updateContentDialog(host,state);return state;
  }
  function updateContentDialog(host,state){
    state.title.textContent=host.getAttribute('title')||'';state.title.hidden=!state.title.textContent;
    const choice=host.getAttribute('default-button')||'none';enumValue(choice,['none','primary','secondary','close'],'DefaultButton');host.dataset.defaultButton=choice;const sound=host.getAttribute('system-sound')||'none';enumValue(sound,['none','default','error','warning','question','information'],'System sound');host.dataset.systemSound=sound;
    for(const[name,button]of Object.entries(state.buttons)){button.textContent=host.getAttribute(name+'-button-text')||'';button.hidden=!button.textContent;button.disabled=!!button.closest('[data-control-disabled]')||name!=='close'&&host.hasAttribute(name+'-disabled');button.classList.toggle('button--primary',name===choice);}
  }
  function statusApi(host,tag){if(!(host instanceof HTMLElement)||host.localName!==tag)throw new TypeError('Expected '+tag);return hydrateStatus(host).api;}
  function hydrateStatus(host){return host.localName==='winui-info-badge'?hydrateBadge(host):host.localName==='winui-info-bar'?hydrateInfo(host):host.localName==='winui-progress-ring'?hydrateRing(host):hydrateContentDialog(host);}
  for(const tag of statusTags.split(','))customElements.define(tag,class extends HTMLElement{
    static observedAttributes=['value','icon','appearance','opacity','title','message','severity','open','not-closable','hide-icon','minimum','maximum','determinate','active','background-visible','width','height','aria-label','default-button','system-sound','primary-button-text','secondary-button-text','close-button-text','primary-disabled','secondary-disabled'];
    attributeChangedCallback(name,previous,value){if(previous!==value&&statusControls.has(this))hydrateStatus(this);}
  });

  // Text inputs/selects stay native; only their repeated header template is generated.
  const fieldHeaders=new WeakMap(),inputControls=new WeakMap(),sliderControls=new WeakMap(),fieldDescriptions=new WeakMap(),nativeInputMetadata=new WeakSet();
  function initializeInputMetadata(control){
    if(nativeInputMetadata.has(control))return;nativeInputMetadata.add(control);
    new MutationObserver(()=>{if(control.hasAttribute('data-header')||control.hasAttribute('data-description')||fieldHeaders.has(control))initializeFieldHeader(control);}).observe(control,{attributes:true,attributeFilter:['data-header','data-description','aria-describedby']});
  }
  function synchronizeInputDescription(control,anchor,targets,text){
    let state=fieldDescriptions.get(control);
    if(!state&&text){const wrapper=element('div','input-description-field'),description=element('span','input-description');description.id=nextId();anchor.before(wrapper);wrapper.append(anchor,description);state={wrapper,description};fieldDescriptions.set(control,state);}
    if(!state)return;
    state.description.textContent=text||'';state.description.hidden=!text;
    const ids=(control.getAttribute('aria-describedby')||'').split(/\s+/).filter(id=>id&&id!==state.description.id);if(text)ids.push(state.description.id);
    const value=[...new Set(ids)].join(' ');for(const target of targets){if(value){if(target.getAttribute('aria-describedby')!==value)target.setAttribute('aria-describedby',value);}else target.removeAttribute('aria-describedby');}
    const width=control.getAttribute('width')||control.dataset.width;if(width){state.wrapper.dataset.width=width;initializeSizing(state.wrapper);}else delete state.wrapper.dataset.width;
  }
  function initializeFieldHeader(control){
    let state=fieldHeaders.get(control);
    if(!state){
      const label=element('label','field'),text=element('span','field__label');
      const anchor=comboBoxes.get(control)?.wrapper||control;anchor.before(label);label.append(text,anchor);state={label,text};fieldHeaders.set(control,state);
      new MutationObserver(()=>initializeFieldHeader(control)).observe(control,{attributes:true,attributeFilter:['data-header','data-width','data-input-width','data-description','aria-describedby']});
    }
    state.text.textContent=control.dataset.header||'';state.text.hidden=!control.dataset.header;
    if(control.dataset.inputWidth){
      if(!/^\d+(\.\d+)?$/.test(control.dataset.inputWidth))throw new RangeError('Input width must be nonnegative');
      if(!control.parentElement.classList.contains('text-control')){const wrapper=element('span','text-control');control.before(wrapper);wrapper.append(control);control.classList.add('text-control__input');}
      control.classList.add('sized-control');control.style.setProperty('--control-width-parameter',Math.min(10000,Number(control.dataset.inputWidth))+'px');state.inputWidth=true;
    }else if(state.inputWidth){control.style.removeProperty('--control-width-parameter');state.inputWidth=false;}
    synchronizeInputDescription(control,state.label,comboBoxes.get(control)?.targets||[control],control.dataset.description);
    for(const target of [state.label,control.closest('.text-control,.combo-box')].filter(Boolean)){
      if(control.dataset.width){target.dataset.width=control.dataset.width;initializeSizing(target);}else delete target.dataset.width;
    }
  }
  const inputTags='winui-number-box,winui-slider,winui-auto-suggest-box';
  function inputItems(host){
    const id=host.getAttribute('items-source'),list=id&&(host.getRootNode().querySelector?.('#'+CSS.escape(id))||host.ownerDocument.getElementById(id));
    if(id&&!list)throw new RangeError('Suggestion source not found: '+id);
    return list?[...list.querySelectorAll('option')].filter(option=>!option.disabled).map(option=>option.value||option.textContent):[];
  }
  function hydrateInput(host){
    if(inputControls.has(host))return inputControls.get(host);
    const number=host.localName==='winui-number-box',slider=host.localName==='winui-slider',hasHeader=host.hasAttribute('header');
    const root=element(number?(hasHeader?'span':'div'):slider?'label':hasHeader?'span':'div',number?'number-box':slider?'slider':'auto-suggest'),input=document.createElement('input');
    input.type=slider?'range':'text';input.className=number?'number-box__input':slider?'slider__input':'text-field auto-suggest__input';
    const state={host,root,input,ready:false,header:null};inputControls.set(host,state);
    if(number){
      root.dataset.numberBox='';input.inputMode='decimal';root.append(input);
      for(const direction of [-1,1]){const button=controlButton('button number-box__step',direction>0?'\uE710':'\uE738',direction>0?'Increase':'Decrease');button.dataset.step=String(direction);root.append(button);}
      const status=element('span','visually-hidden');status.setAttribute('role','status');root.append(status);
    }else if(slider){root.dataset.slider='';root.append(input);}
    else{
      root.dataset.autoSuggest='';input.autocomplete='off';root.append(input);
      if(hasHeader){const wrapper=element('span','text-control');input.before(wrapper);wrapper.append(input);input.classList.add('text-control__input');}
      const query=controlButton('button button--subtle auto-suggest__query'),glyph=element('span','glyph');glyph.setAttribute('aria-hidden','true');query.dataset.query='';query.append(glyph);root.append(query);
      const list=element(hasHeader?'span':'div','suggestion-list'),status=element('span','visually-hidden');list.setAttribute('role','listbox');status.setAttribute('role','status');if(hasHeader)status.setAttribute('aria-live','polite');root.append(list,status);state.query=query;state.glyph=glyph;state.list=list;
    }
    if(hasHeader&&!slider){const label=element('label','field'),text=element('span','field__label');label.append(text,root);state.header=text;state.container=label;host.replaceChildren(label);}else{state.container=root;host.replaceChildren(root);if(hasHeader){const text=element('span','field__label');root.prepend(text);state.header=text;}}
    updateInput(host,null);
    if(number)initializeNumberBox(root);else if(slider)initializeSlider(root);else{root.dataset.items=JSON.stringify(inputItems(host));initializeAutoSuggest(root);suggestions.get(root).setProvider(query=>inputItems(host).filter(item=>item.toLocaleLowerCase().includes(query.toLocaleLowerCase())));}
    if(!number&&!slider)initializeTextBorder(input);
    state.ready=true;
    state.api=number?numbers.get(root):slider?sliderControls.get(root):Object.freeze({get text(){return input.value;},setText:value=>{if(typeof value!=='string')throw new TypeError('Text must be text');input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));},get isSuggestionListOpen(){return suggestions.get(root).isOpen;},open:()=>suggestions.get(root).open(),close:()=>suggestions.get(root).close(),setOpen:value=>{if(typeof value!=='boolean')throw new TypeError('Open state must be Boolean');if(value)return suggestions.get(root).open();suggestions.get(root).close();return Promise.resolve(false);}});
    if(!number&&!slider&&host.hasAttribute('suggestion-list-open'))suggestions.get(root).open();
    return state;
  }
  function updateInput(host,name){
    const state=inputControls.get(host);if(!state)return;
    const{root,input}=state,number=host.localName==='winui-number-box',slider=host.localName==='winui-slider';
    if(!state.header&&host.hasAttribute('header')){
      const text=element('span','field__label');state.header=text;
      if(slider)root.prepend(text);
      else{const label=element('label','field');root.before(label);label.append(text,root);state.container=label;}
    }
    if(state.header){state.header.textContent=host.getAttribute('header')||'';state.header.hidden=!host.getAttribute('header');}
    for(const attr of ['aria-label','aria-describedby','tabindex','placeholder']){if(host.hasAttribute(attr))input.setAttribute(attr,host.getAttribute(attr));else input.removeAttribute(attr);}
    if(!host.hasAttribute('aria-label')&&host.hasAttribute('header'))input.setAttribute('aria-label',host.getAttribute('header'));
    input.disabled=host.hasAttribute('disabled')||!!host.closest('[data-control-disabled]');input.readOnly=host.hasAttribute('readonly');
    if(!number&&!slider){if(host.hasAttribute('width'))input.dataset.width=host.getAttribute('width');else delete input.dataset.width;}
    for(const target of new Set([root,state.container,...(!number&&!slider&&input.closest('.text-control')?[input.closest('.text-control')]:[])])){
      if(host.hasAttribute('width')){target.dataset.width=host.getAttribute('width');initializeSizing(target);}else delete target.dataset.width;
    }
    if(host.hasAttribute('height')){root.dataset.height=host.getAttribute('height');initializeSizing(root);}else delete root.dataset.height;
    if(number){
      for(const attr of ['minimum','maximum','small-change','large-change','rounding-increment','fraction-digits','locale']){const key=attr.replace(/-([a-z])/g,(_,c)=>c.toUpperCase());if(host.hasAttribute(attr))root.dataset[key]=host.getAttribute(attr);else delete root.dataset[key];}
      root.dataset.acceptsExpression=String(host.hasAttribute('accepts-expression'));root.dataset.wrap=String(host.hasAttribute('wrap'));
      const validationMode=host.getAttribute('validation-mode')||'invalid-input-overwritten';enumValue(validationMode,['invalid-input-overwritten','disabled'],'Validation mode');root.dataset.validationMode=validationMode;
      const placement=host.getAttribute('spin-placement')||'hidden';enumValue(placement,['stacked','hidden','inline','compact'],'Spin placement');
      if(placement==='stacked')delete root.dataset.spinPlacement;else root.dataset.spinPlacement=placement;
      const up=root.querySelector('[data-step="1"]'),down=root.querySelector('[data-step="-1"]');up.textContent=placement==='stacked'?'\uE70E':'\uE710';down.textContent=placement==='stacked'?'\uE70D':'\uE738';
      up.setAttribute('aria-label',host.getAttribute('increase-label')||'Increase');down.setAttribute('aria-label',host.getAttribute('decrease-label')||'Decrease');
      if(!state.ready&&placement==='stacked'){down.before(up);}
      if(state.ready&&['minimum','maximum','small-change','large-change','rounding-increment','fraction-digits','locale','spin-placement','accepts-expression','wrap','disabled','validation-mode'].includes(name)){numbers.get(root).configure(name==='validation-mode',name==='disabled');if(placement!=='compact')root.querySelector('[role="status"]').before(...(placement==='stacked'?[up,down]:[down,up]));}
      if(name===null||name==='value'){const text=host.getAttribute('value')??'',value=text===''?null:Number(text);if(value!==null&&!Number.isFinite(value))throw new TypeError('Value must be finite or empty');if(state.ready)numbers.get(root).setValue(value);else input.value=text;}
      if(name==='text'||name===null&&!host.hasAttribute('value')&&host.hasAttribute('text')){if(state.ready)numbers.get(root).setText(host.getAttribute('text')||'');else input.value=host.getAttribute('text')||'';}
    }else if(slider){
      for(const attr of ['minimum','maximum']){const target=attr==='minimum'?'min':'max';if(host.hasAttribute(attr))input.setAttribute(target,host.getAttribute(attr));else input.removeAttribute(target);}const configuredStep=host.getAttribute('step-frequency')??host.getAttribute('step');root.dataset.stepFrequency=configuredStep??'1';if(configuredStep!==null)input.setAttribute('step',configuredStep);else input.removeAttribute('step');root.dataset.directionReversed=String(host.hasAttribute('direction-reversed'));root.dataset.snapsTo=host.getAttribute('snaps-to')||'step-values';
      root.dataset.orientation=host.getAttribute('orientation')||'horizontal';input.setAttribute('aria-orientation',root.dataset.orientation);
      for(const attr of ['tick-frequency','small-change','large-change','unit','tick-placement','thumb-tooltip-enabled']){const key=attr.replace(/-([a-z])/g,(_,c)=>c.toUpperCase());if(host.hasAttribute(attr))root.dataset[key]=host.getAttribute(attr);else delete root.dataset[key];}
      if(name===null||name==='value')input.value=host.getAttribute('value')??'0';if(state.ready)sliderControls.get(root).refresh();
    }else{
      const icon=host.getAttribute('query-icon');state.query.hidden=!icon;state.glyph.textContent=icon?commandGlyph(icon):'';state.query.setAttribute('aria-label',host.getAttribute('query-label')||'Submit search');
      if(host.hasAttribute('suggestion-label'))state.list.setAttribute('aria-label',host.getAttribute('suggestion-label'));else state.list.removeAttribute('aria-label');
      if(name===null||name==='text')input.value=host.getAttribute('text')||'';
      if(name==='items-source'&&state.ready)suggestions.get(root).setProvider(query=>inputItems(host).filter(item=>item.toLocaleLowerCase().includes(query.toLocaleLowerCase())));
      if(name==='suggestion-list-open'&&state.ready)host.hasAttribute('suggestion-list-open')?suggestions.get(root).open():suggestions.get(root).close();
      synchronizeInputDescription(host,state.container,[input],host.getAttribute('description'));
    }
  }
  function inputRoot(host){return host.matches(inputTags)?hydrateInput(host).root:host;}
  for(const tag of inputTags.split(','))customElements.define(tag,class extends HTMLElement{
    static observedAttributes=['header','description','suggestion-list-open','value','text','width','height','disabled','readonly','aria-label','aria-describedby','tabindex','placeholder','minimum','maximum','small-change','large-change','step','step-frequency','direction-reversed','snaps-to','dir','tick-frequency','tick-placement','thumb-tooltip-enabled','orientation','unit','spin-placement','accepts-expression','wrap','rounding-increment','fraction-digits','locale','increase-label','decrease-label','validation-mode','items-source','query-icon','query-label','suggestion-label'];
    attributeChangedCallback(name){updateInput(this,name);}
    get disabled(){return this.hasAttribute('disabled');}set disabled(value){this.toggleAttribute('disabled',Boolean(value));}
    focus(options){hydrateInput(this).input.focus(options);}
  });

  // Layout declarations retain application children and reuse the canonical
  // details/SplitView engines. Generated template parts are private.
  const layoutControls=new WeakMap(),borders=new WeakMap();
  function initializeBorder(host){
    if(borders.has(host))return borders.get(host);
    const owned=new Map();
    const render=()=>{for(const [attr,property]of [['data-border-thickness',host.matches('.border-demo')?'--demo-border-thickness':'border-width'],['data-padding','padding'],['data-corner-radius','border-radius']]){const value=host.getAttribute(attr);if(value!==null&&/^\d+(\.\d+)?$/.test(value)){if(!owned.has(property))owned.set(property,host.style.getPropertyValue(property));host.style.setProperty(property,Math.min(10000,Number(value))+'px');}else if(owned.has(property)){const prior=owned.get(property);if(prior)host.style.setProperty(property,prior);else host.style.removeProperty(property);owned.delete(property);}}};
    const api={setThickness(value){if(!Number.isFinite(value)||value<0||value>10000)throw new RangeError('Invalid Border thickness');host.dataset.borderThickness=String(value);render();},setBackground(value){host.dataset.background=value;},setBrush(value){host.dataset.brush=value;}};
    borders.set(host,api);new MutationObserver(render).observe(host,{attributes:true,attributeFilter:['data-border-thickness','data-padding','data-corner-radius']});render();return api;
  }
  function hydrateExpander(host){
    let state=layoutControls.get(host);
    if(!state){
      const details=element('details','disclosure'),summary=element('summary','disclosure__summary'),header=element('span','expander-header-text'),glyph=element('span','glyph','\uE70D'),content=element('div','disclosure__content');glyph.setAttribute('aria-hidden','true');
      const children=[...host.childNodes];summary.append(header,glyph);details.append(summary,content);host.append(details);state={details,header,content};layoutControls.set(host,state);
      for(const node of children)(node instanceof Element&&node.slot==='header'?header:content).append(node);
      details.open=host.hasAttribute('expanded')&&host.getAttribute('expanded')!=='false';
      const engine=initializeExpander(details);state.api={setExpanded:value=>host.toggleAttribute('expanded',!!value),get isExpanded(){return engine.isExpanded;}};
      details.addEventListener('expandedChanged',event=>host.toggleAttribute('expanded',event.detail.isExpanded));
      host.addEventListener('focus',()=>summary.focus());
    }
    if(host.hasAttribute('header'))state.header.textContent=host.getAttribute('header');
    for(const [attr,key]of [['expand-direction','direction'],['header-alignment','headerAlignment']]){if(host.hasAttribute(attr))state.details.dataset[key]=host.getAttribute(attr);else delete state.details.dataset[key];}
    if(host.hasAttribute('content-alignment'))state.content.dataset.alignment=host.getAttribute('content-alignment');else delete state.content.dataset.alignment;
    for(const name of ['width','height']){if(host.hasAttribute(name))state.details.dataset[name]=host.getAttribute(name);else delete state.details.dataset[name];}initializeSizing(state.details);
    initializeExpander(state.details).setExpanded(host.hasAttribute('expanded')&&host.getAttribute('expanded')!=='false');setEnabled(state.details,!host.hasAttribute('disabled')&&!host.closest('[data-control-disabled]'));
    return state;
  }
  function hydrateSplitView(host){
    const previousMode=host.dataset.displayMode||'overlay';let state=layoutControls.get(host);
    if(!state){
      host.classList.add('split-view');host.dataset.splitView='';
      const children=[...host.childNodes],pane=element('div','split-view__pane'),content=element('div','split-view__content'),overlay=controlButton('split-view__overlay',undefined,'Dismiss pane');pane.dataset.splitPane='';pane.setAttribute('role','region');content.dataset.splitContent='';overlay.dataset.splitOverlay='';overlay.tabIndex=-1;overlay.hidden=true;host.append(pane,content,overlay);
      for(const node of children)(node instanceof Element&&node.slot==='pane'?pane:content).append(node);
      state={pane,content};layoutControls.set(host,state);
    }
    state.pane.setAttribute('aria-label',host.getAttribute('pane-label')||'Pane content');
    for(const [attr,key]of [['display-mode','displayMode'],['pane-placement','panePlacement'],['open-pane-length','openPaneLength'],['compact-pane-length','compactPaneLength'],['pane-background','background'],['light-dismiss-overlay','lightDismissOverlay']]){if(host.hasAttribute(attr))host.dataset[key]=host.getAttribute(attr);else delete host.dataset[key];}
    for(const name of ['width','height']){if(host.hasAttribute(name))host.dataset[name]=host.getAttribute(name);else delete host.dataset[name];}initializeSizing(host);
    if(!state.api){
      host.dataset.paneOpen=String(host.hasAttribute('pane-open')&&host.getAttribute('pane-open')!=='false');initializeSplitView(host);const engine=splitViews.get(host);
      state.api={setOpen:value=>host.toggleAttribute('pane-open',!!value),setMode(value){if(!['inline','overlay','compact-inline','compact-overlay'].includes(value))throw new RangeError('Unknown SplitView mode');host.setAttribute('display-mode',value);},setPlacement(value){if(!['left','right'].includes(value))throw new RangeError('Unknown SplitView placement');host.setAttribute('pane-placement',value);},setPaneLengths(openLength,compactLength){for(const value of [openLength,compactLength])if(!Number.isFinite(value)||value<0||value>10000)throw new RangeError('Invalid SplitView pane length');host.setAttribute('open-pane-length',openLength);host.setAttribute('compact-pane-length',compactLength);},get isPaneOpen(){return engine.isPaneOpen;}};
      for(const name of ['paneOpening','paneClosing'])host.addEventListener(name,()=>host.toggleAttribute('pane-open',engine.isPaneOpen));
    }else{const engine=splitViews.get(host);if(previousMode!==(host.dataset.displayMode||'overlay'))engine.setMode(host.dataset.displayMode||'overlay');engine.setOpen(host.hasAttribute('pane-open')&&host.getAttribute('pane-open')!=='false');}
    setEnabled(host,!host.hasAttribute('disabled'));return state;
  }
  customElements.define('winui-expander',class extends HTMLElement{
    static observedAttributes=['header','expanded','expand-direction','header-alignment','content-alignment','width','height','disabled'];
    attributeChangedCallback(){if(layoutControls.has(this))hydrateExpander(this);}
    focus(options){hydrateExpander(this).details.querySelector('summary').focus(options);}
  });
  customElements.define('winui-split-view',class extends HTMLElement{
    static observedAttributes=['pane-open','display-mode','pane-placement','open-pane-length','compact-pane-length','pane-background','light-dismiss-overlay','pane-label','width','height','disabled'];
    attributeChangedCallback(){if(layoutControls.has(this))hydrateSplitView(this);}
  });
  const collectionTags='winui-list-view,winui-tree-view,winui-breadcrumb-bar,winui-selector-bar';
  const collectionItemTags='winui-list-view-item,winui-tree-view-item,winui-breadcrumb-bar-item,winui-selector-bar-item';
  const authoredCollections=new WeakMap(),authoredCollectionItems=new WeakMap();
  function hydrateCollectionItem(host){
    let state=authoredCollectionItems.get(host);
    if(!state){
      const kind=host.localName,tree=kind==='winui-tree-view-item',list=kind==='winui-list-view-item',children=[...host.childNodes];
      const container=tree||list?host:controlButton(kind==='winui-selector-bar-item'?'selector-bar__item':'breadcrumb-bar__item');
      if(tree||list){host.classList.add(tree?'tree-view__item':'list-view__item');host.dataset[tree?'treeItem':'listItem']='';}
      else container.dataset[kind==='winui-selector-bar-item'?'selectorItem':'breadcrumbItem']='';
      const label=document.createTextNode(''),icon=element('span','glyph');icon.setAttribute('aria-hidden','true');
      let content=host;
      if(tree){content=element('div','tree-view__row');const arrow=element('span','tree-view__chevron');arrow.dataset.treeToggle='';arrow.setAttribute('aria-hidden','true');content.append(arrow);host.replaceChildren(content);const nested=children.filter(node=>node instanceof Element&&node.matches('winui-tree-view-item'));if(nested.length){const group=element('div','tree-view__group');group.setAttribute('role','group');group.append(...nested);host.append(group);}content.append(...children.filter(node=>!nested.includes(node)));}
      if(tree)content.insertBefore(icon,content.children[1]||null);else content.prepend(icon);content.append(label);state={container,label,icon,content};authoredCollectionItems.set(host,state);
      if(!tree&&!list){container.append(host);if(kind==='winui-selector-bar-item')container.prepend(icon);}
      if(tree)new MutationObserver(()=>{const expanded=host.getAttribute('aria-expanded')==='true';if(host.hasAttribute('expanded')!==expanded)host.toggleAttribute('expanded',expanded);}).observe(host,{attributes:true,attributeFilter:['aria-expanded']});
    }
    state.label.data=host.getAttribute('label')??host.getAttribute('text')??'';
    const symbol=host.getAttribute('icon');state.icon.hidden=!symbol;if(symbol){const value=commandSymbols[symbol]||symbol.replace(/^glyph:/,'');state.icon.textContent=/^[0-9a-f]{4,6}$/i.test(value)?String.fromCodePoint(parseInt(value,16)):symbol;}
    state.container.dataset.value=host.getAttribute('value')??state.label.data;state.container.dataset.itemLabel=host.getAttribute('label')??host.getAttribute('text')??state.content.textContent;
    if(host.hasAttribute('disabled'))state.container.setAttribute('aria-disabled','true');else state.container.removeAttribute('aria-disabled');if('disabled'in state.container)state.container.disabled=host.hasAttribute('disabled');
    if(!state.selectionApplied){state.selectionApplied=true;if(host.hasAttribute('selected'))state.container.setAttribute('aria-selected','true');}
    if(host.localName==='winui-tree-view-item'&&host.querySelector(':scope > [role="group"]'))host.setAttribute('aria-expanded',String(host.hasAttribute('expanded')));
    if(host.hasAttribute('page'))state.container.dataset.selectorPage=host.getAttribute('page');else delete state.container.dataset.selectorPage;
    return state;
  }
  function collectionTemplate(template,record,host){
    const instance=instantiateContentTemplate(template,record,host);if(!instance.root)return document.createTextNode('');
    for(const binding of instance.bindings)binding.node[binding.property]=binding.property==='checked'?Boolean(contentPath(record,binding.path)):String(contentPath(record,binding.path)??'');
    for(const image of [instance.root,...instance.root.querySelectorAll('[data-bind-asset]')].filter(node=>node.hasAttribute('data-bind-asset'))){if(image.localName!=='img')throw new TypeError('Asset binding requires an image');image.dataset.asset=String(contentPath(record,image.getAttribute('data-bind-asset'))??'');}
    initializeAssets(instance.root);return instance.root;
  }
  function hydrateCollection(host,changedAttribute){
    let state=authoredCollections.get(host);
    if(!state){
      const kind=host.localName,children=[...host.children],tree=kind==='winui-tree-view',root=tree?element('div','tree-view'):host;
      state={root};authoredCollections.set(host,state);
      if(tree){host.classList.add('tree-view__frame');root.dataset.treeView='';root.dataset.width='stretch';initializeSizing(root);host.append(root);root.append(...children);}
      else{host.classList.add(kind==='winui-list-view'?'list-view':kind==='winui-breadcrumb-bar'?'breadcrumb-bar':'selector-bar');host.dataset[kind==='winui-list-view'?'listView':kind==='winui-breadcrumb-bar'?'breadcrumbBar':'selectorBar']='';}
      root.querySelectorAll(collectionItemTags).forEach(hydrateCollectionItem);
      if(kind==='winui-breadcrumb-bar'){
        const overflow=controlButton('breadcrumb-bar__overflow',undefined,host.getAttribute('overflow-label')||'Earlier locations'),glyph=element('span','breadcrumb-bar__ellipsis','\uE712'),strip=element('div','breadcrumb-bar__items'),menu=element('div','flyout-menu');glyph.setAttribute('aria-hidden','true');overflow.append(glyph);overflow.dataset.breadcrumbOverflow='';overflow.hidden=true;strip.dataset.breadcrumbItems='';menu.dataset.breadcrumbMenu='';menu.setAttribute('role','menu');menu.setAttribute('aria-label',overflow.getAttribute('aria-label'));
        for(const child of children)if(child.matches('winui-breadcrumb-bar-item'))strip.append(hydrateCollectionItem(child).container);root.replaceChildren(overflow,strip,menu);
      }else if(kind==='winui-selector-bar')for(const child of children)if(child.matches('winui-selector-bar-item'))root.append(hydrateCollectionItem(child).container);
    }
    const root=state.root;
    state.parameters??=new Map();
    for(const [attribute,key]of [['selection-mode','selectionMode'],['can-reorder-items','canReorder'],['can-drag-items','canDrag'],['allow-drop','allowDrop'],['transfer-group','transferGroup'],['item-click','itemClick'],['items-alignment','itemsAlignment'],['sticky-headers','stickyHeaders']]){
      const value=host.getAttribute(attribute),prior=state.parameters.get(attribute);if(value===prior&&changedAttribute!==attribute)continue;state.parameters.set(attribute,value);
      if(value!==null)root.dataset[key]=['can-reorder-items','can-drag-items','allow-drop','item-click','sticky-headers'].includes(attribute)?String(value!=='false'):value;else if(prior!==undefined&&prior!==null)delete root.dataset[key];
    }
    for(const name of ['width','height']){const value=host.getAttribute(name),prior=state.parameters.get(name);if(value===prior&&changedAttribute!==name)continue;state.parameters.set(name,value);if(value!==null)host.dataset[name]=value;else if(prior!==undefined&&prior!==null)delete host.dataset[name];}initializeSizing(host);
    if(root!==host){for(const name of ['aria-label','aria-labelledby','aria-describedby'])if(host.hasAttribute(name))root.setAttribute(name,host.getAttribute(name));}
    if(!state.api){
      if(host.localName==='winui-list-view'){initializeListView(root);state.api=collections.get(root);}
      if(host.localName==='winui-tree-view'){initializeTreeView(root);state.api=trees.get(root);for(const name of ['expanding','collapsed'])root.addEventListener(name,event=>{if(authoredCollectionItems.has(event.detail.item))event.detail.item.toggleAttribute('expanded',name==='expanding');});}
      if(host.localName==='winui-breadcrumb-bar'){initializeBreadcrumb(root);state.api=breadcrumbs.get(root);}
      if(host.localName==='winui-selector-bar'){initializeSelectorBar(root);const engine=selectors.get(root);state.api={...engine,select:(item,...args)=>engine.select(authoredCollectionItems.get(item)?.container||item,...args)};root.addEventListener('selectionChanged',event=>{if(host.getAttribute('selected-value')!==event.detail.value)host.setAttribute('selected-value',event.detail.value);});}
    }
    const templateId=host.getAttribute('item-template'),template=templateId?scopedId(host,templateId):null;
    if(templateId&&!(template instanceof HTMLTemplateElement))throw new TypeError('Item template must identify an HTML template');
    if(template!==state.template){const previous=state.template;state.template=template;if(template||previous){if(typeof state.api.setTemplate!=='function')throw new TypeError('This collection has no item template adapter');state.api.setTemplate(template?record=>collectionTemplate(template,record,host):host.localName==='winui-list-view'?undefined:record=>document.createTextNode(record.label??''));}}
    const sourceId=host.getAttribute('items-source');
    if(sourceId&&sourceId!==state.sourceId){const source=scopedId(host,sourceId);if(!source?.matches('script[type="application/json"]'))throw new TypeError('Items source must identify application JSON data');const records=JSON.parse(source.textContent);if(!Array.isArray(records))throw new TypeError('Items source must be an array');state.api.setItems(records);state.sourceId=sourceId;}
    state.api.refresh?.();
    if(host.hasAttribute('selected-value')&&host.localName==='winui-selector-bar'){const item=[...root.querySelectorAll('[data-selector-item]')].find(item=>item.dataset.value===host.getAttribute('selected-value'));if(item)state.api.select(item,false);}
    setEnabled(root,!host.hasAttribute('disabled'));return state;
  }
  for(const tag of collectionItemTags.split(','))customElements.define(tag,class extends HTMLElement{
    static observedAttributes=['label','text','icon','value','disabled','expanded','page'];
    attributeChangedCallback(name){if(authoredCollectionItems.has(this)){const state=hydrateCollectionItem(this);if(name==='selected')state.container.setAttribute('aria-selected',String(this.hasAttribute('selected')));const owner=this.closest(collectionTags);authoredCollections.get(owner)?.api.refresh?.();}}
  });
  for(const tag of collectionTags.split(','))customElements.define(tag,class extends HTMLElement{
    static observedAttributes=['selection-mode','can-reorder-items','can-drag-items','allow-drop','transfer-group','item-click','items-alignment','sticky-headers','items-source','item-template','selected-value','width','height','disabled','aria-label','aria-labelledby','aria-describedby'];
    attributeChangedCallback(name){if(authoredCollections.get(this)?.api)hydrateCollection(this,name);}
  });
  const navigationPublicItem=item=>item?.closest?.('winui-navigation-item')||item;
  const navigationTags='winui-navigation-view';
  const navigationItemTags='winui-navigation-item,winui-navigation-group,winui-navigation-header,winui-navigation-separator';
  const authoredNavigationViews=new WeakMap(),authoredNavigationItems=new WeakMap();
  function hydrateNavigationItem(host){
    let state=authoredNavigationItems.get(host);
    if(!state){
      const group=host.localName==='winui-navigation-group',header=host.localName==='winui-navigation-header',separator=host.localName==='winui-navigation-separator';
      if(header||separator){host.classList.add(header?'nav-group-label':'navigation-view__separator');host.setAttribute('role','presentation');state={container:host};authoredNavigationItems.set(host,state);}
      else{
        const nodes=[...host.childNodes],nested=nodes.filter(node=>node instanceof Element&&node.matches(navigationItemTags)),branch=group||nested.length>0;
        const container=branch?element('summary',group?'nav-item nav-group__summary':'nav-item'):host;
        const icon=element('span','glyph'),label=element('span','');icon.setAttribute('aria-hidden','true');
        if(branch){host.classList.add(group?'nav-group':'navigation-view__branch');host.setAttribute('role','group');container.setAttribute('role','button');container.tabIndex=0;const children=element('div',group?'nav-group__items':'navigation-view__children');children.append(...nested);if(!group)children.id=nextId();const arrow=element('span',group?'glyph nav-group__chevron':'glyph navigation-view__chevron','\uE70D');arrow.setAttribute('aria-hidden','true');if(!group)arrow.dataset.navigationChevron='';host.replaceChildren(container,children);container.append(icon,label,arrow);state={container,icon,label,children,branch,group};
          container.addEventListener('click',event=>{if(event.defaultPrevented||disabledItem(container))return;host.open=!host.open;});
        }else{host.classList.add('nav-item');host.setAttribute('role','button');host.tabIndex=0;host.prepend(icon);host.append(label);state={container,icon,label,branch:false};}
        if(!group)container.dataset.navigationItem='';
        state.container.addEventListener('keydown',event=>{if(event.target===container&&['Enter',' '].includes(event.key)){event.preventDefault();if(!disabledItem(container))container.click();}});
        authoredNavigationItems.set(host,state);
        nested.forEach(hydrateNavigationItem);
      }
    }
    if(host.matches('winui-navigation-header,winui-navigation-separator')){if(host.hasAttribute('label'))host.textContent=host.getAttribute('label');return state;}
    state.label.textContent=host.getAttribute('label')||'';const icon=host.getAttribute('icon');if(icon){if(state.icon.parentElement!==state.container)state.container.prepend(state.icon);}else state.icon.remove();
    if(icon){const value=commandSymbols[icon]||icon.replace(/^glyph:/,'');state.icon.textContent=/^[0-9a-f]{4,6}$/i.test(value)?String.fromCodePoint(parseInt(value,16)):icon;}
    if(!state.group){state.container.dataset.value=host.getAttribute('value')??host.getAttribute('label')??'';state.container.dataset.selectsOnInvoked=String(!host.hasAttribute('invocation-only'));}
    const disabled=host.hasAttribute('disabled')||!!host.closest('[data-control-disabled]');state.container.setAttribute('aria-disabled',String(disabled));state.container.tabIndex=disabled?-1:0;
    for(const name of ['aria-label','aria-describedby','title'])if(state.container!==host&&host.hasAttribute(name))state.container.setAttribute(name,host.getAttribute(name));
    if(state.group){state.container.setAttribute('aria-label',host.getAttribute('label')||'');state.container.title=host.getAttribute('label')||'';}
    if(state.branch){const open=host.hasAttribute('expanded');host.toggleAttribute('open',open);state.children.hidden=!open;state.container.setAttribute('aria-expanded',String(open));if(state.open!==undefined&&state.open!==open)host.dispatchEvent(new Event('toggle'));state.open=open;}
    return state;
  }
  function hydrateNavigationView(host,changedAttribute){
    let state=authoredNavigationViews.get(host);
    if(!state){
      host.classList.add('navigation-view');host.dataset.navigationView='';
      const nodes=[...host.children],slot=name=>nodes.find(node=>node.slot===name),pane=element('aside',host.getAttribute('pane-class')||'navigation-view__pane'),toggle=controlButton('navigation-view__toggle button button--subtle button--icon',undefined,host.getAttribute('toggle-label')||'Open navigation'),back=controlButton('button button--subtle button--icon navigation-view__back',undefined,'Back'),list=element('nav','nav-list');
      pane.dataset.navigationPane='';toggle.dataset.navigationToggle='';back.dataset.navigationBack='';const toggleGlyph=element('span','glyph','\uE700'),backGlyph=element('span','glyph','\uE72B');toggleGlyph.setAttribute('aria-hidden','true');backGlyph.setAttribute('aria-hidden','true');toggle.append(toggleGlyph);back.append(backGlyph);back.hidden=!host.hasAttribute('back-button-visible');back.disabled=host.hasAttribute('back-disabled');list.dataset.navigationItems='';if(host.hasAttribute('menu-class'))list.className+=' '+host.getAttribute('menu-class');if(host.hasAttribute('menu-label'))list.setAttribute('aria-label',host.getAttribute('menu-label'));
      const contentRoot=slot('content-root'),content=contentRoot||element('div','navigation-view__content');content.dataset.navigationContent='';if(contentRoot)contentRoot.remove();
      const title=element('div','navigation-view__pane-title');title.dataset.paneTitle='';pane.append(back,toggle,title);
      const regions={};for(const [name,cls,key]of [['search','navigation-view__search','navigationSearch'],['pane-custom','navigation-view__custom','paneCustom']]){const supplied=slot(name),region=supplied?.localName==='div'?supplied:element('div',cls);region.classList.add(cls);region.dataset[key]='';if(supplied&&region!==supplied)region.append(supplied);if(supplied){pane.append(region);regions[name]=region;}}
      for(const node of nodes)if(node.matches(navigationItemTags)&&!node.slot||node.slot==='menu-content')list.append(node);pane.append(list);
      const suppliedFooter=slot('footer'),footerItems=nodes.filter(node=>node.slot==='footer-item');let footer,settings;
      if(suppliedFooter||footerItems.length||!host.hasAttribute('hide-settings')){footer=element('footer','navigation-view__footer');footer.append(...footerItems);if(suppliedFooter){suppliedFooter.classList.add('navigation-view__pane-footer');suppliedFooter.dataset.paneFooter='';footer.append(suppliedFooter);regions.footer=suppliedFooter;}settings=element('winui-navigation-item','');settings.setAttribute('label','Settings');settings.setAttribute('icon','Settings');settings.setAttribute('value','settings');footer.append(settings);pane.append(footer);}
      if(slot('pane-end'))pane.append(slot('pane-end'));
      let header;if(!contentRoot&&host.hasAttribute('header')){header=element('h2','navigation-view__header');header.dataset.navigationHeader='';content.append(header);}if(!contentRoot)for(const node of nodes)if(node.slot==='content')content.append(node);
      const overlay=controlButton('navigation-view__scrim',undefined,'Close navigation');overlay.dataset.navigationOverlay='';overlay.hidden=true;
      host.replaceChildren(pane,content,overlay);state={pane,toggle,back,list,content,title,header,regions,settings,parameters:new Map()};authoredNavigationViews.set(host,state);pane.querySelectorAll(navigationItemTags).forEach(hydrateNavigationItem);
    }
    const enabled=name=>host.hasAttribute(name)&&host.getAttribute(name)!=='false';
    for(const [name,key]of [['responsive-mode','responsiveMode'],['pane-display-mode','paneDisplayMode'],['selection-follows-focus','selectionFollowsFocus'],['pane-toggle-placement','paneTogglePlacement']]){const value=host.getAttribute(name),prior=state.parameters.get(name);if(value===prior&&changedAttribute!==name)continue;state.parameters.set(name,value);if(value!==null)host.dataset[key]=name==='selection-follows-focus'?String(enabled(name)):value;else if(prior!=null)delete host.dataset[key];if(state.engine){if(name==='responsive-mode')state.engine.setMode(host.dataset.paneDisplayMode||'auto');if(name==='pane-display-mode')state.engine.setMode(value||'auto');if(name==='pane-toggle-placement')state.engine.setPaneTogglePlacement(value||'pane');}}
    for(const name of ['width','height']){const value=host.getAttribute(name),prior=state.parameters.get(name);if(value===prior&&changedAttribute!==name)continue;state.parameters.set(name,value);if(value!==null)host.dataset[name]=value;else if(prior!=null)delete host.dataset[name];}if(host.hasAttribute('width')||host.hasAttribute('height')||host.hasAttribute('data-width')||host.hasAttribute('data-height'))initializeSizing(host);
    state.title.textContent=host.getAttribute('pane-title')||'';if(state.header){state.header.textContent=host.getAttribute('header')||'';state.header.hidden=host.hasAttribute('hide-header');}
    for(const[name,attribute]of [['search','search-visible'],['pane-custom','pane-custom-visible'],['footer','footer-visible']])if(state.regions[name])state.regions[name].hidden=!enabled(attribute);
    if(state.settings)state.settings.hidden=host.hasAttribute('hide-settings');
    if(!state.engine){
      if(host.hasAttribute('pane-open'))host.dataset.paneOpen=String(enabled('pane-open'));host.dataset.backButtonVisible=String(enabled('back-button-visible'));initializeNavigationView(host);state.engine=navigationViews.get(host);
      state.api={getNavigationItems:()=>[...state.list.querySelectorAll('[data-navigation-item]')].map(item=>item.localName==='summary'?item.parentElement:item),select:item=>state.engine.select(authoredNavigationItems.get(item)?.container||item),setOpen:value=>host.setAttribute('pane-open',value?'':'false'),setMode:value=>{if(!['auto','left','top','left-compact','left-minimal'].includes(value))throw new RangeError('Unknown PaneDisplayMode');host.setAttribute('pane-display-mode',value);},setBackButtonVisible:value=>host.toggleAttribute('back-button-visible',!!value),setBackEnabled:value=>host.toggleAttribute('back-disabled',!value),setPaneTogglePlacement:value=>{if(!['pane','beside-back'].includes(value))throw new RangeError('Unknown PaneTogglePlacement');host.setAttribute('pane-toggle-placement',value);},setItems:records=>state.engine.setItems(records),getBackButton:()=>state.engine.getBackButton(),getPaneToggleButton:()=>state.engine.getPaneToggleButton(),get isPaneOpen(){return state.engine.isPaneOpen;},get selectedItem(){return navigationPublicItem(state.engine.selectedItem);}};
      for(const name of ['paneOpened','paneClosed'])host.addEventListener(name,event=>{if(event.target!==host)return;state.reflecting=true;host.setAttribute('pane-open',name==='paneOpened'?'':'false');state.reflecting=false;});
      host.addEventListener('selectionChanged',event=>{if(event.target!==host)return;state.reflecting=true;host.setAttribute('selected-value',event.detail.value??'');state.reflecting=false;});
    }
    for(const name of ['pane-open','back-button-visible','back-disabled']){const value=host.getAttribute(name),prior=state.parameters.get(name);if(value===prior&&changedAttribute!==name)continue;state.parameters.set(name,value);if(state.reflecting)continue;if(name==='pane-open'&&(value!==null||prior!=null))state.engine.setOpen(enabled(name));if(name==='back-button-visible')state.engine.setBackButtonVisible(enabled(name));if(name==='back-disabled')state.engine.setBackEnabled(!host.hasAttribute(name));}
    if(!state.reflecting&&host.hasAttribute('selected-value')&&(!state.selectionApplied||changedAttribute==='selected-value')){const item=[...state.pane.querySelectorAll('[data-navigation-item]')].find(item=>item.dataset.value===host.getAttribute('selected-value'));if(item)state.engine.select(item);state.selectionApplied=true;}
    if(!state.enabledApplied||changedAttribute==='disabled'){setEnabled(host,!host.hasAttribute('disabled'));state.enabledApplied=true;}state.pane.querySelectorAll(navigationItemTags).forEach(hydrateNavigationItem);
    if(host.isConnected&&!state.connected)state.list.querySelectorAll('.navigation-view__branch[open]').forEach(branch=>branch.dispatchEvent(new Event('toggle')));state.connected=host.isConnected;
    return state;
  }
  for(const tag of navigationItemTags.split(','))customElements.define(tag,class extends HTMLElement{
    static observedAttributes=['label','icon','value','disabled','expanded','invocation-only','aria-label','aria-describedby','title'];
    attributeChangedCallback(){if(authoredNavigationItems.has(this))hydrateNavigationItem(this);}
    get disabled(){return this.hasAttribute('disabled');}set disabled(value){this.toggleAttribute('disabled',!!value);}
    get open(){return this.hasAttribute('expanded');}set open(value){this.toggleAttribute('expanded',!!value);}
    click(){const state=hydrateNavigationItem(this);if(disabledItem(state.container))return;if(state.container!==this)state.container.click();else HTMLElement.prototype.click.call(this);}
    focus(options){const state=hydrateNavigationItem(this);if(state.container!==this)state.container.focus(options);else HTMLElement.prototype.focus.call(this,options);}
  });
  customElements.define('winui-navigation-view',class extends HTMLElement{
    static observedAttributes=['responsive-mode','pane-display-mode','pane-open','pane-title','header','hide-header','hide-settings','search-visible','pane-custom-visible','footer-visible','back-button-visible','back-disabled','pane-toggle-placement','selection-follows-focus','selected-value','width','height','disabled'];
    attributeChangedCallback(name){if(authoredNavigationViews.get(this)?.engine)hydrateNavigationView(this,name);}
  });
  const authoredTabViews=new WeakMap(),authoredTabItems=new WeakMap();
  const publicTab=tab=>tab?.parentElement?.localName==='winui-tab-view-item'?tab.parentElement:tab;
  const tabButton=item=>authoredTabItems.get(item)?.tab||item;
  function hydrateTabItem(host){
    let state=authoredTabItems.get(host);
    if(!state){
      const content=[...host.childNodes],art=content.find(node=>node instanceof Element&&node.slot==='icon'),tab=controlButton('tab-view__tab'),label=document.createTextNode(''),close=controlButton('tab-view__close'),body=element('div','tab-view__panel');
      tab.dataset.documentTab='';close.dataset.tabClose='';close.append(element('span','glyph','\uE711'));close.firstChild.setAttribute('aria-hidden','true');body.id=nextId();tab.setAttribute('aria-controls',body.id);body.append(...content.filter(node=>node!==art));host.classList.add('tab-view__item');host.replaceChildren(tab,close);tab.append(label);state={tab,label,close,body,art};authoredTabItems.set(host,state);
      if(host.hasAttribute('selected'))tab.setAttribute('aria-selected','true');
    }
    const header=host.getAttribute('header')||'',icon=host.getAttribute('icon');state.label.textContent=header;state.tab.dataset.value=host.getAttribute('value')??header;
    if(icon!==state.icon){state.iconNode?.remove();state.iconNode=null;state.icon=icon;if(icon){let node;if(icon.startsWith('asset:')){node=element('img','tab-view__icon');node.alt='';node.dataset.asset=icon.slice(6);}else{node=element('span','glyph tab-view__icon');const glyph=commandSymbols[icon]||icon.replace(/^glyph:/,'');node.textContent=/^[0-9a-f]{4,6}$/i.test(glyph)?String.fromCodePoint(parseInt(glyph,16)):icon;node.setAttribute('aria-hidden','true');}state.tab.prepend(node);state.iconNode=node;}else if(state.art){state.art.classList.add('tab-view__icon');state.tab.prepend(state.art);state.iconNode=state.art;}}
    state.tab.disabled=host.hasAttribute('disabled')||!!host.closest('[data-control-disabled]');state.tab.setAttribute('aria-disabled',String(state.tab.disabled));state.close.hidden=host.getAttribute('closable')==='false';
    for(const name of ['aria-label','aria-describedby','title']){if(host.hasAttribute(name))state.tab.setAttribute(name,host.getAttribute(name));else state.tab.removeAttribute(name);}
    initializeAssets(host);return state;
  }
  function hydrateTabView(host,changed){
    let state=authoredTabViews.get(host);
    if(!state){
      const nodes=[...host.children],items=nodes.filter(node=>node.localName==='winui-tab-view-item'),slot=name=>nodes.find(node=>node.slot===name),header=element('div','tab-view__header'),strip=element('div','tab-view__list'),panels=element('div','tab-view__panels'),previous=controlButton('tab-view__aux tab-view__aux--scroll','\uE76B','Scroll tabs left'),next=controlButton('tab-view__aux','\uE76C','Scroll tabs right'),add=controlButton('tab-view__aux','\uE710',host.getAttribute('add-label')||'Add document');
      host.classList.add('tab-view');host.dataset.tabView='';strip.dataset.tabViewList='';strip.setAttribute('aria-label',host.getAttribute('tab-strip-label')||'Open documents');panels.dataset.tabPanels='';previous.dataset.tabPrevious='';next.dataset.tabNext='';add.dataset.tabAdd='';
      if(slot('header')){slot('header').classList.add('tab-view__header-content');header.append(slot('header'));}header.append(previous,strip,next,add);if(slot('header-end'))header.append(slot('header-end'));
      if(host.hasAttribute('window-header')){header.classList.add('app-titlebar');header.dataset.titlebar='';next.classList.add('tab-view__aux--scroll');previous.setAttribute('aria-label','Previous tabs');next.setAttribute('aria-label','Next tabs');}
      const empty=slot('empty')||element('div','tab-view__panel');if(!host.hasAttribute('window-header'))empty.classList.add('tab-view__panel');empty.dataset.tabEmpty='';empty.hidden=true;if(host.hasAttribute('window-header')&&!slot('empty'))empty.className='';
      host.replaceChildren(header,panels,empty);if(slot('footer')){slot('footer').classList.add('tab-view__footer-content');host.append(slot('footer'));}
      for(const item of items){const part=hydrateTabItem(item);strip.append(item);panels.append(part.body);}
      state={header,strip,panels,add,parameters:new Map()};authoredTabViews.set(host,state);
    }
    for(const [name,key,def]of [['tab-width-mode','widthMode',null],['close-button-overlay-mode','closeMode',null],['accent-strip','accentStrip','false'],['can-reorder-tabs','canReorder','true'],['tabs-closable','tabsClosable','true'],['fixed-tabs','fixedTabs','false']]){const value=host.getAttribute(name),prior=state.parameters.get(name);if(value===prior&&changed!==name)continue;state.parameters.set(name,value);if(value!==null)host.dataset[key]=['accent-strip','fixed-tabs'].includes(name)?String(value!=='false'):value||'true';else if(def!==null)host.dataset[key]=def;else delete host.dataset[key];}
    for(const name of ['width','height']){const value=host.getAttribute(name),prior=state.parameters.get(name);if(value===prior&&changed!==name)continue;state.parameters.set(name,value);if(value!==null)host.dataset[name]=value;else if(prior!=null)delete host.dataset[name];}if(host.matches('[data-width],[data-height]'))initializeSizing(host);
    state.add.hidden=host.hasAttribute('hide-add-button');
    if(!state.engine){
      initializeTabView(host);state.engine=tabViews.get(host);
      const nativeItems=()=>[...state.strip.querySelectorAll('[data-document-tab]')].filter(tab=>tab.closest('[data-tab-view]')===host);
      const reflect=()=>{const selected=state.engine.selectedItem;state.reflecting=true;host.setAttribute('selected-index',String(nativeItems().indexOf(selected)));if(selected)host.setAttribute('selected-value',selected.dataset.value);else host.removeAttribute('selected-value');for(const item of state.strip.children)if(item.localName==='winui-tab-view-item')item.toggleAttribute('selected',authoredTabItems.get(item)?.tab===selected);state.reflecting=false;};
      state.api={refresh:()=>{state.engine.refresh();reflect();},select:(item,focus=false)=>state.engine.select(tabButton(item),focus),close:item=>state.engine.close(tabButton(item)),setFixedTabs:value=>host.setAttribute('fixed-tabs',String(!!value)),getItems:()=>nativeItems().map(publicTab),get selectedItem(){return publicTab(state.engine.selectedItem);},get selectedIndex(){return nativeItems().indexOf(state.engine.selectedItem);},getPanel:item=>authoredTabItems.get(item)?.body||scopedId(host,item.getAttribute('aria-controls')),addTab({label,header=label,value,content,closable=true,icon,disabled=false}){const item=document.createElement('winui-tab-view-item');item.setAttribute('header',String(header??''));item.setAttribute('value',String(value));if(!closable)item.setAttribute('closable','false');if(icon)item.setAttribute('icon',icon);if(disabled)item.setAttribute('disabled','');if(content instanceof Node)item.append(content);else if(content!=null)item.textContent=String(content);const part=hydrateTabItem(item);state.strip.append(item);state.panels.append(part.body);state.engine.select(part.tab,true);state.engine.refresh();reflect();return item;}};
      host.addEventListener('selectionChanged',event=>{if(event.target===host)reflect();});
    }
    if(!state.reflecting&&(!state.selectionApplied||['selected-value','selected-index'].includes(changed))){const tabs=[...state.strip.querySelectorAll('[data-document-tab]')];let selected;if(host.hasAttribute('selected-value')&&changed!=='selected-index')selected=tabs.find(tab=>tab.dataset.value===host.getAttribute('selected-value'));else if(host.hasAttribute('selected-index'))selected=tabs[Number(host.getAttribute('selected-index'))];if(selected)state.engine.select(selected);state.selectionApplied=true;}
    if(!state.enabledApplied||changed==='disabled'){setEnabled(host,!host.hasAttribute('disabled'));state.enabledApplied=true;}
    state.engine.refresh();return state;
  }
  customElements.define('winui-tab-view-item',class extends HTMLElement{
    static observedAttributes=['header','value','icon','closable','disabled','selected','aria-label','aria-describedby','title'];
    attributeChangedCallback(name){const state=authoredTabItems.get(this);if(!state)return;hydrateTabItem(this);const host=this.closest('winui-tab-view'),view=authoredTabViews.get(host);if(view?.engine){if(name==='selected'&&!view.reflecting&&this.hasAttribute('selected'))view.engine.select(state.tab);else view.engine.refresh();}}
  });
  customElements.define('winui-tab-view',class extends HTMLElement{
    static observedAttributes=['tab-width-mode','close-button-overlay-mode','accent-strip','can-reorder-tabs','tabs-closable','fixed-tabs','hide-add-button','selected-value','selected-index','width','height','disabled'];
    attributeChangedCallback(name){if(authoredTabViews.has(this))hydrateTabView(this,name);}
  });

  const schedulingTags='winui-calendar-date-picker,winui-time-picker',authoredScheduling=new WeakMap();
  function hydrateScheduling(host,changed){
    let state=authoredScheduling.get(host);
    if(state?.reflecting)return state;
    const calendar=host.localName==='winui-calendar-date-picker',valueName=calendar?'date':'time';
    if(!state){
      const cls=calendar?'calendar-date-picker':'time-picker',header=element('span',cls+'__header'),trigger=controlButton('button '+cls+'__trigger');host.classList.add(cls);host.dataset[calendar?'calendarDatePicker':'timePicker']='';
      header.textContent=host.getAttribute('header')||'';header.hidden=!host.hasAttribute('header');host.append(header,trigger);
      if(calendar){const text=element('span','calendar-date-picker__text'),glyph=element('span','glyph calendar-date-picker__glyph','\uE787');text.dataset.dateText='';glyph.setAttribute('aria-hidden','true');trigger.dataset.dateTrigger='';trigger.append(text,glyph);
        for(const [name,key]of [['min-date','minDate'],['max-date','maxDate'],['first-day-of-week','firstDayOfWeek']])if(host.hasAttribute(name))host.dataset[key]=host.getAttribute(name);
        if(host.hasAttribute('first-day-of-week')){const day=Number(host.getAttribute('first-day-of-week'));if(!Number.isInteger(day)||day<0||day>6)throw new RangeError('First day of week must be 0 through 6');}
        if(host.hasAttribute('placeholder'))host.dataset.placeholder=host.getAttribute('placeholder');
      }else{trigger.dataset.timeTrigger='';if(host.hasAttribute('minute-increment'))host.dataset.minuteIncrement=host.getAttribute('minute-increment');if(host.hasAttribute('clock-identifier')){const clock=host.getAttribute('clock-identifier'),mapped={'12-hour':'12HourClock','24-hour':'24HourClock',regional:''}[clock];if(mapped===undefined)throw new RangeError('Clock identifier must be regional, 12-hour or 24-hour');if(mapped)host.dataset.clockIdentifier=mapped;}if(host.hasAttribute('initialize-now'))host.dataset.initializeNow='true';}
      if(host.hasAttribute(valueName))host.dataset[valueName]=host.getAttribute(valueName);
      state={header,trigger,parameters:new Map()};authoredScheduling.set(host,state);
      if(calendar)initializeCalendarDatePicker(host);else initializeTimePicker(host);state.engine=(calendar?calendars:timePickers).get(host);
      const reflect=()=>{const value=state.engine[valueName]||'';state.parameters.set(valueName,value);state.reflecting=true;host.setAttribute(valueName,value);state.reflecting=false;};state.reflect=reflect;
      state.api={open:()=>state.engine.open(),close:()=>state.engine.close(),get isOpen(){return state.engine.isOpen;}};
      Object.defineProperty(state.api,valueName,{get:()=>state.engine[valueName]});state.api[calendar?'setDate':'setTime']=(value,notify=true)=>{state.engine[calendar?'setDate':'setTime'](value,notify);reflect();};
      host.addEventListener(calendar?'dateChanged':'selectedTimeChanged',event=>{if(event.target===host)reflect();});reflect();
    }
    state.header.textContent=host.getAttribute('header')||'';state.header.hidden=!host.hasAttribute('header');
    if(calendar){if(host.hasAttribute('placeholder'))host.dataset.placeholder=host.getAttribute('placeholder');else delete host.dataset.placeholder;}
    for(const name of ['width','height']){const value=host.getAttribute(name),prior=state.parameters.get(name);if(value===prior&&changed!==name)continue;state.parameters.set(name,value);if(value!==null)host.dataset[name]=value;else if(prior!=null)delete host.dataset[name];}if(host.matches('[data-width],[data-height]'))initializeSizing(host);
    const value=host.getAttribute(valueName);if(value!==state.parameters.get(valueName)||changed===valueName){state.parameters.set(valueName,value);state.engine[calendar?'setDate':'setTime'](value);state.reflect();}
    if(changed==='lang')state.engine.refreshLocale();else state.engine.refresh();
    for(const name of ['aria-label','aria-describedby']){if(host.hasAttribute(name))state.trigger.setAttribute(name,host.getAttribute(name));else if(name==='aria-describedby')state.trigger.removeAttribute(name);}
    if(!state.enabledApplied||changed==='disabled'){if(host.hasAttribute('disabled'))state.engine.close();setEnabled(host,!host.hasAttribute('disabled'));state.enabledApplied=true;}
    return state;
  }
  for(const tag of schedulingTags.split(','))customElements.define(tag,class extends HTMLElement{
    static observedAttributes=['header','placeholder','date','time','width','height','disabled','lang','aria-label','aria-describedby'];
    attributeChangedCallback(name){if(authoredScheduling.has(this))hydrateScheduling(this,name);}
  });


  // Named authoring facades retain native form participation and the canonical engines.

  const textBoxes=new WeakMap();
  function textInteger(value,name){if(!Number.isInteger(value)||value<0||value>2147483647)throw new RangeError(name+' must be a nonnegative Int32');return value;}
  function applyTextAlignment(control,value,state){
    if(value!==null)enumValue(value,['left','center','right','justify','detect-from-content'],'TextBox alignment');
    if(value==='detect-from-content'){if(!state.alignmentOwnsDir){state.priorDir=control.getAttribute('dir');state.alignmentOwnsDir=true;}control.setAttribute('dir','auto');}
    else if(state.alignmentOwnsDir){if(state.priorDir===null)control.removeAttribute('dir');else control.setAttribute('dir',state.priorDir);state.alignmentOwnsDir=false;}
    if(value===null)control.removeAttribute('data-text-alignment');else control.setAttribute('data-text-alignment',value);
  }
  function textBoxApi(host){
    const control=namedRoot(host);if(!(control instanceof HTMLInputElement||control instanceof HTMLTextAreaElement))throw new TypeError('Expected a TextBox');
    if(textBoxes.has(control))return textBoxes.get(control);host=control.closest('winui-text-box')||host;const alignmentState={};
    const selection=()=>{if(control.selectionStart===null||control.selectionEnd===null)throw new TypeError('This native input type does not support text selection');return[control.selectionStart,control.selectionEnd];};
    const select=(start,length)=>{textInteger(start,'SelectionStart');textInteger(length,'SelectionLength');selection();start=Math.min(start,control.value.length);control.setSelectionRange(start,Math.min(control.value.length,start+length));};
    const text=value=>{if(value!==null&&typeof value!=='string')throw new TypeError('Text must be a string or null');return value??'';};
    const api={
      get text(){return control.value;},setText:value=>{control.value=text(value);},
      get selectionStart(){return selection()[0];},setSelectionStart:value=>{const[a,b]=selection();select(value,b-a);},
      get selectionLength(){const[a,b]=selection();return b-a;},setSelectionLength:value=>select(selection()[0],value),
      get selectedText(){const[a,b]=selection();return control.value.slice(a,b);},setSelectedText:value=>{const[a,b]=selection();control.setRangeText(text(value),a,b,'select');},select,selectAll:()=>control.select(),
      get maxLength(){return control.maxLength<0?0:control.maxLength;},setMaxLength:value=>{textInteger(value,'MaxLength');if(host.localName==='winui-text-box')host.setAttribute('max-length',String(value));else if(value===0)control.removeAttribute('maxlength');else control.maxLength=value;},
      get isReadOnly(){return control.readOnly;},setReadOnly:value=>{if(typeof value!=='boolean')throw new TypeError('IsReadOnly must be Boolean');if(host.localName==='winui-text-box')host.toggleAttribute('readonly',value);else control.readOnly=value;},
      get isSpellCheckEnabled(){return control.spellcheck;},setSpellCheckEnabled:value=>{if(typeof value!=='boolean')throw new TypeError('IsSpellCheckEnabled must be Boolean');if(host.localName==='winui-text-box')host.setAttribute('spell-check',String(value));else control.spellcheck=value;},
      get textAlignment(){return control.getAttribute('data-text-alignment');},setTextAlignment:value=>{if(host.localName==='winui-text-box'){if(value===null)host.removeAttribute('text-alignment');else{enumValue(value,['left','center','right','justify','detect-from-content'],'TextBox alignment');host.setAttribute('text-alignment',value);}}else applyTextAlignment(control,value,alignmentState);}
    };textBoxes.set(control,Object.freeze(api));return api;
  }

  const namedTags='winui-button,winui-hyperlink-button,winui-text-box,winui-combo-box,winui-border,winui-text-block,winui-progress-bar,winui-radio-buttons,winui-process-status,winui-tool-tip',namedStates=new WeakMap();
  const namedData=['header','description','input-width','width','height','border-thickness','padding','corner-radius','background','brush','text-selection','wrapping','alignment','weight','editable','text-search-enabled','placeholder','drop-down-open','max-drop-down-height','tooltip','tooltip-placement','tooltip-offset-x','tooltip-offset-y','tooltip-rect','process-rows'];
  const namedAttributes=['class','content','text','image','appearance','inline','multiline','disabled','readonly','value','selected-index','maximum','indeterminate','paused','error','header','rows','for',...namedData,'type','name','placeholder','maxlength','minlength','min','max','step','required','pattern','autocomplete','inputmode','spellcheck','wrap','cols','href','target','rel','download','title','tabindex','aria-label','aria-labelledby','aria-describedby','role','text-alignment','max-length','spell-check','selection-start','selection-length'];
  function namedRoot(host){return host?.matches?.(namedTags)?hydrateNamed(host).control:authoredButtons.get(host)?.button||host;}
  function hydrateNamed(host,changed){
    let state=namedStates.get(host);const kind=host.localName.slice(6);
    if(!state){
      if(kind==='tool-tip'){
        state={control:null,parameters:new Map()};namedStates.set(host,state);
      }else{
        const names={button:'button','hyperlink-button':host.hasAttribute('href')?'a':'button','text-box':host.hasAttribute('multiline')?'textarea':'input','combo-box':'select',border:'div','text-block':host.hasAttribute('inline')?'span':'p','progress-bar':'progress','radio-buttons':'fieldset','process-status':'div'};
        const classes={button:'button','hyperlink-button':'button--hyperlink','text-box':host.hasAttribute('multiline')?'text-area':'text-field','combo-box':'select-field',border:host.getAttribute('appearance')==='demo'?'border-demo':host.getAttribute('appearance')==='overlay'?'card card--gallery':'card','text-block':'text-block','progress-bar':'progress-bar','radio-buttons':'radio-buttons','process-status':'process-status'};
        const control=element(names[kind],classes[kind]),children=[...host.childNodes];
        if(control.matches('button'))control.type='button';
        if(kind==='radio-buttons'){const legend=element('legend','');control.append(legend);state={legend};control.dataset.radioButtons='';}
        else state={};
        control.append(...children);host.replaceChildren(control);Object.assign(state,{control,parameters:new Map(),classes:new Set()});namedStates.set(host,state);
        host.addEventListener('click',event=>{if(host.hasAttribute('disabled')||host.closest('[data-control-disabled]')){event.preventDefault();event.stopImmediatePropagation();}},true);
        new MutationObserver(records=>{for(const name of new Set(records.map(record=>record.attributeName))){const value=control.getAttribute(name);if(host.getAttribute(name)!==value){if(value===null)host.removeAttribute(name);else host.setAttribute(name,value);}}}).observe(control,{attributes:true,attributeFilter:['aria-expanded','aria-controls','aria-haspopup']});
        if(host.id&&control.matches('input,textarea,select'))for(const label of host.getRootNode().querySelectorAll?.('label[for]')||[])if(label.htmlFor===host.id){if(!label.id)label.id=nextId();control.setAttribute('aria-labelledby',label.id);label.addEventListener('click',()=>host.focus());}
      }
    }
    if(state.updating)return state;state.updating=true;
    try{
      if(kind==='tool-tip'){
        const target=host.hasAttribute('for')?scopedId(host,host.getAttribute('for')):host.firstElementChild;
        if(!target)return state;const control=namedRoot(target);state.control=control;
        control.dataset.tooltip=host.getAttribute('content')||'';
        for(const name of ['placement','offset-x','offset-y','rect']){const value=host.getAttribute(name);if(value===null)control.removeAttribute('data-tooltip-'+name);else control.setAttribute('data-tooltip-'+name,value);}
        initializeTooltip(control);return state;
      }
      const control=state.control;let selectionChanged=false;
      for(const name of namedAttributes){
        const value=host.getAttribute(name)??(namedData.includes(name)?host.getAttribute('data-'+name):null);if(!state.parameters.has(name)&&value===null&&!host.hasAttribute('data-'+name)&&!['disabled','class'].includes(name)){state.parameters.set(name,null);continue;}if(state.parameters.has(name)&&state.parameters.get(name)===value)continue;state.parameters.set(name,value);
        if(name==='class'){
          const next=new Set((value||'').split(/\s+/).filter(Boolean));for(const old of state.classes)if(!next.has(old))control.classList.remove(old);for(const token of next)control.classList.add(token);state.classes=next;
        }else if(name==='content'||name==='text'){
          if(name==='text'&&kind==='text-box'){control.value=value??host.getAttribute('value')??'';control.defaultValue=control.value;}
          if(name==='text'&&kind==='combo-box'){if(value===null)control.removeAttribute('data-text');else control.setAttribute('data-text',value);}
          if(value!==null&&((name==='text'&&kind==='text-block')||(name==='content'&&['button','hyperlink-button'].includes(kind))))control.textContent=value;
        }else if(name==='image'){
          if(value!==null)control.dataset.buttonIcon=value;else delete control.dataset.buttonIcon;
        }else if(name==='appearance'){
          if(kind==='text-box')control.classList.toggle('text-field--styled',value==='styled');
          if(['button','hyperlink-button'].includes(kind)){for(const variant of ['primary','danger','subtle','icon','graphical','wrap'])control.classList.toggle('button--'+variant,value===variant);}
        }else if(name==='disabled')control.disabled=value!==null||!!host.closest('[data-control-disabled]');
        else if(name==='header'&&kind==='radio-buttons'){state.legend.textContent=value||'';state.legend.hidden=value===null;}
        else if(name==='rows'&&kind==='process-status')control.dataset.processRows=value??'3';
        else if(name==='maximum'&&kind==='progress-bar'){if(value!==null)control.max=Number(value);}
        else if(name==='value'&&kind==='text-box'){if(!host.hasAttribute('text')){control.value=value??'';control.defaultValue=value??'';}}
        else if(name==='value'&&kind==='combo-box'){control.value=value??'';selectionChanged=true;}
        else if(name==='placeholder'&&kind==='text-box'){if(value===null)control.removeAttribute('placeholder');else control.setAttribute('placeholder',value);}
        else if(kind==='text-box'&&name==='text-alignment')applyTextAlignment(control,value,state);
        else if(kind==='text-box'&&name==='max-length'){if(value===null){if(host.hasAttribute('maxlength'))control.setAttribute('maxlength',host.getAttribute('maxlength'));else control.removeAttribute('maxlength');}else{const limit=textInteger(Number(value),'MaxLength');if(limit===0)control.removeAttribute('maxlength');else control.maxLength=limit;}}
        else if(kind==='text-box'&&name==='spell-check'){if(value===null){if(host.hasAttribute('spellcheck'))control.setAttribute('spellcheck',host.getAttribute('spellcheck'));else control.removeAttribute('spellcheck');}else{enumValue(value,['true','false'],'TextBox spell check');control.spellcheck=value==='true';}}
        else if(kind==='text-box'&&['selection-start','selection-length'].includes(name)){if(value!==null){const n=textInteger(Number(value),name),api=textBoxApi(host);if(name==='selection-start')api.setSelectionStart(n);else api.setSelectionLength(n);}}
        else if(name==='selected-index'&&kind==='combo-box'){if(value!==null){control.selectedIndex=Number(value);selectionChanged=true;}}
        else if(['indeterminate','paused','error'].includes(name)&&kind==='progress-bar'){
          if(name==='indeterminate'){if(value!==null)control.removeAttribute('value');else if(changed===name)control.value=Number(host.getAttribute('value')||0);}
          else control.toggleAttribute('data-'+name,value!==null);
        }else if(namedData.includes(name)){
          const actual=value??host.getAttribute('data-'+name);if(actual===null)control.removeAttribute('data-'+name);else control.setAttribute('data-'+name,actual);
        }else if(kind==='text-box'&&((name==='maxlength'&&host.hasAttribute('max-length'))||(name==='spellcheck'&&host.hasAttribute('spell-check')))){
          // Preferred original-property parameters retain precedence over HTML aliases.
        }else if(!['inline','multiline','for','content','text','selected-index','maximum','indeterminate','paused','error'].includes(name)){
          if(value===null)control.removeAttribute(name);else control.setAttribute(name,value);
        }
      }
      const disabled=host.hasAttribute('disabled')||!!host.closest('[data-control-disabled]');
      if('disabled' in control)control.disabled=disabled;
      if(control.matches('a')){if(disabled){control.setAttribute('aria-disabled','true');control.tabIndex=-1;}else{control.removeAttribute('aria-disabled');if(host.hasAttribute('tabindex'))control.setAttribute('tabindex',host.getAttribute('tabindex'));else control.removeAttribute('tabindex');}}
      // Native sizing engines own their generated presentation wrappers.
      for(const name of ['width','height']){const value=host.getAttribute(name)??host.getAttribute('data-'+name),visual=state.visual||control;if(value!==null){visual.setAttribute('data-'+name,value);initializeSizing(visual);}else if(changed===name)visual.removeAttribute('data-'+name);}
      if(kind==='text-box'||kind==='combo-box'){
        initializeInputMetadata(control);if(control.hasAttribute('data-header')||control.hasAttribute('data-description'))initializeFieldHeader(control);
        if(kind==='text-box'){initializeTextBorder(control);state.visual=control.parentElement;}
        else {initializeComboBox(control);state.visual=comboBoxes.get(control).wrapper;if(selectionChanged)comboBoxes.get(control).synchronize();}
      }else if(kind==='progress-bar'){initializeProgressBar(control);state.visual=control.parentElement;}
      else if(kind==='border')initializeBorder(control);
      else if(kind==='process-status'){if(!control.hasAttribute('data-process-rows'))control.dataset.processRows='3';initializeProcessStatus(control);}
      else if(kind==='radio-buttons'){control.querySelectorAll(selectionTags).forEach(hydrateSelection);initializeRadioButtons(control);}
      if(kind==='progress-bar'&&host.hasAttribute('indeterminate'))control.removeAttribute('value');
      if(kind==='button'||kind==='hyperlink-button')if(control.hasAttribute('data-button-icon')&&window.WinUIIcons)initializeButtonIcon(control);
      if(control.hasAttribute('data-tooltip'))initializeTooltip(control);
      return state;
    }finally{state.updating=false;}
  }
  for(const tag of namedTags.split(',')){
    class NamedControl extends HTMLElement{
      static observedAttributes=[...namedAttributes,'placement','offset-x','offset-y','rect',...namedData.map(name=>'data-'+name)];
      attributeChangedCallback(name){if(namedStates.has(this))hydrateNamed(this,name);}
      focus(options){if(this.hasAttribute('disabled')||this.closest('[data-control-disabled]'))return;const control=namedRoot(this),combo=comboBoxes.get(control);(combo?.targets.at(-1)||control).focus(options);}
      blur(){const control=namedRoot(this),combo=comboBoxes.get(control);(combo?.targets.at(-1)||control).blur();}
      click(){namedRoot(this).click();}
      select(){namedRoot(this).select();}setSelectionRange(...args){namedRoot(this).setSelectionRange(...args);}setRangeText(...args){namedRoot(this).setRangeText(...args);}
      setCustomValidity(value){namedRoot(this).setCustomValidity(value);}checkValidity(){return namedRoot(this).checkValidity();}reportValidity(){return namedRoot(this).reportValidity();}
      add(...args){namedRoot(this).add(...args);}
      append(...nodes){if(namedStates.has(this)&&this.localName!=='winui-tool-tip')namedRoot(this).append(...nodes);else super.append(...nodes);}
      prepend(...nodes){if(namedStates.has(this)&&this.localName!=='winui-tool-tip')namedRoot(this).prepend(...nodes);else super.prepend(...nodes);}
      replaceChildren(...nodes){if(namedStates.has(this)&&this.localName!=='winui-tool-tip')namedRoot(this).replaceChildren(...nodes);else super.replaceChildren(...nodes);}
      remove(index){if(arguments.length&&this.localName==='winui-combo-box')namedRoot(this).remove(index);else super.remove();}
      get textContent(){return namedStates.has(this)?namedRoot(this).textContent:Object.getOwnPropertyDescriptor(Node.prototype,'textContent').get.call(this);}
      set textContent(value){if(namedStates.has(this))namedRoot(this).textContent=value;else Object.getOwnPropertyDescriptor(Node.prototype,'textContent').set.call(this,value);}
    }
    for(const name of ['value','selectedIndex','selectionStart','selectionEnd','selectionDirection'])Object.defineProperty(NamedControl.prototype,name,{get(){return namedRoot(this)[name];},set(value){const control=namedRoot(this);control[name]=value;comboBoxes.get(control)?.synchronize();}});
    for(const[name,attribute]of [['disabled','disabled'],['readOnly','readonly'],['required','required']])Object.defineProperty(NamedControl.prototype,name,{get(){return this.hasAttribute(attribute);},set(value){this.toggleAttribute(attribute,!!value);}});
    for(const name of ['options','selectedOptions','form','validity','validationMessage','willValidate','labels'])Object.defineProperty(NamedControl.prototype,name,{get(){return namedRoot(this)[name];}});
    for(const[name,attribute]of [['maxLength','maxlength'],['minLength','minlength'],['placeholder','placeholder'],['name','name'],['type','type'],['href','href'],['target','target'],['rel','rel'],['max','max'],['rows','rows'],['cols','cols']])Object.defineProperty(NamedControl.prototype,name,{get(){return namedRoot(this)[name];},set(value){this.setAttribute(attribute,value);}});
    customElements.define(tag,NamedControl);
  }

  const tokenTags='winui-tag,winui-pill',tokenStates=new WeakMap();
  function hydrateToken(host){
    const tag=host.localName==='winui-tag',severity=host.getAttribute('severity')||'neutral';
    if(!tag)enumValue(severity,['neutral','success','warning','danger'],'Pill severity');
    let state=tokenStates.get(host);
    if(!state){
      if(host.children.length)throw new TypeError('Tag and pill labels accept plain text or the label attribute');
      const initialLabel=host.textContent,control=element(tag?'button':'span',tag?'tag':'status-pill');
      if(tag)control.type='button';host.replaceChildren(control);state={control,initialLabel};tokenStates.set(host,state);
    }
    const {control}=state;control.textContent=host.getAttribute('label')??state.initialLabel;
    for(const name of ['aria-label','aria-describedby','title']){if(host.hasAttribute(name))control.setAttribute(name,host.getAttribute(name));else control.removeAttribute(name);}
    if(tag){control.disabled=host.hasAttribute('disabled')||!!host.closest('[data-control-disabled]');control.value=host.getAttribute('value')||'';if(host.hasAttribute('tabindex'))control.setAttribute('tabindex',host.getAttribute('tabindex'));else control.removeAttribute('tabindex');}
    else control.className='status-pill'+(severity==='neutral'?'':' status-pill--'+severity);
    return state;
  }
  customElements.define('winui-tag',class extends HTMLElement{
    static observedAttributes=['label','value','disabled','tabindex','aria-label','aria-describedby','title'];
    attributeChangedCallback(){if(tokenStates.has(this))hydrateToken(this);}
    get label(){return this.getAttribute('label')??hydrateToken(this).initialLabel;}set label(value){if(typeof value!=='string')throw new TypeError('Label must be text');this.setAttribute('label',value);}
    get value(){return this.getAttribute('value')||'';}set value(value){if(typeof value!=='string')throw new TypeError('Value must be text');this.setAttribute('value',value);}
    get disabled(){return this.hasAttribute('disabled');}set disabled(value){this.toggleAttribute('disabled',!!value);}
    focus(options){hydrateToken(this).control.focus(options);}blur(){tokenStates.get(this)?.control.blur();}click(){hydrateToken(this).control.click();}
  });
  customElements.define('winui-pill',class extends HTMLElement{
    static observedAttributes=['label','severity','aria-label','aria-describedby','title'];
    attributeChangedCallback(){if(tokenStates.has(this))hydrateToken(this);}
    get label(){return this.getAttribute('label')??hydrateToken(this).initialLabel;}set label(value){if(typeof value!=='string')throw new TypeError('Label must be text');this.setAttribute('label',value);}
    get severity(){return this.getAttribute('severity')||'neutral';}set severity(value){enumValue(value,['neutral','success','warning','danger'],'Pill severity');this.setAttribute('severity',value);}
  });

  const patternTags='winui-settings-row,winui-summary-card,winui-empty-state,winui-in-app-notification',patternStates=new WeakMap();
  function hydratePattern(host,changed){
    let state=patternStates.get(host);const kind=host.localName;
    if(!state){
      const authored=[...host.childNodes];state={fields:{}};patternStates.set(host,state);
      const field=(name,cls)=>{const node=element('div',cls);state.fields[name]=node;return node;};
      if(kind==='winui-settings-row'){
        const icon=field('icon','settings-row__glyph'),body=element('div',''),title=field('header','settings-row__title'),description=field('description','settings-row__description');title.id=nextId();description.id=nextId();icon.setAttribute('aria-hidden','true');body.append(title,description);host.classList.add('settings-row');host.replaceChildren(icon,body,...authored);
        const control=authored.find(node=>node instanceof HTMLElement);if(control){let styled=control,interactive=control;if(control.matches(namedTags)){const named=hydrateNamed(control);styled=named.visual||named.control;interactive=comboBoxes.get(named.control)?.targets.at(-1)||named.control;}if(control.matches(selectionTags)){const selection=hydrateSelection(control);styled=selection.label;interactive=selection.control;if(selection.header){selection.label.querySelector('.toggle').classList.add('settings-row__control');const layout=()=>{selection.header.hidden=!control.getAttribute('header');selection.text.hidden=(control.getAttribute('on-content')??'On')===''&&(control.getAttribute('off-content')??'Off')==='';};new MutationObserver(layout).observe(control,{attributes:true,attributeFilter:['header','on-content','off-content']});layout();}}styled.classList.add('settings-row__control');if((control.matches('winui-combo-box')||!interactive.matches('button'))&&!interactive.hasAttribute('aria-label')&&!interactive.hasAttribute('aria-labelledby'))interactive.setAttribute('aria-labelledby',title.id);if(!interactive.hasAttribute('aria-describedby')){interactive.setAttribute('aria-describedby',description.id);if(control.matches(selectionTags))control.setAttribute('aria-describedby',description.id);}if(control.matches('winui-combo-box')){const native=namedRoot(control);for(const name of ['aria-labelledby','aria-describedby'])if(!native.hasAttribute(name)&&interactive.hasAttribute(name))native.setAttribute(name,interactive.getAttribute(name));}state.control=control;}
      }else if(kind==='winui-summary-card'){
        host.classList.add('metric-card');host.setAttribute('role','article');host.replaceChildren(field('caption','text-muted'),field('label','metric-card__label'),field('value','metric-card__value'),field('hint','metric-card__hint'),...authored);
      }else if(kind==='winui-empty-state'){
        host.classList.add('empty-state');const icon=field('icon','empty-state__glyph');icon.setAttribute('aria-hidden','true');host.replaceChildren(icon,field('header','empty-state__title'),field('message','empty-state__message'),...authored);
      }else{
        host.classList.add('toast');host.setAttribute('role','status');host.setAttribute('aria-live','polite');host.setAttribute('aria-hidden','true');const icon=element('span','glyph'),body=element('div','');state.fields.icon=icon;icon.setAttribute('aria-hidden','true');body.append(field('caption','text-muted'),field('header','toast__title'),field('message','toast__message'));host.replaceChildren(icon,body,...authored);state.open=false;
        const duration=()=>{const value=Number(host.getAttribute('duration')??2600);if(!Number.isInteger(value)||value<0||value>2147483647)throw new RangeError('Notification duration must be 0 through 2147483647 milliseconds');return value;};
        const hide=()=>{clearTimeout(state.timer);const wasOpen=state.open;state.open=false;host.classList.remove('is-active');host.setAttribute('aria-hidden','true');if(wasOpen)emit(host,'notificationClosed',{});};
        const schedule=()=>{clearTimeout(state.timer);const delay=duration();if(delay)state.timer=setTimeout(hide,delay);};state.schedule=schedule;
        state.api={show(){hydratePattern(host);if(!host.isConnected||host.closest('[data-control-disabled],[inert]'))return;const wasOpen=state.open;state.open=true;host.classList.add('is-active');host.setAttribute('aria-hidden','false');schedule();if(!wasOpen)emit(host,'notificationOpened',{});},hide,get isOpen(){return state.open;}};
      }
    }
    for(const [name,node]of Object.entries(state.fields)){const value=host.getAttribute(name)||'';node.textContent=name==='icon'&&value?commandGlyph(value):value;node.hidden=!value&&!(kind==='winui-settings-row'&&name==='icon');}
    if(state.open&&changed==='duration')state.schedule();return state;
  }
  for(const tag of patternTags.split(','))customElements.define(tag,class extends HTMLElement{
    static observedAttributes=['header','description','icon','caption','label','value','hint','message','duration'];
    attributeChangedCallback(name){if(patternStates.has(this))hydratePattern(this,name);}
  });

  function hydrateAuthoring(root) {
    const matching = selector => [...(root.matches?.(selector) ? [root] : []), ...root.querySelectorAll(selector)];
    matching(namedTags).filter(host=>host.localName!=='winui-tool-tip').forEach(hydrateNamed);
    matching(namedTags).filter(host=>host.localName!=='winui-tool-tip').forEach(hydrateNamed);
    matching(tokenTags).forEach(hydrateToken);
    matching(patternTags).forEach(hydratePattern);
    matching('input.text-field,textarea.text-area,select.select-field,select.combo-box__source').forEach(initializeInputMetadata);
    matching('input[data-header],textarea[data-header],select[data-header],input[data-description],textarea[data-description],select[data-description]').forEach(initializeFieldHeader);
    matching(schedulingTags).forEach(hydrateScheduling);
    matching('winui-tab-view').forEach(hydrateTabView);
    matching(inputTags).forEach(hydrateInput);
    matching(navigationTags).forEach(hydrateNavigationView);
    matching(collectionTags).forEach(hydrateCollection);
    matching('winui-expander').forEach(hydrateExpander);
    matching('winui-split-view').forEach(hydrateSplitView);
    matching('.card,.card--gallery,.border-demo,.border-pair').forEach(initializeBorder);
    matching(statusTags).forEach(hydrateStatus);
    matching(actionTags).forEach(hydrateAction);
    matching(menuItemTags).forEach(hydrateMenuItem);
    matching('winui-menu-flyout').forEach(hydrateMenuSurface);
    matching('winui-menu-bar').forEach(hydrateMenuBar);
    matching(surfaceTags).forEach(hydrateSurface);
    matching(selectionTags).forEach(hydrateSelection);
    matching('winui-xaml-ui-command').forEach(hydrateXamlUICommand);
    matching('winui-command-bar').forEach(hydrateCommandBar);
    matching(commandTags).forEach(hydrateCommand);
    matching('[data-menu-flyout]').forEach(trigger=>associateMenu(namedRoot(trigger),scopedId(trigger,trigger.dataset.menuFlyout)));
    matching('[data-flyout]').forEach(trigger=>associateSurface(trigger,scopedId(trigger,trigger.dataset.flyout)));
    matching('winui-tool-tip').forEach(hydrateNamed);
    matching('winui-tool-tip').forEach(hydrateNamed);
    matching('[data-tooltip]').forEach(initializeTooltip);

  }
  class AuthoredAppBarButton extends HTMLElement {
    static observedAttributes = ['label','icon','font-icon','flyout','disabled','allow-focus-on-interaction','tooltip','help-text','access-key','aria-label','aria-describedby','checked','three-state','label-position','is-compact','dynamic-overflow-order','command','command-parameter','slot'];
    attributeChangedCallback(name) { if(name==='slot')commandSlotChanged(this);else updateAuthoredButton(this); }
    connectedCallback() { const button=authoredButtons.get(this)?.button;if(button&&commandStates.has(button))bindCommand(button,commandStates.get(button).command); }
    disconnectedCallback() { const state=commandStates.get(authoredButtons.get(this)?.button);if(state?.subscribed){state.command.removeEventListener('canExecuteChanged',state.changed);if(xamlCommands.has(state.command))state.command.removeEventListener('metadataChanged',state.metadataChanged);state.subscribed=false;} }
    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(value) { this.toggleAttribute('disabled', Boolean(value)); }
    click() { const button = hydrateCommand(this); if (!button.closest('[inert]')) button.click(); }
    focus(options) { hydrateCommand(this).focus(options); }
  }
  customElements.define('winui-appbar-button', AuthoredAppBarButton);
  customElements.define('winui-appbar-toggle-button', class extends AuthoredAppBarButton {});
  customElements.define('winui-appbar-separator', class extends HTMLElement {
    static observedAttributes = ['dynamic-overflow-order','is-compact','slot'];
    attributeChangedCallback(name) { if(name==='slot'){commandSlotChanged(this);return;}overflowOrder(this.getAttribute('dynamic-overflow-order') ?? '0'); if (name === 'is-compact' && appBarSeparators.has(this) && separatorApi(this).isCompact !== this.hasAttribute('is-compact')) separatorApi(this).setCompact(this.hasAttribute('is-compact')); invalidateCommand(this); }
  });
  customElements.define('winui-command-bar', class extends HTMLElement {
    static observedAttributes = ['default-label-position','label-position','closed-display-mode','overflow-button-visibility','dynamic-overflow','open','sticky','unconstrained','more-label','content','content-template','content-template-selector'];
    attributeChangedCallback(name) { if(name==='content'||name==='content-template'||name==='content-template-selector')syncBarContent(this);else commandBars.get(this)?.updateFromAttributes(); }
  });
  // ICommand translation. Application objects
  // stay in JavaScript; attributes contain registry names/data, never expressions.
  const commandRegistry = new Map(), commandBindings = new Set(), commandStates = new WeakMap();
  const xamlCommands=new WeakMap(),declaredCommands=new WeakMap(),commandDeclarations=new Set();
  const commandMetadata=button=>xamlCommands.get(commandStates.get(button)?.command);
  function validateCommand(command) {
    if (command !== null && (!command || typeof command.execute !== 'function' || typeof command.canExecute !== 'function' || typeof command.addEventListener !== 'function' || typeof command.removeEventListener !== 'function')) throw new TypeError('Command requires execute, canExecute and EventTarget notifications');
    return command;
  }
  function createCommand({execute, canExecute = () => true}) {
    if (typeof execute !== 'function' || typeof canExecute !== 'function') throw new TypeError('Command callbacks must be functions');
    return Object.assign(new EventTarget(), { execute, canExecute, notifyCanExecuteChanged() { this.dispatchEvent(new Event('canExecuteChanged')); } });
  }
  function createXamlUICommand({label='',iconSource=null,description='',accessKey='',command=null,execute,canExecute}={}) {
    const object=new EventTarget(),state={label:'',iconSource:null,description:'',accessKey:'',command:null,iconVersion:0};
    const changed=name=>object.dispatchEvent(new CustomEvent('metadataChanged',{detail:{property:name}}));
    const text=value=>{if(typeof value!=='string')throw new TypeError('Command metadata text must be a string');return value;};
    for(const name of ['label','description','accessKey'])Object.defineProperty(object,name,{enumerable:true,get:()=>state[name],set:value=>{value=text(value);if(state[name]!==value){state[name]=value;changed(name);}}});
    Object.defineProperty(object,'iconSource',{enumerable:true,get:()=>state.iconSource,set:value=>{
      if(typeof value==='string')commandGlyph(value);
      else if(value instanceof Element){if(value.ownerDocument!==document||!['img','svg'].includes(value.localName))throw new TypeError('IconSource artwork must be img/svg from this document');}
      else if(value!==null&&(!value||typeof value.fontIcon!=='string'||Object.keys(value).some(key=>key!=='fontIcon')))throw new TypeError('IconSource must be a name, fontIcon descriptor, img/svg or null');
      if(value&&!(value instanceof Element)&&typeof value!=='string')value=Object.freeze({...value});
      state.iconObserver?.disconnect();state.iconSource=value;state.iconVersion++;
      if(value instanceof Element){state.iconObserver=new MutationObserver(()=>{state.iconVersion++;changed('iconSource');});state.iconObserver.observe(value,{attributes:true,childList:true,characterData:true,subtree:true});}
      changed('iconSource');
    }});
    Object.defineProperty(object,'command',{enumerable:true,get:()=>state.command,set:value=>{
      validateCommand(value);const visited=new Set([object]);for(let node=value;node;node=xamlCommands.get(node)?.command){if(visited.has(node))throw new TypeError('Command delegation cannot contain a cycle');visited.add(node);}
      if(state.command!==value){state.command=value;object.notifyCanExecuteChanged();}
    }});
    Object.assign(object,{
      canExecute(parameter){const detail=Object.defineProperty({canExecute:true},'parameter',{value:parameter,enumerable:true});object.dispatchEvent(new CustomEvent('canExecuteRequested',{detail}));if(typeof detail.canExecute!=='boolean')throw new TypeError('CanExecuteRequested must supply a boolean');const child=state.command;const allowed=child?child.canExecute(parameter):!state.unresolvedChild;if(typeof allowed!=='boolean')throw new TypeError('Child CanExecute must return a boolean synchronously');return detail.canExecute&&allowed;},
      execute(parameter){object.dispatchEvent(new CustomEvent('executeRequested',{detail:Object.freeze({parameter})}));state.command?.execute(parameter);},
      notifyCanExecuteChanged(){object.dispatchEvent(new Event('canExecuteChanged'));}
    });
    if(execute!==undefined){if(typeof execute!=='function')throw new TypeError('Execute must be a function');object.addEventListener('executeRequested',event=>execute(event.detail.parameter));}
    if(canExecute!==undefined){if(typeof canExecute!=='function')throw new TypeError('CanExecute must be a function');object.addEventListener('canExecuteRequested',event=>{event.detail.canExecute=canExecute(event.detail.parameter);});}
    xamlCommands.set(object,state);Object.assign(object,{label,iconSource,description,accessKey,command});return object;
  }
  function hydrateXamlUICommand(node) {
    if(node.localName!=='winui-xaml-ui-command')throw new TypeError('Expected winui-xaml-ui-command');
    let state=declaredCommands.get(node);
    if(!state){const command=createXamlUICommand();state={command,attributes:new Map(),name:null};declaredCommands.set(node,state);commandDeclarations.add(new WeakRef(node));
      for(const name of ['canExecuteRequested','executeRequested'])command.addEventListener(name,event=>node.dispatchEvent(new CustomEvent(name,{detail:event.detail})));
    }
    node.hidden=true;
    for(const [attribute,property]of [['label','label'],['description','description'],['access-key','accessKey'],['icon','iconSource']]){const value=node.getAttribute(attribute);if(state.attributes.get(attribute)!==value){state.attributes.set(attribute,value);state.command[property]=value??(property==='iconSource'?null:'');}}
    const childName=node.getAttribute('command');
    if(state.childName!==childName){state.childName=childName;state.childDirect=false;}
    else if(state.command.command!==state.appliedChild)state.childDirect=true;
    if(!state.childDirect){
      const child=childName?commandRegistry.get(childName)||null:null,metadata=xamlCommands.get(state.command),unresolved=Boolean(childName&&!child),wasUnresolved=metadata.unresolvedChild;
      state.command.command=child;state.appliedChild=child;metadata.unresolvedChild=unresolved;if(wasUnresolved!==unresolved)state.command.notifyCanExecuteChanged();
    }
    // Registry names are public IDs; detached declarations become active on insert.
    const name=node.id||null;if(node.isConnected&&(name!==state.name||name&&!commandRegistry.has(name))){const old=state.name;state.name=name;if(old&&commandRegistry.get(old)===state.command)registerCommand(old,null);if(name)registerCommand(name,state.command);}
    return state.command;
  }
  customElements.define('winui-xaml-ui-command',class extends HTMLElement {
    static observedAttributes=['id','label','icon','description','access-key','command'];
    attributeChangedCallback(){if(declaredCommands.has(this))hydrateXamlUICommand(this);}
    connectedCallback(){this.hidden=true;queueMicrotask(()=>hydrateXamlUICommand(this));}
    disconnectedCallback(){const state=declaredCommands.get(this);if(state?.name&&commandRegistry.get(state.name)===state.command)registerCommand(state.name,null);if(state)state.name=null;}
  });
  function registerCommand(name, command) {
    if (typeof name !== 'string' || !name.trim()) throw new TypeError('Command name must be nonempty');
    validateCommand(command);
    // Validate prospective declarative links before publishing a registry change.
    const links=new Map();for(const reference of commandDeclarations){const node=reference.deref();if(node?.isConnected){const state=declaredCommands.get(node);if(state.childName&&!state.childDirect&&state.command.command===state.appliedChild)links.set(state.command,state.childName);}}
    for(const first of [...links.keys(),command]){const visited=new Set();for(let current=first;current;){if(visited.has(current))throw new TypeError('Command delegation cannot contain a cycle');visited.add(current);const link=links.get(current);current=link?(link===name?command:commandRegistry.get(link)||null):xamlCommands.get(current)?.command;}}
    if (command === null) commandRegistry.delete(name); else commandRegistry.set(name, command);
    for(const reference of commandDeclarations){const node=reference.deref();if(!node){commandDeclarations.delete(reference);continue;}if(node.isConnected&&declaredCommands.get(node).childName===name)hydrateXamlUICommand(node);}
    for (const reference of commandBindings) {
      const button = reference.deref();
      if (!button) { commandBindings.delete(reference); continue; }
      const state = commandStates.get(button);
      if (!state.direct && state.name === name) bindCommand(button, commandRegistry.get(name) || null);
    }
  }
  function commandEnabled(button) {
    const state = commandStates.get(button), owner = commandOwner(button);
    const explicit = owner.matches(commandTags) ? owner.hasAttribute('disabled') : state.disabled;
    let result;
    try { result = state.command ? state.command.canExecute(state.parameter) : !state.name || state.direct; }
    catch(error) { button.disabled=true;throw error; }
    if (typeof result !== 'boolean') { button.disabled=true;throw new TypeError('CanExecute must return a boolean synchronously'); }
    button.disabled = explicit || Boolean(owner.closest('[data-control-disabled]')) || !result;
    if(button.disabled)flyoutBindings.get(button)?.popup.close(false);
    return !button.disabled;
  }
  function bindCommand(button, command) {
    const state = commandStates.get(button);
    let refresh=false;
    if (state.command !== command) {
      if(state.subscribed){state.command.removeEventListener('canExecuteChanged',state.changed);if(xamlCommands.has(state.command))state.command.removeEventListener('metadataChanged',state.metadataChanged);}
      refresh=true;
      state.subscribed=false;
      state.command = command;
    }
    if(command&&button.isConnected&&!state.subscribed){command.addEventListener('canExecuteChanged',state.changed);if(xamlCommands.has(command))command.addEventListener('metadataChanged',state.metadataChanged);state.subscribed=true;refresh=true;}
    if(refresh)refreshCommandMetadata(button);
    commandEnabled(button);
  }
  function refreshCommandMetadata(button) {
    const host=commandOwner(button);if(authoredButtons.has(host))updateAuthoredButton(host);
  }
  function updateCommandAccessibility(button) {
    const state=commandStates.get(button);if(!state)return;
    const metadata=commandMetadata(button),owner=commandOwner(button);
    const tooltip=owner.matches(commandTags)?owner.getAttribute('tooltip')||metadata?.description||'':state.tooltip;
    if(tooltip)button.dataset.tooltip=tooltip;else delete button.dataset.tooltip;
    initializeTooltip(button);
    if(owner.matches(commandTags)){
      button.accessKey=owner.getAttribute('access-key')||metadata?.accessKey||'';
      const help=owner.getAttribute('help-text')||metadata?.description||'',authored=authoredButtons.get(owner);
      if(help&&!authored.help){authored.help=element('span','visually-hidden');authored.help.id=nextId();owner.append(authored.help);}
      if(authored.help&&authored.help.textContent!==help)authored.help.textContent=help;
      const description=[owner.getAttribute('aria-describedby'),help?authored.help.id:tooltips.get(button)?.panel.id].filter(Boolean).join(' ');
      if(description)button.setAttribute('aria-describedby',description);else button.removeAttribute('aria-describedby');
    }
  }
  function updateCommandData(button) {
    const state=commandStates.get(button);if(!state)return;
    const owner=commandOwner(button), authored=owner.matches(commandTags);
    const name=owner.getAttribute(authored?'command':'data-command'), parameter=owner.getAttribute(authored?'command-parameter':'data-command-parameter');
    if(state.parameterAttribute!==parameter){state.parameterAttribute=parameter;state.parameter=parameter;}
    if(state.name!==name){state.name=name;state.direct=false;bindCommand(button,name?commandRegistry.get(name)||null:null);}
    commandEnabled(button);updateCommandAccessibility(button);
  }
  function initializeAppBar(button) {
    if (appBars.has(button)) return;
    button.addEventListener('pointerdown', event => { if (event.button === 0 && button.dataset.allowFocusOnInteraction !== 'true') event.preventDefault(); });
    updateBitmapIcon(button);
    const toggles = button.hasAttribute('data-appbar-toggle');
    let checked = button.getAttribute('aria-pressed') === 'mixed' ? null : button.getAttribute('aria-pressed') === 'true';
    function setChecked(value, notify = true) {
      if (![true, false, null].includes(value)) throw new TypeError('Checked must be true, false or null');
      if (value === null && button.dataset.appbarThreeState !== 'true') throw new RangeError('Three-state mode is disabled');
      const previous = checked; checked = value;
      button.setAttribute('aria-pressed', value === null ? 'mixed' : String(value));
      if (button.getAttribute('role') === 'menuitemcheckbox') button.setAttribute('aria-checked', value === null ? 'mixed' : String(value));
      const authored = button.parentElement;
      if (authored?.localName === 'winui-appbar-toggle-button') {
        const serialized = value === null ? 'mixed' : String(value);
        if (authored.getAttribute('checked') !== serialized) authored.setAttribute('checked', serialized);
      }
      if (notify && previous !== value) eventFor(button, 'checkedChanged', { checked: value });
    }
    if (toggles) setChecked(checked, false);
    const state = {command:null,subscribed:false,name:undefined,parameter:null,parameterAttribute:undefined,direct:false,disabled:button.disabled,tooltip:button.dataset.tooltip||'',changed:()=>commandEnabled(button),metadataChanged:()=>refreshCommandMetadata(button)};
    commandStates.set(button,state);commandBindings.add(new WeakRef(button));
    button.addEventListener('click', () => {
      if (disabledItem(button) || button.closest('[inert]')) return;
      if (toggles) setChecked(checked === false ? true : checked === true && button.dataset.appbarThreeState === 'true' ? null : false);
      eventFor(button, 'commandInvoked', { checked: toggles ? checked : undefined, label: button.querySelector('.appbar-button__label')?.textContent || button.getAttribute('aria-label') });
      const command=state.command, parameter=state.parameter;
      if(command){const allowed=command.canExecute(parameter);if(typeof allowed!=='boolean')throw new TypeError('CanExecute must return a boolean synchronously');if(allowed)command.execute(parameter);}
    });
    appBars.set(button, {
      get checked() { return checked; }, setChecked,
      get icon(){const host=commandOwner(button);return authoredButtons.get(host)?.effectiveIcon||host.getAttribute('icon');},setIcon:value=>replaceCommandResource(commandOwner(button),'icon',value),
      get fontIcon(){return authoredButtons.get(commandOwner(button))?.effectiveFontIcon||null;},setFontIcon:value=>replaceCommandResource(commandOwner(button),'font-icon',value),
      get flyout(){const host=commandOwner(button);if(authoredButtons.has(host))updateCommandResources(host);return authoredButtons.get(host)?.flyout||null;},setFlyout:value=>replaceCommandResource(commandOwner(button),'flyout',value),
      get isFlyoutOpen(){return flyoutBindings.get(button)?.popup.isOpen()||false;},
      openFlyout(){const host=commandOwner(button);updateCommandResources(host);const binding=flyoutBindings.get(button);if(!binding){if(button.dataset.openPopup)throw new RangeError('Flyout target not found: '+button.dataset.openPopup);return false;}binding.popup.show();return binding.popup.isOpen();},closeFlyout:()=>flyoutBindings.get(button)?.popup.close(true),
      get command() { return state.command; },
      setCommand(command) { validateCommand(command);state.direct=true;bindCommand(button,command); },
      get commandParameter() { return state.parameter; },
      setCommandParameter(parameter) { state.parameter=parameter;commandEnabled(button); },
      refreshCommand:()=>commandEnabled(button),
      get labelPosition() { return commandValue(commandOwner(button), 'label-position', 'default'); },
      setLabelPosition(value) { enumValue(value, ['default','collapsed'], 'LabelPosition'); const node = commandOwner(button); node.setAttribute(node.matches(commandTags) ? 'label-position' : 'data-label-position', value); updateCommandPresentation(button); invalidateCommand(node); },
      get isCompact() { return button.classList.contains('appbar-button--compact'); },
      setCompact(value) { if (typeof value !== 'boolean') throw new TypeError('IsCompact must be boolean'); const node = commandOwner(button); if (node.matches(commandTags)) node.toggleAttribute('is-compact', value); else { button.dataset.isCompact = String(value); button.classList.toggle('appbar-button--compact', value); } updateCommandPresentation(button); invalidateCommand(node); },
      get dynamicOverflowOrder() { return overflowOrder(commandValue(commandOwner(button), 'dynamic-overflow-order', '0')); },
      setDynamicOverflowOrder(value) { const order = overflowOrder(value), node = commandOwner(button); node.setAttribute(node.matches(commandTags) ? 'dynamic-overflow-order' : 'data-dynamic-overflow-order', String(order)); invalidateCommand(node); },
      get isInOverflow() { return button.hasAttribute('data-command-overflow'); }
    });
    updateCommandData(button);
    updateCommandPresentation(button);
  }
  function initializeCommandBar(host) {
    if (host.localName === 'winui-command-bar') hydrateCommandBar(host);
    if (commandBars.has(host)) return;
    const primary = host.querySelector('[data-primary-commands]'), secondary = host.querySelector('[data-secondary-commands]');
    const more = host.querySelector('[data-command-more]');
    if (!primary || !secondary || !more) throw new Error('CommandBar requires primary, secondary and More elements');
    const authored = host.localName === 'winui-command-bar', registered = new WeakSet();
    if(authored)syncBarContent(host);
    let commands = Array.from(primary.children), secondaryCommands = Array.from(secondary.children), sticky = false, isOpen = false, layingOut = false, syncing = false, frame = 0, refreshing = false, notifying = false, committing = false;
    let defaultLabelPosition = 'bottom', closedDisplayMode = 'compact', overflowButtonVisibility = 'auto', dynamicOverflowEnabled = true, unboundedPreview = false;
    const read = (attribute, fallback) => host.getAttribute(authored ? attribute : 'data-' + attribute) ?? fallback;
    const items = () => descendants(secondary, 'button').filter(b => !disabledItem(b) && !b.closest('[hidden],[inert]'));
    const popup = createPopup(secondary, more, { anchor: host, getRect: () => more.hidden ? host.getBoundingClientRect() : more.getBoundingClientRect(), alignEnd: true, lightDismiss: false, onClose: () => { if (isOpen) setOpen(false); } });
    const buttonFor = node => authoredButtons.get(node)?.button || (node.matches('button') ? node : null);
    const appBarSettings=calculatedSettings({clipRect:templateRect(),compactRootMargin:zeroThickness,compactVerticalDelta:0,hiddenRootMargin:zeroThickness,hiddenVerticalDelta:0,minimalRootMargin:zeroThickness,minimalVerticalDelta:0,negativeCompactVerticalDelta:0,negativeHiddenVerticalDelta:0,negativeMinimalVerticalDelta:0});
    const barSettings=calculatedSettings({contentHeight:0,effectiveOverflowButtonVisibility:'collapsed',negativeOverflowContentHeight:0,overflowContentClipRect:templateRect(),overflowContentCompactYTranslation:0,overflowContentHeight:0,overflowContentHiddenYTranslation:0,overflowContentHorizontalOffset:0,overflowContentMaxHeight:0,overflowContentMaxWidth:0,overflowContentMinWidth:0,overflowContentMinimalYTranslation:0});
    const metric=(node,name)=>parseFloat(getComputedStyle(node).getPropertyValue(name))||0;
    function contentHeight(){const content=authoredBars.get(host)?.contentHost;return Math.max(metric(host,'--command-bar-compact-height'),primary.scrollHeight,content&&!content.hidden?content.scrollHeight:0);}
    function measureTemplateState(position=true){
      if(!host.getClientRects().length)return;
      if(position&&popup.isOpen())popup.position();
      const height=contentHeight(),width=host.getBoundingClientRect().width,compact=metric(host,'--command-bar-compact-height'),minimal=metric(host,'--command-bar-minimal-height');
      Object.assign(appBarSettings.values,{clipRect:templateRect(width,height),compactVerticalDelta:compact-height,negativeCompactVerticalDelta:height-compact,minimalVerticalDelta:minimal-height,negativeMinimalVerticalDelta:height-minimal,hiddenVerticalDelta:-height,negativeHiddenVerticalDelta:height});
      barSettings.values.effectiveOverflowButtonVisibility=more.hidden?'collapsed':'visible';barSettings.values.overflowContentMaxWidth=metric(secondary,'--command-bar-overflow-max-width');
      if(isOpen){
        const panel=secondary.getBoundingClientRect(),visible=popup.isOpen(),panelHeight=visible?panel.height:0,panelWidth=visible?panel.width:0;
        const available=metric(secondary,'--popup-available-height'),limit=metric(secondary,'--command-bar-overflow-max-height');
        Object.assign(barSettings.values,{contentHeight:height,negativeOverflowContentHeight:-panelHeight,overflowContentClipRect:templateRect(panelWidth,panelHeight),overflowContentCompactYTranslation:-panelHeight+compact-height,overflowContentHeight:panelHeight,overflowContentHiddenYTranslation:-panelHeight-height,overflowContentHorizontalOffset:visible?panel.left-host.getBoundingClientRect().left:0,overflowContentMaxHeight:Math.min(limit,available||limit),overflowContentMinWidth:metric(secondary,'--command-bar-overflow-min-width'),overflowContentMinimalYTranslation:-panelHeight+minimal-height});
      }
    }
    const arrayFor = side => side === 'primary' ? commands : secondaryCommands;
    function place(row,node,index) { if(row.children[index]!==node)row.insertBefore(node,row.children[index]||null); }
    const contained = node => [host,primary,secondary].includes(node.parentElement);
    function sideFor(node) { const value=node.getAttribute('slot');if(value!==null&&!['','secondary'].includes(value))throw new RangeError('Unknown CommandBar command slot');return value==='secondary'?'secondary':'primary'; }
    function assertMutable() { if(notifying||committing)throw new Error('Command collections cannot change during mutation or vectorChanged notification'); }
    function validateElement(node) { if(!(node instanceof Element)||node.ownerDocument!==host.ownerDocument||!node.matches(commandElements))throw new TypeError('Command collections require command elements from the same document'); }
    function validateLists(nextPrimary,nextSecondary) {
      const all=[...nextPrimary,...nextSecondary];if(new Set(all).size!==all.length)throw new TypeError('A command can occur only once');
      for(const node of all){validateElement(node);const owner=commandOwners.get(node);if(owner&&owner.model!==model)throw new TypeError('Command belongs to another bar; use moveCommand');}
    }
    function notify(events) {
      notifying=true;try{for(const [side,collectionChange,index,item,previousItem]of events)vectors[side].dispatchEvent(new CustomEvent('vectorChanged',{detail:{collectionChange,index,item,previousItem}}));}finally{notifying=false;}
    }
    function commit(nextPrimary,nextSecondary,events=[]) {
      assertMutable();validateLists(nextPrimary,nextSecondary);
      const old=[...commands,...secondaryCommands],all=[...nextPrimary,...nextSecondary],focused=document.activeElement;
      for(const node of all){if(node.matches(commandTags))hydrateCommand(node);else if(buttonFor(node))initializeAppBar(node);}
      committing=true;try{
      commands=nextPrimary;secondaryCommands=nextSecondary;
      for(const node of old.filter(node=>!all.includes(node))){
        if(commandOwners.get(node)?.model===model)commandOwners.delete(node);
        if(contained(node))node.remove();node.removeAttribute('data-command-overflow');node.hidden=false;
        const button=buttonFor(node);if(button){button.removeAttribute('data-command-overflow');button.removeAttribute('aria-checked');button.setAttribute('role','button');button.tabIndex=0;appBars.get(button).setCompact(false);updateCommandPresentation(button);}
      }
      for(const [side,nodes]of [['primary',commands],['secondary',secondaryCommands]])for(const [index,node]of nodes.entries()){
        commandOwners.set(node,{model,side});
        if(side==='secondary')node.setAttribute('slot','secondary');else node.removeAttribute('slot');
        place(side==='primary'?primary:secondary,node,index);prepare(node,side==='secondary');
      }
      compactPrimary();layout();
      if(focused&&focused!==document.activeElement&&old.some(node=>node===focused||node.contains(focused))){
        if(all.some(node=>node===focused||node.contains(focused))&&(!focused.closest('[data-command-overflow]')||isOpen)&&!focused.closest('[inert]'))focused.focus({preventScroll:true});
        else (!more.hidden&&!more.inert?more:descendants(primary,'button:not(:disabled)').find(node=>!node.closest('[inert]')))?.focus({preventScroll:true});
      }
      }finally{committing=false;}
      notify(events);
    }
    function vector(side) {
      const result=new EventTarget(),check=(index,end=false)=>{if(!Number.isInteger(index)||index<0||index>=arrayFor(side).length+(end?1:0))throw new RangeError('Command index out of range');return index;};
      const replace=(values,change='reset',index=0,item,previousItem)=>{const next=Array.from(values);commit(side==='primary'?next:[...commands],side==='secondary'?next:[...secondaryCommands],[[side,change,index,item,previousItem]]);};
      Object.defineProperty(result,'size',{get:()=>arrayFor(side).length});
      Object.assign(result,{getAt:index=>arrayFor(side)[check(index)],indexOf:node=>arrayFor(side).indexOf(node),getView:()=>Object.freeze([...arrayFor(side)]),[Symbol.iterator]:()=>[...arrayFor(side)][Symbol.iterator](),
        append:node=>result.insertAt(arrayFor(side).length,node),insertAt:(index,node)=>{check(index,true);const next=[...arrayFor(side)];next.splice(index,0,node);replace(next,'itemInserted',index,node);},
        setAt:(index,node)=>{check(index);const next=[...arrayFor(side)],previous=next[index];if(previous===node)return;next[index]=node;replace(next,'itemChanged',index,node,previous);},
        removeAt:index=>{check(index);const next=[...arrayFor(side)],previous=next.splice(index,1)[0];replace(next,'itemRemoved',index,previous);},removeAtEnd:()=>result.removeAt(arrayFor(side).length-1),
        clear:()=>{if(arrayFor(side).length)replace([]);},replaceAll:values=>replace(values),
        move:(from,to)=>{check(from);check(to);if(from===to)return;const next=[...arrayFor(side)];next.splice(to,0,next.splice(from,1)[0]);replace(next);}
      });return result;
    }
    const vectors={primary:vector('primary'),secondary:vector('secondary')};
    function moveCommand(node,side='primary',index) {
      assertMutable();validateElement(node);enumValue(side,['primary','secondary'],'Command collection');
      const focused=document.activeElement,hadFocus=node===focused||node.contains(focused);
      const owner=commandOwners.get(node),same=owner?.model===model&&owner.side===side,max=arrayFor(side).length-(same?1:0);
      const target=index===undefined?max:index;if(!Number.isInteger(target)||target<0||target>max)throw new RangeError('Command index out of range');
      if(owner&&owner.model!==model){owner.model.assertMutable();owner.model.remove(node);}
      const nextPrimary=commands.filter(item=>item!==node),nextSecondary=secondaryCommands.filter(item=>item!==node),next=side==='primary'?nextPrimary:nextSecondary;
      next.splice(target,0,node);const events=[];
      if(owner?.model===model){const oldIndex=arrayFor(owner.side).indexOf(node);if(same){if(oldIndex===target)return;events.push([side,'reset',0]);}else events.push([owner.side,'itemRemoved',oldIndex,node]);}
      if(!same)events.push([side,'itemInserted',target,node]);commit(nextPrimary,nextSecondary,events);
      if(hadFocus){if((side==='primary'&&!node.hasAttribute('data-command-overflow')||isOpen)&&!focused.closest('[inert]'))focused.focus({preventScroll:true});else if(!more.hidden&&!more.inert)more.focus({preventScroll:true});}
    }
    const model={assertMutable,remove:node=>{const owner=commandOwners.get(node);if(owner?.model===model)vectors[owner.side].removeAt(arrayFor(owner.side).indexOf(node));},
      slotChanged:node=>{if(committing)return;if(!contained(node)){refresh();return;}const owner=commandOwners.get(node),side=sideFor(node);if(owner?.model===model&&owner.side!==side)moveCommand(node,side);}};
    function invalidate() { if (!frame) frame = requestAnimationFrame(() => { frame = 0; layout(); }); }
    function reflectState() {
      host.dataset.open = String(isOpen); host.dataset.sticky = String(sticky);
      if (authored) { syncing = true; try { host.toggleAttribute('open', isOpen); host.toggleAttribute('sticky', sticky); } finally { syncing = false; } }
    }
    function compactPrimary() {
      for (const node of commands) {
        const button = buttonFor(node), compact = !isOpen && !unboundedPreview;
        if (button && appBars.get(button).isCompact !== compact) appBars.get(button).setCompact(compact);
        if (!button && separatorApi(node).isCompact !== compact) separatorApi(node).setCompact(compact);
      }
    }
    function setOpen(value, keepOpen = sticky, focus = false) {
      if (typeof value !== 'boolean' || typeof keepOpen !== 'boolean') throw new TypeError('Open and sticky must be boolean');
      const changed = isOpen !== value; isOpen = value; sticky = keepOpen; reflectState();
      if (changed) compactPrimary(); layout();
      if (!isOpen) popup.close(focus);
      else if (focus) (items()[0] || more).focus({ preventScroll: true });
      if (changed) eventFor(host, isOpen ? 'opened' : 'closed', {});
    }
    function prepare(node, overflow) {
      node.toggleAttribute('data-command-overflow', overflow);
      const button = buttonFor(node);
      if (button) {
        button.toggleAttribute('data-command-overflow', overflow);
        initializeAppBar(button); button.setAttribute('role', overflow ? button.hasAttribute('data-appbar-toggle') ? 'menuitemcheckbox' : 'menuitem' : 'button'); button.tabIndex = overflow ? -1 : 0;
        if (overflow && button.hasAttribute('data-appbar-toggle')) button.setAttribute('aria-checked', button.getAttribute('aria-pressed'));
        else button.removeAttribute('aria-checked');
        updateCommandPresentation(button);
        updateCommandAccessibility(button);
      }
      else node.setAttribute('role', 'separator');
      if (!overflow && !registered.has(node)) {
        registered.add(node);
        if (button) appBars.get(button).setCompact(!isOpen && !unboundedPreview);
        else separatorApi(node).setCompact(!isOpen && !unboundedPreview);
      }
    }
    function layout() {
      if (layingOut || !host.getClientRects().length) return;
      layingOut = true;
      try {
        const focused = document.activeElement;
        host.dataset.closedViewport = closedDisplayMode;
        host.classList.toggle('command-bar--minimal', !isOpen && closedDisplayMode === 'minimal');
        host.classList.toggle('command-bar--hidden', !isOpen && closedDisplayMode === 'hidden');
        host.toggleAttribute('data-unbounded-preview', unboundedPreview);
        primary.inert = !isOpen && closedDisplayMode !== 'compact';
        const content=authoredBars.get(host)?.contentHost;if(content)content.inert=primary.inert;
        more.inert = !isOpen && closedDisplayMode === 'hidden';
        for (const [index,node] of commands.entries()) { place(primary,node,index); prepare(node, false); if (node.matches('[role="separator"]')) node.hidden = false; }
        for (const [index,node] of secondaryCommands.entries()) { place(secondary,node,index); prepare(node, true); if (node.matches('[role="separator"]')) node.hidden = false; }
        const overflow = new Set(), widths = new Map(commands.map(node => [node, node.getBoundingClientRect().width]));
        let used = [...widths.values()].reduce((a, b) => a + b, 0);
        const compactHeight = parseFloat(getComputedStyle(host).getPropertyValue('--command-bar-compact-height'));
        const automaticMore = secondaryCommands.length > 0 || closedDisplayMode !== 'compact' || Math.abs(contentHeight()-compactHeight)>=0.5/(devicePixelRatio||1) || commands.some(node => buttonFor(node) && (node.getBoundingClientRect().height > compactHeight || buttonFor(node).dataset.effectiveLabelPosition === 'bottom'));
        more.hidden = overflowButtonVisibility === 'collapsed' || overflowButtonVisibility === 'auto' && !automaticMore;
        function fit() {
          const width = primary.getBoundingClientRect().width;
          if (!dynamicOverflowEnabled || host.classList.contains('command-bar--unconstrained')) return;
          const move = node => { if (!overflow.has(node)) { overflow.add(node); used -= widths.get(node); } };
          const groups = [...new Set(commands.map(node => overflowOrder(commandValue(node, 'dynamic-overflow-order', '0'))).filter(order => order > 0))].sort((a, b) => a - b);
          for (const order of groups) {
            if (used <= width) break;
            commands.forEach((node, index) => { if (overflowOrder(commandValue(node, 'dynamic-overflow-order', '0')) === order) {
              move(node);
              for (const direction of [-1,1]) for (let i = index + direction; commands[i]?.matches('[role="separator"]'); i += direction) move(commands[i]);
            } });
          }
          for (let i = commands.length - 1; i >= 0 && used > width; i--) if (!groups.length || overflowOrder(commandValue(commands[i], 'dynamic-overflow-order', '0')) === 0) move(commands[i]);
        }
        fit();
        if (overflow.size && more.hidden && overflowButtonVisibility === 'auto') { more.hidden = false; fit(); }
        for (const node of commands.filter(node => overflow.has(node)).reverse()) { secondary.prepend(node); prepare(node, true); }
        for (const row of [primary, secondary]) {
          let previousSeparator = true;
          const nodes = Array.from(row.children);
          nodes.forEach((node, index) => {
            if (node.matches('[role="separator"]')) { node.hidden = previousSeparator || !nodes.slice(index + 1).some(next => !next.matches('[role="separator"]')); previousSeparator = true; }
            else previousSeparator = false;
          });
        }
        if (isOpen && secondary.children.length) { if (!popup.isOpen()) popup.show(); else popup.position(); }
        else if (popup.isOpen()) { const open = isOpen; isOpen = false; popup.close(); isOpen = open; }
        more.setAttribute('aria-expanded', String(isOpen));
        measureTemplateState(false);
        if (focused?.isConnected && host.contains(focused) && focused !== document.activeElement) {
          const target = focused.closest('[data-command-overflow]');
          if (target && !isOpen || primary.inert || more.hidden && focused === more) { const fallback = !more.hidden && !more.inert ? more : !primary.inert ? descendants(primary,'button:not(:disabled)').at(-1) : null; fallback?.focus({ preventScroll: true }); }
          else focused.focus({ preventScroll: true });
        }
      } finally { layingOut = false; }
    }
    more.setAttribute('aria-haspopup', 'menu'); secondary.setAttribute('role', 'menu');
    more.addEventListener('click', () => setOpen(!isOpen));
    host.addEventListener('click', event => { if (event.target === host && !isOpen && closedDisplayMode === 'minimal') setOpen(true); });
    more.addEventListener('keydown', e => { if (['ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); setOpen(true, sticky, true); if (e.key === 'ArrowUp') items().at(-1)?.focus(); } });
    secondary.addEventListener('keydown', e => {
      const all = items(), index = all.indexOf(document.activeElement); let next;
      if (e.key === 'ArrowDown') next = all[(index + 1) % all.length];
      if (e.key === 'ArrowUp') next = all[(index + all.length - 1) % all.length];
      if (e.key === 'Home') next = all[0]; if (e.key === 'End') next = all.at(-1);
      if (next) { e.preventDefault(); e.stopPropagation(); next.focus(); }
    });
    host.addEventListener('commandInvoked', event => { if (!sticky&&!event.target.closest('[data-open-popup]')) setOpen(false, false, true); });
    host.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isOpen) { e.preventDefault(); setOpen(false, sticky, true); return; }
      if (!primary.contains(e.target) && e.target !== more) return;
      const all = [...descendants(primary, 'button:not(:disabled)'), ...(!more.hidden && !more.inert ? [more] : [])], index = all.indexOf(document.activeElement); let next;
      const rtl = getComputedStyle(host).direction === 'rtl';
      if (e.key === 'ArrowRight') next = all[(index + (rtl ? -1 : 1) + all.length) % all.length];
      if (e.key === 'ArrowLeft') next = all[(index + (rtl ? 1 : -1) + all.length) % all.length];
      if (e.key === 'Home') next = all[0]; if (e.key === 'End') next = all.at(-1);
      if (next) { e.preventDefault(); e.stopPropagation(); next.focus(); }
    });
    const inOwnedPopup=target=>Array.from(popupInstances).some(popup=>popup.isOpen()&&host.contains(popup.trigger)&&popup.panel.contains(target));
    document.addEventListener('pointerdown', e => { if (isOpen && !sticky && !host.contains(e.target)&&!inOwnedPopup(e.target)) setOpen(false); }, true);
    document.addEventListener('focusin', e => { if (isOpen && !sticky && !host.contains(e.target)&&!inOwnedPopup(e.target)) setOpen(false); });
    function refresh() {
      if(refreshing)return;assertMutable();refreshing=true;
      try{
        if(authored)syncBarContent(host);
        const nextPrimary=commands.filter(contained),nextSecondary=secondaryCommands.filter(contained),events=[];
        if(nextPrimary.length!==commands.length)events.push(['primary','reset',0]);
        if(nextSecondary.length!==secondaryCommands.length)events.push(['secondary','reset',0]);
        if(events.length)commit(nextPrimary,nextSecondary,events);
        for(const node of [...commands,...secondaryCommands])model.slotChanged(node);
        for(const node of Array.from(host.children).filter(node=>node.matches(commandElements)&&node.getAttribute('slot')!=='content'))moveCommand(node,sideFor(node));
        for(const [side,row]of [['primary',primary],['secondary',secondary]])for(const node of Array.from(row.children).filter(node=>node.matches(commandElements)))if(commandOwners.get(node)?.model!==model)moveCommand(node,side);
        layout();
      }finally{refreshing=false;}
    }
    function updateFromAttributes() {
      if (syncing) return;
      defaultLabelPosition = enumValue(read('default-label-position', read('label-position','bottom')), ['bottom','right','collapsed'], 'DefaultLabelPosition');
      closedDisplayMode = enumValue(read('closed-display-mode','compact'), ['compact','minimal','hidden'], 'ClosedDisplayMode');
      overflowButtonVisibility = enumValue(read('overflow-button-visibility','auto'), ['auto','visible','collapsed'], 'OverflowButtonVisibility');
      dynamicOverflowEnabled = enumValue(read('dynamic-overflow','enabled'), ['enabled','disabled'], 'dynamic-overflow') === 'enabled';
      host.dataset.labelPosition = defaultLabelPosition;
      if (authored) { host.classList.toggle('command-bar--unconstrained', host.hasAttribute('unconstrained')); more.setAttribute('aria-label', read('more-label','More')); }
      // Preserve the existing full-size unconstrained preview composition. An
      // explicit ClosedDisplayMode opts into the original closed viewport.
      const nextUnboundedPreview = host.classList.contains('command-bar--unconstrained') && !host.hasAttribute(authored ? 'closed-display-mode' : 'data-closed-display-mode');
      if (unboundedPreview !== nextUnboundedPreview) { unboundedPreview = nextUnboundedPreview; compactPrimary(); }
      if (authored) setOpen(host.hasAttribute('open'), host.hasAttribute('sticky'));
      else { compactPrimary(); layout(); }
    }
    function setValue(attribute, value) { host.setAttribute(authored ? attribute : 'data-' + attribute, value); if (!authored) updateFromAttributes(); }
    const api = {
      setOpen, refresh, invalidate, updateFromAttributes, measureTemplateState,
      get templateSettings(){measureTemplateState();return appBarSettings.object;},
      get commandBarTemplateSettings(){measureTemplateState();return barSettings.object;},
      get content(){const state=authoredBars.get(host);if(state?.pendingContent)return state.pendingContent.value;if(authored)syncBarContent(host);return state?.contentValue??null;},setContent:value=>setBarContent(host,value),
      get contentTemplate(){const state=authoredBars.get(host);if(state?.pendingContent)return state.pendingContent.template;if(authored)syncBarContent(host);return state?.contentProperties?.template.value??null;},setContentTemplate:value=>setBarTemplate(host,'template',value),
      get contentTemplateSelector(){const state=authoredBars.get(host);if(state?.pendingContent)return state.pendingContent.selector;if(authored)syncBarContent(host);return state?.contentProperties?.selector.value??null;},setContentTemplateSelector:value=>setBarTemplate(host,'selector',value),
      get contentTemplateRoot(){if(authored)syncBarContent(host);return authoredBars.get(host)?.contentTemplateRoot??null;},
      refreshContent(){const state=authoredBars.get(host);if(state?.changingContent)throw new Error('Content cannot refresh during rendering');return syncBarContent(host,{force:true});},
      get primaryCommands(){return vectors.primary;},get secondaryCommands(){return vectors.secondary;},moveCommand,
      get isOpen() { return isOpen; }, get isSticky() { return sticky; },
      setSticky(value) { if (typeof value !== 'boolean') throw new TypeError('Sticky must be boolean'); sticky = value; reflectState(); },
      get defaultLabelPosition() { return defaultLabelPosition; }, setDefaultLabelPosition(value) { setValue('default-label-position', enumValue(value,['bottom','right','collapsed'],'DefaultLabelPosition')); },
      get closedDisplayMode() { return closedDisplayMode; }, setClosedDisplayMode(value) { setValue('closed-display-mode', enumValue(value,['compact','minimal','hidden'],'ClosedDisplayMode')); },
      get overflowButtonVisibility() { return overflowButtonVisibility; }, setOverflowButtonVisibility(value) { setValue('overflow-button-visibility', enumValue(value,['auto','visible','collapsed'],'OverflowButtonVisibility')); },
      get isDynamicOverflowEnabled() { return dynamicOverflowEnabled; }, setDynamicOverflowEnabled(value) { if (typeof value !== 'boolean') throw new TypeError('IsDynamicOverflowEnabled must be boolean'); setValue('dynamic-overflow', value ? 'enabled' : 'disabled'); }
    };
    commandBars.set(host, api);
    commit([...commands],[...secondaryCommands]);
    const templateResize=new ResizeObserver(invalidate);[host,primary,secondary].forEach(node=>templateResize.observe(node));
    document.fonts?.addEventListener('loadingdone',invalidate);
    new MutationObserver(records=>{
      const contentState=authoredBars.get(host),holder=contentState?.contentHost,stash=contentState?.contentStash;
      if(authored&&records.some(record=>record.type==='attributes'?[holder,stash,host].includes(record.target.parentElement):[holder,stash].includes(record.target)||record.target===host&&[...record.addedNodes,...record.removedNodes].some(node=>node instanceof Element&&['content','content-template','content-template-selector'].includes(node.getAttribute('slot')))||[...record.removedNodes].some(node=>node===contentState.contentValue)))syncBarContent(host);
      const external=records.some(record=>record.type==='attributes'?commandOwners.get(record.target)?.model===model&&commandOwners.get(record.target).side!==sideFor(record.target):[host,primary,secondary].includes(record.target)&&[...record.addedNodes,...record.removedNodes].some(node=>node instanceof Element&&node.matches(commandElements)&&(node.parentElement===host||contained(node)&&commandOwners.get(node)?.model!==model||!contained(node)&&commandOwners.get(node)?.model===model)));
      if(external)refresh();
    }).observe(host,{childList:true,subtree:true,attributes:true,attributeFilter:['slot']});
    updateFromAttributes(); refresh();
  }
  const preparedMenuHeaders=new WeakSet();
  function initializeMenuBar(host) {
    if (menuBars.has(host)) {menuBars.get(host).refresh();return;}
    let buttons = descendants(host, '[data-menu-heading]');
    const panelFor = button => scopedId(button,button.dataset.toggleMenuTarget);
    const open = (button, last = false) => { const panel = panelFor(button); if (panel) { initializeMenu(panel); menuControllers.get(panel).open(last); } };
    host.setAttribute('role', 'menubar');
    function refresh(){buttons=descendants(host,'[data-menu-heading]');buttons.forEach((button, i) => {
      button.setAttribute('role','menuitem');if(preparedMenuHeaders.has(button))return;preparedMenuHeaders.add(button);button.tabIndex=i===0?0:-1;
      button.addEventListener('focus', () => buttons.forEach(peer => peer.tabIndex = peer === button ? 0 : -1));
      button.addEventListener('pointerenter', () => { if (buttons.some(peer => peer.getAttribute('aria-expanded') === 'true') && button.getAttribute('aria-expanded') !== 'true') open(button); });
      button.addEventListener('keydown', e => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(button, e.key === 'ArrowUp'); } });
    });}
    refresh();
    host.addEventListener('keydown', e => {
      const rtl = getComputedStyle(host).direction === 'rtl', active = buttons.findIndex(b => b === e.target || panelFor(b)?.contains(e.target));
      if (active < 0) return;
      const inSubmenu = e.target.closest('[data-menu]')?.hasAttribute('data-submenu-for');
      if (inSubmenu || e.target.closest('[data-submenu]') && e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) return;
      let index;
      if (e.key === 'ArrowRight') index = (active + (rtl ? -1 : 1) + buttons.length) % buttons.length;
      if (e.key === 'ArrowLeft') index = (active + (rtl ? 1 : -1) + buttons.length) % buttons.length;
      if (e.target.matches('[data-menu-heading]') && e.key === 'Home') index = 0;
      if (e.target.matches('[data-menu-heading]') && e.key === 'End') index = buttons.length - 1;
      if (index !== undefined) { e.preventDefault(); e.stopPropagation(); const expanded = buttons[active].getAttribute('aria-expanded') === 'true'; if (expanded) open(buttons[index]); else buttons[index].focus(); }
    });
    menuBars.set(host, { open: index => {if(buttons[index])open(buttons[index]);},refresh });
  }

  const localDate = (year, month, day) => { const value = new Date(0); value.setHours(12, 0, 0, 0); value.setFullYear(year, month, day); return value; };
  const dateKey = date => `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const parseDate = text => { if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new TypeError('Date must be YYYY-MM-DD'); const [y, m, d] = text.split('-').map(Number), date = localDate(y, m - 1, d); if (dateKey(date) !== text) throw new RangeError('Invalid calendar date'); return date; };
  function initializeCalendarDatePicker(host) {
    if (calendars.has(host)) return;
    let locale = regionalLocale(host);
    const trigger = host.querySelector('[data-date-trigger]'), text = trigger.querySelector('[data-date-text]');
    const panel = element('div', 'calendar-view'), header = element('div', 'calendar-view__header'), title = controlButton('calendar-view__title', ''), previous = controlButton('calendar-view__navigate glyph', '\uEDDB', 'Previous'), next = controlButton('calendar-view__navigate glyph', '\uEDDC', 'Next');
    const weekdays = element('div', 'calendar-view__weekdays'), grid = element('div', 'calendar-view__grid');
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Calendar'); grid.setAttribute('role', 'grid');
    title.setAttribute('aria-live', 'polite'); header.append(title, previous, next); panel.append(header, weekdays, grid); host.append(panel);
    let value = null, mode = 'month', cursor = localDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    const today = dateKey(cursor), todayYear = cursor.getFullYear();
    let min = host.dataset.minDate ? parseDate(host.dataset.minDate) : localDate(todayYear - 100, 0, 1), max = host.dataset.maxDate ? parseDate(host.dataset.maxDate) : localDate(todayYear + 100, 11, 31);
    if (min > max) throw new RangeError('Minimum date exceeds maximum date');
    const clamp = d => d < min ? new Date(min) : d > max ? new Date(max) : d;
    const formatter = options => new Intl.DateTimeFormat(locale, { calendar: 'gregory', ...options });
    let fullDate = formatter({ dateStyle: 'full' }), shortDate = formatter({ year: 'numeric', month: 'numeric', day: 'numeric' });
    const firstDay = Number(host.dataset.firstDayOfWeek ?? 0) % 7;
    let number = new Intl.NumberFormat(locale, { useGrouping: false });
    function renderWeekdays() { weekdays.replaceChildren(); for (let i = 0; i < 7; i++) weekdays.append(element('span', 'calendar-view__weekday', formatter({ weekday: 'narrow' }).format(localDate(2026, 10, 1 + (firstDay + i) % 7)))); }
    renderWeekdays();
    const popup = createPopup(panel, trigger, { onClose: () => { mode = 'month'; } });
    const inRange = (a, b = a) => a <= max && b >= min;
    function render(focus = false) {
      cursor = clamp(cursor); const year = cursor.getFullYear(), month = cursor.getMonth(), decade = Math.floor(year / 10) * 10;
      const oldDay = document.activeElement?.dataset.calendarValue;
      grid.replaceChildren(); panel.dataset.displayMode = mode; weekdays.hidden = mode !== 'month';
      title.textContent = mode === 'month' ? formatter({ year: 'numeric', month: 'long' }).format(cursor) : mode === 'year' ? number.format(year) : `${number.format(decade)} - ${number.format(decade + 9)}`;
      title.disabled = mode === 'decade'; grid.setAttribute('aria-label', title.textContent);
      const start = mode === 'month' ? localDate(year, month, 1 - (localDate(year, month, 1).getDay() - firstDay + 7) % 7) : null;
      const count = mode === 'month' ? 42 : 16;
      for (let i = 0; i < count; i++) {
        const date = mode === 'month' ? localDate(start.getFullYear(), start.getMonth(), start.getDate() + i) : mode === 'year' ? localDate(year, i, 1) : localDate(decade + i, 0, 1);
        const end = mode === 'month' ? date : mode === 'year' ? localDate(year, i + 1, 0) : localDate(date.getFullYear(), 11, 31);
        const key = dateKey(date), selected = mode === 'month' && value && key === dateKey(value);
        const button = controlButton('calendar-view__item', mode === 'month' ? number.format(date.getDate()) : mode === 'year' ? formatter({ month: 'short' }).format(date) : number.format(date.getFullYear()), mode === 'month' ? fullDate.format(date) : undefined);
        if (mode === 'month' && date.getDate() === 1) { const label = element('span', 'calendar-view__month-label', formatter({month:'short'}).format(date)); label.setAttribute('aria-hidden', 'true'); button.append(label); }
        button.dataset.calendarValue = key; button.setAttribute('role', 'gridcell'); button.setAttribute('aria-selected', String(Boolean(selected))); button.disabled = !inRange(date, end);
        button.toggleAttribute('data-outside-period', mode === 'month' ? date.getMonth() !== month : mode === 'year' ? date.getFullYear() !== year : date.getFullYear() < decade || date.getFullYear() > decade + 9);
        if (key === today) button.setAttribute('aria-current', 'date');
        const active = mode === 'month' ? key === dateKey(cursor) : mode === 'year' ? i === month : date.getFullYear() === year;
        button.tabIndex = active && !button.disabled ? 0 : -1;
        button.addEventListener('click', () => { if (mode === 'month') { setDate(key); popup.close(true); } else { cursor = clamp(localDate(date.getFullYear(), mode === 'year' ? i : month, 1)); mode = mode === 'decade' ? 'year' : 'month'; render(true); } });
        grid.append(button);
      }
      previous.disabled = mode === 'month' ? localDate(year, month, 1) <= min : mode === 'year' ? localDate(year, 0, 1) <= min : localDate(decade, 0, 1) <= min;
      next.disabled = mode === 'month' ? localDate(year, month + 1, 0) >= max : mode === 'year' ? localDate(year, 11, 31) >= max : localDate(decade + 9, 11, 31) >= max;
      if (focus) (grid.querySelector('[tabindex="0"]') || grid.querySelector('button:not(:disabled)'))?.focus({ preventScroll: true });
      popup.position();
    }
    function setDate(iso, notify = true) {
      const oldDate = value ? dateKey(value) : null; const date = iso === null || iso === '' ? null : parseDate(iso);
      if (date && !inRange(date)) throw new RangeError('Date is outside the supported range');
      value = date; if (date) cursor = new Date(date);
      text.textContent = value ? shortDate.format(value) : host.dataset.placeholder || 'Select a date'; host.dataset.date = value ? dateKey(value) : ''; trigger.toggleAttribute('data-empty', !value); trigger.setAttribute('aria-label', (host.querySelector('.calendar-date-picker__header')?.textContent || 'Date') + ': ' + text.textContent);
      if (notify && oldDate !== (value ? dateKey(value) : null)) eventFor(host, 'dateChanged', { date: value ? dateKey(value) : null, oldDate });
    }
    function move(direction) {
      if (mode === 'month') cursor = clamp(localDate(cursor.getFullYear(), cursor.getMonth() + direction, Math.min(cursor.getDate(), localDate(cursor.getFullYear(), cursor.getMonth() + direction + 1, 0).getDate())));
      else cursor = clamp(localDate(cursor.getFullYear() + direction * (mode === 'year' ? 1 : 10), cursor.getMonth(), 1));
      render();
    }
    previous.addEventListener('click', () => move(-1)); next.addEventListener('click', () => move(1));
    title.addEventListener('click', () => { mode = mode === 'month' ? 'year' : 'decade'; render(true); });
    const open = () => { cursor = value ? new Date(value) : clamp(cursor); mode = 'month'; render(); popup.show(); render(true); };
    trigger.setAttribute('aria-haspopup', 'dialog'); trigger.addEventListener('click', () => popup.isOpen() ? popup.close(true) : open());
    trigger.addEventListener('keydown', e => { if (e.key === 'ArrowDown' && e.altKey || e.key === 'F4') { e.preventDefault(); open(); } });
    grid.addEventListener('keydown', e => {
      if(e.ctrlKey&&e.key==='ArrowDown'&&mode!=='month'){e.preventDefault();mode=mode==='decade'?'year':'month';render(true);return;}
      if (e.ctrlKey && e.key === 'ArrowUp' && mode !== 'decade') { e.preventDefault(); mode = mode === 'month' ? 'year' : 'decade'; render(true); return; }
      const rtl = getComputedStyle(host).direction === 'rtl', days = { ArrowLeft: rtl ? 1 : -1, ArrowRight: rtl ? -1 : 1, ArrowUp: mode === 'month' ? -7 : -4, ArrowDown: mode === 'month' ? 7 : 4 };
      if (e.key in days) { e.preventDefault(); if (mode === 'month') cursor = clamp(localDate(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + days[e.key])); else if (mode === 'year') cursor = clamp(localDate(cursor.getFullYear(), cursor.getMonth() + days[e.key], 1)); else cursor = clamp(localDate(cursor.getFullYear() + days[e.key], 0, 1)); render(true); }
      if (['PageUp', 'PageDown'].includes(e.key)) { e.preventDefault(); move(e.key === 'PageUp' ? -1 : 1); render(true); }
      if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); const last = e.key === 'End'; cursor = clamp(mode === 'month' ? localDate(cursor.getFullYear(), cursor.getMonth() + (last ? 1 : 0), last ? 0 : 1) : mode === 'year' ? localDate(cursor.getFullYear(), last ? 11 : 0, 1) : localDate(Math.floor(cursor.getFullYear() / 10) * 10 + (last ? 9 : 0), 0, 1)); render(true); }
    });
    let lastWheel = 0; panel.addEventListener('wheel', event => { if (Math.abs(event.deltaY) < 2) return; event.preventDefault(); const now = performance.now(); if (now - lastWheel > 180) { move(Math.sign(event.deltaY)); lastWheel = now; } }, {passive:false});
    let touchStart; panel.addEventListener('pointerdown', event => { if (event.pointerType === 'touch') touchStart = event.clientY; }); panel.addEventListener('pointerup', event => { if (touchStart !== undefined && Math.abs(event.clientY - touchStart) > 40) move(event.clientY < touchStart ? 1 : -1); touchStart = undefined; });
    function refreshCalendarLocale(){
      locale=regionalLocale(host);
      fullDate=formatter({dateStyle:'full'});shortDate=formatter({year:'numeric',month:'numeric',day:'numeric'});number=new Intl.NumberFormat(locale,{useGrouping:false});
      renderWeekdays();setDate(value?dateKey(value):null,false);if(popup.isOpen())render();
    }
    window.addEventListener('winuiRegionChanged',()=>{if(host.isConnected)refreshCalendarLocale();});
    setDate(host.dataset.date || null, false);
    calendars.set(host, { open, close: () => popup.close(true), refresh:()=>setDate(value?dateKey(value):null,false), refreshLocale:refreshCalendarLocale, get isOpen(){return popup.isOpen();}, setDate, get date() { return value ? dateKey(value) : null; } });
  }

  function initializeTimePicker(host) {
    if (timePickers.has(host)) return;
    let locale = regionalLocale(host);
    const trigger = host.querySelector('[data-time-trigger]');
    const clock = host.dataset.clockIdentifier; const regionalHour12 = () => dateTimeRegion ? dateTimeRegion.hourClock === 12 : new Intl.DateTimeFormat(locale, {hour:'numeric'}).resolvedOptions().hour12;
    let hour12 = clock === '12HourClock' || clock !== '24HourClock' && regionalHour12();
    const increment = Number(host.dataset.minuteIncrement ?? 1);
    if (!Number.isInteger(increment) || increment < 0 || increment > 59) throw new RangeError('MinuteIncrement must be 0 through 59');
    const step = increment || 60, minutes = Array.from({ length: Math.ceil(60 / step) }, (_, i) => i * step);
    const number = (v, two = false) => new Intl.NumberFormat(locale, { minimumIntegerDigits: two ? 2 : 1, useGrouping: false }).format(v);
    let periods = [0, 12].map(hour => new Intl.DateTimeFormat(locale, { hour: 'numeric', hour12: true }).formatToParts(localDate(2026, 0, 1).setHours(hour)).find(p => p.type === 'dayPeriod')?.value || (hour ? 'PM' : 'AM'));
    let value = null, draft = [0, 0, 0]; const wheels = [], wheelCleanup = [];
    const panel = element('div', 'time-picker__flyout'), columns = element('div', 'time-picker__columns'), footer = element('div', 'time-picker__actions');
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Choose a time');
    const accept = controlButton('button button--subtle glyph', '\uE8FB', 'Accept'), cancel = controlButton('button button--subtle glyph', '\uE711', 'Dismiss'); footer.append(accept, cancel); panel.append(columns, footer); host.append(panel);
    let values; let displayOrder=[];
    const popup = createPopup(panel, trigger, {highlightAnchor:columns,onClose:()=>wheelCleanup.forEach(stop=>stop())});
    function renderTrigger() {
      trigger.replaceChildren(); const parts = value === null ? ['hour', 'minute', ...(hour12 ? ['AM/PM'] : [])] : [number(hour12 ? Math.floor(value / 60) % 12 || 12 : Math.floor(value / 60), !hour12), number(value % 60, true), ...(hour12 ? [periods[value >= 720 ? 1 : 0]] : [])];
      for (const part of displayOrder.map(index=>parts[index])) trigger.append(element('span', 'time-picker__part', part));
      trigger.toggleAttribute('data-empty', value === null); trigger.setAttribute('aria-label', (host.querySelector('.time-picker__header')?.textContent || 'Time') + ': ' + parts.join(' '));
    }
    function setTime(text, notify = true) {
      const oldTime = value;
      if (text === null || text === '') value = null;
      else { if (!/^\d{2}:\d{2}$/.test(text)) throw new TypeError('Time must be HH:mm'); const [h, m] = text.split(':').map(Number); if (h > 23 || m > 59) throw new RangeError('Invalid time'); value = h * 60 + Math.floor(m / step) * step; }
      host.dataset.time = value === null ? '' : `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`; renderTrigger();
      if (notify && value !== oldTime) eventFor(host, 'selectedTimeChanged', { time: host.dataset.time || null, oldTime: oldTime === null ? null : `${String(Math.floor(oldTime / 60)).padStart(2, '0')}:${String(oldTime % 60).padStart(2, '0')}` });
    }
    function buildWheels() {
      wheelCleanup.splice(0).forEach(stop=>stop());wheels.length=0;columns.replaceChildren();
      values=[Array.from({length:hour12?12:24},(_,i)=>hour12?i+1:i),minutes,...(hour12?[periods]:[])];
      const parts=new Intl.DateTimeFormat(locale,{hour:'numeric',minute:'2-digit',hour12}).formatToParts(new Date(2026,0,1,15,20));
      displayOrder=[...new Set(parts.filter(part=>['hour','minute','dayPeriod'].includes(part.type)).map(part=>({hour:0,minute:1,dayPeriod:2})[part.type]))];
      values.forEach((options, index) => {
      const wheel = element('div', 'time-picker__wheel'); wheel.setAttribute('role', 'listbox'); wheel.setAttribute('aria-label', ['Hour', 'Minute', 'Period'][index]); wheel.tabIndex = 0;
      const looping = index === 0 || index === 1 && increment !== 0, repeats = looping ? 3 : 1;
      Array.from({length: options.length * repeats}, (_, n) => options[n % options.length]).forEach((v, i) => { const option = controlButton('time-picker__option', typeof v === 'string' ? v : number(v, index === 1 || index === 0 && !hour12)); option.tabIndex = -1; option.setAttribute('role', 'option'); option.dataset.index = i; option.addEventListener('click', () => choose(i)); wheel.append(option); });
      function choose(i, scroll = true) { if (!Number.isFinite(i)) return; draft[index] = looping ? (i % options.length + options.length) % options.length : Math.max(0, Math.min(i, options.length - 1)); const position = draft[index] + (looping ? options.length : 0); Array.from(wheel.children).forEach((o, n) => o.setAttribute('aria-selected', String(n === position))); const active = wheel.children[position]; if (!active.id) active.id = nextId(); wheel.setAttribute('aria-activedescendant', active.id); if (scroll) wheel.scrollTop = active.offsetTop - wheel.firstElementChild.offsetTop; }
      wheel.addEventListener('keydown', e => { let next; if (e.key === 'ArrowDown') next = draft[index] + 1; if (e.key === 'ArrowUp') next = draft[index] - 1; if (e.key === 'Home') next = 0; if (e.key === 'End') next = options.length - 1; if (e.key === 'PageDown') next = draft[index] + 5; if (e.key === 'PageUp') next = draft[index] - 5; if (next !== undefined) { e.preventDefault(); choose(next); } });
      let timer; wheelCleanup.push(()=>clearTimeout(timer)); wheel.addEventListener('scroll', () => { clearTimeout(timer); timer = setTimeout(() => { if (!popup.isOpen()) return; const height = wheel.firstElementChild.getBoundingClientRect().height; if (height > 0) { const position = Math.round(wheel.scrollTop / height); choose(position, false); if (looping && (position < options.length || position >= options.length * 2)) wheel.scrollTop = (options.length + draft[index]) * height; } }, 80); });
      const column=element('div','time-picker__column');column.append(wheel);
      for(const direction of [-1,1]){
        const button=controlButton('time-picker__step glyph',direction<0?'\uEDDB':'\uEDDC',(direction<0?'Previous ':'Next ')+['hour','minute','period'][index]);button.tabIndex=-1;button.dataset.direction=String(direction);
        let delay,timer,repeated=false;
        const stop=()=>{clearTimeout(delay);clearInterval(timer);};wheelCleanup.push(stop);
        button.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();button.setPointerCapture(event.pointerId);wheel.focus({preventScroll:true});repeated=false;choose(draft[index]+direction);const metrics=getComputedStyle(host);delay=setTimeout(()=>{repeated=true;choose(draft[index]+direction);timer=setInterval(()=>choose(draft[index]+direction),parseFloat(metrics.getPropertyValue('--number-repeat-interval')));},parseFloat(metrics.getPropertyValue('--number-repeat-delay')));});
        button.addEventListener('pointerup',stop);button.addEventListener('pointercancel',stop);button.addEventListener('lostpointercapture',stop);button.addEventListener('click',event=>{if(event.detail===0)choose(draft[index]+direction);});
        column.append(button);
      }
      columns.append(column); wheels.push({ wheel, choose, column });
    });
      for(const index of displayOrder)columns.append(wheels[index].column);
    }
    buildWheels();
    function refreshTimeLocale(){
      popup.close(false);locale=regionalLocale(host);hour12=clock==='12HourClock'||clock!=='24HourClock'&&regionalHour12();
      periods=[0,12].map(hour=>new Intl.DateTimeFormat(locale,{hour:'numeric',hour12:true}).formatToParts(new Date(2026,0,1,hour)).find(part=>part.type==='dayPeriod')?.value||(hour?'PM':'AM'));
      buildWheels();renderTrigger();
    }
    window.addEventListener('winuiRegionChanged',()=>{if(host.isConnected)refreshTimeLocale();});
    function commit() { const h = hour12 ? values[0][draft[0]] % 12 + draft[2] * 12 : draft[0], m = minutes[draft[1]]; setTime(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`); popup.close(true); }
    function open() {
      const now = new Date(), time = value ?? now.getHours() * 60 + now.getMinutes(), h = Math.floor(time / 60);
      draft = [hour12 ? (h + 11) % 12 : h, Math.floor((time % 60) / step), h >= 12 ? 1 : 0];
      popup.show(); wheels.forEach(({ choose }, i) => choose(draft[i])); wheels[0].wheel.focus({ preventScroll: true });
    }
    trigger.setAttribute('aria-haspopup', 'dialog'); trigger.addEventListener('click', () => popup.isOpen() ? popup.close(true) : open());
    trigger.addEventListener('keydown', e => { if (e.key === 'F4' || e.altKey && e.key === 'ArrowDown') { e.preventDefault(); open(); } });
    panel.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.target.closest('button')) { e.preventDefault(); commit(); } if (['ArrowLeft', 'ArrowRight'].includes(e.key)) { const current = displayOrder.indexOf(wheels.findIndex(w => w.wheel === e.target)), rtl = getComputedStyle(host).direction === 'rtl'; if (current >= 0) { const target = current + ((e.key === 'ArrowRight') !== rtl ? 1 : -1); if (wheels[displayOrder[target]]) { e.preventDefault(); wheels[displayOrder[target]].wheel.focus(); } } } });
    accept.addEventListener('click', commit); cancel.addEventListener('click', () => popup.close(true));
    if (host.dataset.initializeNow === 'true') { const now = new Date(); setTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`, false); } else setTime(host.dataset.time || null, false);
    timePickers.set(host, { open, close: () => popup.close(true), refresh:renderTrigger, refreshLocale:refreshTimeLocale, get isOpen(){return popup.isOpen();}, setTime, get time() { return host.dataset.time || null; } });
  }

  function initialize(root = document) {
    hydrateAuthoring(root);
    if(root.matches?.('[data-list-view]'))initializeListView(root);
    if(root.matches?.('[data-tree-view]'))initializeTreeView(root);
    if(root.matches?.('[data-breadcrumb-bar]'))initializeBreadcrumb(root);
    if(root.matches?.('[data-selector-bar]'))initializeSelectorBar(root);
    if(root.matches?.('[data-navigation-view]'))initializeNavigationView(root);
    if(root.matches?.('.disclosure'))initializeExpander(root);
    if(root.matches?.('[data-split-view]'))initializeSplitView(root);
    if(root.matches?.('[data-width],[data-height]'))initializeSizing(root);
    if(root.matches?.('[data-process-rows]'))initializeProcessStatus(root);
    if(root.matches?.('.text-field,.text-area'))initializeTextBorder(root);
    if(root.matches?.('select.select-field'))initializeComboBox(root);
    if(root.matches?.('[data-check-group]'))initializeCheckBox(root);
    if(root.matches?.('[data-radio-buttons]'))initializeRadioButtons(root);
    // Include a control passed as the root, including detached authoring hosts.
    if (root.matches?.('[data-appbar]')) initializeAppBar(root);
    if (root.matches?.('[data-command-bar]')) initializeCommandBar(root);
    root.querySelectorAll('[data-copy-value]').forEach(initializeCopyValue);
    root.querySelectorAll('.disclosure').forEach(initializeExpander);
    root.querySelectorAll('.source-drawer').forEach(initializeSourceDrawer);
    root.querySelectorAll("progress.progress-bar").forEach(initializeProgressBar);
    root.querySelectorAll(".progress-ring").forEach(initializeProgressRing);
    root.querySelectorAll("[data-split-color]").forEach(host=>{if(!host.matches(actionTags))initializeSplitColor(host);});
    root.querySelectorAll("[data-three-state], [data-check-group]").forEach(initializeCheckBox);
    root.querySelectorAll("[data-radio-buttons]").forEach(initializeRadioButtons);
    root.querySelectorAll("[data-info-bar]").forEach(initializeInfoBar);
    root.querySelectorAll("[data-navigation-view]").forEach(initializeNavigationView);
    root.querySelectorAll("[data-process-rows]").forEach(initializeProcessStatus);
    root.querySelectorAll(".text-field,.text-area").forEach(initializeTextBorder);
    root.querySelectorAll('[data-list-view]').forEach(initializeListView);
    root.querySelectorAll('[data-tree-view]').forEach(initializeTreeView);
    root.querySelectorAll('[data-breadcrumb-bar]').forEach(initializeBreadcrumb);
    root.querySelectorAll('[data-tab-view]').forEach(initializeTabView);
    root.querySelectorAll('[data-selector-bar]').forEach(initializeSelectorBar);
    root.querySelectorAll('[data-split-view]').forEach(initializeSplitView);
    root.querySelectorAll("select.select-field").forEach(initializeComboBox);

    root.querySelectorAll('[data-appbar]').forEach(initializeAppBar);
    root.querySelectorAll('[data-command-bar]').forEach(initializeCommandBar);
    root.querySelectorAll('[data-menu-bar]').forEach(initializeMenuBar);
    root.querySelectorAll('[data-calendar-date-picker]').forEach(initializeCalendarDatePicker);
    root.querySelectorAll('[data-time-picker]').forEach(initializeTimePicker);
    root.querySelectorAll("[data-modal]").forEach(initializeDialog);
    root.querySelectorAll("[data-menu]").forEach(initializeMenu);
    root.querySelectorAll('[data-toggle-button]').forEach(initializeToggleButton);
    if(root.matches?.('.toggle__input'))initializeToggleSwitch(root);
    root.querySelectorAll('.toggle__input').forEach(initializeToggleSwitch);
    root.querySelectorAll('[data-theme-toggle]').forEach(initializeThemeToggle);
    root.querySelectorAll('[data-tooltip]').forEach(initializeTooltip);
    root.querySelectorAll('[data-popup]').forEach(initializeFlyout);
    root.querySelectorAll('[data-auto-suggest]').forEach(initializeAutoSuggest);
    root.querySelectorAll('[data-titlebar]').forEach(initializeTitleBar);
    root.querySelectorAll('[data-number-box]').forEach(initializeNumberBox);
    root.querySelectorAll('[data-slider]').forEach(initializeSlider);
    if(root.matches?.('button[data-button-icon]'))initializeButtonIcon(root);
    root.querySelectorAll('button[data-button-icon]').forEach(initializeButtonIcon);
    initializeAssets(root);
    root.querySelectorAll('.nav-list').forEach(initializeNavigation);
    root.querySelectorAll('[data-width],[data-height]').forEach(initializeSizing);
  }
  window.WinUIControls = Object.freeze({
    getDropDownButton:host=>actionApi(host,'winui-drop-down-button'), getSplitButton:host=>actionApi(host,'winui-split-button'),
    getCheckBox:host=>selectionApi(host,'winui-check-box'), getRadioButton:host=>selectionApi(host,'winui-radio-button'), getToggleButton:host=>selectionApi(host,'winui-toggle-button'), getToggleSwitch:host=>selectionApi(host,'winui-toggle-switch'),
    createCommand, createXamlUICommand, getXamlUICommand:hydrateXamlUICommand, registerCommand,
    getAppBarButton: host => { const button = host.matches('winui-appbar-button,winui-appbar-toggle-button') ? hydrateCommand(host) : host; initializeAppBar(button); return appBars.get(button); },
    getAppBarSeparator: host => { if (host.localName === 'winui-appbar-separator') hydrateCommand(host); return separatorApi(host); },
    getCommandBar: host => { initializeCommandBar(host); return commandBars.get(host); },
    getMenuBar: host => { if(host.localName==='winui-menu-bar')hydrateMenuBar(host);else initializeMenuBar(host);return menuBars.get(host); },
    getMenuFlyout:host=>{hydrateMenuSurface(host);return {get isOpen(){return !!menuControllers.get(host)?.popup.isOpen();},show:()=>menuControllers.get(host)?.open(),hide:()=>menuControllers.get(host)?.close(true),refresh:()=>{hydrateMenuSurface(host);initializeMenu(host);}};},
    getFlyout:surfaceApi,getTeachingTip:surfaceApi,
    getInfoBadge:host=>statusApi(host,'winui-info-badge'),getInfoBar:host=>statusApi(host,'winui-info-bar'),getProgressRing:host=>statusApi(host,'winui-progress-ring'),getProgressBar:progress=>{progress=namedRoot(progress);initializeProgressBar(progress);return progressBars.get(progress);},
    getToolTip:trigger=>{trigger=namedRoot(trigger);initializeTooltip(trigger);const state=tooltips.get(trigger);return state&&{get isOpen(){return state.popup.isOpen();},show:()=>state.popup.show(),hide:()=>state.popup.close(false)};},
    getCalendarDatePicker: host => { if(host.localName==='winui-calendar-date-picker')return hydrateScheduling(host).api;initializeCalendarDatePicker(host); return calendars.get(host); },
    getInAppNotification:host=>{if(host.localName!=='winui-in-app-notification')throw new TypeError('Expected winui-in-app-notification');return hydratePattern(host).api;},
    getTimePicker: host => { if(host.localName==='winui-time-picker')return hydrateScheduling(host).api;initializeTimePicker(host); return timePickers.get(host); }, initialize, copyText, registerAssets, initializeAssets, setEnabled, getContentDialog:host=>{if(host.localName==='winui-content-dialog')return hydrateContentDialog(host).api;initializeDialog(host);return dialogs.get(host);}, getNavigationView:host=>{if(host.localName==='winui-navigation-view')return hydrateNavigationView(host).api;initializeNavigationView(host);return navigationViews.get(host);},
    getListView: host => { if(host.localName==='winui-list-view')return hydrateCollection(host).api;initializeListView(host);return collections.get(host); },
    getTreeView: host => { if(host.localName==='winui-tree-view')return hydrateCollection(host).api;initializeTreeView(host);return trees.get(host); },
    getBreadcrumbBar: host => { if(host.localName==='winui-breadcrumb-bar')return hydrateCollection(host).api;initializeBreadcrumb(host);return breadcrumbs.get(host); },
    getTabView: host => { if(host.localName==='winui-tab-view')return hydrateTabView(host).api;initializeTabView(host); return tabViews.get(host); },
    getSelectorBar: host => { if(host.localName==='winui-selector-bar')return hydrateCollection(host).api;initializeSelectorBar(host);return selectors.get(host); },
    getBorder:host=>initializeBorder(namedRoot(host)),
    getTextBlock:host=>({setText:value=>{namedRoot(host).textContent=String(value??'');},setSelectionEnabled:value=>{if(host.localName==='winui-text-block')host.setAttribute('text-selection',String(!!value));else host.dataset.textSelection=String(!!value);},get text(){return namedRoot(host).textContent;}}),
    getExpander:host=>host.localName==='winui-expander'?hydrateExpander(host).api:initializeExpander(host),
    getSplitView: host => { if(host.localName==='winui-split-view')return hydrateSplitView(host).api;initializeSplitView(host);return splitViews.get(host); },
    setSuggestionProvider: (host, provider) => { const root=inputRoot(host);initializeAutoSuggest(root);suggestions.get(root).setProvider(provider); },
    getTextBox:textBoxApi,
    getNumberBox: host => { const root=inputRoot(host);initializeNumberBox(root);return numbers.get(root); },
    getSlider:host=>{const root=inputRoot(host);initializeSlider(root);return sliderControls.get(root);},
    getComboBox:select=>{select=namedRoot(select);if(!(select instanceof HTMLSelectElement))throw new TypeError('Expected a select element');if(select.hasAttribute('data-header')||select.hasAttribute('data-description'))initializeFieldHeader(select);initializeComboBox(select);return comboBoxes.get(select).api;},
    getAutoSuggestBox:host=>{if(host.localName!=='winui-auto-suggest-box')throw new TypeError('Expected winui-auto-suggest-box');return hydrateInput(host).api;},
    selectNavigation: (nav, item) => { initializeNavigation(nav); navigations.get(nav).select(item); },
    closePopups: () => popupInstances.forEach(p => p.close(false))
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => initialize(), { once: true });
  else initialize();
})();
