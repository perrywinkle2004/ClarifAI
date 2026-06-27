import { useState } from "react";
import {
  useGetProfile,
  useUpdateProfile,
  getGetProfileQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { User, Building2, Mail, Pencil, Save, X } from "lucide-react";

export default function Profile() {
  const { user: authUser, login } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: profile, isLoading } = useGetProfile({
    query: { queryKey: getGetProfileQueryKey() },
  });
  const updateMutation = useUpdateProfile();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [institution, setInstitution] = useState("");

  const startEdit = () => {
    setName(profile?.name ?? "");
    setBio(profile?.bio ?? "");
    setInstitution(profile?.institution ?? "");
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const handleSave = () => {
    updateMutation.mutate(
      { data: { name, bio, institution } },
      {
        onSuccess: (updated) => {
          queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
          if (authUser) login(localStorage.getItem("clarifai_token") ?? "", updated as any);
          toast.success("Profile updated");
          setEditing(false);
        },
        onError: () => toast.error("Failed to update profile"),
      }
    );
  };

  const getInitials = (n: string) => n.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your personal information</p>
      </div>

      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Avatar + name */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.avatar ?? ""} />
                  <AvatarFallback className="text-2xl font-serif bg-primary/10 text-primary">
                    {getInitials(profile?.name ?? "?")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-serif font-bold" data-testid="text-profile-name">{profile?.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="capitalize text-xs">{profile?.role}</Badge>
                    {profile?.institution && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {profile.institution}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {!editing ? (
                <>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span data-testid="text-profile-email">{profile?.email}</span>
                    </div>
                    {profile?.bio && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <User className="h-4 w-4 mt-0.5 shrink-0" />
                        <span data-testid="text-profile-bio">{profile.bio}</span>
                      </div>
                    )}
                    {profile?.joinedAt && (
                      <p className="text-xs text-muted-foreground">
                        Member since {new Date(profile.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                      </p>
                    )}
                  </div>
                  <Button variant="outline" onClick={startEdit} className="gap-2" data-testid="button-edit-profile">
                    <Pencil className="h-4 w-4" />
                    Edit profile
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile-name">Full name</Label>
                    <Input
                      id="profile-name"
                      data-testid="input-profile-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-institution">Institution</Label>
                    <Input
                      id="profile-institution"
                      data-testid="input-profile-institution"
                      placeholder="e.g. State University"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-bio">Bio</Label>
                    <Textarea
                      id="profile-bio"
                      data-testid="input-profile-bio"
                      placeholder="Tell us a bit about yourself"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-2" data-testid="button-save-profile">
                      <Save className="h-4 w-4" />
                      {updateMutation.isPending ? "Saving..." : "Save changes"}
                    </Button>
                    <Button variant="outline" onClick={cancelEdit} className="gap-2">
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
