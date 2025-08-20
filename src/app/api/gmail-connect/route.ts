import { NextRequest, NextResponse } from "next/server";
import { composio } from "@/lib/config";

interface GmailConnectRequest {
  userEmail: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userEmail }: GmailConnectRequest = await request.json();

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

    // Check if user already has a Gmail connection
    try {
      const connectedAccounts = await composio.connectedAccounts.list({
        userIds: [userEmail]
      });
      
      const gmailAccount = connectedAccounts.items.find((account: any) => 
        account.appName?.toLowerCase().includes('gmail')
      );

      if (gmailAccount) {
        return NextResponse.json({
          success: true,
          message: "Gmail account is already connected",
          alreadyConnected: true,
          connectedAccount: gmailAccount,
        });
      }
    } catch (checkError) {
      console.log("Error checking existing connections:", checkError);
    }

    // Initialize connection for Gmail if not already connected
    const connectionRequest = await composio.connectedAccounts.initiate(
      userEmail,
      "ac_DpJ4CZl1ymvq" // Gmail app ID
    );

    return NextResponse.json({
      success: true,
      redirectUrl: connectionRequest.redirectUrl,
      userEmail,
    });

  } catch (error) {
    console.error("Gmail connection error:", error);
    
    // Handle multiple connected accounts error
    if ((error as any).code === 'TS-SDK::MULTIPLE_CONNECTED_ACCOUNTS') {
      return NextResponse.json({
        success: true,
        message: "Gmail account is already connected",
        alreadyConnected: true,
      });
    }
    
    return NextResponse.json(
      { error: "Failed to initialize Gmail connection", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

    // Check connected accounts
    const connectedAccounts = await composio.connectedAccounts.list({
      userIds: [userEmail]
    });
    
    return NextResponse.json({
      success: true,
      connectedAccounts: connectedAccounts.items,
      hasGmailConnection: connectedAccounts.items.some((account: any) => 
        account.appName?.toLowerCase().includes('gmail')
      ),
    });

  } catch (error) {
    console.error("Error checking Gmail connections:", error);
    return NextResponse.json(
      { error: "Failed to check Gmail connections", details: (error as Error).message },
      { status: 500 }
    );
  }
}
