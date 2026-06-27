import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Sun, Moon, Monitor, LogOut, Trash2, Bell } from "lucide-react";

export default function Settings() {
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    setLocation("/login");
  };

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "system", label: "System", icon: Monitor },
    { value: "dark", label: "Dark", icon: Moon },
  ] as const;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Customize your ClarifAI experience</p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Choose how ClarifAI looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {themes.map((t) => (
              <button
                key={t.value}
                data-testid={`button-theme-${t.value}`}
                onClick={() => { setTheme(t.value); toast.success(`Theme set to ${t.label}`); }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${theme === t.value ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:bg-muted"}`}
              >
                <t.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </CardTitle>
          <CardDescription>Manage what you get notified about</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "Study reminders", desc: "Daily nudges to maintain your streak", defaultChecked: true },
            { label: "Quiz results", desc: "Notify when quiz analysis is ready", defaultChecked: true },
            { label: "New features", desc: "Occasional product updates", defaultChecked: false },
          ].map((n) => (
            <div key={n.label} className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">{n.label}</Label>
                <p className="text-xs text-muted-foreground">{n.desc}</p>
              </div>
              <Switch
                data-testid={`switch-notification-${n.label.toLowerCase().replace(/\s+/g, "-")}`}
                defaultChecked={n.defaultChecked}
                onCheckedChange={(v) => toast.success(`${n.label} ${v ? "enabled" : "disabled"}`)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* AI */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI settings</CardTitle>
          <CardDescription>Configure how the AI tutor behaves</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "Cite sources in responses", desc: "Always show document references with answers", defaultChecked: true },
            { label: "Detailed explanations", desc: "Generate longer, more thorough answers", defaultChecked: false },
            { label: "Auto-suggest follow-up questions", desc: "Show related questions after each answer", defaultChecked: true },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">{s.label}</Label>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
              <Switch
                data-testid={`switch-ai-${s.label.toLowerCase().replace(/\s+/g, "-")}`}
                defaultChecked={s.defaultChecked}
                onCheckedChange={(v) => toast.success(`${s.label} ${v ? "on" : "off"}`)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full gap-2 justify-start"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
          <Separator />
          <Button
            variant="outline"
            className="w-full gap-2 justify-start text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
            onClick={() => toast.info("Contact support to delete your account")}
            data-testid="button-delete-account"
          >
            <Trash2 className="h-4 w-4" />
            Delete account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
