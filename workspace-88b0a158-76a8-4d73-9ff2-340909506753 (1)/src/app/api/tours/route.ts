import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const destination = searchParams.get('destination') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const availability = searchParams.get('availability') || '';
    const hasCtrip = searchParams.get('hasCtrip') === 'true';
    const hasViator = searchParams.get('hasViator') === 'true';
    const hasKlook = searchParams.get('hasKlook') === 'true';
    const hasExpedition = searchParams.get('hasExpedition') === 'true';
    const hasHeadout = searchParams.get('hasHeadout') === 'true';
    const hasCivitatis = searchParams.get('hasCivitatis') === 'true';
    const hasWebsite = searchParams.get('hasWebsite') === 'true';
    const priceRange = searchParams.get('priceRange') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { tourName: { contains: search } },
        { destinationCity: { contains: search } },
        { inclusion: { contains: search } },
        { supplierInfo: { contains: search } },
      ];
    }

    if (destination) where.destinationCity = destination;
    if (category) where.category = category;
    if (status) where.status = status;
    if (availability) where.availabilityDay = { contains: availability };
    if (hasCtrip) where.tourLinkCtrip = { not: '' };
    if (hasViator) where.tourLinkViator = { not: '' };
    if (hasKlook) where.tourLinkKlook = { not: '' };
    if (hasExpedition) where.tourLinkExpedition = { not: '' };
    if (hasHeadout) where.tourLinkHeadout = { not: '' };
    if (hasCivitatis) where.tourLinkCivitatis = { not: '' };
    if (hasWebsite) where.websiteLink = { not: '' };

    const [tours, total] = await Promise.all([
      db.tour.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder === 'desc' ? 'desc' : 'asc' },
      }),
      db.tour.count({ where }),
    ]);

    const destinations = await db.tour.findMany({
      select: { destinationCity: true },
      distinct: ['destinationCity'],
    });

    const categories = await db.tour.findMany({
      select: { category: true },
      distinct: ['category'],
    });

    return NextResponse.json({
      tours,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      filters: {
        destinations: destinations.map(d => d.destinationCity).filter(Boolean).sort(),
        categories: categories.map(c => c.category).filter(Boolean).sort(),
      },
    });
  } catch (error) {
    console.error('Tours fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch tours' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Tour ID is required' }, { status: 400 });
    }

    const tour = await db.tour.update({
      where: { id },
      data,
    });

    return NextResponse.json({ tour });
  } catch (error) {
    console.error('Tour update error:', error);
    return NextResponse.json({ error: 'Failed to update tour' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Tour ID is required' }, { status: 400 });
    }

    await db.tour.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tour delete error:', error);
    return NextResponse.json({ error: 'Failed to delete tour' }, { status: 500 });
  }
}
