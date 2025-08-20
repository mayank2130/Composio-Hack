"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Search, Sparkles, ExternalLink } from "lucide-react";
import { ProfilePanel } from "@/components/ProfileLinks";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  searchResults?: SearchResult[];
  profile?: PersonProfile;
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: "duckduckgo" | "exa";
}

interface PersonProfile {
  name?: string;
  title?: string;
  company?: string;
  bio?: string;
  skills?: string[];
  links?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
    email?: string;
  };
}

interface ChatInterfaceProps {
  initialProfile?: PersonProfile | null;
}

export function ChatInterface({ initialProfile }: ChatInterfaceProps = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<PersonProfile | null>(
    initialProfile || null
  );

  // Update profile when initialProfile changes
  useEffect(() => {
    if (initialProfile) {
      setSelectedProfile(initialProfile);
    }
  }, [initialProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: input.trim() }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: data.summary || "Here are the search results:",
        timestamp: new Date(),
        searchResults: data.results || [],
        profile: data.profile || null,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Update selected profile if we got profile data
      if (data.profile) {
        setSelectedProfile(data.profile);
      }
    } catch (error) {
      console.error("Search error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content:
          "Sorry, I encountered an error while searching. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-row w-full">
      <SidebarInset className="flex-1 h-full w-full bg-background">
        {/* Main Chat Area */}
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="border-b bg-card p-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="mr-2" />
              <Search className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold">AI Search Chat</h1>
              <Badge variant="secondary" className="ml-2">
                <Sparkles className="h-3 w-3 mr-1" />
                DuckDuckGo + Exa
              </Badge>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h2 className="text-lg font-medium mb-2">
                  Start a conversation
                </h2>
                <p>
                  Ask me anything and I&apos;ll search for answers using
                  DuckDuckGo and Exa.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {/* Search Results */}
            {messages.map((message) =>
              message.searchResults && message.searchResults.length > 0 ? (
                <div key={`results-${message.id}`} className="space-y-3">
                  {message.searchResults.map((result, index) => (
                    <Card
                      key={index}
                      className="hover:shadow-md transition-all duration-200 cursor-pointer border hover:border-primary/50"
                      onClick={() =>
                        window.open(result.url, "_blank", "noopener,noreferrer")
                      }
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium line-clamp-2 hover:text-primary transition-colors">
                            {result.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge
                              variant={
                                result.source === "duckduckgo"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {result.source === "duckduckgo" ? "DDG" : "Exa"}
                            </Badge>
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-3">
                          {result.snippet}
                        </p>
                        <div className="text-xs text-primary/80 truncate font-mono">
                          {result.url}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : null
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    <span className="text-sm">Searching...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t bg-card p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </SidebarInset>

      {selectedProfile && <ProfilePanel person={selectedProfile} />}
    </div>
  );
}
