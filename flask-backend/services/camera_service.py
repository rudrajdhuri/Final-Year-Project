# # import threading
# # import time

# # import cv2


# # _camera_lock = threading.Lock()
# # _camera_handle = None
# # _camera_kind = None
# # _last_opened_at = 0.0
# # _CAMERA_KEEPALIVE_SECONDS = 12


# # def _open_camera():
# #     global _camera_handle, _camera_kind, _last_opened_at

# #     if _camera_handle is not None:
# #         _last_opened_at = time.time()
# #         return

# #     try:
# #         from picamera2 import Picamera2

# #         camera = Picamera2()
# #         config = camera.create_video_configuration(main={"size": (640, 480), "format": "BGR888"})
# #         camera.configure(config)
# #         camera.start()
# #         time.sleep(0.2)
# #         _camera_handle = camera
# #         _camera_kind = "picamera2"
# #         _last_opened_at = time.time()
# #         return
# #     except Exception:
# #         pass

# #     fallback = cv2.VideoCapture(0)
# #     fallback.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
# #     fallback.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
# #     if not fallback.isOpened():
# #         raise RuntimeError("Pi camera could not be opened")

# #     _camera_handle = fallback
# #     _camera_kind = "opencv"
# #     _last_opened_at = time.time()


# # def _close_camera():
# #     global _camera_handle, _camera_kind

# #     if _camera_handle is None:
# #         return

# #     try:
# #         if _camera_kind == "picamera2":
# #             _camera_handle.stop()
# #             _camera_handle.close()
# #         else:
# #             _camera_handle.release()
# #     except Exception:
# #         pass
# #     finally:
# #         _camera_handle = None
# #         _camera_kind = None


# # def _schedule_close():
# #     def closer():
# #         global _last_opened_at
# #         time.sleep(_CAMERA_KEEPALIVE_SECONDS)
# #         with _camera_lock:
# #             if _camera_handle is not None and time.time() - _last_opened_at >= _CAMERA_KEEPALIVE_SECONDS:
# #                 _close_camera()

# #     threading.Thread(target=closer, daemon=True).start()


# # def capture_single_frame():
# #     with _camera_lock:
# #         _open_camera()

# #         try:
# #             if _camera_kind == "picamera2":
# #                 output = _camera_handle.capture_array()
# #                 _last_opened_at = time.time()
# #                 _schedule_close()
# #                 return output, "picamera2"

# #             frame = None
# #             ok = False
# #             for _ in range(2):
# #                 ok, frame = _camera_handle.read()

# #             if not ok or frame is None or frame.size == 0:
# #                 raise RuntimeError("Failed to capture image from the camera")

# #             _last_opened_at = time.time()
# #             _schedule_close()
# #             return frame, "opencv"
# #         except Exception:
# #             _close_camera()
# #             raise



# import threading
# import time
# import cv2

# _camera_lock = threading.Lock()
# _camera_handle = None
# _camera_kind = None
# _last_opened_at = 0.0
# _CAMERA_KEEPALIVE_SECONDS = 12
# _PI_CAPTURE_SIZE = (1280, 720)


# def _normalize_picamera_frame(frame):
#     if frame is None or getattr(frame, "size", 0) == 0:
#         raise RuntimeError("Pi camera returned an empty frame")

#     if len(frame.shape) == 3 and frame.shape[2] == 4:
#         return cv2.cvtColor(frame, cv2.COLOR_BGRA2BGR)

#     return frame


# def _open_camera():
#     global _camera_handle, _camera_kind, _last_opened_at

#     if _camera_handle is not None:
#         _last_opened_at = time.time()
#         return

#     try:
#         from picamera2 import Picamera2
#         try:
#             from libcamera import Transform
#             transform = Transform(hflip=1, vflip=1)
#         except Exception:
#             transform = None

#         camera = Picamera2()
#         config_kwargs = {"main": {"size": _PI_CAPTURE_SIZE, "format": "BGR888"}}
#         if transform is not None:
#             config_kwargs["transform"] = transform
#         config = camera.create_still_configuration(**config_kwargs)
#         camera.configure(config)
#         camera.start()
#         time.sleep(0.6)
#         _camera_handle = camera
#         _camera_kind = "picamera2"
#         _last_opened_at = time.time()
#         return
#     except Exception:
#         pass

#     fallback = cv2.VideoCapture(0)
#     fallback.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
#     fallback.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
#     if not fallback.isOpened():
#         raise RuntimeError("Pi camera could not be opened")

#     _camera_handle = fallback
#     _camera_kind = "opencv"
#     _last_opened_at = time.time()


# def _close_camera():
#     global _camera_handle, _camera_kind

#     if _camera_handle is None:
#         return

#     try:
#         if _camera_kind == "picamera2":
#             _camera_handle.stop()
#             _camera_handle.close()
#         else:
#             _camera_handle.release()
#     except Exception:
#         pass
#     finally:
#         _camera_handle = None
#         _camera_kind = None


# def _schedule_close():
#     def closer():
#         global _last_opened_at
#         time.sleep(_CAMERA_KEEPALIVE_SECONDS)
#         with _camera_lock:
#             if _camera_handle is not None and time.time() - _last_opened_at >= _CAMERA_KEEPALIVE_SECONDS:
#                 _close_camera()

#     threading.Thread(target=closer, daemon=True).start()


# def capture_single_frame():
#     with _camera_lock:
#         _open_camera()

#         try:
#             if _camera_kind == "picamera2":
#                 output = _normalize_picamera_frame(_camera_handle.capture_array())
#                 _last_opened_at = time.time()
#                 _schedule_close()
#                 return output, "picamera2"

#             frame = None
#             ok = False
#             for _ in range(2):
#                 ok, frame = _camera_handle.read()

#             if not ok or frame is None or frame.size == 0:
#                 raise RuntimeError("Failed to capture image from the camera")

#             _last_opened_at = time.time()
#             _schedule_close()
#             return frame, "opencv"
#         except Exception:
#             _close_camera()
#             raise















# import threading
# import time

# import cv2


# _camera_lock = threading.Lock()
# _camera_handle = None
# _camera_kind = None
# _last_opened_at = 0.0
# _CAMERA_KEEPALIVE_SECONDS = 12


# def _open_camera():
#     global _camera_handle, _camera_kind, _last_opened_at

#     if _camera_handle is not None:
#         _last_opened_at = time.time()
#         return

#     try:
#         from picamera2 import Picamera2

#         camera = Picamera2()
#         config = camera.create_video_configuration(main={"size": (640, 480), "format": "BGR888"})
#         camera.configure(config)
#         camera.start()
#         time.sleep(0.2)
#         _camera_handle = camera
#         _camera_kind = "picamera2"
#         _last_opened_at = time.time()
#         return
#     except Exception:
#         pass

#     fallback = cv2.VideoCapture(0)
#     fallback.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
#     fallback.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
#     if not fallback.isOpened():
#         raise RuntimeError("Pi camera could not be opened")

#     _camera_handle = fallback
#     _camera_kind = "opencv"
#     _last_opened_at = time.time()


# def _close_camera():
#     global _camera_handle, _camera_kind

#     if _camera_handle is None:
#         return

#     try:
#         if _camera_kind == "picamera2":
#             _camera_handle.stop()
#             _camera_handle.close()
#         else:
#             _camera_handle.release()
#     except Exception:
#         pass
#     finally:
#         _camera_handle = None
#         _camera_kind = None


# def _schedule_close():
#     def closer():
#         global _last_opened_at
#         time.sleep(_CAMERA_KEEPALIVE_SECONDS)
#         with _camera_lock:
#             if _camera_handle is not None and time.time() - _last_opened_at >= _CAMERA_KEEPALIVE_SECONDS:
#                 _close_camera()

#     threading.Thread(target=closer, daemon=True).start()


# def capture_single_frame():
#     with _camera_lock:
#         _open_camera()

#         try:
#             if _camera_kind == "picamera2":
#                 output = _camera_handle.capture_array()
#                 _last_opened_at = time.time()
#                 _schedule_close()
#                 return output, "picamera2"

#             frame = None
#             ok = False
#             for _ in range(2):
#                 ok, frame = _camera_handle.read()

#             if not ok or frame is None or frame.size == 0:
#                 raise RuntimeError("Failed to capture image from the camera")

#             _last_opened_at = time.time()
#             _schedule_close()
#             return frame, "opencv"
#         except Exception:
#             _close_camera()
#             raise







# import threading
# import time
# import cv2

# _camera_lock = threading.Lock()
# _camera_handle = None
# _camera_kind = None
# _last_opened_at = 0.0
# _CAMERA_KEEPALIVE_SECONDS = 12
# _PI_CAPTURE_SIZE = (1280, 720)


# def _normalize_picamera_frame(frame):
#     """
#     Picamera2 still_configuration with format='BGR888' can return frames in
#     RGB order on some firmware versions, causing a blue tint when displayed or
#     fed into models that expect BGR (OpenCV convention).

#     Strategy:
#       - 4-channel (BGRA/RGBA): strip alpha then convert to BGR.
#       - 3-channel: treat as RGB and convert to BGR so colours are always correct.
#         OpenCV's imencode / imwrite and torchvision both expect BGR from OpenCV
#         pipelines, so we normalise here once rather than in every downstream caller.
#     """
#     if frame is None or getattr(frame, "size", 0) == 0:
#         raise RuntimeError("Pi camera returned an empty frame")

#     if len(frame.shape) == 3 and frame.shape[2] == 4:
#         # Drop alpha, then convert from whatever-order to BGR
#         frame = cv2.cvtColor(frame, cv2.COLOR_BGRA2BGR)
#         # Treat the stripped frame as RGB and flip to BGR
#         return cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)

#     if len(frame.shape) == 3 and frame.shape[2] == 3:
#         # Picamera2 still frames come out as RGB even when 'BGR888' is requested
#         return cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)

#     return frame


# def _open_camera():
#     global _camera_handle, _camera_kind, _last_opened_at

#     if _camera_handle is not None:
#         _last_opened_at = time.time()
#         return

#     try:
#         from picamera2 import Picamera2
#         try:
#             from libcamera import Transform
#             transform = Transform(hflip=1, vflip=1)
#         except Exception:
#             transform = None

#         camera = Picamera2()
#         config_kwargs = {"main": {"size": _PI_CAPTURE_SIZE, "format": "BGR888"}}
#         if transform is not None:
#             config_kwargs["transform"] = transform
#         config = camera.create_still_configuration(**config_kwargs)
#         camera.configure(config)
#         camera.start()
#         time.sleep(0.6)
#         _camera_handle = camera
#         _camera_kind = "picamera2"
#         _last_opened_at = time.time()
#         return
#     except Exception:
#         pass

#     fallback = cv2.VideoCapture(0)
#     fallback.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
#     fallback.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
#     if not fallback.isOpened():
#         raise RuntimeError("Pi camera could not be opened")

#     _camera_handle = fallback
#     _camera_kind = "opencv"
#     _last_opened_at = time.time()


# def _close_camera():
#     global _camera_handle, _camera_kind

#     if _camera_handle is None:
#         return

#     try:
#         if _camera_kind == "picamera2":
#             _camera_handle.stop()
#             _camera_handle.close()
#         else:
#             _camera_handle.release()
#     except Exception:
#         pass
#     finally:
#         _camera_handle = None
#         _camera_kind = None


# def _schedule_close():
#     def closer():
#         global _last_opened_at
#         time.sleep(_CAMERA_KEEPALIVE_SECONDS)
#         with _camera_lock:
#             if _camera_handle is not None and time.time() - _last_opened_at >= _CAMERA_KEEPALIVE_SECONDS:
#                 _close_camera()

#     threading.Thread(target=closer, daemon=True).start()


# def capture_single_frame():
#     with _camera_lock:
#         _open_camera()

#         try:
#             if _camera_kind == "picamera2":
#                 output = _normalize_picamera_frame(_camera_handle.capture_array())
#                 _last_opened_at = time.time()
#                 _schedule_close()
#                 return output, "picamera2"

#             frame = None
#             ok = False
#             for _ in range(2):
#                 ok, frame = _camera_handle.read()

#             if not ok or frame is None or frame.size == 0:
#                 raise RuntimeError("Failed to capture image from the camera")

#             _last_opened_at = time.time()
#             _schedule_close()
#             return frame, "opencv"
#         except Exception:
#             _close_camera()
#             raise




import threading
import time

import cv2

_camera_lock = threading.Lock()
_camera_handle = None
_camera_kind = None
_last_opened_at = 0.0
_CAMERA_KEEPALIVE_SECONDS = 12


def _open_camera():
    global _camera_handle, _camera_kind, _last_opened_at

    if _camera_handle is not None:
        _last_opened_at = time.time()
        return

    try:
        from picamera2 import Picamera2

        camera = Picamera2()

        # Still configuration gives sharper, better-exposed images than video config.
        # This is critical for plant disease detection — the model needs
        # clean leaf texture detail. Video frames are blurrier and have
        # less settled auto-exposure, causing "unclear" or "no plant" results.
        # 1280x720 gives good detail without making inference too slow.
        config = camera.create_still_configuration(
            main={"size": (1280, 720), "format": "RGB888"},
        )
        camera.configure(config)
        camera.start()

        # 1.5s warmup lets auto-exposure and auto-white-balance settle.
        # Shorter warmup (0.3s) often gives dark or blown-out frames.
        time.sleep(1.5)

        _camera_handle = camera
        _camera_kind = "picamera2"
        _last_opened_at = time.time()
        return
    except Exception:
        pass

    fallback = cv2.VideoCapture(0)
    fallback.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    fallback.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    if not fallback.isOpened():
        raise RuntimeError("Pi camera could not be opened")

    _camera_handle = fallback
    _camera_kind = "opencv"
    _last_opened_at = time.time()


def _close_camera():
    global _camera_handle, _camera_kind

    if _camera_handle is None:
        return

    try:
        if _camera_kind == "picamera2":
            _camera_handle.stop()
            _camera_handle.close()
        else:
            _camera_handle.release()
    except Exception:
        pass
    finally:
        _camera_handle = None
        _camera_kind = None


def _schedule_close():
    def closer():
        global _last_opened_at
        time.sleep(_CAMERA_KEEPALIVE_SECONDS)
        with _camera_lock:
            if _camera_handle is not None and time.time() - _last_opened_at >= _CAMERA_KEEPALIVE_SECONDS:
                _close_camera()

    threading.Thread(target=closer, daemon=True).start()


def capture_single_frame():
    with _camera_lock:
        _open_camera()

        try:
            if _camera_kind == "picamera2":
                raw = _camera_handle.capture_array()

                # Picamera2 returns RGB888 — OpenCV and our models expect BGR.
                output = cv2.cvtColor(raw, cv2.COLOR_RGB2BGR)

                _last_opened_at = time.time()
                _schedule_close()
                return output, "picamera2"

            frame = None
            ok = False
            for _ in range(2):
                ok, frame = _camera_handle.read()

            if not ok or frame is None or frame.size == 0:
                raise RuntimeError("Failed to capture image from the camera")

            _last_opened_at = time.time()
            _schedule_close()
            return frame, "opencv"
        except Exception:
            _close_camera()
            raise