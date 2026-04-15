"use client";

import { useState } from "react";
import type { ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

export default function TabsContainer({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0].id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div>
      <div className="tabs-bar">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`tab-btn${t.id === active ? " tab-btn-active" : ""}`}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div>{current.content}</div>
    </div>
  );
}
