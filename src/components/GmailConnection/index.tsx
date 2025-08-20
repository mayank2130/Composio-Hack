"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, ExternalLink, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface GmailConnectionProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  onConnectionSuccess?: () => void;
}

interface ConnectionStatus {
  hasConnection: boolean;
  connectedAccounts: any[];
  loading: boolean;
}

export function GmailConnection({ isOpen, onClose, userEmail, onConnectionSuccess }: GmailConnectionProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    hasConnection: false,
    connectedAccounts: [],
    loading: true,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ success: boolean; message: string } | null>(null);

  const checkConnectionStatus = useCallback(async () => {
    setConnectionStatus(prev => ({ ...prev, loading: true }));
    
    try {
      const response = await fetch(`/api/gmail-connect?userEmail=${encodeURIComponent(userEmail)}`);
      const data = await response.json();
      
      setConnectionStatus({
        hasConnection: data.hasGmailConnection,
        connectedAccounts: data.connectedAccounts || [],
        loading: false,
      });
    } catch (error) {
      console.error("Error checking connection status:", error);
      setConnectionStatus({
        hasConnection: false,
        connectedAccounts: [],
        loading: false,
      });
    }
  }, [userEmail]);

  useEffect(() => {
    if (isOpen) {
      checkConnectionStatus();
    }
  }, [isOpen, checkConnectionStatus]);

  const handleConnect = useCallback(async () => {
    setIsConnecting(true);
    setConnectionResult(null);

    try {
      const response = await fetch("/api/gmail-connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.alreadyConnected) {
          // Account is already connected
          setConnectionResult({
            success: true,
            message: "Gmail account is already connected!"
          });
          checkConnectionStatus();
          onConnectionSuccess?.();
        } else if (data.redirectUrl) {
          // Open OAuth flow in new window
          const authWindow = window.open(
            data.redirectUrl,
            "gmail-auth",
            "width=600,height=700,scrollbars=yes,resizable=yes"
          );

          // Poll for window closure (indicates completion)
          const pollTimer = setInterval(() => {
            if (authWindow?.closed) {
              clearInterval(pollTimer);
              // Check connection status after auth window closes
              setTimeout(() => {
                checkConnectionStatus();
                setConnectionResult({
                  success: true,
                  message: "Gmail account connected successfully!"
                });
                onConnectionSuccess?.();
              }, 1000);
            }
          }, 1000);

          // Timeout after 5 minutes
          setTimeout(() => {
            clearInterval(pollTimer);
            if (authWindow && !authWindow.closed) {
              authWindow.close();
              setConnectionResult({
                success: false,
                message: "Connection timeout. Please try again."
              });
            }
          }, 5 * 60 * 1000);
        }
      } else {
        setConnectionResult({
          success: false,
          message: data.error || "Failed to initiate Gmail connection"
        });
      }
    } catch (error) {
      console.error("Error connecting Gmail:", error);
      setConnectionResult({
        success: false,
        message: "Failed to connect Gmail account. Please try again."
      });
    } finally {
      setIsConnecting(false);
    }
  }, [userEmail, checkConnectionStatus, onConnectionSuccess]);

  const handleSetupTrigger = useCallback(async () => {
    if (!connectionStatus.hasConnection) return;

    const gmailAccount = connectionStatus.connectedAccounts.find(account => 
      account.appName.toLowerCase().includes('gmail')
    );

    if (!gmailAccount) return;

    try {
      const response = await fetch("/api/gmail-trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail,
          connectedAccountId: gmailAccount.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setConnectionResult({
          success: true,
          message: `Gmail trigger setup successful! Trigger ID: ${data.triggerId}`
        });
      } else {
        setConnectionResult({
          success: false,
          message: data.error || "Failed to setup Gmail trigger"
        });
      }
    } catch (error) {
      console.error("Error setting up Gmail trigger:", error);
      setConnectionResult({
        success: false,
        message: "Failed to setup Gmail trigger. Please try again."
      });
    }
  }, [userEmail, connectionStatus]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Gmail Connection Setup
          </DialogTitle>
          <DialogDescription>
            Connect your Gmail account to send emails and receive notifications
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Gmail Account Status
                {connectionStatus.loading && <Loader2 className="h-4 w-4 animate-spin" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email: {userEmail}</p>
                  <p className="text-sm text-muted-foreground">
                    {connectionStatus.hasConnection 
                      ? "Gmail account is connected and ready to use"
                      : "Gmail account needs to be connected"
                    }
                  </p>
                </div>
                <Badge variant={connectionStatus.hasConnection ? "default" : "secondary"}>
                  {connectionStatus.hasConnection ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Not Connected
                    </>
                  )}
                </Badge>
              </div>

              {/* Connected Accounts */}
              {connectionStatus.connectedAccounts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Connected Accounts:</p>
                  {connectionStatus.connectedAccounts.map((account, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{account.appName}</span>
                      <Badge variant="outline">{account.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Connection Actions */}
          <div className="space-y-4">
            {!connectionStatus.hasConnection ? (
              <Button 
                onClick={handleConnect} 
                disabled={isConnecting || connectionStatus.loading}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting to Gmail...
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Connect Gmail Account
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button 
                  onClick={handleSetupTrigger}
                  variant="outline"
                  className="w-full"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Setup Gmail Notifications
                </Button>
                <Button 
                  onClick={checkConnectionStatus}
                  variant="ghost"
                  size="sm"
                  className="w-full"
                >
                  Refresh Status
                </Button>
              </div>
            )}
          </div>

          {/* Connection Result */}
          {connectionResult && (
            <Card className={connectionResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  {connectionResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${connectionResult.success ? "text-green-700" : "text-red-700"}`}>
                    {connectionResult.message}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-800">How it works:</p>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Click "Connect Gmail Account" to start OAuth flow</li>
                  <li>Sign in with your Gmail account in the popup window</li>
                  <li>Grant permissions for email sending</li>
                  <li>Optionally setup notifications to receive new email alerts</li>
                  <li>Start sending emails through the AI composer!</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
