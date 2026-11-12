export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  rate: number; // Against USD (1 USD = rate in target currency)
  flag: string;
}

export const ALL_CURRENCIES: CurrencyInfo[] = [
  // Major Global & Americas
  { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.0, flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.92, flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.79, flag: '🇬🇧' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', rate: 1.36, flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rate: 1.52, flag: '🇦🇺' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', rate: 5.15, flag: '🇧🇷' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$', rate: 16.80, flag: '🇲🇽' },
  { code: 'ARS', name: 'Argentine Peso', symbol: 'ARS$', rate: 880.0, flag: '🇦🇷' },
  { code: 'BOB', name: 'Bolivian Boliviano', symbol: 'Bs', rate: 6.91, flag: '🇧🇴' },
  { code: 'CLP', name: 'Chilean Peso', symbol: 'CLP$', rate: 930.0, flag: '🇨🇱' },
  { code: 'COP', name: 'Colombian Peso', symbol: 'COL$', rate: 3850.0, flag: '🇨🇴' },
  { code: 'CRC', name: 'Costa Rican Colón', symbol: '₡', rate: 512.0, flag: '🇨🇷' },
  { code: 'DOP', name: 'Dominican Peso', symbol: 'RD$', rate: 58.50, flag: '🇩🇴' },
  { code: 'GTQ', name: 'Guatemalan Quetzal', symbol: 'Q', rate: 7.78, flag: '🇬🇹' },
  { code: 'HNL', name: 'Honduran Lempira', symbol: 'L', rate: 24.65, flag: '🇭🇳' },
  { code: 'JMD', name: 'Jamaican Dollar', symbol: 'J$', rate: 156.0, flag: '🇯🇲' },
  { code: 'NIO', name: 'Nicaraguan Córdoba', symbol: 'C$', rate: 36.80, flag: '🇳🇮' },
  { code: 'PAB', name: 'Panamanian Balboa', symbol: 'B/.', rate: 1.0, flag: '🇵🇦' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', rate: 3.74, flag: '🇵🇪' },
  { code: 'PYG', name: 'Paraguayan Guaraní', symbol: '₲', rate: 7550.0, flag: '🇵🇾' },
  { code: 'TTD', name: 'Trinidad and Tobago Dollar', symbol: 'TT$', rate: 6.78, flag: '🇹🇹' },
  { code: 'UYU', name: 'Uruguayan Peso', symbol: '$U', rate: 38.60, flag: '🇺🇾' },
  { code: 'VES', name: 'Venezuelan Bolívar', symbol: 'Bs.', rate: 36.40, flag: '🇻🇪' },
  { code: 'BBD', name: 'Barbadian Dollar', symbol: 'Bds$', rate: 2.0, flag: '🇧🇧' },
  { code: 'BSD', name: 'Bahamian Dollar', symbol: 'B$', rate: 1.0, flag: '🇧🇸' },
  { code: 'BZD', name: 'Belize Dollar', symbol: 'BZ$', rate: 2.0, flag: '🇧🇿' },
  { code: 'GYD', name: 'Guyanese Dollar', symbol: 'G$', rate: 209.0, flag: '🇬🇾' },
  { code: 'HTG', name: 'Haitian Gourde', symbol: 'G', rate: 132.0, flag: '🇭🇹' },
  { code: 'SRD', name: 'Surinamese Dollar', symbol: 'Sr$', rate: 31.5, flag: '🇸🇷' },
  { code: 'XCD', name: 'East Caribbean Dollar', symbol: 'EC$', rate: 2.70, flag: '🇦🇬' },

  // Asia & Pacific
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 155.0, flag: '🇯🇵' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rate: 7.24, flag: '🇨🇳' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', rate: 83.50, flag: '🇮🇳' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', rate: 1370.0, flag: '🇰🇷' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', rate: 1.35, flag: '🇸🇬' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', rate: 7.82, flag: '🇭🇰' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', rate: 1.64, flag: '🇳🇿' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', rate: 16200.0, flag: '🇮🇩' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', rate: 4.70, flag: '🇲🇾' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', rate: 58.0, flag: '🇵🇭' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', rate: 36.50, flag: '🇹🇭' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', rate: 25400.0, flag: '🇻🇳' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', rate: 278.0, flag: '🇵🇰' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', rate: 117.0, flag: '🇧🇩' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', rate: 302.0, flag: '🇱🇰' },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: 'रू', rate: 133.5, flag: '🇳🇵' },
  { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸', rate: 448.0, flag: '🇰🇿' },
  { code: 'UZS', name: 'Uzbekistani Som', symbol: 'so\'m', rate: 12650.0, flag: '🇺🇿' },
  { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$', rate: 32.40, flag: '🇹🇼' },
  { code: 'AFN', name: 'Afghan Afghani', symbol: '؋', rate: 72.0, flag: '🇦🇫' },
  { code: 'AMD', name: 'Armenian Dram', symbol: '֏', rate: 388.0, flag: '🇦🇲' },
  { code: 'AZN', name: 'Azerbaijani Manat', symbol: '₼', rate: 1.70, flag: '🇦🇿' },
  { code: 'BND', name: 'Brunei Dollar', symbol: 'B$', rate: 1.35, flag: '🇧🇳' },
  { code: 'KHR', name: 'Cambodian Riel', symbol: '៛', rate: 4080.0, flag: '🇰🇭' },
  { code: 'FJD', name: 'Fijian Dollar', symbol: 'FJ$', rate: 2.25, flag: '🇫🇯' },
  { code: 'GEL', name: 'Georgian Lari', symbol: '₾', rate: 2.75, flag: '🇬🇪' },
  { code: 'KGS', name: 'Kyrgyzstani Som', symbol: 'с', rate: 89.0, flag: '🇰🇬' },
  { code: 'LAK', name: 'Lao Kip', symbol: '₭', rate: 21600.0, flag: '🇱🇦' },
  { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K', rate: 2100.0, flag: '🇲🇲' },
  { code: 'MNT', name: 'Mongolian Tugrik', symbol: '₮', rate: 3450.0, flag: '🇲🇳' },
  { code: 'MOP', name: 'Macanese Pataca', symbol: 'MOP$', rate: 8.05, flag: '🇲🇴' },
  { code: 'MVR', name: 'Maldivian Rufiyaa', symbol: 'Rf', rate: 15.4, flag: '🇲🇻' },
  { code: 'PGK', name: 'Papua New Guinean Kina', symbol: 'K', rate: 3.85, flag: '🇵🇬' },
  { code: 'TJS', name: 'Tajikistani Somoni', symbol: 'SM', rate: 10.9, flag: '🇹🇯' },
  { code: 'VUV', name: 'Vanuatu Vatu', symbol: 'VT', rate: 120.0, flag: '🇻🇺' },
  { code: 'WST', name: 'Samoan Tala', symbol: 'WS$', rate: 2.75, flag: '🇼🇸' },

  // Middle East
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED', rate: 3.67, flag: '🇦🇪' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', rate: 3.75, flag: '🇸🇦' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'QAR', rate: 3.64, flag: '🇶🇦' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KWD', rate: 0.31, flag: '🇰🇼' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BHD', rate: 0.38, flag: '🇧🇭' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'OMR', rate: 0.385, flag: '🇴🇲' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', rate: 3.72, flag: '🇮🇱' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', rate: 32.50, flag: '🇹🇷' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'JD', rate: 0.71, flag: '🇯🇴' },
  { code: 'IQD', name: 'Iraqi Dinar', symbol: 'IQD', rate: 1310.0, flag: '🇮🇶' },
  { code: 'LBP', name: 'Lebanese Pound', symbol: 'L£', rate: 89500.0, flag: '🇱🇧' },
  { code: 'YER', name: 'Yemeni Rial', symbol: 'YR', rate: 250.0, flag: '🇾🇪' },

  // Europe
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', rate: 0.90, flag: '🇨🇭' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', rate: 10.60, flag: '🇸🇪' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', rate: 10.70, flag: '🇳🇴' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', rate: 6.85, flag: '🇩🇰' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', rate: 3.95, flag: '🇵🇱' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', rate: 23.10, flag: '🇨🇿' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', rate: 360.0, flag: '🇭🇺' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei', rate: 4.58, flag: '🇷🇴' },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', rate: 1.80, flag: '🇧🇬' },
  { code: 'ISK', name: 'Icelandic Króna', symbol: 'kr', rate: 138.0, flag: '🇮🇸' },
  { code: 'RSD', name: 'Serbian Dinar', symbol: 'din', rate: 108.0, flag: '🇷🇸' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', rate: 40.50, flag: '🇺🇦' },
  { code: 'ALL', name: 'Albanian Lek', symbol: 'L', rate: 93.5, flag: '🇦🇱' },
  { code: 'BAM', name: 'Bosnia-Herzegovina Mark', symbol: 'KM', rate: 1.80, flag: '🇧🇦' },
  { code: 'MKD', name: 'Macedonian Denar', symbol: 'den', rate: 56.5, flag: '🇲🇰' },
  { code: 'MDL', name: 'Moldovan Leu', symbol: 'L', rate: 17.7, flag: '🇲🇩' },

  // Africa
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', rate: 18.20, flag: '🇿🇦' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', rate: 1420.0, flag: '🇳🇬' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', rate: 47.50, flag: '🇪🇬' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', rate: 132.0, flag: '🇰🇪' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', rate: 14.80, flag: '🇬🇭' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', rate: 2600.0, flag: '🇹🇿' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', rate: 3750.0, flag: '🇺🇬' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'MAD', rate: 9.95, flag: '🇲🇦' },
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'DA', rate: 134.0, flag: '🇩🇿' },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', rate: 57.50, flag: '🇪🇹' },
  { code: 'AOA', name: 'Angolan Kwanza', symbol: 'Kz', rate: 850.0, flag: '🇦🇴' },
  { code: 'BWP', name: 'Botswana Pula', symbol: 'P', rate: 13.6, flag: '🇧🇼' },
  { code: 'CDF', name: 'Congolese Franc', symbol: 'FC', rate: 2800.0, flag: '🇨🇩' },
  { code: 'CVE', name: 'Cape Verdean Escudo', symbol: 'Esc', rate: 101.5, flag: '🇨🇻' },
  { code: 'DJF', name: 'Djiboutian Franc', symbol: 'Fdj', rate: 177.7, flag: '🇩🇯' },
  { code: 'GMD', name: 'Gambian Dalasi', symbol: 'D', rate: 68.0, flag: '🇬🇲' },
  { code: 'GNF', name: 'Guinean Franc', symbol: 'FG', rate: 8600.0, flag: '🇬🇳' },
  { code: 'LRD', name: 'Liberian Dollar', symbol: 'L$', rate: 194.0, flag: '🇱🇷' },
  { code: 'LSL', name: 'Lesotho Loti', symbol: 'L', rate: 18.2, flag: '🇱🇸' },
  { code: 'LYD', name: 'Libyan Dinar', symbol: 'LD', rate: 4.85, flag: '🇱🇾' },
  { code: 'MGA', name: 'Malagasy Ariary', symbol: 'Ar', rate: 4500.0, flag: '🇲🇬' },
  { code: 'MRU', name: 'Mauritanian Ouguiya', symbol: 'UM', rate: 39.5, flag: '🇲🇷' },
  { code: 'MUR', name: 'Mauritian Rupee', symbol: '₨', rate: 46.5, flag: '🇲🇺' },
  { code: 'MWK', name: 'Malawian Kwacha', symbol: 'MK', rate: 1730.0, flag: '🇲🇼' },
  { code: 'MZN', name: 'Mozambican Metical', symbol: 'MT', rate: 63.8, flag: '🇲🇿' },
  { code: 'NAD', name: 'Namibian Dollar', symbol: 'N$', rate: 18.2, flag: '🇳🇦' },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'FRw', rate: 1300.0, flag: '🇷🇼' },
  { code: 'SCR', name: 'Seychellois Rupee', symbol: 'SR', rate: 13.8, flag: '🇸🇨' },
  { code: 'SLE', name: 'Sierra Leonean Leone', symbol: 'Le', rate: 22.5, flag: '🇸🇱' },
  { code: 'SOS', name: 'Somali Shilling', symbol: 'Sh.So.', rate: 571.0, flag: '🇸🇴' },
  { code: 'SZL', name: 'Swazi Lilangeni', symbol: 'E', rate: 18.2, flag: '🇸🇿' },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'DT', rate: 3.12, flag: '🇹🇳' },
  { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA', rate: 603.5, flag: '🇨🇲' },
  { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA', rate: 603.5, flag: '🇸🇳' },
  { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK', rate: 26.5, flag: '🇿🇲' },
  { code: 'BIF', name: 'Burundian Franc', symbol: 'FBu', rate: 2870.0, flag: '🇧🇮' },
  { code: 'BTN', name: 'Bhutanese Ngultrum', symbol: 'Nu.', rate: 83.5, flag: '🇧🇹' },
  { code: 'ERN', name: 'Eritrean Nakfa', symbol: 'Nfk', rate: 15.0, flag: '🇪🇷' },
  { code: 'KMF', name: 'Comorian Franc', symbol: 'CF', rate: 455.0, flag: '🇰🇲' },
  { code: 'SBD', name: 'Solomon Islands Dollar', symbol: 'SI$', rate: 8.5, flag: '🇸🇧' },
  { code: 'STN', name: 'São Tomé & Príncipe Dobra', symbol: 'Db', rate: 22.8, flag: '🇸🇹' },
  { code: 'SYP', name: 'Syrian Pound', symbol: 'LS', rate: 13000.0, flag: '🇸🇾' },
  { code: 'TMT', name: 'Turkmenistani Manat', symbol: 'm', rate: 3.5, flag: '🇹🇲' },
  { code: 'TOP', name: 'Tongan Paʻanga', symbol: 'T$', rate: 2.38, flag: '🇹🇴' },
  { code: 'ZWL', name: 'Zimbabwean Dollar', symbol: 'Z$', rate: 26.0, flag: '🇿🇼' }
];

export function getCurrency(code = 'USD'): CurrencyInfo {
  return ALL_CURRENCIES.find((c) => c.code === code) || ALL_CURRENCIES[0];
}

export function detectUserCurrency(countryCode?: string, lat?: number, lng?: number): string {
  try {
    const saved = localStorage.getItem('servexa_currency');
    if (saved && ALL_CURRENCIES.some(c => c.code === saved)) {
      return saved;
    }

    if (countryCode) {
      const cc = countryCode.toUpperCase();
      if (cc === 'TH') return 'THB';
      if (cc === 'US') return 'USD';
      if (cc === 'GB') return 'GBP';
      if (cc === 'JP') return 'JPY';
      if (cc === 'IN') return 'INR';
      if (cc === 'AE') return 'AED';
      if (cc === 'SA') return 'SAR';
      if (cc === 'CA') return 'CAD';
      if (cc === 'AU') return 'AUD';
      if (['FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI', 'GR'].includes(cc)) return 'EUR';
    }

    // Latitude / Longitude approximate country bounding boxes if provided
    if (typeof lat === 'number' && typeof lng === 'number') {
      // Thailand (approx 5.6 to 20.5 N, 97.3 to 105.7 E)
      if (lat >= 5.6 && lat <= 20.5 && lng >= 97.3 && lng <= 105.7) return 'THB';
      // Continental Europe (approx 35 to 70 N, -10 to 35 E)
      if (lat >= 35 && lat <= 65 && lng >= -10 && lng <= 30) return 'EUR';
      // UK (approx 49 to 60 N, -8 to 2 E)
      if (lat >= 49 && lat <= 60 && lng >= -8 && lng <= 2) return 'GBP';
      // USA (approx 24 to 50 N, -125 to -66 W)
      if (lat >= 24 && lat <= 50 && lng >= -125 && lng <= -66) return 'USD';
    }

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Bangkok') || tz.includes('Thailand')) return 'THB';
    if (tz.includes('Karachi') || tz.includes('Pakistan')) return 'PKR';
    if (tz.includes('Kolkata') || tz.includes('Calcutta') || tz.includes('India')) return 'INR';
    if (tz.includes('London')) return 'GBP';
    if (tz.includes('Dubai')) return 'AED';
    if (tz.includes('Riyadh')) return 'SAR';
    if (tz.includes('Dhaka')) return 'BDT';
    if (tz.includes('Toronto') || tz.includes('Vancouver') || tz.includes('Montreal')) return 'CAD';
    if (tz.includes('Sydney') || tz.includes('Melbourne') || tz.includes('Brisbane')) return 'AUD';
    if (tz.includes('Tokyo')) return 'JPY';
    if (tz.includes('Singapore')) return 'SGD';
    if (tz.includes('Manila')) return 'PHP';
    if (tz.includes('Jakarta')) return 'IDR';
    if (tz.includes('Lagos')) return 'NGN';
    if (tz.includes('Cairo')) return 'EGP';
    if (tz.includes('Johannesburg')) return 'ZAR';
    if (tz.includes('Sao_Paulo')) return 'BRL';
    if (tz.includes('Mexico')) return 'MXN';
    if (tz.includes('Zurich')) return 'CHF';
    if (tz.includes('Stockholm')) return 'SEK';
    if (tz.includes('Oslo')) return 'NOK';
    if (tz.includes('Paris') || tz.includes('Berlin') || tz.includes('Rome') || tz.includes('Madrid') || tz.includes('Amsterdam') || tz.includes('Brussels') || tz.includes('Vienna') || tz.includes('Europe/')) return 'EUR';
    if (tz.includes('New_York') || tz.includes('Chicago') || tz.includes('Los_Angeles') || tz.includes('Denver') || tz.includes('America/')) return 'USD';

    // Also check locale
    const lang = (navigator.language || '').toLowerCase();
    if (lang.includes('th')) return 'THB';
    if (lang.includes('pk') || lang.includes('ur')) return 'PKR';
    if (lang.includes('in') || lang.includes('hi')) return 'INR';
    if (lang.includes('gb') || lang.endsWith('-gb')) return 'GBP';
    if (lang.includes('ca')) return 'CAD';
    if (lang.includes('au')) return 'AUD';
    if (lang.includes('de') || lang.includes('fr') || lang.includes('it') || lang.includes('es') || lang.includes('nl') || lang.includes('pt')) return 'EUR';
    if (lang.includes('jp') || lang.includes('ja')) return 'JPY';
    if (lang.endsWith('-us') || lang === 'en-us') return 'USD';
  } catch (e) {
    // fallback
  }

  return 'USD';
}

export function formatPrice(amountInUSD: number, currencyCode = 'USD'): string {
  const curr = getCurrency(currencyCode);
  const converted = amountInUSD * curr.rate;
  
  if (curr.rate >= 100) {
    return `${curr.symbol} ${Math.round(converted).toLocaleString()}`;
  }
  return `${curr.symbol} ${converted.toFixed(2)}`;
}

export const formatCurrency = formatPrice;

