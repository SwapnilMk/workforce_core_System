'use client';

import PageContainer from '@/components/layout/page-container';
import { workspacesInfoContent } from '@/config/infoconfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store/auth-store';
import { Building2, Plus, Users, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WorkspacesPage() {
  const { user } = useAuthStore();

  const workspaces = [
    { id: '1', name: 'EGC India Headquarters', role: 'Admin', members: 45, icon: Building2 },
    { id: '2', name: 'Workforce Core Team', role: 'Manager', members: 12, icon: Users },
    { id: '3', name: 'Digital Transformation', role: 'Member', members: 8, icon: Layout },
  ];

  return (
    <PageContainer
      pageTitle='Workspaces'
      pageDescription='Manage your organizational units and switch between them'
      infoContent={workspacesInfoContent}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((workspace) => (
          <Card key={workspace.id} className="hover:border-primary/50 transition-colors cursor-pointer group">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <workspace.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-muted px-2 py-0.5 rounded">
                  {workspace.role}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-1">{workspace.name}</CardTitle>
              <CardDescription>{workspace.members} active members</CardDescription>
              <Button variant="ghost" className="w-full mt-4 justify-start p-0 h-auto font-semibold text-primary">
                Enter Workspace →
              </Button>
            </CardContent>
          </Card>
        ))}
        <Card className="border-dashed border-2 hover:bg-muted/50 transition-colors cursor-pointer flex flex-col items-center justify-center py-8">
          <div className="p-3 bg-muted rounded-full mb-3">
            <Plus className="w-6 h-6 text-muted-foreground" />
          </div>
          <span className="font-semibold text-muted-foreground">Create Workspace</span>
        </Card>
      </div>
    </PageContainer>
  );
}
