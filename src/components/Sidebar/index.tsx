"use client";

import { useState } from "react";
import {
  MessageCircle,
  Plus,
  Search,
  User,
  Calendar,
  ExternalLink,
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
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Chat {
  id: string;
  name: string;
  title: string;
  company: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  linkedin?: string;
  twitter?: string;
  website?: string;
}

const savedChats: Chat[] = [
  {
    id: "1",
    name: "Adithya S Kolavi",
    title: "AI Researcher",
    company: "CognitiveLab",
    lastMessage: "Research about AI and Indic LLM Leaderboard",
    timestamp: "2h ago",
    unread: 0,
    linkedin: "https://in.linkedin.com/in/adithya-s-kolavi",
    website: "https://adithyask.com/",
  },
  {
    id: "2",
    name: "Michael Rodriguez",
    title: "VP Engineering",
    company: "DataCore",
    lastMessage: "Technical leadership insights",
    timestamp: "1d ago",
    unread: 2,
  },
  {
    id: "3",
    name: "Emily Zhang",
    title: "Marketing Director",
    company: "GrowthLabs",
    lastMessage: "Growth marketing strategies",
    timestamp: "3d ago",
    unread: 0,
  },
  {
    id: "4",
    name: "Sarah Chen",
    title: "Product Manager",
    company: "TechFlow Inc.",
    lastMessage: "Research about B2B product strategy",
    timestamp: "1w ago",
    unread: 1,
  },
];

interface AppSidebarProps {
  onPersonSelect?: (person: Chat) => void;
}

export function AppSidebar({ onPersonSelect }: AppSidebarProps = {}) {
  const { state } = useSidebar();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChatId, setSelectedChatId] = useState("1");

  const filteredChats = savedChats.filter(
    (chat) =>
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        {!isCollapsed && (
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium">Contacts</h2>
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="px-4 py-2 text-xs font-medium text-muted-foreground">
              Recent Conversations
            </SidebarGroupLabel>
          )}

          <SidebarGroupContent>
            <SidebarMenu>
              {filteredChats.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton
                    className={`
            group relative p-3 h-fit rounded-lg transition-all duration-200 cursor-pointer
            border border-transparent hover:border-border/50
            ${
              chat.id === selectedChatId
                ? "bg-accent text-accent-foreground border-border shadow-sm"
                : "hover:bg-accent/50"
            }
          `}
                    onClick={() => {
                      setSelectedChatId(chat.id);
                      onPersonSelect?.(chat);
                    }}
                  >
                    {isCollapsed ? (
                      <div className="relative flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        {chat.unread > 0 && (
                          <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-4 min-w-4 text-xs px-1 animate-pulse"
                          >
                            {chat.unread}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 w-full min-w-0">
                        <div className="relative flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          {chat.unread > 0 && (
                            <Badge
                              variant="destructive"
                              className="absolute -top-1 -right-1 h-4 min-w-4 text-xs px-1 animate-pulse"
                            >
                              {chat.unread}
                            </Badge>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold text-sm truncate text-foreground">
                              {chat.name}
                            </h3>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {(chat.linkedin || chat.website) && (
                                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <p className="text-xs font-medium text-muted-foreground truncate">
                              {chat.title} {chat.company && `• ${chat.company}`}
                            </p>

                            <p className="text-xs text-muted-foreground/80 truncate leading-tight">
                              {chat.lastMessage}
                            </p>

                            <div className="flex items-center gap-1 pt-0.5">
                              <Calendar className="h-3 w-3 text-muted-foreground/60" />
                              <span className="text-xs text-muted-foreground/60 font-mono">
                                {chat.timestamp}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
