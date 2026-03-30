import { db } from '@/lib/db';
import { hash } from 'bcryptjs';
import fs from 'fs';
import path from 'path';

function parsePrice(priceStr: string | undefined): string {
  if (!priceStr || priceStr === 'Loading...' || priceStr === '#VALUE!' || priceStr === '#REF!' || priceStr === '#N/A') return '';
  return priceStr.trim();
}

function parseNumber(numStr: string | undefined): number {
  if (!numStr) return 0;
  const cleaned = numStr.replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.abs(num);
}

function categorizeTour(tourName: string): string {
  const name = tourName.toLowerCase();
  if (name.includes('yacht') || name.includes('boat') || name.includes('catamaran') || name.includes('pirate') || name.includes('starcraft') || name.includes('neptun') || name.includes('titanic') || name.includes('cruise') || name.includes('gorgona') || name.includes('khaleesi') || name.includes('efsane') || name.includes('queen vip')) return 'Boat & Yacht';
  if (name.includes('safari') || name.includes('quad') || name.includes('buggy') || name.includes('atv') || name.includes('jeep')) return 'Adventure & Safari';
  if (name.includes('bath') || name.includes('spa') || name.includes('turkish')) return 'Spa & Wellness';
  if (name.includes('transfer') || name.includes('shuttle') || name.includes('airport') || name.includes('vip transfer')) return 'Transfer';
  if (name.includes('rafting') || name.includes('zipline') || name.includes('paragliding') || name.includes('scuba') || name.includes('diving') || name.includes('swim') || name.includes('jet ski') || name.includes('parasailing') || name.includes('sea bike') || name.includes('hovercraft') || name.includes('shooting') || name.includes('helicopter') || name.includes('horseback') || name.includes('horse')) return 'Adventure & Safari';
  if (name.includes('tour') || name.includes('city') || name.includes('canyon') || name.includes('cave') || name.includes('waterfall') || name.includes('cultural') || name.includes('pamukkale') || name.includes('demre') || name.includes('kekov') || name.includes('aspendos') || name.includes('cappadocia') || name.includes('fire of anatolia') || name.includes('night show')) return 'Day Tours';
  if (name.includes('land of legends') || name.includes('aquarium') || name.includes('dolphin') || name.includes('theme')) return 'Theme Parks & Entertainment';
  if (name.includes('nights') || name.includes('hotel') || name.includes('stay') || name.includes('accommodation')) return 'Packages';
  return 'Other';
}

async function seedTours() {
  const csvPath = path.join(process.cwd(), 'sheet_raw.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.log('No sheet_raw.csv found, skipping tour seed');
    return;
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(l => l.trim());
  
  if (lines.length < 2) {
    console.log('CSV has no data rows, skipping tour seed');
    return;
  }

  const tours = [];
  
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 2 || !cols[0]?.trim()) continue;

    const tourName = cols[0]?.trim() || '';
    const category = categorizeTour(tourName);
    const bookings = parseNumber(cols[20]);
    const revenue = parsePrice(cols[21]);

    tours.push({
      tourName,
      websiteLink: cols[1]?.trim() || '',
      tourLinkCtrip: cols[2]?.trim() || '',
      tourLinkViator: cols[3]?.trim() || '',
      tourLinkHeadout: cols[4]?.trim() || '',
      tourLinkKlook: cols[5]?.trim() || '',
      tourLinkExpedition: cols[6]?.trim() || '',
      tourLinkCivitatis: cols[7]?.trim() || '',
      destinationCity: cols[8]?.trim() || '',
      supplierPriceAdult: parsePrice(cols[9]),
      supplierPriceChild: parsePrice(cols[10]),
      availabilityDay: cols[11]?.trim() || '',
      inclusion: cols[12]?.trim() || '',
      supplierInfo: cols[13]?.trim() || '',
      websitePrice: parsePrice(cols[14]),
      ctripPrice: parsePrice(cols[15]),
      viatorPrice: parsePrice(cols[16]),
      klookPrice: parsePrice(cols[17]),
      expeditionPrice: parsePrice(cols[18]),
      civitatisPrice: parsePrice(cols[19]),
      headoutPrice: '',
      bookings,
      revenue: revenue || '',
      category,
      status: 'active' as const,
      sheetRow: i,
    });
  }

  // Batch insert
  const batchSize = 50;
  for (let i = 0; i < tours.length; i += batchSize) {
    const batch = tours.slice(i, i + batchSize);
    for (const tour of batch) {
      await db.tour.upsert({
        where: { id: `${tour.tourName}-${tour.sheetRow}` },
        update: tour,
        create: { ...tour, id: `${tour.tourName}-${tour.sheetRow}` },
      });
    }
  }

  console.log(`Seeded ${tours.length} tours`);
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  
  return result;
}

async function seedUsers() {
  const adminPassword = await hash('admin123', 12);
  const managerPassword = await hash('manager123', 12);
  const opsPassword = await hash('ops123', 12);
  const financePassword = await hash('finance123', 12);
  const viewerPassword = await hash('viewer123', 12);

  await db.user.upsert({
    where: { email: 'admin@tripventura.com' },
    update: {},
    create: {
      email: 'admin@tripventura.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'admin',
      department: 'Management',
      isActive: true,
    },
  });

  await db.user.upsert({
    where: { email: 'manager@tripventura.com' },
    update: {},
    create: {
      email: 'manager@tripventura.com',
      password: managerPassword,
      name: 'Operations Manager',
      role: 'manager',
      department: 'Operations',
      isActive: true,
    },
  });

  await db.user.upsert({
    where: { email: 'ops@tripventura.com' },
    update: {},
    create: {
      email: 'ops@tripventura.com',
      password: opsPassword,
      name: 'Operations Staff',
      role: 'operations',
      department: 'Operations',
      isActive: true,
    },
  });

  await db.user.upsert({
    where: { email: 'finance@tripventura.com' },
    update: {},
    create: {
      email: 'finance@tripventura.com',
      password: financePassword,
      name: 'Finance Manager',
      role: 'finance',
      department: 'Finance',
      isActive: true,
    },
  });

  await db.user.upsert({
    where: { email: 'viewer@tripventura.com' },
    update: {},
    create: {
      email: 'viewer@tripventura.com',
      password: viewerPassword,
      name: 'Viewer',
      role: 'viewer',
      department: 'Sales',
      isActive: true,
    },
  });

  console.log('Seeded 5 users');
}

async function seedBookings() {
  const tours = await db.tour.findMany({ take: 30 });
  
  const bookings = [];
  const statuses = ['confirmed', 'pending', 'completed', 'cancelled'];
  const marketplaces = ['website', 'ctrip', 'viator', 'klook', 'headout'];
  const names = ['John Smith', 'Maria Garcia', 'Ahmed Ali', 'Sarah Johnson', 'James Wilson', 'Elena Popova', 'Li Wei', 'Hans Mueller', 'Fatima Khan', 'Carlos Silva', 'Anna Kowalski', 'Tom Brown', 'Yuki Tanaka', 'Pierre Dupont', 'Mohammed Hassan'];
  
  for (const tour of tours) {
    const numBookings = Math.floor(Math.random() * 8) + 1;
    for (let i = 0; i < numBookings; i++) {
      const adults = Math.floor(Math.random() * 5) + 1;
      const children = Math.floor(Math.random() * 4);
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const marketplace = marketplaces[Math.floor(Math.random() * marketplaces.length)];
      const customerName = names[Math.floor(Math.random() * names.length)];
      
      const basePrice = Math.floor(Math.random() * 150) + 10;
      const totalPrice = basePrice * adults + Math.floor(basePrice * 0.5) * children;
      const supplierCost = Math.floor(totalPrice * 0.4);
      const profit = totalPrice - supplierCost;
      
      const daysAgo = Math.floor(Math.random() * 90);
      const bookingDate = new Date();
      bookingDate.setDate(bookingDate.getDate() - daysAgo);
      
      const tourDateOffset = Math.floor(Math.random() * 30) + 1;
      const tourDate = new Date();
      tourDate.setDate(tourDate.getDate() + tourDateOffset);

      bookings.push({
        tourId: tour.id,
        customerName,
        customerEmail: `${customerName.toLowerCase().replace(' ', '.')}@email.com`,
        customerPhone: `+${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
        marketplace,
        adults,
        children,
        totalPrice,
        supplierCost,
        profit,
        bookingDate,
        tourDate,
        status,
        notes: '',
      });
    }
  }

  const batchSize = 50;
  for (let i = 0; i < bookings.length; i += batchSize) {
    const batch = bookings.slice(i, i + batchSize);
    await db.booking.createMany({ data: batch });
  }

  console.log(`Seeded ${bookings.length} bookings`);
}

async function seedNotifications() {
  const users = await db.user.findMany();
  
  const notifications = [
    { title: 'Price Update Alert', message: 'Ctrip prices updated for 12 Alanya tours. Please review new rates.', type: 'warning' },
    { title: 'New Booking Received', message: 'A new booking for "Alanya Grand Pirate Boat Tour" was received via Viator.', type: 'success' },
    { title: 'Revenue Milestone', message: 'Monthly revenue exceeded €50,000 target! Great work team.', type: 'info' },
    { title: 'Supplier Communication', message: 'Urgent: Supplier "My Dream Tours" updated their cancellation policy.', type: 'alert' },
    { title: 'Sheet Sync Complete', message: 'Google Sheet sync completed successfully. 324 tours updated.', type: 'success' },
    { title: 'Pricing Discrepancy', message: 'Found 8 tours with pricing differences between Website and Ctrip.', type: 'warning' },
    { title: 'Weekly Report Ready', message: 'Your weekly business intelligence report is ready for download.', type: 'info' },
    { title: 'High Demand Alert', message: 'Alanya Paragliding Tour has 15 pending bookings. Check availability.', type: 'alert' },
  ];

  for (const user of users) {
    for (const notif of notifications) {
      const daysAgo = Math.floor(Math.random() * 14);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      
      await db.notification.create({
        data: {
          userId: user.id,
          ...notif,
          channel: 'in-app',
        },
      });
    }
  }

  console.log(`Seeded notifications for ${users.length} users`);
}

async function main() {
  console.log('🌱 Starting database seed...');
  
  try {
    await seedUsers();
    await seedTours();
    await seedBookings();
    await seedNotifications();
    console.log('✅ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

main();
