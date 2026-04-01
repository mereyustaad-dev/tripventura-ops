import * as fs from "fs";
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat,
  TableOfContents, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak
} from "docx";

// ─── Color Palette: "Midnight Code" ───
const c = {
  primary: "020617",
  body: "1E293B",
  secondary: "64748B",
  accent: "94A3B8",
  tableBg: "F8FAFC",
  brandRed: "E60000",
  white: "FFFFFF",
};

// ─── Borders ───
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: c.accent };
const cellBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
const noBorders = { top: { style: BorderStyle.NONE, size: 0, color: c.white }, bottom: { style: BorderStyle.NONE, size: 0, color: c.white }, left: { style: BorderStyle.NONE, size: 0, color: c.white }, right: { style: BorderStyle.NONE, size: 0, color: c.white } };

// ─── Helpers ───
const bodyRun = (text: string, opts: any = {}) => new TextRun({ text, font: "Calibri", size: 22, color: c.body, ...opts });
const boldRun = (text: string, opts: any = {}) => bodyRun(text, { bold: true, ...opts });
const accentRun = (text: string) => bodyRun(text, { color: c.accent });
const brandRun = (text: string) => bodyRun(text, { color: c.brandRed, bold: true });
const bodyPara = (runs: any[], opts: any = {}) => new Paragraph({ spacing: { after: 160, line: 250 }, alignment: AlignmentType.LEFT, ...opts, children: Array.isArray(runs) ? runs : [runs] });
const emptyPara = (space = 0) => new Paragraph({ spacing: { before: space, after: 0 }, children: [new TextRun({ text: "", size: 2 })] });

// ─── Table Helpers ───
const headerCell = (text: string, width: number) => new TableCell({
  borders: cellBorders,
  width: { size: width, type: WidthType.DXA },
  shading: { fill: c.tableBg, type: ShadingType.CLEAR },
  verticalAlign: VerticalAlign.CENTER,
  children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { line: 250 }, children: [new TextRun({ text, bold: true, font: "Calibri", size: 22, color: c.primary })] })],
});

const dataCell = (text: string, width: number, opts: any = {}) => new TableCell({
  borders: cellBorders,
  width: { size: width, type: WidthType.DXA },
  verticalAlign: VerticalAlign.CENTER,
  ...opts,
  children: [new Paragraph({ alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT, spacing: { line: 250 }, children: [bodyRun(text)] })],
});

const dataTableCell = (text: string, width: number, align: "left" | "center" | "right" = "left") => new TableCell({
  borders: cellBorders,
  width: { size: width, type: WidthType.DXA },
  verticalAlign: VerticalAlign.CENTER,
  children: [new Paragraph({ alignment: align === "center" ? AlignmentType.CENTER : align === "right" ? AlignmentType.RIGHT : AlignmentType.LEFT, spacing: { line: 250 }, children: [bodyRun(text)] })],
});

const makeTable = (headers: string[], rows: string[][], colWidths: number[], caption?: string) => {
  const tableRows: any[] = [
    new TableRow({ tableHeader: true, children: headers.map((h, i) => headerCell(h, colWidths[i])) }),
    ...rows.map(row => new TableRow({ children: row.map((cell, i) => dataTableCell(cell, colWidths[i])) })),
  ];
  const elements: any[] = [
    new Table({
      columnWidths: colWidths,
      alignment: AlignmentType.CENTER,
      margins: { top: 80, bottom: 80, left: 150, right: 150 },
      rows: tableRows,
    }),
  ];
  if (caption) {
    elements.push(bodyPara([accentRun(caption)], { alignment: AlignmentType.CENTER, spacing: { before: 80, after: 200, line: 250 } }));
  }
  return elements;
};

// ─── Heading shortcuts ───
const h1 = (text: string) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 600, after: 300, line: 250 }, children: [new TextRun({ text, font: "Times New Roman", size: 36, bold: true, color: c.primary })] });
const h2 = (text: string) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200, line: 250 }, children: [new TextRun({ text, font: "Times New Roman", size: 28, bold: true, color: c.primary })] });
const h3 = (text: string) => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 300, after: 150, line: 250 }, children: [new TextRun({ text, font: "Times New Roman", size: 24, bold: true, color: c.body })] });

// ─── Bullet list config references ───
const bulletConfigs: any[] = [];
let bulletIdx = 0;
const newBulletRef = () => {
  const ref = `bullet-${bulletIdx++}`;
  bulletConfigs.push({
    reference: ref,
    levels: [
      { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
    ],
  });
  return ref;
};

const numConfigs: any[] = [];
let numIdx = 0;
const newNumRef = () => {
  const ref = `num-${numIdx++}`;
  numConfigs.push({
    reference: ref,
    levels: [
      { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
    ],
  });
  return ref;
};

const bullet = (text: string, ref: string) => new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 80, line: 250 }, children: [bodyRun(text)] });
const bulletBold = (label: string, value: string, ref: string) => new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 80, line: 250 }, children: [boldRun(label), bodyRun(value)] });

// ═══════════════════════════════════════════════════════════
// SECTION 1: COVER PAGE
// ═══════════════════════════════════════════════════════════
const coverSection = {
  properties: {
    page: {
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      size: { width: 11906, height: 16838 },
    },
    titlePage: true,
  },
  children: [
    emptyPara(4800),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200, line: 250 }, children: [new TextRun({ text: "TRIPVENTURA", font: "Times New Roman", size: 72, bold: true, color: c.brandRed })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600, line: 250 }, children: [new TextRun({ text: "Break Free with Tripventura", font: "Calibri", size: 28, italics: true, color: c.secondary })] }),
    // Decorative line
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600, line: 250 }, children: [new TextRun({ text: "________________________________________", font: "Calibri", size: 22, color: c.accent })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200, line: 250 }, children: [new TextRun({ text: "Product Requirements Document", font: "Times New Roman", size: 48, bold: true, color: c.primary })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 800, line: 250 }, children: [new TextRun({ text: "Tour Operations Management System v1.0", font: "Calibri", size: 28, color: c.secondary })] }),
    // Decorative line
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600, line: 250 }, children: [new TextRun({ text: "________________________________________", font: "Calibri", size: 22, color: c.accent })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100, line: 250 }, children: [bodyRun("Date: July 2025")] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100, line: 250 }, children: [bodyRun("Version: 1.0")] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100, line: 250 }, children: [bodyRun("Classification: Internal Use Only")] }),
    emptyPara(2000),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0, line: 250 }, children: [new TextRun({ text: "CONFIDENTIAL", font: "Times New Roman", size: 28, bold: true, color: c.brandRed })] }),
  ],
};

// ═══════════════════════════════════════════════════════════
// SECTION 2: TABLE OF CONTENTS
// ═══════════════════════════════════════════════════════════
const tocSection = {
  properties: {
    page: {
      margin: { top: 1800, bottom: 1440, left: 1440, right: 1440 },
      size: { width: 11906, height: 16838 },
    },
  },
  children: [
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 400, line: 250 }, children: [new TextRun({ text: "Table of Contents", font: "Times New Roman", size: 36, bold: true, color: c.primary })] }),
    new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
    bodyPara([accentRun("Note: This Table of Contents is generated via field codes. To ensure page number accuracy after editing, please right-click the TOC and select \"Update Field.\"")], { spacing: { before: 200, after: 200, line: 250 } }),
  ],
};

// ═══════════════════════════════════════════════════════════
// SECTION 3: MAIN CONTENT
// ═══════════════════════════════════════════════════════════

// --- 1. Executive Summary ---
const bExec1 = newBulletRef();
const bExec2 = newBulletRef();
const section1 = [
  new Paragraph({ children: [new PageBreak()] }),
  h1("1. Executive Summary"),
  bodyPara([bodyRun("Tripventura is a comprehensive web-based operations management system designed specifically for tour operators managing multi-marketplace listings at scale. The platform consolidates the management of 324+ tours distributed across seven major online travel marketplaces\u2014Website, Ctrip, Viator, Klook, Expedition, Headout, and Civitatis\u2014into a single, unified interface. By centralizing tour data, pricing, bookings, and communications, Tripventura eliminates the operational complexity of managing disparate marketplace dashboards and manual spreadsheet workflows that plague modern tour operations.")]),
  bodyPara([bodyRun("Built with a modern technology stack comprising Next.js 16, TypeScript, Prisma ORM with SQLite, shadcn/ui, Recharts, Zustand, and Tailwind CSS 4, the system delivers a responsive, real-time operational experience. Key features include an interactive analytics dashboard with KPI tracking, advanced tour filtering and inline editing, five-tab pricing analytics with discrepancy detection, comprehensive bookings and revenue management with CSV export, a multi-channel communications hub supporting WhatsApp, Email, WeChat, and In-App notifications, and granular role-based access control with five user roles. The platform also features Google Sheets integration for data synchronization and a fully configurable settings module for system administration.")]),
];

// --- 2. Product Overview ---
const bVision = newBulletRef();
const bTarget = newBulletRef();
const section2 = [
  h1("2. Product Overview"),
  h2("2.1 Product Vision"),
  bodyPara([bodyRun("Tripventura envisions becoming the definitive operational backbone for tour operators worldwide. Our mission is to transform fragmented, manual tour management into a streamlined, data-driven operation that empowers teams to focus on delivering exceptional travel experiences rather than wrestling with administrative overhead across multiple platforms.")]),
  bodyPara([bodyRun("The core vision pillars include:")]),
  bullet("Unified Operations: A single dashboard to manage all tours, pricing, and bookings across every marketplace.", bVision),
  bullet("Data-Driven Decisions: Real-time analytics and pricing intelligence to maximize revenue and identify market opportunities.", bVision),
  bullet("Operational Efficiency: Automated synchronization, inline editing, and bulk operations to reduce manual work by up to 80%.", bVision),
  bullet("Seamless Communication: Integrated multi-channel messaging to keep teams, suppliers, and customers connected.", bVision),
  bullet("Scalable Architecture: A modern stack designed to grow from hundreds to thousands of tours without performance degradation.", bVision),

  h2("2.2 Target Users"),
  bodyPara([bodyRun("Tripventura is designed for tour operation companies and their teams. The primary user personas include:")]),
  bulletBold("Administrators: ", "Full system access including user management, system configuration, and data synchronization. Responsible for overall platform governance.", bTarget),
  bulletBold("Operations Managers: ", "Day-to-day tour management including listing updates, pricing adjustments, and marketplace coverage monitoring.", bTarget),
  bulletBold("Operations Staff: ", "Frontline team members managing bookings, customer communications, and tour detail updates.", bTarget),
  bulletBold("Finance Team: ", "Revenue tracking, profit analysis, cost monitoring, and financial reporting across all marketplaces.", bTarget),
  bulletBold("Viewers: ", "Read-only access for stakeholders, partners, and management who need visibility into operations without edit capabilities.", bTarget),

  h2("2.3 Technology Stack"),
  ...makeTable(
    ["Technology", "Purpose", "Version"],
    [
      ["Next.js", "React Framework (SSR/SSG)", "16"],
      ["TypeScript", "Type-Safe Language", "5.x"],
      ["Prisma ORM", "Database ORM", "6.x"],
      ["SQLite", "Embedded Database", "3.x"],
      ["shadcn/ui", "Component Library", "Latest"],
      ["Recharts", "Data Visualization", "2.x"],
      ["Zustand", "State Management", "5.x"],
      ["Tailwind CSS", "Utility-First CSS", "4"],
      ["NextAuth", "Authentication", "4.x"],
      ["TanStack Table", "Data Table Logic", "8.x"],
      ["Lucide React", "Icon Library", "0.525+"],
    ],
    [3120, 3120, 3120],
    "Table 1: Technology Stack Overview",
  ),
];

// --- 3. System Architecture ---
const bFrontend = newBulletRef();
const bBackend = newBulletRef();
const section3 = [
  h1("3. System Architecture"),
  h2("3.1 Frontend Architecture"),
  bodyPara([bodyRun("The frontend is built on Next.js 16 with the App Router paradigm, leveraging React Server Components where appropriate and client components for interactive features. The architecture follows a component-based design with shadcn/ui primitives, organized into feature modules:")]),
  bullet("Dashboard Module: KPI cards, charts (Recharts), marketplace coverage bars, and auto-refresh.", bFrontend),
  bullet("Tour Management Module: Advanced data table (TanStack Table), inline editing, Sheet-based detail views, and multi-faceted filtering with URL parameter synchronization.", bFrontend),
  bullet("Pricing Analytics Module: Five-tab interface with Overview, Comparison, Trends, Distribution, and Gaps analyses.", bFrontend),
  bullet("Bookings Module: Revenue dashboards, booking table with filters, new booking dialog, and CSV export.", bFrontend),
  bullet("Communications Module: Compose panel, notification feed with read/unread management, and pre-built templates.", bFrontend),
  bullet("Settings Module: User management, Google Sheets sync, system configuration, and profile editing.", bFrontend),
  bodyPara([bodyRun("State management uses Zustand stores for global state (authentication, application settings) while local component state handles feature-specific interactions. Tailwind CSS 4 provides utility-first styling with a custom \"Midnight Code\" color palette.")]),

  h2("3.2 Backend Architecture"),
  bodyPara([bodyRun("The backend leverages Next.js API Routes (App Router) for the server-side layer, with Prisma ORM handling all database operations against SQLite. The architecture is organized as follows:")]),
  bullet("API Routes: /api/auth/login, /api/auth/me, /api/tours, /api/bookings, /api/dashboard, /api/notifications, /api/sync, /api/users.", bBackend),
  bullet("Authentication: NextAuth.js with bcryptjs password hashing and JWT-based session management.", bBackend),
  bullet("Data Layer: Prisma ORM with 7 models (User, Tour, Booking, Notification, Activity, SyncLog, DashboardConfig).", bBackend),
  bullet("File Storage: SQLite embedded database for zero-infrastructure deployment.", bBackend),
  bodyPara([bodyRun("All API endpoints implement proper error handling, input validation, and role-based access control through middleware.")]),

  h2("3.3 Database Schema"),
  ...makeTable(
    ["Model", "Description", "Key Fields"],
    [
      ["User", "System users with role-based access", "email, password, name, role, isActive"],
      ["Tour", "Tour listings across marketplaces", "tourName, destinationCity, prices (7), status, category"],
      ["Booking", "Customer booking records", "tourId, customerName, marketplace, totalPrice, profit"],
      ["Notification", "User notifications and messages", "userId, title, message, type, channel, isRead"],
      ["Activity", "User action audit log", "userId, action, description, metadata"],
      ["SyncLog", "Google Sheets sync history", "sheetUrl, status, totalRows, importedRows"],
      ["DashboardConfig", "Dashboard configuration key-value store", "key, value"],
    ],
    [1800, 3780, 3780],
    "Table 2: Database Schema Overview",
  ),

  h2("3.4 API Routes"),
  ...makeTable(
    ["Endpoint", "Method", "Description"],
    [
      ["/api/auth/login", "POST", "User authentication with credentials"],
      ["/api/auth/me", "GET", "Fetch current authenticated user"],
      ["/api/tours", "GET/PUT/POST/DELETE", "Tour CRUD operations and listing"],
      ["/api/bookings", "GET/POST", "Booking retrieval and creation"],
      ["/api/dashboard", "GET", "Dashboard KPI and analytics data"],
      ["/api/notifications", "GET/POST/PUT", "Notification management"],
      ["/api/sync", "POST", "Trigger Google Sheets data import"],
      ["/api/users", "GET/POST/PUT", "User management operations"],
    ],
    [2800, 2280, 4280],
    "Table 3: API Routes",
  ),
];

// --- 4. Feature Specifications ---
const bAuthLogin = newBulletRef();
const bAuthRBAC = newBulletRef();
const bDashKPI = newBulletRef();
const bDashChart = newBulletRef();
const bDashMarket = newBulletRef();
const bTour1 = newBulletRef();
const bTour2 = newBulletRef();
const bTour3 = newBulletRef();
const bPrice1 = newBulletRef();
const bPrice2 = newBulletRef();
const bPrice3 = newBulletRef();
const bPrice4 = newBulletRef();
const bPrice5 = newBulletRef();
const bBook1 = newBulletRef();
const bBook2 = newBulletRef();
const bBook3 = newBulletRef();
const bComm1 = newBulletRef();
const bComm2 = newBulletRef();
const bComm3 = newBulletRef();
const bSet1 = newBulletRef();
const bSet2 = newBulletRef();
const bSet3 = newBulletRef();
const bSet4 = newBulletRef();

const section4 = [
  h1("4. Feature Specifications"),

  // 4.1 Authentication & Authorization
  h2("4.1 Authentication & Authorization"),
  h3("Login Page"),
  bodyPara([bodyRun("The login page features a split-panel design with a decorative left panel and a centered login form on the right. Key implementation details include:")]),
  bullet("Split-panel layout: Left panel with branded visual design; right panel with centered login form.", bAuthLogin),
  bullet("Demo credentials: Pre-filled username/password for demonstration purposes.", bAuthLogin),
  bullet("Password visibility toggle: Eye icon to show/hide password field content.", bAuthLogin),
  bullet("Loading state: Spinner animation during authentication API call.", bAuthLogin),
  bullet("Error handling: Inline error message display for invalid credentials.", bAuthLogin),
  bodyPara([bodyRun("Authentication is powered by NextAuth.js with bcryptjs password hashing and JWT-based sessions stored in HTTP-only cookies.")]),

  h3("RBAC System"),
  bodyPara([bodyRun("The system implements Role-Based Access Control with five distinct roles, each governing feature access and data visibility:")]),
  ...makeTable(
    ["Role", "Access Level", "Description"],
    [
      ["Admin", "Full Access", "Complete system control: user management, settings, data sync, all features"],
      ["Manager", "High Access", "Tour management, bookings, analytics, communications; limited settings"],
      ["Operations", "Standard Access", "Tour details, bookings, communications; read-only analytics"],
      ["Finance", "Financial Access", "Full analytics and bookings; limited tour editing; no user management"],
      ["Viewer", "Read-Only", "View-only access across all modules; no edit capabilities"],
    ],
    [1800, 2000, 5560],
    "Table 4: User Roles and Access Levels",
  ),

  // 4.2 Dashboard
  h2("4.2 Dashboard"),
  h3("KPI Cards"),
  bodyPara([bodyRun("The dashboard displays six key performance indicator cards in a responsive grid layout:")]),
  bullet("Total Tours: Aggregate count of all tours in the system across all marketplaces.", bDashKPI),
  bullet("Sheet Bookings: Total number of bookings imported from Google Sheets.", bDashKPI),
  bullet("Sheet Revenue: Total revenue figure calculated from imported booking data.", bDashKPI),
  bullet("Avg Website Price: Average tour price across all Website listings.", bDashKPI),
  bullet("Avg Supplier Cost: Average supplier cost per tour across all tours.", bDashKPI),
  bullet("Tours with Price: Count of tours that have pricing information available.", bDashKPI),

  h3("Charts and Visualizations"),
  bodyPara([bodyRun("The dashboard includes four interactive charts for operational visibility:")]),
  bullet("Tours by Destination (BarChart): Horizontal bar chart showing tour distribution by destination city.", bDashChart),
  bullet("Marketplace Distribution (PieChart): Pie chart showing the proportion of tours listed on each of the 7 marketplaces.", bDashChart),
  bullet("Top Performing Tours (Table): Data table displaying the highest-revenue tours with name, destination, revenue, and booking count.", bDashChart),
  bullet("Category Breakdown (BarChart): Bar chart showing tour distribution by category (Adventure, Cultural, Nature, etc.).", bDashChart),

  h3("Marketplace Coverage"),
  bodyPara([bodyRun("A dedicated section shows listing coverage across all seven marketplaces with progress bars indicating the percentage of tours listed on each platform:")]),
  bullet("Website, Ctrip, Viator, Klook, Expedition, Headout, Civitatis.", bDashMarket),
  bullet("Each progress bar shows listing count and percentage relative to total tours.", bDashMarket),

  h3("Availability Overview"),
  bodyPara([bodyRun("A summary section categorizing tours by availability type:")]),
  bullet("Every Day: Tours available daily.", bDashMarket),
  bullet("Specific Days: Tours available on selected days of the week.", bDashMarket),
  bullet("Ask Availability: Tours requiring availability confirmation.", bDashMarket),

  h3("Auto-Refresh"),
  bodyPara([bodyRun("The dashboard automatically refreshes all KPI data and charts every 60 seconds, ensuring operators always see near-real-time operational metrics without manual page reloads.")]),

  // 4.3 Tour Management
  h2("4.3 Tour Management"),
  h3("Data Table"),
  bodyPara([bodyRun("The tour management module features a comprehensive data table with 12 columns: Tour Name, Destination, Category, Status, Website Price, Ctrip Price, Viator Price, Klook Price, Expedition Price, Civitatis Price, Headout Price, and Availability. On mobile viewports, the table transforms into a responsive card view for touch-friendly browsing.")]),

  h3("Advanced Filtering"),
  bodyPara([bodyRun("A rich filter panel enables operators to quickly find specific tours:")]),
  bullet("Text Search: Full-text search across tour name and destination fields.", bTour1),
  bullet("Destination Filter: Dropdown selection to filter by destination city.", bTour1),
  bullet("Category Filter: Dropdown to filter by tour category.", bTour1),
  bullet("Status Filter: Active, Inactive, or Draft status selection.", bTour1),
  bullet("Availability Filter: Every Day, Specific Days, or Ask Availability.", bTour1),
  bullet("Marketplace Checkboxes: 7 individual checkboxes to filter tours listed (or not) on each marketplace.", bTour1),
  bullet("URL Parameter Sync: All filter state is synchronized with URL search parameters, enabling shareable filter links.", bTour1),

  h3("Pagination and Sorting"),
  bodyPara([bodyRun("The table supports configurable pagination with 25, 50, or 100 rows per page. Multi-field sorting allows operators to click column headers to sort ascending or descending by any visible field.")]),

  h3("Tour Detail Sheet"),
  bodyPara([bodyRun("Clicking a tour opens a side Sheet panel containing:")]),
  bullet("Marketplace Links: Direct hyperlinks to the tour listing on each of the 7 marketplaces.", bTour2),
  bullet("Pricing Comparison Table: Side-by-side price comparison across all marketplaces.", bTour2),
  bullet("Inclusions: Tour inclusion details and what is covered in the package.", bTour2),
  bullet("Supplier Information: Supplier name, contact, and cost details.", bTour2),
  bullet("Booking and Revenue Stats: Historical booking count and revenue figures.", bTour2),

  h3("Inline Editing"),
  bodyPara([bodyRun("All tour fields support inline editing directly from the data table or detail sheet, including tour name, marketplace prices, status, category, availability, and supplier information. Changes are persisted immediately via API calls.")]),

  h3("Stats Summary Bar"),
  bodyPara([bodyRun("A persistent summary bar displays key tour statistics:")]),
  bullet("Total Tours: Complete count of all tours.", bTour3),
  bullet("Active Tours: Count of tours with active status.", bTour3),
  bullet("Ctrip Listings: Number of tours listed on Ctrip.", bTour3),
  bullet("Viator Listings: Number of tours listed on Viator.", bTour3),

  // 4.4 Pricing Analytics
  h2("4.4 Pricing Analytics"),
  bodyPara([bodyRun("The pricing analytics module is organized into five tabs, each providing a different lens into pricing data:")]),

  h3("Tab 1: Overview"),
  bullet("Stat cards: Key pricing metrics including average price, median price, price range, and standard deviation.", bPrice1),
  bullet("Price Range Distribution: Histogram showing the distribution of tour prices across defined price brackets.", bPrice1),
  bullet("Average Price by Marketplace: Bar chart comparing average tour prices across all 7 marketplaces.", bPrice1),

  h3("Tab 2: Comparison"),
  bullet("Price Comparison Matrix: Sortable and filterable table showing every tour's price across all marketplaces with color-coded highlighting for the lowest and highest prices.", bPrice2),
  bullet("Price Range Analysis: Visual breakdown of price ranges showing minimum, maximum, and average prices per marketplace.", bPrice2),

  h3("Tab 3: Trends"),
  bullet("Price Variance Analysis: Chart showing price variation between Website prices and each marketplace.", bPrice3),
  bullet("Website vs Marketplace Scatter Plot: Scatter plot visualizing the relationship between Website base prices and marketplace-listed prices.", bPrice3),

  h3("Tab 4: Distribution"),
  bullet("Category Price Spread: Box plot or range chart showing price distribution within each tour category.", bPrice4),
  bullet("Destination Price Spread: Similar distribution analysis grouped by destination city.", bPrice4),

  h3("Tab 5: Gaps"),
  bullet("Coverage Analysis: Summary of which tours are missing from which marketplaces, enabling operators to identify listing gaps.", bPrice5),
  bullet("Discrepancy Alerts: Automated alerts for tours where marketplace prices undercut the Website price by more than 20% or where the supplier cost exceeds the selling price (loss detection).", bPrice5),

  // 4.5 Bookings & Revenue
  h2("4.5 Bookings & Revenue"),
  h3("Revenue Summary"),
  bodyPara([bodyRun("Seven summary cards provide at-a-glance financial metrics:")]),
  bullet("Total Revenue: Aggregate revenue across all bookings.", bBook1),
  bullet("Total Profit: Revenue minus supplier costs across all bookings.", bBook1),
  bullet("Average Order Value: Mean booking value across all completed orders.", bBook1),
  bullet("Booking Count: Total number of booking records.", bBook1),
  bullet("Top Marketplace: Marketplace generating the highest revenue.", bBook1),
  bullet("This Month: Revenue and booking metrics for the current calendar month.", bBook1),
  bullet("Month-over-Month Trend: Percentage change in revenue compared to the previous month.", bBook1),

  h3("Charts"),
  bodyPara([bodyRun("Five charts visualize revenue data from different perspectives:")]),
  bullet("Revenue Over Time: Line or area chart showing revenue trends over time.", bBook2),
  bullet("Revenue by Marketplace: Pie or bar chart breaking down revenue by marketplace.", bBook2),
  bullet("Revenue by Destination: Bar chart showing revenue contribution by destination city.", bBook2),
  bullet("Revenue by Category: Bar chart showing revenue by tour category.", bBook2),
  bullet("Profit vs Supplier Cost: Dual-axis chart comparing profit margins against supplier costs.", bBook2),

  h3("Bookings Table"),
  bodyPara([bodyRun("A comprehensive bookings table with filtering capabilities:")]),
  bullet("Search: Filter by customer name or booking reference.", bBook3),
  bullet("Status Filter: Confirmed, Pending, Cancelled, or Completed.", bBook3),
  bullet("Marketplace Filter: Filter by source marketplace.", bBook3),
  bullet("Destination Filter: Filter by tour destination.", bBook3),
  bullet("Date Range: Filter bookings by booking date or tour date range.", bBook3),
  bullet("CSV Export: Export filtered or all bookings to CSV format.", bBook3),
  bullet("Pagination: Configurable page sizes for browsing large booking datasets.", bBook3),

  h3("New Booking Dialog"),
  bodyPara([bodyRun("A modal dialog for creating new bookings with the following fields:")]),
  bullet("Tour Selection: Dropdown to select from available tours.", bBook3),
  bullet("Customer Information: Name, email, and phone fields.", bBook3),
  bullet("Pricing: Marketplace selection, adult/child count, with auto-calculated totals.", bBook3),
  bullet("Computed Profit: Automatically calculated profit based on tour price and supplier cost.", bBook3),

  // 4.6 Communications
  h2("4.6 Communications"),
  h3("Compose Panel"),
  bodyPara([bodyRun("The communications module features a compose panel for creating and sending messages:")]),
  bullet("Recipient Selector: Multi-select dropdown to choose one or more recipients.", bComm1),
  bullet("Channel Selector: Choose delivery channel from WhatsApp, Email, WeChat, or In-App.", bComm1),
  bullet("Type Selector: Notification type\u2014Info, Warning, Alert, or Success.", bComm1),
  bullet("Priority Selector: Normal, High, or Urgent priority levels.", bComm1),
  bullet("Message Body: Rich text area for composing the notification content.", bComm1),

  h3("Notification Feed"),
  bodyPara([bodyRun("A real-time notification feed displays all messages with three tabs:")]),
  bullet("All: Complete list of all notifications.", bComm2),
  bullet("Unread: Only unread notifications, highlighted for visibility.", bComm2),
  bullet("Read: Previously read notifications.", bComm2),
  bodyPara([bodyRun("Users can mark individual notifications as read or use a \"Mark All as Read\" action to clear the entire unread queue.")]),

  h3("Message Templates"),
  bodyPara([bodyRun("Four pre-built message templates are available for quick composition:")]),
  bullet("System Notice: General system announcements and maintenance notifications.", bComm3),
  bullet("Price Update: Notifications for tour price changes across marketplaces.", bComm3),
  bullet("New Tour: Announcements for newly added tours or listings.", bComm3),
  bullet("Cancellation: Booking cancellation notices and follow-up communications.", bComm3),

  h3("Communication Stats"),
  bodyPara([bodyRun("Four stats cards provide communication overview metrics:")]),
  bullet("Total: Total number of notifications in the system.", bComm3),
  bullet("Unread: Count of unread notifications across all users.", bComm3),
  bullet("Active Users: Number of users with recent activity.", bComm3),
  bullet("WhatsApp: Count of WhatsApp-delivered notifications.", bComm3),

  // 4.7 Settings
  h2("4.7 Settings"),
  h3("User Management Tab"),
  bodyPara([bodyRun("Administrators can manage all system users through this tab:")]),
  bullet("Add User: Create new user accounts with name, email, password, and role assignment.", bSet1),
  bullet("Edit User: Modify existing user details including role changes and status updates.", bSet1),
  bullet("Deactivate User: Soft-deactivate users by setting isActive to false, preventing login without data loss.", bSet1),
  bullet("User Table: Display all users with name, email, role, status, and last login timestamp.", bSet1),
  bullet("Role Descriptions: Inline reference describing each role's permissions and access level.", bSet1),

  h3("Data Sync Tab"),
  bodyPara([bodyRun("Manage Google Sheets integration for tour data import:")]),
  bullet("Google Sheets URL: Input field to provide the published Google Sheets URL for import.", bSet2),
  bullet("Sync History: Table showing past sync operations with status, row counts, timestamps, and error messages.", bSet2),
  bullet("Sync Stats: Summary cards showing total syncs, successful imports, and total rows processed.", bSet2),
  bullet("Manual Trigger: Button to initiate an immediate sync operation.", bSet2),

  h3("System Tab"),
  bodyPara([bodyRun("System-wide configuration options:")]),
  bullet("Currency: Set the default currency for pricing display (e.g., USD, EUR, AED).", bSet3),
  bullet("Date Format: Configure the date display format (e.g., DD/MM/YYYY, MM/DD/YYYY).", bSet3),
  bullet("Notification Preferences: Enable or disable notification channels and configure delivery preferences.", bSet3),

  h3("Profile Tab"),
  bodyPara([bodyRun("Users can manage their own profile settings:")]),
  bullet("Edit Profile: Update name, email, phone, department, and avatar.", bSet4),
  bullet("Change Password: Secure password change form with current password verification.", bSet4),
  bullet("Activity Log: View recent actions performed by the current user.", bSet4),
];

// --- 5. User Roles & Permissions ---
const section5 = [
  h1("5. User Roles & Permissions"),
  bodyPara([bodyRun("The following matrix details feature-level access permissions for each role. Access is enforced at both the API route level and the UI component level to ensure security.")]),
  ...makeTable(
    ["Feature", "Admin", "Manager", "Operations", "Finance", "Viewer"],
    [
      ["Dashboard (Full)", "Full", "Full", "Full", "Full", "Full"],
      ["Dashboard (Edit Config)", "Yes", "No", "No", "No", "No"],
      ["Tour Management", "Full", "Full", "Edit", "Read", "Read"],
      ["Tour Inline Editing", "Yes", "Yes", "Yes", "Limited", "No"],
      ["Tour Status Changes", "Yes", "Yes", "Yes", "No", "No"],
      ["Pricing Analytics", "Full", "Full", "Read", "Full", "Read"],
      ["Bookings & Revenue", "Full", "Full", "Edit", "Full", "Read"],
      ["Create New Booking", "Yes", "Yes", "Yes", "Yes", "No"],
      ["CSV Export", "Yes", "Yes", "Yes", "Yes", "No"],
      ["Communications", "Full", "Full", "Full", "Read", "Read"],
      ["Send Messages", "Yes", "Yes", "Yes", "No", "No"],
      ["Settings - User Management", "Full", "No", "No", "No", "No"],
      ["Settings - Data Sync", "Full", "No", "No", "No", "No"],
      ["Settings - System Config", "Full", "No", "No", "No", "No"],
      ["Settings - Profile", "Full", "Full", "Full", "Full", "Full"],
    ],
    [2400, 1392, 1392, 1392, 1392, 1392],
    "Table 5: Feature-Level Permission Matrix",
  ),
];

// --- 6. Database Models ---
const section6 = [
  h1("6. Database Models"),
  bodyPara([bodyRun("Tripventura uses Prisma ORM with SQLite as the database engine. The following sections detail each database model, its fields, types, and relationships.")]),

  h2("6.1 User Model"),
  ...makeTable(
    ["Field", "Type", "Constraints", "Description"],
    [
      ["id", "String", "PK, cuid", "Unique user identifier"],
      ["email", "String", "Unique", "User login email"],
      ["password", "String", "-", "Bcrypt-hashed password"],
      ["name", "String", "-", "Full display name"],
      ["role", "String", "Default: viewer", "RBAC role assignment"],
      ["avatar", "String", "Optional", "Profile image URL"],
      ["phone", "String", "Optional", "Contact phone number"],
      ["department", "String", "Optional", "Department assignment"],
      ["isActive", "Boolean", "Default: true", "Account active status"],
      ["lastLogin", "DateTime", "Optional", "Last successful login"],
      ["createdAt", "DateTime", "Auto (now)", "Account creation timestamp"],
      ["updatedAt", "DateTime", "Auto (updatedAt)", "Last modification timestamp"],
    ],
    [1800, 1600, 2200, 3760],
    "Table 6: User Model Schema",
  ),

  h2("6.2 Tour Model"),
  ...makeTable(
    ["Field", "Type", "Constraints", "Description"],
    [
      ["id", "String", "PK, cuid", "Unique tour identifier"],
      ["tourName", "String", "-", "Display name of the tour"],
      ["websiteLink", "String", "Optional", "Direct link to website listing"],
      ["tourLinkCtrip", "String", "Optional", "Link to Ctrip listing"],
      ["tourLinkViator", "String", "Optional", "Link to Viator listing"],
      ["tourLinkHeadout", "String", "Optional", "Link to Headout listing"],
      ["tourLinkKlook", "String", "Optional", "Link to Klook listing"],
      ["tourLinkExpedition", "String", "Optional", "Link to Expedition listing"],
      ["tourLinkCivitatis", "String", "Optional", "Link to Civitatis listing"],
      ["destinationCity", "String", "-", "Tour destination city"],
      ["supplierPriceAdult", "String", "Optional", "Adult supplier cost"],
      ["supplierPriceChild", "String", "Optional", "Child supplier cost"],
      ["availabilityDay", "String", "Optional", "Availability schedule"],
      ["inclusion", "String", "Optional", "Tour inclusions description"],
      ["supplierInfo", "String", "Optional", "Supplier contact details"],
      ["websitePrice", "String", "Optional", "Website listing price"],
      ["ctripPrice", "String", "Optional", "Ctrip listing price"],
      ["viatorPrice", "String", "Optional", "Viator listing price"],
      ["klookPrice", "String", "Optional", "Klook listing price"],
      ["expeditionPrice", "String", "Optional", "Expedition listing price"],
      ["civitatisPrice", "String", "Optional", "Civitatis listing price"],
      ["headoutPrice", "String", "Optional", "Headout listing price"],
      ["bookings", "Int", "Default: 0", "Total booking count"],
      ["revenue", "String", "Optional", "Total revenue generated"],
      ["category", "String", "Optional", "Tour category"],
      ["status", "String", "Default: active", "Tour status (active/inactive/draft)"],
      ["rating", "Float", "Optional", "Tour rating score"],
      ["sheetRow", "Int", "Optional", "Google Sheets source row"],
    ],
    [2200, 1400, 1800, 3960],
    "Table 7: Tour Model Schema",
  ),

  h2("6.3 Booking Model"),
  ...makeTable(
    ["Field", "Type", "Constraints", "Description"],
    [
      ["id", "String", "PK, cuid", "Unique booking identifier"],
      ["tourId", "String", "FK to Tour", "Associated tour reference"],
      ["userId", "String", "FK to User (Optional)", "Booking creator"],
      ["customerName", "String", "-", "Customer full name"],
      ["customerEmail", "String", "Optional", "Customer email address"],
      ["customerPhone", "String", "Optional", "Customer phone number"],
      ["marketplace", "String", "Optional", "Source marketplace"],
      ["adults", "Int", "Default: 1", "Number of adult passengers"],
      ["children", "Int", "Default: 0", "Number of child passengers"],
      ["totalPrice", "Float", "-", "Total booking price"],
      ["supplierCost", "Float", "Optional", "Supplier cost for booking"],
      ["profit", "Float", "Optional", "Computed profit margin"],
      ["bookingDate", "DateTime", "Default: now", "Booking creation date"],
      ["tourDate", "DateTime", "Optional", "Scheduled tour date"],
      ["status", "String", "Default: confirmed", "Booking status"],
      ["notes", "String", "Optional", "Additional booking notes"],
    ],
    [2200, 1400, 2200, 3560],
    "Table 8: Booking Model Schema",
  ),

  h2("6.4 Notification Model"),
  ...makeTable(
    ["Field", "Type", "Constraints", "Description"],
    [
      ["id", "String", "PK, cuid", "Unique notification identifier"],
      ["userId", "String", "FK to User", "Notification recipient"],
      ["title", "String", "-", "Notification title"],
      ["message", "String", "-", "Notification body text"],
      ["type", "String", "Default: info", "Type (info/warning/alert/success)"],
      ["channel", "String", "Optional", "Delivery channel"],
      ["isRead", "Boolean", "Default: false", "Read status flag"],
      ["link", "String", "Optional", "Related resource link"],
    ],
    [2000, 1600, 2200, 3560],
    "Table 9: Notification Model Schema",
  ),

  h2("6.5 Activity Model"),
  ...makeTable(
    ["Field", "Type", "Constraints", "Description"],
    [
      ["id", "String", "PK, cuid", "Unique activity identifier"],
      ["userId", "String", "FK to User", "User who performed action"],
      ["action", "String", "-", "Action type identifier"],
      ["description", "String", "-", "Human-readable description"],
      ["metadata", "String", "Optional (JSON)", "Additional structured data"],
    ],
    [2000, 1600, 2400, 3360],
    "Table 10: Activity Model Schema",
  ),

  h2("6.6 SyncLog Model"),
  ...makeTable(
    ["Field", "Type", "Constraints", "Description"],
    [
      ["id", "String", "PK, cuid", "Unique sync log identifier"],
      ["sheetUrl", "String", "-", "Source Google Sheets URL"],
      ["status", "String", "Default: pending", "Sync status"],
      ["totalRows", "Int", "Default: 0", "Total rows in source sheet"],
      ["importedRows", "Int", "Default: 0", "Successfully imported rows"],
      ["error", "String", "Optional", "Error message if failed"],
      ["startedAt", "DateTime", "Default: now", "Sync start timestamp"],
      ["completedAt", "DateTime", "Optional", "Sync completion timestamp"],
    ],
    [2000, 1600, 2200, 3560],
    "Table 11: SyncLog Model Schema",
  ),

  h2("6.7 DashboardConfig Model"),
  ...makeTable(
    ["Field", "Type", "Constraints", "Description"],
    [
      ["id", "String", "PK, cuid", "Unique config identifier"],
      ["key", "String", "Unique", "Configuration key name"],
      ["value", "String", "-", "Configuration value (JSON)"],
      ["updatedAt", "DateTime", "Auto (updatedAt)", "Last update timestamp"],
    ],
    [2000, 1600, 2000, 3760],
    "Table 12: DashboardConfig Model Schema",
  ),
];

// --- 7. Non-Functional Requirements ---
const bPerf = newBulletRef();
const bSec = newBulletRef();
const bAcc = newBulletRef();
const bResp = newBulletRef();
const section7 = [
  h1("7. Non-Functional Requirements"),
  h2("7.1 Performance"),
  bullet("Page Load Time: Initial page load under 2 seconds on 4G connections.", bPerf),
  bullet("API Response Time: All API endpoints respond within 500ms for standard queries.", bPerf),
  bullet("Dashboard Refresh: KPI data auto-refreshes every 60 seconds with background polling.", bPerf),
  bullet("Data Table Performance: Smooth rendering of 100+ rows with virtual scrolling considerations.", bPerf),
  bullet("Database Optimization: Prisma query optimization with selective field loading and proper indexing.", bPerf),

  h2("7.2 Security"),
  bullet("Authentication: bcryptjs password hashing with salt rounds for secure credential storage.", bSec),
  bullet("Session Management: HTTP-only, secure cookies for JWT session tokens.", bSec),
  bullet("API Authorization: Role-based middleware validates permissions on every API request.", bSec),
  bullet("Input Validation: Zod schemas validate all API inputs to prevent injection attacks.", bSec),
  bullet("Password Protection: Password visibility toggle only on client-side; server always receives hashed values.", bSec),
  bullet("Data Isolation: Users can only access data permitted by their assigned role.", bSec),

  h2("7.3 Accessibility"),
  bullet("Semantic HTML: Proper use of heading hierarchy, landmark regions, and ARIA attributes.", bAcc),
  bullet("Keyboard Navigation: All interactive elements are accessible via keyboard (Tab, Enter, Escape).", bAcc),
  bullet("Color Contrast: Minimum WCAG 2.1 AA contrast ratios across all UI components.", bAcc),
  bullet("Screen Reader Support: Proper aria-labels and roles on custom components.", bAcc),
  bullet("Focus Management: Visible focus indicators and proper focus trapping in modals and sheets.", bAcc),

  h2("7.4 Responsive Design"),
  bullet("Breakpoints: Mobile-first design with breakpoints at sm (640px), md (768px), lg (1024px), and xl (1280px).", bResp),
  bullet("Mobile Optimization: Data tables transform to card views on mobile; sidebar collapses to a drawer.", bResp),
  bullet("Touch Targets: Minimum 44px touch targets for all interactive elements on mobile devices.", bResp),
  bullet("Fluid Layouts: Flexible grid and spacing that adapt to various screen sizes without horizontal scrolling.", bResp),
];

// --- 8. Future Roadmap ---
const bRoad = newBulletRef();
const section8 = [
  h1("8. Future Roadmap"),
  bodyPara([bodyRun("The following features and enhancements are planned for future releases of the Tripventura platform:")]),

  h2("8.1 Short-Term (Q3-Q4 2025)"),
  bullet("Multi-Language Support: i18n integration with next-intl for English, Chinese, Spanish, and Arabic.", bRoad),
  bullet("Advanced Reporting: Custom report builder with exportable PDF and Excel formats.", bRoad),
  bullet("Booking Calendar: Visual calendar view for booking management and scheduling.", bRoad),
  bullet("Mobile App: React Native companion app for on-the-go operations management.", bRoad),

  h2("8.2 Medium-Term (Q1-Q2 2026)"),
  bullet("Marketplace API Integration: Direct API connections to Ctrip, Viator, Klook for automated listing sync.", bRoad),
  bullet("Customer Relationship Management (CRM): Built-in CRM for customer lifecycle management.", bRoad),
  bullet("Inventory Management: Real-time seat and availability tracking across marketplaces.", bRoad),
  bullet("Automated Pricing Engine: AI-driven dynamic pricing recommendations based on market demand.", bRoad),

  h2("8.3 Long-Term (H2 2026+)"),
  bullet("Multi-Tenant Architecture: Support for multiple tour operator companies on a single platform.", bRoad),
  bullet("Analytics Dashboard 2.0: Advanced predictive analytics with machine learning models.", bRoad),
  bullet("Supplier Portal: Self-service portal for suppliers to update availability and pricing.", bRoad),
  bullet("White-Label Solution: Customizable branding for enterprise clients.", bRoad),
  bullet("Global Marketplace Expansion: Support for 20+ additional travel marketplaces and OTAs.", bRoad),
];

// ═══════════════════════════════════════════════════════════
// BUILD DOCUMENT
// ═══════════════════════════════════════════════════════════
const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 22, color: c.body } },
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, color: c.primary, font: "Times New Roman" },
        paragraph: { spacing: { before: 600, after: 300, line: 250 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, color: c.primary, font: "Times New Roman" },
        paragraph: { spacing: { before: 400, after: 200, line: 250 }, outlineLevel: 1 },
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, color: c.body, font: "Times New Roman" },
        paragraph: { spacing: { before: 300, after: 150, line: 250 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: { config: [...bulletConfigs, ...numConfigs] },
  sections: [
    coverSection as any,
    tocSection as any,
    {
      properties: {
        page: {
          margin: { top: 1800, bottom: 1440, left: 1440, right: 1440 },
          size: { width: 11906, height: 16838 },
          pageNumbers: { start: 1 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 0, line: 250 },
            children: [
              new TextRun({ text: "Tripventura", font: "Times New Roman", size: 20, bold: true, color: c.brandRed }),
              new TextRun({ text: "  |  Product Requirements Document v1.0", font: "Calibri", size: 18, color: c.accent }),
            ],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, line: 250 },
            children: [
              new TextRun({ text: "Page ", font: "Calibri", size: 18, color: c.accent }),
              new TextRun({ children: [PageNumber.CURRENT], font: "Calibri", size: 18, color: c.accent }),
              new TextRun({ text: " of ", font: "Calibri", size: 18, color: c.accent }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Calibri", size: 18, color: c.accent }),
            ],
          })],
        }),
      },
      children: [
        ...section1,
        ...section2,
        ...section3,
        ...section4,
        ...section5,
        ...section6,
        ...section7,
        ...section8,
      ],
    },
  ],
});

// ═══════════════════════════════════════════════════════════
// WRITE FILE
// ═══════════════════════════════════════════════════════════
const OUTPUT = "/home/z/my-project/download/Tripventura_PRD.docx";
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(OUTPUT, buffer);
  console.log("Document generated successfully:", OUTPUT);
});
