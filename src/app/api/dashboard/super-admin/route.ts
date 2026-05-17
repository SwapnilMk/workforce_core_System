import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Super Admin only' }, { status: 403 });
    }

    // 1. Total companies count
    const totalCompanies = await prisma.company.count();

    // 2. Active vs Suspended companies
    const activeCompanies = await prisma.company.count({
      where: { status: 'ACTIVE' },
    });
    const suspendedCompanies = await prisma.company.count({
      where: { status: 'SUSPENDED' },
    });

    // 3. Total users globally
    const totalUsers = await prisma.user.count();

    // 4. Subscriptions Breakdown
    const trialCount = await prisma.company.count({ where: { planType: 'Trial' } });
    const growthCount = await prisma.company.count({ where: { planType: 'Growth' } });
    const enterpriseCount = await prisma.company.count({ where: { planType: 'Enterprise' } });

    // 5. Companies list with user counts
    const rawCompanies = await prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Group user counts by company
    const usersGroup = await prisma.user.groupBy({
      by: ['companyId'],
      _count: {
        id: true,
      },
    });

    const userCountMap = new Map<string, number>();
    usersGroup.forEach((group) => {
      if (group.companyId) {
        userCountMap.set(group.companyId, group._count.id);
      }
    });

    const companiesWithDetails = rawCompanies.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      gstNumber: c.gstNumber,
      panNumber: c.panNumber,
      cinNumber: c.cinNumber,
      planType: c.planType,
      status: c.status,
      employeeCount: userCountMap.get(c.id) || 0,
      createdAt: c.createdAt,
    }));

    // 6. Recent users registered globally
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        company: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalCompanies,
        activeCompanies,
        suspendedCompanies,
        totalUsers,
        plans: {
          trial: trialCount,
          growth: growthCount,
          enterprise: enterpriseCount,
        },
      },
      companies: companiesWithDetails,
      recentUsers,
    });
  } catch (error: any) {
    console.error('Super Admin Dashboard API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
