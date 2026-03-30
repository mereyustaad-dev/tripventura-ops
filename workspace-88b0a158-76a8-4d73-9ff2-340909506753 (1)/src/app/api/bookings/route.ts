import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const marketplace = searchParams.get('marketplace') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const destination = searchParams.get('destination') || '';

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { customerName: { contains: search } },
        { customerEmail: { contains: search } },
        { tour: { tourName: { contains: search } } },
      ];
    }
    if (status) where.status = status;
    if (marketplace) where.marketplace = marketplace;
    if (dateFrom || dateTo) {
      where.bookingDate = {};
      if (dateFrom) (where.bookingDate as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (where.bookingDate as Record<string, unknown>).lte = new Date(dateTo);
    }
    if (destination) {
      where.tour = { destinationCity: destination };
    }

    const [bookings, total] = await Promise.all([
      db.booking.findMany({
        where,
        include: { tour: { select: { tourName: true, destinationCity: true, category: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { bookingDate: 'desc' },
      }),
      db.booking.count({ where }),
    ]);

    return NextResponse.json({
      bookings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Bookings fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...data } = body;

    const booking = await db.booking.create({
      data: {
        ...data,
        profit: data.totalPrice - (data.supplierCost || 0),
        userId: userId || null,
      },
      include: { tour: { select: { tourName: true, destinationCity: true } } },
    });

    return NextResponse.json({ booking });
  } catch (error) {
    console.error('Booking create error:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    const booking = await db.booking.update({
      where: { id },
      data,
      include: { tour: { select: { tourName: true, destinationCity: true } } },
    });

    return NextResponse.json({ booking });
  } catch (error) {
    console.error('Booking update error:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}
