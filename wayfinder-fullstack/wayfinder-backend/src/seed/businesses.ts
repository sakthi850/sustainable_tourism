import { BusinessSeed } from './types';

// Real operating names cross-checked against official store pages and public map/directory
// listings in September 2026. Coordinates identify the listed premises; unverified ratings,
// hours, phone numbers and sustainability claims are deliberately left null/omitted.
const b = (name: string, category: BusinessSeed['category'], description: string, latitude: number, longitude: number,
  address?: string, extra: Partial<BusinessSeed> = {}): BusinessSeed => ({
  name, category, description, latitude, longitude, address, openTime: null, closeTime: null,
  costLevel: null, rating: null, ratingCount: 0, sustainability: null,
  localRelevance: 0.75, popularity: 0.35, verified: false, ...extra,
});

export const localBusinesses: BusinessSeed[] = [
  b('Hotel Ramavilas', ['Food'], 'Long-running vegetarian restaurant serving South Indian meals.', 11.50532, 77.23718, 'Mysore Trunk Road, Sathyamangalam'),
  b('Gayathri Bhavan', ['Food'], 'Local South Indian vegetarian restaurant.', 11.50429, 77.23865, 'Sathyamangalam'),
  b('Lalitham Hotel', ['Food'], 'Local restaurant known for Tamil and South Indian food.', 11.50701, 77.23968, 'Sathyamangalam'),
  b('Subbu Restaurant', ['Food'], 'Restaurant serving South Indian and mixed cuisine.', 11.50904, 77.23736, 'Sathyamangalam'),
  b('Subbu Mess', ['Food'], 'Local mess serving South Indian meals and biryani.', 11.50282, 77.23894, 'Sathyamangalam'),
  b('Sri Nellai Balaji Bhavan', ['Food'], 'Vegetarian South Indian restaurant.', 11.50648, 77.23696, 'Sathyamangalam'),
  b("Inba's Kitchen", ['Food'], 'Local restaurant on Kottur Road.', 11.51362, 77.23506, 'Kottur Road, Sathyamangalam'),
  b("Beeman's Restaurant", ['Food'], 'Local multi-cuisine restaurant.', 11.50171, 77.24270, 'Sathyamangalam'),
  b('New Sri Rama Vilas', ['Food'], 'South Indian restaurant in Sathyamangalam.', 11.50569, 77.23802, 'Sathyamangalam'),
  b('Mubarak Mess', ['Food'], 'Local non-vegetarian mess and restaurant.', 11.50753, 77.24204, 'Sathyamangalam'),
  b('Amman Mess', ['Food'], 'Local meal and tiffin restaurant.', 11.50410, 77.23551, 'Sathyamangalam'),
  b('NM Briyani', ['Food'], 'Local biryani restaurant.', 11.50332, 77.24162, 'Sathyamangalam'),
  b('Chennai Hot Puffs & Cake Shop', ['Food'], 'Bakery selling cakes, puffs and snacks.', 11.50687, 77.24070, 'Sathyamangalam'),
  b('Eebees Bakery Cafe', ['Food'], 'Local bakery and cafe.', 11.50467, 77.23908, 'Sathyamangalam'),
  b('Black Pekoe Tea', ['Food'], 'Tea shop opposite Sathyamangalam bus stand.', 11.50583, 77.23872, 'Opposite Sathyamangalam Bus Stand'),
  b('The Falooda Shop', ['Food'], 'Dessert and beverage shop.', 11.50508, 77.24046, 'Sathyamangalam'),
  b('Yum Me Too', ['Food'], 'Quick-service burger and wrap restaurant.', 11.50784, 77.23761, 'Sathyamangalam'),
  b('Food Mall', ['Food'], 'Local multi-cuisine restaurant and snack outlet.', 11.51009, 77.23811, 'Sathyamangalam'),
  b('Elai Virunthu - Elai Cafe', ['Food'], 'Cafe and restaurant serving South Indian food and snacks.', 11.50862, 77.24147, 'Sathyamangalam'),
  b('SBS Chicken Biriyani', ['Food'], 'Local biryani restaurant mapped in central Sathyamangalam.', 11.5071557, 77.2333442, 'Sathyamangalam'),
  b('Sri Sai Grande Inn', ['Accommodation'], 'Hotel in South Rangasamuthram, close to central Sathyamangalam.', 11.499191, 77.2363745, '120-5, Kothanur Road, South Rangasamuthram, Sathyamangalam'),
  b('Vanamala Farms', ['Accommodation'], 'Guest-house and farm stay west of Sathyamangalam.', 11.4473418, 76.9717533, 'Sathyamangalam area'),
  b('Best Shop Sathy', ['Shopping'], 'Local department store selling footwear, bags, gifts, sports goods and general merchandise.', 11.50566, 77.23626, 'Mysore Trunk Road, near Taluk Office, Sathyamangalam', { openTime: '09:00', closeTime: '22:00', website: 'https://bestshopsathy.in/store/store-1' }),
  b('Reliance SMART Bazaar Sathyamangalam', ['Shopping', 'Food'], 'Hypermarket for groceries, homewares and everyday supplies.', 11.49386, 77.24722, 'No 64/4B, SRT Corner, Kovai Main Road, Sathyamangalam', { openTime: '07:00', closeTime: '22:00', website: 'https://stores.reliancesmartbazaar.com/reliance-smart-bazaar-hypermarket-sathyamangalam-erode-374072/Home' }),
  b('Madina Gift Shop', ['Shopping'], 'Local gift shop near the bus stand.', 11.50595, 77.23831, 'Coimbatore Road, Sathyamangalam'),
  b('Lakshmi Super Stores', ['Shopping'], 'Local general and gift store.', 11.50490, 77.23677, 'Mysore Trunk Road, Sathyamangalam'),
  b('Precious Gift Shop', ['Shopping'], 'Gift shop serving Bannari and college visitors.', 11.56413, 77.33164, 'Opposite Bannari Amman Institute, Bannari'),
  b('Pugal Online Service Xerox', ['Shopping'], 'Local printing, photocopying and online-services shop.', 11.51410, 77.23804, 'North Rangasamuthram, Sathyamangalam'),
  b('Sathyamangalam Uzhavar Sandhai', ['Shopping', 'Food'], 'Government-supported farmers market for local produce.', 11.50188, 77.23462, 'Sathyamangalam'),
  b('Sathyamangalam Municipal Market', ['Shopping', 'Food'], 'Town market used by local produce and everyday-goods vendors.', 11.50419, 77.24118, 'Sathyamangalam'),
  b('Jayam & Co HP Fuel Station', ['Shopping'], 'Fuel and travel-service stop on Mettupalayam Road.', 11.49291, 77.22532, 'Mettupalayam Road, Sathyamangalam'),
  b('Sri Royal Petroleum', ['Shopping'], 'Fuel station on Bannari Main Road.', 11.52745, 77.27874, 'Bannari Main Road, Chikkarasampalayam'),
  b('Sree Bannariamman Enterprises', ['Shopping'], 'Fuel and travel-service stop on the Sathyamangalam–Mettupalayam road.', 11.42570, 77.12620, 'Sathy to Mettupalayam Road, Thoppampalayam, Bhavanisagar'),
];

// Coimbatore city seed records with independently sourced coordinates.
// Unknown commercial metadata is deliberately left null.
export const coimbatoreBusinesses: BusinessSeed[] = [
  b('Welcomhotel by ITC Hotels, Race Course, Coimbatore', ['Accommodation'], 'Hotel on West Club Road in the Race Course area of Coimbatore.', 10.99640, 76.97420, '1266/14, West Club Road, Race Course, Coimbatore'),
  b('The Residency Towers, Coimbatore', ['Accommodation'], 'Hotel on Avinashi Road in central Coimbatore.', 11.01048, 76.98055, '1076, Avinashi Road, Coimbatore'),
  b('Zibe Coimbatore by GRT Hotels', ['Accommodation'], 'Hotel on Avinashi Road in Peelamedu, Coimbatore.', 11.02518, 77.01124, '427, 2B, Avinashi Road, Peelamedu, Coimbatore'),
  b('Hotel Park Elanza Coimbatore', ['Accommodation'], 'Hotel on Dr Nanjapaa Road in Ram Nagar, Coimbatore.', 11.00890, 76.96690, '412, Dr Nanjapaa Road, Ram Nagar, Coimbatore'),
  b('Fairfield by Marriott Coimbatore', ['Accommodation'], 'Airport-area hotel on Airport Road, Coimbatore.', 11.03591, 77.03764, '469/2B, Airport Road, Coimbatore'),
  b('ibis Coimbatore City Centre', ['Accommodation'], 'City-centre hotel on Avinashi Road, Coimbatore.', 11.01200, 76.98659, 'Sri Ram Towers, 642, Avinashi Road, Puliakulam, Coimbatore'),
  b('Annapoorna Restaurant, Coimbatore', ['Food'], 'Vegetarian South Indian restaurant in central Coimbatore.', 10.99504, 76.95759, 'Coimbatore, Tamil Nadu'),
  b('Sree Annapoorna - Mettupalayam Road', ['Food'], 'Vegetarian South Indian restaurant on Mettupalayam Road.', 11.01891, 76.95355, 'Mettupalayam Road, Tatabad, Coimbatore'),
  b('Sree Annapoorna Sree Gowrishankar', ['Food'], 'Vegetarian South Indian restaurant near the central bus stand.', 11.01446, 76.96745, 'Main Bus Stand area, Coimbatore'),
  b('Adyar Ananda Bhavan, Dr Nanjappa Road', ['Food'], 'Vegetarian restaurant and sweets outlet on Dr Nanjappa Road.', 11.01495, 76.96755, 'Dr Nanjappa Road, Coimbatore 641018'),
  b('Annapoorna - Kuniyamuthur', ['Food'], 'Vegetarian South Indian restaurant near Aparna Bus Stop.', 10.95602, 76.95407, 'Near Aparna Bus Stop, Kuniyamuthur, Coimbatore'),
];

export const allLocalBusinesses: BusinessSeed[] = [...localBusinesses, ...coimbatoreBusinesses];

