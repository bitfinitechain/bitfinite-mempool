export const defaultMempoolFeeColors = [
  '0644f1',
  '0c43f1',
  '1243f1',
  '1942f0',
  '1f42f0',
  '2541f0',
  '2b41f0',
  '3140f0',
  '3840ef',
  '3e3fef',
  '443fef',
  '4a3eef',
  '513eee',
  '573dee',
  '5d3dee',
  '633cee',
  '693cee',
  '703bed',
  '763bed',
  '7c3aed',
  '823be4',
  '883bdb',
  '8e3cd2',
  '943cc9',
  '9a3dc1',
  'a03db8',
  'a63eaf',
  'ac3ea6',
  'b23f9d',
  'b93f94',
  'bf408b',
  'c54082',
  'cb4179',
  'd14170',
  'd74268',
  'dd425f',
  'e34356',
  'e9434d',
  'ef4444',
];

export const contrastMempoolFeeColors = [
  '0644f1',
  '0c43f1',
  '1243f1',
  '1942f0',
  '1f42f0',
  '2541f0',
  '2b41f0',
  '3140f0',
  '3840ef',
  '3e3fef',
  '443fef',
  '4a3eef',
  '513eee',
  '573dee',
  '5d3dee',
  '633cee',
  '693cee',
  '703bed',
  '763bed',
  '7c3aed',
  '823be4',
  '883bdb',
  '8e3cd2',
  '943cc9',
  '9a3dc1',
  'a03db8',
  'a63eaf',
  'ac3ea6',
  'b23f9d',
  'b93f94',
  'bf408b',
  'c54082',
  'cb4179',
  'd14170',
  'd74268',
  'dd425f',
  'e34356',
  'e9434d',
  'ef4444',
];

export const lightMempoolFeeColors = [
  '0644f1',
  '0c43f1',
  '1243f1',
  '1942f0',
  '1f42f0',
  '2541f0',
  '2b41f0',
  '3140f0',
  '3840ef',
  '3e3fef',
  '443fef',
  '4a3eef',
  '513eee',
  '573dee',
  '5d3dee',
  '633cee',
  '693cee',
  '703bed',
  '763bed',
  '7c3aed',
  '823be4',
  '883bdb',
  '8e3cd2',
  '943cc9',
  '9a3dc1',
  'a03db8',
  'a63eaf',
  'ac3ea6',
  'b23f9d',
  'b93f94',
  'bf408b',
  'c54082',
  'cb4179',
  'd14170',
  'd74268',
  'dd425f',
  'e34356',
  'e9434d',
  'ef4444',
];

export const chartColors = [
  '#A81524',
  '#D81B60',
  '#8E24AA',
  '#5E35B1',
  '#3949AB',
  '#1E88E5',
  '#039BE5',
  '#00ACC1',
  '#00897B',
  '#43A047',
  '#7CB342',
  '#C0CA33',
  '#FDD835',
  '#FFB300',
  '#FB8C00',
  '#F4511E',
  '#6D4C41',
  '#757575',
  '#546E7A',
  '#b71c1c',
  '#880E4F',
  '#4A148C',
  '#311B92',
  '#1A237E',
  '#0D47A1',
  '#01579B',
  '#006064',
  '#004D40',
  '#1B5E20',
  '#33691E',
  '#827717',
  '#F57F17',
  '#FF6F00',
  '#E65100',
  '#BF360C',
  '#3E2723',
  '#212121',
  '#263238',
  '#801313',
];
export const originalChartColors = chartColors.slice(1);

export const poolsColor = {
  unknown: '#FDD835',
};

export const feeLevels = [
  0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100, 125,
  150, 175, 200, 250, 300, 350, 400, 500, 600, 700, 800, 900, 1000, 1200, 1400,
  1600, 1800, 2000,
];

export interface Language {
  code: string;
  name: string;
}

export const languages: Language[] = [
  { code: 'ar', name: 'العربية' }, // Arabic
  // { code: 'bg', name: 'Български' },       // Bulgarian
  // { code: 'bs', name: 'Bosanski' },        // Bosnian
  // { code: 'ca', name: 'Català' },          // Catalan
  { code: 'cs', name: 'Čeština' }, // Czech
  { code: 'da', name: 'Dansk' }, // Danish
  { code: 'de', name: 'Deutsch' }, // German
  // { code: 'et', name: 'Eesti' },           // Estonian
  // { code: 'el', name: 'Ελληνικά' },        // Greek
  { code: 'en-US', name: 'English' }, // English
  { code: 'es', name: 'Español' }, // Spanish
  // { code: 'eo', name: 'Esperanto' },       // Esperanto
  // { code: 'eu', name: 'Euskara' },         // Basque
  { code: 'fa', name: 'فارسی' }, // Persian
  { code: 'fr', name: 'Français' }, // French
  // { code: 'gl', name: 'Galego' },          // Galician
  { code: 'ko', name: '한국어' }, // Korean
  { code: 'hr', name: 'Hrvatski' }, // Croatian
  // { code: 'id', name: 'Bahasa Indonesia' },// Indonesian
  { code: 'hi', name: 'हिन्दी' }, // Hindi
  { code: 'ne', name: 'नेपाली' }, // Nepalese
  { code: 'it', name: 'Italiano' }, // Italian
  { code: 'he', name: 'עברית' }, // Hebrew
  { code: 'ka', name: 'ქართული' }, // Georgian
  // { code: 'lv', name: 'Latviešu' },        // Latvian
  { code: 'lt', name: 'Lietuvių' }, // Lithuanian
  { code: 'hu', name: 'Magyar' }, // Hungarian
  { code: 'mk', name: 'Македонски' }, // Macedonian
  // { code: 'ms', name: 'Bahasa Melayu' },   // Malay
  { code: 'nl', name: 'Nederlands' }, // Dutch
  { code: 'ja', name: '日本語' }, // Japanese
  { code: 'nb', name: 'Norsk' }, // Norwegian Bokmål
  // { code: 'nn', name: 'Norsk Nynorsk' }, // Norwegian Nynorsk
  { code: 'pl', name: 'Polski' }, // Polish
  { code: 'pt', name: 'Português' }, // Portuguese
  // { code: 'pt-BR', name: 'Português (Brazil)' }, // Portuguese (Brazil)
  { code: 'ro', name: 'Română' }, // Romanian
  { code: 'ru', name: 'Русский' }, // Russian
  // { code: 'sk', name: 'Slovenčina' },      // Slovak
  { code: 'sl', name: 'Slovenščina' }, // Slovenian
  // { code: 'sr', name: 'Српски / srpski' }, // Serbian
  // { code: 'sh', name: 'Srpskohrvatski / српскохрватски' },// Serbo-Croatian
  { code: 'fi', name: 'Suomi' }, // Finnish
  { code: 'sv', name: 'Svenska' }, // Swedish
  { code: 'th', name: 'ไทย' }, // Thai
  { code: 'tr', name: 'Türkçe' }, // Turkish
  { code: 'uk', name: 'Українська' }, // Ukrainian
  { code: 'vi', name: 'Tiếng Việt' }, // Vietnamese
  { code: 'zh-Hant', name: '繁體中文' }, // Traditional Chinese
  { code: 'zh-Hans', name: '简体中文' }, // Simplified Chinese
];

export const specialBlocks = {
  '0': {
    labelEvent: 'Genesis',
    labelEventCompleted:
      'The genesis block of BitFinite (BFX) — the fair-launch relaunch (2026). Initial block subsidy: 50 BFX.',
    networks: ['mainnet'],
  },
  '210000': {
    labelEvent: "BitFinite's 1st Halving",
    labelEventCompleted: 'Block Subsidy has halved to 25 BFX per block',
    networks: ['mainnet'],
  },
  '420000': {
    labelEvent: "BitFinite's 2nd Halving",
    labelEventCompleted: 'Block Subsidy has halved to 12.5 BFX per block',
    networks: ['mainnet'],
  },
  '630000': {
    labelEvent: "BitFinite's 3rd Halving",
    labelEventCompleted: 'Block Subsidy has halved to 6.25 BFX per block',
    networks: ['mainnet'],
  },
  '840000': {
    labelEvent: "BitFinite's 4th Halving",
    labelEventCompleted: 'Block Subsidy has halved to 3.125 BFX per block',
    networks: ['mainnet'],
  },
  '1050000': {
    labelEvent: "BitFinite's 5th Halving",
    labelEventCompleted: 'Block Subsidy has halved to 1.5625 BFX per block',
    networks: ['mainnet'],
  },
  '1260000': {
    labelEvent: "BitFinite's 6th Halving",
    labelEventCompleted: 'Block Subsidy has halved to 0.78125 BFX per block',
    networks: ['mainnet'],
  },
  '1470000': {
    labelEvent: "BitFinite's 7th Halving",
    labelEventCompleted: 'Block Subsidy has halved to 0.390625 BFX per block',
    networks: ['mainnet'],
  },
  '1680000': {
    labelEvent: "BitFinite's 8th Halving",
    labelEventCompleted: 'Block Subsidy has halved to 0.1953125 BFX per block',
    networks: ['mainnet'],
  },
  '1890000': {
    labelEvent: "BitFinite's 9th Halving",
    labelEventCompleted: 'Block Subsidy has halved to 0.09765625 BFX per block',
    networks: ['mainnet'],
  },
  '2100000': {
    labelEvent: "BitFinite's 10th Halving",
    labelEventCompleted: 'Block Subsidy has halved to 0.04882812 BFX per block',
    networks: ['mainnet'],
  },
  '2310000': {
    labelEvent: "BitFinite's 11th Halving",
    labelEventCompleted: 'Block Subsidy has halved to 0.02441406 BFX per block',
    networks: ['mainnet'],
  },
  '2520000': {
    labelEvent: "BitFinite's 12th Halving",
    labelEventCompleted: 'Block Subsidy has halved to 0.01220703 BFX per block',
    networks: ['mainnet'],
  },
  '2730000': {
    labelEvent: "BitFinite's 13th Halving",
    labelEventCompleted: 'Block Subsidy has halved to 0.00610351 BFX per block',
    networks: ['mainnet'],
  },
  '2940000': {
    labelEvent: "BitFinite's 14th Halving",
    labelEventCompleted: 'Block Subsidy has halved to 0.00305175 BFX per block',
    networks: ['mainnet'],
  },
  '3150000': {
    labelEvent: "BitFinite's 15th Halving",
    labelEventCompleted: 'Block Subsidy has halved to 0.00152587 BFX per block',
    networks: ['mainnet'],
  },
  '3360000': {
    labelEvent: "BitFinite's 16th Halving",
    labelEventCompleted: 'Block Subsidy has halved to 0.00076293 BFX per block',
    networks: ['mainnet'],
  },
  '3570000': {
    labelEvent: "BitFinite's 17th Halving",
    labelEventCompleted: 'Block Subsidy has halved to 0.00038146 BFX per block',
    networks: ['mainnet'],
  },
  '3780000': {
    labelEvent: "BitFinite's 18th Halving",
    labelEventCompleted: 'Block Subsidy has halved to 0.00019073 BFX per block',
    networks: ['mainnet'],
  },
  '3990000': {
    labelEvent: "BitFinite's 19th Halving",
    labelEventCompleted: 'Block Subsidy has halved to 0.00009536 BFX per block',
    networks: ['mainnet'],
  },
  '4200000': {
    labelEvent: "BitFinite's 20th Halving",
    labelEventCompleted: 'Block Subsidy has halved to 0.00004768 BFX per block',
    networks: ['mainnet'],
  },
  '4410000': {
    labelEvent: "BitFinite's 21st Halving",
    labelEventCompleted: 'Block Subsidy has halved to 0.00002384 BFX per block',
    networks: ['mainnet'],
  },
  '4620000': {
    labelEvent: "BitFinite's 22nd Halving",
    labelEventCompleted: 'Block Subsidy has halved to 0.00001192 BFX per block',
    networks: ['mainnet'],
  },
  '4830000': {
    labelEvent: "BitFinite's 23rd Halving",
    labelEventCompleted: 'Block Subsidy has halved to 0.00000596 BFX per block',
    networks: ['mainnet'],
  },
  '5040000': {
    labelEvent: "BitFinite's 24th Halving",
    labelEventCompleted: 'Block Subsidy has halved to 0.00000298 BFX per block',
    networks: ['mainnet'],
  },
  '5250000': {
    labelEvent: "BitFinite's 25th Halving",
    labelEventCompleted: 'Block Subsidy has halved to 0.00000149 BFX per block',
    networks: ['mainnet'],
  },
  '5460000': {
    labelEvent: "BitFinite's 26th Halving",
    labelEventCompleted: 'Block Subsidy has halved to 0.00000074 BFX per block',
    networks: ['mainnet'],
  },
  '5670000': {
    labelEvent: "BitFinite's 27th Halving",
    labelEventCompleted: 'Block Subsidy has halved to 0.00000037 BFX per block',
    networks: ['mainnet'],
  },
  '5880000': {
    labelEvent: "BitFinite's 28th Halving",
    labelEventCompleted: 'Block Subsidy has halved to 0.00000018 BFX per block',
    networks: ['mainnet'],
  },
  '6090000': {
    labelEvent: "BitFinite's 29th Halving",
    labelEventCompleted: 'Block Subsidy has halved to 0.00000009 BFX per block',
    networks: ['mainnet'],
  },
  '6300000': {
    labelEvent: "BitFinite's 30th Halving",
    labelEventCompleted: 'Block Subsidy has halved to 0.00000004 BFX per block',
    networks: ['mainnet'],
  },
  '6510000': {
    labelEvent: "BitFinite's 31st Halving",
    labelEventCompleted: 'Block Subsidy has halved to 0.00000002 BFX per block',
    networks: ['mainnet'],
  },
  '6720000': {
    labelEvent: "BitFinite's 32nd Halving",
    labelEventCompleted: 'Block Subsidy has halved to 0.00000001 BFX per block',
    networks: ['mainnet'],
  },
  '6930000': {
    labelEvent: 'End of block subsidy',
    labelEventCompleted:
      'The block subsidy has decreased below 1 satoshi and is now 0 BFX. Miners are rewarded by transaction fees only. Total supply approaches the 21,000,000 BFX cap.',
    networks: ['mainnet'],
  },
};

export const fiatCurrencies = {
  AUD: {
    name: 'Australian Dollar',
    code: 'AUD',
    indexed: true,
  },
  CAD: {
    name: 'Canadian Dollar',
    code: 'CAD',
    indexed: true,
  },
  CHF: {
    name: 'Swiss Franc',
    code: 'CHF',
    indexed: true,
  },
  EUR: {
    name: 'Euro',
    code: 'EUR',
    indexed: true,
  },
  GBP: {
    name: 'Pound Sterling',
    code: 'GBP',
    indexed: true,
  },
  JPY: {
    name: 'Japanese Yen',
    code: 'JPY',
    indexed: true,
  },
  USD: {
    name: 'US Dollar',
    code: 'USD',
    indexed: true,
  },
  BGN: {
    name: 'Bulgarian Lev',
    code: 'BGN',
    indexed: true,
  },
  BRL: {
    name: 'Brazilian Real',
    code: 'BRL',
    indexed: true,
  },
  CNY: {
    name: 'Chinese Yuan',
    code: 'CNY',
    indexed: true,
  },
  CZK: {
    name: 'Czech Koruna',
    code: 'CZK',
    indexed: true,
  },
  DKK: {
    name: 'Danish Krone',
    code: 'DKK',
    indexed: true,
  },
  HKD: {
    name: 'Hong Kong Dollar',
    code: 'HKD',
    indexed: true,
  },
  HRK: {
    name: 'Croatian Kuna',
    code: 'HRK',
    indexed: true,
  },
  HUF: {
    name: 'Hungarian Forint',
    code: 'HUF',
    indexed: true,
  },
  IDR: {
    name: 'Indonesian Rupiah',
    code: 'IDR',
    indexed: true,
  },
  ILS: {
    name: 'Israeli Shekel',
    code: 'ILS',
    indexed: true,
  },
  INR: {
    name: 'Indian Rupee',
    code: 'INR',
    indexed: true,
  },
  ISK: {
    name: 'Icelandic Krona',
    code: 'ISK',
    indexed: true,
  },
  KRW: {
    name: 'South Korean Won',
    code: 'KRW',
    indexed: true,
  },
  MXN: {
    name: 'Mexican Peso',
    code: 'MXN',
    indexed: true,
  },
  MYR: {
    name: 'Malaysian Ringgit',
    code: 'MYR',
    indexed: true,
  },
  NOK: {
    name: 'Norwegian Krone',
    code: 'NOK',
    indexed: true,
  },
  NZD: {
    name: 'New Zealand Dollar',
    code: 'NZD',
    indexed: true,
  },
  PHP: {
    name: 'Philippine Peso',
    code: 'PHP',
    indexed: true,
  },
  PLN: {
    name: 'Polish Zloty',
    code: 'PLN',
    indexed: true,
  },
  RON: {
    name: 'Romanian Leu',
    code: 'RON',
    indexed: true,
  },
  RUB: {
    name: 'Russian Ruble',
    code: 'RUB',
    indexed: true,
  },
  SEK: {
    name: 'Swedish Krona',
    code: 'SEK',
    indexed: true,
  },
  SGD: {
    name: 'Singapore Dollar',
    code: 'SGD',
    indexed: true,
  },
  THB: {
    name: 'Thai Baht',
    code: 'THB',
    indexed: true,
  },
  TRY: {
    name: 'Turkish Lira',
    code: 'TRY',
    indexed: true,
  },
  ZAR: {
    name: 'South African Rand',
    code: 'ZAR',
    indexed: true,
  },
};

export interface Timezone {
  offset: string;
  name: string;
}

export const timezones: Timezone[] = [
  { offset: '-12', name: 'Anywhere on Earth (AoE)' },
  { offset: '-11', name: 'Samoa Standard Time (SST)' },
  { offset: '-10', name: 'Hawaii Standard Time (HST)' },
  { offset: '-9', name: 'Alaska Standard Time (AKST)' },
  { offset: '-8', name: 'Pacific Standard Time (PST)' },
  { offset: '-7', name: 'Mountain Standard Time (MST)' },
  { offset: '-6', name: 'Central Standard Time (CST)' },
  { offset: '-5', name: 'Eastern Standard Time (EST)' },
  { offset: '-4', name: 'Atlantic Standard Time (AST)' },
  { offset: '-3', name: 'Argentina Time (ART)' },
  { offset: '-2', name: 'Fernando de Noronha Time (FNT)' },
  { offset: '-1', name: 'Azores Time (AZOT)' },
  { offset: '+0', name: 'Greenwich Mean Time (GMT)' },
  { offset: '+1', name: 'Central European Time (CET)' },
  { offset: '+2', name: 'Eastern European Time (EET)' },
  { offset: '+3', name: 'Moscow Standard Time (MSK)' },
  { offset: '+4', name: 'Armenia Time (AMT)' },
  { offset: '+5', name: 'Pakistan Standard Time (PKT)' },
  { offset: '+6', name: 'Xinjiang Time (XJT)' },
  { offset: '+7', name: 'Indochina Time (ICT)' },
  { offset: '+8', name: 'Hong Kong Time (HKT)' },
  { offset: '+9', name: 'Japan Standard Time (JST)' },
  { offset: '+10', name: 'Australian Eastern Standard Time (AEST)' },
  { offset: '+11', name: 'Norfolk Time (NFT)' },
  { offset: '+12', name: 'New Zealand Standard Time (NZST)' },
  { offset: '+13', name: 'Tonga Time (TOT)' },
  { offset: '+14', name: 'Line Islands Time (LINT)' },
];
