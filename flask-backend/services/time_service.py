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




from datetime import datetime, timezone

try:
    import pytz
    IST = pytz.timezone("Asia/Kolkata")
except Exception:
    from zoneinfo import ZoneInfo
    IST = ZoneInfo("Asia/Kolkata")


def now_ist() -> datetime:
    return datetime.now(IST)


def iso_ist(value: datetime | None) -> str | None:
    if not value:
        return None
    if value.tzinfo is None:
        # MongoDB stores datetimes as UTC with no tzinfo.
        # Old code did replace(tzinfo=IST) which just labels UTC time as IST — wrong.
        # Correct: treat naive datetime as UTC, then convert to IST.
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(IST).isoformat()


def from_epoch_ms_ist(value: int | float | None) -> datetime:
    if not value:
        return now_ist()
    utc_dt = datetime.fromtimestamp(float(value) / 1000, tz=timezone.utc)
    return utc_dt.astimezone(IST)