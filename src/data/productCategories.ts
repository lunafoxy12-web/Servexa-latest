export interface ProductSubcategoryGroup {
  name: string;
  items: string[];
}

export interface DetailedSubcategory {
  name: string;
  image: string;
  groupName?: string;
  description?: string;
}

export interface ProductCategoryConfig {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  image: string;
  tagline: string;
  borderHover: string;
  bgTint: string;
  badgeBg: string;
  badgeText: string;
  actionText: string;
  ringColor: string;
  subcategories: string[];
  groupedSubcategories?: ProductSubcategoryGroup[];
  detailedSubcategories?: DetailedSubcategory[];
}

export const PRODUCT_CATEGORIES: ProductCategoryConfig[] = [
  // ==========================================
  // 1. HOME & LIVING
  // ==========================================
  {
    id: 'prod-cat-home-living',
    name: 'Home & Living',
    slug: 'home-living',
    iconName: 'Armchair',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=700&auto=format&fit=crop&q=80',
    tagline: 'Furniture, elegant decor, smart storage & home improvement',
    borderHover: 'hover:border-emerald-400 hover:ring-2 hover:ring-emerald-100',
    bgTint: 'bg-emerald-50/40',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    badgeText: 'Home & Living',
    actionText: 'text-emerald-700',
    ringColor: 'ring-emerald-400',
    groupedSubcategories: [
      {
        name: 'Furniture',
        items: ['Sofas', 'Armchairs', 'Chairs', 'Tables', 'Coffee Tables', 'Dining Tables', 'Beds', 'Mattresses', 'Wardrobes', 'Cabinets', 'Dressers', 'TV Units', 'Desks', 'Bookshelves', 'Shoe Racks']
      },
      {
        name: 'Home Decor',
        items: ['Wall Art', 'Paintings', 'Mirrors', 'Clocks', 'Vases', 'Curtains', 'Cushions', 'Rugs', 'Carpets', 'Decorative Items']
      },
      {
        name: 'Home Storage',
        items: ['Storage Boxes', 'Baskets', 'Shelves', 'Organizers', 'Storage Cabinets']
      },
      {
        name: 'Home Improvement',
        items: ['Doors', 'Windows', 'Flooring', 'Wall Panels', 'Paint', 'Wallpaper']
      }
    ],
    subcategories: [
      'Sofas', 'Armchairs', 'Chairs', 'Tables', 'Coffee Tables', 'Dining Tables',
      'Beds', 'Mattresses', 'Wardrobes', 'Cabinets', 'Dressers', 'TV Units',
      'Desks', 'Bookshelves', 'Shoe Racks', 'Wall Art', 'Paintings', 'Mirrors',
      'Clocks', 'Vases', 'Curtains', 'Cushions', 'Rugs', 'Carpets', 'Decorative Items',
      'Storage Boxes', 'Baskets', 'Shelves', 'Organizers', 'Storage Cabinets',
      'Doors', 'Windows', 'Flooring', 'Wall Panels', 'Paint', 'Wallpaper'
    ],
    detailedSubcategories: [
      // Furniture
      { name: 'Sofas', groupName: 'Furniture', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&auto=format&fit=crop&q=80', description: 'Sectionals, velvet recliners & luxury loungers' },
      { name: 'Armchairs', groupName: 'Furniture', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&auto=format&fit=crop&q=80', description: 'Ergonomic reading & accent armchairs' },
      { name: 'Chairs', groupName: 'Furniture', image: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=500&auto=format&fit=crop&q=80', description: 'Solid wood dining & lounge seating' },
      { name: 'Tables', groupName: 'Furniture', image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=500&auto=format&fit=crop&q=80', description: 'Console, side & study surfaces' },
      { name: 'Coffee Tables', groupName: 'Furniture', image: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=500&auto=format&fit=crop&q=80', description: 'Modern tempered glass & walnut tables' },
      { name: 'Dining Tables', groupName: 'Furniture', image: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=500&auto=format&fit=crop&q=80', description: 'Solid oak extendable 6-8 seaters' },
      { name: 'Beds', groupName: 'Furniture', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=500&auto=format&fit=crop&q=80', description: 'Upholstered platform & king size frames' },
      { name: 'Mattresses', groupName: 'Furniture', image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500&auto=format&fit=crop&q=80', description: 'Memory foam & pocket-spring orthopedics' },
      { name: 'Wardrobes', groupName: 'Furniture', image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=500&auto=format&fit=crop&q=80', description: 'Sliding mirror & modular closet armoires' },
      { name: 'Cabinets', groupName: 'Furniture', image: 'https://images.unsplash.com/photo-1595428774783-65d1d61c6b3e?w=500&auto=format&fit=crop&q=80', description: 'Sideboard credenzas & pantry cupboards' },
      { name: 'Dressers', groupName: 'Furniture', image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=500&auto=format&fit=crop&q=80', description: 'Multi-drawer oak bedroom organizers' },
      { name: 'TV Units', groupName: 'Furniture', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&auto=format&fit=crop&q=80', description: 'Floating modern media consoles' },
      { name: 'Desks', groupName: 'Furniture', image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500&auto=format&fit=crop&q=80', description: 'Motorized standing & executive desks' },
      { name: 'Bookshelves', groupName: 'Furniture', image: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=500&auto=format&fit=crop&q=80', description: 'Wall-mounted & tall library shelves' },
      { name: 'Shoe Racks', groupName: 'Furniture', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&auto=format&fit=crop&q=80', description: 'Entryway tiered ventilated shoe benches' },
      // Home Decor
      { name: 'Wall Art', groupName: 'Home Decor', image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&auto=format&fit=crop&q=80', description: 'Curated canvas & framed prints' },
      { name: 'Paintings', groupName: 'Home Decor', image: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=500&auto=format&fit=crop&q=80', description: 'Original oil & acrylic wall textures' },
      { name: 'Mirrors', groupName: 'Home Decor', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=500&auto=format&fit=crop&q=80', description: 'Gold arched & backlit vanity mirrors' },
      { name: 'Clocks', groupName: 'Home Decor', image: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=500&auto=format&fit=crop&q=80', description: 'Silent sweep architectural wall clocks' },
      { name: 'Vases', groupName: 'Home Decor', image: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=500&auto=format&fit=crop&q=80', description: 'Artisan ceramic & smoked glass vessels' },
      { name: 'Curtains', groupName: 'Home Decor', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&auto=format&fit=crop&q=80', description: 'Thermal blackout & linen drapery' },
      { name: 'Cushions', groupName: 'Home Decor', image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=500&auto=format&fit=crop&q=80', description: 'Plush velvet & textured throw pillows' },
      { name: 'Rugs', groupName: 'Home Decor', image: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=500&auto=format&fit=crop&q=80', description: 'Hand-tufted wool & jute area rugs' },
      { name: 'Carpets', groupName: 'Home Decor', image: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=500&auto=format&fit=crop&q=80', description: 'Full room plush wall-to-wall carpets' },
      { name: 'Decorative Items', groupName: 'Home Decor', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format&fit=crop&q=80', description: 'Sculptural brass & stone tabletop pieces' },
      // Storage & Improvement
      { name: 'Storage Boxes', groupName: 'Home Storage', image: 'https://images.unsplash.com/photo-1595428774783-65d1d61c6b3e?w=500&auto=format&fit=crop&q=80', description: 'Stackable transparent & linen bins' },
      { name: 'Baskets', groupName: 'Home Storage', image: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=500&auto=format&fit=crop&q=80', description: 'Handwoven natural seagrass baskets' },
      { name: 'Shelves', groupName: 'Home Storage', image: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=500&auto=format&fit=crop&q=80', description: 'Heavy-duty garage & pantry racks' },
      { name: 'Organizers', groupName: 'Home Storage', image: 'https://images.unsplash.com/photo-1595428774783-65d1d61c6b3e?w=500&auto=format&fit=crop&q=80', description: 'Drawer dividers & closet organizer kits' },
      { name: 'Storage Cabinets', groupName: 'Home Storage', image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=500&auto=format&fit=crop&q=80', description: 'Lockable utility & steel cabinets' },
      { name: 'Doors', groupName: 'Home Improvement', image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=500&auto=format&fit=crop&q=80', description: 'Interior barn & solid timber entry doors' },
      { name: 'Windows', groupName: 'Home Improvement', image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=500&auto=format&fit=crop&q=80', description: 'Double glazed thermal soundproof panes' },
      { name: 'Flooring', groupName: 'Home Improvement', image: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=500&auto=format&fit=crop&q=80', description: 'Waterproof luxury vinyl & solid oak planks' },
      { name: 'Wall Panels', groupName: 'Home Improvement', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=500&auto=format&fit=crop&q=80', description: '3D acoustic wood fluted panels' },
      { name: 'Paint', groupName: 'Home Improvement', image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500&auto=format&fit=crop&q=80', description: 'Zero-VOC matte interior latex paint' },
      { name: 'Wallpaper', groupName: 'Home Improvement', image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&auto=format&fit=crop&q=80', description: 'Textured peel-and-stick botanical murals' }
    ]
  },

  // ==========================================
  // 2. HOME APPLIANCES
  // ==========================================
  {
    id: 'prod-cat-home-appliances',
    name: 'Home Appliances',
    slug: 'home-appliances',
    iconName: 'Tv',
    image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=700&auto=format&fit=crop&q=80',
    tagline: 'Refrigerators, washers, AC, ovens, purifiers & parts',
    borderHover: 'hover:border-sky-400 hover:ring-2 hover:ring-sky-100',
    bgTint: 'bg-sky-50/40',
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-200',
    badgeText: 'Major Appliances',
    actionText: 'text-sky-700',
    ringColor: 'ring-sky-400',
    subcategories: [
      'Refrigerators', 'Freezers', 'Washing Machines', 'Dryers', 'Dishwashers',
      'Ovens', 'Microwave Ovens', 'Electric Stoves', 'Gas Stoves', 'Air Conditioners',
      'Air Coolers', 'Air Purifiers', 'Dehumidifiers', 'Vacuum Cleaners', 'Steam Cleaners',
      'Water Heaters', 'Water Dispensers', 'Water Purifiers', 'Fans', 'Room Heaters',
      'Irons', 'Sewing Machines', 'Home Appliance Parts', 'Home Appliance Accessories'
    ],
    detailedSubcategories: [
      { name: 'Refrigerators', groupName: 'Cooling & Freezing', image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=500&auto=format&fit=crop&q=80', description: 'Smart French door & counter-depth fridges' },
      { name: 'Freezers', groupName: 'Cooling & Freezing', image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=500&auto=format&fit=crop&q=80', description: 'Deep chest & upright frost-free freezers' },
      { name: 'Washing Machines', groupName: 'Laundry', image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=500&auto=format&fit=crop&q=80', description: 'Front-load steam & high efficiency washers' },
      { name: 'Dryers', groupName: 'Laundry', image: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=500&auto=format&fit=crop&q=80', description: 'Sensor heat-pump & electric dryers' },
      { name: 'Dishwashers', groupName: 'Kitchen Appliances', image: 'https://images.unsplash.com/photo-1585837575652-267c041d77d4?w=500&auto=format&fit=crop&q=80', description: 'Ultra-silent stainless steel built-ins' },
      { name: 'Ovens', groupName: 'Kitchen Appliances', image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&auto=format&fit=crop&q=80', description: 'Built-in convection wall & steam ovens' },
      { name: 'Microwave Ovens', groupName: 'Kitchen Appliances', image: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=500&auto=format&fit=crop&q=80', description: 'Countertop smart sensor microwaves' },
      { name: 'Electric Stoves', groupName: 'Kitchen Appliances', image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&auto=format&fit=crop&q=80', description: 'Induction smooth cooktop ranges' },
      { name: 'Gas Stoves', groupName: 'Kitchen Appliances', image: 'https://images.unsplash.com/photo-1584990347449-3997637d7e3e?w=500&auto=format&fit=crop&q=80', description: 'High-BTU sealed burner gas ranges' },
      { name: 'Air Conditioners', groupName: 'Climate Control', image: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=500&auto=format&fit=crop&q=80', description: 'Inverter split AC & portable cooling units' },
      { name: 'Air Coolers', groupName: 'Climate Control', image: 'https://images.unsplash.com/photo-1593121923573-c67d3ff1185f?w=500&auto=format&fit=crop&q=80', description: 'Evaporative personal & room coolers' },
      { name: 'Air Purifiers', groupName: 'Climate Control', image: 'https://images.unsplash.com/photo-1593121923573-c67d3ff1185f?w=500&auto=format&fit=crop&q=80', description: 'Medical True HEPA H13 filtration units' },
      { name: 'Dehumidifiers', groupName: 'Climate Control', image: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?w=500&auto=format&fit=crop&q=80', description: 'High-capacity auto-pump moisture extractors' },
      { name: 'Vacuum Cleaners', groupName: 'Cleaning Tech', image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500&auto=format&fit=crop&q=80', description: 'Cordless stick & robotic laser vacuums' },
      { name: 'Steam Cleaners', groupName: 'Cleaning Tech', image: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?w=500&auto=format&fit=crop&q=80', description: 'Pressurized sanitizing tile & floor steamers' },
      { name: 'Water Heaters', groupName: 'Water & Heating', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80', description: 'Tankless gas & hybrid electric heaters' },
      { name: 'Water Dispensers', groupName: 'Water & Heating', image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=80', description: 'Bottom-load hot & cold filtered dispensers' },
      { name: 'Water Purifiers', groupName: 'Water & Heating', image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=80', description: 'Reverse osmosis multi-stage filters' },
      { name: 'Fans', groupName: 'Small Appliances', image: 'https://images.unsplash.com/photo-1593121923573-c67d3ff1185f?w=500&auto=format&fit=crop&q=80', description: 'Bladeless oscillating tower & desk fans' },
      { name: 'Room Heaters', groupName: 'Small Appliances', image: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=500&auto=format&fit=crop&q=80', description: 'Ceramic tower & infrared space heaters' },
      { name: 'Irons', groupName: 'Small Appliances', image: 'https://images.unsplash.com/photo-1489274495757-95c7c837b101?w=500&auto=format&fit=crop&q=80', description: 'Ceramic soleplate steam generator irons' },
      { name: 'Sewing Machines', groupName: 'Small Appliances', image: 'https://images.unsplash.com/photo-1599420186946-7b6fb4e53799?w=500&auto=format&fit=crop&q=80', description: 'Computerized stitch & quilting machines' },
      { name: 'Home Appliance Parts', groupName: 'Parts & Service', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80', description: 'Motors, belts, switches & valves' },
      { name: 'Home Appliance Accessories', groupName: 'Parts & Service', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80', description: 'Hoses, filters, descalers & mounts' }
    ]
  },

  // ==========================================
  // 3. KITCHEN & DINING
  // ==========================================
  {
    id: 'prod-cat-kitchen-dining',
    name: 'Kitchen & Dining',
    slug: 'kitchen-dining',
    iconName: 'Utensils',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=700&auto=format&fit=crop&q=80',
    tagline: 'Cookware, chef knives, tableware, storage & appliances',
    borderHover: 'hover:border-orange-400 hover:ring-2 hover:ring-orange-100',
    bgTint: 'bg-orange-50/40',
    badgeBg: 'bg-orange-100 text-orange-800 border-orange-200',
    badgeText: 'Kitchen & Dining',
    actionText: 'text-orange-700',
    ringColor: 'ring-orange-400',
    groupedSubcategories: [
      {
        name: 'Cookware',
        items: ['Pots', 'Pans', 'Pressure Cookers', 'Frying Pans', 'Cooking Sets']
      },
      {
        name: 'Bakeware',
        items: ['Baking Trays', 'Cake Molds', 'Baking Tools']
      },
      {
        name: 'Kitchen Utensils',
        items: ['Spatulas', 'Spoons', 'Whisks', 'Tongs', 'Peelers', 'Graters']
      },
      {
        name: 'Knives',
        items: ['Kitchen Knives', 'Chef Knives', 'Knife Sets']
      },
      {
        name: 'Dinnerware',
        items: ['Plates', 'Bowls', 'Cups', 'Mugs', 'Saucers']
      },
      {
        name: 'Cutlery',
        items: ['Forks', 'Spoons', 'Knives', 'Cutlery Sets']
      },
      {
        name: 'Kitchen Storage',
        items: ['Containers', 'Jars', 'Food Storage', 'Spice Containers']
      },
      {
        name: 'Kitchen Appliances',
        items: ['Blenders', 'Mixers', 'Juicers', 'Toasters', 'Coffee Machines', 'Kettles', 'Rice Cookers', 'Air Fryers', 'Food Processors']
      }
    ],
    subcategories: [
      'Pots', 'Pans', 'Pressure Cookers', 'Frying Pans', 'Cooking Sets',
      'Baking Trays', 'Cake Molds', 'Baking Tools', 'Spatulas', 'Spoons',
      'Whisks', 'Tongs', 'Peelers', 'Graters', 'Kitchen Knives', 'Chef Knives',
      'Knife Sets', 'Plates', 'Bowls', 'Cups', 'Mugs', 'Saucers',
      'Forks', 'Cutlery Sets', 'Containers', 'Jars', 'Food Storage',
      'Spice Containers', 'Blenders', 'Mixers', 'Juicers', 'Toasters',
      'Coffee Machines', 'Kettles', 'Rice Cookers', 'Air Fryers', 'Food Processors'
    ],
    detailedSubcategories: [
      { name: 'Pots', groupName: 'Cookware', image: 'https://images.unsplash.com/photo-1584990347449-3997637d7e3e?w=500&auto=format&fit=crop&q=80', description: 'Stainless steel stockpots & Dutch ovens' },
      { name: 'Pans', groupName: 'Cookware', image: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=500&auto=format&fit=crop&q=80', description: 'Non-stick & seasoned cast iron skillets' },
      { name: 'Pressure Cookers', groupName: 'Cookware', image: 'https://images.unsplash.com/photo-1584990347449-3997637d7e3e?w=500&auto=format&fit=crop&q=80', description: 'Electric multi-cookers & stovetop cookers' },
      { name: 'Frying Pans', groupName: 'Cookware', image: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=500&auto=format&fit=crop&q=80', description: 'Granite & ceramic non-stick frypans' },
      { name: 'Cooking Sets', groupName: 'Cookware', image: 'https://images.unsplash.com/photo-1584990347449-3997637d7e3e?w=500&auto=format&fit=crop&q=80', description: '10-piece professional tri-ply sets' },
      { name: 'Baking Trays', groupName: 'Bakeware', image: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=500&auto=format&fit=crop&q=80', description: 'Aluminized non-stick sheet pans' },
      { name: 'Cake Molds', groupName: 'Bakeware', image: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=500&auto=format&fit=crop&q=80', description: 'Springform & silicone pastry tins' },
      { name: 'Kitchen Utensils', groupName: 'Utensils', image: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=500&auto=format&fit=crop&q=80', description: 'Heat-resistant silicone & teak spatulas' },
      { name: 'Chef Knives', groupName: 'Knives', image: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=500&auto=format&fit=crop&q=80', description: 'Hand-forged Japanese Damascus 8-inch' },
      { name: 'Knife Sets', groupName: 'Knives', image: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=500&auto=format&fit=crop&q=80', description: 'Block sets with honing rod & shears' },
      { name: 'Plates', groupName: 'Dinnerware', image: 'https://images.unsplash.com/photo-1614735241165-6756e1df61ab?w=500&auto=format&fit=crop&q=80', description: 'Porcelain dinner & salad sets' },
      { name: 'Bowls', groupName: 'Dinnerware', image: 'https://images.unsplash.com/photo-1614735241165-6756e1df61ab?w=500&auto=format&fit=crop&q=80', description: 'Hand-glazed stoneware soup bowls' },
      { name: 'Cups & Mugs', groupName: 'Dinnerware', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80', description: 'Double-walled insulated ceramic mugs' },
      { name: 'Cutlery Sets', groupName: 'Cutlery', image: 'https://images.unsplash.com/photo-1584990347449-3997637d7e3e?w=500&auto=format&fit=crop&q=80', description: 'Mirror polished 18/10 stainless silverware' },
      { name: 'Food Storage', groupName: 'Storage', image: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=500&auto=format&fit=crop&q=80', description: 'Airtight borosilicate glass containers' },
      { name: 'Spice Containers', groupName: 'Storage', image: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=500&auto=format&fit=crop&q=80', description: 'Magnetic revolving spice jar carousel' },
      { name: 'Blenders', groupName: 'Small Appliances', image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=500&auto=format&fit=crop&q=80', description: 'High-speed smoothie & ice blenders' },
      { name: 'Coffee Machines', groupName: 'Small Appliances', image: 'https://images.unsplash.com/photo-1517668808822-9ebb02ae2a0e?w=500&auto=format&fit=crop&q=80', description: '15-Bar Italian espresso & bean-to-cup' },
      { name: 'Air Fryers', groupName: 'Small Appliances', image: 'https://images.unsplash.com/photo-1585672840546-59d0473950b7?w=500&auto=format&fit=crop&q=80', description: 'Dual-zone digital convection fryers' },
      { name: 'Kettles', groupName: 'Small Appliances', image: 'https://images.unsplash.com/photo-1517668808822-9ebb02ae2a0e?w=500&auto=format&fit=crop&q=80', description: 'Gooseneck temperature-control kettles' },
      { name: 'Food Processors', groupName: 'Small Appliances', image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=500&auto=format&fit=crop&q=80', description: 'Multi-blade dough & shredding processors' }
    ]
  },

  // ==========================================
  // 4. BATHROOM
  // ==========================================
  {
    id: 'prod-cat-bathroom',
    name: 'Bathroom',
    slug: 'bathroom',
    iconName: 'Droplet',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=700&auto=format&fit=crop&q=80',
    tagline: 'Bathtubs, rain showers, faucets, vanities & fixtures',
    borderHover: 'hover:border-teal-400 hover:ring-2 hover:ring-teal-100',
    bgTint: 'bg-teal-50/40',
    badgeBg: 'bg-teal-100 text-teal-800 border-teal-200',
    badgeText: 'Bathroom Fixtures',
    actionText: 'text-teal-700',
    ringColor: 'ring-teal-400',
    subcategories: [
      'Bathtubs', 'Showers', 'Shower Systems', 'Toilets', 'Bidets',
      'Washbasins', 'Faucets', 'Bathroom Cabinets', 'Bathroom Mirrors',
      'Bathroom Shelves', 'Towel Racks', 'Bathroom Accessories', 'Bathroom Lighting', 'Bathroom Fixtures'
    ],
    detailedSubcategories: [
      { name: 'Bathtubs', groupName: 'Bathing & Spa', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=80', description: 'Freestanding modern acrylic soaking tubs' },
      { name: 'Showers', groupName: 'Bathing & Spa', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=80', description: 'Glass frameless walk-in shower enclosures' },
      { name: 'Shower Systems', groupName: 'Bathing & Spa', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=80', description: 'Thermostatic 12" rainfall & massage sprays' },
      { name: 'Toilets', groupName: 'Sanitary Ware', image: 'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=500&auto=format&fit=crop&q=80', description: 'One-piece dual flush & smart heated toilets' },
      { name: 'Bidets', groupName: 'Sanitary Ware', image: 'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=500&auto=format&fit=crop&q=80', description: 'Electric heated seat bidet attachments' },
      { name: 'Washbasins', groupName: 'Sinks & Vanities', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=80', description: 'Countertop ceramic vessel sinks' },
      { name: 'Faucets', groupName: 'Sinks & Vanities', image: 'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=500&auto=format&fit=crop&q=80', description: 'Waterfall matte black solid brass faucets' },
      { name: 'Bathroom Cabinets', groupName: 'Storage & Vanities', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=500&auto=format&fit=crop&q=80', description: 'Wall-mounted double sink vanity storage' },
      { name: 'Bathroom Mirrors', groupName: 'Storage & Vanities', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=500&auto=format&fit=crop&q=80', description: 'Anti-fog LED touch backlit mirrors' },
      { name: 'Bathroom Shelves', groupName: 'Hardware', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=80', description: 'Tempered glass shower corner caddies' },
      { name: 'Towel Racks', groupName: 'Hardware', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=80', description: 'Heated electric towel warmer bars' },
      { name: 'Bathroom Accessories', groupName: 'Hardware', image: 'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=500&auto=format&fit=crop&q=80', description: 'Dispensers, grab bars & brass drains' }
    ]
  },

  // ==========================================
  // 5. LIGHTING
  // ==========================================
  {
    id: 'prod-cat-lighting',
    name: 'Lighting',
    slug: 'lighting',
    iconName: 'Lightbulb',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=700&auto=format&fit=crop&q=80',
    tagline: 'Chandeliers, smart LEDs, table lamps, solar & outdoor',
    borderHover: 'hover:border-yellow-400 hover:ring-2 hover:ring-yellow-100',
    bgTint: 'bg-yellow-50/40',
    badgeBg: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    badgeText: 'Lighting & Smart',
    actionText: 'text-yellow-700',
    ringColor: 'ring-yellow-400',
    subcategories: [
      'Ceiling Lights', 'Chandeliers', 'Pendant Lights', 'Wall Lights', 'Table Lamps',
      'Floor Lamps', 'Desk Lamps', 'LED Lights', 'Smart Lights', 'Outdoor Lights',
      'Garden Lights', 'Street Lights', 'Emergency Lights', 'Decorative Lights',
      'Solar Lights', 'Light Bulbs', 'LED Strips', 'Lighting Accessories'
    ],
    detailedSubcategories: [
      { name: 'Chandeliers', groupName: 'Ceiling Lighting', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=80', description: 'Geometric ring & crystal statement pieces' },
      { name: 'Pendant Lights', groupName: 'Ceiling Lighting', image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=500&auto=format&fit=crop&q=80', description: 'Kitchen island brass & smoked glass cones' },
      { name: 'Ceiling Lights', groupName: 'Ceiling Lighting', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=80', description: 'Flush mount ultra-thin LED panels' },
      { name: 'Wall Lights', groupName: 'Wall & Sconces', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=80', description: 'Up-down architectural hallway sconces' },
      { name: 'Table Lamps', groupName: 'Lamps', image: 'https://images.unsplash.com/photo-1517991104123-1d56a6e81ed9?w=500&auto=format&fit=crop&q=80', description: 'Dimmable touch bedside ceramic lamps' },
      { name: 'Floor Lamps', groupName: 'Lamps', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=80', description: 'Arched brass reading floor fixtures' },
      { name: 'Desk Lamps', groupName: 'Lamps', image: 'https://images.unsplash.com/photo-1517991104123-1d56a6e81ed9?w=500&auto=format&fit=crop&q=80', description: 'Eye-caring LED clamp desk lights' },
      { name: 'Smart Lights', groupName: 'Smart & LED', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop&q=80', description: 'Color-changing Wi-Fi bulbs & scenes' },
      { name: 'LED Strips', groupName: 'Smart & LED', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop&q=80', description: 'RGBIC music sync addressable tape' },
      { name: 'Outdoor Lights', groupName: 'Outdoor & Solar', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=80', description: 'IP65 waterproof wall security lights' },
      { name: 'Solar Lights', groupName: 'Outdoor & Solar', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=80', description: 'Solar pathway & motion floodlights' }
    ]
  },

  // ==========================================
  // 6. ELECTRONICS
  // ==========================================
  {
    id: 'prod-cat-electronics',
    name: 'Electronics',
    slug: 'electronics',
    iconName: 'Cpu',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=700&auto=format&fit=crop&q=80',
    tagline: 'Circuits, modules, sensors, power supplies & components',
    borderHover: 'hover:border-purple-400 hover:ring-2 hover:ring-purple-100',
    bgTint: 'bg-purple-50/40',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
    badgeText: 'Electronics & Parts',
    actionText: 'text-purple-700',
    ringColor: 'ring-purple-400',
    subcategories: [
      'Electronic Devices', 'Electronic Components', 'Circuit Boards', 'Sensors',
      'Switches', 'Relays', 'Connectors', 'Adapters', 'Electronic Modules',
      'Power Supplies', 'Batteries', 'Cables', 'Chargers', 'Electronic Accessories'
    ],
    detailedSubcategories: [
      { name: 'Electronic Devices', groupName: 'Hardware', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80', description: 'Microcontrollers & programmable devices' },
      { name: 'Circuit Boards', groupName: 'Hardware', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80', description: 'FR-4 prototype & printed PCB boards' },
      { name: 'Sensors', groupName: 'Components', image: 'https://images.unsplash.com/photo-1558441719-8b489c63f7d1?w=500&auto=format&fit=crop&q=80', description: 'PIR motion, temperature & ultrasonic' },
      { name: 'Power Supplies', groupName: 'Power & Voltage', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80', description: 'Benchtop variable 0-30V 10A DC supplies' },
      { name: 'Batteries', groupName: 'Power & Voltage', image: 'https://images.unsplash.com/photo-1558611848-73f7eb4001a1?w=500&auto=format&fit=crop&q=80', description: 'Rechargeable 18650 & LiPo battery packs' },
      { name: 'Cables & Adapters', groupName: 'Connectivity', image: 'https://images.unsplash.com/photo-1558611848-73f7eb4001a1?w=500&auto=format&fit=crop&q=80', description: 'Shielded USB-C, ribbon & terminal leads' }
    ]
  },

  // ==========================================
  // 7. MOBILE PHONES & ACCESSORIES
  // ==========================================
  {
    id: 'prod-cat-mobile-phones',
    name: 'Mobile Phones & Accessories',
    slug: 'mobile-phones',
    iconName: 'Smartphone',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=700&auto=format&fit=crop&q=80',
    tagline: 'Smartphones, smart watches, chargers, cases & mounts',
    borderHover: 'hover:border-indigo-400 hover:ring-2 hover:ring-indigo-100',
    bgTint: 'bg-indigo-50/40',
    badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    badgeText: 'Mobile & Gear',
    actionText: 'text-indigo-700',
    ringColor: 'ring-indigo-400',
    subcategories: [
      'Smartphones', 'Feature Phones', 'Tablets', 'Smart Watches', 'Phone Cases',
      'Screen Protectors', 'Chargers', 'Wireless Chargers', 'Power Banks', 'Phone Cables',
      'Phone Holders', 'Car Phone Mounts', 'Selfie Sticks', 'Mobile Accessories', 'Tablet Accessories'
    ],
    detailedSubcategories: [
      { name: 'Smartphones', groupName: 'Devices', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=80', description: '5G unlocked flagship & durable phones' },
      { name: 'Tablets', groupName: 'Devices', image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop&q=80', description: '11-inch OLED creative drawing tablets' },
      { name: 'Smart Watches', groupName: 'Wearables', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80', description: 'Fitness GPS tracking & ECG monitors' },
      { name: 'Phone Cases', groupName: 'Protection', image: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=500&auto=format&fit=crop&q=80', description: 'Military drop-tested MagSafe armor' },
      { name: 'Wireless Chargers', groupName: 'Charging', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=80', description: '3-in-1 fast Qi2 magnetic charge stands' },
      { name: 'Power Banks', groupName: 'Charging', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=80', description: '20,000mAh 65W laptop portable chargers' },
      { name: 'Car Phone Mounts', groupName: 'Mounts', image: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=500&auto=format&fit=crop&q=80', description: 'Automatic clamping air-vent holders' }
    ]
  },

  // ==========================================
  // 8. COMPUTERS & ACCESSORIES
  // ==========================================
  {
    id: 'prod-cat-computers',
    name: 'Computers & Accessories',
    slug: 'computers',
    iconName: 'Monitor',
    image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=700&auto=format&fit=crop&q=80',
    tagline: 'Laptops, monitors, ergonomic keyboards, docks & printers',
    borderHover: 'hover:border-slate-400 hover:ring-2 hover:ring-slate-100',
    bgTint: 'bg-slate-50/50',
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-200',
    badgeText: 'Computers & Setup',
    actionText: 'text-slate-700',
    ringColor: 'ring-slate-400',
    subcategories: [
      'Desktop Computers', 'Laptops', 'Workstations', 'Mini PCs', 'Servers',
      'Monitors', 'Keyboards', 'Mice', 'Webcams', 'Printers', 'Scanners',
      'Projectors', 'Computer Speakers', 'Headsets', 'Graphics Tablets', 'USB Hubs',
      'Docking Stations', 'Laptop Stands', 'Computer Accessories'
    ],
    detailedSubcategories: [
      { name: 'Laptops', groupName: 'Computers', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&auto=format&fit=crop&q=80', description: 'High-performance ultra-thin & creator PCs' },
      { name: 'Monitors', groupName: 'Displays', image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=80', description: '4K IPS 144Hz color-accurate displays' },
      { name: 'Keyboards', groupName: 'Peripherals', image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=80', description: 'Gasket-mounted hot-swap mechanical decks' },
      { name: 'Mice', groupName: 'Peripherals', image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=80', description: 'Ergonomic vertical wireless precision mice' },
      { name: 'Docking Stations', groupName: 'Peripherals', image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=500&auto=format&fit=crop&q=80', description: '12-in-1 Triple 4K Display Thunderbolt docks' },
      { name: 'Webcams', groupName: 'Video & Audio', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=80', description: '4K AI auto-framing conference cameras' }
    ]
  },

  // ==========================================
  // 9. COMPUTER COMPONENTS
  // ==========================================
  {
    id: 'prod-cat-computer-components',
    name: 'Computer Components',
    slug: 'computer-components',
    iconName: 'HardDrive',
    image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=700&auto=format&fit=crop&q=80',
    tagline: 'CPUs, GPUs, motherboards, NVMe SSDs, RAM & cooling',
    borderHover: 'hover:border-rose-400 hover:ring-2 hover:ring-rose-100',
    bgTint: 'bg-rose-50/40',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
    badgeText: 'PC Hardware',
    actionText: 'text-rose-700',
    ringColor: 'ring-rose-400',
    subcategories: [
      'CPUs', 'GPUs', 'Motherboards', 'RAM', 'SSDs', 'HDDs',
      'Power Supplies', 'PC Cases', 'Cooling Systems', 'CPU Coolers',
      'Case Fans', 'Network Cards', 'Sound Cards', 'Capture Cards',
      'Computer Cables', 'Thermal Paste', 'PC Accessories'
    ],
    detailedSubcategories: [
      { name: 'CPUs', groupName: 'Processing', image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=500&auto=format&fit=crop&q=80', description: 'Multi-core unlocked desktop processors' },
      { name: 'GPUs', groupName: 'Graphics', image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500&auto=format&fit=crop&q=80', description: 'Ray-tracing dedicated graphics cards' },
      { name: 'Motherboards', groupName: 'Motherboards', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80', description: 'ATX Wi-Fi 6E reinforced boards' },
      { name: 'RAM', groupName: 'Memory & Storage', image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=500&auto=format&fit=crop&q=80', description: 'DDR5 6000MHz low-latency kits' },
      { name: 'SSDs', groupName: 'Memory & Storage', image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=500&auto=format&fit=crop&q=80', description: 'PCIe 4.0 NVMe M.2 7450MB/s storage' },
      { name: 'Cooling Systems', groupName: 'Thermal', image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500&auto=format&fit=crop&q=80', description: '360mm ARGB liquid AIO coolers' }
    ]
  },

  // ==========================================
  // 10. TV, AUDIO & VIDEO
  // ==========================================
  {
    id: 'prod-cat-tv-audio-video',
    name: 'TV, Audio & Video',
    slug: 'tv-audio-video',
    iconName: 'Speaker',
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=700&auto=format&fit=crop&q=80',
    tagline: 'Smart 4K TVs, home theater soundbars, ANC headphones',
    borderHover: 'hover:border-violet-400 hover:ring-2 hover:ring-violet-100',
    bgTint: 'bg-violet-50/40',
    badgeBg: 'bg-violet-100 text-violet-800 border-violet-200',
    badgeText: 'Audio & Visual',
    actionText: 'text-violet-700',
    ringColor: 'ring-violet-400',
    subcategories: [
      'Televisions', 'Smart TVs', 'Projectors', 'Soundbars', 'Home Theater Systems',
      'Speakers', 'Bluetooth Speakers', 'Amplifiers', 'Receivers', 'Subwoofers',
      'Headphones', 'Earphones', 'Earbuds', 'Microphones', 'Media Players',
      'Streaming Devices', 'Remote Controls', 'Audio Cables'
    ],
    detailedSubcategories: [
      { name: 'Televisions', groupName: 'Displays', image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&auto=format&fit=crop&q=80', description: '65" 4K OLED Dolby Vision smart TVs' },
      { name: 'Soundbars', groupName: 'Audio Systems', image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&auto=format&fit=crop&q=80', description: 'Dolby Atmos 5.1 wireless surround bars' },
      { name: 'Speakers', groupName: 'Audio Systems', image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&auto=format&fit=crop&q=80', description: 'Hi-Fi bookshelf stereo studio monitors' },
      { name: 'Headphones', groupName: 'Personal Audio', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80', description: 'Active noise-canceling over-ear studio' },
      { name: 'Microphones', groupName: 'Personal Audio', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=80', description: 'Cardioid studio USB condenser mics' }
    ]
  },

  // ==========================================
  // 11. CAMERAS & PHOTOGRAPHY
  // ==========================================
  {
    id: 'prod-cat-cameras-photography',
    name: 'Cameras & Photography',
    slug: 'cameras-photography',
    iconName: 'Camera',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=700&auto=format&fit=crop&q=80',
    tagline: 'Mirrorless cameras, lenses, 3-axis gimbals, tripods & lights',
    borderHover: 'hover:border-amber-400 hover:ring-2 hover:ring-amber-100',
    bgTint: 'bg-amber-50/40',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
    badgeText: 'Pro Photography',
    actionText: 'text-amber-700',
    ringColor: 'ring-amber-400',
    subcategories: [
      'Digital Cameras', 'DSLR Cameras', 'Mirrorless Cameras', 'Action Cameras',
      'Instant Cameras', 'Security Cameras', 'Camera Lenses', 'Camera Bags',
      'Tripods', 'Monopods', 'Gimbals', 'Camera Lights', 'Flashes'
    ],
    detailedSubcategories: [
      { name: 'Digital Cameras', groupName: 'Cameras', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=80', description: 'Full-frame 4K video & 45MP photo' },
      { name: 'Camera Lenses', groupName: 'Optics', image: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=500&auto=format&fit=crop&q=80', description: '24-70mm f/2.8 constant aperture zooms' },
      { name: 'Gimbals', groupName: 'Stabilizers', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=80', description: '3-Axis carbon fiber camera stabilizers' },
      { name: 'Tripods', groupName: 'Mounts & Lighting', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=80', description: 'Carbon fiber travel fluid head tripods' }
    ]
  }
];

export function getProductCategoryById(id: string): ProductCategoryConfig | undefined {
  return PRODUCT_CATEGORIES.find(c => c.id === id);
}

export function searchProductCategories(query: string): ProductCategoryConfig[] {
  if (!query.trim()) return PRODUCT_CATEGORIES;
  const q = query.toLowerCase().trim();
  return PRODUCT_CATEGORIES.filter(cat => {
    if (cat.name.toLowerCase().includes(q)) return true;
    if (cat.tagline.toLowerCase().includes(q)) return true;
    return cat.subcategories.some(sub => sub.toLowerCase().includes(q));
  });
}
