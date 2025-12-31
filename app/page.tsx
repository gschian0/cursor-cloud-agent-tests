import DashboardClient from "./DashboardClient"

export default async function Home() {
  // Allow access without authentication - API routes will use test user fallback
  // This enables testing mode as documented
  return <DashboardClient />
}
