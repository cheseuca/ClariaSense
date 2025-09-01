"use client";
import { useState, useEffect } from "react";

export default function BlockingPopup() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (open) {
      // 🔒 Disable background scroll while popup is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-lg w-full text-gray-900">
        <h2 className="text-xl font-bold mb-3">PSA❗</h2>
        <p className="mb-5">
          This site only showcases the capabilities of the ClariaSense app. There are limitations, mainly no working hardware prototype available; this only serves as a proof of concept. You may check the About page for more information about this thesis project.
        </p>
        <button
          onClick={() => setOpen(false)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
        >
          Try it out!
        </button>
      </div>
    </div>
  );
}
