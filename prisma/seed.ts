import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning existing database documents...');
  
  // Clean in correct order
  await prisma.attendance.deleteMany({});
  await prisma.leave.deleteMany({});
  await prisma.payroll.deleteMany({});
  await prisma.authenticator.deleteMany({});
  await prisma.loginHistory.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.dailyJd.deleteMany({});
  await prisma.employeeProfile.deleteMany({});
  await prisma.payrollProfile.deleteMany({});
  await prisma.attendanceProfile.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.holiday.deleteMany({});
  await prisma.company.deleteMany({});

  console.log('Database cleaned! Starting seeding...');

  // Common Address and Location Coordinates (CBD Belapur, Navi Mumbai)
  const commonAddress = 'CBD Belapur, Navi Mumbai';
  const commonLatitude = 19.0178;
  const commonLongitude = 73.0416;

  // 1. Create EGC India
  const egcCompany = await prisma.company.create({
    data: {
      name: 'EGC India',
      email: 'contact@egcindia.com',
      phone: '+91 22 1234 5678',
      logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aba9?w=80&auto=format&fit=crop&q=60',
      address: commonAddress,
      city: 'Navi Mumbai',
      state: 'Maharashtra',
      country: 'India',
      zipCode: '400614',
      officeRadius: 200,
      latitude: commonLatitude,
      longitude: commonLongitude,
      themePreference: 'vercel',
      primaryColor: '#1a365d',
    },
  });

  // 2. Create AECCI (Asian Exports Chamber of Commerce and Industry)
  const aecciCompany = await prisma.company.create({
    data: {
      name: 'Asian Exports Chamber of Commerce and Industry (AECCI)',
      email: 'info@aecci.org.in',
      phone: '+91 22 8765 4321',
      logo: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=80&auto=format&fit=crop&q=60',
      address: commonAddress,
      city: 'Navi Mumbai',
      state: 'Maharashtra',
      country: 'India',
      zipCode: '400614',
      officeRadius: 200,
      latitude: commonLatitude,
      longitude: commonLongitude,
      themePreference: 'supabase',
      primaryColor: '#10b981',
    },
  });

  // 3. Create BPP (Bharatiya Popular Party)
  const bppCompany = await prisma.company.create({
    data: {
      name: 'Bharatiya Popular Party (BPP)',
      email: 'contact@bpp.org.in',
      phone: '+91 22 5555 7777',
      logo: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=80&auto=format&fit=crop&q=60',
      address: commonAddress,
      city: 'Navi Mumbai',
      state: 'Maharashtra',
      country: 'India',
      zipCode: '400614',
      officeRadius: 200,
      latitude: commonLatitude,
      longitude: commonLongitude,
      themePreference: 'claude',
      primaryColor: '#f97316',
    },
  });

  // 4. Create Departments for each company
  const egcDevDept = await prisma.department.create({
    data: { name: 'Engineering', companyId: egcCompany.id },
  });
  const egcHrDept = await prisma.department.create({
    data: { name: 'Human Resources', companyId: egcCompany.id },
  });

  const aecciDevDept = await prisma.department.create({
    data: { name: 'Operations', companyId: aecciCompany.id },
  });
  const aecciHrDept = await prisma.department.create({
    data: { name: 'HR and Compliance', companyId: aecciCompany.id },
  });

  const bppDevDept = await prisma.department.create({
    data: { name: 'Campaign Tech', companyId: bppCompany.id },
  });
  const bppHrDept = await prisma.department.create({
    data: { name: 'Public Relations', companyId: bppCompany.id },
  });

  // 5. Define passwords
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('superadmin123', salt);
  const hrPassword = await bcrypt.hash('hr123', salt);
  const managerPassword = await bcrypt.hash('manager123', salt);
  const employeePassword = await bcrypt.hash('employee123', salt);

  // 6. Create Users for EGC India (assigned to EGC Company)
  await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@egc.com',
      password: adminPassword,
      role: UserRole.SUPER_ADMIN,
      companyId: egcCompany.id,
      departmentId: egcDevDept.id,
      basicSalary: 120000,
      hra: 48000,
      allowances: 20000,
      pf: 14400,
      esi: 3900,
      tax: 15000,
      professionalTax: 200,
      biometricEnabled: true,
    },
  });

  await prisma.user.create({
    data: {
      name: 'EGC HR',
      email: 'hr@egc.com',
      password: hrPassword,
      role: UserRole.HR,
      companyId: egcCompany.id,
      departmentId: egcHrDept.id,
      basicSalary: 75000,
      hra: 30000,
      allowances: 10000,
      pf: 9000,
      esi: 2437.5,
      tax: 8000,
      professionalTax: 200,
      biometricEnabled: true,
    },
  });

  await prisma.user.create({
    data: {
      name: 'EGC Manager',
      email: 'manager@egc.com',
      password: managerPassword,
      role: UserRole.MANAGER,
      companyId: egcCompany.id,
      departmentId: egcDevDept.id,
      basicSalary: 95000,
      hra: 38000,
      allowances: 15000,
      pf: 11400,
      esi: 3087.5,
      tax: 12000,
      professionalTax: 200,
      biometricEnabled: true,
    },
  });

  await prisma.user.create({
    data: {
      name: 'John EGC Employee',
      email: 'employee@egc.com',
      password: employeePassword,
      role: UserRole.EMPLOYEE,
      companyId: egcCompany.id,
      departmentId: egcDevDept.id,
      basicSalary: 45000,
      hra: 18000,
      allowances: 8000,
      pf: 5400,
      esi: 1462.5,
      tax: 3000,
      professionalTax: 200,
      biometricEnabled: true,
    },
  });

  // 7. Create Users for AECCI
  await prisma.user.create({
    data: {
      name: 'AECCI HR Admin',
      email: 'hr@aecci.org',
      password: hrPassword,
      role: UserRole.HR,
      companyId: aecciCompany.id,
      departmentId: aecciHrDept.id,
      basicSalary: 80000,
      hra: 32000,
      allowances: 12000,
      pf: 9600,
      esi: 2600,
      tax: 9000,
      professionalTax: 200,
      biometricEnabled: true,
    },
  });

  await prisma.user.create({
    data: {
      name: 'AECCI Manager',
      email: 'manager@aecci.org',
      password: managerPassword,
      role: UserRole.MANAGER,
      companyId: aecciCompany.id,
      departmentId: aecciDevDept.id,
      basicSalary: 100000,
      hra: 40000,
      allowances: 18000,
      pf: 12000,
      esi: 3250,
      tax: 13000,
      professionalTax: 200,
      biometricEnabled: true,
    },
  });

  // 8. Create Users for BPP
  await prisma.user.create({
    data: {
      name: 'BPP HR Admin',
      email: 'hr@bpp.org',
      password: hrPassword,
      role: UserRole.HR,
      companyId: bppCompany.id,
      departmentId: bppHrDept.id,
      basicSalary: 85000,
      hra: 34000,
      allowances: 14000,
      pf: 10200,
      esi: 2762.5,
      tax: 10000,
      professionalTax: 200,
      biometricEnabled: true,
    },
  });

  await prisma.user.create({
    data: {
      name: 'BPP Campaign Lead',
      email: 'lead@bpp.org',
      password: managerPassword,
      role: UserRole.MANAGER,
      companyId: bppCompany.id,
      departmentId: bppDevDept.id,
      basicSalary: 110000,
      hra: 44000,
      allowances: 20000,
      pf: 13200,
      esi: 3575,
      tax: 14000,
      professionalTax: 200,
      biometricEnabled: true,
    },
  });

  console.log('Database seeded successfully with 3 companies at CBD Belapur, Navi Mumbai!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
