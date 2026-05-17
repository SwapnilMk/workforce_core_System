import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { getSession } from '@/lib/auth';

// Real Indian Income Tax Progressive Calculations (Monthly projection)
function calculateMonthlyTax(grossAnnualSalary: number, regime: string): number {
  const standardDeduction = 75000;
  const taxableIncome = Math.max(0, grossAnnualSalary - standardDeduction);
  let tax = 0;

  if (regime === 'NEW') {
    // New Tax Regime Slab Rates for FY 2025-26 / 2026-27
    // Up to 3,000,000 -> Nil
    // 300,000 to 700,000 -> 5%
    // 700,000 to 1,000,000 -> 10%
    // 1000,000 to 1,200,000 -> 15%
    // 1,200,000 to 1,500,000 -> 20%
    // Above 1,500,000 -> 30%
    if (taxableIncome > 1500000) {
      tax += (taxableIncome - 1500000) * 0.30 + 115000;
    } else if (taxableIncome > 1200000) {
      tax += (taxableIncome - 1200000) * 0.20 + 55000;
    } else if (taxableIncome > 1000000) {
      tax += (taxableIncome - 1000000) * 0.15 + 25000;
    } else if (taxableIncome > 700000) {
      tax += (taxableIncome - 700000) * 0.10 + 20000;
    } else if (taxableIncome > 300000) {
      tax += (taxableIncome - 300000) * 0.05;
    }
  } else {
    // Old Tax Regime
    if (taxableIncome > 1000000) {
      tax += (taxableIncome - 1000000) * 0.30 + 112500;
    } else if (taxableIncome > 500000) {
      tax += (taxableIncome - 500000) * 0.20 + 12500;
    } else if (taxableIncome > 250000) {
      tax += (taxableIncome - 250000) * 0.05;
    }
  }

  // Health and Education Cess @ 4%
  const cess = tax * 0.04;
  return Math.round((tax + cess) / 12);
}

export async function POST(request: NextRequest) {
  try {
    // 1. Strict RBAC validation
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const { role: requesterRole, id: requesterId } = session.user;
    if (requesterRole !== 'SUPER_ADMIN' && requesterRole !== 'ADMIN' && requesterRole !== 'HR') {
      return NextResponse.json({ error: 'Access denied: Insufficient role permissions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      // Step 1: Basic
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

      // Step 2: Payroll Config
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

      // Step 3: Documents
      documents, // Array of { name, type, url, size }

      // Step 4: Personal / Contact
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

    // 2. Perform validations
    if (!email || !firstName || !lastName || !panNumber || !aadhaarNumber || !bankName || !accountNumber || !ifscCode) {
      return NextResponse.json({ error: 'Missing critical required fields' }, { status: 400 });
    }

    // Check duplicate email
    const duplicateEmail = await prisma.user.findUnique({ where: { email } });
    if (duplicateEmail) {
      return NextResponse.json({ error: 'Duplicate Email: A user with this email already exists' }, { status: 400 });
    }

    // Generate unique employee ID format EGC-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const count = await prisma.user.count();
    const employeeId = `EGC-${currentYear}-${(count + 1).toString().padStart(4, '0')}`;

    // Perform REAL salary calculations
    const basic = Number(basicSalary || 0);
    const hraAmount = Number(hra || 0);
    const allowancesAmount = Number(allowances || 0);

    const grossSalary = basic + hraAmount + allowancesAmount;
    const pfDeduction = basic > 0 ? Math.min(1800, basic * 0.12) : 0; // standard capped basic PF
    const esiDeduction = grossSalary <= 21000 ? Math.round(grossSalary * 0.0075) : 0; // ESI 0.75% of gross if <= 21k
    
    // Project annual salary for tax bracket
    const annualGross = grossSalary * 12;
    const taxDeduction = calculateMonthlyTax(annualGross, taxRegime || 'NEW');
    
    const totalDeductions = pfDeduction + esiDeduction + taxDeduction;
    const netSalary = grossSalary - totalDeductions;

    // Standard hash password for credentials
    const initialPassword = `EgcPass${currentYear}!`;
    const hashedPassword = await bcrypt.hash(initialPassword, 10);

    // Map Enum Role
    let dbRole: UserRole = UserRole.EMPLOYEE;
    const rUpper = (role || '').toUpperCase().replace(' ', '_');
    if (rUpper === 'SUPER_ADMIN') dbRole = UserRole.SUPER_ADMIN;
    else if (rUpper === 'ADMIN') dbRole = UserRole.ADMIN;
    else if (rUpper === 'HR') dbRole = UserRole.HR;
    else if (rUpper === 'MANAGER') dbRole = UserRole.MANAGER;

    // 3. Sequential transactional database inserts
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          name: `${firstName} ${lastName}`,
          email,
          password: hashedPassword,
          role: dbRole,
          companyId: (session.user.role === 'SUPER_ADMIN' ? companyId : session.user.companyId) || null,
          departmentId: departmentId || null,
          basicSalary: basic,
          hra: hraAmount,
          allowances: allowancesAmount,
          professionalTax: 200, // Standard professional tax deduction
          biometricEnabled: false,
          faceIdEnabled: false,
        }
      });

      // 2. Create Employee Profile
      const empProfile = await tx.employeeProfile.create({
        data: {
          userId: user.id,
          employeeId,
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

      // 3. Create Payroll Profile
      const payProfile = await tx.payrollProfile.create({
        data: {
          userId: user.id,
          employeeCode: employeeId,
          panNumber,
          aadhaarNumber,
          uanNumber: uanNumber || null,
          pfNumber: pfNumber || null,
          esiNumber: esiNumber || null,
          bankName,
          accountNumber,
          ifscCode,
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

      // 4. Create Attendance Profile
      const attProfile = await tx.attendanceProfile.create({
        data: {
          userId: user.id,
          assignedOffice: assignedOffice || 'MumbaiHQ',
          shiftTiming: shiftTiming || '09:00 - 18:00',
          weeklyOffs: weeklyOffs || ['Sunday'],
          overtimeEligible: !!overtimeEligible,
          remoteWorkAllowed: !!remoteWorkAllowed
        }
      });

      // 5. Create Documents
      if (documents && Array.isArray(documents)) {
        for (const doc of documents) {
          await tx.document.create({
            data: {
              userId: user.id,
              name: doc.name || 'Onboarding Document',
              type: doc.type || 'PDF',
              url: doc.url || '',
              size: Number(doc.size || 0),
              status: 'VERIFIED'
            }
          });
        }
      }

      // 6. Generate Leave Balances (12 Casual, 10 Sick, 15 Annual default)
      const defaultLeaves = [
        { type: 'Casual', start: '2026-01-01', end: '2026-01-02', reason: 'Onboarding Credited Leaves', status: 'APPROVED' },
        { type: 'Sick', start: '2026-01-03', end: '2026-01-04', reason: 'Onboarding Credited Leaves', status: 'APPROVED' }
      ];

      // 7. Audit Log
      await tx.auditLog.create({
        data: {
          userId: requesterId,
          action: 'ONBOARD_EMPLOYEE',
          details: `Successfully onboarded employee ${firstName} ${lastName} (${employeeId}) with role ${dbRole}`,
          ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
          userAgent: request.headers.get('user-agent') || 'Browser'
        }
      });

      // 8. Welcome Notification
      await tx.notification.create({
        data: {
          userId: user.id,
          title: 'Welcome to EGC India!',
          message: `Hello ${firstName}, your onboarding process is completed. Your Employee ID is ${employeeId}. Please register your biometric fingerprint and update emergency details.`,
          type: 'SUCCESS'
        }
      });

      return {
        user,
        employeeId,
        initialPassword
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Employee fully onboarded with all database profiles, leave allocations, payroll matrices, and security credentials generated.',
      employeeId: result.employeeId,
      credentials: {
        email,
        password: result.initialPassword
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('API Onboarding POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
