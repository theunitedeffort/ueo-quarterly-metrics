import {
  FILE_SPEC_LIST,
  buildMetricsTable,
  formatTableValue,
  parseCsv,
  tableToClipboardText,
  validateDataset
} from './metrics.js';

const state = {
  datasets: {},
  files: {},
  validations: {},
  table: null
};

const elements = {
  fileGrid: document.querySelector('#file-grid'),
  fileTemplate: document.querySelector('#file-card-template'),
  yearInput: document.querySelector('#year-input'),
  startMonthSelect: document.querySelector('#start-month-select'),
  endMonthSelect: document.querySelector('#end-month-select'),
  metricsTable: document.querySelector('#metrics-table'),
  loadedSummary: document.querySelector('#loaded-summary'),
  tableStatus: document.querySelector('#table-status'),
  copyButton: document.querySelector('#copy-table'),
  warningsList: document.querySelector('#warnings-list')
};

function formatColumnList(columns) {
  if (!columns || columns.length === 0) {
    return 'None';
  }
  return columns.join(', ');
}

function formatColumnGroups(groups) {
  if (!groups || groups.length === 0) {
    return '';
  }
  return groups.map((group) => `One of: ${group.join(' / ')}`).join('\n');
}

function buildTooltipText(fileSpec) {
  const lines = [fileSpec.tooltip];
  if (fileSpec.requiredColumns?.length) {
    lines.push(`Required: ${formatColumnList(fileSpec.requiredColumns)}`);
  }
  const groups = formatColumnGroups(fileSpec.requiredColumnGroups);
  if (groups) {
    lines.push(groups);
  }
  if (fileSpec.optionalColumns?.length) {
    lines.push(`Optional: ${formatColumnList(fileSpec.optionalColumns)}`);
  }
  lines.push(`Used for: ${fileSpec.metricUse}`);
  return lines.join('\n\n');
}

function createFileCard(fileSpec) {
  const fragment = elements.fileTemplate.content.cloneNode(true);
  const card = fragment.querySelector('.file-card');
  const title = fragment.querySelector('h3');
  const exampleName = fragment.querySelector('.example-name');
  const tooltipButton = fragment.querySelector('.tooltip-button');
  const tooltip = fragment.querySelector('.tooltip-panel');
  const input = fragment.querySelector('input');
  const tooltipId = `${fileSpec.id}-tooltip`;

  card.dataset.fileSpec = fileSpec.id;
  title.textContent = fileSpec.label;
  exampleName.textContent = fileSpec.exampleName;
  tooltip.id = tooltipId;
  tooltipButton.setAttribute('aria-describedby', tooltipId);
  tooltip.textContent = buildTooltipText(fileSpec);
  input.dataset.fileSpec = fileSpec.id;
  input.addEventListener('change', () => handleFileChange(fileSpec, input.files?.[0]));

  elements.fileGrid.appendChild(fragment);
}

async function handleFileChange(fileSpec, file) {
  if (!file) {
    delete state.datasets[fileSpec.id];
    delete state.files[fileSpec.id];
    delete state.validations[fileSpec.id];
    updateFileStatus(fileSpec.id, 'Waiting for upload.', 'idle');
    render();
    return;
  }

  try {
    const text = await file.text();
    const rows = parseCsv(text);
    const validation = validateDataset(fileSpec, rows);
    state.datasets[fileSpec.id] = rows;
    state.files[fileSpec.id] = file.name;
    state.validations[fileSpec.id] = validation;
    updateFileStatus(
      fileSpec.id,
      validation.ok
        ? `${rows.length.toLocaleString()} rows loaded from ${file.name}.`
        : `${rows.length.toLocaleString()} rows loaded, column check needs attention.`,
      validation.ok ? 'ok' : 'warning'
    );
  } catch (error) {
    delete state.datasets[fileSpec.id];
    state.files[fileSpec.id] = file.name;
    state.validations[fileSpec.id] = {
      ok: false,
      missingRequired: [],
      missingColumnGroups: [],
      rowCount: 0,
      error: error instanceof Error ? error.message : String(error)
    };
    updateFileStatus(fileSpec.id, `Could not read ${file.name}.`, 'error');
  }

  render();
}

function updateFileStatus(fileSpecId, message, tone) {
  const card = elements.fileGrid.querySelector(`[data-file-spec="${fileSpecId}"]`);
  if (!card) {
    return;
  }
  const status = card.querySelector('.file-status');
  status.textContent = message;
  status.dataset.tone = tone;
}

function getPeriodOptions() {
  return {
    year: Number(elements.yearInput.value),
    startMonth: Number(elements.startMonthSelect.value),
    endMonth: Number(elements.endMonthSelect.value)
  };
}

function renderTable(table) {
  elements.metricsTable.replaceChildren();

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  table.headers.forEach((header) => {
    const th = document.createElement('th');
    th.textContent = header;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  const tbody = document.createElement('tbody');
  table.rows.forEach((row) => {
    const tr = document.createElement('tr');
    const metricName = row[0];
    row.forEach((value, index) => {
      const td = document.createElement('td');
      td.textContent = index === 0 ? value : formatTableValue(metricName, value);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  elements.metricsTable.append(thead, tbody);
}

function renderWarnings() {
  elements.warningsList.replaceChildren();

  Object.entries(state.validations).forEach(([fileSpecId, validation]) => {
    if (validation.ok) {
      return;
    }

    const fileSpec = FILE_SPEC_LIST.find((spec) => spec.id === fileSpecId);
    const fileName = state.files[fileSpecId] ?? fileSpec?.label ?? fileSpecId;
    const messages = [];
    if (validation.error) {
      messages.push(validation.error);
    }
    if (validation.missingRequired?.length) {
      messages.push(`Missing: ${validation.missingRequired.join(', ')}`);
    }
    if (validation.missingColumnGroups?.length) {
      messages.push(
        ...validation.missingColumnGroups.map((group) => `Needs one of: ${group.join(' / ')}`)
      );
    }
    if (messages.length === 0) {
      messages.push('The file could not be validated.');
    }

    const item = document.createElement('li');
    item.textContent = `${fileName}: ${messages.join(' ')}`;
    elements.warningsList.appendChild(item);
  });

  elements.warningsList.parentElement.hidden = elements.warningsList.children.length === 0;
}

function renderSummary() {
  const loadedCount = Object.keys(state.datasets).length;
  const loadedLabel = `${loadedCount} of ${FILE_SPEC_LIST.length} files loaded`;
  elements.loadedSummary.textContent = loadedCount === 0 ? 'No files loaded yet.' : `${loadedLabel}.`;
  elements.tableStatus.textContent = loadedCount === 0
    ? 'Upload CSV files to populate the metrics.'
    : `Showing ${state.table.headers.slice(1).join(', ')}.`;
}

function render() {
  state.table = buildMetricsTable(state.datasets, getPeriodOptions());
  renderTable(state.table);
  renderWarnings();
  renderSummary();
}

async function copyTable() {
  if (!state.table) {
    return;
  }

  const text = tableToClipboardText(state.table);
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }

  elements.copyButton.textContent = 'Copied';
  window.setTimeout(() => {
    elements.copyButton.textContent = 'Copy table';
  }, 1400);
}

FILE_SPEC_LIST.forEach(createFileCard);
elements.yearInput.addEventListener('input', render);
elements.startMonthSelect.addEventListener('change', render);
elements.endMonthSelect.addEventListener('change', render);
elements.copyButton.addEventListener('click', copyTable);
render();
