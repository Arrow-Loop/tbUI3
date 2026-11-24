(function () {
  if (window.__tbUI3Shutdown) return 'shutdown bridge ready';
  const original = closeProjectSafely;
  const originalClose = closeProjectNow;
  const originalDialog = showModalDialog;
  let armed = '', attempt, result, continuation;

  function start(callback) {
    if (!armed) return original(callback);
    if (attempt || continuation) return;
    const request = armed;
    const accepted = () => callback();
    attempt = { request, accepted };
    function cancel() {
      if (attempt?.accepted !== accepted) return;
      attempt = undefined;
      result = { request, status: 'cancelled' };
    }
    // Supported IDE builds open the initial save/discard/cancel prompt synchronously.
    // Preserve the native handlers, including the default Escape action.
    showModalDialog = function (content, buttons, ...args) {
      const wrapped = Array.isArray(buttons) ? buttons.map(button => {
        if (!button.isDefaultCancelAction || typeof button.onclick !== 'function') return button;
        return { ...button, onclick(...params) { try { return button.onclick.apply(this, params); } finally { cancel(); } } };
      }) : buttons;
      return originalDialog.call(this, content, wrapped, ...args);
    };
    try {
      return original(accepted);
    } catch (error) {
      cancel();
      throw error;
    } finally {
      showModalDialog = originalDialog;
    }
  }

  function beforeCompilerShutdown(callback) {
    if (callback !== attempt?.accepted) return originalClose(callback);
    const { request } = attempt;
    attempt = undefined;
    if (armed !== request) return originalClose(callback);
    // The native Save/Discard path has accepted closure. The compiler hosting
    // the add-in can disappear as soon as closeProjectNow runs.
    continuation = () => originalClose(callback);
    result = { request, status: 'shutdown' };
  }

  function hook(callback) {
    const isExit = typeof callback === 'function' && /^\s*\(\s*\)\s*=>\s*\{\s*hostAppObject\.Exit\(\s*['"]ignore['"]\s*\)\s*;?\s*\}\s*$/.test(String(callback));
    return isExit ? start(callback) : original(callback);
  }
  closeProjectSafely = hook;
  closeProjectNow = beforeCompilerShutdown;
  window.__tbUI3Shutdown = {
    arm(request) { armed = request; return 'armed'; },
    request(request) {
      if (armed === request) {
        if (typeof HostForceFocus === 'function') HostForceFocus();
        start(() => { hostAppObject.Exit('ignore'); });
      }
      return 'requested';
    },
    take() { const next = result; result = undefined; return next ? JSON.stringify(next) : ''; },
    resume() {
      const next = continuation;
      continuation = undefined;
      attempt = undefined;
      armed = '';
      if (next) next();
      return 'resumed';
    },
    disarm() { armed = ''; if (continuation) this.resume(); return 'disarmed'; },
    dispose() {
      this.disarm();
      if (closeProjectSafely === hook) closeProjectSafely = original;
      if (closeProjectNow === beforeCompilerShutdown) closeProjectNow = originalClose;
    }
  };
  return 'shutdown bridge ready';
})()
