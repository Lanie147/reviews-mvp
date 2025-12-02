// src/components/dashboard/DashboardTabs.tsx
"use client";

import * as React from "react";
import { useState } from "react";

type Props = {
  defaultTab?: "campaigns" | "products" | "archived";
  renderCampaigns: React.ReactNode;
  renderProducts?: React.ReactNode;
  renderArchived?: React.ReactNode;
  className?: string;
};

export default function DashboardTabs({
  defaultTab = "campaigns",
  renderCampaigns,
  renderProducts,
  renderArchived,
  className,
}: Props) {
  const [active, setActive] = useState(defaultTab);

  function TabButton({
    id,
    children,
  }: {
    id: "campaigns" | "products" | "archived";
    children: React.ReactNode;
  }) {
    const isActive = active === id;
    return (
      <button
        type="button"
        onClick={() => setActive(id)}
        className={`px-3 py-2 rounded-md text-sm font-medium transition ${
          isActive ? "bg-white/6 text-white" : "text-muted-foreground hover:bg-white/2"
        }`}
        aria-pressed={isActive}
        aria-current={isActive ? "true" : undefined}
      >
        {children}
      </button>
    );
  }

  return (
    <div className={`space-y-4 ${className ?? "w-full"}`}>
      <nav className="flex items-center gap-2" role="tablist" aria-label="Dashboard tabs">
        <TabButton id="campaigns">Campaigns</TabButton>
        <TabButton id="products">Products</TabButton>
        <TabButton id="archived">Archived</TabButton>
      </nav>

      <div>
        {active === "campaigns" && <div role="tabpanel">{renderCampaigns}</div>}
        {active === "products" && <div role="tabpanel">{renderProducts ?? <div className="text-sm text-muted-foreground">No products tab provided.</div>}</div>}
        {active === "archived" && <div role="tabpanel">{renderArchived}</div>}
      </div>
    </div>
  );
}
