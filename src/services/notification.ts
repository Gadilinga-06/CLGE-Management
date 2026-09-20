/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Notification Service
 *
 * Provides a unified interface for sending notifications across multiple channels.
 * Supports pluggable providers for Email, SMS, and Push notifications.
 *
 * When no external provider is configured, falls back to development logging.
 * The in-app notification system (database) is always used regardless of provider config.
 */

// ─── Provider Interfaces ──────────────────────────────────

export interface EmailProvider {
  name: string;
  send(params: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

export interface SmsProvider {
  name: string;
  send(params: {
    to: string;
    message: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

export interface PushProvider {
  name: string;
  send(params: {
    userId: string;
    title: string;
    body: string;
    data?: Record<string, any>;
  }): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// ─── Console-based Development Providers ──────────────────

class ConsoleEmailProvider implements EmailProvider {
  name = "console-email";

  async send(params: { to: string; subject: string; html: string; text?: string }) {
    console.log(`[EMAIL] To: ${params.to} | Subject: ${params.subject}`);
    console.log(`[EMAIL] Body preview: ${params.text || params.html.substring(0, 100)}...`);
    return { success: true, messageId: `dev-${Date.now()}` };
  }
}

class ConsoleSmsProvider implements SmsProvider {
  name = "console-sms";

  async send(params: { to: string; message: string }) {
    console.log(`[SMS] To: ${params.to} | Message: ${params.message}`);
    return { success: true, messageId: `dev-${Date.now()}` };
  }
}

class ConsolePushProvider implements PushProvider {
  name = "console-push";

  async send(params: { userId: string; title: string; body: string; data?: Record<string, any> }) {
    console.log(`[PUSH] User: ${params.userId} | Title: ${params.title} | Body: ${params.body}`);
    return { success: true, messageId: `dev-${Date.now()}` };
  }
}

// ─── Service Configuration ────────────────────────────────

export interface NotificationConfig {
  email?: EmailProvider;
  sms?: SmsProvider;
  push?: PushProvider;
}

let config: NotificationConfig = {
  email: new ConsoleEmailProvider(),
  sms: new ConsoleSmsProvider(),
  push: new ConsolePushProvider(),
};

/**
 * Configure notification providers.
 * Call this once at startup or via environment-based initialization.
 */
export function configureProviders(providers: Partial<NotificationConfig>) {
  config = { ...config, ...providers };
}

/**
 * Get the current notification configuration.
 */
export function getProviders(): NotificationConfig {
  return config;
}

// ─── High-Level Notification API ──────────────────────────

export interface SendNotificationOptions {
  userId: string;
  title: string;
  message: string;
  category?: string;
  link?: string;
  channels?: ("inapp" | "email" | "sms" | "push")[];
  email?: { subject: string; html: string };
  sms?: { message: string };
  push?: { title: string; body: string; data?: Record<string, any> };
}

/**
 * Send a notification across multiple channels.
 * Always creates an in-app notification (database record).
 * Optionally sends via email, SMS, or push based on configuration and provider availability.
 */
export async function sendNotification(options: SendNotificationOptions): Promise<{
  inapp: { success: boolean; error?: string };
  email?: { success: boolean; error?: string };
  sms?: { success: boolean; error?: string };
  push?: { success: boolean; error?: string };
}> {
  const channels = options.channels || ["inapp"];
  const results: any = {};

  // Always create in-app notification
  if (channels.includes("inapp")) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { error } = await supabase.from("notifications").insert({
        user_id: options.userId,
        title: options.title,
        message: options.message,
        type: "INFO",
        category: options.category || "SYSTEM",
        link: options.link || null,
        is_read: false,
      });
      results.inapp = { success: !error, error: error?.message };
    } catch (err: any) {
      results.inapp = { success: false, error: err.message };
    }
  }

  // Send email if configured and requested
  if (channels.includes("email") && options.email && config.email) {
    // Get user email from profiles
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", options.userId)
        .single();

      if (profile?.email) {
        results.email = await config.email.send({
          to: profile.email,
          subject: options.email.subject,
          html: options.email.html,
        });
      } else {
        results.email = { success: false, error: "No email address found" };
      }
    } catch (err: any) {
      results.email = { success: false, error: err.message };
    }
  }

  // Send SMS if configured and requested
  if (channels.includes("sms") && options.sms && config.sms) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", options.userId)
        .single();

      if (profile?.phone) {
        results.sms = await config.sms.send({
          to: profile.phone,
          message: options.sms.message,
        });
      } else {
        results.sms = { success: false, error: "No phone number found" };
      }
    } catch (err: any) {
      results.sms = { success: false, error: err.message };
    }
  }

  // Send push if configured and requested
  if (channels.includes("push") && options.push && config.push) {
    results.push = await config.push.send({
      userId: options.userId,
      title: options.push.title,
      body: options.push.body,
      data: options.push.data,
    });
  }

  return results;
}

/**
 * Send a batch notification to multiple users.
 */
export async function sendBulkNotification(
  userIds: string[],
  options: Omit<SendNotificationOptions, "userId">
): Promise<{ total: number; success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  // Process in batches of 10 to avoid overwhelming the database
  for (let i = 0; i < userIds.length; i += 10) {
    const batch = userIds.slice(i, i + 10);
    const results = await Promise.allSettled(
      batch.map((userId) => sendNotification({ ...options, userId }))
    );

    results.forEach((r) => {
      if (r.status === "fulfilled" && r.value.inapp.success) {
        success++;
      } else {
        failed++;
      }
    });
  }

  return { total: userIds.length, success, failed };
}
