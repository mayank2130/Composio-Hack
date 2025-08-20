import { NextRequest, NextResponse } from "next/server";
import { composio, openai, userId } from "@/lib/config";

interface EmailCompositionRequest {
  chatContext: string;
  emailType: "podcast_request" | "cold_dm" | "sales_pitch" | "general";
  recipientEmail: string;
  recipientName?: string;
  userContext?: string;
}

interface EmailCompositionResponse {
  subject: string;
  body: string;
  isHtml: boolean;
  preview: string;
}

export async function POST(request: NextRequest) {
  try {
    const { 
      chatContext, 
      emailType, 
      recipientEmail, 
      recipientName,
      userContext 
    }: EmailCompositionRequest = await request.json();

    if (!chatContext || !emailType || !recipientEmail) {
      return NextResponse.json(
        { error: "Chat context, email type, and recipient email are required" },
        { status: 400 }
      );
    }

    // Email type specific prompts
    const emailTypePrompts = {
      podcast_request: `
        Create a professional podcast guest request email. The email should:
        - Introduce yourself briefly and professionally
        - Reference specific details from the chat context about the recipient
        - Explain why you'd like them as a guest on your podcast
        - Mention specific topics you'd like to discuss based on their expertise
        - Be concise but personal
        - Include a clear call-to-action
        - Maintain a friendly, professional tone
      `,
      cold_dm: `
        Create a personalized cold outreach email. The email should:
        - Start with a genuine compliment or reference to their work
        - Use information from the chat context to show you've researched them
        - Clearly state your purpose/value proposition
        - Keep it short and to the point
        - Include a soft call-to-action
        - Avoid being pushy or sales-y
        - Sound authentic and human
      `,
      sales_pitch: `
        Create a professional sales pitch email. The email should:
        - Open with a personalized hook based on the chat context
        - Identify a specific problem they might have
        - Present your solution clearly and concisely
        - Include social proof or credibility indicators
        - Focus on benefits, not just features
        - End with a clear, specific call-to-action
        - Maintain professionalism while being persuasive
      `,
      general: `
        Create a professional, personalized email. The email should:
        - Be context-aware based on the chat information
        - Have a clear purpose and call-to-action
        - Sound natural and conversational
        - Be appropriately formal or casual based on context
        - Show genuine interest in the recipient
      `
    };

    const prompt = `
You are an expert email writer. Based on the following information, compose a professional and engaging email:

CHAT CONTEXT (Information about the recipient):
${chatContext}

EMAIL TYPE: ${emailType.replace('_', ' ').toUpperCase()}

RECIPIENT: ${recipientEmail}${recipientName ? ` (${recipientName})` : ''}

${userContext ? `
ADDITIONAL USER CONTEXT:
${userContext}
` : ''}

INSTRUCTIONS:
${emailTypePrompts[emailType]}

IMPORTANT: Respond with ONLY a valid JSON object (no markdown code blocks, no additional text). The JSON should contain:
{
  "subject": "Email subject line",
  "body": "Email body (can include HTML if needed)",
  "isHtml": false,
  "preview": "A brief 2-3 sentence preview of the email content"
}

Make the email:
- Personalized using details from the chat context
- Professional yet approachable
- Context-appropriate for the email type
- Free of placeholder text like [Your Name] or [Company]
- Ready to send as-is
`;

    // Create OpenAI completion for email composition
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert email writer who creates personalized, professional emails based on context. You MUST respond with ONLY valid JSON - no markdown code blocks, no explanations, just the JSON object."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const emailContent = completion.choices[0]?.message?.content;
    
    if (!emailContent) {
      throw new Error("No email content generated");
    }

    // Parse the JSON response (handle markdown code blocks)
    let emailData: EmailCompositionResponse;
    try {
      // Remove markdown code blocks if present
      let cleanContent = emailContent.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      emailData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse email JSON:", emailContent);
      console.error("Parse error:", parseError);
      throw new Error("Failed to parse generated email content");
    }

    // Validate the response structure
    if (!emailData.subject || !emailData.body) {
      throw new Error("Invalid email content structure");
    }

    return NextResponse.json({
      ...emailData,
      recipientEmail,
      recipientName,
      emailType,
    });

  } catch (error) {
    console.error("Email composition error:", error);
    return NextResponse.json(
      { error: "Failed to compose email", details: (error as Error).message },
      { status: 500 }
    );
  }
}
