import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<any> }
) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const { id } = await params;

    const employee = await prisma.user.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true } },
        employeeProfile: true,
        payrollProfile: true,
        attendanceProfile: true,
        documents: true
      }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const { validateCompanyAccess } = require('@/lib/tenant');
    if (!validateCompanyAccess(session.user, employee.companyId)) {
      return NextResponse.json({ error: 'Access denied: Tenant mismatch' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      employee
    });
  } catch (error: any) {
    console.error('API GET employee detail error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<any> }
) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const { role: requesterRole, id: requesterId } = session.user;
    if (requesterRole !== 'SUPER_ADMIN' && requesterRole !== 'ADMIN' && requesterRole !== 'HR') {
      return NextResponse.json({ error: 'Access denied: Insufficient role permissions' }, { status: 403 });
    }

    const { id } = await params;

    const existingEmployee = await prisma.user.findUnique({ where: { id } });
    if (!existingEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const { validateCompanyAccess } = require('@/lib/tenant');
    if (!validateCompanyAccess(session.user, existingEmployee.companyId)) {
      return NextResponse.json({ error: 'Access denied: Tenant mismatch' }, { status: 403 });
    }

    const body = await request.json();

    const {
      firstName,
      lastName,
      email,
      phone,
      alternatePhone,
      gender,
      dateOfBirth,
      role,
      departmentId,
      companyId,
      joiningDate,
      workLocation,
      status,

      // Shift / Offs
      assignedOffice,
      shiftTiming,
      weeklyOffs,
      overtimeEligible,
      remoteWorkAllowed,

      // Payroll Info
      panNumber,
      aadhaarNumber,
      uanNumber,
      pfNumber,
      esiNumber,
      bankName,
      accountNumber,
      ifscCode,
      salaryStructure,
      basicSalary,
      hra,
      allowances,
      bonusEligibility,
      taxRegime,
      overtimeRate,
      paymentFrequency,
      salaryEffectiveDate,

      // Emergency / Personal
      currentAddress,
      permanentAddress,
      bloodGroup,
      emergencyContactName,
      emergencyContactNumber,
      relationship,
      maritalStatus,
      nationality,
      skills,
      certifications,
      linkedin,
      github,
      portfolio
    } = body;

    const basic = Number(basicSalary || 0);
    const hraAmount = Number(hra || 0);
    const allowancesAmount = Number(allowances || 0);

    let dbRole: UserRole = UserRole.EMPLOYEE;
    const rUpper = (role || '').toUpperCase().replace(' ', '_');
    if (rUpper === 'SUPER_ADMIN') dbRole = UserRole.SUPER_ADMIN;
    else if (rUpper === 'ADMIN') dbRole = UserRole.ADMIN;
    else if (rUpper === 'HR') dbRole = UserRole.HR;
    else if (rUpper === 'MANAGER') dbRole = UserRole.MANAGER;

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update Core User
      const user = await tx.user.update({
        where: { id },
        data: {
          name: `${firstName} ${lastName}`,
          email,
          role: dbRole,
          departmentId: departmentId || null,
          basicSalary: basic,
          hra: hraAmount,
          allowances: allowancesAmount
        }
      });

      // 2. Upsert Employee Profile
      await tx.employeeProfile.upsert({
        where: { userId: id },
        create: {
          userId: id,
          employeeId: `EGC-UPD-${Date.now().toString().slice(-4)}`,
          gender: gender || 'Male',
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date('1995-01-01'),
          mobileNumber: phone || '',
          alternatePhone: alternatePhone || null,
          joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
          workLocation: workLocation || 'Office',
          currentAddress: currentAddress || '',
          permanentAddress: permanentAddress || '',
          bloodGroup: bloodGroup || 'O+',
          emergencyContactName: emergencyContactName || '',
          emergencyContactNumber: emergencyContactNumber || '',
          relationship: relationship || 'Parent',
          maritalStatus: maritalStatus || 'Single',
          nationality: nationality || 'Indian',
          skills: skills || [],
          certifications: certifications || [],
          linkedin: linkedin || null,
          github: github || null,
          portfolio: portfolio || null
        },
        update: {
          gender: gender || 'Male',
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date('1995-01-01'),
          mobileNumber: phone || '',
          alternatePhone: alternatePhone || null,
          joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
          workLocation: workLocation || 'Office',
          currentAddress: currentAddress || '',
          permanentAddress: permanentAddress || '',
          bloodGroup: bloodGroup || 'O+',
          emergencyContactName: emergencyContactName || '',
          emergencyContactNumber: emergencyContactNumber || '',
          relationship: relationship || 'Parent',
          maritalStatus: maritalStatus || 'Single',
          nationality: nationality || 'Indian',
          skills: skills || [],
          certifications: certifications || [],
          linkedin: linkedin || null,
          github: github || null,
          portfolio: portfolio || null
        }
      });

      // 3. Upsert Payroll Profile
      await tx.payrollProfile.upsert({
        where: { userId: id },
        create: {
          userId: id,
          employeeCode: `EGC-UPD-${Date.now().toString().slice(-4)}`,
          panNumber: panNumber || '',
          aadhaarNumber: aadhaarNumber || '',
          uanNumber: uanNumber || null,
          pfNumber: pfNumber || null,
          esiNumber: esiNumber || null,
          bankName: bankName || '',
          accountNumber: accountNumber || '',
          ifscCode: ifscCode || '',
          salaryStructure: salaryStructure || 'Standard',
          basicSalary: basic,
          hra: hraAmount,
          allowances: allowancesAmount,
          bonusEligibility: !!bonusEligibility,
          taxRegime: taxRegime || 'NEW',
          overtimeRate: Number(overtimeRate || 0),
          paymentFrequency: paymentFrequency || 'MONTHLY',
          salaryEffectiveDate: salaryEffectiveDate ? new Date(salaryEffectiveDate) : new Date()
        },
        update: {
          panNumber: panNumber || '',
          aadhaarNumber: aadhaarNumber || '',
          uanNumber: uanNumber || null,
          pfNumber: pfNumber || null,
          esiNumber: esiNumber || null,
          bankName: bankName || '',
          accountNumber: accountNumber || '',
          ifscCode: ifscCode || '',
          salaryStructure: salaryStructure || 'Standard',
          basicSalary: basic,
          hra: hraAmount,
          allowances: allowancesAmount,
          bonusEligibility: !!bonusEligibility,
          taxRegime: taxRegime || 'NEW',
          overtimeRate: Number(overtimeRate || 0),
          paymentFrequency: paymentFrequency || 'MONTHLY',
          salaryEffectiveDate: salaryEffectiveDate ? new Date(salaryEffectiveDate) : new Date()
        }
      });

      // 4. Upsert Attendance Profile
      await tx.attendanceProfile.upsert({
        where: { userId: id },
        create: {
          userId: id,
          assignedOffice: assignedOffice || 'MumbaiHQ',
          shiftTiming: shiftTiming || '09:00 - 18:00',
          weeklyOffs: weeklyOffs || ['Sunday'],
          overtimeEligible: !!overtimeEligible,
          remoteWorkAllowed: !!remoteWorkAllowed
        },
        update: {
          assignedOffice: assignedOffice || 'MumbaiHQ',
          shiftTiming: shiftTiming || '09:00 - 18:00',
          weeklyOffs: weeklyOffs || ['Sunday'],
          overtimeEligible: !!overtimeEligible,
          remoteWorkAllowed: !!remoteWorkAllowed
        }
      });

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          userId: requesterId,
          action: 'UPDATE_EMPLOYEE',
          details: `Successfully updated employee ${firstName} ${lastName} (${id})`,
          ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
          userAgent: request.headers.get('user-agent') || 'Browser'
        }
      });

      return user;
    });

    return NextResponse.json({
      success: true,
      message: 'Employee updated successfully in all database profile branches.',
      employee: updated
    });

  } catch (error: any) {
    console.error('API UPDATE Employee PUT error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<any> }
) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const { role: requesterRole, id: requesterId } = session.user;
    if (requesterRole !== 'SUPER_ADMIN' && requesterRole !== 'ADMIN' && requesterRole !== 'HR') {
      return NextResponse.json({ error: 'Access denied: Insufficient role permissions' }, { status: 403 });
    }

    const { id } = await params;

    const existingEmployee = await prisma.user.findUnique({ where: { id } });
    if (!existingEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const { validateCompanyAccess } = require('@/lib/tenant');
    if (!validateCompanyAccess(session.user, existingEmployee.companyId)) {
      return NextResponse.json({ error: 'Access denied: Tenant mismatch' }, { status: 403 });
    }

    // Sequential transaction delete
    await prisma.$transaction(async (tx) => {
      // 1. Delete associated profile records first
      await tx.employeeProfile.deleteMany({ where: { userId: id } });
      await tx.payrollProfile.deleteMany({ where: { userId: id } });
      await tx.attendanceProfile.deleteMany({ where: { userId: id } });
      await tx.document.deleteMany({ where: { userId: id } });

      // 2. Purge core user record
      await tx.user.delete({ where: { id } });

      // 3. Write Audit Log
      await tx.auditLog.create({
        data: {
          userId: requesterId,
          action: 'DELETE_EMPLOYEE',
          details: `Successfully purged employee records for User ID: ${id}`,
          ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
          userAgent: request.headers.get('user-agent') || 'Browser'
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Employee, profiles, documents, and credentials fully offboarded and purged.'
    });

  } catch (error: any) {
    console.error('API DELETE employee error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
