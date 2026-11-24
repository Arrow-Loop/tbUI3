(function () {
  'use strict';
  const port = window.chrome?.webview;
  const names = {ide:'twinBASIC IDE', addin:'tbUI3IDE add-in', themes:'WinUI3 themes', library:'Icon and resource library', updater:'Updater.exe', controlPackage:'Control package download', 'ide-baseline':'Previous official IDE baseline'};
  const titles = {idle:'Updates', settings:'Update settings', checked:'Release check complete', checking:'Checking releases', arming:'Preparing to update', staging:'Staging selected updates', ready:'Verified and ready', waiting:'Waiting for twinBASIC', elevationRequired:'Administrator approval required', installing:'Installing updates', rollingBack:'Restoring your installation', error:'The update needs attention', complete:'Update complete', rolledBack:'Backup restored', cancelled:'Update cancelled'};
  let state = {status:'idle', message:'Open this updater from twinBASIC to check an installation.'};
  let running = false, canRecover = false, toast = false, settings = null, settingsError = '', root = '', connected = false, submitted = false;
  let catalog;
  const byId = id => document.getElementById(id);
  const text = (id, value) => { byId(id).textContent = value || ''; };
  const send = message => port?.postMessage(message);
  const intent = (action, fields) => send(JSON.stringify({action, ...fields}));
  const show = (id, visible, enabled = true) => {
    const element = byId(id);
    element.hidden = !visible;
    WinUIControls.setEnabled(element, enabled);
  };
  const selection = () => Array.from(byId('components').querySelectorAll('input:checked:not(:disabled)'), input => input.value);
  const installed = value => !value || value === '0' ? 'Not installed / unversioned' : value;
  function renderCatalog(next) {
    if (next === catalog) return;
    catalog = next;
    const components = byId('components'), sources = byId('sources');
    components.replaceChildren();
    sources.replaceChildren();
    for (const item of next?.components || []) {
      const row = document.createElement('section');
      row.className = 'updater-component';
      const label = document.createElement('label');
      label.className = 'choice';
      const input = document.createElement('input');
      input.type = 'checkbox'; input.value = item.id;
      input.disabled = !item.available; input.checked = !!item.available;
      input.addEventListener('change', render);
      label.append(input, names[item.id] || item.id);
      const meta = document.createElement('p');
      meta.className = 'text-muted';
      meta.textContent = 'Installed ' + installed(item.installed) + ' · Available ' + item.version;
      row.append(label, meta);
      const notes = [
        item.architectures && ('Win32 ' + installed(item.architectures.win32) + ' · Win64 ' + installed(item.architectures.win64)),
        item.minIdeBuild && ('Supports IDE builds ' + item.minIdeBuild + ' through ' + item.maxIdeBuild),
        item.summary
      ].filter(Boolean);
      for (const note of notes) {
        const detail = document.createElement('p');
        detail.className = 'text-muted'; detail.textContent = note; row.append(detail);
      }
      components.append(row);
    }
    for (const error of next?.errors || []) {
      const item = document.createElement('li');
      item.textContent = error; sources.append(item);
    }
    sources.hidden = !sources.childElementCount;
  }
  function bytes(value) {
    if (value < 1024) return Math.round(value) + ' B';
    if (value < 1048576) return (value / 1024).toFixed(1) + ' KiB';
    return (value / 1048576).toFixed(1) + ' MiB';
  }
  function render() {
    const status = byId('status'), failed = state.status === 'error';
    const complete = state.status === 'complete', restored = state.status === 'rolledBack';
    const review = state.status === 'checked', available = catalog?.components.some(item => item.available);
    const configuring = ['checked','settings'].includes(state.status) || Boolean(settingsError);
    const active = running || submitted;
    status.setAttribute('title', toast ? 'Updates are available' : (titles[state.status] || 'Updates'));
    status.setAttribute('severity', failed ? 'error' : complete || restored ? 'success' : 'informational');
    status.setAttribute('message', toast ? 'Review available versions for twinBASIC and tbUI3.' : review && !available ? (catalog?.errors?.length ? 'No updates found from the sources that responded.' : 'You are up to date.') : (state.message || ''));
    byId('review').hidden = toast || !review;
    byId('preferences').hidden = toast || !configuring || active;
    byId('automatic').disabled = byId('restart').disabled = !settings;
    if (settings) {
      byId('automatic').checked = settings.automatic;
      byId('restart').checked = settings.restart;
    }
    byId('preferences-error').hidden = !settingsError;
    text('preferences-reason', settingsError);
    show('reset', !!settingsError, byId('reset-approval').checked);
    text('scope', root);
    byId('progress-panel').hidden = toast || !active;
    const total = Number(state.total) || 0, completed = Number(state.completed) || 0;
    const progress = WinUIControls.getProgressBar(byId('progress'));
    progress.setIndeterminate(active && !total);
    progress.setValue(total ? 100 * Math.min(completed, total) / total : complete ? 100 : 0);
    progress.setError(failed);
    const details = [];
    if (state.unit === 'bytes') {
      details.push(bytes(completed) + (total ? ' of ' + bytes(total) + ' (' + Math.floor(100 * completed / total) + '%)' : ''));
      if (state.bytesPerSecond > 0) details.push(bytes(state.bytesPerSecond) + '/s');
      if (state.etaSeconds > 0) details.push('About ' + Math.ceil(state.etaSeconds) + ' s left');
    } else if (total) {
      details.push(completed + ' of ' + total + ' files');
    }
    text('progress-heading', names[state.component] || 'Progress');
    text('progress-value', details.join(' · '));
    text('message', state.message);
    text('operation-detail', state.item);
    show('review-updates', toast);
    show('check', !toast && connected && configuring, !active && !settingsError);
    show('later', toast || review && available, !active && !settingsError);
    const selectable = !toast && review && available;
    show('now', selectable, !active && selection().length > 0 && !canRecover && !settingsError);
    show('exit', selectable, !active && selection().length > 0 && !canRecover && !settingsError);
    show('retry', !toast && failed && connected && !settingsError, !active);
    show('elevate', state.status === 'elevationRequired', !active);
    show('recover', !toast && canRecover && !restored && !complete, !active);
    show('cancel', active && ['arming','ready','waiting','staging'].includes(state.status));
    show('close', true, !active);
    WinUIControls.initialize(status);
  }
  function receive(event) {
    let msg = event.data;
    if (typeof msg === 'string') { try { msg = JSON.parse(msg); } catch { return; } }
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'preferences') {
      connected = true; toast = msg.toast; settings = msg.settings || null; settingsError = msg.settingsError || '';
      root = msg.root; canRecover = msg.recovery;
      text('version', 'tbUI3 Updater ' + msg.version);
    } else if (msg.type === 'hostError') {
      toast = false; submitted = false;
      state = {status:'error', message:String(msg.message || 'The updater could not complete this request.')};
    } else if (msg.type === 'updateState' && msg.state && typeof msg.state.status === 'string') {
      submitted = false; state = msg.state; running = msg.running; canRecover = msg.canRecover;
      if (state.catalog) renderCatalog(state.catalog);
      if (!running && msg.exitCode && !['error','complete','rolledBack','cancelled'].includes(state.status)) {
        state = {status:'error', message:'The updater worker ended unexpectedly. See the updater engine log in tbUI3 Diagnostics.'};
      }
    } else return;
    render();
  }
  function submit(choice) {
    const selected = selection();
    if (!selected.length || running || submitted || toast) return;
    submitted = true;
    const restart = byId('restart').checked;
    state = {status:'arming', message:'Connecting to the originating twinBASIC session...'};
    render();
    intent('select', {choice, selected, restart});
  }
  function start() {
    WinUIControls.initialize(document);
    port?.addEventListener('message', receive);
    for (const id of ['check','later','elevate','retry','recover','cancel','close']) {
      byId(id).addEventListener('click', () => send('updater:' + id));
    }
    byId('review-updates').addEventListener('click', () => send('updater:review'));
    byId('now').addEventListener('click', () => submit('now'));
    byId('exit').addEventListener('click', () => submit('exit'));
    for (const id of ['automatic','restart']) {
      byId(id).addEventListener('change', event => intent(id, {enabled:event.currentTarget.checked}));
    }
    byId('reset-approval').addEventListener('change', render);
    byId('reset').addEventListener('click', () => intent('reset', {confirmed:byId('reset-approval').checked}));
    render(); requestHostTheme(); send('updater:ready');
    window.setInterval(() => send('updater:poll'), 350);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
