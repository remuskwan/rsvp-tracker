"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ImageIcon, Loader2, X } from "lucide-react";

interface PinImageUploadProps {
  url: string | null;
  onChange: (url: string | null) => void;
}

export function PinImageUpload({ url, onChange }: PinImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("pin-images").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("pin-images").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {url ? (
        <div className="relative rounded-lg overflow-hidden border border-stone-200" style={{ height: 120 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Pin photo" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="bg-white text-stone-700 text-xs font-medium px-3 py-1.5 rounded-full shadow hover:bg-stone-50"
            >
              Change
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="bg-white text-red-600 rounded-full p-1.5 shadow hover:bg-red-50"
              aria-label="Remove photo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-stone-200 rounded-lg hover:border-stone-300 hover:bg-stone-50 transition-colors text-stone-400 hover:text-stone-500"
          style={{ height: 80 }}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <ImageIcon className="h-5 w-5" />
              <span className="text-xs font-medium">Upload photo</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
