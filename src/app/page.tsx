"use client";

import { useState } from "react";
import { ChatInterface } from "@/components/chat-interface";
import { AppSidebar } from "@/components/Sidebar";

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

export default function Home() {
  const [selectedProfile, setSelectedProfile] = useState<PersonProfile | null>(null);

  const handlePersonSelect = (person: any) => {
    setSelectedProfile({
      name: person.name,
      title: person.title,
      company: person.company,
      bio: `${person.title} at ${person.company}`,
      skills: [],
      links: {
        linkedin: person.linkedin,
        twitter: person.twitter,
        website: person.website,
      }
    });
  };

  return (
    <div className="flex h-screen w-full">
      <AppSidebar onPersonSelect={handlePersonSelect} />
      <ChatInterface initialProfile={selectedProfile} />
    </div>
  );
}
