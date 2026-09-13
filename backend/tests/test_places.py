from app.services.places import compact_opening_hours


def test_compact_opening_hours_daily_and_24h():
    assert compact_opening_hours(
        [
            "Monday: Open 24 hours",
            "Tuesday: Open 24 hours",
            "Wednesday: Open 24 hours",
            "Thursday: Open 24 hours",
            "Friday: Open 24 hours",
            "Saturday: Open 24 hours",
            "Sunday: Open 24 hours",
        ]
    ) == "Open 24 hours"
    assert compact_opening_hours(
        [
            "Monday: 7:00 AM – 8:00 PM",
            "Tuesday: 7:00 AM – 8:00 PM",
            "Sunday: 7:00 AM – 8:00 PM",
        ]
    ) == "Daily 7:00 AM – 8:00 PM"
    mixed = compact_opening_hours(
        ["Monday: 7:30 AM – 7:00 PM", "Friday: 7:30 AM – 12:00 PM, 2:45 PM – 7:00 PM"]
    )
    assert mixed and "Friday" in mixed
