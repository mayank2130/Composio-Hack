import { NextRequest, NextResponse } from "next/server";
import { composio, openai, userId } from "@/lib/config";

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: "duckduckgo" | "exa";
}

interface PersonProfile {
  name: string;
  title: string;
  company: string;
  bio: string;
  skills: string[];
  links: {
    linkedin?: string;
    twitter?: string;
    website?: string;
    email?: string;
  };
}

// Simple in-memory cache
const searchCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required and must be a string" },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = query.toLowerCase().trim();
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    const results: SearchResult[] = [];
    let profileData: Partial<PersonProfile> = {};

    // Get search tools
    const tools = await composio.tools.get(userId, {
      tools: [
        "COMPOSIO_SEARCH_DUCK_DUCK_GO_SEARCH",
        "COMPOSIO_SEARCH_EXA_ANSWER",
      ],
    });

    // Create enhanced prompt for better person information
    const isPersonQuery = /(?:tell me about|who is|information about|research|profile).+/i.test(query);
    const searchPrompt = isPersonQuery 
      ? `Search for comprehensive information about: ${query}. 
         Focus on finding:
         - Professional background and current role
         - Company/organization details
         - Educational background
         - Notable achievements and projects
         - Social media and professional profiles
         - Contact information if publicly available
         - Recent news or mentions
         Use both DuckDuckGo and Exa search tools to get the most comprehensive results.`
      : `Search for information about: ${query}. Use both DuckDuckGo and Exa search tools to get comprehensive results.`;

    // Create OpenAI completion with enhanced search tools
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: searchPrompt,
        },
      ],
      tools: tools,
      max_tokens: 2000,
    });

    // Handle tool calls
    const toolResults = await composio.provider.handleToolCalls(
      userId,
      completion as any
    );

    // Process results from both search tools
    if (toolResults && Array.isArray(toolResults)) {
      toolResults.forEach((toolResult: any, index: number) => {
        try {
          // Try different ways to access the content
          let content = toolResult.content;

          if (typeof content === "string") {
            try {
              content = JSON.parse(content);
            } catch {
              // Content might not be JSON
            }
          }
          // Extract search results from the correct path
          const responseData = content?.data?.response_data;
          const searchResults =
            responseData?.organic_results || responseData?.results || [];

                      if (Array.isArray(searchResults)) {
              searchResults.slice(0, 5).forEach((result: any) => {
                if (result.title && (result.link || result.url)) {
                  const url = result.link || result.url;
                  const snippet = result.snippet || result.body || result.text || result.abstract || result.description || "";
                  
                  results.push({
                    title: result.title,
                    url: url,
                    snippet: snippet,
                    source: "duckduckgo",
                  });

                  // Extract profile information for person queries
                  if (isPersonQuery) {
                    const title = result.title.toLowerCase();
                    const snippetLower = snippet.toLowerCase();
                    
                    // Extract LinkedIn profile
                    if (url.includes('linkedin.com')) {
                      profileData.links = { ...profileData.links, linkedin: url };
                      
                      // Extract name, title, company from LinkedIn results
                      const nameMatch = title.match(/([^-]+)\s*-\s*/);
                      if (nameMatch) profileData.name = nameMatch[1].trim();
                      
                      const titleMatch = snippet.match(/([^•]+)•/);
                      if (titleMatch) profileData.title = titleMatch[1].trim();
                    }
                    
                    // Extract Twitter profile
                    if (url.includes('twitter.com') || url.includes('x.com')) {
                      profileData.links = { ...profileData.links, twitter: url };
                    }
                    
                    // Extract personal website
                    if (!url.includes('linkedin.com') && !url.includes('twitter.com') && !url.includes('x.com') && 
                        (title.includes('portfolio') || title.includes('personal') || snippetLower.includes('personal website'))) {
                      profileData.links = { ...profileData.links, website: url };
                    }
                    
                    // Extract skills and bio information
                    const skillsMatch = snippet.match(/(?:skills?|expertise|specializ\w+)[:\s]*([^.!?]+)/i);
                    if (skillsMatch && !profileData.skills) {
                      profileData.skills = skillsMatch[1].split(/[,&|]/).map((s: string) => s.trim()).filter((s: string) => s.length > 0).slice(0, 5);
                    }
                    
                    if (!profileData.bio && snippet.length > 50) {
                      profileData.bio = snippet.substring(0, 200) + (snippet.length > 200 ? '...' : '');
                    }
                  }
                }
              });
            }
        } catch (parseError) {
          console.error("Error parsing tool result:", parseError);
        }
      });
    }

    // Generate a summary based on results
    let summary = "";
    if (results.length > 0) {
      if (isPersonQuery && profileData.name) {
        summary = `Found comprehensive information about ${profileData.name}${profileData.title ? `, ${profileData.title}` : ''}${profileData.company ? ` at ${profileData.company}` : ''}.`;
      } else {
        summary = `Found ${results.length} result${
          results.length === 1 ? "" : "s"
        } for "${query}".`;
      }
    } else {
      summary = `No results found for "${query}". Please try a different search term.`;
    }

    const responseData = {
      summary,
      results,
      query,
      profile: Object.keys(profileData).length > 0 ? profileData : null,
      debug: {
        toolsCount: tools.length,
        toolCallsCount: completion.choices[0]?.message?.tool_calls?.length || 0,
        toolResultsCount: toolResults?.length || 0,
      },
    };

    // Cache the response
    searchCache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    return NextResponse.json(responseData);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
