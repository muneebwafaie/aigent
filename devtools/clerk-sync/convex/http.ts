import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/backend";

const http = httpRouter();

http.route({
  path: "/clerk-roles",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const event = await validateRequest(request);
    if (!event) {
      return new Response("Error occured", { status: 400 });
    }
    const { type, data } = event;

    // We only care about permission and roles from the 'instance' level?
    // Or org level? Clerk "Custom Roles" are usually instance level, but can be org-specific.
    // The webhook types are generally generic.

    switch (type) {
      case "permission.created":
      case "permission.updated": {
        const perm = data;
        await ctx.runMutation(internal.sync.upsertPermission, {
          clerkId: perm.id,
          key: perm.key,
          name: perm.name,
          description: perm.description,
        });
        break;
      }
      case "permission.deleted": {
        const perm = data;
        await ctx.runMutation(internal.sync.deletePermission, {
          clerkId: perm.id,
        });
        break;
      }
      case "role.created":
      case "role.updated": {
        // Clerk RoleJSON has `permissions` array of Permission objects
        const role = data; // This typing might need adjustment depending on exact version
        // Map permissions to their keys
        // The type definition for RoleJSON in @clerk/backend usually has permissions: PermissionJSON[]
        // But let's check creating a safe mapper
        const permissionKeys = (role.permissions || []).map((p) => p.key);

        await ctx.runMutation(internal.sync.upsertRole, {
          clerkId: role.id,
          key: role.key,
          name: role.name,
          description: role.description,
          permissionKeys
        });
        break;
      }
      case "role.deleted": {
        const role = data;
        await ctx.runMutation(internal.sync.deleteRole, {
          clerkId: role.id,
        });
        break;
      }
    }

    return new Response(null, { status: 200 });
  }),
});

/**
 * Verify and parse a Clerk webhook request using Svix signature headers and the CLERK_WEBHOOK_SECRET.
 *
 * @param req - Incoming HTTP request containing the raw webhook payload and Svix signature headers (`svix-id`, `svix-timestamp`, `svix-signature`).
 * @returns The verified `WebhookEvent` when verification succeeds, `null` when headers are missing or verification fails.
 */
async function validateRequest(req: Request): Promise<WebhookEvent | null> {
  const payloadString = await req.text();
  const svixHeaders = {
    "svix-id": req.headers.get("svix-id")!,
    "svix-timestamp": req.headers.get("svix-timestamp")!,
    "svix-signature": req.headers.get("svix-signature")!,
  };
  if (
    !svixHeaders["svix-id"] ||
    !svixHeaders["svix-timestamp"] ||
    !svixHeaders["svix-signature"]
  ) {
    return null;
  }
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  try {
    return wh.verify(payloadString, svixHeaders) as unknown as WebhookEvent;
  } catch (error) {
    console.error("Error verifying webhook event", error);
    return null;
  }
}

export default http;
