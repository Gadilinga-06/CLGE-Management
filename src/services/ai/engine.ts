/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AI Engine
 *
 * Core engine that:
 * 1. Authenticates the user
 * 2. Identifies role, college, department
 * 3. Gets available tools based on RBAC
 * 4. Sends user query + tools to AI provider
 * 5. Executes any tool calls via predefined safe functions
 * 6. Returns the final response
 *
 * SECURITY INVARIANTS:
 * - NEVER executes raw SQL
 * - NEVER allows arbitrary database commands
 * - ONLY predefined tools can access the database
 * - EVERY tool enforces RBAC at the function level
 * - User context is validated before every operation
 */

import { getAuthorizationContext, type AuthorizationContext } from "@/lib/auth";
import { getAIProvider, type AIMessage, type AIProviderResponse } from "./provider";
import { getToolsForRoles, getToolByName, getToolDefinitions, type AITool } from "./tools";

// ─── Types ────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  toolCalls?: { name: string; arguments: any; result?: any }[];
  timestamp: string;
}

export interface ChatResponse {
  message: ChatMessage;
  error?: string;
}

// ─── Conversation History (In-Memory for Session) ─────────

const MAX_HISTORY = 20;

// ─── Engine ───────────────────────────────────────────────

/**
 * Process a chat message through the AI engine.
 * Enforces RBAC at every step.
 */
export async function processChatMessage(
  userMessage: string,
  conversationHistory: ChatMessage[]
): Promise<ChatResponse> {
  // Step 1: Authenticate
  const ctx = await getAuthorizationContext();
  if (!ctx) {
    return {
      message: createMessage("assistant", "Please log in to use the AI assistant."),
      error: "Unauthorized",
    };
  }

  // Step 2: Get available tools based on role
  const availableTools = getToolsForRoles(ctx.roles);
  const toolDefinitions = getToolDefinitions(ctx.roles);

  // Step 3: Build messages for AI provider
  const systemMessage = buildSystemMessage(ctx, availableTools);
  const messages: AIMessage[] = [
    { role: "system", content: systemMessage },
    ...conversationHistory.slice(-MAX_HISTORY).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  // Step 4: Call AI provider
  const provider = getAIProvider();
  let response: AIProviderResponse;

  try {
    response = await provider.chat({
      messages,
      tools: toolDefinitions.length > 0 ? toolDefinitions : undefined,
      maxTokens: 1024,
    });
  } catch (err: any) {
    return {
      message: createMessage("assistant", "I encountered an error processing your request. Please try again."),
      error: err.message,
    };
  }

  // Step 5: Handle tool calls
  if (response.toolCalls && response.toolCalls.length > 0) {
    const toolResults: { name: string; arguments: any; result: any }[] = [];

    for (const toolCall of response.toolCalls) {
      const tool = getToolByName(toolCall.name);

      if (!tool) {
        toolResults.push({
          name: toolCall.name,
          arguments: toolCall.arguments,
          result: { error: `Unknown tool: ${toolCall.name}` },
        });
        continue;
      }

      // Step 5a: Verify RBAC permission for this specific tool
      if (tool.requiredPermission && !ctx.permissions.includes(tool.requiredPermission) && !ctx.roles.includes("SUPER_ADMIN")) {
        toolResults.push({
          name: tool.name,
          arguments: toolCall.arguments,
          result: { error: "Access denied: insufficient permissions" },
        });
        continue;
      }

      // Step 5b: Execute the tool with user context
      try {
        const result = await tool.execute(ctx, toolCall.arguments);
        toolResults.push({
          name: tool.name,
          arguments: toolCall.arguments,
          result,
        });
      } catch (err: any) {
        toolResults.push({
          name: tool.name,
          arguments: toolCall.arguments,
          result: { error: err.message },
        });
      }
    }

    // Step 6: Format response with tool results
    const assistantContent = formatToolResults(toolResults);

    return {
      message: createMessage("assistant", assistantContent, toolResults),
    };
  }

  // Step 7: Return direct AI response
  return {
    message: createMessage("assistant", response.content || "I couldn't process that request. Please try rephrasing."),
  };
}

// ─── Helpers ──────────────────────────────────────────────

function createMessage(role: "user" | "assistant", content: string, toolCalls?: any[]): ChatMessage {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    role,
    content,
    toolCalls,
    timestamp: new Date().toISOString(),
  };
}

function buildSystemMessage(ctx: AuthorizationContext, tools: AITool[]): string {
  const roleList = ctx.roles.join(", ");

  return `You are a helpful AI assistant for a College Management System.

USER CONTEXT:
- Name: ${ctx.profile.first_name} ${ctx.profile.last_name}
- Roles: ${roleList}

AVAILABLE TOOLS:
You have access to ${tools.length} tools for querying college data:
${tools.map((t) => `- ${t.name}: ${t.description}`).join("\n")}

SECURITY RULES:
1. NEVER reveal internal IDs, college_id, or system internals to the user.
2. ONLY use the tools provided. NEVER attempt to access data outside the tools.
3. NEVER generate SQL queries or database commands.
4. Always present data in a user-friendly format.
5. If a tool returns an error, explain it politely.
6. Respect role-based access: only answer within the user's authorized scope.

RESPONSE STYLE:
- Be concise and helpful.
- Use bullet points for lists.
- Format numbers with Indian numbering system (e.g., ₹1,50,000).
- When showing percentages, add context (e.g., "Good" for >=75%, "Needs improvement" for <75%).
- Always end with a helpful follow-up suggestion.`;
}

function formatToolResults(results: { name: string; arguments: any; result: any }[]): string {
  if (results.length === 0) return "No results found.";

  return results
    .map((r) => {
      if (r.result?.error) return `**${r.name}**: Error - ${r.result.error}`;

      const data = r.result;
      if (data?.message) return data.message;

      // Fallback: JSON format
      return `**${r.name}**: ${JSON.stringify(data, null, 2)}`;
    })
    .join("\n\n");
}

/**
 * Get suggested questions based on user role.
 */
export function getSuggestedQuestions(roles: string[]): string[] {
  if (roles.includes("STUDENT")) {
    return [
      "What is my attendance?",
      "Show my latest published result.",
      "What are my pending fees?",
      "Show upcoming assignments.",
    ];
  }

  if (roles.includes("FACULTY") || roles.includes("HOD")) {
    return [
      "Show my students with attendance below 75%.",
      "How many students are in my sections?",
      "Show pending assignment grading.",
      "Show upcoming exams.",
    ];
  }

  if (roles.includes("SUPER_ADMIN") || roles.includes("COLLEGE_ADMIN") || roles.includes("PRINCIPAL")) {
    return [
      "Show students with attendance below 75%.",
      "Which department has the highest pass percentage?",
      "How much fee is pending?",
      "Show placement statistics.",
      "What is the total student count?",
      "Show hostel occupancy.",
    ];
  }

  return ["What can you help me with?", "Show me a summary of the college."];
}
