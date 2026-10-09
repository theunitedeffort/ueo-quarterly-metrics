const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

// Table rows, in display order.
const METRIC_NAMES = {
  newClients: 'New clients we entered in Apricot',
  engagementLetters: 'New clients who signed engagement letters',
  activeClients: 'Active clients (Total)',
  semiActiveClients: 'Semi-active clients',
  uniqueClientsServed: '# of unique clients served',
  benefitServicesProvided: 'Benefit applications submitted and services provided',
  affordableHousingApplications: 'Affordable Housing applications',
  housingApplicationsApricot: 'Housing applications - Data from Apricot',
  housingRetention: 'Housing retention',
  clientsHoused: 'Housed: Clients we helped got housing',
  employmentSupport: 'Employment support',
  employedClients: 'Got hired',
  sspActiveClients: 'Clients active in Self-Sufficiency Program',
  activeVolunteers: 'Active volunteers',
  volunteerHours: 'Volunteer hours (onsite only)'
};

const HOUSING_APPLICATION_PROGRAMS = [
  'Housing Solution - PSH',
  'Housing Solution - RRH',
  'Housing Solution - HUD VASH',
  'Housing Solution - Section 8 interest list',
  'Housing Solution - Housing Choice Voucher',
  'Housing Solution - Search',
  'Housing Solution - Home Sharing'
];

const HOUSING_RETENTION_PROGRAMS = [
  'Housing Solutions - Deposit & first month rent',
  'Housing Solution - Housing Recertification',
  'Housing Solution - Housing Retention',
  'Homelessness Prevention'
];

const HOUSED_VALUE_COLUMNS = [
  'PSH',
  'HCV',
  'VASH',
  'RRH',
  'Home Sharing',
  'Affordable Apt',
  'Section 8 Interest List',
  'Commercial Rate'
];

export const FILE_SPECS = {
  clients: {
    id: 'clients',
    label: 'Clients Information',
    exampleName: 'Clients_Information.csv',
    requiredColumns: [
      'Creation Date',
      'Client Status',
      'Client Engagement Letter'
    ],
    optionalColumns: ['Record ID', 'First', 'Last'],
    tooltip:
      'The file has one row for each Apricot client. Creation Date contains a date and time, such as 01/31/2026 9:58 AM. Client Status contains values such as Active or Semi Active. Client Engagement Letter contains Yes for each signed client.',
    metricUse:
      'New clients, signed engagement letters, active clients, and semi-active clients.'
  },
  programs: {
    id: 'programs',
    label: 'Clients & Programs',
    exampleName: 'Clients_&_Programs.csv',
    requiredColumns: ['Program Enrolled', 'Start Date'],
    optionalColumns: ['Program Status', 'Client Manager', 'Record ID'],
    tooltip:
      'The file has one row for each program enrollment. Start Date contains a date, such as 01/31/2026. The app compares Program Enrolled with housing program names and benefit or service program names.',
    metricUse: 'Housing support and benefits or services provided.'
  },
  viSpdatReport: {
    id: 'viSpdatReport',
    label: 'VI-SPDAT Report (.csv or .xlsx)',
    exampleName: 'VI-SPDAT Report.csv',
    accept: '.xlsx,.csv',
    multiple: true,
    requiredColumns: ['Date'],
    optionalColumns: [
      'Client Full Name',
      'Unique ID',
      'Assessment Name',
      'Assessment Score',
      'Assessing Agency',
      'Assessing Program'
    ],
    tooltip:
      'The file has one row for each VI-SPDAT assessment. Multiple CSV or XLSX files can be uploaded and will be combined. For XLSX files, the app reads the Monthly sheet. Date determines the report period. If Assessment Name exists, the app counts only rows that contain SPDAT. This file replaces the VI-SPDAT count from Clients & Programs.',
    metricUse: 'VI-SPDAT and Benefit applications submitted and services provided.'
  },
  housed: {
    id: 'housed',
    label: 'Housed',
    exampleName: 'Housed.csv',
    requiredColumns: ['Name', 'Date Housed'],
    optionalColumns: HOUSED_VALUE_COLUMNS,
    tooltip:
      'The file has one row for each housed client. The app ignores rows without Name. Date Housed determines the report period. The app adds the housing column values for each housed client.',
    metricUse: 'Clients housed.'
  },
  volunteers: {
    id: 'volunteers',
    label: 'Event Attendance Volunteers',
    exampleName: 'event_volunteers.csv',
    requiredColumns: ['Event Date', 'Volunteer ID'],
    optionalColumns: [
      'Shift Hours',
      'Intended Arrival Time',
      'Intended Departure Time',
      'Test Data'
    ],
    tooltip:
      'The file has one row for each volunteer attendance record. Event Date contains a date. Volunteer ID uses the same value for a volunteer in all months. If Shift Hours exists, the app uses it. Otherwise, the app uses Intended Arrival Time and Intended Departure Time.',
    metricUse: 'Active onsite volunteers and onsite volunteer hours.'
  },
  bridgeAssessments: {
    id: 'bridgeAssessments',
    label: 'Bridge Assessments',
    exampleName: 'bridge_assessments.csv',
    requiredColumns: [],
    requiredColumnGroups: [
      ['Assessment Time', 'Latest Bridge Assessment Time', 'Earliest Bridge Assessment Time'],
      ['Client Record ID', 'Client', 'This Record ID']
    ],
    optionalColumns: ['Full Name', 'Latest SSP Activity Time', 'Test Data', 'Test Client'],
    tooltip:
      'The file contains individual assessment rows or one summary row for each client. Individual rows contain Assessment Time and Client Record ID. Summary rows contain This Record ID and the assessment and activity time columns. The app ignores test rows.',
    metricUse: 'Clients active in Self-Sufficiency Program.'
  },
  generalInteractions: {
    id: 'generalInteractions',
    label: 'General Interactions',
    exampleName: 'general_interactions.csv',
    requiredColumns: [],
    requiredColumnGroups: [
      ['Interaction Time', 'Latest General Interaction Time'],
      ['Client Record ID', 'Client', 'This Record ID']
    ],
    optionalColumns: ['Full Name', 'Test Data'],
    tooltip:
      'If Bridge Assessments contains one summary row for each client, this file is optional. Individual rows contain Interaction Time and Client Record ID or Client.',
    metricUse: 'Clients active in Self-Sufficiency Program.'
  },
  clientSummary: {
    id: 'clientSummary',
    label: 'SSP Client Summary',
    exampleName: 'bridge_assessments.csv client export',
    requiredColumns: [],
    requiredColumnGroups: [
      ['This Record ID', 'Client Record ID'],
      ['Earliest Bridge Assessment Time', 'Latest Bridge Assessment Time'],
      ['Latest SSP Activity Time', 'Latest General Interaction Time', 'Latest Bridge Assessment Time']
    ],
    optionalColumns: ['Full Name', 'SSP Status', 'Test Client'],
    tooltip:
      'This file is an alternative to individual assessment and interaction rows. The file has one row for each client. Latest SSP Activity Time determines activity for the report period.',
    metricUse: 'Clients active in Self-Sufficiency Program.'
  },
  idFeeWaiver: {
    id: 'idFeeWaiver',
    label: 'ID Fee Waiver (optional)',
    exampleName: 'ID_Fee_Waiver_Tracking.csv',
    requiredColumns: ['Timestamp'],
    optionalColumns: [],
    tooltip:
      'The file is optional. It has one row for each ID fee waiver. Timestamp contains a date and time. The app adds rows from the report period to Benefit applications submitted and services provided and the ID fee waiver total.',
    metricUse: 'Benefit applications submitted and services provided and the ID fee waiver total.'
  },
  lifelinePhone: {
    id: 'lifelinePhone',
    label: 'LifeLine Phone List (optional)',
    exampleName: 'LifeLine Phone List.csv',
    requiredColumns: [],
    optionalColumns: [],
    tooltip:
      'The file is optional and contains monthly totals. The app adds the "Monthly Total Applications" value for the report period to Benefit applications submitted and services provided.',
    metricUse: 'Benefit applications submitted and services provided and the Lifeline phone total.'
  },
  employmentSupport: {
    id: 'employmentSupport',
    label: 'Employment Support Engagement Report (optional)',
    exampleName: 'employment_support_engagement_report.csv',
    requiredColumns: [],
    optionalColumns: ['Enrollment Start Date', 'Last Tagged Interaction At'],
    tooltip:
      'The file is optional and has one row for each client enrollment. Enrollment Start Date determines the date. If this value is empty, Last Tagged Interaction At determines the date. The app does not count rows without a valid date.',
    metricUse: 'Employment support and Benefit applications submitted and services provided.'
  },
  housingApplications: {
    id: 'housingApplications',
    label: 'Housing Applications Airtable Export (optional)',
    exampleName: 'housing applications airtable.csv',
    requiredColumns: ['Date Submitted'],
    optionalColumns: ['Name', 'Property', 'Status', 'Test Application'],
    tooltip:
      'The file is optional and has one row for each housing application. Date Submitted determines the report period. The app does not count rows without a Date Submitted, such as applications still in progress. Rows with a value in Test Application are ignored.',
    metricUse: 'Affordable Housing applications.'
  },
  employedClients: {
    id: 'employedClients',
    label: 'Employed Clients (optional)',
    exampleName: 'Employed_Clients___2026.csv',
    requiredColumns: ['Name', 'Date Employed'],
    optionalColumns: [],
    tooltip:
      'The file is optional and has one row for each employed client. Date Employed determines the date. The app does not count rows without a valid date.',
    metricUse: 'Got hired.'
  }
};

export const FILE_SPEC_LIST = Object.values(FILE_SPECS).filter(
  (fileSpec) => fileSpec.id !== 'clientSummary'
);

function cleanHeader(header) {
  return String(header ?? '')
    .replace(/^\uFEFF/, '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function columnKey(column) {
  return cleanHeader(column).toLowerCase();
}

function getValue(row, columns) {
  const columnList = Array.isArray(columns) ? columns : [columns];
  for (const column of columnList) {
    if (Object.prototype.hasOwnProperty.call(row, column)) {
      return row[column];
    }
  }

  const rowKeys = Object.keys(row);
  for (const column of columnList) {
    const match = rowKeys.find((key) => columnKey(key) === columnKey(column));
    if (match) {
      return row[match];
    }
  }

  return '';
}

function hasColumn(row, columns) {
  const columnList = Array.isArray(columns) ? columns : [columns];
  return columnList.some((column) => getValue(row, column) !== undefined && getValue(row, column) !== '');
}

function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === '';
}

function isMarked(value) {
  if (Array.isArray(value)) {
    return value.some(isMarked);
  }
  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value ?? '').trim().toLowerCase();
  // Airtable exports checked boxes as text such as "1 checked out of 1".
  return ['true', 'yes', 'y', '1'].includes(normalized) || /\bchecked\b/.test(normalized);
}

function isAffirmative(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  const normalized = String(value ?? '').trim().toLowerCase();
  return ['yes', 'true', 'checked', 'y', '1'].includes(normalized);
}

function normalizeStatus(value) {
  return String(value ?? '').trim().toLowerCase().replace(/[\s_-]+/g, ' ');
}

function parseNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const normalized = String(value ?? '').replace(/[$,]/g, '').trim();
  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeYear(year) {
  const parsed = Number(year);
  if (!Number.isFinite(parsed)) {
    return new Date().getFullYear();
  }
  return Math.trunc(parsed);
}

function normalizeQuarter(quarter) {
  const parsed = Number(quarter);
  if (!Number.isFinite(parsed)) {
    return 1;
  }
  return Math.min(4, Math.max(1, Math.trunc(parsed)));
}

function normalizeMonth(month, fallback) {
  const parsed = Number(month);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(12, Math.max(1, Math.trunc(parsed)));
}

function makeLocalDate(year, monthIndex, day, hour = 0, minute = 0, second = 0, ms = 0) {
  const date = new Date(year, monthIndex, day, hour, minute, second, ms);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== monthIndex ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function endOfMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
}

export function parseDateValue(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value > 20000 && value < 100000) {
      const excelEpoch = Date.UTC(1899, 11, 30);
      const utc = new Date(excelEpoch + Math.round(value * 24 * 60 * 60 * 1000));
      return makeLocalDate(
        utc.getUTCFullYear(),
        utc.getUTCMonth(),
        utc.getUTCDate(),
        utc.getUTCHours(),
        utc.getUTCMinutes(),
        utc.getUTCSeconds()
      );
    }
    return null;
  }

  const raw = String(value ?? '').trim();
  if (!raw) {
    return null;
  }

  const normalized = raw.replace(/^\uFEFF/, '').replace(/\s+/g, ' ');
  const monthFirst = normalized.match(
    /^(\d{1,2})[/-](\d{1,2}|\?)[/-](\d{2,4})(?:[ T]+(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*([ap]m)?)?$/i
  );
  if (monthFirst) {
    const month = Number(monthFirst[1]);
    const day = monthFirst[2] === '?' ? 1 : Number(monthFirst[2]);
    let year = Number(monthFirst[3]);
    if (year < 100) {
      year += year >= 70 ? 1900 : 2000;
    }
    let hour = Number(monthFirst[4] ?? 0);
    const minute = Number(monthFirst[5] ?? 0);
    const second = Number(monthFirst[6] ?? 0);
    const meridiem = String(monthFirst[7] ?? '').toLowerCase();
    if (meridiem === 'pm' && hour < 12) {
      hour += 12;
    }
    if (meridiem === 'am' && hour === 12) {
      hour = 0;
    }
    return makeLocalDate(year, month - 1, day, hour, minute, second);
  }

  const isoLike = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/
  );
  if (isoLike) {
    return makeLocalDate(
      Number(isoLike[1]),
      Number(isoLike[2]) - 1,
      Number(isoLike[3]),
      Number(isoLike[4] ?? 0),
      Number(isoLike[5] ?? 0),
      Number(isoLike[6] ?? 0)
    );
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const MONTH_NAME_INDEX = MONTH_NAMES.reduce((map, name, index) => {
  map[name.toLowerCase()] = index;
  map[name.slice(0, 3).toLowerCase()] = index;
  return map;
}, {});

export function parseMonthValue(value) {
  const raw = String(value ?? '').trim();
  if (raw) {
    const yearMonth = raw.match(/^(\d{4})[-/](\d{1,2})$/);
    if (yearMonth) {
      return makeLocalDate(Number(yearMonth[1]), Number(yearMonth[2]) - 1, 1);
    }

    const monthYear = raw.match(/^(\d{1,2})[-/](\d{4})$/);
    if (monthYear) {
      return makeLocalDate(Number(monthYear[2]), Number(monthYear[1]) - 1, 1);
    }

    const named = raw.match(/^([A-Za-z]+)[\s,]+(\d{4})$/);
    if (named) {
      const monthIndex = MONTH_NAME_INDEX[named[1].toLowerCase()];
      if (monthIndex !== undefined) {
        return makeLocalDate(Number(named[2]), monthIndex, 1);
      }
    }
  }

  const date = parseDateValue(value);
  if (date) {
    return makeLocalDate(date.getFullYear(), date.getMonth(), 1);
  }

  return null;
}

function isInRange(date, period) {
  return date !== null && date >= period.start && date <= period.end;
}

const rowDateCache = new WeakMap();

function getRowDate(row, columns) {
  let cache = rowDateCache.get(row);
  if (!cache) {
    cache = new Map();
    rowDateCache.set(row, cache);
  }
  const key = Array.isArray(columns) ? columns.join('\u0001') : columns;
  if (!cache.has(key)) {
    cache.set(key, parseDateValue(getValue(row, columns)));
  }
  return cache.get(key);
}

function rowDateInRange(row, columns, period) {
  return isInRange(getRowDate(row, columns), period);
}

function rowDateByEnd(row, columns, period) {
  const date = getRowDate(row, columns);
  return date !== null && date <= period.end;
}

export function getQuarterPeriods(yearInput, quarterInput) {
  const year = normalizeYear(yearInput);
  const quarter = normalizeQuarter(quarterInput);
  const firstMonthIndex = (quarter - 1) * 3;
  return getMonthRangePeriods(year, firstMonthIndex + 1, firstMonthIndex + 3);
}

export function getMonthRangePeriods(yearInput, startMonthInput = 1, endMonthInput = 12) {
  const year = normalizeYear(yearInput);
  let startMonth = normalizeMonth(startMonthInput, 1);
  let endMonth = normalizeMonth(endMonthInput, 12);
  if (startMonth > endMonth) {
    [startMonth, endMonth] = [endMonth, startMonth];
  }

  const periods = [];
  for (let quarter = 1; quarter <= 4; quarter += 1) {
    const firstMonth = (quarter - 1) * 3 + 1;
    const lastMonth = quarter * 3;
    const selectedQuarterMonths = [];
    for (let month = firstMonth; month <= lastMonth; month += 1) {
      if (month >= startMonth && month <= endMonth) {
        selectedQuarterMonths.push(month);
      }
    }
    if (selectedQuarterMonths.length === 0) {
      continue;
    }

    if (selectedQuarterMonths.length === 3) {
      const monthIndexes = [firstMonth - 1, firstMonth, firstMonth + 1];
      periods.push({
        label: `Q${quarter} ${year}`,
        start: makeLocalDate(year, firstMonth - 1, 1),
        end: endOfMonth(year, lastMonth - 1),
        kind: 'quarter',
        quarter,
        monthIndexes
      });
    }

    selectedQuarterMonths.forEach((month) => {
      const monthIndex = month - 1;
      periods.push({
        label: `${MONTH_NAMES[monthIndex]} ${year}`,
        start: makeLocalDate(year, monthIndex, 1),
        end: endOfMonth(year, monthIndex),
        kind: 'month',
        monthIndex
      });
    });
  }

  return periods;
}

function getLegacyQuarterPeriods(yearInput, quarterInput) {
  const year = normalizeYear(yearInput);
  const quarter = normalizeQuarter(quarterInput);
  const firstMonthIndex = (quarter - 1) * 3;
  const monthIndexes = [firstMonthIndex, firstMonthIndex + 1, firstMonthIndex + 2];
  const months = monthIndexes.map((monthIndex) => ({
    label: `${MONTH_NAMES[monthIndex]} ${year}`,
    start: makeLocalDate(year, monthIndex, 1),
    end: endOfMonth(year, monthIndex),
    kind: 'month',
    monthIndex
  }));

  return [
    {
      label: `Q${quarter} ${year}`,
      start: months[0].start,
      end: months[2].end,
      kind: 'quarter',
      quarter,
      monthIndexes
    },
    ...months
  ];
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const source = String(text ?? '').replace(/^\uFEFF/, '');

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const nextChar = source[index + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char === '\r') {
      if (nextChar === '\n') {
        index += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return matrixToRecords(rows);
}

export function matrixToRecords(matrix) {
  const nonEmptyRows = (matrix ?? []).filter(
    (cells) => (cells ?? []).some((cell) => String(cell ?? '').trim() !== '')
  );
  if (nonEmptyRows.length === 0) {
    return [];
  }

  const headers = nonEmptyRows[0].map(cleanHeader);
  return nonEmptyRows.slice(1).map((cells) => {
    const record = {};
    headers.forEach((header, index) => {
      const key = header || (index === 0 ? 'Category' : `Column_${index}`);
      record[key] = cells[index] ?? '';
    });
    return record;
  });
}

export function validateDataset(fileSpec, rows) {
  const headers = new Set(Object.keys(rows[0] ?? {}).map(columnKey));
  const missingRequired = (fileSpec.requiredColumns ?? []).filter(
    (column) => !headers.has(columnKey(column))
  );
  const missingColumnGroups = (fileSpec.requiredColumnGroups ?? []).filter(
    (group) => !group.some((column) => headers.has(columnKey(column)))
  );

  return {
    ok: missingRequired.length === 0 && missingColumnGroups.length === 0,
    missingRequired,
    missingColumnGroups,
    rowCount: rows.length
  };
}

export function combineDatasets(datasets) {
  if (!Array.isArray(datasets)) {
    return [];
  }
  return datasets.flatMap((dataset) => (Array.isArray(dataset) ? dataset : []));
}

export function validateDatasets(fileSpec, namedDatasets) {
  if (!Array.isArray(namedDatasets) || namedDatasets.length === 0) {
    return {
      ok: false,
      missingRequired: [],
      missingColumnGroups: [],
      rowCount: 0,
      fileResults: []
    };
  }
  const fileResults = namedDatasets.map(({ name, rows }) => ({
    name,
    ...validateDataset(fileSpec, rows)
  }));
  const allOk = fileResults.every((res) => res.ok);
  const totalRows = fileResults.reduce((sum, res) => sum + res.rowCount, 0);
  const missingRequired = [...new Set(fileResults.flatMap((res) => res.missingRequired))];
  const missingColumnGroups = fileResults.flatMap((res) => res.missingColumnGroups);

  return {
    ok: allOk,
    missingRequired,
    missingColumnGroups,
    rowCount: totalRows,
    fileResults
  };
}

const cleanedRowsCache = new WeakMap();

function cleanRows(rows, testColumns = ['Test Data', 'Test Client', 'Test Application']) {
  if (!rows || rows.length === 0) {
    return [];
  }
  let cleaned = cleanedRowsCache.get(rows);
  if (!cleaned) {
    cleaned = rows.filter((row) => !testColumns.some((column) => isMarked(getValue(row, column))));
    cleanedRowsCache.set(rows, cleaned);
  }
  return cleaned;
}

function countRows(rows, dateColumns, period, predicate = () => true) {
  return cleanRows(rows).filter(
    (row) => rowDateInRange(row, dateColumns, period) && predicate(row)
  ).length;
}

const HOUSING_APPLICATION_PROGRAMS_NORMALIZED = new Set(
  HOUSING_APPLICATION_PROGRAMS.map(normalizeProgramName)
);
const HOUSING_RETENTION_PROGRAMS_NORMALIZED = new Set(
  HOUSING_RETENTION_PROGRAMS.map(normalizeProgramName)
);

function normalizeProgramName(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}

const programFlagsCache = new WeakMap();

function getProgramFlags(row) {
  let flags = programFlagsCache.get(row);
  if (!flags) {
    const rawValue = getValue(row, 'Program Enrolled');
    const value = String(rawValue ?? '').toLowerCase();
    const normalizedValue = normalizeProgramName(rawValue);
    flags = {
      viSpdat: value.includes('vi-spdat'),
      housingApplication: HOUSING_APPLICATION_PROGRAMS_NORMALIZED.has(normalizedValue),
      housingRetention: HOUSING_RETENTION_PROGRAMS_NORMALIZED.has(normalizedValue)
    };
    programFlagsCache.set(row, flags);
  }
  return flags;
}

function countHousingApplicationsApricot(datasets, period) {
  return countRows(
    datasets.programs,
    'Start Date',
    period,
    (row) => getProgramFlags(row).housingApplication
  );
}

function countHousingRetention(datasets, period) {
  return countRows(
    datasets.programs,
    'Start Date',
    period,
    (row) => getProgramFlags(row).housingRetention
  );
}

function countViSpdat(datasets, period) {
  const reportRows = cleanRows(datasets.viSpdatReport);
  if (reportRows.length > 0) {
    return reportRows.filter((row) => {
      if (!rowDateInRange(row, 'Date', period)) {
        return false;
      }
      const assessmentName = String(getValue(row, 'Assessment Name') ?? '').trim();
      return assessmentName === '' || assessmentName.toLowerCase().includes('spdat');
    }).length;
  }

  return countRows(
    datasets.programs,
    'Start Date',
    period,
    (row) => getProgramFlags(row).viSpdat
  );
}

function countIdFeeWaiver(datasets, period) {
  return countRows(datasets.idFeeWaiver, 'Timestamp', period);
}

function countLifelinePhone(datasets, period) {
  const rows = cleanRows(datasets.lifelinePhone);
  let total = 0;
  const targetRow = rows.find(
    (row) => String(getValue(row, 'Category') ?? '').trim() === 'Monthly Total Applications'
  );
  if (!targetRow) {
    return 0;
  }

  const year = period.start.getFullYear();
  const monthIndexes = period.kind === 'month' ? [period.monthIndex] : period.monthIndexes;
  for (const mIndex of monthIndexes) {
    const monthName = MONTH_NAMES[mIndex];
    const columnName = `${monthName} ${year}`;
    const val = getValue(targetRow, columnName);
    total += parseNumber(val);
  }
  return total;
}

function countEmploymentSupport(datasets, period) {
  const rows = cleanRows(datasets.employmentSupport);
  return rows.filter((row) => {
    const column = isBlank(getValue(row, 'Enrollment Start Date'))
      ? 'Last Tagged Interaction At'
      : 'Enrollment Start Date';
    return isInRange(getRowDate(row, column), period);
  }).length;
}

function memoizePeriodCount(fn) {
  const cache = new WeakMap();
  return (datasets, period) => {
    if (!cache.has(period)) {
      cache.set(period, fn(datasets, period));
    }
    return cache.get(period);
  };
}

const countViSpdatForPeriod = memoizePeriodCount(countViSpdat);
const countIdFeeWaiverForPeriod = memoizePeriodCount(countIdFeeWaiver);
const countLifelinePhoneForPeriod = memoizePeriodCount(countLifelinePhone);
const countEmploymentSupportForPeriod = memoizePeriodCount(countEmploymentSupport);

// Running total: unique Record IDs with a Start Date from the start of the
// report year through the end of the period.
function countUniqueClientsServed(datasets, period) {
  const yearStart = makeLocalDate(period.start.getFullYear(), 0, 1);
  const recordIds = new Set();
  for (const row of cleanRows(datasets.programs)) {
    const recordId = String(getValue(row, 'Record ID') ?? '').trim();
    const startDate = getRowDate(row, 'Start Date');
    if (recordId && startDate && startDate >= yearStart && startDate <= period.end) {
      recordIds.add(recordId);
    }
  }
  return recordIds.size;
}

const countUniqueClientsServedForPeriod = memoizePeriodCount(countUniqueClientsServed);

const UPLIFT_QUARTERLY_TOTAL = 130;
const UPLIFT_MONTHLY_AMOUNT = Math.ceil(UPLIFT_QUARTERLY_TOTAL / 3);
const CALTRAIN_YEARLY_TOTAL = 100;

// Spreads the yearly total across 12 months. Any remainder goes to the first months.
function caltrainMonthlyAmount(monthIndex) {
  const base = Math.floor(CALTRAIN_YEARLY_TOTAL / 12);
  const extra = CALTRAIN_YEARLY_TOTAL % 12;
  return base + (monthIndex < extra ? 1 : 0);
}

function fixedBenefitAmount(period) {
  const monthIndexes = period.kind === 'month' ? [period.monthIndex] : period.monthIndexes;
  const caltrain = monthIndexes.reduce((sum, monthIndex) => sum + caltrainMonthlyAmount(monthIndex), 0);
  const uplift = period.kind === 'quarter' ? UPLIFT_QUARTERLY_TOTAL : UPLIFT_MONTHLY_AMOUNT;
  return uplift + caltrain;
}

// Programs counted separately below (or excluded by request) are left out of the program count.
const BENEFIT_SERVICES_EXCLUDED_PROGRAMS_LOWER = [
  'Homelessness Prevention',
  'Housing Solution',
  'VI-SPDAT',
  'UPLIFT',
  'LifeLine',
  'Caltrain',
  'ID fee waiver'
].map((program) => program.toLowerCase());

function countBenefitServicesProvided(datasets, period) {
  const programEnrollments = countRows(
    datasets.programs,
    'Start Date',
    period,
    (row) => {
      const value = String(getValue(row, 'Program Enrolled') ?? '').toLowerCase();
      return !BENEFIT_SERVICES_EXCLUDED_PROGRAMS_LOWER.some((program) => value.includes(program));
    }
  );
  return (
    programEnrollments +
    countViSpdatForPeriod(datasets, period) +
    countIdFeeWaiverForPeriod(datasets, period) +
    countLifelinePhoneForPeriod(datasets, period) +
    fixedBenefitAmount(period)
  );
}

function extractDateStr(val) {
  if (!val) return null;
  const valStr = String(val).trim();
  if (valStr.toLowerCase() === 'pending' || valStr.toLowerCase() === 'date employed') {
    return null;
  }
  const match = valStr.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);
  return match ? match[0] : null;
}

function countEmployedClients(datasets, period) {
  const rows = cleanRows(datasets.employedClients);
  return rows.filter((row) => {
    const dateVal = getValue(row, 'Date Employed');
    const extracted = extractDateStr(dateVal);
    if (!extracted) return false;
    const date = parseDateValue(extracted);
    return isInRange(date, period);
  }).length;
}

function countClientsHoused(datasets, period) {
  return cleanRows(datasets.housed)
    .filter((row) => {
      const name = String(getValue(row, 'Name') ?? '').trim();
      return name && rowDateInRange(row, 'Date Housed', period);
    })
    .reduce(
      (sum, row) =>
        sum + HOUSED_VALUE_COLUMNS.reduce(
          (columnSum, column) => columnSum + parseNumber(getValue(row, column)),
          0
        ),
      0
    );
}

// Volunteers count only from January 2025 onward.
const ACTIVE_VOLUNTEER_START = new Date(2025, 0, 1);

// A volunteer is active when they have a shift in each of the 3 months ending with the
// period's last month. A quarter therefore checks its three months.
function countActiveVolunteers(datasets, period) {
  const lastMonthIndex = period.kind === 'month' ? period.monthIndex : period.monthIndexes.at(-1);
  const lastMonthAbs = period.start.getFullYear() * 12 + lastMonthIndex;

  let active = null;
  for (let offset = 2; offset >= 0; offset -= 1) {
    const year = Math.floor((lastMonthAbs - offset) / 12);
    const monthIndex = (lastMonthAbs - offset) % 12;
    const monthStart = new Date(year, monthIndex, 1);
    if (monthStart < ACTIVE_VOLUNTEER_START) {
      return 0;
    }
    const monthEnd = endOfMonth(year, monthIndex);
    const volunteerIds = new Set(
      cleanRows(datasets.volunteers)
        .filter((row) => {
          const date = getRowDate(row, 'Event Date');
          return date && date >= monthStart && date <= monthEnd;
        })
        .map((row) => String(getValue(row, 'Volunteer ID') ?? '').trim())
        .filter((volunteerId) => volunteerId)
    );
    active = active === null
      ? volunteerIds
      : new Set([...active].filter((volunteerId) => volunteerIds.has(volunteerId)));
  }
  return active.size;
}

const countActiveVolunteersForPeriod = memoizePeriodCount(countActiveVolunteers);

function getVolunteerHours(row) {
  const shiftHours = parseNumber(getValue(row, 'Shift Hours'));
  if (shiftHours > 0) {
    return shiftHours;
  }

  const arrival = getRowDate(row, 'Intended Arrival Time');
  const departure = getRowDate(row, 'Intended Departure Time');
  if (!arrival || !departure) {
    return 0;
  }

  let hours = (departure.getTime() - arrival.getTime()) / (60 * 60 * 1000);
  if (hours < 0) {
    hours += 24;
  }
  return Number.isFinite(hours) && hours > 0 ? hours : 0;
}

function sumVolunteerHours(datasets, period) {
  const total = cleanRows(datasets.volunteers)
    .filter((row) => rowDateInRange(row, 'Event Date', period))
    .reduce((sum, row) => sum + getVolunteerHours(row), 0);

  return roundToTwo(total);
}

function getClientRecordId(row) {
  const value = getValue(row, ['Client Record ID', 'Client', 'This Record ID', 'record_id']);
  if (Array.isArray(value)) {
    return String(value[0] ?? '').trim();
  }
  return String(value ?? '').trim();
}

function countSspFromIndividualRecords(datasets, period) {
  const assessments = cleanRows(datasets.bridgeAssessments);
  const interactions = cleanRows(datasets.generalInteractions);
  const clientsWithAssessmentsInPeriod = new Set(
    assessments
      .filter((row) => rowDateInRange(row, 'Assessment Time', period))
      .map(getClientRecordId)
      .filter(Boolean)
  );
  const clientsWithInteractionsInPeriod = new Set(
    interactions
      .filter((row) => rowDateInRange(row, ['Interaction Time', 'Latest General Interaction Time'], period))
      .map(getClientRecordId)
      .filter(Boolean)
  );
  const clientsWithAnyAssessmentByEnd = new Set(
    assessments
      .filter((row) => rowDateByEnd(row, 'Assessment Time', period))
      .map(getClientRecordId)
      .filter(Boolean)
  );

  const clientsWithActivity = new Set([
    ...clientsWithAssessmentsInPeriod,
    ...clientsWithInteractionsInPeriod
  ]);

  return [...clientsWithActivity].filter((clientId) =>
    clientsWithAnyAssessmentByEnd.has(clientId)
  ).length;
}

function getFirstDate(row, columns) {
  for (const column of columns) {
    const date = getRowDate(row, column);
    if (date) {
      return date;
    }
  }
  return null;
}

function countSspFromClientSummary(rows, period) {
  return cleanRows(rows).filter((row) => {
    const assessmentDate = getFirstDate(row, [
      'Earliest Bridge Assessment Time',
      'Latest Bridge Assessment Time',
      'Assessment Time'
    ]);
    if (!assessmentDate || assessmentDate > period.end) {
      return false;
    }

    const activityDates = [
      'Latest SSP Activity Time',
      'Latest Bridge Assessment Time',
      'Latest General Interaction Time',
      'Assessment Time'
    ]
      .map((column) => getRowDate(row, column))
      .filter(Boolean);

    return activityDates.some((date) => isInRange(date, period));
  }).length;
}

function hasIndividualAssessmentRows(rows) {
  return (rows ?? []).some((row) => !isBlank(getValue(row, 'Assessment Time')));
}

function countSspActiveClients(datasets, period) {
  if (hasIndividualAssessmentRows(datasets.bridgeAssessments)) {
    return countSspFromIndividualRecords(datasets, period);
  }

  const summaryRows = (datasets.clientSummary ?? []).length > 0
    ? datasets.clientSummary
    : datasets.bridgeAssessments;
  return countSspFromClientSummary(summaryRows ?? [], period);
}

function roundToTwo(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function valueForMetric(metricKey, datasets, period) {
  switch (metricKey) {
    case 'newClients':
      return countRows(datasets.clients, 'Creation Date', period);
    case 'engagementLetters':
      return countRows(
        datasets.clients,
        'Creation Date',
        period,
        (row) => isAffirmative(getValue(row, 'Client Engagement Letter'))
      );
    case 'activeClients':
      return countRows(
        datasets.clients,
        'Creation Date',
        period,
        (row) =>
          normalizeStatus(getValue(row, 'Client Status')) === 'active' &&
          isAffirmative(getValue(row, 'Client Engagement Letter'))
      );
    case 'semiActiveClients':
      return countRows(
        datasets.clients,
        'Creation Date',
        period,
        (row) =>
          normalizeStatus(getValue(row, 'Client Status')) === 'semi active' &&
          isAffirmative(getValue(row, 'Client Engagement Letter'))
      );
    case 'uniqueClientsServed':
      return countUniqueClientsServedForPeriod(datasets, period);
    case 'benefitServicesProvided':
      return countBenefitServicesProvided(datasets, period);
    case 'affordableHousingApplications':
      return countRows(datasets.housingApplications, 'Date Submitted', period);
    case 'housingApplicationsApricot':
      return countHousingApplicationsApricot(datasets, period);
    case 'housingRetention':
      return countHousingRetention(datasets, period);
    case 'clientsHoused':
      return countClientsHoused(datasets, period);
    case 'activeVolunteers':
      return countActiveVolunteersForPeriod(datasets, period);
    case 'volunteerHours':
      return sumVolunteerHours(datasets, period);
    case 'sspActiveClients':
      return countSspActiveClients(datasets, period);
    case 'employmentSupport':
      return countEmploymentSupportForPeriod(datasets, period);
    case 'employedClients':
      return countEmployedClients(datasets, period);
    default:
      return 0;
  }
}

export function buildMetricsTable(rawDatasets = {}, options = {}) {
  const datasets = Object.fromEntries(
    Object.keys(FILE_SPECS).map((key) => [key, rawDatasets[key] ?? []])
  );
  const periods = options.startMonth || options.endMonth
    ? getMonthRangePeriods(options.year ?? 2026, options.startMonth ?? 1, options.endMonth ?? 12)
    : getLegacyQuarterPeriods(options.year ?? 2026, options.quarter ?? 1);
  const metricKeys = Object.keys(METRIC_NAMES);

  return {
    headers: ['Type of Metric', ...periods.map((period) => period.label)],
    rows: metricKeys.map((metricKey) => [
      METRIC_NAMES[metricKey],
      ...periods.map((period) => valueForMetric(metricKey, datasets, period))
    ])
  };
}

function formatClipboardValue(metricName, value) {
  if (typeof value !== 'number') {
    return String(value ?? '');
  }
  if (metricName === METRIC_NAMES.volunteerHours) {
    return value.toFixed(2);
  }
  return String(Math.trunc(value));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function tableToClipboardText(table) {
  const lines = [table.headers.join('\t')];
  for (const row of table.rows) {
    const metricName = row[0];
    lines.push(
      row.map((value, index) => (index === 0 ? value : formatClipboardValue(metricName, value))).join('\t')
    );
  }
  return lines.join('\n');
}

export function tableToClipboardHtml(table) {
  const tableStyle = 'border-collapse: collapse; width: 100%; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #1b2436;';
  const headerStyle = 'background-color: #eef1f6; color: #1b2436; font-weight: 700; padding: 10px 12px; border: 1px solid #cfd5df; text-align: left; vertical-align: middle;';
  const cellStyle = 'padding: 9px 12px; border: 1px solid #cfd5df; vertical-align: middle;';

  const headers = table.headers
    .map((header, index) => {
      const alignment = index === 0 ? '' : ' text-align: right;';
      return `<th style="${headerStyle}${alignment}">${escapeHtml(header)}</th>`;
    })
    .join('');

  const rows = table.rows
    .map((row, rowIndex) => {
      const metricName = row[0];
      const background = rowIndex % 2 === 0 ? '#ffffff' : '#fafbfe';
      const cells = row
        .map((value, index) => {
          const formatted = index === 0 ? value : formatClipboardValue(metricName, value);
          const alignment = index === 0 ? 'left' : 'right';
          return `<td style="${cellStyle} text-align: ${alignment};">${escapeHtml(formatted)}</td>`;
        })
        .join('');
      return `<tr style="background-color: ${background};">${cells}</tr>`;
    })
    .join('');

  return `<table style="${tableStyle}"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
}

export function formatTableValue(metricName, value) {
  if (typeof value !== 'number') {
    return String(value ?? '');
  }
  if (metricName === METRIC_NAMES.volunteerHours) {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  return Math.trunc(value).toLocaleString();
}

export { METRIC_NAMES };
