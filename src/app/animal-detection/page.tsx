"use client";

import { useState, useRef } from "react";
import { Camera, Upload, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

export default function AnimalDetection() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResult(null); // Clear previous results
      };
      reader.readAsDataURL(file);
    }
  };

  const detectAnimal = async () => {
    if (!selectedImage) return;

    setDetecting(true);
    setResult(null);

    try {
      const response = await fetch("http://127.0.0.1:5000/api/animal/detect-animal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_base64: selectedImage,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: "Failed to connect to backend. Make sure Flask server is running on port 5000.",
      });
    } finally {
      setDetecting(false);
    }
  };

  const resetDetection = () => {
    setSelectedImage(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Animal Threat Detection
          </h1>
          <p className="text-gray-600">
            Upload an image to detect any animals that may threaten crops or fields
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col items-center">
            {!selectedImage ? (
              <div className="w-full">
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-green-500 transition-colors bg-gray-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-900 mb-2 font-medium">
                    Click to upload an image or drag and drop
                  </p>
                  <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="w-full">
                <div className="relative bg-gray-100 rounded-lg p-4 border border-gray-200">
                  <img
                    src={selectedImage}
                    alt="Selected"
                    className="w-full max-h-96 object-contain rounded-lg"
                  />
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={detectAnimal}
                    disabled={detecting}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    {detecting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Detecting...
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5" />
                        Detect Threats
                      </>
                    )}
                  </button>
                  <button
                    onClick={resetDetection}
                    disabled={detecting}
                    className="bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors border border-gray-200"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div
            className={`rounded-lg shadow-sm p-6 border-2 ${
              result.success && result.threat_detected
                ? "bg-red-50 border-red-400"
                : result.success
                ? "bg-green-50 border-green-400"
                : "bg-yellow-50 border-yellow-400"
            }`}
          >
            <div className="flex items-start gap-4">
              {result.success && result.threat_detected ? (
                <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0" />
              ) : result.success ? (
                <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-yellow-600 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3
                  className={`text-xl font-bold mb-2 ${
                    result.success && result.threat_detected
                      ? "text-red-900"
                      : result.success
                      ? "text-green-900"
                      : "text-yellow-900"
                  }`}
                >
                  {result.success && result.threat_detected
                    ? "⚠️ Threat Detected!"
                    : result.success
                    ? "✅ All Clear"
                    : "Error"}
                </h3>
                <p
                  className={`mb-4 ${
                    result.success && result.threat_detected
                      ? "text-red-800"
                      : result.success
                      ? "text-green-800"
                      : "text-yellow-800"
                  }`}
                >
                  {result.message || result.error}
                </p>
                {result.success && result.threat_detected && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <p className="text-sm text-gray-600 mb-1">Animal Type</p>
                      <p className="text-lg font-semibold text-gray-900 capitalize">
                        {result.animal_type}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <p className="text-sm text-gray-600 mb-1">Confidence</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {result.confidence}%
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-5 mt-6 shadow-sm">
          <h4 className="font-semibold text-blue-900 mb-3 text-base">
            📋 All Animals Detected as Threats:
          </h4>
          <ul className="text-sm text-blue-800 space-y-1.5">
            <li>• Birds, Cats, Dogs (common crop pests)</li>
            <li>• Horses, Cows, Sheep (livestock)</li>
            <li>• Elephants, Bears, Zebras, Giraffes (wildlife)</li>
            <li>• Any animal detected will trigger an alert</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
