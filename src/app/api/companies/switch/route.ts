import { NextResponse } from 'next/server';
import { getSession, login } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = await req.json();
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    const targetCompany = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!targetCompany) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (targetCompany.status !== 'ACTIVE' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Company is suspended or inactive' }, { status: 403 });
    }

    // Authorization check
    if (session.user.role !== 'SUPER_ADMIN') {
      // Regular users can only switch to their own assigned company
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      if (dbUser?.companyId !== companyId) {
        return NextResponse.json({ error: 'Forbidden: You do not belong to this company' }, { status: 403 });
      }
    }

    // Update the session JWT
    const updatedUser = {
      ...session.user,
      companyId: companyId,
    };

    await login(updatedUser);

    return NextResponse.json({
      success: true,
      message: `Successfully switched to company: ${targetCompany.name}`,
      company: {
        id: targetCompany.id,
        name: targetCompany.name,
        logo: targetCompany.logo,
        primaryColor: targetCompany.primaryColor,
        secondaryColor: targetCompany.secondaryColor,
        themePreference: targetCompany.themePreference,
      },
    });
  } catch (error) {
    console.error('Company switch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
