import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const syncLogs = await db.syncLog.findMany({
      orderBy: { startedAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ syncLogs });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch sync logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sheetUrl } = await request.json();

    if (!sheetUrl) {
      return NextResponse.json({ error: 'Sheet URL is required' }, { status: 400 });
    }

    const syncLog = await db.syncLog.create({
      data: { sheetUrl, status: 'running' },
    });

    try {
      const sheetId = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1];
      if (!sheetId) {
        throw new Error('Invalid sheet URL');
      }

      const gid = sheetUrl.match(/gid=(\d+)/)?.[1] || '0';
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

      const response = await fetch(csvUrl);
      if (!response.ok) throw new Error('Failed to fetch sheet');

      const csv = await response.text();
      const lines = csv.split('\n').filter(l => l.trim());

      if (lines.length < 2) throw new Error('No data in sheet');

      let imported = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (!cols[0]?.trim()) continue;

        const tourName = cols[0].trim();
        const category = categorizeTour(tourName);

        await db.tour.upsert({
          where: { id: `${tourName}-${i}` },
          update: {
            tourName,
            websiteLink: cols[1]?.trim() || '',
            tourLinkCtrip: cols[2]?.trim() || '',
            tourLinkViator: cols[3]?.trim() || '',
            tourLinkHeadout: cols[4]?.trim() || '',
            tourLinkKlook: cols[5]?.trim() || '',
            tourLinkExpedition: cols[6]?.trim() || '',
            tourLinkCivitatis: cols[7]?.trim() || '',
            destinationCity: cols[8]?.trim() || '',
            supplierPriceAdult: cleanPrice(cols[9]),
            supplierPriceChild: cleanPrice(cols[10]),
            availabilityDay: cols[11]?.trim() || '',
            inclusion: cols[12]?.trim() || '',
            supplierInfo: cols[13]?.trim() || '',
            websitePrice: cleanPrice(cols[14]),
            ctripPrice: cleanPrice(cols[15]),
            viatorPrice: cleanPrice(cols[16]),
            klookPrice: cleanPrice(cols[17]),
            expeditionPrice: cleanPrice(cols[18]),
            civitatisPrice: cleanPrice(cols[19]),
            headoutPrice: cleanPrice(cols[20]),
            bookings: parseNum(cols[21]),
            revenue: cleanPrice(cols[22]),
            category,
            sheetRow: i,
          },
          create: {
            id: `${tourName}-${i}`,
            tourName,
            websiteLink: cols[1]?.trim() || '',
            tourLinkCtrip: cols[2]?.trim() || '',
            tourLinkViator: cols[3]?.trim() || '',
            tourLinkHeadout: cols[4]?.trim() || '',
            tourLinkKlook: cols[5]?.trim() || '',
            tourLinkExpedition: cols[6]?.trim() || '',
            tourLinkCivitatis: cols[7]?.trim() || '',
            destinationCity: cols[8]?.trim() || '',
            supplierPriceAdult: cleanPrice(cols[9]),
            supplierPriceChild: cleanPrice(cols[10]),
            availabilityDay: cols[11]?.trim() || '',
            inclusion: cols[12]?.trim() || '',
            supplierInfo: cols[13]?.trim() || '',
            websitePrice: cleanPrice(cols[14]),
            ctripPrice: cleanPrice(cols[15]),
            viatorPrice: cleanPrice(cols[16]),
            klookPrice: cleanPrice(cols[17]),
            expeditionPrice: cleanPrice(cols[18]),
            civitatisPrice: cleanPrice(cols[19]),
            headoutPrice: cleanPrice(cols[20]),
            bookings: parseNum(cols[21]),
            revenue: cleanPrice(cols[22]),
            category,
            sheetRow: i,
          },
        });

        imported++;
      }

      await db.syncLog.update({
        where: { id: syncLog.id },
        data: { status: 'completed', totalRows: lines.length - 1, importedRows: imported, completedAt: new Date() },
      });

      return NextResponse.json({ success: true, imported, total: lines.length - 1 });
    } catch (err) {
      await db.syncLog.update({
        where: { id: syncLog.id },
        data: { status: 'failed', error: (err as Error).message, completedAt: new Date() },
      });
      return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"'; i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current); current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function cleanPrice(s: string | undefined): string {
  if (!s || ['Loading...', '#VALUE!', '#REF!', '#N/A'].includes(s.trim())) return '';
  return s.trim();
}

function parseNum(s: string | undefined): number {
  if (!s) return 0;
  const n = parseFloat(s.replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? 0 : Math.abs(n);
}

function categorizeTour(name: string): string {
  const n = name.toLowerCase();
  if (/yacht|boat|catamaran|pirate|starcraft|neptun|titanic|cruise|gorgona|khaleesi|efsane|queen vip/.test(n)) return 'Boat & Yacht';
  if (/safari|quad|buggy|atv|jeep/.test(n)) return 'Adventure & Safari';
  if (/bath|spa|turkish/.test(n)) return 'Spa & Wellness';
  if (/transfer|shuttle|airport|vip transfer/.test(n)) return 'Transfer';
  if (/rafting|zipline|paragliding|scuba|diving|swim|jet ski|parasailing|sea bike|hovercraft|shooting|helicopter|horseback|horse/.test(n)) return 'Adventure & Safari';
  if (/tour|city|canyon|cave|waterfall|cultural|pamukkale|demre|kekov|aspendos|cappadocia|fire of anatolia|night show/.test(n)) return 'Day Tours';
  if (/land of legends|aquarium|dolphin|theme/.test(n)) return 'Theme Parks & Entertainment';
  if (/nights|hotel|stay|accommodation/.test(n)) return 'Packages';
  return 'Other';
}
