import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FILE_SPECS,
  buildMetricsTable,
  parseCsv,
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
      { 'Start Date': '03/25/2026', 'Program Enrolled': 'UPLIFT' }
    ],
    housingApplications: [
      { 'Date Submitted': '01/12/2026 11:16am', 'Test Application': '' },
      { 'Date Submitted': '02/12/2026 11:16am', 'Test Application': 'checked' },
      { 'Date Submitted': '03/18/2026 1:00pm', 'Test Application': 'False' }
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
    ['Housing support', 4, 2, 0, 2],
    ['Active Onsite Volunteers', 1, 2, 1, 1],
    ['Onsite Volunteer hours', 9.5, 6.5, 2, 1],
    ['Clients active in Self-Sufficiency Program', 2, 1, 2, 0],
    ['Benefits and Services provided', 2, 0, 1, 1]
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
