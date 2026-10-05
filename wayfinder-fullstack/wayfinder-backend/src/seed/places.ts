import { PlaceSeed } from './types';

// Names and coordinates were cross-checked against OpenStreetMap map listings in September 2026.
// Descriptions for the principal attractions were also checked against Tamil Nadu Tourism,
// Erode District and Sathiyamangalam Municipality pages. Unknown commercial metadata is null.
const p = (name: string, category: PlaceSeed['category'], description: string, latitude: number, longitude: number,
  visitDurationMin = 60, extra: Partial<PlaceSeed> = {}): PlaceSeed => ({
  name, category, description, latitude, longitude, openTime: null, closeTime: null,
  visitDurationMin, costLevel: null, rating: null, ratingCount: 0, sustainability: null,
  localRelevance: 0.8, popularity: 0.45, images: [], verified: true, source: 'seed', ...extra,
});

export const touristPlaces: PlaceSeed[] = [
  p('Bannari Mariamman Temple', ['Culture', 'History'], 'Historic Mariamman temple at the foothills of the Sathyamangalam forests, known for its annual Kundam festival.', 11.56486, 77.33963, 75, { costLevel: 0, popularity: 0.9 }),
  p('Bhavanisagar Dam', ['Nature', 'History'], 'Large post-independence earthen dam and reservoir on the Bhavani River, with mountain and forest views.', 11.47139, 77.10955, 120, { openTime: '09:00', closeTime: '18:30', costLevel: 1, popularity: 0.9 }),
  p('Bhavanisagar Dam Park', ['Nature'], 'Public garden beside the Lower Bhavani reservoir and dam.', 11.47190, 77.11120, 90, { popularity: 0.7 }),
  p('Kodiveri Dam and Waterfalls', ['Nature', 'History'], 'Historic masonry anicut across the Bhavani River and a popular riverside recreation area.', 11.47047, 77.30519, 120, { popularity: 0.85 }),
  p('Sathyamangalam Tiger Reserve Forest Office', ['Nature'], 'Forest Department visitor contact point for information about authorised reserve activities.', 11.50650, 77.24110, 30, { sustainability: 0.8, popularity: 0.65 }),
  p('Dhimbam Ghat Viewpoint', ['Nature'], 'Mountain-pass viewpoint on the Mysuru road overlooking the forested Eastern Ghats.', 11.62688, 77.29455, 45, { costLevel: 0, popularity: 0.7 }),
  p('Thalamalai Viewpoint', ['Nature'], 'Scenic viewpoint in the Thalamalai hill landscape within the wider Sathyamangalam forest region.', 11.68003, 77.42044, 60),
  p('Kunderipallam Dam', ['Nature'], 'Earthen irrigation dam near Kongarpalayam with a reservoir backed by forested hills.', 11.54138, 77.43013, 90, { popularity: 0.6 }),
  p('Gundri Hills', ['Nature'], 'Hill and tribal landscape northwest of Sathyamangalam, reached through reserve-side roads.', 11.61267, 77.20877, 120),
  p('Bhavani River Riverside, Sathyamangalam', ['Nature'], 'Public riverfront area along the Bhavani in Sathyamangalam town.', 11.49983, 77.24434, 45, { costLevel: 0 }),
  p('Arulmigu Bhavaneeswarar Temple', ['Culture', 'History'], 'Shiva temple on the Bhavani riverbank in Sathyamangalam.', 11.50043, 77.24192, 45, { costLevel: 0 }),
  p('Arulmigu Dhandayuthapani Swamy Temple', ['Culture'], 'Murugan temple serving Sathyamangalam and nearby communities.', 11.50335, 77.23843, 40, { costLevel: 0 }),
  p('Perumal Temple, Sathyamangalam', ['Culture'], 'Local Vishnu temple in Sathyamangalam town.', 11.50537, 77.23641, 40, { costLevel: 0 }),
  p('Sri Venugopala Swamy Temple', ['Culture', 'History'], 'Vaishnavite temple in the historic core of Sathyamangalam.', 11.50422, 77.23940, 40, { costLevel: 0 }),
  p('Then Tirupathi Sri Venkateswara Swamy Temple', ['Culture'], 'Venkateswara temple identified by the municipality as a nearby place of interest.', 11.45857, 77.18764, 60, { costLevel: 0, popularity: 0.65 }),
  p('Arulmigu Pannari Amman Temple, Ariyappampalayam', ['Culture'], 'Community Amman temple in the Ariyappampalayam area.', 11.48684, 77.25581, 40, { costLevel: 0 }),
  p('Kottuveerampalayam Mariamman Temple', ['Culture'], 'Local Mariamman temple in Kottuveerampalayam.', 11.51521, 77.24992, 40, { costLevel: 0 }),
  p('Kari Varadaraja Perumal Temple', ['Culture', 'History'], 'Perumal temple in the Sathyamangalam area.', 11.50695, 77.23281, 45, { costLevel: 0 }),
  p('Sri Kottai Muneeswarar Temple', ['Culture'], 'Local guardian-deity temple in Sathyamangalam.', 11.50143, 77.24612, 35, { costLevel: 0 }),
  p('Ayyappan Temple, Sathyamangalam', ['Culture'], 'Ayyappan temple serving worshippers in Sathyamangalam town.', 11.51024, 77.23850, 35, { costLevel: 0 }),
  p('Masani Amman Temple, Rajan Nagar', ['Culture'], 'Amman temple near Rajan Nagar on the Bannari road.', 11.53692, 77.29163, 45, { costLevel: 0 }),
  p('Sri Karupparayan Temple, Bannari', ['Culture'], 'Local temple in the Bannari foothill settlement.', 11.56589, 77.33708, 35, { costLevel: 0 }),
  p('Sri Plague Mariamman Temple, Punjai Puliampatti', ['Culture'], 'Prominent Mariamman temple in nearby Punjai Puliampatti.', 11.35291, 77.16536, 45, { costLevel: 0 }),
  p('Kondathu Kaliamman Temple, Pariyur', ['Culture', 'History'], 'Well-known Kaliamman temple complex at Pariyur near Gobichettipalayam.', 11.47753, 77.39416, 75, { costLevel: 0, popularity: 0.75 }),
  p('Amarapaneeswarar Temple, Pariyur', ['Culture', 'History'], 'Historic Shiva temple within the Pariyur temple area.', 11.47708, 77.39329, 45, { costLevel: 0 }),
  p('Adinarayana Perumal Temple, Pariyur', ['Culture', 'History'], 'Vishnu temple forming part of the Pariyur group of shrines.', 11.47658, 77.39391, 45, { costLevel: 0 }),
  p('Pachamalai Murugan Temple', ['Culture', 'Nature'], 'Hill temple dedicated to Murugan near Gobichettipalayam.', 11.43875, 77.42055, 75, { costLevel: 0, popularity: 0.65 }),
  p('Pavalmalai Murugan Temple', ['Culture', 'Nature'], 'Murugan hill temple near Gobichettipalayam.', 11.46451, 77.43119, 60, { costLevel: 0 }),
  p('Mokkaiyanur Lake', ['Nature'], 'Local irrigation lake and open waterscape near Sathyamangalam.', 11.49109, 77.19531, 45, { costLevel: 0 }),
  p('Arasur Lake', ['Nature'], 'Village irrigation lake southeast of Sathyamangalam.', 11.41902, 77.27753, 45, { costLevel: 0 }),
];

// Coimbatore city/district seed records. Coordinates were cross-checked against
// public map/government sources in October 2026. Commercial metadata remains null
// unless independently verified; these records exist so the app remains useful
// when live discovery APIs are unavailable.
export const coimbatoreTouristPlaces: PlaceSeed[] = [
  p('Marudamalai Murugan Temple', ['Culture', 'History', 'Nature'], 'Renowned hill temple dedicated to Lord Murugan on the western side of Coimbatore.', 11.07330, 76.88450, 90, { costLevel: 0, popularity: 0.9 }),
  p('Perur Pateeswarar Temple', ['Culture', 'History'], 'Historic Shiva temple at Perur known for its Dravidian architecture and sculptures.', 10.97700, 76.90980, 60, { costLevel: 0, popularity: 0.85 }),
  p('Dhyanalinga, Isha Yoga Center', ['Culture', 'Nature'], 'Meditative space and gardens at the foothills of the Velliangiri mountains.', 11.02940, 76.75390, 120, { costLevel: 0, popularity: 0.75 }),
  p('Kovai Kutralam Falls', ['Nature'], 'Forest waterfall in the Siruvani region of Coimbatore district.', 10.93907, 76.68927, 100, { popularity: 0.7 }),
  p('Gass Forest Museum', ['Nature', 'History'], 'Natural-history and forestry museum in Coimbatore.', 11.01653, 76.94590, 45, { popularity: 0.45 }),
  p('VOC Park & Zoo', ['Nature', 'Culture'], 'Urban recreation park and zoo in central Coimbatore.', 11.00696, 76.97100, 75, { popularity: 0.75 }),
  p('Eachanari Vinayagar Temple', ['Culture', 'History'], 'Historic Vinayagar temple on Pollachi Main Road in Eachanari.', 10.92393, 76.98245, 45, { costLevel: 0, popularity: 0.75 }),
  p('Arulmigu Koniamman Temple', ['Culture', 'History'], 'Historic city temple dedicated to Koniamman, regarded as a guardian deity of Coimbatore.', 10.99369, 76.96373, 45, { costLevel: 0, popularity: 0.8 }),
  p('TNAU Botanical Garden', ['Nature'], 'Botanical garden within Tamil Nadu Agricultural University in Coimbatore.', 11.01600, 76.93185, 60, { popularity: 0.65 }),
  p('Adiyogi - The Source of Yoga', ['Culture', 'Nature'], 'Large Adiyogi statue and visitor destination at Isha Yoga Center near Coimbatore.', 10.97236, 76.74045, 120, { costLevel: 0, popularity: 0.9 }),
  p('Arulmigu Anuvavi Subramaniar Temple', ['Culture', 'Nature'], 'Hill temple at Periya Thadagam on the northern side of Coimbatore.', 11.05700, 76.84880, 60, { costLevel: 0, popularity: 0.6 }),
];

// Keep the original export used by the seed runner. The 30 Sathyamangalam
// records remain unchanged; Coimbatore records are appended deliberately.
export const allTouristPlaces: PlaceSeed[] = [...touristPlaces, ...coimbatoreTouristPlaces];

