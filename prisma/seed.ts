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
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.holiday.deleteMany({});
  await prisma.company.deleteMany({});

  console.log('Database cleaned! Starting seeding...');

  // 1. Create Company
  const company = await prisma.company.create({
    data: {
      name: 'EGC India',
      logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aba9?w=80&auto=format&fit=crop&q=60',
      address: 'Mumbai HQ, Maharashtra, India',
      officeRadius: 200, // 200 meters
      latitude: 19.0760, // Mumbai HQ Coordinate
      longitude: 72.8777,
    },
  });

  // 2. Create Departments
  const devDept = await prisma.department.create({
    data: {
      name: 'Engineering',
      companyId: company.id,
    },
  });

  const hrDept = await prisma.department.create({
    data: {
      name: 'Human Resources',
      companyId: company.id,
    },
  });

  // 3. Define passwords
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('superadmin123', salt);
  const hrPassword = await bcrypt.hash('hr123', salt);
  const managerPassword = await bcrypt.hash('manager123', salt);
  const employeePassword = await bcrypt.hash('employee123', salt);

  // 4. Create Core Users
  await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@egc.com',
      password: adminPassword,
      role: UserRole.SUPER_ADMIN,
      companyId: company.id,
      departmentId: devDept.id,
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
      name: 'HR Admin',
      email: 'hr@egc.com',
      password: hrPassword,
      role: UserRole.HR,
      companyId: company.id,
      departmentId: hrDept.id,
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
      name: 'Team Manager',
      email: 'manager@egc.com',
      password: managerPassword,
      role: UserRole.MANAGER,
      companyId: company.id,
      departmentId: devDept.id,
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
      name: 'John Employee',
      email: 'employee@egc.com',
      password: employeePassword,
      role: UserRole.EMPLOYEE,
      companyId: company.id,
      departmentId: devDept.id,
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

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
