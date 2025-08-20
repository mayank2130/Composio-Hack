"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Search,
  Sparkles,
  ExternalLink,
  ArrowUp,
  Mail,
} from "lucide-react";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useChatContext, type PersonProfile } from "@/contexts/ChatContext";
import { EmailComposer } from "@/components/EmailComposer";
import { GmailConnection } from "@/components/GmailConnection";

interface ChatInterfaceProps {
  initialProfile?: PersonProfile | null;
}

export function ChatInterface({ initialProfile }: ChatInterfaceProps = {}) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<PersonProfile | null>(
    initialProfile || null
  );
  const [isEmailComposerOpen, setIsEmailComposerOpen] = useState(false);
  const [isGmailConnectionOpen, setIsGmailConnectionOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    currentConversation,
    addMessage,
    updateConversationProfile,
    createNewConversation,
    currentConversationId,
  } = useChatContext();

  const messages = currentConversation?.messages || [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update profile when initialProfile changes
  useEffect(() => {
    if (initialProfile) {
      setSelectedProfile(initialProfile);
      if (currentConversationId) {
        updateConversationProfile(initialProfile);
      }
    }
  }, [initialProfile, updateConversationProfile, currentConversationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Create new conversation if none exists
    if (!currentConversationId) {
      createNewConversation();
    }

    // Add user message
    addMessage({
      type: "user",
      content: input.trim(),
    });

    const userQuery = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: userQuery }),
      });

      const data = await response.json();

      // Add assistant message with search results
      addMessage({
        type: "assistant",
        content: data.summary || "Here are the search results:",
        searchResults: data.results || [],
        profile: data.profile || undefined,
      });

      // Update selected profile if we got profile data
      if (data.profile) {
        setSelectedProfile(data.profile);
        updateConversationProfile(data.profile);
      }
    } catch (error) {
      console.error("Search error:", error);
      addMessage({
        type: "assistant",
        content:
          "Sorry, I encountered an error while searching. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (message: any) => (
    <div key={message.id} className="w-full">
      {/* User Message */}
      {message.type === "user" && (
        <div className="flex justify-end mb-4">
          <div className="bg-primary text-primary-foreground rounded-2xl px-3 sm:px-4 py-2 sm:py-3 max-w-[85%] sm:max-w-[80%] shadow-sm">
            <p className="text-sm leading-relaxed break-words">
              {message.content}
            </p>
          </div>
        </div>
      )}

      {/* Assistant Message */}
      {message.type === "assistant" && (
        <div className="mb-6">
          <div className="flex items-start gap-2 sm:gap-3 mb-4">
            <div className="bg-muted rounded-full p-1.5 sm:p-2 flex-shrink-0 mt-0.5">
              <Search className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-relaxed text-foreground break-words">
                {message.content}
              </p>

              {/* Display email data if present */}
              {message.emailData && (
                <Card className="mt-3 border-blue-200 bg-blue-50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">
                        Email Details
                      </span>
                      {message.emailData.wasSent && (
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-800"
                        >
                          Sent
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div>
                        <strong>To:</strong> {message.emailData.recipientEmail}
                      </div>
                      <div>
                        <strong>Subject:</strong> {message.emailData.subject}
                      </div>
                      <div>
                        <strong>Type:</strong>{" "}
                        {message.emailData.emailType.replace("_", " ")}
                      </div>
                      {message.emailData.wasSent &&
                        message.emailData.sentAt && (
                          <div>
                            <strong>Sent:</strong>{" "}
                            {new Date(
                              message.emailData.sentAt
                            ).toLocaleString()}
                          </div>
                        )}
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        {message.emailData.preview}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Search Results */}
          {message.searchResults && message.searchResults.length > 0 && (
            <div className="ml-6 sm:ml-11 space-y-3">
              {message.searchResults.map((result: any, index: number) => (
                <Card
                  key={index}
                  className="hover:shadow-md transition-all duration-200 cursor-pointer border hover:border-primary/30 group"
                  onClick={() =>
                    window.open(result.url, "_blank", "noopener,noreferrer")
                  }
                >
                  <CardHeader className="pb-2 sm:pb-3">
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      <CardTitle className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors leading-relaxed min-w-0">
                        {result.title}
                      </CardTitle>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <Badge
                          variant={
                            result.source === "duckduckgo"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1"
                        >
                          {result.source === "duckduckgo" ? "DDG" : "Exa"}
                        </Badge>
                        <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-3 leading-relaxed">
                      {result.snippet}
                    </p>
                    <div className="text-xs text-primary/70 truncate font-mono bg-muted/30 px-2 py-1 rounded">
                      {result.url}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Get chat context for email composition
  const getChatContext = () => {
    if (!currentConversation) return "";

    const messages = currentConversation.messages.slice(-10); // Last 10 messages for context
    return messages.map((msg) => `${msg.type}: ${msg.content}`).join("\n\n");
  };

  const getRecipientEmail = () => {
    return (
      selectedProfile?.links?.email ||
      selectedProfile?.links?.linkedin?.replace("linkedin.com/in/", "") +
        "@unknown.com" ||
      ""
    );
  };

  return (
    <>
      <SidebarInset className="flex h-screen bg-background">
        <div className="flex flex-col w-full h-full">
          {/* Header */}
          <div className="border-b bg-card/50 backdrop-blur-sm p-4 flex-shrink-0">
            <div className="max-w-4xl mx-auto w-full flex items-center cursor-pointer">
              <div className="absolute left-4">
                <SidebarTrigger />
              </div>
              <div className="flex items-center gap-3 flex-1">
                <div className="bg-primary/10 rounded-full p-2">
                  <Search className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-semibold tracking-tight truncate">
                    AI Search Chat
                  </h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      DuckDuckGo + Exa
                    </Badge>
                    {currentConversation && messages.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {messages.length} message
                        {messages.length !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsGmailConnectionOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Gmail
                </Button>

                {currentConversation &&
                  currentConversation.messages.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEmailComposerOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      Compose Email
                    </Button>
                  )}
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-10">
                {/* Empty State */}
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto">
                    <div className="bg-primary/10 rounded-full p-4 mb-6">
                      <Search className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-semibold mb-3 tracking-tight">
                      What would you like to know?
                    </h2>
                    <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                      Ask me anything and I'll search for comprehensive answers
                      using DuckDuckGo and Exa.
                    </p>
                  </div>
                )}

                {/* Messages */}
                <div className="space-y-1">
                  {messages.map(renderMessage)}

                  {/* Loading State */}
                  {isLoading && (
                    <div className="mb-6">
                      <div className="flex items-start gap-3">
                        <div className="bg-muted rounded-full p-2 flex-shrink-0">
                          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              Searching for answers...
                            </span>
                            <div className="flex gap-1">
                              <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
                              <div className="w-1 h-1 bg-primary rounded-full animate-pulse delay-100"></div>
                              <div className="w-1 h-1 bg-primary rounded-full animate-pulse delay-200"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Chat Input - Fixed at bottom */}
            <div className="flex-shrink-0 border-t bg-background/95 backdrop-blur-sm">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
                <form onSubmit={handleSubmit} className="relative">
                  <div className="relative flex items-start bg-muted/50 rounded-2xl border border-border/50 focus-within:border-primary/50 focus-within:bg-background transition-all">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        // Auto-adjust container height based on content
                        const element = e.target as HTMLInputElement;
                        element.style.height = "auto";
                        element.style.height = `${Math.min(
                          200,
                          element.scrollHeight
                        )}px`;
                      }}
                      placeholder="Ask anything..."
                      disabled={isLoading}
                      className="w-full bg-transparent border-0 px-4 py-3 sm:py-4 text-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 rounded-2xl pr-12 min-h-[44px] max-h-[200px] overflow-y-auto"
                      style={{
                        height: "auto",
                        minHeight: "44px",
                      }}
                    />
                    <Button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      size="sm"
                      className="absolute right-2 top-2 rounded-xl h-8 w-8 p-0 disabled:opacity-50 transition-all hover:scale-105"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Email Composer Dialog */}
      </SidebarInset>
      <EmailComposer
        isOpen={isEmailComposerOpen}
        onClose={() => setIsEmailComposerOpen(false)}
        chatContext={getChatContext()}
        recipientEmail={getRecipientEmail()}
        recipientName={selectedProfile?.name}
      />

      {/* Gmail Connection Dialog */}
      <GmailConnection
        isOpen={isGmailConnectionOpen}
        onClose={() => setIsGmailConnectionOpen(false)}
        userEmail="mayankthakur1712@gmail.com"
      />
    </>
  );
}
