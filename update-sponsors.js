require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('./src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

(async () => {
  const connectionString = process.env.DATABASE_URL || '';
  const isRDS = connectionString.includes('rds.amazonaws.com');
  if (isRDS) process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const pool = new pg.Pool({
    connectionString,
    ssl: isRDS ? { rejectUnauthorized: false } : undefined,
    max: 2,
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const comp = await prisma.competition.findFirst();
  if (!comp) { console.log('No competition found'); process.exit(1); }
  const pc = comp.pageContent || {};

  pc.titleSponsorPrice = '\u20B97,50,000';
  pc.titleSponsorBenefits = 'Event named \u201cpowered by [Sponsor]\u201d, Exclusive category rights \u2014 no competitors in your industry, Logo on stage backdrop & all banners, 5\u201310 min keynote speech + closing ceremony address, Dedicated hiring zone at venue, Jury panel seat in finals, Premium branding across website & all media (press reels banners), Media coverage & press release mention, Premium startup exhibition booth, Direct access to top startups & talent pipeline';

  pc.presentingSponsorPrice = '\u20B95,00,000';
  pc.presentingSponsorBenefits = 'Co-host branding \u2014 not just a logo full event co-presentation, Sponsored challenge track (e.g. \u201cAI Challenge powered by [You]\u201d), Logo on stage backdrop & event banners, 5 min keynote slot, Premium branding on website & social media, Media coverage & press mention, VIP booth at startup exhibition, Networking access with top founders';

  pc.diamondSponsorPrice = '\u20B93,50,000';
  pc.diamondSponsorBenefits = 'Access to live startup pitching sessions, Investor roundtable invite with top founders, Lead capture system (QR code / digital cards), Logo on event banners and stage, Featured website section with company profile, Social media promotion across all channels, Premium exhibition booth, VIP networking access, Award ceremony mention & brand visibility';

  await prisma.competition.update({ where: { id: comp.id }, data: { pageContent: pc } });
  console.log('Updated pageContent successfully');
  await pool.end();
})();
