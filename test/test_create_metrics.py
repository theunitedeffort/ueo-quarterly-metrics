import importlib.util
from pathlib import Path
import sys

import pandas as pd


def test_create_metrics_exports_each_2026_month_and_quarter(tmp_path, monkeypatch):
    repo_root = Path(__file__).resolve().parents[1]
    script_path = repo_root / "create_metrics.py"
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("AIRTABLE_TOKEN", "test-token")

    def fake_read_csv(path):
        if path == "Clients_Information.csv":
            return pd.DataFrame(
                [
                    {
                        "Creation Date": "01/10/2026 9:00 AM",
                        "Client Engagement Letter": "Yes",
                        "Client Status": "Active",
                    },
                    {
                        "Creation Date": "04/10/2026 9:00 AM",
                        "Client Engagement Letter": "Yes",
                        "Client Status": "Semi Active",
                    },
                    {
                        "Creation Date": "12/10/2026 9:00 AM",
                        "Client Engagement Letter": "No",
                        "Client Status": "Active",
                    },
                ]
            )
        if path == "Housed.csv":
            return pd.DataFrame(
                [
                    {
                        "Name": "client-a",
                        "Date Housed": "1/10/2026",
                        "PSH": "2",
                        "HCV": "",
                        "VASH": "",
                        "RRH": "",
                        "Home Sharing": "",
                        "Affordable\nApt": "",
                        "Section 8 Interest List": "",
                        "Commercial Rate": "",
                    },
                    {
                        "Name": "client-b",
                        "Date Housed": "4/10/2026",
                        "PSH": "",
                        "HCV": "1",
                        "VASH": "",
                        "RRH": "",
                        "Home Sharing": "",
                        "Affordable\nApt": "3",
                        "Section 8 Interest List": "",
                        "Commercial Rate": "",
                    },
                    {
                        "Name": "",
                        "Date Housed": "4/12/2026",
                        "PSH": "",
                        "HCV": "",
                        "VASH": "",
                        "RRH": "9",
                        "Home Sharing": "",
                        "Affordable\nApt": "",
                        "Section 8 Interest List": "",
                        "Commercial Rate": "",
                    },
                ]
            )
        if path == "Clients_&_Programs.csv":
            return pd.DataFrame(
                [
                    {"Start Date": "01/05/2026", "Program Enrolled": "CalFresh"},
                    {"Start Date": "04/05/2026", "Program Enrolled": "PSH"},
                    {
                        "Start Date": "04/06/2026",
                        "Program Enrolled": (
                            "Housing Solutions - Affordable Housing Waitlist Application"
                        ),
                    },
                    {"Start Date": "10/05/2026", "Program Enrolled": "CalFresh"},
                    {"Start Date": "10/06/2026", "Program Enrolled": "MyConnectSV"},
                    {"Start Date": "10/07/2026", "Program Enrolled": "LifeLine Phone"},
                    {
                        "Record ID": "c-1",
                        "Start Date": "01/08/2026",
                        "Program Enrolled": "Housing Solution - PSH",
                    },
                    {
                        "Record ID": "c-1",
                        "Start Date": "01/09/2026",
                        "Program Enrolled": "Housing Solutions - Deposit & first month rent",
                    },
                    {
                        "Record ID": "c-2",
                        "Start Date": "03/07/2026",
                        "Program Enrolled": "housing solution -  section 8 interest list",
                    },
                    {
                        "Record ID": "c-3",
                        "Start Date": "03/08/2026",
                        "Program Enrolled": "Homelessness Prevention",
                    },
                    {
                        "Record ID": "c-3",
                        "Start Date": "03/09/2026",
                        "Program Enrolled": "Housing Solution - PSH Plus",
                    },
                ]
            )
        raise AssertionError(f"Unexpected CSV read: {path}")

    class FakeResponse:
        def __init__(self, records):
            self.records = records

        def raise_for_status(self):
            return None

        def json(self):
            return {"records": self.records}

    def fake_get(url, headers=None, params=None):
        if "tbl7ePbU3BVJK9x0l" in url:
            return FakeResponse(
                [
                    {
                        "id": "vol-jan",
                        "fields": {
                            "Event Date": "2026-01-20",
                            "Volunteer ID": "vol-a",
                            "Shift Hours": 2,
                            "Intended Arrival Time": "2026-01-20T09:00:00",
                            "Intended Departure Time": "2026-01-20T11:00:00",
                        },
                    },
                    {
                        "id": "vol-apr",
                        "fields": {
                            "Event Date": "2026-04-20",
                            "Volunteer ID": "vol-a",
                            "Shift Hours": 3,
                            "Intended Arrival Time": "2026-04-20T09:00:00",
                            "Intended Departure Time": "2026-04-20T12:00:00",
                        },
                    },
                ]
            )
        if "tblTGRzRsBpEDXLOk" in url:
            return FakeResponse(
                [
                    {
                        "id": "assessment-1",
                        "fields": {
                            "Assessment Time": "2026-01-10T10:00:00",
                            "Client Record ID": ["client-a"],
                            "Full Name": ["Client A"],
                        },
                    }
                ]
            )
        if "tbla8yxSQjPkYAWYK" in url:
            return FakeResponse(
                [
                    {
                        "id": "interaction-1",
                        "fields": {
                            "Interaction Time": "2026-04-10T10:00:00",
                            "Client": ["client-a"],
                        },
                    }
                ]
            )
        raise AssertionError(f"Unexpected Airtable URL: {url}")

    monkeypatch.setattr(pd, "read_csv", fake_read_csv)
    monkeypatch.setattr("requests.get", fake_get)

    spec = importlib.util.spec_from_file_location("create_metrics_under_test", script_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    header = (tmp_path / "quarterly_metrics.csv").read_text().splitlines()[0]

    assert header == (
        "Type of Metric,"
        "Q1 2026,January 2026,February 2026,March 2026,"
        "Q2 2026,April 2026,May 2026,June 2026,"
        "Q3 2026,July 2026,August 2026,September 2026,"
        "Q4 2026,October 2026,November 2026,December 2026"
    )

    rows = {
        row.split(",", 1)[0]: row.split(",")[1:]
        for row in (tmp_path / "quarterly_metrics.csv").read_text().splitlines()[1:]
    }

    assert rows["Housing support"][4:8] == ["2", "2", "0", "0"]
    assert rows["Housing applications - Data from Apricot"][:8] == [
        "2", "1", "0", "1", "0", "0", "0", "0",
    ]
    assert rows["Housing retention"][:8] == ["2", "1", "0", "1", "0", "0", "0", "0"]
    assert rows["# of unique clients served"][:8] == ["3", "1", "1", "3", "3", "3", "3", "3"]
    # Q1: 1 CalFresh + UPLIFT 130 + Caltrain 27. Jan: 1 + UPLIFT 44 + Caltrain 9.
    assert rows["Benefit applications submitted and services provided"][:4] == [
        "158", "54", "53", "53",
    ]
    assert rows["Benefit applications submitted and services provided"][12:16] == [
        "156", "54", "52", "52",
    ]
    assert rows["Clients housed"][:8] == ["2", "2", "0", "0", "4", "4", "0", "0"]
    assert rows["Benefits & services applications submitted"][12:16] == [
        "1",
        "1",
        "0",
        "0",
    ]


def test_create_metrics_accepts_month_range_args(tmp_path, monkeypatch):
    repo_root = Path(__file__).resolve().parents[1]
    script_path = repo_root / "create_metrics.py"
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("AIRTABLE_TOKEN", "test-token")
    monkeypatch.setattr(sys, "argv", ["create_metrics.py", "--start-month", "2", "--end-month", "4"])

    def fake_read_csv(path):
        if path == "Clients_Information.csv":
            return pd.DataFrame(
                [
                    {
                        "Creation Date": "02/10/2026 9:00 AM",
                        "Client Engagement Letter": "Yes",
                        "Client Status": "Active",
                    }
                ]
            )
        if path == "Housed.csv":
            return pd.DataFrame(
                [
                    {
                        "Name": "client-a",
                        "Date Housed": "4/10/2026",
                        "PSH": "1",
                    }
                ]
            )
        if path == "Clients_&_Programs.csv":
            return pd.DataFrame(
                [
                    {"Start Date": "01/05/2026", "Program Enrolled": "CalFresh"},
                    {"Start Date": "02/05/2026", "Program Enrolled": "CalFresh"},
                    {"Start Date": "04/05/2026", "Program Enrolled": "CalFresh"},
                ]
            )
        raise AssertionError(f"Unexpected CSV read: {path}")

    class FakeResponse:
        def __init__(self, records):
            self.records = records

        def raise_for_status(self):
            return None

        def json(self):
            return {"records": self.records}

    def fake_get(url, headers=None, params=None):
        if "tbl7ePbU3BVJK9x0l" in url:
            return FakeResponse(
                [
                    {
                        "id": "vol-out-of-range",
                        "fields": {
                            "Event Date": "2025-01-20",
                            "Volunteer ID": "vol-a",
                            "Shift Hours": 2,
                            "Intended Arrival Time": "2025-01-20T09:00:00",
                            "Intended Departure Time": "2025-01-20T11:00:00",
                        },
                    }
                ]
            )
        if "tblTGRzRsBpEDXLOk" in url:
            return FakeResponse(
                [
                    {
                        "id": "assessment-out-of-range",
                        "fields": {
                            "Assessment Time": "2025-01-10T10:00:00",
                            "Client Record ID": ["client-a"],
                            "Full Name": ["Client A"],
                        },
                    }
                ]
            )
        if "tbla8yxSQjPkYAWYK" in url:
            return FakeResponse(
                [
                    {
                        "id": "interaction-out-of-range",
                        "fields": {
                            "Interaction Time": "2025-01-10T10:00:00",
                            "Client": ["client-a"],
                        },
                    }
                ]
            )
        raise AssertionError(f"Unexpected Airtable URL: {url}")

    monkeypatch.setattr(pd, "read_csv", fake_read_csv)
    monkeypatch.setattr("requests.get", fake_get)

    spec = importlib.util.spec_from_file_location("create_metrics_range_test", script_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    lines = (tmp_path / "quarterly_metrics.csv").read_text().splitlines()
    assert lines[0] == "Type of Metric,February 2026,March 2026,April 2026"

    rows = {
        row.split(",", 1)[0]: row.split(",")[1:]
        for row in lines[1:]
    }
    assert rows["Benefits & services applications submitted"] == ["1", "0", "1"]


def test_create_metrics_with_optional_csvs(tmp_path, monkeypatch):
    repo_root = Path(__file__).resolve().parents[1]
    script_path = repo_root / "create_metrics.py"
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("AIRTABLE_TOKEN", "test-token")

    # Create the optional CSV files in tmp_path so os.path.exists returns True
    (tmp_path / "Housing_Applications_anonymized.csv").write_text(
        "Date Submitted,Test Application\n"
        "01/15/2026 12:00 PM,\n"
        "02/20/2026 12:00 PM,Yes\n"
        "02/25/2026 12:00 PM,\n"
    )

    (tmp_path / "ID_Fee_Waiver_Tracking__Responses.csv").write_text(
        "Timestamp,Client's First Name\n"
        "1/4/2026 9:09:45,A\n"
        "2/11/2026 14:57:59,B\n"
    )

    (tmp_path / "LifeLine Phone List.csv").write_text(
        ",,January 2026,,February 2026\n"
        "Monthly Total Applications,,10,,20\n"
        "Monthly Total Completed,,5,,8\n"
    )

    (tmp_path / "employment_support_engagement_report_anonymized.csv").write_text(
        "Enrollment Start Date,Last Tagged Interaction At,Client ID\n"
        "2026-01-15,,1\n"
        ",2026-02-10,2\n"
        "2026-03-05 12:00:00,2026-03-20,3\n"
        ",,4\n"
    )

    (tmp_path / "Employed_Clients___2026.csv").write_text(
        "Name,Date Employed,Employer Name\n"
        "A,2/3/26,GAT\n"
        "B,3/1/2026,UEO\n"
        "C,1. 3/4/26\n2. ~14 years,Shake Shack\n"
        "D,Pending,Right at School\n"
        "E,Date Employed,Employer Name\n"
        "F,4/27/26,Amazon\n"
    )

    (tmp_path / "TECHquity_intake.csv").write_text(
        "Timestamp,Client Name\n"
        "1/10/2026 10:00:00,Client 1\n"
        "2/12/2026 11:00:00,Client 2\n"
    )

    (tmp_path / "SEA_fund_intake.csv").write_text(
        "Timestamp,Client Name\n"
        "1/15/2026 14:00:00,Client 3\n"
        "3/20/2026 16:00:00,Client 4\n"
    )

    original_read_csv = pd.read_csv

    def fake_read_csv(path, *args, **kwargs):
        if path == "Clients_Information.csv":
            return pd.DataFrame([
                {"Creation Date": "01/10/2026 9:00 AM", "Client Engagement Letter": "Yes", "Client Status": "Active"}
            ])
        if path == "Housed.csv":
            return pd.DataFrame([
                {"Name": "client-a", "Date Housed": "1/10/2026", "PSH": "2"}
            ])
        if path == "Clients_&_Programs.csv":
            return pd.DataFrame([
                {"Start Date": "01/05/2026", "Program Enrolled": "PSH"},
                {"Start Date": "02/10/2026", "Program Enrolled": "Housing Solutions - VI-SPDAT"}
            ])
        if path in [
            "Housing_Applications_anonymized.csv",
            "ID_Fee_Waiver_Tracking__Responses.csv",
            "LifeLine Phone List.csv",
            "employment_support_engagement_report_anonymized.csv",
            "Employed_Clients___2026.csv",
            "TECHquity_intake.csv",
            "SEA_fund_intake.csv",
        ]:
            return original_read_csv(tmp_path / path, *args, **kwargs)
        raise AssertionError(f"Unexpected CSV read: {path}")

    class FakeResponse:
        def __init__(self, records):
            self.records = records

        def raise_for_status(self):
            return None

        def json(self):
            return {"records": self.records}

    def fake_get(url, headers=None, params=None):
        if "tbl7ePbU3BVJK9x0l" in url:
            return FakeResponse([
                {
                    "id": "vol-jan",
                    "fields": {
                        "Event Date": "2026-01-20",
                        "Volunteer ID": "vol-a",
                        "Shift Hours": 2,
                        "Intended Arrival Time": "2026-01-20T09:00:00",
                        "Intended Departure Time": "2026-01-20T11:00:00",
                    }
                }
            ])
        if "tblTGRzRsBpEDXLOk" in url:
            return FakeResponse([
                {
                    "id": "assessment-1",
                    "fields": {
                        "Assessment Time": "2026-01-10T10:00:00",
                        "Client Record ID": ["client-a"],
                        "Full Name": ["Client A"],
                    }
                }
            ])
        if "tbla8yxSQjPkYAWYK" in url:
            return FakeResponse([
                {
                    "id": "interaction-1",
                    "fields": {
                        "Interaction Time": "2026-01-10T10:00:00",
                        "Client": ["client-a"],
                    }
                }
            ])
        raise AssertionError(f"Unexpected Airtable URL: {url}")

    monkeypatch.setattr(pd, "read_csv", fake_read_csv)
    monkeypatch.setattr("requests.get", fake_get)

    spec = importlib.util.spec_from_file_location("create_metrics_optional_test", script_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    lines = (tmp_path / "quarterly_metrics.csv").read_text().splitlines()
    assert lines[0].startswith("Type of Metric,")

    rows = {
        row.split(",", 1)[0]: row.split(",")[1:]
        for row in lines[1:]
    }

    assert rows["Housing support"][:4] == ["4", "2", "2", "0"]
    assert rows["VI-SPDAT"][:4] == ["1", "0", "1", "0"]
    assert rows["ID fee waiver"][:4] == ["2", "1", "1", "0"]
    assert rows["Lifeline phone giveaway"][:4] == ["30", "10", "20", "0"]
    assert rows["Benefits & services applications submitted"][:4] == ["40", "14", "24", "2"]
    assert rows["Employment support provided"][:4] == ["3", "1", "1", "1"]
    assert rows["TECHquity Fund"][:4] == ["2", "1", "1", "0"]
    assert rows["SEA Fund Application"][:4] == ["2", "1", "0", "1"]
    assert rows["Clients who got hired"][:4] == ["3", "0", "1", "2"]
