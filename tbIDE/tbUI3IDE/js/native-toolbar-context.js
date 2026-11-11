/* Native producers are re-evaluated in their own JavaScript realm with only
 * showContextMenu shadowed. This captures their live descriptors, including
 * asynchronous callbacks, without swapping the IDE's global menu function.
 * A private closure/bound-function incompatibility leaves the native parent
 * command available as a fallback rather than dropping its options. */
(function nativeToolbarContext(native) {
    return {
        editorState(){const n=native.selectedEditor();return n?{node:n,kind:n.type==='CodeEditor'?'Code':n.type==='UIDesigner'?'Form':null}:null;},
        captureMenu(item,anchor,done,kind){
            const producer=kind==='Insert'?native.addComponent:item.hoverAction;
            if(typeof producer!=='function')return false;
            try{
                const isolated=producer.constructor('showContextMenu','return ('+producer.toString()+');')(
                    (target,x,y,items)=>done(items||[]));
                isolated(kind==='Insert'?{clientX:0,clientY:0}:anchor);return true;
            }catch(e){return false;}
        }
    };
})
