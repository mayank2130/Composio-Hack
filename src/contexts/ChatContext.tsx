"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: "duckduckgo" | "exa";
}

export interface PersonProfile {
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

export interface EmailData {
  subject: string;
  body: string;
  isHtml: boolean;
  preview: string;
  recipientEmail: string;
  recipientName?: string;
  emailType: string;
  cc?: string[];
  bcc?: string[];
  wasSent?: boolean;
  sentAt?: Date;
}

export interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  searchResults?: SearchResult[];
  profile?: PersonProfile;
  emailData?: EmailData;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  profile?: PersonProfile;
  createdAt: Date;
  updatedAt: Date;
  preview: string; // Last message preview
  emails?: EmailData[]; // All composed emails for this conversation
}

interface ChatContextType {
  conversations: Conversation[];
  currentConversationId: string | null;
  currentConversation: Conversation | null;
  isLoading: boolean;
  
  // Actions
  createNewConversation: (title?: string) => string;
  switchConversation: (conversationId: string) => void;
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  updateConversationProfile: (profile: PersonProfile) => void;
  deleteConversation: (conversationId: string) => void;
  clearAllConversations: () => void;
  
  // Email actions
  saveEmailToConversation: (emailData: EmailData) => void;
  updateEmailInConversation: (emailData: EmailData, emailIndex?: number) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const STORAGE_KEY = "composio-chat-data";

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        const parsedConversations = data.conversations.map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
        setConversations(parsedConversations);
        setCurrentConversationId(data.currentConversationId);
      }
    } catch (error) {
      console.error("Error loading chat data:", error);
    }
    setIsLoading(false);
  }, []);

  // Save data to localStorage whenever conversations change
  useEffect(() => {
    if (!isLoading) {
      try {
        const dataToSave = {
          conversations,
          currentConversationId,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (error) {
        console.error("Error saving chat data:", error);
      }
    }
  }, [conversations, currentConversationId, isLoading]);

  const createNewConversation = useCallback((title?: string): string => {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const newConversation: Conversation = {
      id,
      title: title || "New Conversation",
      messages: [],
      createdAt: now,
      updatedAt: now,
      preview: "Start a new conversation...",
    };

    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(id);
    return id;
  }, []);

  const switchConversation = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId);
  }, []);

  const addMessage = useCallback((messageData: Omit<Message, "id" | "timestamp">) => {
    let targetConversationId = currentConversationId;
    
    if (!targetConversationId) {
      // Create new conversation if none exists
      targetConversationId = createNewConversation();
    }

    const message: Message = {
      ...messageData,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === targetConversationId) {
        const updatedMessages = [...conv.messages, message];
        
        // Update conversation title if it's the first user message
        let newTitle = conv.title;
        if (conv.messages.length === 0 && message.type === "user") {
          newTitle = message.content.slice(0, 50) + (message.content.length > 50 ? "..." : "");
        }

        return {
          ...conv,
          title: newTitle,
          messages: updatedMessages,
          updatedAt: new Date(),
          preview: message.content.slice(0, 100) + (message.content.length > 100 ? "..." : ""),
        };
      }
      return conv;
    }));
  }, [currentConversationId, createNewConversation]);

  const updateConversationProfile = useCallback((profile: PersonProfile) => {
    if (!currentConversationId) return;

    setConversations(prev => prev.map(conv => {
      if (conv.id === currentConversationId) {
        return {
          ...conv,
          profile,
          updatedAt: new Date(),
        };
      }
      return conv;
    }));
  }, [currentConversationId]);

  const deleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => {
      const filtered = prev.filter(conv => conv.id !== conversationId);
      
      // Update current conversation if we're deleting the active one
      if (currentConversationId === conversationId) {
        setCurrentConversationId(filtered.length > 0 ? filtered[0].id : null);
      }
      
      return filtered;
    });
  }, [currentConversationId]);

  const clearAllConversations = useCallback(() => {
    setConversations([]);
    setCurrentConversationId(null);
  }, []);

  const saveEmailToConversation = useCallback((emailData: EmailData) => {
    if (!currentConversationId) return;

    setConversations(prev => prev.map(conv => {
      if (conv.id === currentConversationId) {
        const updatedEmails = [...(conv.emails || []), emailData];
        
        // Also add an email message to the conversation
        const emailMessage: Message = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: "assistant",
          content: `📧 Email composed: ${emailData.subject}`,
          timestamp: new Date(),
          emailData,
        };

        return {
          ...conv,
          emails: updatedEmails,
          messages: [...conv.messages, emailMessage],
          updatedAt: new Date(),
          preview: `📧 Email: ${emailData.subject}`,
        };
      }
      return conv;
    }));
  }, [currentConversationId]);

  const updateEmailInConversation = useCallback((emailData: EmailData, emailIndex?: number) => {
    if (!currentConversationId) return;

    setConversations(prev => prev.map(conv => {
      if (conv.id === currentConversationId) {
        const updatedEmails = [...(conv.emails || [])];
        
        if (emailIndex !== undefined && emailIndex >= 0 && emailIndex < updatedEmails.length) {
          updatedEmails[emailIndex] = emailData;
        } else {
          // Find the most recent email and update it
          const lastEmailIndex = updatedEmails.length - 1;
          if (lastEmailIndex >= 0) {
            updatedEmails[lastEmailIndex] = emailData;
          }
        }

        // Update the corresponding message as well
        const updatedMessages = conv.messages.map(msg => {
          if (msg.emailData && msg.emailData.subject === emailData.subject) {
            return { ...msg, emailData, content: `📧 Email composed: ${emailData.subject}` };
          }
          return msg;
        });

        return {
          ...conv,
          emails: updatedEmails,
          messages: updatedMessages,
          updatedAt: new Date(),
        };
      }
      return conv;
    }));
  }, [currentConversationId]);

  const currentConversation = conversations.find(conv => conv.id === currentConversationId) || null;

  const value: ChatContextType = {
    conversations,
    currentConversationId,
    currentConversation,
    isLoading,
    createNewConversation,
    switchConversation,
    addMessage,
    updateConversationProfile,
    deleteConversation,
    clearAllConversations,
    saveEmailToConversation,
    updateEmailInConversation,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
