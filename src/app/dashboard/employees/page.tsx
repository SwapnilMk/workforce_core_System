'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search, MoreHorizontal, UserPlus, Mail, Phone, Briefcase, Trash2, Edit2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function EmployeesPage() {
  const [employees] = useState([
    { id: 'EGC001', name: 'John Doe', email: 'john@egc.com', role: 'Admin', status: 'Active', phone: '+91 9876543210' },
    { id: 'EGC002', name: 'Jane Smith', email: 'jane@egc.com', role: 'Manager', status: 'Active', phone: '+91 9876543211' },
    { id: 'EGC003', name: 'Robert Wilson', email: 'robert@egc.com', role: 'Employee', status: 'On Leave', phone: '+91 9876543212' },
    { id: 'EGC004', name: 'Sarah Parker', email: 'sarah@egc.com', role: 'Employee', status: 'Active', phone: '+91 9876543213' },
    { id: 'EGC005', name: 'Michael Brown', email: 'michael@egc.com', role: 'Manager', status: 'Inactive', phone: '+91 9876543214' },
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Employee Directory</h1>
          <p className="text-muted-foreground">Manage your workforce here.</p>
        </div>
        <Button className="gap-2 bg-[#1a365d]">
          <UserPlus className="w-4 h-4" /> Add New Employee
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search employees by name, email or ID..." className="pl-10 h-11 bg-muted/30 border-none" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Filter</Button>
              <Button variant="outline">Export</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-muted/50 text-muted-foreground text-sm">
                  <th className="pb-4 font-medium">Employee</th>
                  <th className="pb-4 font-medium">ID</th>
                  <th className="pb-4 font-medium">Role</th>
                  <th className="pb-4 font-medium">Contact</th>
                  <th className="pb-4 font-medium">Status</th>
                  <th className="pb-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted/50">
                {employees.map((emp) => (
                  <tr key={emp.id} className="group hover:bg-muted/20 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.name}`} />
                          <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-sm font-mono text-muted-foreground">{emp.id}</td>
                    <td className="py-4">
                      <Badge variant="secondary" className="font-medium">{emp.role}</Badge>
                    </td>
                    <td className="py-4">
                      <p className="text-sm font-medium">{emp.phone}</p>
                    </td>
                    <td className="py-4">
                      <Badge className={
                        emp.status === 'Active' ? 'bg-green-500 hover:bg-green-600' :
                        emp.status === 'On Leave' ? 'bg-orange-500 hover:bg-orange-600' :
                        'bg-gray-400 hover:bg-gray-500'
                      }>
                        {emp.status}
                      </Badge>
                    </td>
                    <td className="py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2">
                            <Edit2 className="w-4 h-4" /> Edit Employee
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Briefcase className="w-4 h-4" /> View Documents
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 text-red-600">
                            <Trash2 className="w-4 h-4" /> Delete Employee
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
