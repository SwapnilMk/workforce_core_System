import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { calculateDistance } from '@/lib/geo';
import { AttendanceStatus } from '@prisma/client';

const OFFICE_LOCATION = { latitude: 19.0760, longitude: 72.8777 };
const OFFICE_RADIUS = 200; // 200 meters

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, id: userId, companyId } = session.user;
    const { searchParams } = request.nextUrl;
    const limit = Number(searchParams.get('limit') ?? 50);

    const { getTenantFilter } = require('@/lib/tenant');
    let where: any = {
      ...getTenantFilter(session.user),
    };

    // Strict RBAC filtering
    if (role === 'EMPLOYEE') {
      where.userId = userId;
    } else if (role === 'MANAGER') {
      // Find users in manager's department
      const manager = await prisma.user.findUnique({
        where: { id: userId },
        select: { departmentId: true }
      });
      if (manager?.departmentId) {
        where.user = { departmentId: manager.departmentId };
      } else {
        where.userId = userId;
      }
    }

    const logs = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
            department: { select: { name: true } }
          }
        }
      },
      orderBy: { date: 'desc' },
      take: limit,
    });

    const userProfile = await prisma.attendanceProfile.findFirst({
      where: { userId }
    });
    const remoteWorkAllowed = userProfile?.remoteWorkAllowed === true;

    return NextResponse.json({ success: true, logs, remoteWorkAllowed });
  } catch (error: any) {
    console.error('Attendance GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = session.user;
    const body = await request.json();
    const { action, latitude, longitude, isMockLocation, isVpnDetected, selfieUrl } = body;

    if (!action || !latitude || !longitude) {
      return NextResponse.json({ error: 'Missing coordinates or punch action' }, { status: 400 });
    }

    // 1. Fetch User and their attendance settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { attendanceProfile: true }
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isWfh = user.attendanceProfile?.remoteWorkAllowed === true;

    // 2. Calculate Geofence Distance
    const distance = calculateDistance(latitude, longitude, OFFICE_LOCATION.latitude, OFFICE_LOCATION.longitude);
    const isInsideRadius = isWfh || distance <= OFFICE_RADIUS;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    if (action === 'check-in') {
      // Ensure not already checked in today
      const existingCheckIn = await prisma.attendance.findFirst({
        where: {
          userId,
          date: { gte: todayStart, lte: todayEnd },
          checkIn: { not: null },
          failedAttempt: false
        }
      });

      if (existingCheckIn) {
        return NextResponse.json({ error: 'Already punched in for today.' }, { status: 400 });
      }

      // If outside office radius, log failed attempt & reject
      if (!isInsideRadius) {
        await prisma.attendance.create({
          data: {
            userId,
            companyId: user.companyId,
            latitude,
            longitude,
            isMockLocation: !!isMockLocation,
            isVpnDetected: !!isVpnDetected,
            failedAttempt: true,
            errorMessage: `Outside radius limit. Location is ${Math.round(distance)}m away from office center.`,
            status: AttendanceStatus.ABSENT
          }
        });

        // Also add secure audit log
        await prisma.loginHistory.create({
          data: {
            userId,
            status: 'FAILED',
            location: `Outside Radius (${Math.round(distance)}m)`,
            ip: 'unknown'
          }
        });

        return NextResponse.json({
          error: `Geofence block: You are ${Math.round(distance)} meters away. Punch rejected.`,
          distance
        }, { status: 403 });
      }

      // Determine late status (Late mark after 09:15 AM)
      const now = new Date();
      const lateTime = new Date();
      lateTime.setHours(9, 15, 0, 0);
      const status = now > lateTime ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

      // Create attendance log
      const record = await prisma.attendance.create({
        data: {
          userId,
          companyId: user.companyId,
          checkIn: now,
          status,
          latitude,
          longitude,
          isMockLocation: !!isMockLocation,
          isVpnDetected: !!isVpnDetected,
          selfieUrl,
          failedAttempt: false
        }
      });

      // Send a system notification
      await prisma.notification.create({
        data: {
          userId,
          companyId: user.companyId,
          title: 'Punch In Verified',
          message: `Successfully verified check-in at ${now.toLocaleTimeString()}`,
          type: 'SUCCESS'
        }
      });

      return NextResponse.json({ success: true, message: 'Check-in successful', record });

    } else if (action === 'check-out') {
      // Find today's active check-in
      const activeRecord = await prisma.attendance.findFirst({
        where: {
          userId,
          date: { gte: todayStart, lte: todayEnd },
          checkIn: { not: null },
          checkOut: null,
          failedAttempt: false
        }
      });

      if (!activeRecord) {
        return NextResponse.json({ error: 'No active check-in found for today. Please punch in first.' }, { status: 400 });
      }

      const now = new Date();
      const checkInTime = new Date(activeRecord.checkIn!);
      const workMs = now.getTime() - checkInTime.getTime();
      const workHours = Math.round((workMs / (1000 * 60 * 60)) * 100) / 100; // rounded to 2 decimals
      const overtime = workHours > 8 ? Math.round((workHours - 8) * 100) / 100 : 0;

      const record = await prisma.attendance.update({
        where: { id: activeRecord.id },
        data: {
          checkOut: now,
          workHours,
          overtime
        }
      });

      await prisma.notification.create({
        data: {
          userId,
          companyId: user.companyId,
          title: 'Punch Out Verified',
          message: `Successfully verified check-out at ${now.toLocaleTimeString()}. Work hours: ${workHours} hrs.`,
          type: 'INFO'
        }
      });

      return NextResponse.json({ success: true, message: 'Check-out successful', record });
    }

    return NextResponse.json({ error: 'Invalid punch action' }, { status: 400 });
  } catch (error: any) {
    console.error('Attendance POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
