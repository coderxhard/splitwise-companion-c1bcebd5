import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Camera, Loader2, User, Sun, Moon, Monitor } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { NotificationPreferences } from '@/components/NotificationPreferences';
import { EmailPreferences } from '@/components/EmailPreferences';
import { PageTransition } from '@/components/PageTransition';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

const ProfilePage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setName(data.name);
      }
    } catch (error: any) {
      toast({
        title: 'Error loading profile',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !name.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: name.trim() })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Profile updated',
        description: 'Your name has been updated successfully.'
      });

      fetchProfile();
    } catch (error: any) {
      toast({
        title: 'Error updating profile',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file.',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 2MB.',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload image
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL (add timestamp to bust cache)
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast({
        title: 'Avatar updated',
        description: 'Your profile picture has been updated.'
      });

      fetchProfile();
    } catch (error: any) {
      toast({
        title: 'Error uploading avatar',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <PageTransition>
        <Layout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </Layout>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="opacity-0 animate-fade-in-down">
          <h1 className="font-display text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account settings</p>
        </div>

        <Card className="opacity-0 animate-fade-in-up overflow-hidden" style={{ animationDelay: '0.05s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              Profile Picture
            </CardTitle>
            <CardDescription>Click to upload a new avatar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg transition-transform duration-300 group-hover:scale-105">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-medium">
                    {profile?.name ? getInitials(profile.name) : <User className="h-10 w-10" />}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300">
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <p className="font-medium">{profile?.name}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
                <p className="text-xs text-muted-foreground">Max 2MB, JPG or PNG</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </CardContent>
        </Card>

        <Card className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.08s' }}>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your display name</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="max-w-md transition-all duration-200 focus:scale-[1.01]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile?.email || ''}
                disabled
                className="max-w-md bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={saving || !name.trim() || name === profile?.name}
              className="transition-all duration-200 hover:scale-105"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </CardContent>
        </Card>

        <NotificationPreferences />

        <EmailPreferences />

        <Card className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                {theme === 'dark' ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
              </div>
              Appearance
            </CardTitle>
            <CardDescription>Choose your preferred theme</CardDescription>
          </CardHeader>
          <CardContent>
            <ToggleGroup
              type="single"
              value={theme}
              onValueChange={(value) => value && setTheme(value)}
              className="justify-start"
            >
              <ToggleGroupItem value="light" aria-label="Light mode" className="gap-2 transition-all duration-200 hover:scale-105 data-[state=on]:scale-105">
                <Sun className="h-4 w-4" />
                Light
              </ToggleGroupItem>
              <ToggleGroupItem value="dark" aria-label="Dark mode" className="gap-2 transition-all duration-200 hover:scale-105 data-[state=on]:scale-105">
                <Moon className="h-4 w-4" />
                Dark
              </ToggleGroupItem>
              <ToggleGroupItem value="system" aria-label="System theme" className="gap-2 transition-all duration-200 hover:scale-105 data-[state=on]:scale-105">
                <Monitor className="h-4 w-4" />
                System
              </ToggleGroupItem>
            </ToggleGroup>
          </CardContent>
        </Card>
      </div>
    </Layout>
    </PageTransition>
  );
};

export default ProfilePage;
