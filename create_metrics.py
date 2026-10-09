import pandas as pd
import argparse
import calendar
import math
from datetime import datetime
import re
import os
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


def parse_report_args():
    parser = argparse.ArgumentParser(description="Generate UEO quarterly metrics.")
    parser.add_argument("--year", type=int, default=2026)
    parser.add_argument("--start-month", type=int, default=1, choices=range(1, 13))
    parser.add_argument("--end-month", type=int, default=12, choices=range(1, 13))
    args, _ = parser.parse_known_args()
    if args.start_month > args.end_month:
        args.start_month, args.end_month = args.end_month, args.start_month
    return args


report_args = parse_report_args()
report_year = report_args.year


def normalize_partial_date(value):
    """Normalize partial or noisy date strings like 2/?/2025 to valid dates."""
    if pd.isna(value):
        return value
    value = str(value).strip()
    if not value:
        return value

    components = re.findall(r"\d+", value)
    if not components:
        return value

    month = components[0]
    if len(components) >= 3:
        day = components[1]
        year = components[2]
    elif len(components) == 2:
        day = "1"
        year = components[1]
    else:
        return value

    year = year[:4]

    try:
        month_int = max(1, min(12, int(month)))
    except ValueError:
        return value

    try:
        day_int = int(day) if day else 1
    except ValueError:
        day_int = 1

    if day_int < 1:
        day_int = 1
    if day_int > 31:
        day_int = 31

    try:
        datetime(int(year), month_int, day_int)
    except ValueError:
        day_int = 1

    return f"{month_int}/{day_int}/{year}"


# Read the CSV files still needed for report generation.
clients_csv_file = "Clients_Information.csv"
housed_file = "Housed.csv"
clients_programs_file = "Clients_&_Programs.csv"
df_clients = pd.read_csv(clients_csv_file)
df_housed = pd.read_csv(housed_file)
df_clients_programs = pd.read_csv(clients_programs_file)

# Read optional CSV files if they exist, otherwise initialize as empty DataFrames.
housing_apps_file = "Housing_Applications.csv"
if not os.path.exists(housing_apps_file):
    if os.path.exists("Housing_Applications_anonymized.csv"):
        housing_apps_file = "Housing_Applications_anonymized.csv"
    elif os.path.exists("housing applications airtable.csv"):
        housing_apps_file = "housing applications airtable.csv"

if os.path.exists(housing_apps_file):
    df_housing_apps = pd.read_csv(housing_apps_file)
else:
    df_housing_apps = pd.DataFrame(columns=["Date Submitted"])

id_fee_waiver_file = "ID_Fee_Waiver_Tracking__Responses.csv"
if not os.path.exists(id_fee_waiver_file):
    if os.path.exists("ID_Fee_Waiver_Tracking_Responses.csv"):
        id_fee_waiver_file = "ID_Fee_Waiver_Tracking_Responses.csv"
    elif os.path.exists("ID Fee Waiver.csv"):
        id_fee_waiver_file = "ID Fee Waiver.csv"

if os.path.exists(id_fee_waiver_file):
    df_id_fee_waiver = pd.read_csv(id_fee_waiver_file)
else:
    df_id_fee_waiver = pd.DataFrame(columns=["Timestamp"])

lifeline_file = "LifeLine Phone List.csv"
if not os.path.exists(lifeline_file):
    if os.path.exists("LifeLine_Phone_List.csv"):
        lifeline_file = "LifeLine_Phone_List.csv"

if os.path.exists(lifeline_file):
    df_lifeline = pd.read_csv(lifeline_file, header=None)
else:
    df_lifeline = pd.DataFrame()

employment_file = "employment_support_engagement_report.csv"
if not os.path.exists(employment_file):
    if os.path.exists("employment_support_engagement_report_anonymized.csv"):
        employment_file = "employment_support_engagement_report_anonymized.csv"

if os.path.exists(employment_file):
    df_employment = pd.read_csv(employment_file)
else:
    df_employment = pd.DataFrame(columns=["Enrollment Start Date", "Last Tagged Interaction At"])

employed_file = "Employed_Clients.csv"
if not os.path.exists(employed_file):
    if os.path.exists("Employed_Clients___2026.csv"):
        employed_file = "Employed_Clients___2026.csv"

if os.path.exists(employed_file):
    df_employed = pd.read_csv(employed_file)
else:
    df_employed = pd.DataFrame(columns=["Name", "Date Employed"])

def fetch_airtable_data(base_id, table_id, token, view_id=None):
    """Fetch all records from an Airtable table, handling pagination."""
    url = f"https://api.airtable.com/v0/{base_id}/{table_id}"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    all_records = []
    offset = None

    while True:
        params = {}
        if offset:
            params["offset"] = offset
        if view_id:
            params["view"] = view_id

        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()

        all_records.extend(data.get("records", []))

        offset = data.get("offset")
        if not offset:
            break

    # Convert Airtable records to flat dictionary format
    flat_records = []
    for record in all_records:
        flat_record = {"record_id": record["id"]}
        flat_record.update(record.get("fields", {}))
        flat_records.append(flat_record)

    return pd.DataFrame(flat_records)


# Fetch data from Airtable
print("Fetching data from Airtable...")
airtable_token = os.getenv("AIRTABLE_TOKEN")
if not airtable_token:
    raise ValueError("AIRTABLE_TOKEN not found in environment variables")

airtable_base_id = "appHxVZoItPM2Xq7E"

# Fetch Event Attendance Volunteers data
volunteers_table_id = "tbl7ePbU3BVJK9x0l"
df_volunteers = fetch_airtable_data(
    "appqOF4YYlalhY8so", volunteers_table_id, airtable_token
)
print(f"Fetched {len(df_volunteers)} Event Attendance Volunteer records from Airtable")
print(f"Volunteer columns: {df_volunteers.columns.tolist()}")
print(f"First few volunteer records:\n{df_volunteers.head()}")

# Unwrap list fields returned by Airtable (linked/lookup fields come as lists)
for col in [
    "Event Date",
    "Volunteer ID",
    "Intended Arrival Time",
    "Intended Departure Time",
]:
    if col in df_volunteers.columns:
        df_volunteers[col] = df_volunteers[col].apply(
            lambda x: x[0] if isinstance(x, list) and len(x) > 0 else x
        )

# Fetch Bridge Assessments (individual assessment records)
bridge_assessments_table_id = "tblTGRzRsBpEDXLOk"
bridge_assessments_view_id = "viwGLOsa6EB3tsMGa"
df_bridge_assessments = fetch_airtable_data(
    airtable_base_id,
    bridge_assessments_table_id,
    airtable_token,
    view_id=bridge_assessments_view_id,
)
print(f"Fetched {len(df_bridge_assessments)} Bridge Assessment records from Airtable")

# Fetch General Interactions
general_interactions_table_id = "tbla8yxSQjPkYAWYK"
general_interactions_view_id = "viw6pnZfm4oVtL782"
df_general_interactions = fetch_airtable_data(
    airtable_base_id,
    general_interactions_table_id,
    airtable_token,
    view_id=general_interactions_view_id,
)
print(
    f"Fetched {len(df_general_interactions)} General Interaction records from Airtable"
)

# Filter out test data from both tables
if "Test Data" in df_bridge_assessments.columns:
    df_bridge_assessments = df_bridge_assessments[
        df_bridge_assessments["Test Data"].apply(
            lambda x: x != [True] and not x if pd.notna(x) else True
        )
    ]
if "Test Data" in df_general_interactions.columns:
    df_general_interactions = df_general_interactions[
        df_general_interactions["Test Data"].apply(
            lambda x: x != [True] and not x if pd.notna(x) else True
        )
    ]

# Parse Assessment Time in bridge assessments
# Airtable timestamps are already in Pacific time, just need to parse and strip timezone
df_bridge_assessments["Assessment Time"] = pd.to_datetime(
    df_bridge_assessments["Assessment Time"], errors="coerce"
)
if df_bridge_assessments["Assessment Time"].dt.tz is not None:
    df_bridge_assessments["Assessment Time"] = df_bridge_assessments[
        "Assessment Time"
    ].dt.tz_localize(None)

# Parse Interaction Time in general interactions
# Airtable timestamps are already in Pacific time, just need to parse and strip timezone
df_general_interactions["Interaction Time"] = pd.to_datetime(
    df_general_interactions["Interaction Time"], errors="coerce"
)
if df_general_interactions["Interaction Time"].dt.tz is not None:
    df_general_interactions["Interaction Time"] = df_general_interactions[
        "Interaction Time"
    ].dt.tz_localize(None)

# Extract client record IDs (they come as lists from Airtable)
df_bridge_assessments["Client Record ID"] = df_bridge_assessments[
    "Client Record ID"
].apply(lambda x: x[0] if isinstance(x, list) and len(x) > 0 else x)
df_general_interactions["Client Record ID"] = df_general_interactions["Client"].apply(
    lambda x: x[0] if isinstance(x, list) and len(x) > 0 else x
)

# Parse the "Creation Date" column to datetime
df_clients["Creation Date"] = pd.to_datetime(
    df_clients["Creation Date"], format="%m/%d/%Y %I:%M %p", errors="coerce"
)

df_housed.columns = [
    col.replace("\r\n", " ").replace("\n", " ").replace("\r", " ").strip()
    for col in df_housed.columns
]
df_housed = df_housed[
    df_housed["Name"].notna() & (df_housed["Name"].astype(str).str.strip() != "")
]
df_housed["Date Housed"] = df_housed["Date Housed"].apply(normalize_partial_date)
df_housed["Date Housed"] = pd.to_datetime(
    df_housed["Date Housed"], format="%m/%d/%Y", errors="coerce"
)

housed_value_columns = [
    "PSH",
    "HCV",
    "VASH",
    "RRH",
    "Home Sharing",
    "Affordable Apt",
    "Section 8 Interest List",
    "Commercial Rate",
]
for column in housed_value_columns:
    if column not in df_housed.columns:
        df_housed[column] = 0
    df_housed[column] = pd.to_numeric(df_housed[column], errors="coerce").fillna(0)

# Filter out test data from volunteers
if "Test Data" in df_volunteers.columns:
    df_volunteers = df_volunteers[
        df_volunteers["Test Data"].apply(
            lambda x: (
                x != [True] and not x and x != "checked" if pd.notna(x) else True
            )
        )
    ]

# Parse the "Event Date" column to datetime
df_volunteers["Event Date"] = pd.to_datetime(
    df_volunteers["Event Date"], errors="coerce"
)

# Parse Intended Arrival and Departure Times for volunteer hours calculation
df_volunteers["Intended Arrival Time"] = pd.to_datetime(
    df_volunteers["Intended Arrival Time"], errors="coerce"
)
df_volunteers["Intended Departure Time"] = pd.to_datetime(
    df_volunteers["Intended Departure Time"], errors="coerce"
)

# Calculate Shift Hours from Intended Arrival and Departure Times
# Use Intended times to calculate hours
df_volunteers["Shift Hours"] = pd.to_numeric(
    df_volunteers["Shift Hours"], errors="coerce"
)
calculated_hours = (
    df_volunteers["Intended Departure Time"] - df_volunteers["Intended Arrival Time"]
).dt.total_seconds() / 3600
mask_missing_hours = df_volunteers["Shift Hours"].isna()
df_volunteers.loc[mask_missing_hours, "Shift Hours"] = calculated_hours[
    mask_missing_hours
]
print(
    f"Calculated shift hours for {mask_missing_hours.sum()} records from Intended Arrival/Departure Times"
)

# Parse the "Start Date" column in clients_programs to datetime
df_clients_programs["Start Date"] = df_clients_programs["Start Date"].apply(
    normalize_partial_date
)
df_clients_programs["Start Date"] = pd.to_datetime(
    df_clients_programs["Start Date"], format="%m/%d/%Y", errors="coerce"
)


def clean_test_rows(df, test_cols=["Test Data", "Test Client", "Test Application"]):
    if df.empty:
        return df
    mask = pd.Series(True, index=df.index)
    for col in test_cols:
        if col in df.columns:
            values = df[col].astype(str).str.strip().str.lower()
            # Airtable exports checked boxes as text such as "1 checked out of 1".
            is_affirmative = values.isin(["true", "yes", "y", "1"]) | values.str.contains(r"\bchecked\b", regex=True)
            mask = mask & ~is_affirmative
    return df[mask]


df_housing_apps = clean_test_rows(df_housing_apps)
df_id_fee_waiver = clean_test_rows(df_id_fee_waiver)

if "Date Submitted" in df_housing_apps.columns:
    # format="mixed" parses each value on its own; the default format is inferred from the first row only.
    df_housing_apps["Date Submitted"] = pd.to_datetime(
        df_housing_apps["Date Submitted"], errors="coerce", format="mixed"
    )

if "Timestamp" in df_id_fee_waiver.columns:
    df_id_fee_waiver["Timestamp"] = pd.to_datetime(
        df_id_fee_waiver["Timestamp"], errors="coerce"
    )

df_employment = clean_test_rows(df_employment)

if "Enrollment Start Date" in df_employment.columns:
    df_employment["Enrollment Start Date"] = pd.to_datetime(
        df_employment["Enrollment Start Date"], errors="coerce"
    ).dt.tz_localize(None)

if "Last Tagged Interaction At" in df_employment.columns:
    df_employment["Last Tagged Interaction At"] = pd.to_datetime(
        df_employment["Last Tagged Interaction At"], errors="coerce"
    ).dt.tz_localize(None)

# Program Enrolled values (exact match, ignoring case and extra spaces) for the
# "Housing applications - Data from Apricot" and "Housing retention" metrics.
housing_application_programs = [
    "Housing Solution - PSH",
    "Housing Solution - RRH",
    "Housing Solution - HUD VASH",
    "Housing Solution - Section 8 interest list",
    "Housing Solution - Housing Choice Voucher",
    "Housing Solution - Search",
    "Housing Solution - Home Sharing",
]

housing_retention_programs = [
    "Housing Solutions - Deposit & first month rent",
    "Housing Solution - Housing Recertification",
    "Housing Solution - Housing Retention",
    "Homelessness Prevention",
]

# Filter for report year
df_2026 = df_clients[df_clients["Creation Date"].dt.year == report_year]
df_housed_2026 = df_housed[df_housed["Date Housed"].dt.year == report_year]
df_volunteers_2026 = df_volunteers[df_volunteers["Event Date"].dt.year == report_year]
df_clients_programs_2026 = df_clients_programs[
    df_clients_programs["Start Date"].dt.year == report_year
]

df_housing_apps_2026 = pd.DataFrame(columns=df_housing_apps.columns)
if not df_housing_apps.empty and "Date Submitted" in df_housing_apps.columns:
    df_housing_apps_2026 = df_housing_apps[df_housing_apps["Date Submitted"].dt.year == report_year]

df_id_fee_waiver_2026 = pd.DataFrame(columns=df_id_fee_waiver.columns)
if not df_id_fee_waiver.empty and "Timestamp" in df_id_fee_waiver.columns:
    df_id_fee_waiver_2026 = df_id_fee_waiver[df_id_fee_waiver["Timestamp"].dt.year == report_year]

df_employment["Date"] = pd.NaT
if not df_employment.empty:
    start_col = df_employment.get("Enrollment Start Date")
    interaction_col = df_employment.get("Last Tagged Interaction At")
    if start_col is not None and interaction_col is not None:
        df_employment["Date"] = start_col.fillna(interaction_col)
    elif start_col is not None:
        df_employment["Date"] = start_col
    elif interaction_col is not None:
        df_employment["Date"] = interaction_col

df_employment_2026 = pd.DataFrame(columns=df_employment.columns)
if not df_employment.empty:
    df_employment_2026 = df_employment[df_employment["Date"].dt.year == report_year]

df_employed = clean_test_rows(df_employed)

def parse_employed_date(val):
    if pd.isna(val):
        return None
    val_str = str(val).strip()
    if not val_str or val_str.lower() in ["pending", "date employed"]:
        return None
    match = re.search(r"\b(\d{1,2})/(\d{1,2})/(\d{2,4})\b", val_str)
    if match:
        m, d, y = match.groups()
        if len(y) == 2:
            y = "20" + y
        try:
            return datetime(int(y), int(m), int(d))
        except ValueError:
            return None
    return None

df_employed["Parsed Date"] = pd.NaT
if not df_employed.empty and "Date Employed" in df_employed.columns:
    df_employed["Parsed Date"] = df_employed["Date Employed"].apply(parse_employed_date)

df_employed_2026 = pd.DataFrame(columns=df_employed.columns)
if not df_employed.empty:
    df_employed_2026 = df_employed[df_employed["Parsed Date"].dt.year == report_year]

def count_in_range(
    df, start_date, end_date, date_col="Creation Date", filter_col=None, filter_val=None
):
    """Count records in a date range, optionally filtering by column."""
    filtered = df[(df[date_col] >= start_date) & (df[date_col] <= end_date)]
    if filter_col is not None:
        filtered = filtered[filtered[filter_col] == filter_val]
    return len(filtered)


def count_exact_programs(df, start_date, end_date, programs_list):
    """Count entries where Program Enrolled exactly matches one of the programs,
    ignoring case and extra whitespace."""
    if df.empty or "Program Enrolled" not in df.columns:
        return 0
    period_mask = (df["Start Date"] >= start_date) & (df["Start Date"] <= end_date)
    normalized = (
        df["Program Enrolled"].fillna("").astype(str).str.split().str.join(" ").str.lower()
    )
    targets = {" ".join(prog.split()).lower() for prog in programs_list}
    return int((period_mask & normalized.isin(targets)).sum())


def count_unique_clients_served(df, end_date):
    """Count unique Record IDs with a Start Date on or before end_date.
    The df is already limited to the report year, so this is a running total."""
    if df.empty or "Record ID" not in df.columns:
        return 0
    served = df[df["Start Date"] <= end_date]
    record_ids = served["Record ID"].dropna().astype(str).str.strip()
    return int(record_ids[record_ids != ""].nunique())


benefit_services_excluded_programs = [
    "Homelessness Prevention",
    "Housing Solution",
    "VI-SPDAT",
    "UPLIFT",
    "LifeLine",
    "Caltrain",
    "ID fee waiver",
]

UPLIFT_QUARTERLY_TOTAL = 130
UPLIFT_MONTHLY_AMOUNT = math.ceil(UPLIFT_QUARTERLY_TOTAL / 3)
CALTRAIN_YEARLY_TOTAL = 100


def count_benefit_services_programs(df, start_date, end_date):
    """Count program enrollments that start in the range, excluding housing solution,
    homelessness prevention, and programs counted separately."""
    if df.empty:
        return 0
    filtered = df[(df["Start Date"] >= start_date) & (df["Start Date"] <= end_date)]
    if filtered.empty:
        return 0
    pattern = "|".join([re.escape(prog) for prog in benefit_services_excluded_programs])
    excluded = filtered["Program Enrolled"].str.contains(pattern, case=False, na=False)
    return int((~excluded).sum())


def caltrain_monthly_amount(month):
    """Spread the yearly Caltrain total across 12 months (month is 1-12).
    Any remainder goes to the first months."""
    base, extra = divmod(CALTRAIN_YEARLY_TOTAL, 12)
    return base + (1 if month <= extra else 0)


def fixed_benefit_amount(period):
    """UPLIFT (130 per quarter, 1/3 rounded up per month) plus Caltrain for the period."""
    uplift = UPLIFT_QUARTERLY_TOTAL if period["type"] == "quarter" else UPLIFT_MONTHLY_AMOUNT
    return uplift + sum(caltrain_monthly_amount(month) for month in period["months"])


ACTIVE_VOLUNTEER_START = datetime(2025, 1, 1)


def count_active_volunteers(df, period):
    """Volunteers with a shift in each of the 3 months ending with the period's last month.
    Only months from January 2025 onward count."""
    last_month_abs = period["year"] * 12 + period["months"][-1] - 1
    month_sets = []
    for offset in range(2, -1, -1):
        year, month_index = divmod(last_month_abs - offset, 12)
        month_start, month_end = month_bounds(year, month_index + 1)
        if month_start < ACTIVE_VOLUNTEER_START:
            return 0
        in_month = df[
            (df["Event Date"] >= month_start)
            & (df["Event Date"] <= month_end)
            & df["Volunteer ID"].notna()
        ]
        month_sets.append(set(in_month["Volunteer ID"].astype(str).str.strip()))
    return len(set.intersection(*month_sets))


def count_housing_applications(df, start_date, end_date):
    if df.empty or "Date Submitted" not in df.columns:
        return 0
    filtered = df[(df["Date Submitted"] >= start_date) & (df["Date Submitted"] <= end_date)]
    return len(filtered)


def count_employment_support(df, start_date, end_date):
    if df.empty or "Date" not in df.columns:
        return 0
    filtered = df[(df["Date"] >= start_date) & (df["Date"] <= end_date)]
    return len(filtered)


def count_employed_clients(df, start_date, end_date):
    if df.empty or "Parsed Date" not in df.columns:
        return 0
    filtered = df[(df["Parsed Date"] >= start_date) & (df["Parsed Date"] <= end_date)]
    return len(filtered)


def count_id_fee_waivers(df, start_date, end_date):
    if df.empty or "Timestamp" not in df.columns:
        return 0
    filtered = df[(df["Timestamp"] >= start_date) & (df["Timestamp"] <= end_date)]
    return len(filtered)


def count_vi_spdat(df, start_date, end_date):
    if df.empty or "Start Date" not in df.columns:
        return 0
    pattern = re.escape("VI-SPDAT")
    matches = df["Program Enrolled"].str.contains(pattern, case=False, na=False)
    filtered = df[(df["Start Date"] >= start_date) & (df["Start Date"] <= end_date) & matches]
    return len(filtered)


def get_lifeline_count(df, period):
    if df.empty:
        return 0
    target_row = None
    for idx, row in df.iterrows():
        val = str(row.iloc[0]).strip()
        if val == "Monthly Total Applications":
            target_row = row
            break
    if target_row is None:
        return 0

    total_applications = 0
    header_row = df.iloc[0]
    for month in period["months"]:
        month_name = calendar.month_name[month]
        month_col_label = f"{month_name} {period['year']}"
        col_idx = None
        for i, val in enumerate(header_row):
            if str(val).strip().lower() == month_col_label.lower():
                col_idx = i
                break
        if col_idx is not None:
            try:
                val = target_row.iloc[col_idx]
                total_applications += int(float(val)) if pd.notna(val) else 0
            except (ValueError, TypeError):
                pass
    return total_applications

def count_ssp_active_clients(
    df_assessments, df_interactions, start_date, end_date, period_label=None
):
    """Count clients active in Self-Sufficiency Program during a time window.

    A client is considered active in SSP for a quarter if:
    - They had at least one interaction (Bridge Assessment or General Interaction)
      during the quarter
    - AND they have at least one Bridge Assessment on or before the quarter end
      (confirms they're an SSP client, not just someone with general interactions)

    This is non-cumulative - only counts activity within the specified time window.
    """
    # Get clients with bridge assessments during the quarter
    assessments_in_period = df_assessments[
        (df_assessments["Assessment Time"] >= start_date)
        & (df_assessments["Assessment Time"] <= end_date)
    ]
    clients_with_assessments_in_period = set(
        assessments_in_period["Client Record ID"].dropna().unique()
    )

    # Get clients with general interactions during the quarter
    interactions_in_period = df_interactions[
        (df_interactions["Interaction Time"] >= start_date)
        & (df_interactions["Interaction Time"] <= end_date)
    ]
    clients_with_interactions_in_period = set(
        interactions_in_period["Client Record ID"].dropna().unique()
    )

    # All clients with any activity during the quarter
    clients_with_activity = (
        clients_with_assessments_in_period | clients_with_interactions_in_period
    )

    # Get clients who have at least one bridge assessment by end of quarter
    # (confirms they're an SSP client)
    assessments_by_end = df_assessments[df_assessments["Assessment Time"] <= end_date]
    clients_with_any_assessment = set(
        assessments_by_end["Client Record ID"].dropna().unique()
    )

    # Final count: clients with activity during quarter AND have a bridge assessment
    active_clients = clients_with_activity & clients_with_any_assessment

    if period_label:
        print(f"\n--- SSP Active Clients: {period_label} ---")
        print(
            f"  Clients with assessments in period: {len(clients_with_assessments_in_period)}"
        )
        print(
            f"  Clients with interactions in period: {len(clients_with_interactions_in_period)}"
        )
        print(f"  Total unique clients with activity: {len(clients_with_activity)}")
        print(
            f"  Clients with any bridge assessment by end: {len(clients_with_any_assessment)}"
        )
        print(f"  Final count (with activity AND assessment): {len(active_clients)}")

        # Print client names if we can look them up
        if active_clients:
            # Get names from assessments dataframe
            client_records = df_assessments[
                df_assessments["Client Record ID"].isin(active_clients)
            ][["Client Record ID", "Full Name"]]
            # Get unique client names
            seen_clients = set()
            for _, row in client_records.iterrows():
                client_id = row["Client Record ID"]
                if client_id in seen_clients:
                    continue
                seen_clients.add(client_id)
                name = row["Full Name"]
                if isinstance(name, list):
                    name = name[0] if name else "Unknown"
                print(f"    - {name}")

    return len(active_clients)


def count_clients_housed(df, start_date, end_date):
    """Sum housed client counts across the housing placement columns."""
    filtered = df[(df["Date Housed"] >= start_date) & (df["Date Housed"] <= end_date)]
    if filtered.empty:
        return 0
    return int(filtered[housed_value_columns].sum().sum())


def month_bounds(year, month):
    """Return start/end datetimes that cover a full calendar month."""
    last_day = calendar.monthrange(year, month)[1]
    return datetime(year, month, 1), datetime(year, month, last_day, 23, 59, 59)


def build_periods(year, start_month=1, end_month=12):
    """Build full-quarter columns and selected month columns for a report year."""
    periods = []
    for quarter in range(1, 5):
        quarter_start_month = (quarter - 1) * 3 + 1
        quarter_end_month = quarter * 3
        selected_months = [
            month
            for month in range(quarter_start_month, quarter_end_month + 1)
            if start_month <= month <= end_month
        ]
        if not selected_months:
            continue

        if len(selected_months) == 3:
            start_date, _ = month_bounds(year, quarter_start_month)
            _, end_date = month_bounds(year, quarter_end_month)
            periods.append(
                {
                    "label": f"Q{quarter} {year}",
                    "start_date": start_date,
                    "end_date": end_date,
                    "type": "quarter",
                    "months": selected_months,
                    "year": year,
                }
            )

        for month in selected_months:
            month_start, month_end = month_bounds(year, month)
            periods.append(
                {
                    "label": f"{calendar.month_name[month]} {year}",
                    "start_date": month_start,
                    "end_date": month_end,
                    "type": "month",
                    "months": [month],
                    "year": year,
                }
            )

    return periods


def count_status_clients(df, start_date, end_date, status):
    filtered = df[
        (df["Creation Date"] >= start_date)
        & (df["Creation Date"] <= end_date)
        & (df["Client Status"] == status)
        & (df["Client Engagement Letter"] == "Yes")
    ]
    return len(filtered)


def sum_volunteer_hours(df, start_date, end_date):
    hours = df[(df["Event Date"] >= start_date) & (df["Event Date"] <= end_date)][
        "Shift Hours"
    ].sum()
    return 0 if pd.isna(hours) else hours



def calculate_period_metrics(period):
    start_date = period["start_date"]
    end_date = period["end_date"]

    benefit_programs_count = count_benefit_services_programs(
        df_clients_programs_2026, start_date, end_date
    )
    vi_spdat_count = int(count_vi_spdat(df_clients_programs_2026, start_date, end_date))
    id_fee_waiver_count = int(count_id_fee_waivers(df_id_fee_waiver_2026, start_date, end_date))
    lifeline_count = int(get_lifeline_count(df_lifeline, period))
    benefit_services_count = (
        benefit_programs_count
        + vi_spdat_count
        + id_fee_waiver_count
        + lifeline_count
        + fixed_benefit_amount(period)
    )

    housing_applications_apricot_count = int(
        count_exact_programs(
            df_clients_programs_2026,
            start_date,
            end_date,
            housing_application_programs,
        )
    )
    housing_retention_count = int(
        count_exact_programs(
            df_clients_programs_2026,
            start_date,
            end_date,
            housing_retention_programs,
        )
    )

    employment_support_count = int(
        count_employment_support(df_employment_2026, start_date, end_date)
    )
    employed_clients_count = int(
        count_employed_clients(df_employed_2026, start_date, end_date)
    )

    return [
        int(count_in_range(df_2026, start_date, end_date)),
        int(
            count_in_range(
                df_2026,
                start_date,
                end_date,
                filter_col="Client Engagement Letter",
                filter_val="Yes",
            )
        ),
        int(count_status_clients(df_2026, start_date, end_date, "Active")),
        int(count_status_clients(df_2026, start_date, end_date, "Semi Active")),
        int(count_unique_clients_served(df_clients_programs_2026, end_date)),
        benefit_services_count,
        int(count_housing_applications(df_housing_apps_2026, start_date, end_date)),
        housing_applications_apricot_count,
        housing_retention_count,
        int(count_clients_housed(df_housed_2026, start_date, end_date)),
        employment_support_count,
        employed_clients_count,
        int(
            count_ssp_active_clients(
                df_bridge_assessments,
                df_general_interactions,
                start_date,
                end_date,
                period["label"],
            )
        ),
        count_active_volunteers(df_volunteers, period),
        sum_volunteer_hours(df_volunteers_2026, start_date, end_date),
    ]


periods = build_periods(report_year, report_args.start_month, report_args.end_month)
metric_names = [
    "New clients we entered in Apricot",
    "New clients who signed engagement letters",
    "Active clients (Total)",
    "Semi-active clients",
    "# of unique clients served",
    "Benefit applications submitted and services provided",
    "Affordable Housing applications",
    "Housing applications - Data from Apricot",
    "Housing retention",
    "Housed: Clients we helped got housing",
    "Employment support",
    "Got hired",
    "Clients active in Self-Sufficiency Program",
    "Active volunteers",
    "Volunteer hours (onsite only)",
]

metrics_data = {"Type of Metric": metric_names}
for period in periods:
    metrics_data[period["label"]] = calculate_period_metrics(period)

metrics_df = pd.DataFrame(metrics_data)

# Format columns - convert to int for all except Volunteer hours (onsite only).
for period in periods:
    col = period["label"]
    formatted_col = []
    for idx, metric_name in enumerate(metrics_df["Type of Metric"]):
        value = metrics_df.loc[idx, col]
        if metric_name == "Volunteer hours (onsite only)":
            formatted_col.append(value)
        else:
            formatted_col.append(int(value))
    metrics_df[col] = formatted_col

# Export to CSV with custom formatting.
output_file = "quarterly_metrics.csv"
columns = ["Type of Metric"] + [period["label"] for period in periods]
with open(output_file, "w") as f:
    f.write(",".join(columns) + "\n")
    for _, row in metrics_df.iterrows():
        values = [row["Type of Metric"]]
        for period in periods:
            value = row[period["label"]]
            if row["Type of Metric"] == "Volunteer hours (onsite only)":
                values.append(str(round(value, 2)))
            else:
                values.append(str(int(value)))
        f.write(",".join(values) + "\n")

print(f"\nQuarterly Metrics for {report_year}:")
print(metrics_df.to_string(index=False))
print(f"\nMetrics exported to {output_file}")
