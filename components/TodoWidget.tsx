"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "home-todos";

export default function TodoWidget() {
  const [text, setText] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setText(localStorage.getItem(STORAGE_KEY) ?? "");
  }, []);

  if (!mounted) return null;

  return (
    <div className="card" style={{ marginTop: "var(--space-8)" }}>
      <h3
        style={{
          marginBottom: "var(--space-3)",
          fontSize: "var(--text-base)",
          fontWeight: "var(--font-semibold)",
        }}
      >
        Pendientes
      </h3>
      <textarea
        className="form-input"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          localStorage.setItem(STORAGE_KEY, e.target.value);
        }}
        placeholder="Escribe aquí las cosas pendientes de implementar…"
        style={{ minHeight: "180px", resize: "vertical", lineHeight: "1.7" }}
      />
    </div>
  );
}
