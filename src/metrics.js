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

const METRIC_NAMES = {
  newClients: 'Total number of new clients entered into Apricot',
  engagementLetters: 'Clients signed engagement letter',
  activeClients: 'Active Clients',
  semiActiveClients: 'Semi-Active Clients',
  housingSupport: 'Housing support',
  clientsHoused: 'Clients housed',
  activeVolunteers: 'Active Onsite Volunteers',
  volunteerHours: 'Onsite Volunteer hours',
  sspActiveClients: 'Clients active in Self-Sufficiency Program',
  benefits: 'Benefits & services applications submitted'
};

const HOUSING_SUPPORT_PROGRAMS = [
  'PSH',
  'RRH',
  'HUD-VASH',
  'VASH',
  'Section 8',
  'Deposit & first month rent',
  'Deposit and First Month Rent',
  'Search',
  'VI-SPDAT',
  'Home sharing',
  'Home-sharing',
  'Housing recertification',
  'Affordable housing',
  'Affordable Housing Waitlist Application',
  'Permanent Supportive Housing',
  'Rapid Rehousing'
];

const MANUALLY_ADDED_BENEFIT_PROGRAMS = [
  'UPLIFT',
  'MyCoonectSV',
  'LifeLine'
];

const HOUSING_PROGRAMS_TO_EXCLUDE_FROM_BENEFITS = [
  ...HOUSING_SUPPORT_PROGRAMS,
  ...MANUALLY_ADDED_BENEFIT_PROGRAMS,
  'Affordable Apartment',
  'Affordable housing applications'
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
      'Needs one row per Apricot client. Creation Date should be a date/time like 01/31/2026 9:58 AM. Client Status should include values like Active or Semi Active. Client Engagement Letter should be Yes for signed clients.',
    metricUse:
      'New clients, engagement letters, active clients, and semi-active clients.'
  },
  programs: {
    id: 'programs',
    label: 'Clients & Programs',
    exampleName: 'Clients_&_Programs.csv',
    requiredColumns: ['Program Enrolled', 'Start Date'],
    optionalColumns: ['Program Status', 'Client Manager', 'Record ID'],
    tooltip:
      'Needs one row per program enrollment. Start Date should be a date like 01/31/2026. Program Enrolled is matched against housing program names and benefit/service names.',
    metricUse: 'Housing support and benefits/services provided.'
  },
  housed: {
    id: 'housed',
    label: 'Housed',
    exampleName: 'Housed.csv',
    requiredColumns: ['Name', 'Date Housed'],
    optionalColumns: HOUSED_VALUE_COLUMNS,
    tooltip:
      'Needs one row per housed client. Rows without Name are ignored. Date Housed is used for the period, and the housing columns are summed for clients housed.',
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
      'Needs one row per volunteer attendance record. Event Date should be a date. Volunteer ID should be stable across months. Shift Hours is used when present; otherwise Intended Arrival Time and Intended Departure Time are used.',
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
      'Use either individual assessment rows with Assessment Time and Client Record ID, or a client summary export with This Record ID plus bridge assessment and latest SSP activity time columns. Test rows are ignored.',
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
      'Optional when Bridge Assessments is a client summary export. For individual interaction rows, include Interaction Time and Client Record ID or Client.',
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
      'Alternative SSP input when you have a client-level export instead of individual assessment and interaction records. Latest SSP Activity Time is preferred for activity by period.',
    metricUse: 'Clients active in Self-Sufficiency Program.'
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
  return ['true', 'checked', 'yes', 'y', '1'].includes(normalized);
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
      return new Date(excelEpoch + value * 24 * 60 * 60 * 1000);
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

function isInRange(date, period) {
  return date !== null && date >= period.start && date <= period.end;
}

function rowDateInRange(row, columns, period) {
  const date = parseDateValue(getValue(row, columns));
  return isInRange(date, period);
}

function rowDateByEnd(row, columns, period) {
  const date = parseDateValue(getValue(row, columns));
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

  const nonEmptyRows = rows.filter((cells) => cells.some((cell) => String(cell).trim() !== ''));
  if (nonEmptyRows.length === 0) {
    return [];
  }

  const headers = nonEmptyRows[0].map(cleanHeader);
  return nonEmptyRows.slice(1).map((cells) => {
    const record = {};
    headers.forEach((header, index) => {
      if (header) {
        record[header] = cells[index] ?? '';
      }
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

function cleanRows(rows, testColumns = ['Test Data', 'Test Client', 'Test Application']) {
  return (rows ?? []).filter((row) => !testColumns.some((column) => isMarked(getValue(row, column))));
}

function countRows(rows, dateColumns, period, predicate = () => true) {
  return cleanRows(rows).filter(
    (row) => rowDateInRange(row, dateColumns, period) && predicate(row)
  ).length;
}

function programMatches(row, programs) {
  const value = String(getValue(row, 'Program Enrolled') ?? '').toLowerCase();
  return programs.some((program) => value.includes(program.toLowerCase()));
}

function countHousingSupport(datasets, period) {
  return countRows(
    datasets.programs,
    'Start Date',
    period,
    (row) => programMatches(row, HOUSING_SUPPORT_PROGRAMS)
  );
}

function countBenefits(datasets, period) {
  return countRows(
    datasets.programs,
    'Start Date',
    period,
    (row) => !programMatches(row, HOUSING_PROGRAMS_TO_EXCLUDE_FROM_BENEFITS)
  );
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

function volunteerRowsInPeriod(rows, period) {
  return cleanRows(rows).filter((row) => {
    const volunteerId = String(getValue(row, 'Volunteer ID') ?? '').trim();
    return volunteerId && rowDateInRange(row, 'Event Date', period);
  });
}

function countActiveVolunteers(datasets, period) {
  const rows = cleanRows(datasets.volunteers).filter((row) => {
    const volunteerId = String(getValue(row, 'Volunteer ID') ?? '').trim();
    return volunteerId && rowDateInRange(row, 'Event Date', period);
  });

  if (period.kind === 'month') {
    return new Set(rows.map((row) => String(getValue(row, 'Volunteer ID')).trim())).size;
  }

  const monthlyVolunteerSets = period.monthIndexes.map((monthIndex) => {
    const monthPeriod = {
      start: makeLocalDate(period.start.getFullYear(), monthIndex, 1),
      end: endOfMonth(period.start.getFullYear(), monthIndex)
    };
    return new Set(
      volunteerRowsInPeriod(datasets.volunteers, monthPeriod).map((row) =>
        String(getValue(row, 'Volunteer ID')).trim()
      )
    );
  });

  if (monthlyVolunteerSets.length === 0) {
    return 0;
  }

  return [...monthlyVolunteerSets[0]].filter((volunteerId) =>
    monthlyVolunteerSets.every((set) => set.has(volunteerId))
  ).length;
}

function getVolunteerHours(row) {
  const shiftHours = parseNumber(getValue(row, 'Shift Hours'));
  if (shiftHours > 0) {
    return shiftHours;
  }

  const arrival = parseDateValue(getValue(row, 'Intended Arrival Time'));
  const departure = parseDateValue(getValue(row, 'Intended Departure Time'));
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
    const date = parseDateValue(getValue(row, column));
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
      .map((column) => parseDateValue(getValue(row, column)))
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
    case 'housingSupport':
      return countHousingSupport(datasets, period);
    case 'clientsHoused':
      return countClientsHoused(datasets, period);
    case 'activeVolunteers':
      return countActiveVolunteers(datasets, period);
    case 'volunteerHours':
      return sumVolunteerHours(datasets, period);
    case 'sspActiveClients':
      return countSspActiveClients(datasets, period);
    case 'benefits':
      return countBenefits(datasets, period);
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
