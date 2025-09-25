// src/components/dashboard/DashboardTabs.tsx
"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReviewsTable from "@/components/dashboard/ReviewsTable";

type Props = {
  renderCampaigns: React.ReactNode;
  renderArchived?: React.ReactNode;
  renderReviews?: React.ReactNode;
  defaultTab?: "campaigns" | "archived" | "reviews";
  className?: string;
};

export default function DashboardTabs({
  renderCampaigns,
  renderArchived,
  renderReviews,
  defaultTab = "campaigns",
  className,
}: Props) {
  return (
    <Tabs defaultValue={defaultTab} className={className ?? "w-full"}>
      <TabsList className="mb-4">
        <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        {renderArchived && <TabsTrigger value="archived">Archived</TabsTrigger>}
        <TabsTrigger value="reviews">Reviews</TabsTrigger>
      </TabsList>

      <TabsContent value="campaigns">{renderCampaigns}</TabsContent>

      {renderArchived && (
        <TabsContent value="archived">{renderArchived}</TabsContent>
      )}

      <TabsContent value="reviews">
        {renderReviews ?? (
          <Card>
            <CardHeader>
              <CardTitle>All Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewsTable />
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
