import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FILE_SPECS,
  buildMetricsTable,
  combineDatasets,
  matrixToRecords,
  parseCsv,
  tableToClipboardHtml,
  tableToClipboardText,
  validateDataset,
  validateDatasets
} from '../src/metrics.js';

const BENEFIT_ROW = 'Benefit applications submitted and services provided';

// How much each column of the benefit row goes up compared with empty datasets.
function benefitIncrease(datasets, options = { year: 2026, quarter: 1 }) {
  const findRow = (table) => table.rows.find(([name]) => name === BENEFIT_ROW);
  const base = findRow(buildMetricsTable({}, options));
  const row = findRow(buildMetricsTable(datasets, options));
  return row.slice(1).map((value, index) => value - base[index + 1]);
}

test('parseCsv handles quoted commas, escaped quotes, and CRLF input', () => {
  const rows = parseCsv('Name,Notes\r\n"River, Inc.","Said ""yes"""\r\n');

  assert.deepEqual(rows, [
    { Name: 'River, Inc.', Notes: 'Said "yes"' }
  ]);
});

test('buildMetricsTable calculates the uploaded-file quarterly metrics', () => {
  const datasets = {
    clients: [
      {
        'Creation Date': '01/10/2026 9:00 AM',
        'Client Status': 'Active',
        'Client Engagement Letter': 'Yes'
      },
      {
        'Creation Date': '02/05/2026 10:30 AM',
        'Client Status': 'Semi Active',
        'Client Engagement Letter': 'Yes'
      },
      {
        'Creation Date': '03/11/2026 11:00 AM',
        'Client Status': 'Active',
        'Client Engagement Letter': 'No'
      },
      {
        'Creation Date': '04/01/2026 8:00 AM',
        'Client Status': 'Active',
        'Client Engagement Letter': 'Yes'
      }
    ],
    programs: [
      { 'Start Date': '01/05/2026', 'Program Enrolled': 'PSH' },
      { 'Start Date': '02/10/2026', 'Program Enrolled': 'CalFresh applications' },
      { 'Start Date': '03/20/2026', 'Program Enrolled': 'Home sharing' },
      {
        'Start Date': '03/22/2026',
        'Program Enrolled': 'Housing Solutions - Affordable Housing Waitlist Application'
      },
      { 'Start Date': '03/25/2026', 'Program Enrolled': 'UPLIFT Pass' },
      { 'Start Date': '03/26/2026', 'Program Enrolled': 'MyConnectSV' },
      { 'Start Date': '03/27/2026', 'Program Enrolled': 'LifeLine Phone' }
    ],
    housed: [
      {
        Name: 'client-a',
        'Date Housed': '01/15/2026',
        PSH: '2',
        HCV: '',
        VASH: '',
        RRH: '',
        'Home Sharing': '',
        'Affordable Apt': '',
        'Section 8 Interest List': '',
        'Commercial Rate': ''
      },
      {
        Name: 'client-b',
        'Date Housed': '03/18/2026',
        PSH: '',
        HCV: '',
        VASH: '',
        RRH: '',
        'Home Sharing': '',
        'Affordable Apt': '3',
        'Section 8 Interest List': '',
        'Commercial Rate': ''
      },
      {
        Name: '',
        'Date Housed': '03/20/2026',
        PSH: '',
        HCV: '',
        VASH: '',
        RRH: '9',
        'Home Sharing': '',
        'Affordable Apt': '',
        'Section 8 Interest List': '',
        'Commercial Rate': ''
      }
    ],
    volunteers: [
      {
        'Event Date': '01/03/2026',
        'Volunteer ID': 'vol-a',
        'Shift Hours': '2.5',
        'Test Data': ''
      },
      {
        'Event Date': '02/03/2026',
        'Volunteer ID': 'vol-a',
        'Shift Hours': '',
        'Intended Arrival Time': '02/03/2026 8:00am',
        'Intended Departure Time': '02/03/2026 10:00am',
        'Test Data': ''
      },
      {
        'Event Date': '03/03/2026',
        'Volunteer ID': 'vol-a',
        'Shift Hours': '1',
        'Test Data': ''
      },
      {
        'Event Date': '01/10/2026',
        'Volunteer ID': 'vol-b',
        'Shift Hours': '4',
        'Test Data': ''
      },
      {
        'Event Date': '03/10/2026',
        'Volunteer ID': 'vol-test',
        'Shift Hours': '8',
        'Test Data': 'checked'
      }
    ],
    bridgeAssessments: [
      { 'Assessment Time': '01/15/2026 12:00pm', 'Client Record ID': 'client-a' },
      { 'Assessment Time': '12/10/2025 12:00pm', 'Client Record ID': 'client-b' }
    ],
    generalInteractions: [
      { 'Interaction Time': '02/15/2026 12:00pm', 'Client Record ID': 'client-a' },
      { 'Interaction Time': '02/20/2026 12:00pm', 'Client Record ID': 'client-b' },
      { 'Interaction Time': '02/21/2026 12:00pm', 'Client Record ID': 'client-no-assessment' }
    ]
  };

  const table = buildMetricsTable(datasets, { year: 2026, quarter: 1 });

  assert.deepEqual(table.headers, [
    'Type of Metric',
    'Q1 2026',
    'January 2026',
    'February 2026',
    'March 2026'
  ]);
  assert.deepEqual(table.rows, [
    ['New clients we entered in Apricot', 3, 1, 1, 1],
    ['New clients who signed engagement letters', 2, 1, 1, 0],
    ['Active clients (Total)', 1, 1, 0, 0],
    ['Semi-active clients', 1, 0, 1, 0],
    ['# of unique clients served', 0, 0, 0, 0],
    ['Benefit applications submitted and services provided', 161, 54, 54, 55],
    ['Affordable Housing applications', 0, 0, 0, 0],
    ['Housing applications - Data from Apricot', 0, 0, 0, 0],
    ['Housing retention', 0, 0, 0, 0],
    ['Housed: Clients we helped got housing', 5, 2, 0, 3],
    ['Employment support', 0, 0, 0, 0],
    ['Got hired', 0, 0, 0, 0],
    ['Clients active in Self-Sufficiency Program', 2, 1, 2, 0],
    ['Volunteer hours (onsite only)', 9.5, 6.5, 2, 1]
  ]);
});

test('buildMetricsTable limits output to the selected month range', () => {
  const table = buildMetricsTable(
    {
      programs: [
        { 'Start Date': '01/05/2026', 'Program Enrolled': 'CalFresh' },
        { 'Start Date': '02/05/2026', 'Program Enrolled': 'CalFresh' },
        { 'Start Date': '04/05/2026', 'Program Enrolled': 'CalFresh' }
      ]
    },
    { year: 2026, startMonth: 2, endMonth: 4 }
  );

  assert.deepEqual(table.headers, [
    'Type of Metric',
    'February 2026',
    'March 2026',
    'April 2026'
  ]);

  // Feb and Apr: 1 CalFresh + UPLIFT 44 + Caltrain 9. Mar: UPLIFT 44 + Caltrain 9.
  const benefitsRow = table.rows.find(([name]) => name === BENEFIT_ROW);
  assert.deepEqual(benefitsRow, [BENEFIT_ROW, 54, 53, 54]);
});

test('buildMetricsTable can calculate SSP activity from the client summary export', () => {
  const table = buildMetricsTable(
    {
      clientSummary: [
        {
          'This Record ID': 'rec-a',
          'Earliest Bridge Assessment Time': '01/04/2026 8:00am',
          'Latest SSP Activity Time': '02/05/2026 8:00am',
          'Test Client': ''
        },
        {
          'This Record ID': 'rec-b',
          'Earliest Bridge Assessment Time': '12/04/2025 8:00am',
          'Latest General Interaction Time': '03/05/2026 8:00am',
          'Test Client': ''
        },
        {
          'This Record ID': 'rec-c',
          'Earliest Bridge Assessment Time': '',
          'Latest SSP Activity Time': '02/05/2026 8:00am',
          'Test Client': ''
        }
      ]
    },
    { year: 2026, quarter: 1 }
  );

  const sspRow = table.rows.find(
    ([name]) => name === 'Clients active in Self-Sufficiency Program'
  );

  assert.deepEqual(sspRow, [
    'Clients active in Self-Sufficiency Program',
    2,
    0,
    1,
    1
  ]);
});

test('validateDataset reports missing required columns using file specs', () => {
  const result = validateDataset(FILE_SPECS.clients, [
    { 'Creation Date': '01/10/2026', 'Client Status': 'Active' }
  ]);

  assert.equal(result.ok, false);
  assert.deepEqual(result.missingRequired, ['Client Engagement Letter']);
});

test('tableToClipboardText creates spreadsheet-friendly TSV', () => {
  const text = tableToClipboardText({
    headers: ['Type of Metric', 'Q1 2026'],
    rows: [
      ['Housing support', 4],
      ['Volunteer hours (onsite only)', 5.5]
    ]
  });

  assert.equal(
    text,
    'Type of Metric\tQ1 2026\nHousing support\t4\nVolunteer hours (onsite only)\t5.50'
  );
});

test('tableToClipboardHtml creates an email-safe table with inline formatting', () => {
  const html = tableToClipboardHtml({
    headers: ['Type of Metric', 'Q1 <2026>'],
    rows: [
      ['Housing & support', 4],
      ['Volunteer hours (onsite only)', 5.5]
    ]
  });

  assert.match(html, /^<table style="[^"]*border-collapse: collapse;/);
  assert.match(html, /<th style="[^"]*background-color: #eef1f6;[^"]*">Q1 &lt;2026&gt;<\/th>/);
  assert.match(html, /<td style="[^"]*text-align: left;[^"]*">Housing &amp; support<\/td>/);
  assert.match(html, /<td style="[^"]*text-align: right;[^"]*">5\.50<\/td>/);
  assert.match(html, /<tr style="background-color: #fafbfe;">/);
  assert.doesNotMatch(html, /<style>/);
});

test('ID fee waivers, lifeline phone list, and VI-SPDAT add to benefit applications', () => {
  const datasets = {
    programs: [
      { 'Start Date': '01/05/2026', 'Program Enrolled': 'PSH' },
      { 'Start Date': '02/10/2026', 'Program Enrolled': 'Housing Solutions - VI-SPDAT' }
    ],
    idFeeWaiver: [
      { 'Timestamp': '01/04/2026 9:09:45', 'Client\'s First Name': 'A' },
      { 'Timestamp': '02/11/2026 14:57:59', 'Client\'s First Name': 'B' }
    ],
    lifelinePhone: [
      { Category: 'Monthly Total Applications', 'January 2026': '10', 'February 2026': '20' },
      { Category: 'Monthly Total Completed', 'January 2026': '5', 'February 2026': '8' }
    ]
  };

  // Jan: PSH 1 + ID waiver 1 + Lifeline 10. Feb: VI-SPDAT 1 + ID waiver 1 + Lifeline 20.
  assert.deepEqual(benefitIncrease(datasets), [34, 12, 22, 0]);

  const table = buildMetricsTable(datasets, { year: 2026, quarter: 1 });
  assert.equal(table.rows.some(([name]) => name === 'ID fee waiver'), false);
});

test('VI-SPDAT report upload overrides the Clients & Programs count', () => {
  const excelSerial = (year, month, day) =>
    (Date.UTC(year, month - 1, day) - Date.UTC(1899, 11, 30)) / (24 * 60 * 60 * 1000);

  const datasets = {
    programs: [
      { 'Start Date': '01/05/2026', 'Program Enrolled': 'VI-SPDAT (Vulnerability Index)' }
    ],
    viSpdatReport: [
      {
        Date: excelSerial(2026, 1, 3),
        'Assessment Name': 'VI-SPDAT Prescreen for Single Adults [V2] with SCC local questions'
      },
      {
        Date: excelSerial(2026, 2, 14),
        'Assessment Name': 'VI-F-SPDAT Prescreen for Families [V2] with SCC local questions'
      },
      { Date: '2026-02-20 00:00:00', 'Assessment Name': '' },
      { Date: excelSerial(2026, 3, 31), 'Assessment Name': 'Housing Intake' },
      { Date: '', 'Assessment Name': 'VI-SPDAT Prescreen' },
      { Date: excelSerial(2026, 4, 2), 'Assessment Name': 'VI-Y-SPDAT Prescreen for Transition Age Youth' }
    ]
  };

  // The uploaded report gives 1 in Jan and 2 in Feb. The Clients & Programs VI-SPDAT row is not used.
  assert.deepEqual(benefitIncrease(datasets), [3, 1, 2, 0]);
});

test('VI-SPDAT falls back to Clients & Programs without a report upload', () => {
  const datasets = {
    programs: [
      { 'Start Date': '01/05/2026', 'Program Enrolled': 'VI-SPDAT (Vulnerability Index)' }
    ]
  };

  assert.deepEqual(benefitIncrease(datasets), [1, 1, 0, 0]);
});

test('matrixToRecords builds records from workbook rows and skips blank rows', () => {
  const records = matrixToRecords([
    ['Date', 'Assessment\nName', ''],
    ['', '', ''],
    [46025, 'VI-SPDAT Prescreen', 'extra']
  ]);

  assert.deepEqual(records, [
    { Date: 46025, 'Assessment Name': 'VI-SPDAT Prescreen', Column_2: 'extra' }
  ]);
});

test('parseCsv maps empty headers to Category/Column keys', () => {
  const parsed = parseCsv(',,Jan 2026\nApp,Sub,43\nComp,Sub,27\n');
  assert.deepEqual(parsed, [
    { Category: 'App', Column_1: 'Sub', 'Jan 2026': '43' },
    { Category: 'Comp', Column_1: 'Sub', 'Jan 2026': '27' }
  ]);
});

test('employment support report counts enrollments correctly based on fallback dates', () => {
  const datasets = {
    employmentSupport: [
      { 'Enrollment Start Date': '2026-01-15', 'Last Tagged Interaction At': '' },
      { 'Enrollment Start Date': '', 'Last Tagged Interaction At': '2026-02-10T12:00:00.000Z' },
      { 'Enrollment Start Date': '', 'Last Tagged Interaction At': '' },
      { 'Enrollment Start Date': '2026-04-01', 'Last Tagged Interaction At': '' }
    ]
  };

  const table = buildMetricsTable(datasets, { year: 2026, quarter: 1 });
  const row = table.rows.find(([name]) => name === 'Employment support');
  assert.deepEqual(row, ['Employment support', 2, 1, 1, 0]);
});

test('employed clients report counts hires correctly based on Date Employed with regex fallback', () => {
  const datasets = {
    employedClients: [
      { Name: 'A', 'Date Employed': '2/3/26' },
      { Name: 'B', 'Date Employed': '3/1/2026' },
      { Name: 'C', 'Date Employed': '1. 3/4/26\n2. ~14 years' },
      { Name: 'D', 'Date Employed': 'Pending' },
      { Name: 'E', 'Date Employed': 'Date Employed' },
      { Name: 'F', 'Date Employed': '4/27/26' }
    ]
  };

  const table = buildMetricsTable(datasets, { year: 2026, quarter: 1 });
  const row = table.rows.find(([name]) => name === 'Got hired');
  assert.deepEqual(row, ['Got hired', 3, 0, 1, 2]);
});

test('benefit applications count every program except Housing Solutions and Homelessness Prevention', () => {
  const datasets = {
    programs: [
      { 'Start Date': '01/05/2026', 'Program Enrolled': 'Employment Support' },
      { 'Start Date': '01/06/2026', 'Program Enrolled': 'TECHquity Fund' },
      { 'Start Date': '01/07/2026', 'Program Enrolled': 'SEA Fund Application' },
      { 'Start Date': '01/08/2026', 'Program Enrolled': 'CalFresh' },
      { 'Start Date': '01/09/2026', 'Program Enrolled': 'Housing Solution - PSH' },
      { 'Start Date': '01/10/2026', 'Program Enrolled': 'Homelessness Prevention' },
      { 'Start Date': '01/11/2026', 'Program Enrolled': 'UPLIFT Pass' }
    ]
  };

  // Four programs count. UPLIFT is counted from its fixed amount, not from program rows.
  assert.deepEqual(benefitIncrease(datasets), [4, 4, 0, 0]);
});

test('Affordable Housing applications counts submitted Airtable rows in range', () => {
  const datasets = {
    housingApplications: [
      { 'Date Submitted': '11/1/2025 11:16am', Status: 'Submitted' },
      { 'Date Submitted': '1/5/2026 10:00am', Status: 'Submitted' },
      { 'Date Submitted': '2/10/2026 9:00am', Status: 'Submitted' },
      { 'Date Submitted': '', Status: 'In Progress' },
      { 'Date Submitted': '3/3/2026 2:00pm', Status: 'Submitted', 'Test Application': '1 checked out of 1' }
    ]
  };

  const table = buildMetricsTable(datasets, { year: 2026, quarter: 1 });
  const row = table.rows.find(([name]) => name === 'Affordable Housing applications');
  assert.deepEqual(row, ['Affordable Housing applications', 2, 1, 1, 0]);
});

test('# of unique clients served counts distinct Record IDs as a running total', () => {
  const datasets = {
    programs: [
      { 'Record ID': 'c-1', 'Start Date': '01/05/2026', 'Program Enrolled': 'CalFresh' },
      { 'Record ID': 'c-1', 'Start Date': '01/20/2026', 'Program Enrolled': 'PSH' },
      { 'Record ID': ' c-2 ', 'Start Date': '03/10/2026', 'Program Enrolled': 'CalFresh' },
      { 'Record ID': '', 'Start Date': '03/11/2026', 'Program Enrolled': 'CalFresh' },
      { 'Record ID': 'c-3', 'Start Date': '05/02/2026', 'Program Enrolled': 'CalFresh' },
      { 'Record ID': 'c-4', 'Start Date': '12/05/2025', 'Program Enrolled': 'CalFresh' }
    ]
  };

  const table = buildMetricsTable(datasets, { year: 2026, quarter: 1 });
  const row = table.rows.find(([name]) => name === '# of unique clients served');
  assert.deepEqual(row, ['# of unique clients served', 2, 1, 1, 2]);
});

test('benefit applications and services adds UPLIFT, Caltrain, VI-SPDAT, and ID fee waivers', () => {
  const datasets = {
    programs: [
      { 'Start Date': '01/05/2026', 'Program Enrolled': 'CalFresh' },
      { 'Start Date': '01/06/2026', 'Program Enrolled': 'Housing Solution - PSH' },
      { 'Start Date': '02/01/2026', 'Program Enrolled': 'Homelessness Prevention' },
      { 'Start Date': '02/02/2026', 'Program Enrolled': 'Housing Solutions - Deposit & first month rent' },
      { 'Start Date': '03/03/2026', 'Program Enrolled': 'VI-SPDAT' },
      { 'Start Date': '01/07/2026', 'Program Enrolled': 'UPLIFT Pass' }
    ],
    idFeeWaiver: [
      { Timestamp: '1/10/2026 10:00:00' },
      { Timestamp: '2/10/2026 10:00:00' }
    ]
  };

  const table = buildMetricsTable(datasets, { year: 2026, quarter: 1 });
  const row = table.rows.find(([name]) => name === 'Benefit applications submitted and services provided');
  // Jan: 1 CalFresh + 1 ID waiver + UPLIFT 44 + Caltrain 9
  // Feb: 1 ID waiver + UPLIFT 44 + Caltrain 9
  // Mar: 1 VI-SPDAT + UPLIFT 44 + Caltrain 9
  // Q1: 1 CalFresh + 2 ID waivers + 1 VI-SPDAT + UPLIFT 130 + Caltrain 27
  assert.deepEqual(row, ['Benefit applications submitted and services provided', 161, 55, 54, 54]);
});

test('Caltrain 100 per year is spread across months so each quarter adds up', () => {
  const table = buildMetricsTable({}, { year: 2026, startMonth: 1, endMonth: 12 });
  const row = table.rows.find(([name]) => name === 'Benefit applications submitted and services provided');
  // Each quarter adds UPLIFT (130 per quarter) plus its Caltrain share: 27, 25, 24, 24 = 100 per year.
  assert.equal(row[1] - 130, 27);
  assert.equal(row[5] - 130, 25);
  assert.equal(row[9] - 130, 24);
  assert.equal(row[13] - 130, 24);
});

test('housing applications and retention count exact Program Enrolled matches in range', () => {
  const datasets = {
    programs: [
      { 'Start Date': '01/05/2026', 'Program Enrolled': 'Housing Solution - PSH' },
      { 'Start Date': '02/05/2026', 'Program Enrolled': 'Housing Solution -  HUD VASH' },
      { 'Start Date': '02/06/2026', 'Program Enrolled': 'housing solution - search' },
      { 'Start Date': '03/01/2026', 'Program Enrolled': 'Housing Solution - Housing Choice Voucher' },
      { 'Start Date': '03/02/2026', 'Program Enrolled': 'Housing Solution - PSH Plus' },
      { 'Start Date': '12/05/2025', 'Program Enrolled': 'Housing Solution - PSH' },
      { 'Start Date': '01/07/2026', 'Program Enrolled': 'Housing Solutions - Deposit & first month rent' },
      { 'Start Date': '02/10/2026', 'Program Enrolled': 'Housing Solution - Housing Retention' },
      { 'Start Date': '03/08/2026', 'Program Enrolled': 'Homelessness Prevention' }
    ]
  };

  const table = buildMetricsTable(datasets, { year: 2026, quarter: 1 });

  const applicationsRow = table.rows.find(([name]) => name === 'Housing applications - Data from Apricot');
  assert.deepEqual(applicationsRow, ['Housing applications - Data from Apricot', 4, 1, 2, 1]);

  const retentionRow = table.rows.find(([name]) => name === 'Housing retention');
  assert.deepEqual(retentionRow, ['Housing retention', 3, 1, 1, 1]);
});

test('viSpdatReport file spec allows multiple file uploads', () => {
  assert.equal(FILE_SPECS.viSpdatReport.multiple, true);
});

test('combineDatasets clubs multiple datasets into a single flat array', () => {
  const ds1 = [{ id: 1 }, { id: 2 }];
  const ds2 = [{ id: 3 }];
  const ds3 = [{ id: 4 }, { id: 5 }];
  assert.deepEqual(combineDatasets([ds1, ds2, ds3]), [
    { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }
  ]);
  assert.deepEqual(combineDatasets([]), []);
  assert.deepEqual(combineDatasets(null), []);
});

test('validateDatasets validates each dataset in a multi-file collection', () => {
  const valid1 = [{ Date: '01/01/2026', 'Assessment Name': 'VI-SPDAT' }];
  const valid2 = [{ Date: '02/01/2026', 'Assessment Name': 'VI-SPDAT' }];
  const invalid = [{ Name: 'Missing Date' }];

  const allValidResult = validateDatasets(FILE_SPECS.viSpdatReport, [
    { name: 'singles.csv', rows: valid1 },
    { name: 'families.csv', rows: valid2 }
  ]);
  assert.equal(allValidResult.ok, true);
  assert.equal(allValidResult.rowCount, 2);

  const mixedResult = validateDatasets(FILE_SPECS.viSpdatReport, [
    { name: 'singles.csv', rows: valid1 },
    { name: 'bad.csv', rows: invalid }
  ]);
  assert.equal(mixedResult.ok, false);
  assert.deepEqual(mixedResult.missingRequired, ['Date']);
});

test('VI-SPDAT clubs 3 CSV files together and calculates metrics across periods', () => {
  const csvSingles = [
    { Date: '01/10/2026', 'Assessment Name': 'VI-SPDAT Prescreen for Single Adults' },
    { Date: '02/12/2026', 'Assessment Name': 'VI-SPDAT Prescreen for Single Adults' }
  ];
  const csvFamilies = [
    { Date: '02/14/2026', 'Assessment Name': 'VI-F-SPDAT Prescreen for Families' },
    { Date: '03/20/2026', 'Assessment Name': 'VI-F-SPDAT Prescreen for Families' }
  ];
  const csvYouth = [
    { Date: '01/25/2026', 'Assessment Name': 'VI-Y-SPDAT Prescreen for Transition Age Youth' },
    { Date: '03/05/2026', 'Assessment Name': 'VI-Y-SPDAT Prescreen for Transition Age Youth' }
  ];

  const clubbed = combineDatasets([csvSingles, csvFamilies, csvYouth]);
  assert.equal(clubbed.length, 6);

  const datasets = {
    viSpdatReport: clubbed
  };

  assert.deepEqual(benefitIncrease(datasets), [6, 2, 2, 2]);
});
