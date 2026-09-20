/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { processChatMessage, getSuggestedQuestions, type ChatMessage } from "@/services/ai/engine";
import { getAuthorizationContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Send a message to the AI assistant and get a response.
 * Server-side: enforces RBAC, processes through AI engine.
 */
export async function sendChatMessage(
  userMessage: string,
  conversationHistory: ChatMessage[]
): Promise<{ response: ChatMessage; error?: string }> {
  const result = await processChatMessage(userMessage, conversationHistory);

  // Save to database (non-blocking)
  try {
    const ctx = await getAuthorizationContext();
    if (ctx) {
      const supabase = createAdminClient();
      await supabase.from("chat_messages").insert({
        user_id: ctx.user.id,
        college_id: ctx.profile.college_id,
        role: "user",
        content: userMessage,
      });
      await supabase.from("chat_messages").insert({
        user_id: ctx.user.id,
        college_id: ctx.profile.college_id,
        role: "assistant",
        content: result.message.content,
        metadata: result.message.toolCalls ? JSON.stringify(result.message.toolCalls) : null,
      });
    }
  } catch { /* non-blocking */ }

  return { response: result.message, error: result.error };
}

/**
 * Get suggested questions based on the current user's role.
 */
export async function getChatSuggestions(): Promise<string[]> {
  const ctx = await getAuthorizationContext();
  if (!ctx) return ["What can you help me with?"];
  return getSuggestedQuestions(ctx.roles);
}

/**
 * Get chat history for the current user.
 */
export async function getChatHistory(limit: number = 50): Promise<ChatMessage[]> {
  const ctx = await getAuthorizationContext();
  if (!ctx) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("chat_messages")
    .select("id, role, content, metadata, created_at")
    .eq("user_id", ctx.user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data) return [];

  return data.reverse().map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
    toolCalls: m.metadata ? JSON.parse(m.metadata) : undefined,
    timestamp: m.created_at,
  }));
}

/**
 * Clear chat history for the current user.
 */
export async function clearChatHistory(): Promise<{ success: boolean }> {
  const ctx = await getAuthorizationContext();
  if (!ctx) return { success: false };

  const supabase = createAdminClient();
  await supabase
    .from("chat_messages")
    .delete()
    .eq("user_id", ctx.user.id);

  return { success: true };
}
