import { ExternalLink, Mail, Linkedin, Twitter, Globe, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

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

interface ProfilePanelProps {
  person?: PersonProfile;
}

export function ProfilePanel({ person }: ProfilePanelProps) {
  if (!person || !person.name) {
    return null;
  }

  const profile = {
    name: person.name || "Unknown",
    title: person.title || "",
    company: person.company || "",
    bio: person.bio || "",
    skills: person.skills || [],
    links: person.links || {}
  };

  return (
    <div className="w-80 border-l bg-background p-6 space-y-6 flex-shrink-0">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full mx-auto bg-muted flex items-center justify-center">
          <User className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-medium text-lg">{profile.name}</h3>
          <p className="text-sm text-muted-foreground">{profile.title}</p>
          <p className="text-sm font-medium">{profile.company}</p>
        </div>
      </div>

      {profile.bio && (
        <div>
          <h4 className="font-medium mb-3">About</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
        </div>
      )}

      {profile.skills.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Skills</h4>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {(profile.links.linkedin || profile.links.twitter || profile.links.website || profile.links.email) && (
        <div>
          <h4 className="font-medium mb-3">Links</h4>
          <div className="space-y-1">
          {profile.links.linkedin && (
            <Button variant="ghost" size="sm" className="w-full justify-start h-auto p-3 text-left" asChild>
              <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer">
                <Linkedin className="w-4 h-4 mr-3" />
                <span className="text-sm">LinkedIn</span>
                <ExternalLink className="w-3 h-3 ml-auto" />
              </a>
            </Button>
          )}
          
          {profile.links.twitter && (
            <Button variant="ghost" size="sm" className="w-full justify-start h-auto p-3 text-left" asChild>
              <a href={profile.links.twitter} target="_blank" rel="noopener noreferrer">
                <Twitter className="w-4 h-4 mr-3" />
                <span className="text-sm">Twitter</span>
                <ExternalLink className="w-3 h-3 ml-auto" />
              </a>
            </Button>
          )}
          
          {profile.links.website && (
            <Button variant="ghost" size="sm" className="w-full justify-start h-auto p-3 text-left" asChild>
              <a href={profile.links.website} target="_blank" rel="noopener noreferrer">
                <Globe className="w-4 h-4 mr-3" />
                <span className="text-sm">Website</span>
                <ExternalLink className="w-3 h-3 ml-auto" />
              </a>
            </Button>
          )}
          
          {profile.links.email && (
            <Button variant="ghost" size="sm" className="w-full justify-start h-auto p-3 text-left" asChild>
              <a href={`mailto:${profile.links.email}`}>
                <Mail className="w-4 h-4 mr-3" />
                <span className="text-sm">Email</span>
                <ExternalLink className="w-3 h-3 ml-auto" />
              </a>
            </Button>
          )}
          </div>
        </div>
      )}
    </div>
  );
}