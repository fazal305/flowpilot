import { prisma } from "../db/prisma.js";
import { renderTemplate } from "../lib/template.js";

export async function executeNotification(config, input, context) {
  const message = renderTemplate(config.messageTemplate, input);

  if (config.channel === "inApp") {
    const notification = await prisma.notification.create({
      data: {
        workspaceId: context.workspaceId,
        type: "SYSTEM",
        title: `Notification from workflow`,
        body: message,
      },
    });
    return { channel: "inApp", delivered: true, notificationId: notification.id, message };
  }

  // Email/outbound-webhook providers aren't chosen yet (no external API was
  // justified for the MVP — see README). Recorded, not silently dropped.
  return {
    channel: config.channel,
    delivered: false,
    note: `Channel "${config.channel}" isn't wired to a real provider yet.`,
    target: config.target,
    message,
  };
}
