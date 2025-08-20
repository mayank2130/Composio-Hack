import { NextRequest, NextResponse } from "next/server";
import { composio, openai } from "@/lib/config";

interface SendEmailRequest {
  recipientEmail: string;
  subject: string;
  body: string;
  isHtml?: boolean;
  cc?: string[];
  bcc?: string[];
  extraRecipients?: string[];
  userEmail?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { 
      recipientEmail, 
      subject, 
      body, 
      isHtml = false,
      cc = [],
      bcc = [],
      extraRecipients = [],
      userEmail = "mayankthakur1712@gmail.com" // Default user email
    }: SendEmailRequest = await request.json();

    if (!recipientEmail || !subject || !body) {
      return NextResponse.json(
        { error: "Recipient email, subject, and body are required" },
        { status: 400 }
      );
    }

    // Check if user has Gmail connection
    const connectedAccounts = await composio.connectedAccounts.list({
      userIds: [userEmail]
    });
    const gmailAccount = connectedAccounts.items.find((account: any) => 
      account.appName?.toLowerCase().includes('gmail')
    );

    if (!gmailAccount) {
      // Double check by trying to get tools first
      try {
        const toolsCheck = await composio.tools.get(userEmail, {
          tools: ["GMAIL_SEND_EMAIL"],
        });
        
        if (!toolsCheck || toolsCheck.length === 0) {
          return NextResponse.json({
            success: false,
            message: "Gmail account not connected. Please connect your Gmail account first.",
            needsConnection: true,
          });
        }
      } catch (toolError) {
        return NextResponse.json({
          success: false,
          message: "Gmail account not connected. Please connect your Gmail account first.",
          needsConnection: true,
        });
      }
    }

    // Get Gmail send email tool
    const toolsForResponses = await composio.tools.get(userEmail, {
      tools: ["GMAIL_SEND_EMAIL"],
    });

    const task = `Send an email to ${recipientEmail} with the subject '${subject}' and the body '${body}'${isHtml ? ' (HTML format)' : ''}${cc.length > 0 ? ` with CC: ${cc.join(', ')}` : ''}${bcc.length > 0 ? ` with BCC: ${bcc.join(', ')}` : ''}`;

    // Define the messages for the assistant
    const messages: any[] = [
      {
        role: "system",
        content: "You are a helpful assistant that can help with sending emails. Use the GMAIL_SEND_EMAIL tool to send emails."
      },
      { role: "user", content: task },
    ];

    // Create a chat completion
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools: toolsForResponses,
      tool_choice: "auto",
    });

    // Execute the tool calls
    const result = await composio.provider.handleToolCalls(userEmail, response as any);
    console.log("Email sent successfully!");
    console.log(result);

    // Process the results
    if (result && Array.isArray(result)) {
      const emailResult = result[0];
      
      if (emailResult) {
        let content = emailResult.content;
        
        if (typeof content === "string") {
          try {
            content = JSON.parse(content);
          } catch {
            // Content might not be JSON
          }
        }

        // Check if email was sent successfully
        const contentData = typeof content === 'object' ? content : {};
        const wasSuccessful = (contentData as any)?.data?.success !== false && 
                            !(contentData as any)?.error && 
                            !('error' in emailResult);

        return NextResponse.json({
          success: wasSuccessful,
          message: wasSuccessful ? "Email sent successfully!" : "Failed to send email",
          details: content,
          recipientEmail,
          subject,
          userEmail,
        });
      }
    }

    return NextResponse.json({
      success: false,
      message: "No response from email service",
    });

  } catch (error) {
    console.error("Email sending error:", error);
    return NextResponse.json(
      { error: "Failed to send email", details: (error as Error).message },
      { status: 500 }
    );
  }
}
