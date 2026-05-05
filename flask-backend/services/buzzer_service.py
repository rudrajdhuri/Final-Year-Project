# import atexit
# import threading
# import time


# BUZZER_PIN = 18
# BUZZ_COOLDOWN_SECONDS = 5

# try:
#     import RPi.GPIO as GPIO

#     GPIO.setmode(GPIO.BCM)
#     GPIO.setup(BUZZER_PIN, GPIO.OUT)
#     GPIO.output(BUZZER_PIN, GPIO.LOW)
#     _gpio_ready = True
# except Exception:
#     GPIO = None
#     _gpio_ready = False

# _lock = threading.Lock()
# _last_buzz_time = 0.0


# def _buzz_blocking(duration: float) -> None:
#     global _last_buzz_time

#     with _lock:
#         current_time = time.time()
#         if current_time - _last_buzz_time < BUZZ_COOLDOWN_SECONDS:
#             return
#         _last_buzz_time = current_time

#     if not _gpio_ready or GPIO is None:
#         return

#     try:
#         GPIO.output(BUZZER_PIN, GPIO.HIGH)
#         time.sleep(max(0.0, float(duration)))
#     finally:
#         GPIO.output(BUZZER_PIN, GPIO.LOW)


# def buzz(duration: float = 2) -> None:
#     thread = threading.Thread(target=_buzz_blocking, args=(duration,), name="buzzer-alert", daemon=True)
#     thread.start()


# def cleanup() -> None:
#     if _gpio_ready and GPIO is not None:
#         GPIO.output(BUZZER_PIN, GPIO.LOW)
#         GPIO.cleanup(BUZZER_PIN)


# atexit.register(cleanup)


import atexit
import threading
import time

BUZZER_PIN = 18
BUZZ_COOLDOWN_SECONDS = 5

try:
    import RPi.GPIO as GPIO

    GPIO.setmode(GPIO.BCM)
    GPIO.setup(BUZZER_PIN, GPIO.OUT)
    GPIO.output(BUZZER_PIN, GPIO.LOW)
    _gpio_ready = True
except Exception:
    GPIO = None
    _gpio_ready = False

_lock = threading.Lock()
_last_buzz_time = 0.0


def _buzz_blocking(duration: float) -> None:
    global _last_buzz_time

    with _lock:
        current_time = time.time()
        if current_time - _last_buzz_time < BUZZ_COOLDOWN_SECONDS:
            return

        _last_buzz_time = current_time

        if not _gpio_ready or GPIO is None:
            return

        print("BUZZER TRIGGERED")

        try:
            GPIO.output(BUZZER_PIN, GPIO.HIGH)
            time.sleep(max(0.0, float(duration)))
        finally:
            GPIO.output(BUZZER_PIN, GPIO.LOW)


def buzz(duration: float = 2) -> None:
    thread = threading.Thread(
        target=_buzz_blocking,
        args=(duration,),
        name="buzzer-alert",
        daemon=True
    )
    thread.start()


def cleanup() -> None:
    if _gpio_ready and GPIO is not None:
        GPIO.output(BUZZER_PIN, GPIO.LOW)
        GPIO.cleanup()


atexit.register(cleanup)