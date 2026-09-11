const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function filterCommands(commands, query) {
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  return commands.filter(command => words.every(word =>
    normalize(`${command.label} ${command.category || ''} ${command.keywords || ''}`).includes(word)));
}

export function mountWorkspaceAssistant({ getCommands, onOpen = () => {} }) {
  const launcher = document.createElement('button');
  launcher.id = 'workspaceSearchBtn';
  launcher.className = 'workspace-search-launcher';
  launcher.title = 'Find an orb or action (Ctrl / Cmd + K)';
  launcher.textContent = 'Search';
  launcher.dataset.dynamicLabel = 'true';
  document.getElementById('app-menu-bar')?.append(launcher);

  const dialog = document.createElement('dialog');
  dialog.id = 'workspaceCommandPalette';
  dialog.className = 'workspace-command-palette';
  dialog.setAttribute('aria-label', 'Find an orb or action');
  dialog.innerHTML = `<div class="workspace-search-heading"><label for="workspaceCommandInput">Find an orb or action</label><button type="button" aria-label="Close search">Esc</button></div>
    <input id="workspaceCommandInput" type="search" placeholder="Try Tonnetz, piano, tape…" autocomplete="off" spellcheck="false" role="combobox" aria-autocomplete="list" aria-expanded="true" aria-controls="workspaceCommandResults">
    <div id="workspaceCommandResults" role="listbox" aria-label="Matching actions"></div>
    <p class="workspace-search-footer">↑ ↓ navigate · Enter choose · Esc close <span>Ctrl / Cmd + K</span></p>`;
  document.body.append(dialog);
  const input = dialog.querySelector('input');
  const results = dialog.querySelector('[role="listbox"]');
  let commands = [], matches = [], active = 0, previousFocus;

  function close() {
    dialog.close();
    if (previousFocus?.isConnected && !dialog.contains(previousFocus)) previousFocus.focus({ preventScroll: true });
    if (dialog.contains(document.activeElement)) launcher.focus({ preventScroll: true });
  }
  function choose(index) {
    const command = matches[index];
    if (!command) return;
    close();
    command.run();
  }
  function highlight() {
    if (!matches.length) { input.removeAttribute('aria-activedescendant'); return; }
    [...results.children].forEach((row, index) => row.setAttribute('aria-selected', String(index === active)));
    const row = results.children[active];
    if (row) {
      input.setAttribute('aria-activedescendant', row.id);
      row.scrollIntoView?.({ block: 'nearest' });
    } else input.removeAttribute('aria-activedescendant');
  }
  function render() {
    matches = filterCommands(commands, input.value);
    active = 0;
    results.replaceChildren();
    for (const [index, command] of matches.entries()) {
      const row = document.createElement('div');
      row.id = `workspace-command-${index}`;
      row.className = 'workspace-command-row';
      row.setAttribute('role', 'option');
      const label = document.createElement('span');
      label.textContent = command.label;
      const category = document.createElement('small');
      category.textContent = command.category || 'Action';
      row.append(label, category);
      row.addEventListener('click', () => choose(index));
      results.append(row);
    }
    if (!matches.length) {
      const empty = document.createElement('p');
      empty.className = 'workspace-search-empty';
      empty.textContent = 'No matches. Try an instrument, sequencer or tool name.';
      results.append(empty);
    }
    if (matches.length) highlight();
    else input.removeAttribute('aria-activedescendant');
  }
  function open() {
    if (dialog.open) return;
    previousFocus = document.activeElement;
    onOpen();
    commands = getCommands();
    input.value = '';
    render();
    dialog.showModal();
    input.focus();
  }
  launcher.addEventListener('click', open);
  input.addEventListener('input', render);
  dialog.querySelector('button').addEventListener('click', close);
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
  });
  window.addEventListener('keydown', event => {
    if (event.isComposing) return;
    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k') {
      event.preventDefault(); event.stopImmediatePropagation();
      if (!event.repeat) dialog.open ? close() : open();
      return;
    }
    if (!dialog.open) return;
    event.stopImmediatePropagation();
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    else if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      if (matches.length) active = (active + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length;
      highlight();
    } else if (event.key === 'Enter' && event.target === input) {
      event.preventDefault(); choose(active);
    }
  }, true);

  return { open };
}

// Mount after rendering a menu, so filtering never observes or rewrites live controls.
export function addMenuSearch(container) {
  const buttons = [...container.querySelectorAll('.type-button, .waveform-button, .drum-element-button')];
  if (buttons.length < 6 || container.querySelector('.menu-search')) return;
  const input = document.createElement('input');
  input.type = 'search';
  input.className = 'menu-search';
  input.placeholder = `Filter ${buttons.length} options…`;
  input.setAttribute('aria-label', 'Filter available options');
  const empty = document.createElement('p');
  empty.className = 'menu-search-empty';
  empty.textContent = 'No matching options';
  empty.hidden = true;
  const filter = () => {
    const words = normalize(input.value).trim().split(/\s+/);
    for (const button of buttons) button.hidden = !words.every(word => normalize(button.textContent).includes(word));
    for (const grid of container.querySelectorAll('.sampler-grid')) {
      grid.hidden = ![...grid.querySelectorAll('button')].some(button => !button.hidden);
      if (grid.previousElementSibling?.classList.contains('sampler-category-title')) grid.previousElementSibling.hidden = grid.hidden;
    }
    empty.hidden = buttons.some(button => !button.hidden);
  };
  input.addEventListener('input', filter);
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape' && input.value) {
      event.preventDefault(); event.stopPropagation(); input.value = ''; filter();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      buttons.find(button => !button.hidden && !button.disabled)?.click();
    }
  });
  container.prepend(input);
  container.append(empty);
}
