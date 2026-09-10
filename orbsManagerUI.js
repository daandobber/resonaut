// Orbs Manager: lists every orb on the canvas (no connections) and lets the
// user replace, delete, group, or sidechain-link them. Talks to main.js only
// through the `api` bundle passed into mountOrbsManager, mirroring the
// callback-injection pattern used by tapeStudioUI.js / symphioseUI.js.

export function mountOrbsManager(panel, content, api) {
  let expandedSidechainId = null;
  let searchQuery = "";

  function render() {
    const nodes = api.getNodes();
    const groups = api.getGroups();
    content.innerHTML = "";

    const toolbar = document.createElement("div");
    toolbar.className = "orbs-mgr-toolbar";

    const search = document.createElement("input");
    search.type = "search";
    search.placeholder = "Zoek orbs...";
    search.className = "orbs-mgr-search";
    search.value = searchQuery;
    toolbar.appendChild(search);

    const groupBtn = document.createElement("button");
    groupBtn.className = "orbs-mgr-btn";
    groupBtn.textContent = "Groepeer selectie";
    groupBtn.disabled = true;
    toolbar.appendChild(groupBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "orbs-mgr-btn orbs-mgr-btn-danger";
    deleteBtn.textContent = "Verwijder selectie";
    deleteBtn.disabled = true;
    toolbar.appendChild(deleteBtn);

    content.appendChild(toolbar);

    const list = document.createElement("div");
    list.className = "orbs-mgr-list";
    content.appendChild(list);

    const selected = new Set();
    const updateToolbarState = () => {
      groupBtn.disabled = selected.size < 2;
      deleteBtn.disabled = selected.size === 0;
    };

    groupBtn.addEventListener("click", () => {
      api.groupNodes(Array.from(selected));
      render();
    });
    deleteBtn.addEventListener("click", () => {
      api.deleteNodes(Array.from(selected));
      render();
    });
    search.addEventListener("input", () => {
      searchQuery = search.value;
      applyFilter();
    });

    const nodeIdToGroup = new Map();
    groups.forEach((g) => g.nodeIds.forEach((id) => nodeIdToGroup.set(id, g)));
    const ungrouped = nodes.filter((n) => !nodeIdToGroup.has(n.id));

    function buildRow(node) {
      const row = document.createElement("div");
      row.className = "orb-row";
      const label = api.getLabel(node);
      row.dataset.search = `${label} ${node.type}`.toLowerCase();

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "orb-row-select";
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) selected.add(node.id);
        else selected.delete(node.id);
        updateToolbarState();
      });
      row.appendChild(checkbox);

      const swatch = document.createElement("span");
      swatch.className = "orb-row-swatch";
      swatch.style.background = api.getColor(node);
      row.appendChild(swatch);

      const labelEl = document.createElement("span");
      labelEl.className = "orb-row-label";
      labelEl.textContent = label;
      labelEl.title = label;
      row.appendChild(labelEl);

      const typeEl = document.createElement("span");
      typeEl.className = "orb-row-type";
      typeEl.textContent = node.type;
      row.appendChild(typeEl);

      const actions = document.createElement("div");
      actions.className = "orb-row-actions";

      const replaceOptions = api.getReplaceOptions(node);
      if (replaceOptions) {
        const select = document.createElement("select");
        select.className = "orb-row-replace";
        const placeholder = document.createElement("option");
        placeholder.textContent = "Vervang...";
        placeholder.value = "";
        select.appendChild(placeholder);
        replaceOptions.options.forEach((opt) => {
          const o = document.createElement("option");
          o.value = opt.type;
          o.textContent = opt.label;
          select.appendChild(o);
        });
        select.addEventListener("click", (e) => e.stopPropagation());
        select.addEventListener("change", () => {
          if (!select.value) return;
          api.replaceNode(node.id, select.value, replaceOptions.contentType);
          render();
        });
        actions.appendChild(select);
      }

      const link = api.getSidechainLink(node.id);
      const scBtn = document.createElement("button");
      scBtn.className = "orb-row-sc-btn";
      scBtn.title = "Sidechain";
      scBtn.textContent = link ? "\u{1F517}" : "\u{1F517}…";
      scBtn.classList.toggle("active", !!link);
      scBtn.addEventListener("click", () => {
        expandedSidechainId = expandedSidechainId === node.id ? null : node.id;
        render();
      });
      actions.appendChild(scBtn);

      const delBtn = document.createElement("button");
      delBtn.className = "orb-row-delete-btn";
      delBtn.title = "Verwijderen";
      delBtn.textContent = "\u{1F5D1}";
      delBtn.addEventListener("click", () => {
        api.deleteNodes([node.id]);
        render();
      });
      actions.appendChild(delBtn);

      row.appendChild(actions);
      list.appendChild(row);

      if (expandedSidechainId === node.id) {
        list.appendChild(buildSidechainPanel(node, link));
      }
    }

    function buildSidechainPanel(node, link) {
      const scPanel = document.createElement("div");
      scPanel.className = "orb-row-sc-panel";

      const triggerSelect = document.createElement("select");
      const none = document.createElement("option");
      none.value = "";
      none.textContent = "Geen (uit)";
      triggerSelect.appendChild(none);
      nodes
        .filter((n) => n.id !== node.id)
        .forEach((n) => {
          const o = document.createElement("option");
          o.value = String(n.id);
          o.textContent = api.getLabel(n);
          if (link && link.triggerId === n.id) o.selected = true;
          triggerSelect.appendChild(o);
        });
      scPanel.appendChild(triggerSelect);

      const amountSlider = document.createElement("input");
      amountSlider.type = "range";
      amountSlider.min = "0";
      amountSlider.max = "1";
      amountSlider.step = "0.01";
      amountSlider.value = String(link?.amount ?? 0.6);
      amountSlider.disabled = !link;
      scPanel.appendChild(amountSlider);

      const amountLabel = document.createElement("span");
      amountLabel.textContent = Math.round((link?.amount ?? 0.6) * 100) + "%";
      scPanel.appendChild(amountLabel);

      amountSlider.addEventListener("input", () => {
        amountLabel.textContent = Math.round(parseFloat(amountSlider.value) * 100) + "%";
      });

      const applyLink = () => {
        const triggerId = triggerSelect.value ? Number(triggerSelect.value) : null;
        api.setSidechainLink(node.id, triggerId, parseFloat(amountSlider.value));
        render();
      };
      triggerSelect.addEventListener("change", applyLink);
      amountSlider.addEventListener("change", applyLink);

      return scPanel;
    }

    function buildGroupSection(group) {
      const header = document.createElement("div");
      header.className = "orbs-mgr-group-header";
      const title = document.createElement("span");
      title.textContent = `\u{1F4E6} ${group.label} (${group.nodeIds.size})`;
      header.appendChild(title);
      const ungroupBtn = document.createElement("button");
      ungroupBtn.className = "orbs-mgr-btn";
      ungroupBtn.textContent = "Ontgroeperen";
      ungroupBtn.addEventListener("click", () => {
        api.dissolveGroup(group.id);
        render();
      });
      header.appendChild(ungroupBtn);
      list.appendChild(header);
      nodes.filter((n) => group.nodeIds.has(n.id)).forEach(buildRow);
    }

    groups.forEach(buildGroupSection);
    if (ungrouped.length) {
      if (groups.length) {
        const header = document.createElement("div");
        header.className = "orbs-mgr-group-header orbs-mgr-group-header-plain";
        header.textContent = "Losse orbs";
        list.appendChild(header);
      }
      ungrouped.forEach(buildRow);
    }

    if (!nodes.length) {
      const empty = document.createElement("div");
      empty.className = "orbs-mgr-empty";
      empty.textContent = "Nog geen orbs op het canvas.";
      list.appendChild(empty);
    }

    function applyFilter() {
      const q = searchQuery.trim().toLowerCase();
      list.querySelectorAll(".orb-row").forEach((row) => {
        row.hidden = !(!q || row.dataset.search.includes(q));
      });
    }
    applyFilter();
  }

  return { refresh: render };
}
