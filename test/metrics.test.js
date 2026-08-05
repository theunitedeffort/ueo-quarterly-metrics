import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FILE_SPECS,
  buildMetricsTable,
  matrixToRecords,
  parseCsv,
  tableToClipboardHtml,
  tableToClipboardText,
  validateDataset
} from '../src/metrics.js';

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
    ['Total number of new clients entered into Apricot', 3, 1, 1, 1],
    ['Clients signed engagement letter', 2, 1, 1, 0],
    ['Active Clients', 1, 1, 0, 0],
    ['Semi-Active Clients', 1, 0, 1, 0],
    ['Housing support', 3, 1, 0, 2],
    ['Clients housed', 5, 2, 0, 3],
    ['Active Onsite Volunteers', 1, 2, 1, 1],
    ['Onsite Volunteer hours', 9.5, 6.5, 2, 1],
    ['Clients active in Self-Sufficiency Program', 2, 1, 2, 0],
    ['Benefits & services applications submitted', 1, 0, 1, 0],
    ['VI-SPDAT', 0, 0, 0, 0],
    ['Lifeline phone giveaway', 0, 0, 0, 0],
    ['ID fee waiver', 0, 0, 0, 0],
    ['Employment support provided', 0, 0, 0, 0],
    ['Clients who got hired', 0, 0, 0, 0]
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

  const benefitsRow = table.rows.find(
    ([name]) => name === 'Benefits & services applications submitted'
  );
  assert.deepEqual(benefitsRow, [
    'Benefits & services applications submitted',
    1,
    0,
    1
  ]);
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
      ['Onsite Volunteer hours', 5.5]
    ]
  });

  assert.equal(
    text,
    'Type of Metric\tQ1 2026\nHousing support\t4\nOnsite Volunteer hours\t5.50'
  );
});

test('tableToClipboardHtml creates an email-safe table with inline formatting', () => {
  const html = tableToClipboardHtml({
    headers: ['Type of Metric', 'Q1 <2026>'],
    rows: [
      ['Housing & support', 4],
      ['Onsite Volunteer hours', 5.5]
    ]
  });

  assert.match(html, /^<table style="[^"]*border-collapse: collapse;/);
  assert.match(html, /<th style="[^"]*background-color: #eef1f6;[^"]*">Q1 &lt;2026&gt;<\/th>/);
  assert.match(html, /<td style="[^"]*text-align: left;[^"]*">Housing &amp; support<\/td>/);
  assert.match(html, /<td style="[^"]*text-align: right;[^"]*">5\.50<\/td>/);
  assert.match(html, /<tr style="background-color: #fafbfe;">/);
  assert.doesNotMatch(html, /<style>/);
});

test('housing applications, ID fee waivers, and lifeline phone lists are counted correctly', () => {
  const datasets = {
    programs: [
      { 'Start Date': '01/05/2026', 'Program Enrolled': 'PSH' },
      { 'Start Date': '02/10/2026', 'Program Enrolled': 'Housing Solutions - VI-SPDAT' }
    ],
    housingApplications: [
      { 'Date Submitted': '01/15/2026', 'Test Application': '' },
      { 'Date Submitted': '02/20/2026', 'Test Application': 'Yes' },
      { 'Date Submitted': '02/25/2026', 'Test Application': 'no' }
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

  const table = buildMetricsTable(datasets, { year: 2026, quarter: 1 });

  const housingSupportRow = table.rows.find(([name]) => name === 'Housing support');
  assert.deepEqual(housingSupportRow, ['Housing support', 4, 2, 2, 0]);

  const viSpdatRow = table.rows.find(([name]) => name === 'VI-SPDAT');
  assert.deepEqual(viSpdatRow, ['VI-SPDAT', 1, 0, 1, 0]);

  const idWaiverRow = table.rows.find(([name]) => name === 'ID fee waiver');
  assert.deepEqual(idWaiverRow, ['ID fee waiver', 2, 1, 1, 0]);

  const lifelineRow = table.rows.find(([name]) => name === 'Lifeline phone giveaway');
  assert.deepEqual(lifelineRow, ['Lifeline phone giveaway', 30, 10, 20, 0]);

  const benefitsRow = table.rows.find(([name]) => name === 'Benefits & services applications submitted');
  assert.deepEqual(benefitsRow, ['Benefits & services applications submitted', 33, 11, 22, 0]);
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

  const table = buildMetricsTable(datasets, { year: 2026, quarter: 1 });
  const viSpdatRow = table.rows.find(([name]) => name === 'VI-SPDAT');
  assert.deepEqual(viSpdatRow, ['VI-SPDAT', 3, 1, 2, 0]);

  const benefitsRow = table.rows.find(
    ([name]) => name === 'Benefits & services applications submitted'
  );
  assert.deepEqual(benefitsRow, ['Benefits & services applications submitted', 3, 1, 2, 0]);
});

test('VI-SPDAT falls back to Clients & Programs without a report upload', () => {
  const datasets = {
    programs: [
      { 'Start Date': '01/05/2026', 'Program Enrolled': 'VI-SPDAT (Vulnerability Index)' }
    ]
  };

  const table = buildMetricsTable(datasets, { year: 2026, quarter: 1 });
  const viSpdatRow = table.rows.find(([name]) => name === 'VI-SPDAT');
  assert.deepEqual(viSpdatRow, ['VI-SPDAT', 1, 1, 0, 0]);
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
  const row = table.rows.find(([name]) => name === 'Employment support provided');
  assert.deepEqual(row, ['Employment support provided', 2, 1, 1, 0]);
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
  const row = table.rows.find(([name]) => name === 'Clients who got hired');
  assert.deepEqual(row, ['Clients who got hired', 3, 0, 1, 2]);
});
