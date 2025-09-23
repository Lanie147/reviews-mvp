"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReviewsTable from "@/components/dashboard/ReviewsTable";

// NOTE: We assume you already have a Campaigns list on your Dashboard.
// Wrap it in a component you can render here (or inline your current Campaigns UI).
// To keep this drop-in, we expose a slot via `renderCampaigns`.

export default function DashboardTabs({
  renderCampaigns,
}: {
  renderCampaigns: React.ReactNode;
}) {
  return (
    <Tabs defaultValue="campaigns" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        <TabsTrigger value="reviews">Reviews</TabsTrigger>
      </TabsList>

      <TabsContent value="campaigns">{renderCampaigns}</TabsContent>

      <TabsContent value="reviews">
        <Card>
          <CardHeader>
            <CardTitle>All Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <ReviewsTable />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
