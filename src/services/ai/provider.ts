/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AI Provider Abstraction
 *
 * Defines the interface for AI providers. No API keys are hardcoded.
 * Configure via environment variables:
 *   AI_PROVIDER=openai | anthropic | console
 *   AI_API_KEY=your-api-key
 *   AI_MODEL=model-name
 *
 * When no provider is configured, falls back to ConsoleAIProvider
 * which simulates AI responses for development/testing.
 */

// ─── Types ────────────────────────────────────────────────

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface AIProviderResponse {
  content?: string;
  toolCalls?:AIToolCall[];
  error?: string;
}

export interface AIProviderConfig {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  maxTokens?: number;
}

// ─── Provider Interface ───────────────────────────────────

export interface AIProvider {
  name: string;

  /**
   * Send a chat completion request to the AI provider.
   * The provider should support tool/function calling.
   */
  chat(params: {
    messages: AIMessage[];
    tools?: any[];
    maxTokens?: number;
  }): Promise<AIProviderResponse>;
}

// ─── Console Provider (Development) ───────────────────────

/**
 * Console-based AI provider for development and testing.
 * Simulates tool calling by pattern-matching user queries
 * against known tool names. No external API calls.
 */
class ConsoleAIProvider implements AIProvider {
  name = "console";

  async chat(params: {
    messages: AIMessage[];
    tools?: any[];
    maxTokens?: number;
  }): Promise<AIProviderResponse> {
    const lastMessage = params.messages[params.messages.length - 1];
    const userQuery = lastMessage?.content?.toLowerCase() || "";

    // Simulate tool calling based on query patterns
    if (params.tools && params.tools.length > 0) {
      const toolCall = this.matchTool(userQuery, params.tools);
      if (toolCall) {
        return {
          toolCalls: [toolCall],
        };
      }
    }

    // Default conversational response
    return {
      content: this.generateResponse(userQuery),
    };
  }

  private matchTool(query: string, tools: any[]):AIToolCall | null {
    // Pattern matching for tool invocation
    const patterns: [RegExp, string, (q: string) => Record<string, any>][] = [
      [/attend.*below.*75|shortage|low attend/i, "get_students_with_low_attendance", (q) => {
        const match = q.match(/(\d+)%/);
        return { threshold: match ? parseInt(match[1]) : 75 };
      }],
      [/attend.*my|my attend/i, "get_my_attendance", () => ({})],
      [/my.*result|latest.*result|my.*mark/i, "get_my_results", () => ({})],
      [/fee.*pend|pending.*fee|how much.*fee/i, "get_fee_summary", () => ({})],
      [/placement.*stat|placement.*detail|placement/i, "get_placement_overview", () => ({})],
      [/student.*count|total.*student|how many student/i, "get_student_count", () => ({})],
      [/faculty.*count|total.*faculty|how many faculty/i, "get_faculty_count", () => ({})],
      [/department.*highest.*pass|best.*department|highest.*pass/i, "get_department_performance", () => ({})],
      [/my.*student|my.*class|show.*my.*student/i, "get_my_students", () => ({})],
      [/hostel.*occupan|hostel.*stat/i, "get_hostel_overview", () => ({})],
      [/library.*stat|library.*overdue/i, "get_library_overview", () => ({})],
      [/exam.*upcom|upcoming.*exam/i, "get_upcoming_exams", () => ({})],
      [/assignment.*due|due.*assignment/i, "get_pending_assignments", () => ({})],
    ];

    for (const [pattern, toolName, argFn] of patterns) {
      if (pattern.test(query)) {
        return {
          id: `call_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          name: toolName,
          arguments: argFn(query),
        };
      }
    }

    return null;
  }

  private generateResponse(query: string): string {
    if (query.includes("hello") || query.includes("hi ")) {
      return "Hello! I'm your college AI assistant. I can help you with attendance, results, fees, and more. Try asking something like 'What is my attendance?' or 'Show students with low attendance.'";
    }
    if (query.includes("help")) {
      return "I can help with:\n• **Attendance**: Check your attendance, find students with shortages\n• **Results**: View your latest results, department performance\n• **Fees**: Check pending fees, fee summary\n• **Students/Faculty**: Count, department stats\n• **Placement**: Placement statistics\n\nJust ask a question in natural language!";
    }
    return "I'm processing your request. You can ask me about attendance, results, fees, students, faculty, or placement statistics.";
  }
}

// ─── Provider Factory ─────────────────────────────────────

let providerInstance: AIProvider | null = null;

/**
 * Get the configured AI provider.
 * Uses environment variables to determine which provider to use.
 * Falls back to ConsoleAIProvider for development.
 */
export function getAIProvider(): AIProvider {
  if (providerInstance) return providerInstance;

  const providerName = process.env.AI_PROVIDER || "console";

  switch (providerName.toLowerCase()) {
    case "openai":
      // Lazy import to avoid loading unused dependencies
      // providerInstance = new OpenAIProvider({ ... });
      // break;
      console.log("[AI] OpenAI provider configured but not loaded. Using console provider.");
      providerInstance = new ConsoleAIProvider();
      break;
    case "anthropic":
      console.log("[AI] Anthropic provider configured but not loaded. Using console provider.");
      providerInstance = new ConsoleAIProvider();
      break;
    case "console":
    default:
      providerInstance = new ConsoleAIProvider();
      break;
  }

  return providerInstance;
}

/**
 * Reset the provider instance (for testing).
 */
export function resetAIProvider() {
  providerInstance = null;
}
