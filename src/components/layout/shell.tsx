import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileShell } from "./mobile-shell";
import { getAuthorizationContext } from "@/lib/auth";

export async function Shell({ children }: { children: React.ReactNode }) {
  const context = await getAuthorizationContext();

  return (
    <div className="h-full relative">
      {/* Desktop Sidebar */}
      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80]">
        <Sidebar permissions={context?.permissions || []} roles={context?.roles || []} />
      </div>

      {/* Main Content */}
      <main className="md:pl-72 h-full flex flex-col">
        <Header profile={context?.profile} permissions={context?.permissions || []} roles={context?.roles || []} />
        <div className="flex-1 p-4 md:p-8 pb-20 md:pb-8 overflow-y-auto bg-muted/20">
          <div className="max-w-screen-2xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav + Drawer */}
      <MobileShell permissions={context?.permissions || []} roles={context?.roles || []} />
    </div>
  );
}
