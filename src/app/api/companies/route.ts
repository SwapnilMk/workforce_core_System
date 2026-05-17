import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Super Admin gets all companies, others only get their own
    if (session.user.role === 'SUPER_ADMIN') {
      const companies = await prisma.company.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ success: true, companies });
    } else {
      if (!session.user.companyId) {
        return NextResponse.json({ success: true, companies: [] });
      }
      const company = await prisma.company.findUnique({
        where: { id: session.user.companyId },
      });
      return NextResponse.json({ success: true, companies: company ? [company] : [] });
    }
  } catch (error) {
    console.error('Fetch companies error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Super Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      logo,
      email,
      phone,
      website,
      industryType,
      gstNumber,
      panNumber,
      cinNumber,
      country,
      state,
      city,
      zipCode,
      address,
      officeRadius,
      latitude,
      longitude,
      attendanceRules,
      shiftPolicies,
      planType,
      employeeLimit,
      storageLimit,
      activeModules,
      primaryColor,
      secondaryColor,
      themePreference,
      status,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Company Name is required' }, { status: 400 });
    }

    const company = await prisma.company.create({
      data: {
        name,
        logo: logo || 'https://images.unsplash.com/photo-1599305445671-ac291c95aba9?w=80&auto=format&fit=crop&q=60',
        email,
        phone,
        website,
        industryType,
        gstNumber,
        panNumber,
        cinNumber,
        country,
        state,
        city,
        zipCode,
        address,
        officeRadius: officeRadius ? parseFloat(officeRadius) : 200,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        attendanceRules,
        shiftPolicies,
        planType: planType || 'Trial',
        employeeLimit: employeeLimit ? parseInt(employeeLimit) : 50,
        storageLimit: storageLimit ? parseFloat(storageLimit) : 10,
        activeModules: activeModules || ['ALL'],
        primaryColor: primaryColor || '#1a365d',
        secondaryColor: secondaryColor || '#0f172a',
        themePreference: themePreference || 'dark',
        status: status || 'ACTIVE',
      },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        companyId: company.id,
        action: 'CREATE_COMPANY',
        details: `Created company: ${company.name} with plan: ${company.planType}`,
      },
    });

    return NextResponse.json({ success: true, company });
  } catch (error) {
    console.error('Create company error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
