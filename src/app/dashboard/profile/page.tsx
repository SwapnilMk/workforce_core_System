'use client';

import { useAuthStore } from '@/lib/store/auth-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Lock, User, Mail, Shield } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Profile Info & Photo */}
        <Card className="w-full md:w-1/3 overflow-hidden">
          <div className="h-32 bg-[#1a365d]"></div>
          <CardContent className="relative flex flex-col items-center -mt-16 pb-8">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-white shadow-xl">
                <AvatarFallback className="text-3xl font-bold bg-muted">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 rounded-full shadow-lg border-2 border-white">
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <h2 className="mt-4 text-2xl font-bold">{user.name || 'User'}</h2>
            <p className="text-muted-foreground font-medium">{user.role}</p>
            <div className="mt-6 w-full space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground px-4 py-2 bg-muted/50 rounded-lg">
                <Mail className="w-4 h-4" /> {user.email}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground px-4 py-2 bg-muted/50 rounded-lg">
                <Shield className="w-4 h-4" /> ID: {user.id}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile */}
        <div className="flex-1 space-y-6 w-full">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Personal Information
              </CardTitle>
              <CardDescription>Update your personal details here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First Name</Label>
                  <Input id="first-name" defaultValue={user.name || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input id="last-name" defaultValue="" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" defaultValue={user.email} />
              </div>
              <Button className="bg-[#1a365d]">Save Changes</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Security
              </CardTitle>
              <CardDescription>Change your password to keep your account secure.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </div>
              <Button variant="outline">Update Password</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
