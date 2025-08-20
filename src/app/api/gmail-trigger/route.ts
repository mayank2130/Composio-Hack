import { NextRequest, NextResponse } from "next/server";
import { composio } from "@/lib/config";

interface GmailTriggerRequest {
  userEmail: string;
  connectedAccountId: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userEmail, connectedAccountId }: GmailTriggerRequest = await request.json();

    if (!userEmail || !connectedAccountId) {
      return NextResponse.json(
        { error: "User email and connected account ID are required" },
        { status: 400 }
      );
    }

    // Create Gmail new message trigger
    const trigger = await composio.triggers.create(
      userEmail,
      "GMAIL_NEW_GMAIL_MESSAGE",
      {
        connectedAccountId,
        triggerConfig: {
          labelIds: "INBOX",
          userId: "me",
          interval: 60,
        },
      }
    );

    console.log(`✅ Trigger created successfully. Trigger Id: ${trigger.triggerId}`);

    // Subscribe to trigger events
    composio.triggers.subscribe(
      (data) => {
        // Handle email data here
        console.log(`⚡️ Trigger event received for ${data.triggerSlug}`, JSON.stringify(data, null, 2));
      },
      { triggerId: trigger.triggerId }
    );

    return NextResponse.json({
      success: true,
      triggerId: trigger.triggerId,
      message: "Gmail trigger created and subscribed successfully",
    });

  } catch (error) {
    console.error("Gmail trigger setup error:", error);
    return NextResponse.json(
      { error: "Failed to setup Gmail trigger", details: (error as Error).message },
      { status: 500 }
    );
  }
}
