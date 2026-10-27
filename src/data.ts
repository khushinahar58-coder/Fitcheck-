import type { ClothingItem, Category, Occasion, Outfit, WeatherInfo } from './types';

export const CATEGORIES: Array<'All' | ClothingItem['category']> = [
  'All',
  'Tops',
  'Bottoms',
  'Dresses',
  'Outerwear',
  'Shoes',
  'Accessories',
];

export const OCCASIONS: Occasion[] = [
  {
    id: 'work',
    label: 'Work',
    emoji: 'briefcase',
    description: 'Polished, confident, desk-to-meeting ready',
  },
  {
    id: 'dinner',
    label: 'Dinner Out',
    emoji: 'utensils-crossed',
    description: 'Effortlessly elegant for a night of good food',
  },
  {
    id: 'date',
    label: 'Date Night',
    emoji: 'heart',
    description: 'A look that feels like you, only more magnetic',
  },
  {
    id: 'casual',
    label: 'Casual Weekend',
    emoji: 'coffee',
    description: 'Relaxed, cozy, and ready for anything',
  },
  {
    id: 'party',
    label: 'Party',
    emoji: 'sparkles',
    description: 'Turn heads and own the room',
  },
];

export const CLOTHING_ITEMS: ClothingItem[] = [
  // Tops
  {
    id: 't1',
    name: 'Silk Blouse',
    category: 'Tops',
    image: 'https://images.pexels.com/photos/18504977/pexels-photo-18504977.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: 'Ivory',
    brand: 'Everlane',
    lastWornDaysAgo: 5,
    tags: ['silk', 'neutral', 'versatile'],
  },
  {
    id: 't2',
    name: 'Cashmere Sweater',
    category: 'Tops',
    image: 'https://images.pexels.com/photos/27028696/pexels-photo-27028696.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: 'Cream',
    brand: 'Naadam',
    lastWornDaysAgo: 42,
    tags: ['cozy', 'neutral', 'rarely-worn'],
  },
  {
    id: 't3',
    name: 'Beige Camisole',
    category: 'Tops',
    image: 'https://images.pexels.com/photos/10975856/pexels-photo-10975856.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: 'Beige',
    brand: 'COS',
    lastWornDaysAgo: 12,
    tags: ['silk', 'layering'],
  },
  {
    id: 't4',
    name: 'Turtleneck',
    category: 'Tops',
    image: 'https://images.pexels.com/photos/6211619/pexels-photo-6211619.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: 'Camel',
    brand: 'Uniqlo',
    lastWornDaysAgo: 60,
    tags: ['layering', 'neutral', 'rarely-worn'],
  },
  {
    id: 't5',
    name: 'Knit Cardigan',
    category: 'Tops',
    image: 'https://images.pexels.com/photos/9603624/pexels-photo-9603624.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: 'Oatmeal',
    brand: 'ARKET',
    lastWornDaysAgo: 8,
    tags: ['cozy', 'layering'],
  },

  // Bottoms
  {
    id: 'b1',
    name: 'High-Waist Jeans',
    category: 'Bottoms',
    image: 'https://images.pexels.com/photos/39457759/pexels-photo-39457759.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: 'Mid-Blue',
    brand: 'AGOLDE',
    lastWornDaysAgo: 3,
    tags: ['denim', 'everyday'],
  },
  {
    id: 'b2',
    name: 'Tailored Trousers',
    category: 'Bottoms',
    image: 'https://images.pexels.com/photos/15221657/pexels-photo-15221657.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: 'Black',
    brand: 'Theory',
    lastWornDaysAgo: 7,
    tags: ['formal', 'work'],
  },
  {
    id: 'b3',
    name: 'Wide-Leg Pants',
    category: 'Bottoms',
    image: 'https://images.pexels.com/photos/31400266/pexels-photo-31400266.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: 'Beige',
    brand: 'COS',
    lastWornDaysAgo: 30,
    tags: ['neutral', 'rarely-worn'],
  },
  {
    id: 'b4',
    name: 'Midi Skirt',
    category: 'Bottoms',
    image: 'https://images.pexels.com/photos/39457731/pexels-photo-39457731.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: 'Floral Blue',
    brand: 'Ganni',
    lastWornDaysAgo: 55,
    tags: ['feminine', 'rarely-worn'],
  },
  {
    id: 'b5',
    name: 'Pleated Skirt',
    category: 'Bottoms',
    image: 'https://images.pexels.com/photos/5542969/pexels-photo-5542969.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: 'Black',
    brand: 'Sezane',
    lastWornDaysAgo: 20,
    tags: ['feminine'],
  },

  // Dresses
  {
    id: 'd1',
    name: 'Floral Midi Dress',
    category: 'Dresses',
    image: 'https://images.pexels.com/photos/16971643/pexels-photo-16971643.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: 'Floral',
    brand: 'Reformation',
    lastWornDaysAgo: 14,
    tags: ['feminine', 'versatile'],
  },
  {
    id: 'd2',
    name: 'Silk Slip Dress',
    category: 'Dresses',
    image: 'https://images.pexels.com/photos/12466603/pexels-photo-12466603.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: 'Champagne',
    brand: 'Ganni',
    lastWornDaysAgo: 70,
    tags: ['elegant', 'rarely-worn'],
  },
  {
    id: 'd3',
    name: 'Black Slip Dress',
    category: 'Dresses',
    image: 'https://images.pexels.com/photos/36041574/pexels-photo-36041574.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: 'Black',
    brand: 'Toteme',
    lastWornDaysAgo: 25,
    tags: ['evening', 'minimal'],
  },

  // Outerwear
  {
    id: 'o1',
    name: 'Black Blazer',
    category: 'Outerwear',
    image: 'https://images.pexels.com/photos/7202800/pexels-photo-7202800.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: 'Black',
    brand: 'Theory',
    lastWornDaysAgo: 4,
    tags: ['formal', 'work'],
  },
  {
    id: 'o2',
    name: 'Trench Coat',
    category: 'Outerwear',
    image: 'https://images.pexels.com/photos/12372210/pexels-photo-12372210.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: 'Camel',
    brand: 'Burberry',
    lastWornDaysAgo: 18,
    tags: ['classic', 'neutral'],
  },
  {
    id: 'o3',
    name: 'Leather Jacket',
    category: 'Outerwear',
    image: 'https://images.pexels.com/photos/9135983/pexels-photo-9135983.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: 'Black',
    brand: 'AllSaints',
    lastWornDaysAgo: 35,
    tags: ['edgy', 'rarely-worn'],
  },
  {
    id: 'o4',
    name: 'Denim Jacket',
    category: 'Outerwear',
    image: 'https://images.pexels.com/photos/30526284/pexels-photo-30526284.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: 'Light Blue',
    brand: 'Levi\'s',
    lastWornDaysAgo: 10,
    tags: ['casual', 'denim'],
  },

  // Shoes
  {
    id: 's1',
    name: 'Black Heels',
    category: 'Shoes',
    image: 'https://images.pexels.com/photos/17826424/pexels-photo-17826424.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: 'Black',
    brand: 'Sam Edelman',
    lastWornDaysAgo: 6,
    tags: ['formal', 'heels'],
  },
  {
    id: 's2',
    name: 'Leather Ankle Boots',
    category: 'Shoes',
    image: 'https://images.pexels.com/photos/26851193/pexels-photo-26851193.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: 'Brown',
    brand: 'Vagabond',
    lastWornDaysAgo: 9,
    tags: ['versatile', 'boots'],
  },
  {
    id: 's3',
    name: 'White Sneakers',
    category: 'Shoes',
    image: 'https://images.pexels.com/photos/8669225/pexels-photo-8669225.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: 'White',
    brand: 'Common Projects',
    lastWornDaysAgo: 2,
    tags: ['casual', 'everyday'],
  },
  {
    id: 's4',
    name: 'Ballet Flats',
    category: 'Shoes',
    image: 'https://images.pexels.com/photos/14816287/pexels-photo-14816287.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: 'Black',
    brand: 'Repetto',
    lastWornDaysAgo: 48,
    tags: ['comfortable', 'rarely-worn'],
  },

  // Accessories
  {
    id: 'a1',
    name: 'Leather Handbag',
    category: 'Accessories',
    image: 'https://images.pexels.com/photos/7953286/pexels-photo-7953286.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: 'Tan',
    brand: 'Polene',
    lastWornDaysAgo: 1,
    tags: ['everyday', 'leather'],
  },
  {
    id: 'a2',
    name: 'Gold Necklace',
    category: 'Accessories',
    image: 'https://images.pexels.com/photos/13924051/pexels-photo-13924051.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: 'Gold',
    brand: 'Mejuri',
    lastWornDaysAgo: 3,
    tags: ['jewelry', 'minimal'],
  },
  {
    id: 'a3',
    name: 'Statement Earrings',
    category: 'Accessories',
    image: 'https://images.pexels.com/photos/31285201/pexels-photo-31285201.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: 'Gold',
    brand: 'Anthropologie',
    lastWornDaysAgo: 65,
    tags: ['jewelry', 'rarely-worn'],
  },
  {
    id: 'a4',
    name: 'Silk Scarf',
    category: 'Accessories',
    image: 'https://images.pexels.com/photos/36455711/pexels-photo-36455711.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: 'Mustard',
    brand: 'Hermès',
    lastWornDaysAgo: 90,
    tags: ['accessory', 'rarely-worn'],
  },
];

export const OUTFITS: Outfit[] = [
  // WORK
  {
    id: 'work-1',
    occasionId: 'work',
    name: 'The Power Suit',
    description: 'A sharp blazer over tailored trousers — boardroom-ready and effortless.',
    slots: [
      { role: 'Outerwear', itemId: 'o1' },
      { role: 'Top', itemId: 't1' },
      { role: 'Bottom', itemId: 'b2' },
      { role: 'Shoes', itemId: 's4' },
      { role: 'Accessory', itemId: 'a2' },
    ],
    featured: true,
  },
  {
    id: 'work-2',
    occasionId: 'work',
    name: 'Soft Tailoring',
    description: 'Wide-leg trousers and a cozy turtleneck for a refined yet comfortable day.',
    slots: [
      { role: 'Top', itemId: 't4' },
      { role: 'Bottom', itemId: 'b3' },
      { role: 'Shoes', itemId: 's4' },
      { role: 'Accessory', itemId: 'a1' },
    ],
  },
  {
    id: 'work-3',
    occasionId: 'work',
    name: 'Polished Knit',
    description: 'A cashmere sweater with structured trousers — comfort meets credibility.',
    slots: [
      { role: 'Top', itemId: 't2' },
      { role: 'Bottom', itemId: 'b2' },
      { role: 'Shoes', itemId: 's2' },
      { role: 'Accessory', itemId: 'a2' },
    ],
  },
  {
    id: 'work-4',
    occasionId: 'work',
    name: 'Effortless Layers',
    description: 'A knit cardigan layered over a silk blouse for a softly confident look.',
    slots: [
      { role: 'Top', itemId: 't1' },
      { role: 'Layer', itemId: 't5' },
      { role: 'Bottom', itemId: 'b3' },
      { role: 'Shoes', itemId: 's4' },
    ],
  },

  // DINNER OUT
  {
    id: 'dinner-1',
    occasionId: 'dinner',
    name: 'Elevated Neutrals',
    description: 'A silk camisole tucked into wide-leg pants — quietly luxurious.',
    slots: [
      { role: 'Top', itemId: 't3' },
      { role: 'Bottom', itemId: 'b3' },
      { role: 'Shoes', itemId: 's2' },
      { role: 'Accessory', itemId: 'a3' },
    ],
    featured: true,
  },
  {
    id: 'dinner-2',
    occasionId: 'dinner',
    name: 'Bistro Chic',
    description: 'A floral midi dress with ankle boots — feminine with an edge.',
    slots: [
      { role: 'Dress', itemId: 'd1' },
      { role: 'Shoes', itemId: 's2' },
      { role: 'Accessory', itemId: 'a2' },
    ],
  },
  {
    id: 'dinner-3',
    occasionId: 'dinner',
    name: 'Evening Ease',
    description: 'A pleated skirt with a tucked-in blouse — sophisticated and comfortable.',
    slots: [
      { role: 'Top', itemId: 't1' },
      { role: 'Bottom', itemId: 'b5' },
      { role: 'Shoes', itemId: 's1' },
      { role: 'Accessory', itemId: 'a3' },
    ],
  },
  {
    id: 'dinner-4',
    occasionId: 'dinner',
    name: 'Trench & Boots',
    description: 'Layer a classic trench over dark trousers for a cool-weather dinner.',
    slots: [
      { role: 'Top', itemId: 't3' },
      { role: 'Bottom', itemId: 'b2' },
      { role: 'Outerwear', itemId: 'o2' },
      { role: 'Shoes', itemId: 's2' },
    ],
  },

  // DATE NIGHT
  {
    id: 'date-1',
    occasionId: 'date',
    name: 'Slip & Statement',
    description: 'A champagne silk slip dress with gold earrings — pure romance.',
    slots: [
      { role: 'Dress', itemId: 'd2' },
      { role: 'Shoes', itemId: 's1' },
      { role: 'Accessory', itemId: 'a3' },
    ],
    featured: true,
  },
  {
    id: 'date-2',
    occasionId: 'date',
    name: 'Edgy Elegance',
    description: 'A leather jacket over a black slip dress — magnetic and bold.',
    slots: [
      { role: 'Dress', itemId: 'd3' },
      { role: 'Outerwear', itemId: 'o3' },
      { role: 'Shoes', itemId: 's1' },
      { role: 'Accessory', itemId: 'a2' },
    ],
  },
  {
    id: 'date-3',
    occasionId: 'date',
    name: 'Feminine Charm',
    description: 'A floral midi with delicate heels — soft, pretty, and memorable.',
    slots: [
      { role: 'Dress', itemId: 'd1' },
      { role: 'Shoes', itemId: 's1' },
      { role: 'Accessory', itemId: 'a4' },
    ],
  },

  // CASUAL WEEKEND
  {
    id: 'casual-1',
    occasionId: 'casual',
    name: 'Weekend Classic',
    description: 'High-waist jeans with a cashmere sweater — cozy and timeless.',
    slots: [
      { role: 'Top', itemId: 't2' },
      { role: 'Bottom', itemId: 'b1' },
      { role: 'Shoes', itemId: 's3' },
      { role: 'Accessory', itemId: 'a1' },
    ],
    featured: true,
  },
  {
    id: 'casual-2',
    occasionId: 'casual',
    name: 'Denim Days',
    description: 'A denim jacket over jeans and a camisole — double denim done right.',
    slots: [
      { role: 'Top', itemId: 't3' },
      { role: 'Bottom', itemId: 'b1' },
      { role: 'Outerwear', itemId: 'o4' },
      { role: 'Shoes', itemId: 's3' },
    ],
  },
  {
    id: 'casual-3',
    occasionId: 'casual',
    name: 'Skirt & Sneakers',
    description: 'A midi skirt dressed down with sneakers — unexpected and effortless.',
    slots: [
      { role: 'Top', itemId: 't5' },
      { role: 'Bottom', itemId: 'b4' },
      { role: 'Shoes', itemId: 's3' },
    ],
  },
  {
    id: 'casual-4',
    occasionId: 'casual',
    name: 'Cozy Layers',
    description: 'A cardigan over jeans with boots — perfect for a crisp morning walk.',
    slots: [
      { role: 'Top', itemId: 't5' },
      { role: 'Bottom', itemId: 'b1' },
      { role: 'Shoes', itemId: 's2' },
      { role: 'Accessory', itemId: 'a4' },
    ],
  },

  // PARTY
  {
    id: 'party-1',
    occasionId: 'party',
    name: 'Statement Silk',
    description: 'A champagne slip dress with bold earrings — made for the spotlight.',
    slots: [
      { role: 'Dress', itemId: 'd2' },
      { role: 'Shoes', itemId: 's1' },
      { role: 'Accessory', itemId: 'a3' },
      { role: 'Accessory 2', itemId: 'a4' },
    ],
    featured: true,
  },
  {
    id: 'party-2',
    occasionId: 'party',
    name: 'After Dark',
    description: 'A black slip dress with a leather jacket — cool, bold, unforgettable.',
    slots: [
      { role: 'Dress', itemId: 'd3' },
      { role: 'Outerwear', itemId: 'o3' },
      { role: 'Shoes', itemId: 's1' },
      { role: 'Accessory', itemId: 'a3' },
    ],
  },
  {
    id: 'party-3',
    occasionId: 'party',
    name: 'Glam Edge',
    description: 'A pleated skirt with a silk cami and heels — refined with a party twist.',
    slots: [
      { role: 'Top', itemId: 't3' },
      { role: 'Bottom', itemId: 'b5' },
      { role: 'Shoes', itemId: 's1' },
      { role: 'Accessory', itemId: 'a3' },
      { role: 'Accessory 2', itemId: 'a2' },
    ],
  },
];

export const SAMPLE_WEATHER: Record<string, WeatherInfo> = {
  work: {
    condition: 'Partly Cloudy',
    emoji: 'cloud-sun',
    tempHigh: 22,
    tempLow: 14,
    note: 'A light layer is a smart call — mornings are cool.',
  },
  dinner: {
    condition: 'Clear Evening',
    emoji: 'moon-star',
    tempHigh: 19,
    tempLow: 11,
    note: 'Comfortable now, but it cools down after sunset.',
  },
  date: {
    condition: 'Mild & Breezy',
    emoji: 'wind',
    tempHigh: 18,
    tempLow: 10,
    note: 'Bring a jacket — it gets chilly later tonight.',
  },
  casual: {
    condition: 'Sunny',
    emoji: 'sun',
    tempHigh: 24,
    tempLow: 16,
    note: 'A beautiful day — no extra layers needed.',
  },
  party: {
    condition: 'Clear Night',
    emoji: 'moon',
    tempHigh: 16,
    tempLow: 9,
    note: 'Crisp night air — a jacket for the walk home.',
  },
};

export const SAMPLE_GALLERY: string[] = [
  'https://images.pexels.com/photos/32661325/pexels-photo-32661325.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/20781335/pexels-photo-20781335.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/16099172/pexels-photo-16099172.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/5642149/pexels-photo-5642149.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/9904171/pexels-photo-9904171.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/4872122/pexels-photo-4872122.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/26756784/pexels-photo-26756784.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/7706645/pexels-photo-7706645.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/39457662/pexels-photo-39457662.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
];

// --- Feature 1: Extract Clothes from Outfit Photos ---

export interface OUTFIT_PHOTO_OPTION {
  image: string;
  label: string;
}

export const OUTFIT_PHOTO_SAMPLES: OUTFIT_PHOTO_OPTION[] = [
  {
    image: 'https://images.pexels.com/photos/4219913/pexels-photo-4219913.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    label: 'Casual sundress look',
  },
  {
    image: 'https://images.pexels.com/photos/5284975/pexels-photo-5284975.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    label: 'Weekend outfit',
  },
  {
    image: 'https://images.pexels.com/photos/7319026/pexels-photo-7319026.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    label: 'T-shirt & jeans',
  },
  {
    image: 'https://images.pexels.com/photos/37830397/pexels-photo-37830397.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    label: 'Office look',
  },
  {
    image: 'https://images.pexels.com/photos/7581698/pexels-photo-7581698.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    label: 'Evening outfit',
  },
  {
    image: 'https://images.pexels.com/photos/6131198/pexels-photo-6131198.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    label: 'Fall coat look',
  },
];

export interface DetectedItem {
  id: string;
  name: string;
  category: Category;
  image: string;
  color: string;
  confidence: number;
}

const DETECTED_ITEM_IMAGES = {
  blackTop: 'https://images.pexels.com/photos/39457698/pexels-photo-39457698.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  whiteShirt: 'https://images.pexels.com/photos/39457699/pexels-photo-39457699.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  blueJeans: 'https://images.pexels.com/photos/17720437/pexels-photo-17720437.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  blazer: 'https://images.pexels.com/photos/19663784/pexels-photo-19663784.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  dress: 'https://images.pexels.com/photos/4252618/pexels-photo-4252618.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  coat: 'https://images.pexels.com/photos/20384587/pexels-photo-20384587.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  sneakers: 'https://images.pexels.com/photos/11559288/pexels-photo-11559288.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  handbag: 'https://images.pexels.com/photos/36364968/pexels-photo-36364968.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  heels: 'https://images.pexels.com/photos/17826424/pexels-photo-17826424.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  boots: 'https://images.pexels.com/photos/26851193/pexels-photo-26851193.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
};

export function simulateExtraction(outfitImage: string): DetectedItem[] {
  // Map sample outfit photos to realistic detected items
  if (outfitImage.includes('7319026') || outfitImage.includes('5284975')) {
    return [
      { id: 'd1', name: 'Black T-Shirt', category: 'Tops', image: DETECTED_ITEM_IMAGES.blackTop, color: 'Black', confidence: 96 },
      { id: 'd2', name: 'Blue Jeans', category: 'Bottoms', image: DETECTED_ITEM_IMAGES.blueJeans, color: 'Mid-Blue', confidence: 94 },
      { id: 'd3', name: 'White Sneakers', category: 'Shoes', image: DETECTED_ITEM_IMAGES.sneakers, color: 'White', confidence: 91 },
    ];
  }
  if (outfitImage.includes('37830397')) {
    return [
      { id: 'd1', name: 'White Blouse', category: 'Tops', image: DETECTED_ITEM_IMAGES.whiteShirt, color: 'White', confidence: 95 },
      { id: 'd2', name: 'Black Blazer', category: 'Outerwear', image: DETECTED_ITEM_IMAGES.blazer, color: 'Black', confidence: 93 },
      { id: 'd3', name: 'Black Trousers', category: 'Bottoms', image: 'https://images.pexels.com/photos/6046228/pexels-photo-6046228.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', color: 'Black', confidence: 89 },
      { id: 'd4', name: 'Heels', category: 'Shoes', image: DETECTED_ITEM_IMAGES.heels, color: 'Black', confidence: 87 },
    ];
  }
  if (outfitImage.includes('7581698') || outfitImage.includes('4219913')) {
    return [
      { id: 'd1', name: 'Black Dress', category: 'Dresses', image: DETECTED_ITEM_IMAGES.dress, color: 'Black', confidence: 97 },
      { id: 'd2', name: 'Heels', category: 'Shoes', image: DETECTED_ITEM_IMAGES.heels, color: 'Black', confidence: 92 },
      { id: 'd3', name: 'Leather Handbag', category: 'Accessories', image: DETECTED_ITEM_IMAGES.handbag, color: 'Black', confidence: 85 },
    ];
  }
  if (outfitImage.includes('6131198')) {
    return [
      { id: 'd1', name: 'Long Wool Coat', category: 'Outerwear', image: DETECTED_ITEM_IMAGES.coat, color: 'Camel', confidence: 95 },
      { id: 'd2', name: 'White Sweater', category: 'Tops', image: DETECTED_ITEM_IMAGES.whiteShirt, color: 'Cream', confidence: 90 },
      { id: 'd3', name: 'Leather Boots', category: 'Shoes', image: DETECTED_ITEM_IMAGES.boots, color: 'Brown', confidence: 88 },
    ];
  }
  // Default fallback for user-uploaded photos
  return [
    { id: 'd1', name: 'Top', category: 'Tops', image: DETECTED_ITEM_IMAGES.whiteShirt, color: 'White', confidence: 88 },
    { id: 'd2', name: 'Bottoms', category: 'Bottoms', image: DETECTED_ITEM_IMAGES.blueJeans, color: 'Blue', confidence: 85 },
    { id: 'd3', name: 'Shoes', category: 'Shoes', image: DETECTED_ITEM_IMAGES.sneakers, color: 'White', confidence: 82 },
  ];
}

// --- Feature 2: Import Past Purchases ---

export interface Retailer {
  id: string;
  name: string;
  color: string;
  initial: string;
  purchaseCount: number;
}

export const RETAILERS: Retailer[] = [
  { id: 'amazon', name: 'Amazon', color: '#FF9900', initial: 'A', purchaseCount: 5 },
  { id: 'amazon-in', name: 'Amazon India', color: '#FF6B35', initial: 'AI', purchaseCount: 3 },
  { id: 'myntra', name: 'Myntra', color: '#E91E63', initial: 'M', purchaseCount: 6 },
  { id: 'shein', name: 'SHEIN', color: '#000000', initial: 'S', purchaseCount: 4 },
  { id: 'nykaa', name: 'Nykaa Fashion', color: '#FC2779', initial: 'N', purchaseCount: 2 },
  { id: 'hm', name: 'H&M', color: '#E50010', initial: 'H', purchaseCount: 3 },
  { id: 'zara', name: 'Zara', color: '#000000', initial: 'Z', purchaseCount: 1 },
  { id: 'bershka', name: 'Bershka', color: '#1B1B1B', initial: 'B', purchaseCount: 0 },
];

export interface PurchaseItem {
  id: string;
  name: string;
  retailerId: string;
  retailerName: string;
  image: string;
  price: string;
  purchaseDate: string;
  category: Category;
  color: string;
  isFashion: boolean;
}

export const MOCK_PURCHASES: PurchaseItem[] = [
  // Amazon (5 fashion + some non-fashion filtered out)
  { id: 'p1', name: 'Cotton Blend T-Shirt', retailerId: 'amazon', retailerName: 'Amazon', image: DETECTED_ITEM_IMAGES.blackTop, price: '$18.99', purchaseDate: 'Aug 28, 2026', category: 'Tops', color: 'Black', isFashion: true },
  { id: 'p2', name: 'Slim Fit Jeans', retailerId: 'amazon', retailerName: 'Amazon', image: DETECTED_ITEM_IMAGES.blueJeans, price: '$42.00', purchaseDate: 'Aug 15, 2026', category: 'Bottoms', color: 'Blue', isFashion: true },
  { id: 'p3', name: 'Canvas Sneakers', retailerId: 'amazon', retailerName: 'Amazon', image: DETECTED_ITEM_IMAGES.sneakers, price: '$35.50', purchaseDate: 'Jul 30, 2026', category: 'Shoes', color: 'White', isFashion: true },
  { id: 'p4', name: 'Leather Crossbody Bag', retailerId: 'amazon', retailerName: 'Amazon', image: DETECTED_ITEM_IMAGES.handbag, price: '$58.00', purchaseDate: 'Jul 12, 2026', category: 'Accessories', color: 'Brown', isFashion: true },
  { id: 'p5', name: 'Wool Blend Coat', retailerId: 'amazon', retailerName: 'Amazon', image: DETECTED_ITEM_IMAGES.coat, price: '$120.00', purchaseDate: 'Jun 20, 2026', category: 'Outerwear', color: 'Camel', isFashion: true },

  // Amazon India (3)
  { id: 'p6', name: 'Anarkali Kurta Set', retailerId: 'amazon-in', retailerName: 'Amazon India', image: 'https://images.pexels.com/photos/32661325/pexels-photo-32661325.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', price: '₹2,499', purchaseDate: 'Aug 22, 2026', category: 'Dresses', color: 'Teal', isFashion: true },
  { id: 'p7', name: 'Cotton Leggings', retailerId: 'amazon-in', retailerName: 'Amazon India', image: 'https://images.pexels.com/photos/6046228/pexels-photo-6046228.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', price: '₹599', purchaseDate: 'Aug 5, 2026', category: 'Bottoms', color: 'Black', isFashion: true },
  { id: 'p8', name: 'Embellished Dupatta', retailerId: 'amazon-in', retailerName: 'Amazon India', image: 'https://images.pexels.com/photos/36455711/pexels-photo-36455711.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', price: '₹899', purchaseDate: 'Jul 18, 2026', category: 'Accessories', color: 'Mustard', isFashion: true },

  // Myntra (6)
  { id: 'p9', name: 'Floral Midi Dress', retailerId: 'myntra', retailerName: 'Myntra', image: 'https://images.pexels.com/photos/16971643/pexels-photo-16971643.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', price: '₹1,899', purchaseDate: 'Sep 2, 2026', category: 'Dresses', color: 'Floral', isFashion: true },
  { id: 'p10', name: 'Oversized Blazer', retailerId: 'myntra', retailerName: 'Myntra', image: DETECTED_ITEM_IMAGES.blazer, price: '₹3,299', purchaseDate: 'Aug 25, 2026', category: 'Outerwear', color: 'Black', isFashion: true },
  { id: 'p11', name: 'Silk Camisole Top', retailerId: 'myntra', retailerName: 'Myntra', image: 'https://images.pexels.com/photos/10975856/pexels-photo-10975856.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', price: '₹1,199', purchaseDate: 'Aug 10, 2026', category: 'Tops', color: 'Beige', isFashion: true },
  { id: 'p12', name: 'Pleated Midi Skirt', retailerId: 'myntra', retailerName: 'Myntra', image: 'https://images.pexels.com/photos/5542969/pexels-photo-5542969.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', price: '₹1,599', purchaseDate: 'Jul 28, 2026', category: 'Bottoms', color: 'Black', isFashion: true },
  { id: 'p13', name: 'Statement Earrings', retailerId: 'myntra', retailerName: 'Myntra', image: 'https://images.pexels.com/photos/31285201/pexels-photo-31285201.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', price: '₹699', purchaseDate: 'Jul 15, 2026', category: 'Accessories', color: 'Gold', isFashion: true },
  { id: 'p14', name: 'Pointed Heels', retailerId: 'myntra', retailerName: 'Myntra', image: DETECTED_ITEM_IMAGES.heels, price: '₹2,799', purchaseDate: 'Jun 28, 2026', category: 'Shoes', color: 'Black', isFashion: true },

  // SHEIN (4)
  { id: 'p15', name: 'Ribbed Knit Sweater', retailerId: 'shein', retailerName: 'SHEIN', image: 'https://images.pexels.com/photos/27028696/pexels-photo-27028696.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', price: '$14.99', purchaseDate: 'Aug 30, 2026', category: 'Tops', color: 'Cream', isFashion: true },
  { id: 'p16', name: 'High-Waist Skinny Jeans', retailerId: 'shein', retailerName: 'SHEIN', image: 'https://images.pexels.com/photos/39457662/pexels-photo-39457662.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', price: '$19.99', purchaseDate: 'Aug 12, 2026', category: 'Bottoms', color: 'Blue', isFashion: true },
  { id: 'p17', name: 'Faux Leather Jacket', retailerId: 'shein', retailerName: 'SHEIN', image: 'https://images.pexels.com/photos/9135983/pexels-photo-9135983.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', price: '$32.99', purchaseDate: 'Jul 22, 2026', category: 'Outerwear', color: 'Black', isFashion: true },
  { id: 'p18', name: 'Mini Handbag', retailerId: 'shein', retailerName: 'SHEIN', image: DETECTED_ITEM_IMAGES.handbag, price: '$12.99', purchaseDate: 'Jul 8, 2026', category: 'Accessories', color: 'Beige', isFashion: true },

  // Nykaa Fashion (2)
  { id: 'p19', name: 'Embroidered Anarkali', retailerId: 'nykaa', retailerName: 'Nykaa Fashion', image: 'https://images.pexels.com/photos/26756784/pexels-photo-26756784.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', price: '₹4,599', purchaseDate: 'Aug 18, 2026', category: 'Dresses', color: 'Wine', isFashion: true },
  { id: 'p20', name: 'Gold Layered Necklace', retailerId: 'nykaa', retailerName: 'Nykaa Fashion', image: 'https://images.pexels.com/photos/13924051/pexels-photo-13924051.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', price: '₹1,299', purchaseDate: 'Jul 30, 2026', category: 'Accessories', color: 'Gold', isFashion: true },

  // H&M (3)
  { id: 'p21', name: 'Linen Blend Shirt', retailerId: 'hm', retailerName: 'H&M', image: DETECTED_ITEM_IMAGES.whiteShirt, price: '$24.99', purchaseDate: 'Aug 20, 2026', category: 'Tops', color: 'White', isFashion: true },
  { id: 'p22', name: 'Wide-Leg Trousers', retailerId: 'hm', retailerName: 'H&M', image: 'https://images.pexels.com/photos/31400266/pexels-photo-31400266.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', price: '$29.99', purchaseDate: 'Aug 3, 2026', category: 'Bottoms', color: 'Beige', isFashion: true },
  { id: 'p23', name: 'Canvas Tote Bag', retailerId: 'hm', retailerName: 'H&M', image: DETECTED_ITEM_IMAGES.handbag, price: '$17.99', purchaseDate: 'Jul 10, 2026', category: 'Accessories', color: 'Black', isFashion: true },

  // Zara (1)
  { id: 'p24', name: 'Structured Blazer', retailerId: 'zara', retailerName: 'Zara', image: DETECTED_ITEM_IMAGES.blazer, price: '$79.90', purchaseDate: 'Aug 28, 2026', category: 'Outerwear', color: 'Beige', isFashion: true },
];
