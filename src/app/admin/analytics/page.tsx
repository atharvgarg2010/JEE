import type { Metadata } from "next";
import AdminAnalyticsClient from "./admin-analytics-client";

export const metadata: Metadata = {
  title: "Admin Analytics | JEE Tracker"
};

export default function AdminAnalyticsPage() {
  return <AdminAnalyticsClient />;
}
