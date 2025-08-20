"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Send, Loader2, Eye, EyeOff, X, CheckCircle, AlertCircle, Edit3, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useChatContext, type EmailData } from "@/contexts/ChatContext";
import { GmailConnection } from "@/components/GmailConnection";

interface EmailComposerProps {
  isOpen: boolean;
  onClose: () => void;
  chatContext?: string;
  recipientEmail?: string;
  recipientName?: string;
}

// EmailData interface is now imported from ChatContext

const EMAIL_TYPES = [
  { value: "podcast_request", label: "Podcast Guest Request", description: "Invite someone to be a guest on your podcast" },
  { value: "cold_dm", label: "Cold Outreach", description: "Professional networking or introduction email" },
  { value: "sales_pitch", label: "Sales Pitch", description: "Product or service promotion email" },
  { value: "general", label: "General Email", description: "Custom professional email" },
];

export function EmailComposer({ isOpen, onClose, chatContext = "", recipientEmail = "", recipientName }: EmailComposerProps) {
  const { saveEmailToConversation, updateEmailInConversation } = useChatContext();
  
  const [emailType, setEmailType] = useState<string>("");
  const [email, setEmail] = useState<string>(recipientEmail);
  const [name, setName] = useState<string>(recipientName || "");
  const [userContext, setUserContext] = useState<string>("");
  const [composedEmail, setComposedEmail] = useState<EmailData | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Additional email options
  const [cc, setCc] = useState<string>("");
  const [bcc, setBcc] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Editing states
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [isEditingBody, setIsEditingBody] = useState(false);
  const [editedSubject, setEditedSubject] = useState<string>("");
  const [editedBody, setEditedBody] = useState<string>("");
  
  // Gmail connection states
  const [isGmailConnectionOpen, setIsGmailConnectionOpen] = useState(false);
  const [userEmail] = useState("mayankthakur1712@gmail.com"); // Default user email

  const handleCompose = useCallback(async () => {
    if (!emailType || !email || !chatContext) return;

    setIsComposing(true);
    setSendResult(null);

    try {
      const response = await fetch("/api/compose-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatContext,
          emailType,
          recipientEmail: email,
          recipientName: name,
          userContext: userContext || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to compose email");
      }

             const emailData = await response.json();
       setComposedEmail(emailData);
       setEditedSubject(emailData.subject);
       setEditedBody(emailData.body);
       
       // Save to chat context
       saveEmailToConversation(emailData);
    } catch (error) {
      console.error("Error composing email:", error);
      setSendResult({ 
        success: false, 
        message: "Failed to compose email. Please try again." 
      });
    } finally {
      setIsComposing(false);
    }
  }, [emailType, email, name, chatContext, userContext]);

  const handleSend = useCallback(async () => {
    if (!composedEmail) return;

    // Use edited content if available
    const finalSubject = editedSubject || composedEmail.subject;
    const finalBody = editedBody || composedEmail.body;

    setIsSending(true);
    setSendResult(null);

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: composedEmail.recipientEmail,
          subject: finalSubject,
          body: finalBody,
          isHtml: composedEmail.isHtml,
          cc: cc ? cc.split(',').map(e => e.trim()).filter(e => e) : [],
          bcc: bcc ? bcc.split(',').map(e => e.trim()).filter(e => e) : [],
          userEmail: userEmail,
        }),
      });

      const result = await response.json();
      
      setSendResult({
        success: result.success || false,
        message: result.message || (result.success ? "Email sent successfully!" : "Failed to send email")
      });

      // Handle Gmail connection requirement
      if (result.needsConnection) {
        setIsGmailConnectionOpen(true);
        return;
      }

      if (result.success) {
        // Update email with sent status
        const updatedEmailData: EmailData = {
          ...composedEmail,
          subject: finalSubject,
          body: finalBody,
          cc: cc ? cc.split(',').map(e => e.trim()).filter(e => e) : [],
          bcc: bcc ? bcc.split(',').map(e => e.trim()).filter(e => e) : [],
          wasSent: true,
          sentAt: new Date(),
        };
        
        updateEmailInConversation(updatedEmailData);
        
        setTimeout(() => {
          onClose();
          resetForm();
        }, 2000);
      }
    } catch (error) {
      console.error("Error sending email:", error);
      setSendResult({ 
        success: false, 
        message: "Failed to send email. Please try again." 
      });
    } finally {
      setIsSending(false);
    }
  }, [composedEmail, cc, bcc, editedSubject, editedBody, updateEmailInConversation, onClose]);

  const resetForm = useCallback(() => {
    setEmailType("");
    setEmail(recipientEmail);
    setName(recipientName || "");
    setUserContext("");
    setComposedEmail(null);
    setShowPreview(false);
    setSendResult(null);
    setCc("");
    setBcc("");
    setShowAdvanced(false);
    setIsEditingSubject(false);
    setIsEditingBody(false);
    setEditedSubject("");
    setEditedBody("");
  }, [recipientEmail, recipientName]);

  const handleClose = useCallback(() => {
    onClose();
    resetForm();
  }, [onClose, resetForm]);

  // Save edits to context when they change
  const saveEditsToContext = useCallback(() => {
    if (!composedEmail) return;
    
    const updatedEmailData: EmailData = {
      ...composedEmail,
      subject: editedSubject || composedEmail.subject,
      body: editedBody || composedEmail.body,
      preview: (editedBody || composedEmail.body).slice(0, 100) + "...",
    };
    
    updateEmailInConversation(updatedEmailData);
  }, [composedEmail, editedSubject, editedBody, updateEmailInConversation]);

  const handleSubjectEdit = useCallback(() => {
    if (isEditingSubject) {
      saveEditsToContext();
    }
    setIsEditingSubject(!isEditingSubject);
  }, [isEditingSubject, saveEditsToContext]);

  const handleBodyEdit = useCallback(() => {
    if (isEditingBody) {
      saveEditsToContext();
    }
    setIsEditingBody(!isEditingBody);
  }, [isEditingBody, saveEditsToContext]);

  const handleGmailConnectionSuccess = useCallback(() => {
    setIsGmailConnectionOpen(false);
    setSendResult({
      success: true,
      message: "Gmail connected successfully! You can now send emails."
    });
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="dialog-extra-wide overflow-y-auto max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Compose Email
          </DialogTitle>
          <DialogDescription>
            Create a context-aware email based on your conversation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Email Type Selection */}
          {!composedEmail && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email-type">Email Type</Label>
                <Select value={emailType} onValueChange={setEmailType}>
                  <SelectTrigger className="">
                    <SelectValue placeholder="Select email type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMAIL_TYPES.map((type) => (
                      <SelectItem className="p-2" key={type.value} value={type.value}>
                        <div className="">
                          <div className="font-medium">{type.label}</div>
                          <div className="text-sm text-muted-foreground">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Recipient Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Recipient Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="recipient@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Recipient Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Additional Context */}
              <div className="space-y-2">
                <Label htmlFor="context">Additional Context (Optional)</Label>
                <Textarea
                  id="context"
                  value={userContext}
                  onChange={(e) => setUserContext(e.target.value)}
                  placeholder="Add any additional context, your background, or specific points you want to mention..."
                  rows={3}
                />
              </div>

              {/* Chat Context Preview */}
              {chatContext && (
                <div className="space-y-2">
                  <Label>Chat Context (Will be used for personalization)</Label>
                  <Card className="p-2">
                    <CardContent className="py-0">
                      <p className="text-sm text-muted-foreground line-clamp-4">
                        {chatContext}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Button 
                onClick={handleCompose} 
                disabled={!emailType || !email || isComposing}
                className="w-full"
              >
                {isComposing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Composing Email...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Compose Email
                  </>
                )}
              </Button>
            </>
          )}

          {/* Composed Email Preview */}
          {composedEmail && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Email Preview</h3>
                  <Badge variant="outline">
                    {EMAIL_TYPES.find(t => t.value === emailType)?.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                    {showPreview ? "Hide" : "Preview"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setComposedEmail(null)}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">To:</span>
                      <span className="text-sm">{composedEmail.recipientEmail}</span>
                      {composedEmail.recipientName && (
                        <span className="text-sm text-muted-foreground">({composedEmail.recipientName})</span>
                      )}
                    </div>
                    
                    {/* Editable Subject */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Subject:</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSubjectEdit}
                          className="p-1 h-auto"
                        >
                          {isEditingSubject ? <Save className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
                        </Button>
                      </div>
                      {isEditingSubject ? (
                        <Input
                          value={editedSubject}
                          onChange={(e) => setEditedSubject(e.target.value)}
                          placeholder="Email subject"
                          className="text-sm"
                          onBlur={handleSubjectEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSubjectEdit();
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <span className="text-sm cursor-pointer hover:bg-muted/50 p-2 rounded" onClick={() => setIsEditingSubject(true)}>
                          {editedSubject || composedEmail.subject}
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Email Body Section */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">Email Body:</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBodyEdit}
                        className="p-1 h-auto"
                      >
                        {isEditingBody ? <Save className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
                      </Button>
                      {!isEditingBody && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span>•</span>
                          <span>Click to edit</span>
                        </div>
                      )}
                    </div>
                    
                    {isEditingBody ? (
                      <Textarea
                        value={editedBody}
                        onChange={(e) => setEditedBody(e.target.value)}
                        placeholder="Email body"
                        className="min-h-[300px] text-sm font-mono"
                        onBlur={handleBodyEdit}
                      />
                    ) : (
                      <div 
                        className="p-4 bg-muted rounded-md cursor-pointer hover:bg-muted/80 transition-colors min-h-[300px]"
                        onClick={() => setIsEditingBody(true)}
                      >
                        {composedEmail.isHtml ? (
                          <div dangerouslySetInnerHTML={{ __html: editedBody || composedEmail.body }} />
                        ) : (
                          <pre className="whitespace-pre-wrap text-sm">{editedBody || composedEmail.body}</pre>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Preview Section */}
                  {!isEditingBody && (
                    <div className="space-y-2 border-t pt-4">
                      <p className="text-sm font-medium">Preview:</p>
                      <p className="text-sm text-muted-foreground">
                        {(editedBody || composedEmail.body).slice(0, 200)}
                        {(editedBody || composedEmail.body).length > 200 ? "..." : ""}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Advanced Options */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={showAdvanced}
                    onCheckedChange={setShowAdvanced}
                  />
                  <Label>Advanced Options</Label>
                </div>

                {showAdvanced && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cc">CC (comma-separated)</Label>
                      <Input
                        id="cc"
                        value={cc}
                        onChange={(e) => setCc(e.target.value)}
                        placeholder="email1@example.com, email2@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bcc">BCC (comma-separated)</Label>
                      <Input
                        id="bcc"
                        value={bcc}
                        onChange={(e) => setBcc(e.target.value)}
                        placeholder="email1@example.com, email2@example.com"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Send Result */}
              {sendResult && (
                <Card className={sendResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      {sendResult.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${sendResult.success ? "text-green-700" : "text-red-700"}`}>
                        {sendResult.message}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button 
                onClick={handleSend} 
                disabled={isSending}
                className="w-full"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Email...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Gmail Connection Dialog */}
      <GmailConnection
        isOpen={isGmailConnectionOpen}
        onClose={() => setIsGmailConnectionOpen(false)}
        userEmail={userEmail}
        onConnectionSuccess={handleGmailConnectionSuccess}
      />
    </Dialog>
  );
}
