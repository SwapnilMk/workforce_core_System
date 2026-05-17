import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Authorization check: Super Admin or Company Admin of that specific company
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN';
    const isCompanyAdmin = session.user.role === 'ADMIN' && session.user.companyId === id;

    if (!isSuperAdmin && !isCompanyAdmin) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const company = await prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, company });
  } catch (error) {
    console.error('Fetch company error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Authorization check: Super Admin or Company Admin of that specific company
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN';
    const isCompanyAdmin = session.user.role === 'ADMIN' && session.user.companyId === id;

    if (!isSuperAdmin && !isCompanyAdmin) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
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

    const currentCompany = await prisma.company.findUnique({ where: { id } });
    if (!currentCompany) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Restrict subscription & plan updates to Super Admin only
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (logo !== undefined) updateData.logo = logo;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (website !== undefined) updateData.website = website;
    if (industryType !== undefined) updateData.industryType = industryType;
    if (gstNumber !== undefined) updateData.gstNumber = gstNumber;
    if (panNumber !== undefined) updateData.panNumber = panNumber;
    if (cinNumber !== undefined) updateData.cinNumber = cinNumber;
    if (country !== undefined) updateData.country = country;
    if (state !== undefined) updateData.state = state;
    if (city !== undefined) updateData.city = city;
    if (zipCode !== undefined) updateData.zipCode = zipCode;
    if (address !== undefined) updateData.address = address;
    
    if (officeRadius !== undefined) updateData.officeRadius = parseFloat(officeRadius);
    if (latitude !== undefined) updateData.latitude = latitude ? parseFloat(latitude) : null;
    if (longitude !== undefined) updateData.longitude = longitude ? parseFloat(longitude) : null;
    
    if (attendanceRules !== undefined) updateData.attendanceRules = attendanceRules;
    if (shiftPolicies !== undefined) updateData.shiftPolicies = shiftPolicies;
    
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor;
    if (secondaryColor !== undefined) updateData.secondaryColor = secondaryColor;
    if (themePreference !== undefined) updateData.themePreference = themePreference;

    // Super Admin exclusive fields
    if (isSuperAdmin) {
      if (planType !== undefined) updateData.planType = planType;
      if (employeeLimit !== undefined) updateData.employeeLimit = parseInt(employeeLimit);
      if (storageLimit !== undefined) updateData.storageLimit = parseFloat(storageLimit);
      if (activeModules !== undefined) updateData.activeModules = activeModules;
      if (status !== undefined) {
        updateData.status = status;
        if (status === 'ACTIVE') {
          updateData.deletionRequestedAt = null;
        }
      }
    }

    const updatedCompany = await prisma.company.update({
      where: { id },
      data: updateData,
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        companyId: id,
        action: 'UPDATE_COMPANY',
        details: `Updated company details for: ${updatedCompany.name}${status === 'ACTIVE' ? ' (Restored/Activated)' : ''}`,
      },
    });

    return NextResponse.json({ success: true, company: updatedCompany });
  } catch (error) {
    console.error('Update company error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Only Super Admin or the Admin of this company can delete
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN';
    const isCompanyAdmin = session.user.role === 'ADMIN' && session.user.companyId === id;

    if (!isSuperAdmin && !isCompanyAdmin) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { otp } = body;

    // Verify OTP code (use '123456' as standard simulated admin verification OTP)
    if (!otp || otp !== '123456') {
      return NextResponse.json({ error: 'Invalid or expired Admin Security OTP verification code.' }, { status: 400 });
    }

    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Schedule deletion pending (24 hours)
    const updatedCompany = await prisma.company.update({
      where: { id },
      data: { 
        status: 'DELETION_PENDING',
        deletionRequestedAt: new Date()
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        companyId: id,
        action: 'SCHEDULE_DELETE_COMPANY',
        details: `Scheduled company deletion for: ${company.name} (purges in 24 hours)`,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Workspace successfully scheduled for permanent purge in 24 hours.',
      company: updatedCompany
    });
  } catch (error) {
    console.error('Delete company error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
