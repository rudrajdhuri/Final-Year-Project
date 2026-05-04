from datetime import datetime

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
        if hasattr(IST, "localize"):
            value = IST.localize(value)
        else:
            value = value.replace(tzinfo=IST)
    return value.astimezone(IST).isoformat()


def from_epoch_ms_ist(value: int | float | None) -> datetime:
    if not value:
        return now_ist()
    return datetime.fromtimestamp(float(value) / 1000, tz=IST)
