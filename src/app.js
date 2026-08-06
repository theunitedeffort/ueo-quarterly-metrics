import {
  FILE_SPEC_LIST,
  buildMetricsTable,
  formatTableValue,
  matrixToRecords,
  parseCsv,
  tableToClipboardHtml,
  tableToClipboardText,
  validateDataset
} from './metrics.js';

const SHEETJS_URL = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs';
let sheetJsPromise = null;

function loadSheetJs() {
  sheetJsPromise ??= import(SHEETJS_URL);
  return sheetJsPromise;
}

async function parseXlsxFile(file, fileSpec) {
  const XLSX = await loadSheetJs();
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const sheetNames = workbook.SheetNames ?? [];
  if (sheetNames.length === 0) {
    throw new Error('The workbook has no sheets.');
  }

  const sheetMatrix = (name) =>
    XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, raw: true, defval: '' });

  const monthly = sheetNames.find((name) => name.trim().toLowerCase() === 'monthly');
  if (monthly) {
    return matrixToRecords(sheetMatrix(monthly));
  }

  const required = (fileSpec.requiredColumns ?? []).map((column) => column.trim().toLowerCase());
  for (const name of sheetNames) {
    const records = matrixToRecords(sheetMatrix(name));
    const headers = new Set(Object.keys(records[0] ?? {}).map((key) => key.trim().toLowerCase()));
    if (records.length > 0 && required.every((column) => headers.has(column))) {
      return records;
    }
  }

  return matrixToRecords(sheetMatrix(sheetNames[0]));
}

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
  input.accept = fileSpec.accept ?? '.csv,text/csv';
  input.dataset.fileSpec = fileSpec.id;
  input.addEventListener('change', () => handleFileChange(fileSpec, input.files?.[0]));

  elements.fileGrid.appendChild(fragment);
}

async function handleFileChange(fileSpec, file) {
  if (!file) {
    delete state.datasets[fileSpec.id];
    delete state.files[fileSpec.id];
    delete state.validations[fileSpec.id];
    updateFileStatus(fileSpec.id, 'Select a file.', 'idle');
    render();
    return;
  }

  try {
    const rows = /\.xlsx$/i.test(file.name)
      ? await parseXlsxFile(file, fileSpec)
      : parseCsv(await file.text());
    const validation = validateDataset(fileSpec, rows);
    state.datasets[fileSpec.id] = rows;
    state.files[fileSpec.id] = file.name;
    state.validations[fileSpec.id] = validation;
    updateFileStatus(
      fileSpec.id,
      validation.ok
        ? `The app loaded ${rows.length.toLocaleString()} rows from ${file.name}.`
        : `The app loaded ${rows.length.toLocaleString()} rows. The file does not have all required columns.`,
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
    updateFileStatus(fileSpec.id, `The app cannot read ${file.name}.`, 'error');
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
      messages.push(`Missing columns: ${validation.missingRequired.join(', ')}`);
    }
    if (validation.missingColumnGroups?.length) {
      messages.push(
        ...validation.missingColumnGroups.map((group) => `Required column: one of ${group.join(' / ')}`)
      );
    }
    if (messages.length === 0) {
      messages.push('The app cannot validate this file.');
    }

    const item = document.createElement('li');
    item.textContent = `${fileName}: ${messages.join(' ')}`;
    elements.warningsList.appendChild(item);
  });

  elements.warningsList.parentElement.hidden = elements.warningsList.children.length === 0;
}

function renderSummary() {
  const loadedCount = Object.keys(state.datasets).length;
  const loadedLabel = `The app loaded ${loadedCount} of ${FILE_SPEC_LIST.length} files`;
  elements.loadedSummary.textContent = loadedCount === 0 ? 'No files loaded.' : `${loadedLabel}.`;
  elements.tableStatus.textContent = loadedCount === 0
    ? 'Upload the files to calculate the metrics.'
    : `The table shows ${state.table.headers.slice(1).join(', ')}.`;
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
  const html = tableToClipboardHtml(state.table);
  try {
    if (!navigator.clipboard?.write || !window.ClipboardItem) {
      throw new Error('Rich clipboard is not supported.');
    }
    const clipboardItem = new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([text], { type: 'text/plain' })
    });
    await navigator.clipboard.write([clipboardItem]);
  } catch {
    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    const range = document.createRange();
    range.selectNode(container);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand('copy');
    selection.removeAllRanges();
    container.remove();
  }

  elements.copyButton.textContent = 'Copied';
  window.setTimeout(() => {
    elements.copyButton.textContent = 'Copy table';
  }, 1400);
}

FILE_SPEC_LIST.forEach(createFileCard);
let yearRenderTimer = null;
elements.yearInput.addEventListener('input', () => {
  window.clearTimeout(yearRenderTimer);
  yearRenderTimer = window.setTimeout(render, 150);
});
elements.startMonthSelect.addEventListener('change', render);
elements.endMonthSelect.addEventListener('change', render);
elements.copyButton.addEventListener('click', copyTable);
render();
