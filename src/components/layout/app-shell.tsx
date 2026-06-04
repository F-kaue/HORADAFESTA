import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { Header } from "./header";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userName = "Usuária";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single();
    if (profile?.name) userName = profile.name;
  }

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <div className="lg:pl-64">
        <Header userName={userName} />
        <main className="pb-24 lg:pb-8 px-4 md:px-6 py-6">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
