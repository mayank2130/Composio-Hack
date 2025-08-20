"use client";

import { useState, useCallback } from "react";
import {
  MessageCircle,
  Plus,
  Search,
  User,
  Calendar,
  ExternalLink,
  Trash2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatContext } from "@/contexts/ChatContext";

interface AppSidebarProps {
  onPersonSelect?: (profile: any) => void;
}

export function AppSidebar({ onPersonSelect }: AppSidebarProps = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const {
    conversations,
    currentConversationId,
    createNewConversation,
    switchConversation,
    deleteConversation,
  } = useChatContext();

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.profile?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.profile?.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return `${Math.floor(diffInDays / 7)}w ago`;
  };

  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleConversationClick = useCallback((conversationId: string, profile?: any) => {
    switchConversation(conversationId);
    if (profile) {
      onPersonSelect?.(profile);
    }
  }, [switchConversation, onPersonSelect]);

  const handleDeleteConversation = useCallback((e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    deleteConversation(conversationId);
  }, [deleteConversation]);

  const handleCreateNew = useCallback(() => {
    createNewConversation();
  }, [createNewConversation]);

  return (
    <Sidebar collapsible="icon">
      {!isCollapsed && (<SidebarHeader>
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Chats</h2>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={handleCreateNew}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </SidebarHeader>
      )}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            Recent Chats ({conversations.length})
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {filteredConversations.length === 0 ? (
                <SidebarMenuItem>
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No chats yet.
                    <br />
                                         <Button
                       variant="ghost"
                       size="sm"
                       className="mt-2"
                       onClick={handleCreateNew}
                     >
                      Start one now
                    </Button>
                  </div>
                </SidebarMenuItem>
              ) : (
                filteredConversations.map((conversation) => (
                  <SidebarMenuItem key={conversation.id}>
                    <SidebarMenuButton
                      isActive={conversation.id === currentConversationId}
                      tooltip={conversation.profile?.name || conversation.title}
                      onClick={() => handleConversationClick(conversation.id, conversation.profile)}
                      className={`h-auto flex-col items-start p-3 ${conversation.id === currentConversationId ? "bg-gray-200 shadow-gray-300 shadow-md border-t" : ""}`}
                    >
                      <div className="flex items-center gap-2 w-full">
                        {conversation.profile ? (
                          <User className="h-4 w-4 flex-shrink-0" />
                        ) : (
                          <MessageCircle className="h-4 w-4 flex-shrink-0" />
                        )}
                        <div className="flex flex-col flex-1 min-w-0 text-left">
                          <span className="font-medium text-sm truncate">
                            {conversation.profile?.name || conversation.title}
                          </span>
                          {conversation.profile && (
                            <span className="text-xs text-muted-foreground truncate">
                              {conversation.profile.title}
                              {conversation.profile.company &&
                                ` • ${conversation.profile.company}`}
                            </span>
                          )}
                        </div>
                        {conversation.profile?.links && (
                          <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0 opacity-60" />
                        )}
                      </div>
                      <div className="w-full mt-1 space-y-1">
                        <span className="text-xs text-muted-foreground/80 line-clamp-2 text-left">
                          {conversation.preview}
                        </span>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground/60" />
                          <span className="text-xs text-muted-foreground/60">
                            {formatTimeAgo(conversation.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </SidebarMenuButton>
                    <SidebarMenuAction
                      showOnHover
                      onClick={(e) => handleDeleteConversation(e, conversation.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
