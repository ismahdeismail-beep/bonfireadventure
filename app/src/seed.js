/**
 * Seed data for the prototype.
 *
 * IMPORTANT: contains no contact details of any kind (ADR-0001). Destination and
 * package names/slugs follow the live site's inventory (see ../../docs/inventory)
 * but prices are modelled properly rather than copied — the live site shows the
 * same placeholder price on every package (finding F-03), which is exactly what
 * R3.1 fixes.
 *
 * Duplicate packages from the live site (F-16) were deliberately NOT recreated.
 */

export const destinations = [
  { slug: 'kenya-north-coast', name: "Kenya's North Coast", region: 'Kenya', tone: 'coast', blurb: 'Reef-sheltered beaches and Swahili heritage north of Mombasa.' },
  { slug: 'mombasa-north-coast', name: 'Mombasa North Coast', region: 'Kenya', tone: 'coast', blurb: 'Beachfront resorts within easy reach of the city and the airport.' },
  { slug: 'diani-ukunda', name: 'Diani / Ukunda', region: 'Kenya', tone: 'coast', blurb: 'Long white-sand beach, colobus monkeys and a calm reef lagoon.' },
  { slug: 'malindi', name: 'Malindi', region: 'Kenya', tone: 'coast', blurb: 'Marine park, historic town and the gateway to Watamu and Kilifi.' },
  { slug: 'maasai-mara', name: 'Maasai Mara', region: 'Kenya', tone: 'safari', blurb: 'Kenya\u2019s flagship reserve and the great migration.' },
  { slug: 'tsavo', name: 'Tsavo', region: 'Kenya', tone: 'safari', blurb: 'Vast red-earth wilderness between Nairobi and the coast.' },
  { slug: 'samburu', name: 'Samburu', region: 'Kenya', tone: 'safari', blurb: 'Semi-arid north with species found nowhere else.' },
  { slug: 'amboseli', name: 'Amboseli', region: 'Kenya', tone: 'safari', blurb: 'Elephants against the backdrop of Kilimanjaro.' },
  { slug: 'nakuru', name: 'Nakuru', region: 'Kenya', tone: 'safari', blurb: 'Rift Valley lake, rhino sanctuary and flamingos.' },
  { slug: 'naivasha', name: 'Naivasha', region: 'Kenya', tone: 'safari', blurb: 'Freshwater lake, boat safaris and crescent island walks.' },
  { slug: 'mount-kenya', name: 'Mount Kenya', region: 'Kenya', tone: 'highland', blurb: 'Alpine moorland, glaciers and highland retreats.' },
  { slug: 'zanzibar', name: 'Zanzibar', region: 'Africa', tone: 'coast', blurb: 'Spice island beaches and Stone Town.' },
  { slug: 'south-africa', name: 'South Africa', region: 'Africa', tone: 'mixed', blurb: 'Cape Town, the Winelands and safari country.' },
  { slug: 'rwanda', name: 'Rwanda', region: 'Africa', tone: 'safari', blurb: 'Volcanoes, gorillas and the land of a thousand hills.' },
  { slug: 'morocco', name: 'Morocco', region: 'Africa', tone: 'mixed', blurb: 'Medinas, the Atlas mountains and desert camps.' },
  { slug: 'mauritius', name: 'Mauritius', region: 'Africa', tone: 'coast', blurb: 'Lagoons, reefs and forested interior.' },
  { slug: 'dubai-uae', name: 'Dubai & Abu Dhabi', region: 'Middle East', tone: 'city', blurb: 'Skyline, desert and world-class shopping.' },
  { slug: 'qatar', name: 'Qatar', region: 'Middle East', tone: 'city', blurb: 'Doha\u2019s museums, souq and desert coast.' },
  { slug: 'jordan', name: 'Jordan', region: 'Middle East', tone: 'mixed', blurb: 'Petra, Wadi Rum and the Dead Sea.' },
  { slug: 'italy', name: 'Italy & Vatican', region: 'Europe', tone: 'city', blurb: 'Rome, Florence and Venice.' },
  { slug: 'europe', name: 'Europe', region: 'Europe', tone: 'city', blurb: 'Multi-city European journeys.' },
  { slug: 'thailand', name: 'Thailand', region: 'Asia', tone: 'mixed', blurb: 'Bangkok temples and southern islands.' },
  { slug: 'vietnam', name: 'Vietnam', region: 'Asia', tone: 'mixed', blurb: 'Ha Long Bay, Hoi An and the Mekong.' },
  { slug: 'bali-indonesia', name: 'Bali, Indonesia', region: 'Asia', tone: 'coast', blurb: 'Rice terraces, temples and surf beaches.' },
  { slug: 'hongkong', name: 'Hong Kong', region: 'Asia', tone: 'city', blurb: 'Harbour skyline, markets and dim sum.' },
  { slug: 'kuala-lumpur-malaysia', name: 'Kuala Lumpur, Malaysia', region: 'Asia', tone: 'city', blurb: 'Twin Towers, shopping and street food.' },
  { slug: 'canton-fair', name: 'Canton Fair, China', region: 'Asia', tone: 'city', blurb: 'Sourcing trips around the Guangzhou trade fair.' },
  { slug: 'turkey', name: 'Turkey', region: 'Europe', tone: 'mixed', blurb: 'Istanbul, Cappadocia and the Aegean coast.' },
  { slug: 'seasonal-offers', name: 'Seasonal Offers', region: 'Collections', tone: 'seasonal', blurb: 'Time-limited packages tied to holidays and events.' },
];

/**
 * Curated packages with a full price model. `options` are the bookable choices;
 * `extras` are optional add-ons. `validity` drives auto-expiry (R3.2).
 */
const curated = [
  {
    slug: '3-days-diani-package-standard',
    title: 'Diani Beach Escape — 3 Days',
    destination: 'diani-ukunda',
    category: 'coastal',
    summary: 'Three days of reef lagoon, palm shade and slow evenings on Kenya\u2019s best-known beach.',
    transport: 'SGR to Mombasa with road transfer to Diani, or fly direct to Ukunda.',
    options: [
      { id: 'std-3n', label: '3 Days / 2 Nights', nights: 2, price: 39500, currency: 'KES' },
      { id: 'std-5n', label: '5 Days / 4 Nights', nights: 4, price: 62000, currency: 'KES' },
    ],
    extras: [
      { id: 'dhow', label: 'Sunset dhow cruise', price: 4500, currency: 'KES', per: 'person' },
      { id: 'transfer', label: 'Private airport transfer', price: 6000, currency: 'KES', per: 'booking' },
    ],
    inclusions: ['Accommodation on half board', 'Return SGR travel', 'Airport/station transfers', 'Beach activities'],
    exclusions: ['Lunches and drinks', 'Marine park entry', 'Travel insurance'],
    itinerary: [
      { day: 1, title: 'Arrive and settle in', detail: 'Transfer from the station or airport, check in and free time on the beach.' },
      { day: 2, title: 'Reef and lagoon', detail: 'Optional snorkelling at the marine park, afternoon at leisure.' },
      { day: 3, title: 'Departure', detail: 'Breakfast, check out and transfer back.' },
    ],
  },
  {
    slug: '5-days-diani-summer-deals',
    title: 'Diani Summer Deals — 5 Days',
    destination: 'diani-ukunda',
    category: 'coastal',
    summary: 'A longer Diani stay with two extra beach days and a dhow evening.',
    transport: 'SGR plus road transfer, or direct flight to Ukunda.',
    options: [
      { id: 'sum-5', label: '5 Days / 4 Nights', nights: 4, price: 58500, currency: 'KES' },
    ],
    extras: [
      { id: 'snorkel', label: 'Kisite snorkelling trip', price: 8500, currency: 'KES', per: 'person' },
    ],
    inclusions: ['Half-board accommodation', 'Return travel', 'Transfers', 'One dhow evening'],
    exclusions: ['Drinks', 'Optional excursions'],
    itinerary: [
      { day: 1, title: 'Arrive', detail: 'Transfer and check in.' },
      { day: 2, title: 'Marine park', detail: 'Optional Kisite–Mpunguti snorkelling day.' },
      { day: 3, title: 'At leisure', detail: 'Beach and pool day.' },
      { day: 4, title: 'Dhow evening', detail: 'Sunset cruise.' },
      { day: 5, title: 'Departure', detail: 'Check out and transfer.' },
    ],
  },
  {
    slug: 'mombasa-3-days-package',
    title: 'Mombasa Beach Break — 3 Days',
    destination: 'mombasa-north-coast',
    category: 'coastal',
    summary: 'A short north-coast break close to the city, forts and the old harbour.',
    transport: 'SGR to Mombasa, road transfer to the north coast.',
    options: [
      { id: 'mb-3', label: '3 Days / 2 Nights', nights: 2, price: 36500, currency: 'KES' },
    ],
    inclusions: ['Half-board accommodation', 'Return SGR', 'Transfers'],
    exclusions: ['City tour entry fees', 'Drinks'],
    itinerary: [
      { day: 1, title: 'Arrive', detail: 'Transfer and check in.' },
      { day: 2, title: 'Coast and culture', detail: 'Optional old town and Fort Jesus visit.' },
      { day: 3, title: 'Departure', detail: 'Check out and transfer.' },
    ],
  },
  {
    slug: '5-days-mombasa-sgr-package',
    title: 'Mombasa SGR Getaway — 5 Days',
    destination: 'mombasa-north-coast',
    category: 'coastal',
    summary: 'Choose SGR or flight, five days on the north coast.',
    transport: 'Choose SGR (comfortable, included) or a flight upgrade.',
    options: [
      { id: 'sgr', label: '5 Days via SGR', nights: 4, price: 48000, currency: 'KES' },
      { id: 'fly', label: '5 Days via Flight', nights: 4, price: 58000, currency: 'KES' },
    ],
    inclusions: ['Half-board accommodation', 'Return travel as selected', 'Transfers'],
    exclusions: ['Drinks', 'Optional excursions'],
    itinerary: [
      { day: 1, title: 'Travel and arrive', detail: 'Depart Nairobi, transfer and check in.' },
      { day: 2, title: 'Beach day', detail: 'At leisure.' },
      { day: 3, title: 'Optional excursion', detail: 'Haller Park or a dhow trip.' },
      { day: 4, title: 'At leisure', detail: 'Beach and pool.' },
      { day: 5, title: 'Return', detail: 'Check out and travel back.' },
    ],
  },
  {
    slug: '3-days-watamu-malindi',
    title: 'Watamu & Malindi — 3 Days',
    destination: 'malindi',
    category: 'coastal',
    summary: 'Marine park, rock pools and the historic Swahili coast.',
    transport: 'Flight to Malindi or SGR to Mombasa with transfer.',
    options: [
      { id: 'wm-3', label: '3 Days / 2 Nights', nights: 2, price: 35000, currency: 'KES' },
    ],
    inclusions: ['Half-board accommodation', 'Return travel', 'Transfers'],
    exclusions: ['Marine park fees', 'Drinks'],
    itinerary: [
      { day: 1, title: 'Arrive', detail: 'Transfer and check in.' },
      { day: 2, title: 'Watamu marine park', detail: 'Optional snorkelling and Gede ruins.' },
      { day: 3, title: 'Departure', detail: 'Check out and transfer.' },
    ],
  },
  {
    slug: '5-days-watamu-malindi-kilifi',
    title: 'Watamu, Malindi & Kilifi — 5 Days',
    destination: 'malindi',
    category: 'coastal',
    summary: 'Three north-coast towns in one relaxed itinerary.',
    transport: 'Flight or SGR plus road transfers.',
    options: [
      { id: 'wmk-5', label: '5 Days / 4 Nights', nights: 4, price: 68000, currency: 'KES' },
    ],
    inclusions: ['Half-board accommodation', 'Return travel', 'Inter-town transfers'],
    exclusions: ['Drinks', 'Optional excursions'],
    itinerary: [
      { day: 1, title: 'Arrive Kilifi', detail: 'Check in on the creek.' },
      { day: 2, title: 'Kilifi to Watamu', detail: 'Transfer and marine park.' },
      { day: 3, title: 'Watamu', detail: 'Beach and rock pools.' },
      { day: 4, title: 'Malindi', detail: 'Town and beach.' },
      { day: 5, title: 'Departure', detail: 'Check out and travel back.' },
    ],
  },
  {
    slug: 'bush-packages-maasai-mara',
    title: 'Maasai Mara Safari — 3 Days',
    destination: 'maasai-mara',
    category: 'safari',
    summary: 'Three days of game drives in Kenya\u2019s flagship reserve.',
    transport: 'Road transfer from Nairobi or a light-aircraft flight.',
    options: [
      { id: 'mara-3-road', label: '3 Days — road', nights: 2, price: 42000, currency: 'KES' },
      { id: 'mara-3-fly', label: '3 Days — fly-in', nights: 2, price: 76000, currency: 'KES' },
    ],
    extras: [
      { id: 'balloon', label: 'Hot-air balloon safari', price: 45000, currency: 'KES', per: 'person' },
      { id: 'visitors', label: 'Maasai village visit', price: 3000, currency: 'KES', per: 'person' },
    ],
    inclusions: ['Full-board accommodation', 'Game drives in a shared 4×4', 'Park fees', 'Transfers'],
    exclusions: ['Drinks', 'Balloon safari', 'Tips'],
    itinerary: [
      { day: 1, title: 'Nairobi to the Mara', detail: 'Travel to the reserve, lunch and an afternoon game drive.' },
      { day: 2, title: 'Full day in the reserve', detail: 'Morning and afternoon game drives.' },
      { day: 3, title: 'Return', detail: 'Early game drive and travel back to Nairobi.' },
    ],
  },
  {
    slug: 'maasai-mara-wildebeest-migration',
    title: 'Wildebeest Migration — 4 Days',
    destination: 'maasai-mara',
    category: 'safari',
    summary: 'Timed around the migration river crossings.',
    transport: 'Fly-in from Nairobi (recommended) or road.',
    options: [
      { id: 'mig-4-fly', label: '4 Days — fly-in', nights: 3, price: 118000, currency: 'KES' },
      { id: 'mig-4-road', label: '4 Days — road', nights: 3, price: 78000, currency: 'KES' },
    ],
    validity: { from: '2026-07-01', to: '2026-10-31' },
    inclusions: ['Full-board accommodation', 'Game drives', 'Park fees', 'Flights (fly-in option)'],
    exclusions: ['Drinks', 'Balloon safari'],
    itinerary: [
      { day: 1, title: 'Arrive', detail: 'Travel and afternoon game drive.' },
      { day: 2, title: 'Mara River', detail: 'Position for a crossing.' },
      { day: 3, title: 'Full day', detail: 'Morning and afternoon drives.' },
      { day: 4, title: 'Return', detail: 'Early drive and travel back.' },
    ],
  },
  {
    slug: '3-days-samburu',
    title: 'Samburu Safari — 3 Days',
    destination: 'samburu',
    category: 'safari',
    summary: 'The arid north and its unique wildlife.',
    transport: 'Road via Isiolo or a light-aircraft flight.',
    options: [
      { id: 'sbr-3', label: '3 Days / 2 Nights', nights: 2, price: 55000, currency: 'KES' },
    ],
    inclusions: ['Full-board accommodation', 'Game drives', 'Park fees'],
    exclusions: ['Drinks', 'Tips'],
    itinerary: [
      { day: 1, title: 'Travel to Samburu', detail: 'Arrive and afternoon game drive.' },
      { day: 2, title: 'Full day', detail: 'Morning and afternoon drives along the river.' },
      { day: 3, title: 'Return', detail: 'Morning drive and travel back.' },
    ],
  },
  {
    slug: 'nakuru-weekend-getaways',
    title: 'Nakuru Weekend Getaway — 2 Days',
    destination: 'nakuru',
    category: 'safari',
    summary: 'A quick Rift Valley weekend and the rhino sanctuary.',
    transport: 'Self-drive or road transfer from Nairobi.',
    options: [
      { id: 'nak-2', label: '2 Days / 1 Night', nights: 1, price: 18500, currency: 'KES' },
      { id: 'nak-3', label: '3 Days / 2 Nights', nights: 2, price: 27500, currency: 'KES' },
    ],
    inclusions: ['Accommodation', 'Park fees', 'Game drive'],
    exclusions: ['Transport', 'Drinks'],
    itinerary: [
      { day: 1, title: 'Arrive and game drive', detail: 'Check in and an afternoon drive.' },
      { day: 2, title: 'Morning drive', detail: 'Game drive then return.' },
    ],
  },
  {
    slug: 'naivasha-weekend-getaway',
    title: 'Naivasha Weekend Getaway — 2 Days',
    destination: 'naivasha',
    category: 'safari',
    summary: 'Boat safari and a walk among giraffe and zebra.',
    transport: 'Road from Nairobi.',
    options: [
      { id: 'naiv-2', label: '2 Days / 1 Night', nights: 1, price: 16900, currency: 'KES' },
    ],
    extras: [
      { id: 'boat', label: 'Lake boat safari', price: 3500, currency: 'KES', per: 'person' },
    ],
    inclusions: ['Accommodation', 'Dinner and breakfast', 'Crescent Island entry'],
    exclusions: ['Transport', 'Drinks'],
    itinerary: [
      { day: 1, title: 'Arrive and boat safari', detail: 'Check in and afternoon on the lake.' },
      { day: 2, title: 'Crescent Island', detail: 'Walking safari then return.' },
    ],
  },
  {
    slug: 'summer-vibes-dubai',
    title: 'Summer Vibes Dubai — 5 Days',
    destination: 'dubai-uae',
    category: 'international',
    summary: 'Skyline, desert and shopping with flights and city tours included.',
    transport: 'Return flights, private airport transfers.',
    options: [
      { id: 'dxb-4', label: '5 Days / 4 Nights — 4★', nights: 4, price: 1850, currency: 'USD' },
      { id: 'dxb-5', label: '5 Days / 4 Nights — 5★', nights: 4, price: 2450, currency: 'USD' },
    ],
    extras: [
      { id: 'burj', label: 'Burj Khalifa fast-track', price: 95, currency: 'USD', per: 'person' },
      { id: 'desert', label: 'Desert safari with dinner', price: 75, currency: 'USD', per: 'person' },
    ],
    inclusions: ['Return flights', 'Hotel with breakfast', 'Airport transfers', 'City tour'],
    exclusions: ['Visa fees', 'Lunches and dinners', 'Optional excursions'],
    itinerary: [
      { day: 1, title: 'Arrive Dubai', detail: 'Transfer and check in.' },
      { day: 2, title: 'City tour', detail: 'Old and new Dubai, malls and the marina.' },
      { day: 3, title: 'Desert safari', detail: 'Afternoon dunes and an evening camp.' },
      { day: 4, title: 'At leisure', detail: 'Free day or optional Abu Dhabi.' },
      { day: 5, title: 'Departure', detail: 'Check out and transfer to the airport.' },
    ],
  },
  {
    slug: '5-days-south-africa',
    title: 'South Africa — 5 Days',
    destination: 'south-africa',
    category: 'international',
    summary: 'Cape Town, Table Mountain and the Winelands.',
    transport: 'Return flights and private transfers.',
    options: [
      { id: 'za-5', label: '5 Days / 4 Nights', nights: 4, price: 1450, currency: 'USD' },
    ],
    inclusions: ['Return flights', 'Hotel with breakfast', 'Transfers', 'Two tours'],
    exclusions: ['Visa fees', 'Meals not stated'],
    itinerary: [
      { day: 1, title: 'Arrive Cape Town', detail: 'Transfer and check in.' },
      { day: 2, title: 'City and Table Mountain', detail: 'Cableway and city tour.' },
      { day: 3, title: 'Cape Peninsula', detail: 'Full-day coastal tour.' },
      { day: 4, title: 'Winelands', detail: 'Stellenbosch and Franschhoek.' },
      { day: 5, title: 'Departure', detail: 'Transfer to the airport.' },
    ],
  },
  {
    slug: '5-days-4-nights-mauritius',
    title: 'Mauritius — 5 Days',
    destination: 'mauritius',
    category: 'international',
    summary: 'Lagoons, reefs and the Black River Gorges.',
    transport: 'Return flights and resort transfers.',
    options: [
      { id: 'mu-4', label: '5 Days / 4 Nights — 4★', nights: 4, price: 1650, currency: 'USD' },
      { id: 'mu-4-5s', label: '5 Days / 4 Nights — 5★', nights: 4, price: 2150, currency: 'USD' },
    ],
    inclusions: ['Return flights', 'Resort with breakfast and dinner', 'Transfers', 'Two excursions'],
    exclusions: ['Visa fees', 'Drinks', 'Optional excursions'],
    itinerary: [
      { day: 1, title: 'Arrive', detail: 'Transfer and check in.' },
      { day: 2, title: 'South tour', detail: 'Chamarel and Black River Gorges.' },
      { day: 3, title: 'At leisure', detail: 'Beach and lagoon.' },
      { day: 4, title: 'Ile aux Cerfs', detail: 'Full-day boat trip.' },
      { day: 5, title: 'Departure', detail: 'Transfer to the airport.' },
    ],
  },
  {
    slug: 'kuala-lumpur-shopcation',
    title: 'Kuala Lumpur Shopcation — 5 Days',
    destination: 'kuala-lumpur-malaysia',
    category: 'international',
    summary: 'A shopping-led city break with flights and transfers arranged.',
    transport: 'Return flights and airport transfers.',
    options: [
      { id: 'kl-4', label: '5 Days / 4 Nights', nights: 4, price: 1150, currency: 'USD' },
    ],
    inclusions: ['Return flights', 'Hotel with breakfast', 'Transfers'],
    exclusions: ['Visa fees', 'Meals not stated'],
    itinerary: [
      { day: 1, title: 'Arrive', detail: 'Transfer and check in.' },
      { day: 2, title: 'City and towers', detail: 'Petronas Towers and Bukit Bintang.' },
      { day: 3, title: 'Shopping day', detail: 'Malls and markets.' },
      { day: 4, title: 'Optional Batu Caves', detail: 'Half-day excursion.' },
      { day: 5, title: 'Departure', detail: 'Transfer to the airport.' },
    ],
  },
  {
    slug: 'standard-chartered-marathon-packages',
    title: 'Standard Chartered Marathon Packages',
    destination: 'nakuru',
    category: 'seasonal',
    summary: 'Race weekend accommodation and transfers, with flexible rooming.',
    transport: 'Road transfer from Nairobi; vehicle type selectable.',
    options: [
      { id: 'mar-2', label: '2 Days / 1 Night', nights: 1, price: 36200, currency: 'KES' },
      { id: 'mar-3', label: '3 Days / 2 Nights', nights: 2, price: 48900, currency: 'KES' },
    ],
    extras: [
      { id: 'van', label: 'Upgrade to a 4×4 van', price: 9000, currency: 'KES', per: 'booking' },
    ],
    // Valid at the time of the audit (Oct 2026) — demonstrates a live offer.
    validity: { from: '2026-10-01', to: '2026-10-31' },
    inclusions: ['Accommodation', 'Race-day transfers', 'Breakfast'],
    exclusions: ['Race entry fee', 'Drinks'],
    itinerary: [
      { day: 1, title: 'Arrive Nakuru', detail: 'Transfer and check in.' },
      { day: 2, title: 'Race day', detail: 'Early transfer to the start, then return.' },
    ],
  },
  {
    slug: 'coastal-escapes-international-experiences-2026',
    title: 'Coastal Escapes & International Experiences 2026',
    destination: 'seasonal-offers',
    category: 'seasonal',
    summary: 'The 2026 collection: handpicked beach holidays and international journeys.',
    transport: 'Varies by package — confirmed with the booking.',
    options: [
      { id: 'coll-coast', label: 'Coastal from', nights: 2, price: 39500, currency: 'KES' },
      { id: 'coll-intl', label: 'International from', nights: 4, price: 1150, currency: 'USD' },
    ],
    validity: { from: '2026-01-01', to: '2026-12-31' },
    inclusions: ['Accommodation', 'Transport as per package', 'Transfers'],
    exclusions: ['Optional excursions'],
    itinerary: [
      { day: 1, title: 'Choose your journey', detail: 'This is a collection — pick a specific package to see its itinerary.' },
    ],
  },
  {
    slug: 'galentines-and-easter-2026',
    title: 'Galentine & Easter 2026',
    destination: 'seasonal-offers',
    category: 'seasonal',
    summary: 'Limited-time holiday packages for special moments across the year.',
    transport: 'Varies by package.',
    options: [
      { id: 'ge-3', label: '3 Days / 2 Nights', nights: 2, price: 35500, currency: 'KES' },
    ],
    // Expired at the time of the audit — must NOT render as bookable (F-05 → R3.2).
    validity: { from: '2026-01-15', to: '2026-04-15' },
    inclusions: ['Accommodation', 'Transfers'],
    exclusions: ['Optional excursions'],
    itinerary: [
      { day: 1, title: 'Arrive', detail: 'Check in.' },
      { day: 2, title: 'At leisure', detail: 'Beach or safari day.' },
      { day: 3, title: 'Departure', detail: 'Check out.' },
    ],
  },
];

/**
 * Remaining live-site packages, generated with a lightweight price model so the
 * collection is realistic. Duplicates (F-16) are excluded on purpose.
 */
const generated = [
  ['mombasa-north-coast-beach-escape', 'Mombasa North Coast Beach Escape', 'mombasa-north-coast', 'coastal', 37500, 2],
  ['mombasa-august-school-holiday', 'Mombasa August School Holiday', 'mombasa-north-coast', 'coastal', 41000, 2],
  ['diani-3-days-summer-deals', 'Diani Summer Deals — 3 Days', 'diani-ukunda', 'coastal', 38000, 2],
  ['chama-deals-diani-package', 'Chama Deals — Diani', 'diani-ukunda', 'coastal', 43500, 2],
  ['chama-deals-diani-package-5days', 'Chama Deals — Diani — 5 Days', 'diani-ukunda', 'coastal', 66500, 4],
  ['diani-5-days-babymoon-gender-reveal', 'Babymoon & Gender Reveal — Diani — 5 Days', 'diani-ukunda', 'coastal', 72000, 4],
  ['diani-3-days-babymoon-gender-reveal', 'Babymoon & Gender Reveal — Diani — 3 Days', 'diani-ukunda', 'coastal', 46000, 2],
  ['5-days-diani-packages-standard', 'Diani Standard — 5 Days', 'diani-ukunda', 'coastal', 61500, 4],
  ['diani-sgr-2026-deals', 'Diani SGR 2026 Deals', 'diani-ukunda', 'coastal', 39500, 2],
  ['watamu-malindi-2026-deals', 'Watamu & Malindi 2026 Deals', 'malindi', 'coastal', 38000, 2],
  ['maasai-mara-bush-christmas', 'Maasai Mara Bush Christmas', 'maasai-mara', 'safari', 52000, 2],
  ['maasai-mara-august-school-holiday', 'Maasai Mara August School Holiday', 'maasai-mara', 'safari', 44500, 2],
  ['maasai-mara-deals', 'Maasai Mara Deals', 'maasai-mara', 'safari', 43000, 2],
  ['easter-samburu', 'Easter Samburu', 'samburu', 'safari', 56000, 2],
  ['the-great-lakes', 'The Great Lakes', 'naivasha', 'safari', 72000, 3],
  ['mt-kenya-2-days-1-night', 'Mount Kenya — 2 Days', 'mount-kenya', 'safari', 34500, 1],
  ['mt-kenya-chama-deals', 'Mount Kenya Chama Deals', 'mount-kenya', 'safari', 46000, 2],
  ['5-days-dubai-low-season', 'Dubai Low Season — 5 Days', 'dubai-uae', 'international', 1580, 4],
  ['2026-sgr-mombasa', 'SGR Mombasa 2026', 'mombasa-north-coast', 'seasonal', 36200, 2],
  ['tsavo-explorer-3-days', 'Tsavo Explorer — 3 Days', 'tsavo', 'safari', 47000, 2],
  ['amboseli-elephants-3-days', 'Amboseli Elephants — 3 Days', 'amboseli', 'safari', 52000, 2],
  ['zanzibar-beach-5-days', 'Zanzibar Beach — 5 Days', 'zanzibar', 'international', 1290, 4],
  ['rwanda-gorillas-4-days', 'Rwanda Gorillas — 4 Days', 'rwanda', 'international', 2950, 3],
  ['italy-vatican-educational-tour-2026', 'Italy & Vatican Educational Tour 2026', 'italy', 'international', 2999, 7],
];

function titleCase(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function fromGenerated([slug, title, destination, category, price, nights]) {
  const currency = category === 'international' ? 'USD' : 'KES';
  return {
    slug,
    title: title || titleCase(slug),
    destination,
    category,
    summary: 'A structured package with accommodation, transport and transfers arranged and confirmed with your booking.',
    transport: 'Transport arranged as part of the package.',
    options: [
      { id: `${slug}-base`, label: nights ? `${nights + 1} Days / ${nights} Nights` : 'Standard', nights, price, currency },
      { id: `${slug}-ext`, label: 'Extended stay', nights: nights + 2, price: Math.round(price * 1.55), currency },
    ],
    extras: [],
    inclusions: ['Accommodation', 'Transport as arranged', 'Transfers'],
    exclusions: ['Optional excursions', 'Drinks'],
    itinerary: [
      { day: 1, title: 'Arrive', detail: 'Transfer and check in.' },
      { day: 2, title: 'At leisure', detail: 'Explore at your own pace.' },
      { day: 3, title: 'Departure', detail: 'Check out and transfers.' },
    ],
  };
}

export const packages = [
  ...curated,
  ...generated.map(fromGenerated),
];
