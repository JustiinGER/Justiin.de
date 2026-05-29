"use client";

import { useState, useEffect } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-json";
import "prismjs/themes/prism-twilight.css";
import { AlertCircle } from "lucide-react";

export function JsonEditor({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCode(JSON.stringify(value, null, 2));
  }, [value]);

  const handleChange = (newCode: string) => {
    setCode(newCode);
    try {
      const parsed = JSON.parse(newCode);
      setError(null);
      onChange(parsed);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-2">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex gap-3 items-center">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>Invalid JSON: {error}</p>
        </div>
      )}
      <div className={`rounded-xl border ${error ? "border-red-500/50" : "border-brand-border"} bg-brand-card overflow-hidden`}>
        <Editor
          value={code}
          onValueChange={handleChange}
          highlight={code => Prism.highlight(code, Prism.languages.json, "json")}
          padding={24}
          style={{
            fontFamily: '"Fira Code", "JetBrains Mono", monospace',
            fontSize: 14,
            backgroundColor: "transparent",
            minHeight: "400px",
          }}
          className="focus:outline-none"
        />
      </div>
    </div>
  );
}
