/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthorizationContext } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChatClient } from "./client";
import { getChatHistory, getChatSuggestions } from "./actions";

export default async function ChatPage() {
  const ctx = await getAuthorizationContext();
  if (!ctx) redirect("/auth/login");

  const [history, suggestions] = await Promise.all([
    getChatHistory(50),
    getChatSuggestions(),
  ]);

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-4rem)]">
      <ChatClient
        initialHistory={history}
        suggestions={suggestions}
        userName={`${ctx.profile.first_name}`}
        userRoles={ctx.roles}
      />
    </div>
  );
}
