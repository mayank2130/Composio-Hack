"use client";

import { useState } from "react";
import { ChatInterface } from "@/components/chat-interface";
import { AppSidebar } from "@/components/Sidebar";
import { type PersonProfile } from "@/contexts/ChatContext";

export default function Home() {
  const [selectedProfile, setSelectedProfile] = useState<PersonProfile | null>(null);

  const handlePersonSelect = (profile: PersonProfile) => {
    setSelectedProfile(profile);
  };

  return (
    <div className="flex h-screen w-full">
      <AppSidebar onPersonSelect={handlePersonSelect} />
      <ChatInterface initialProfile={selectedProfile} />
    </div>
  );
}
