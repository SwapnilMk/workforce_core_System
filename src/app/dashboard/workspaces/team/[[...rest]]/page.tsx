'use client';

import PageContainer from '@/components/layout/page-container';
import { teamInfoContent } from '@/config/infoconfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function TeamPage() {
  const members = [
    { id: '1', name: 'Kiran ISM', email: 'kiran@egc.com', role: 'Admin', status: 'Active' },
    { id: '2', name: 'John Doe', email: 'john@egc.com', role: 'Manager', status: 'Active' },
    { id: '3', name: 'Jane Smith', email: 'jane@egc.com', role: 'Employee', status: 'Away' },
    { id: '4', name: 'Bob Wilson', email: 'bob@egc.com', role: 'Employee', status: 'Inactive' },
  ];

  return (
    <PageContainer
      pageTitle='Team Management'
      pageDescription='Manage your workspace team, members, roles, security and more.'
      infoContent={teamInfoContent}
    >
      <Card>
        <CardHeader>
          <CardTitle>Organization Members</CardTitle>
          <CardDescription>A list of people in your current workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} />
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{member.name}</span>
                      <span className="text-xs text-muted-foreground">{member.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-muted">
                      {member.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-semibold ${member.status === 'Active' ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {member.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
