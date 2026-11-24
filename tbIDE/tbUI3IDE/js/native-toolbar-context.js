/* Native producers are re-evaluated in their own JavaScript realm with only
 * showContextMenu (and BETA 1045's showContextMenuNew) shadowed. This captures their live descriptors, including
 * asynchronous callbacks, without swapping the IDE's global menu function.
 * A private closure/bound-function incompatibility leaves the native parent
 * command available as a fallback rather than dropping its options. */
(function nativeToolbarContext(native) {
    function editable(){
        const n=native.selectedEditor();
        return n&&['CodeEditor','UIDesigner'].includes(n.type)&&n.fileNode&&!n.fileNode.readOnly&&typeof n.fileHandler?.save==='function'?n:null;
    }
    function canSaveDocument(){
        try{
            const n=editable();
            return !!(n&&native.projectLoaded?.()&&typeof native.saveEditor==='function'&&
                (native.projectPath?.()||typeof native.saveProjectAs==='function')&&native.isDirtyEditor?.(n));
        }catch(e){return false;}
    }
    function saveDocument(){
        if(!canSaveDocument())return;
        const n=editable();
        // Capture the clicked document. A later Save As callback must not save whichever
        // tab became selected meanwhile, or a document closed while the dialog was open.
        const save=()=>{if(n.fileNode.openEditorNode===n&&native.isDirtyEditor(n))native.saveEditor(n);};
        if(native.projectPath?.())save();else native.saveProjectAs(save);
    }
    function canSwitchFormCode(){
        try{
            const n=native.selectedEditor(),path=n?.fileNode?.getFullPath?.();
            if(!path||typeof native.findFile!=='function')return false;
            if(n.type==='CodeEditor'&&n.fileHandler===native.formCodeHandler?.()){
                let target=path,previous='.twin';
                for(const ext of ['.tbform','.tbcontrol','.tbppage','.tbreport']){
                    target=target.replace(previous,ext);previous=ext;
                    if(target!==path&&native.findFile('twinbasic:'+target))return true;
                }
            }else if(n.type==='UIDesigner'&&n.fileHandler===native.formDesignerHandler?.()){
                const target=path.replace('.tbform','.twin').replace('.tbcontrol','.twin').replace('.tbppage','.twin').replace('.tbreport','.twin');
                return target!==path&&!!native.findFile('twinbasic:'+target);
            }
        }catch(e){}
        return false;
    }
    return {
        canSaveDocument,saveDocument,canSwitchFormCode,
        editorState(){const n=native.selectedEditor();return n?{node:n,kind:n.type==='CodeEditor'?'Code':n.type==='UIDesigner'?'Form':null}:null;},
        captureMenu(item,anchor,done,kind){
            const producer=kind==='Insert'?native.addComponent:item.hoverAction;
            if(typeof producer!=='function')return false;
            try{
                // BETA 1045 producers call showContextMenuNew(menuId, ...) instead; shadow both.
                // Add-in entries that 1045 merges into native menus are not captured here.
                const capture=(target,x,y,items)=>done(items||[]);
                const isolated=producer.constructor('showContextMenu','showContextMenuNew','return ('+producer.toString()+');')(
                    capture,(menuId,...rest)=>capture(...rest));
                isolated(kind==='Insert'?{clientX:0,clientY:0}:anchor);return true;
            }catch(e){return false;}
        }
    };
})
