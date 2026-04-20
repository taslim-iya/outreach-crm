export function buildWebsitePrompt(config: {
  businessName: string;
  category: string;
  phone: string;
  email: string;
  address: string;
  style: string;
  accentColor: string;
}): string {
  const { businessName, category, phone, email, address, style, accentColor } = config;
  const location = address?.split(",").pop()?.trim() || "the local area";
  const slug = businessName.toLowerCase().replace(/[^a-z0-9]/g, "");

  // Curated Unsplash photo IDs per category — source.unsplash.com is deprecated,
  // so we use direct images.unsplash.com/photo-{id} URLs which are stable.
  const curatedPhotos: Record<string, [string, string, string, string]> = {
    Restaurant: [
      "photo-1517248135467-4c7edcad34c4", // restaurant interior
      "photo-1504674900247-0877df9cc836", // food plating
      "photo-1556910103-1c02745aae4d", // chef cooking
      "photo-1414235077428-338989a2e8c0", // restaurant dining
    ],
    Plumber: [
      "photo-1585704032915-c3400ca199e7", // plumbing work
      "photo-1552321554-5fefe8c9ef14", // modern bathroom
      "photo-1556909114-f6e7ad7d3136", // kitchen sink
      "photo-1504328345606-18bbc8c9d7d1", // water pipe
    ],
    Electrician: [
      "photo-1621905251189-08b45d6a269e", // electrician work
      "photo-1565814636199-ae8133055c1c", // modern lighting
      "photo-1558002038-1055907df827", // smart home
      "photo-1513828583688-c52646db42da", // electrical panel
    ],
    "Hair Salon": [
      "photo-1560066984-138dadb4c035", // hair salon interior
      "photo-1522337360788-8b13dee7a37e", // hairstyling
      "photo-1521590832167-7bcbfaa6381f", // beauty salon
      "photo-1562322140-8baeececf3df", // hair cutting
    ],
    Dentist: [
      "photo-1629909613654-28e377c37b09", // dental clinic
      "photo-1606811841689-23dfddce3e95", // dentist office
      "photo-1588776814546-1ffcf47267a5", // smile teeth
      "photo-1598256989800-fe5f95da9787", // dental chair
    ],
    Lawyer: [
      "photo-1589829545856-d10d557cf95f", // law office
      "photo-1507679799987-c73779587ccf", // legal books
      "photo-1553484771-047a44eee27b", // business meeting
      "photo-1564429238961-2f79813b6279", // courthouse
    ],
    Accountant: [
      "photo-1454165804606-c3d57bc86b40", // office desk
      "photo-1554224155-6726b3ff858f", // financial planning
      "photo-1460925895917-afdab827c52f", // business accounting
      "photo-1554224154-22dec7ec8818", // calculator
    ],
    "Auto Repair": [
      "photo-1619642751034-765dfdf7c58e", // auto mechanic
      "photo-1487754180451-c456f719a1fc", // car repair
      "photo-1580273916550-e323be2ae537", // garage workshop
      "photo-1486262715619-67b85e0b08d3", // car engine
    ],
    "Pet Grooming": [
      "photo-1516734212186-a967f81ad0d7", // dog grooming
      "photo-1601758228041-f3b2795255f1", // pet salon
      "photo-1587300003388-59208cc962cb", // cute dog
      "photo-1548199973-03cce0bbc87b", // pet care
    ],
    Bakery: [
      "photo-1509440159596-0249088772ff", // bakery bread
      "photo-1517433670267-08bbd4be890f", // pastry display
      "photo-1486427944344-5a2276a72c2b", // fresh baking
      "photo-1549931319-a545753467c8", // artisan bread
    ],
    Florist: [
      "photo-1487530811176-3780de880c2d", // flower shop
      "photo-1490750967868-88aa4f44baee", // bouquet roses
      "photo-1561181286-d3fee7d55364", // floral arrangement
      "photo-1508610048659-a06b669e3321", // flower display
    ],
    "Dry Cleaning": [
      "photo-1545173168-9f1947eebb7f", // laundry service
      "photo-1558618666-fcd25c85f82e", // clothes hanging
      "photo-1489274495757-95c7c837b101", // iron pressing
      "photo-1558171813-4c088753af8f", // clean shirts
    ],
    Gym: [
      "photo-1534438327276-14e5300c3a48", // gym interior
      "photo-1571019614242-c5c5dee9f50b", // fitness training
      "photo-1526506118085-60ce8714f8c5", // weight lifting
      "photo-1517836357463-d25dfeac3438", // workout
    ],
    Spa: [
      "photo-1540555700478-4be289fbec6e", // spa treatment
      "photo-1544161515-4ab6ce6db874", // massage therapy
      "photo-1507652313519-d4e9174996dd", // wellness candle
      "photo-1600334129128-685c5582fd35", // relaxation
    ],
    Photographer: [
      "photo-1471341971476-ae15ff5dd4ea", // photography studio
      "photo-1502920917128-1aa500764cbd", // camera lens
      "photo-1554048612-b6a482bc67e5", // portrait photo
      "photo-1542038784456-1ea8df82b6ae", // photo shoot
    ],
    Landscaping: [
      "photo-1558904541-efa843a96f01", // garden landscaping
      "photo-1592417817098-8fd3d9eb14a5", // lawn care
      "photo-1585320806297-9794b3e4eeae", // beautiful garden
      "photo-1598902108854-d6ee57d5c8c0", // outdoor design
    ],
    Roofing: [
      "photo-1632759145351-1d592919f522", // roofing work
      "photo-1570129477492-45c003edd2be", // house roof
      "photo-1504307651254-35680f356dfd", // construction worker
      "photo-1486406146926-c627a92ad1ab", // building exterior
    ],
    HVAC: [
      "photo-1585771724684-38269d6639fd", // air conditioning
      "photo-1621905252507-b35492cc74b4", // hvac system
      "photo-1581094794329-c8112a89af12", // heating repair
      "photo-1558618666-fcd25c85f82e", // ventilation
    ],
    "Real Estate Agent": [
      "photo-1564013799919-ab600027ffc6", // modern house
      "photo-1560518883-ce09059eeffa", // real estate
      "photo-1502672260266-1c1ef2d93688", // property interior
      "photo-1449844908441-8829872d2607", // house exterior
    ],
    "Cleaning Service": [
      "photo-1581578731548-c64695cc6952", // house cleaning
      "photo-1556909114-f6e7ad7d3136", // clean kitchen
      "photo-1527515637462-cee1395c5c67", // mop floor
      "photo-1584622650111-993a426fbf0a", // tidy room
    ],
    "Tattoo Studio": [
      "photo-1611501275019-9b5cda994e8d", // tattoo art
      "photo-1598371839696-5c5bb1fed6d2", // tattoo studio
      "photo-1542556398-95fb5b9f9304", // body art
      "photo-1565058379802-bbe93b2f703a", // tattoo machine
    ],
    Barber: [
      "photo-1503951914875-452162b0f3f1", // barber shop
      "photo-1599351431202-1e0f0137899a", // mens haircut
      "photo-1585747860019-f4376e97027c", // barber chair
      "photo-1621607505837-5765482e5876", // shaving
    ],
  };

  const fallbackPhotos: [string, string, string, string] = [
    "photo-1497366216548-37526070297c", // business professional
    "photo-1497366811353-6870744d04b2", // office modern
    "photo-1522071820081-009f0129c71c", // team work
    "photo-1556742049-0cfed4f6a45d", // customer service
  ];

  const photos = curatedPhotos[category] || fallbackPhotos;

  const heroImg = `https://images.unsplash.com/${photos[0]}?w=1600&h=900&fit=crop&auto=format`;
  const sectionImg1 = `https://images.unsplash.com/${photos[1]}?w=800&h=600&fit=crop&auto=format`;
  const sectionImg2 = `https://images.unsplash.com/${photos[2]}?w=800&h=600&fit=crop&auto=format`;
  const sectionImg3 = `https://images.unsplash.com/${photos[3]}?w=800&h=600&fit=crop&auto=format`;

  return `Generate a STUNNING, award-winning single-page HTML website for "${businessName}" — a ${category.toLowerCase()} business in ${location}.

THIS MUST LOOK LIKE A REAL £5,000+ PROFESSIONAL WEBSITE. Not a template. Not basic. Premium.

CRITICAL DESIGN RULES:
- Use these REAL Unsplash images (they work, use them as-is):
  Hero: ${heroImg}
  Section 1: ${sectionImg1}
  Section 2: ${sectionImg2}
  Section 3: ${sectionImg3}
- Primary accent color: ${accentColor}
- Style: ${style}
- Google Fonts via @import: Use 'Inter' for body, pick a premium display font (Playfair Display for elegant, Space Grotesk for modern, Sora for bold, DM Sans for minimal)
- ALL CSS embedded in <style> tags
- Fully responsive (mobile breakpoints at 768px and 480px)

REQUIRED SECTIONS (in order):
1. NAVIGATION: Sticky, glass-morphism (backdrop-blur, semi-transparent bg). Logo left, nav links right, CTA button. On scroll, add subtle shadow.

2. HERO SECTION: Full-viewport height. Background image (${heroImg}) with dark overlay gradient. Large bold headline (max 8 words). Subheadline (1 sentence). Two CTA buttons (primary filled + secondary outline). Add subtle parallax or fade-in animation.

3. SERVICES: 2-column or 3-column grid. Each card has an icon (use inline SVG, NOT emoji), title, short description. Cards should have hover effects (lift + shadow). 6 services relevant to ${category}.

4. ABOUT / WHY US: Split layout — image on one side (${sectionImg1}), text on other. Include 3 key stats (e.g., "15+ Years Experience", "500+ Happy Clients", "4.9★ Rating"). Use a counter-style layout.

5. GALLERY / SHOWCASE: Full-width image strip or grid using ${sectionImg2} and ${sectionImg3}. Overlay text on hover.

6. TESTIMONIALS: 3 realistic testimonials with fake names, star ratings (use ★ character), and a subtle card design. Carousel feel or side-by-side.

7. CTA BANNER: Bold accent-colored section. Compelling headline. Phone number: ${phone || "020 1234 5678"}. Big CTA button.

8. CONTACT / FOOTER: Dark background. Address: ${address || "123 High Street, London"}. Email: ${email || `hello@${slug}.co.uk`}. Phone: ${phone || "020 1234 5678"}. Social media icon placeholders (inline SVGs). Copyright line.

ANIMATIONS (use IntersectionObserver in <script>):
- Fade-in-up on scroll for each section
- Smooth scroll for nav links
- Hover transitions on all interactive elements (0.3s ease)
- Hero text should animate in on load (opacity + translateY)

CSS QUALITY REQUIREMENTS:
- Use CSS custom properties for colors
- box-shadow on cards: 0 4px 20px rgba(0,0,0,0.08)
- border-radius: 12-16px on cards
- Generous padding (80px+ section padding on desktop)
- Line-height: 1.6-1.8 for body text
- Letter-spacing on headings
- Image object-fit: cover on all images
- Gradient overlays on image sections

Return ONLY the HTML. No explanation. No markdown fences. Start with <!DOCTYPE html>.
The output should be 500-800 lines of premium HTML+CSS+JS.`;
}
