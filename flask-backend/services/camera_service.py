import time

import cv2


def capture_single_frame():
    try:
        from picamera2 import Picamera2

        camera = Picamera2()
        config = camera.create_video_configuration(main={"size": (640, 480), "format": "RGB888"})
        camera.configure(config)
        camera.start()
        time.sleep(0.4)
        frame = camera.capture_array()
        camera.stop()
        camera.close()
        return cv2.cvtColor(frame, cv2.COLOR_RGB2BGR), "picamera2"
    except Exception:
        fallback = cv2.VideoCapture(0)
        fallback.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        fallback.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

        if not fallback.isOpened():
            raise RuntimeError("Pi camera could not be opened")

        frame = None
        ok = False
        for _ in range(3):
            ok, frame = fallback.read()
        fallback.release()

        if not ok or frame is None or frame.size == 0:
            raise RuntimeError("Failed to capture image from the camera")

        return frame, "opencv"
