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
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-[17rem]">
        <Header userName={userName} />
        <main className="app-page px-4 py-5 pb-28 sm:px-6 sm:py-6 lg:pb-8">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
