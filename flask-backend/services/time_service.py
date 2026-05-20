# from datetime import datetime

# try:
#     import pytz

#     IST = pytz.timezone("Asia/Kolkata")
# except Exception:
#     from zoneinfo import ZoneInfo

#     IST = ZoneInfo("Asia/Kolkata")


# def now_ist() -> datetime:
#     return datetime.now(IST)


# def iso_ist(value: datetime | None) -> str | None:
#     if not value:
#         return None
#     if value.tzinfo is None:
#         if hasattr(IST, "localize"):
#             value = IST.localize(value)
#         else:
#             value = value.replace(tzinfo=IST)
#     return value.astimezone(IST).isoformat()


# # def from_epoch_ms_ist(value: int | float | None) -> datetime:
# #     if not value:
# #         return now_ist()
# #     return datetime.fromtimestamp(float(value) / 1000, tz=IST)


# from datetime import timezone

# def from_epoch_ms_ist(value: int | float | None) -> datetime:
#     if not value:
#         return now_ist()

#     # First interpret epoch correctly as UTC
#     utc_dt = datetime.fromtimestamp(float(value) / 1000, tz=timezone.utc)

#     # Then convert to IST
#     return utc_dt.astimezone(IST)



from datetime import datetime, timezone, timedelta

try:
    import pytz
    IST = pytz.timezone("Asia/Kolkata")
except Exception:
    from zoneinfo import ZoneInfo
    IST = ZoneInfo("Asia/Kolkata")

# IST offset for use when pytz not available
_IST_OFFSET = timedelta(hours=5, minutes=30)


def now_ist() -> datetime:
    return datetime.now(IST)


def iso_ist(value: datetime | None) -> str | None:
    """
    Convert any datetime to an IST ISO string with explicit +05:30 offset.

    pymongo always returns naive UTC datetimes (tzinfo=None) regardless of
    what timezone the datetime was stored with. So we must always treat
    naive datetimes as UTC and convert to IST — never assume they are already IST.
    """
    if not value:
        return None
    if value.tzinfo is None:
        # pymongo stripped tzinfo → treat as UTC, convert to IST
        value = value.replace(tzinfo=timezone.utc)
    # Convert to IST and format with explicit +05:30 so frontend never guesses
    ist_value = value.astimezone(IST)
    # Format as "2026-05-20T13:31:00+05:30" — unambiguous for any parser
    try:
        return ist_value.isoformat()
    except Exception:
        offset = ist_value.utcoffset()
        if offset is None:
            offset = _IST_OFFSET
        total = int(offset.total_seconds())
        sign = "+" if total >= 0 else "-"
        total = abs(total)
        hh, mm = divmod(total // 60, 60)
        return ist_value.strftime(f"%Y-%m-%dT%H:%M:%S{sign}{hh:02d}:{mm:02d}")


def from_epoch_ms_ist(value: int | float | None) -> datetime:
    if not value:
        return now_ist()
    utc_dt = datetime.fromtimestamp(float(value) / 1000, tz=timezone.utc)
    return utc_dt.astimezone(IST)