import { Product } from '../types';

export const SEED_CATALOG_PRODUCTS: Product[] = [
  // Home & Living
  {
    id: 'prod-hl-1',
    providerId: 'prov-2',
    providerName: 'Elena Rostova',
    storeName: 'Nordic Craft Furniture & Living',
    subdomain: 'nordic-craft',
    name: 'Mid-Century Velvet 3-Seater Sofa',
    description: 'High-density memory foam cushioning with solid walnut legs and stain-resistant velvet fabric.',
    price: 649.00,
    category: 'pcat-home-living',
    subcategory: 'Sofas & Armchairs',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.9,
    salesCount: 68
  },
  {
    id: 'prod-hl-2',
    providerId: 'prov-2',
    providerName: 'Elena Rostova',
    storeName: 'Nordic Craft Furniture & Living',
    subdomain: 'nordic-craft',
    name: 'Solid Oak Dining Table with 6 Chairs',
    description: 'FSC-certified European white oak with matte water-based protective sealant and ergonomic curved chairs.',
    price: 890.00,
    category: 'pcat-home-living',
    subcategory: 'Dining Tables & Chairs',
    imageUrl: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.95,
    salesCount: 42
  },

  // Home Appliances
  {
    id: 'prod-app-1',
    providerId: 'prov-9',
    providerName: 'Kevin Wu',
    storeName: 'Apex Climate & Major Appliance Depot',
    subdomain: 'apex-hvac',
    name: 'Smart Dual-Inverter French Door Refrigerator 28 cu. ft.',
    description: 'Multi-airflow cooling, craft ice generator, Wi-Fi energy monitoring, and fingerprint-resistant stainless finish.',
    price: 1450.00,
    category: 'pcat-appliances',
    subcategory: 'Refrigerators & Freezers',
    imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.9,
    salesCount: 54
  },
  {
    id: 'prod-app-2',
    providerId: 'prov-9',
    providerName: 'Kevin Wu',
    storeName: 'Apex Climate & Major Appliance Depot',
    subdomain: 'apex-hvac',
    name: 'Ultra-Quiet Front-Load Smart Steam Washer',
    description: '14 wash cycles, steam allergen sanitization, auto-detergent dispensing, and direct drive motor.',
    price: 799.00,
    category: 'pcat-appliances',
    subcategory: 'Washing Machines & Dryers',
    imageUrl: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.85,
    salesCount: 89
  },

  // Kitchen & Dining
  {
    id: 'prod-kit-1',
    providerId: 'prov-5',
    providerName: 'Marco Bellini',
    storeName: 'Bellini Gourmet Hardware & Kitchenware',
    subdomain: 'bellini-gourmet',
    name: '5-Ply Clad Stainless Steel 10-Piece Cookware Set',
    description: 'Commercial induction-compatible core with riveted ergonomic stay-cool handles and tempered glass lids.',
    price: 380.00,
    category: 'pcat-kitchen',
    subcategory: 'Cookware & Frying Pans',
    imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.95,
    salesCount: 112
  },
  {
    id: 'prod-kit-2',
    providerId: 'prov-5',
    providerName: 'Marco Bellini',
    storeName: 'Bellini Gourmet Hardware & Kitchenware',
    subdomain: 'bellini-gourmet',
    name: 'Japanese VG-10 Damascus 8" Chef Knife with Sheath',
    description: '67-layer hammered Damascus steel, 60+ HRC hardness, razor-sharp 12-degree edge, and G10 military handle.',
    price: 119.00,
    category: 'pcat-kitchen',
    subcategory: 'Chef Knives & Sets',
    imageUrl: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 5.0,
    salesCount: 185
  },

  // Bathroom
  {
    id: 'prod-bath-1',
    providerId: 'prov-3',
    providerName: 'David Thorne',
    storeName: 'Thorne Rapid Hydro Plumbing & Sanitary',
    subdomain: 'thorne-plumbing',
    name: 'Thermostatic Matte Black Rainfall Shower System',
    description: '12-inch stainless steel shower head with handheld wand, anti-scald brass valve, and pressure balancing.',
    price: 245.00,
    category: 'pcat-bathroom',
    subcategory: 'Showers & Rainfall Systems',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.9,
    salesCount: 97
  },

  // Lighting
  {
    id: 'prod-light-1',
    providerId: 'prov-2',
    providerName: 'Elena Rostova',
    storeName: 'Tesla Master Electric & Solar Store',
    subdomain: 'tesla-electric',
    name: 'Modern Geometric Ring LED Chandelier Dimmable',
    description: 'Integrated 65W LED driver, 3000K-6500K tunable color temp with RF remote and wall switch memory.',
    price: 189.00,
    category: 'pcat-lighting',
    subcategory: 'Ceiling Lights & Chandeliers',
    imageUrl: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.88,
    salesCount: 140
  },

  // Electronics
  {
    id: 'prod-elec-1',
    providerId: 'prov-2',
    providerName: 'Elena Rostova',
    storeName: 'Tesla Master Electric & Solar Store',
    subdomain: 'tesla-electric',
    name: 'Digital Multimeter with True RMS & Thermal Probe',
    description: 'Auto-ranging 6000 counts, non-contact AC voltage sensor, live wire test and backlit LCD display.',
    price: 54.00,
    category: 'pcat-electronics',
    subcategory: 'Electronic Devices & DIY Kits',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.92,
    salesCount: 220
  },

  // Mobile Phones & Accessories
  {
    id: 'prod-phone-1',
    providerId: 'prov-1',
    providerName: 'Marcus Vance',
    storeName: 'Vance Mobile Tech & Smart Gear',
    subdomain: 'vance-tech',
    name: '100W GaN 4-Port Fast Desktop Charger',
    description: 'Dual USB-C Power Delivery 3.0 ports, foldable prongs, smart device recognition for laptops and phones.',
    price: 59.99,
    category: 'pcat-phones',
    subcategory: 'GaN Fast Chargers & Cables',
    imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.9,
    salesCount: 310
  },
  {
    id: 'prod-phone-2',
    providerId: 'prov-1',
    providerName: 'Marcus Vance',
    storeName: 'Vance Mobile Tech & Smart Gear',
    subdomain: 'vance-tech',
    name: 'Magnetic Wireless Power Bank 10,000mAh with Stand',
    description: 'Snap-on MagSafe compatible, 15W wireless output, pass-through charging with zinc-alloy kickstand.',
    price: 49.00,
    category: 'pcat-phones',
    subcategory: 'Power Banks & Car Mounts',
    imageUrl: 'https://images.unsplash.com/photo-1609081219090-a6d8173087ec?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.86,
    salesCount: 175
  },

  // Computers & Accessories
  {
    id: 'prod-comp-1',
    providerId: 'prov-6',
    providerName: 'Aiden Reed',
    storeName: 'Reed Auto & Workstation Lab',
    subdomain: 'reed-lab',
    name: 'Wireless Hot-Swappable 75% Mechanical Keyboard',
    description: 'Pre-lubed linear switches, sound dampening foam, gasket mount, PBT keycaps and triple connectivity.',
    price: 129.00,
    category: 'pcat-computers',
    subcategory: 'Mechanical Keyboards',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.94,
    salesCount: 260
  },

  // Computer Components
  {
    id: 'prod-part-1',
    providerId: 'prov-6',
    providerName: 'Aiden Reed',
    storeName: 'Reed Auto & Workstation Lab',
    subdomain: 'reed-lab',
    name: '2TB PCIe Gen4 NVMe M.2 SSD 7,400MB/s with Heatsink',
    description: 'Extreme read speed for heavy rendering, direct storage gaming, and server workstation builds.',
    price: 159.00,
    category: 'pcat-components',
    subcategory: 'Gen4/Gen5 NVMe SSDs & HDDs',
    imageUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.96,
    salesCount: 190
  },

  // TV, Audio & Video
  {
    id: 'prod-aud-1',
    providerId: 'prov-1',
    providerName: 'Marcus Vance',
    storeName: 'Vance Mobile Tech & Smart Gear',
    subdomain: 'vance-tech',
    name: 'Active Noise Cancelling Wireless Over-Ear Headphones',
    description: 'Custom 40mm drivers, transparency mode, 45-hour battery life with multipoint Bluetooth 5.3 pairing.',
    price: 199.00,
    category: 'pcat-tv-audio',
    subcategory: 'Noise-Cancelling Headphones',
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.91,
    salesCount: 420
  },

  // Cameras & Photography
  {
    id: 'prod-cam-1',
    providerId: 'prov-7',
    providerName: 'Sarah Jenkins',
    storeName: 'Jenkins Media & Vision Studio',
    subdomain: 'jenkins-media',
    name: '3-Axis Motorized Handheld Gimbal Stabilizer',
    description: 'Payload capacity up to 3.2kg, native vertical shooting, OLED touchscreen and Bluetooth shutter control.',
    price: 299.00,
    category: 'pcat-cameras',
    subcategory: 'Carbon Fiber Tripods & Gimbals',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.88,
    salesCount: 88
  },

  // Gaming
  {
    id: 'prod-game-1',
    providerId: 'prov-6',
    providerName: 'Aiden Reed',
    storeName: 'Reed Auto & Workstation Lab',
    subdomain: 'reed-lab',
    name: 'Ergonomic Breathable Mesh Gaming Chair with Lumbar Support',
    description: '3D adjustable armrests, 135-degree recline lock, heavy duty steel wheelbase and Class-4 gas lift.',
    price: 279.00,
    category: 'pcat-gaming',
    subcategory: 'Ergonomic Gaming Chairs',
    imageUrl: 'https://images.unsplash.com/photo-1612287232230-e325608798e4?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.9,
    salesCount: 165
  },

  // Smart Home
  {
    id: 'prod-sh-1',
    providerId: 'prov-2',
    providerName: 'Elena Rostova',
    storeName: 'Tesla Master Electric & Solar Store',
    subdomain: 'tesla-electric',
    name: 'Smart Biometric Fingerprint Deadbolt with Keypad & App',
    description: '0.3-second fingerprint recognition, auto-lock timer, bank-grade encryption, and remote guest keys.',
    price: 139.00,
    category: 'pcat-smarthome',
    subcategory: 'Biometric Door Locks',
    imageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.93,
    salesCount: 215
  },

  // Clothing
  {
    id: 'prod-clo-1',
    providerId: 'prov-8',
    providerName: 'Carlos Ramirez',
    storeName: 'Ramirez Signature Apparel & Workwear',
    subdomain: 'ramirez-wear',
    name: 'Waterproof Breathable Heavy Duty Workwear Jacket',
    description: 'Triple-stitched seams, reinforced elbow patches, fleece-lined warmth, and reflective safety bands.',
    price: 89.00,
    category: 'pcat-clothing',
    subcategory: 'Heavy Duty Workwear & Uniforms',
    imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.87,
    salesCount: 198
  },

  // Shoes
  {
    id: 'prod-shoe-1',
    providerId: 'prov-8',
    providerName: 'Carlos Ramirez',
    storeName: 'Ramirez Signature Apparel & Workwear',
    subdomain: 'ramirez-wear',
    name: 'Steel Toe Puncture-Resistant Safety Work Boots',
    description: 'ASTM F2413 certified steel toe, Kevlar midsole puncture resistance, oil-resistant slip tread.',
    price: 110.00,
    category: 'pcat-shoes',
    subcategory: 'Steel-Toe Certified Safety Boots',
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.92,
    salesCount: 340
  },

  // Bags & Luggage
  {
    id: 'prod-bag-1',
    providerId: 'prov-8',
    providerName: 'Carlos Ramirez',
    storeName: 'Ramirez Signature Apparel & Workwear',
    subdomain: 'ramirez-wear',
    name: 'Anti-Theft Expandable Travel Laptop Backpack 35L',
    description: 'Water-resistant ballistic nylon, TSA lock, luggage strap, hidden pocket, and USB charging pass-through.',
    price: 75.00,
    category: 'pcat-bags',
    subcategory: 'Laptop & Tech Backpacks',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.89,
    salesCount: 180
  },

  // Jewelry & Watches
  {
    id: 'prod-jwl-1',
    providerId: 'prov-1',
    providerName: 'Marcus Vance',
    storeName: 'Vance Mobile Tech & Smart Gear',
    subdomain: 'vance-tech',
    name: 'Automatic Sapphire Crystal Skeleton Men\'s Watch',
    description: 'Self-winding Japanese mechanical movement, genuine alligator leather strap, 50m water resistant.',
    price: 260.00,
    category: 'pcat-jewelry',
    subcategory: 'Swiss Automatic Luxury Watches',
    imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.95,
    salesCount: 75
  },

  // Beauty & Personal Care
  {
    id: 'prod-bty-1',
    providerId: 'prov-4',
    providerName: 'Dr. Chloe Adams',
    storeName: 'Adams Pure Wellness & Clinical Health',
    subdomain: 'adams-clinic',
    name: 'Ceramide Barrier Restoring Hydration Serum 50ml',
    description: 'Pure hyaluronic acid triple-complex, niacinamide, and prebiotic peptides for sensitive skin repair.',
    price: 42.00,
    category: 'pcat-beauty',
    subcategory: 'Hydrating Serums & Moisturizers',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.97,
    salesCount: 310
  },

  // Health & Wellness
  {
    id: 'prod-hlth-1',
    providerId: 'prov-4',
    providerName: 'Dr. Chloe Adams',
    storeName: 'Adams Pure Wellness & Clinical Health',
    subdomain: 'adams-clinic',
    name: 'FDA-Cleared Digital Upper Arm Blood Pressure Monitor',
    description: 'Bluetooth sync to health app, irregular heartbeat detection, 2-user memory, and extra-large backlit LCD.',
    price: 68.00,
    category: 'pcat-health',
    subcategory: 'Digital Blood Pressure Monitors',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.98,
    salesCount: 520
  },

  // Baby & Kids
  {
    id: 'prod-baby-1',
    providerId: 'prov-4',
    providerName: 'Dr. Chloe Adams',
    storeName: 'Adams Pure Wellness & Clinical Health',
    subdomain: 'adams-clinic',
    name: 'Compact One-Hand Fold All-Terrain Baby Stroller',
    description: 'Puncture-proof PU wheels, UV50+ canopy, multi-position reclining seat, and aerospace aluminum frame.',
    price: 289.00,
    category: 'pcat-baby',
    subcategory: 'All-Terrain Modular Strollers',
    imageUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.91,
    salesCount: 92
  },

  // Toys & Games
  {
    id: 'prod-toy-1',
    providerId: 'prov-5',
    providerName: 'Marco Bellini',
    storeName: 'Bellini Gourmet Hardware & Kitchenware',
    subdomain: 'bellini-gourmet',
    name: 'Solar & Hydraulic STEM Mechanical Robot Builder Kit',
    description: '14-in-1 educational motorized gear kit powered by renewable solar light and pneumatic pistons.',
    price: 49.99,
    category: 'pcat-toys',
    subcategory: 'STEM Engineering & Robotics',
    imageUrl: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.9,
    salesCount: 145
  },

  // Sports & Fitness
  {
    id: 'prod-spt-1',
    providerId: 'prov-8',
    providerName: 'Carlos Ramirez',
    storeName: 'Ramirez Signature Apparel & Workwear',
    subdomain: 'ramirez-wear',
    name: 'Rapid-Adjust 55 lbs Quick-Dial Dumbbell Pair',
    description: 'Smooth turn dial adjusts from 5 to 55 lbs in 2.5 lb increments with safety lock tray mechanism.',
    price: 299.00,
    category: 'pcat-sports',
    subcategory: 'Adjustable Quick-Select Dumbbells',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    rating: 4.96,
    salesCount: 240
  }
];
