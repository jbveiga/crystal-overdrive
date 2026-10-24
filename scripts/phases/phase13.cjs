const M = (id, asm, name, tileset, roof) => ({ id, asm, name, tileset, roof });
module.exports = {
  title: 'PHASE 13: WESTERN & CENTRAL KANTO - PALLET, VIRIDIAN, PEWTER, CERULEAN, ROUTES 1-4, 24-25',
  tilesets: ['port', 'train_station'],
  existing: { Route22: 'route_22' },
  regenerate: [],
  patchConnections: [{ map: 'route_22', dir: 'EAST', conn: { mapId: 'viridian_city', offset: -8 } }],
  maps: [
    // Pallet Town
    M('pallet_town', 'PalletTown', 'Pallet Town', 'kanto', 'pa'),
    M('reds_house_1f', 'RedsHouse1F', "Red's House 1F", 'players_house'),
    M('reds_house_2f', 'RedsHouse2F', "Red's House 2F", 'players_house'),
    M('blues_house', 'BluesHouse', "Blue's House", 'house'),
    M('oaks_lab', 'OaksLab', "Prof. Oak's Lab", 'lab'),

    // Route 1
    M('route_1', 'Route1', 'Route 1', 'kanto', 'pa'),

    // Viridian City
    M('viridian_city', 'ViridianCity', 'Viridian City', 'kanto', 'vi'),
    M('viridian_gym', 'ViridianGym', 'Viridian Gym', 'train_station'),
    M('viridian_poke_center', 'ViridianPokecenter1F', 'Viridian Pokémon Center', 'pokecenter'),
    M('viridian_mart', 'ViridianMart', 'Viridian Mart', 'mart'),
    M('viridian_nickname_house', 'ViridianNicknameSpeechHouse', 'Nickname House', 'house'),
    M('trainer_house_1f', 'TrainerHouse1F', 'Trainer House 1F', 'house'),
    M('trainer_house_b1f', 'TrainerHouseB1F', 'Trainer House B1F', 'facility'),

    // Route 2
    M('route_2', 'Route2', 'Route 2', 'kanto', 'pe'),
    M('route_2_gate', 'Route2Gate', 'Route 2 Gate', 'gate'),
    M('route_2_nugget_house', 'Route2NuggetHouse', 'Route 2 House', 'house'),

    // Pewter City
    M('pewter_city', 'PewterCity', 'Pewter City', 'kanto', 'pe'),
    M('pewter_gym', 'PewterGym', 'Pewter Gym', 'tower'),
    M('pewter_poke_center', 'PewterPokecenter1F', 'Pewter Pokémon Center', 'pokecenter'),
    M('pewter_mart', 'PewterMart', 'Pewter Mart', 'mart'),
    M('pewter_nidoran_house', 'PewterNidoranSpeechHouse', 'Nidoran House', 'house'),
    M('pewter_snooze_house', 'PewterSnoozeSpeechHouse', 'Snooze House', 'house'),

    // Route 3 & Mt. Moon
    M('route_3', 'Route3', 'Route 3', 'kanto', 'pe'),
    M('mount_moon', 'MountMoon', 'Mt. Moon', 'cave'),
    M('mount_moon_square', 'MountMoonSquare', 'Mt. Moon Square', 'kanto', 'ol'),
    M('mount_moon_gift_shop', 'MountMoonGiftShop', 'Mt. Moon Gift Shop', 'traditional_house'),

    // Route 4 & Cerulean City
    M('route_4', 'Route4', 'Route 4', 'kanto', 'ce'),
    M('cerulean_city', 'CeruleanCity', 'Cerulean City', 'kanto', 'ce'),
    M('cerulean_gym', 'CeruleanGym', 'Cerulean Gym', 'port'),
    M('cerulean_poke_center', 'CeruleanPokecenter1F', 'Cerulean Pokémon Center', 'pokecenter'),
    M('cerulean_mart', 'CeruleanMart', 'Cerulean Mart', 'mart'),
    M('cerulean_police_station', 'CeruleanPoliceStation', 'Cerulean Police Station', 'house'),
    M('cerulean_trade_house', 'CeruleanTradeSpeechHouse', 'Cerulean Trade House', 'house'),
    M('cerulean_badge_house', 'CeruleanGymBadgeSpeechHouse', 'Badge Speech House', 'house'),

    // Route 24, Route 25 & Bill's Sea Cottage
    M('route_24', 'Route24', 'Route 24', 'kanto', 'ce'),
    M('route_25', 'Route25', 'Route 25', 'kanto', 'ce'),
    M('bills_house', 'BillsHouse', "Bill's Sea Cottage", 'house'),
  ],
};
