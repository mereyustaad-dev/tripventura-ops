import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

function parseSheetNumber(val: string | null | undefined): number {
  if (!val) return 0;
  const cleaned = val.replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.abs(num);
}

function parsePriceNum(val: string | null | undefined): number {
  if (!val) return 0;
  const cleaned = val.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.abs(num);
}

export async function GET() {
  try {
    const [
      totalTours,
      activeTours,
      destinations,
      categories,
      allTours,
      pricingSummary,
      availabilityStats,
      recentBookings,
    ] = await Promise.all([
      db.tour.count(),
      db.tour.count({ where: { status: 'active' } }),
      db.tour.groupBy({ by: ['destinationCity'], _count: true }),
      db.tour.groupBy({ by: ['category'], _count: true }),
      db.tour.findMany(),
      db.tour.findMany({
        select: {
          tourName: true,
          destinationCity: true,
          supplierPriceAdult: true,
          websitePrice: true,
          viatorPrice: true,
          ctripPrice: true,
          klookPrice: true,
          expeditionPrice: true,
          civitatisPrice: true,
          headoutPrice: true,
        },
        take: 30,
      }),
      db.tour.groupBy({ by: ['availabilityDay'], _count: true }),
      // Only real manual bookings
      db.booking.findMany({
        take: 10,
        orderBy: { bookingDate: 'desc' },
        include: { tour: { select: { tourName: true, destinationCity: true, category: true } } },
      }),
    ]);

    // ── Derive KPIs from Sheet Data ──
    // Total bookings from the sheet column
    const totalSheetBookings = allTours.reduce((sum, t) => sum + (t.bookings || 0), 0);

    // Revenue from sheet revenue column
    const totalSheetRevenue = allTours.reduce((sum, t) => sum + parseSheetNumber(t.revenue), 0);

    // Average supplier price across tours that have a price
    const toursWithPrice = allTours.filter(t => parsePriceNum(t.supplierPriceAdult) > 0);
    const avgSupplierPrice = toursWithPrice.length > 0
      ? Math.round(toursWithPrice.reduce((s, t) => s + parsePriceNum(t.supplierPriceAdult), 0) / toursWithPrice.length)
      : 0;

    // Average website price
    const toursWithWebPrice = allTours.filter(t => parsePriceNum(t.websitePrice) > 0);
    const avgWebsitePrice = toursWithWebPrice.length > 0
      ? Math.round(toursWithWebPrice.reduce((s, t) => s + parsePriceNum(t.websitePrice), 0) / toursWithWebPrice.length)
      : 0;

    // Count of manual bookings (from our system)
    const manualBookingCount = recentBookings.length;

    // Manual booking revenue (from our system)
    const manualBookingRevenue = 0; // Will be calculated when bookings exist

    // Top tours by sheet bookings
    const topTours = allTours
      .filter(t => (t.bookings || 0) > 0)
      .sort((a, b) => (b.bookings || 0) - (a.bookings || 0))
      .slice(0, 10)
      .map(t => ({
        tourId: t.id,
        tourName: t.tourName,
        destinationCity: t.destinationCity,
        category: t.category,
        _count: { id: t.bookings || 0 },
        _sum: { totalPrice: parseSheetNumber(t.revenue) },
      }));

    // Marketplace distribution — count of tours listed per platform
    const marketplaceDistribution = [
      { marketplace: 'Website', _count: allTours.filter(t => t.websiteLink && !t.websiteLink.startsWith('MISSING')).length, _sum: { totalPrice: 0, profit: 0 } },
      { marketplace: 'Ctrip', _count: allTours.filter(t => t.tourLinkCtrip && !t.tourLinkCtrip.startsWith('Not Listed') && !t.tourLinkCtrip.startsWith('Need') && t.tourLinkCtrip.trim() !== '').length, _sum: { totalPrice: 0, profit: 0 } },
      { marketplace: 'Viator', _count: allTours.filter(t => t.tourLinkViator && t.tourLinkViator.trim() !== '').length, _sum: { totalPrice: 0, profit: 0 } },
      { marketplace: 'Klook', _count: allTours.filter(t => t.tourLinkKlook && t.tourLinkKlook.trim() !== '').length, _sum: { totalPrice: 0, profit: 0 } },
      { marketplace: 'Expedition', _count: allTours.filter(t => t.tourLinkExpedition && t.tourLinkExpedition.trim() !== '').length, _sum: { totalPrice: 0, profit: 0 } },
      { marketplace: 'Headout', _count: allTours.filter(t => t.tourLinkHeadout && t.tourLinkHeadout.trim() !== '').length, _sum: { totalPrice: 0, profit: 0 } },
      { marketplace: 'Civitatis', _count: allTours.filter(t => t.tourLinkCivitatis && t.tourLinkCivitatis.trim() !== '').length, _sum: { totalPrice: 0, profit: 0 } },
    ];

    // Destination revenue from sheet
    const destinationRevenue: Record<string, number> = {};
    allTours.forEach(t => {
      const city = t.destinationCity || 'Unknown';
      if (!destinationRevenue[city]) destinationRevenue[city] = 0;
      destinationRevenue[city] += parseSheetNumber(t.revenue);
    });

    // Category revenue from sheet
    const categoryRevenue: Record<string, number> = {};
    allTours.forEach(t => {
      const cat = t.category || 'Other';
      if (!categoryRevenue[cat]) categoryRevenue[cat] = 0;
      categoryRevenue[cat] += parseSheetNumber(t.revenue);
    });

    // Listing coverage
    const listingCoverage = {
      website: allTours.filter(t => t.websiteLink && !t.websiteLink.startsWith('MISSING')).length,
      ctrip: allTours.filter(t => t.tourLinkCtrip && !t.tourLinkCtrip.startsWith('Not Listed') && !t.tourLinkCtrip.startsWith('Need') && t.tourLinkCtrip.trim() !== '').length,
      viator: allTours.filter(t => t.tourLinkViator && t.tourLinkViator.trim() !== '').length,
      klook: allTours.filter(t => t.tourLinkKlook && t.tourLinkKlook.trim() !== '').length,
      expedition: allTours.filter(t => t.tourLinkExpedition && t.tourLinkExpedition.trim() !== '').length,
      headout: allTours.filter(t => t.tourLinkHeadout && t.tourLinkHeadout.trim() !== '').length,
      civitatis: allTours.filter(t => t.tourLinkCivitatis && t.tourLinkCivitatis.trim() !== '').length,
    };

    // Pricing summary — top tours with prices across platforms
    const topPricedTours = allTours
      .filter(t => parsePriceNum(t.websitePrice) > 0 || parsePriceNum(t.supplierPriceAdult) > 0)
      .slice(0, 20);

    return NextResponse.json({
      kpis: {
        totalTours,
        activeTours,
        totalBookings: totalSheetBookings,
        totalRevenue: totalSheetRevenue,
        totalProfit: 0,
        avgOrderValue: avgWebsitePrice,
        avgSupplierPrice,
        manualBookings: manualBookingCount,
        toursWithWebsitePrice: toursWithWebPrice.length,
        profitMargin: 0,
      },
      destinations: destinations.sort((a, b) => b._count - a._count).map(d => ({
        ...d,
        revenue: destinationRevenue[d.destinationCity] || 0,
      })),
      categories: categories.sort((a, b) => b._count - a._count).map(c => ({
        ...c,
        revenue: categoryRevenue[c.category] || 0,
      })),
      marketplaceDistribution,
      bookingTrend: [],
      topTours,
      recentBookings,
      pricingSummary: topPricedTours.map(t => ({
        tourName: t.tourName,
        destinationCity: t.destinationCity,
        supplierPriceAdult: t.supplierPriceAdult,
        websitePrice: t.websitePrice,
        viatorPrice: t.viatorPrice,
        ctripPrice: t.ctripPrice,
        klookPrice: t.klookPrice,
        expeditionPrice: t.expeditionPrice,
        civitatisPrice: t.civitatisPrice,
        headoutPrice: t.headoutPrice,
      })),
      availabilityStats,
      listingCoverage,
      totalListings: allTours.length,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
