/** @type {import('next').NextConfig} */
const nextConfig = {
  // Every route here reads live Supabase data (leads/tasks/notifications) —
  // the default Client Router Cache staleTime (30s for dynamic segments) was
  // making the sidebar notification bell show stale counts after navigating
  // to an already-visited route, even though revalidatePath had already
  // refreshed the server-side data. Disabling it means every navigation
  // always re-fetches, trading a bit of navigation speed for correctness.
  experimental: {
    staleTimes: {
      dynamic: 0,
    },
  },
}

export default nextConfig
