const M = (id, asm, name, tileset, roof) => ({ id, asm, name, tileset, roof });
module.exports = {
  title: 'PHASE 15: SOUTHERN KANTO, SAFFRON & SEA ROUTES - SAFFRON, FUCHSIA, CINNABAR, CYCLING ROAD, SEAFOAM, ROUTES 12-21',
  tilesets: [],
  existing: {
    PalletTown: 'pallet_town',
    CeladonCity: 'celadon_city',
    Route11: 'route_11',
    LavenderTown: 'lavender_town',
    Route5: 'route_5',
    Route6: 'route_6',
    Route7: 'route_7',
    Route8: 'route_8',
  },
  regenerate: [],
  patchConnections: [
    { map: 'pallet_town', dir: 'SOUTH', conn: { mapId: 'route_21', offset: 0 } },
    { map: 'celadon_city', dir: 'WEST', conn: { mapId: 'route_16', offset: 18 } },
    { map: 'route_11', dir: 'EAST', conn: { mapId: 'route_12', offset: -18 } },
    { map: 'lavender_town', dir: 'SOUTH', conn: { mapId: 'route_12', offset: 0 } },
    { map: 'route_5', dir: 'SOUTH', conn: { mapId: 'saffron_city', offset: -10 } },
    { map: 'route_6', dir: 'NORTH', conn: { mapId: 'saffron_city', offset: -10 } },
    { map: 'route_7', dir: 'EAST', conn: { mapId: 'saffron_city', offset: -18 } },
    { map: 'route_8', dir: 'WEST', conn: { mapId: 'saffron_city', offset: -18 } },
  ],
  maps: [
    // Saffron City & Landmarks
    M('saffron_city', 'SaffronCity', 'Saffron City', 'kanto', 'sa'),
    M('saffron_gym', 'SaffronGym', 'Saffron Gym', 'underground'),
    M('fighting_dojo', 'FightingDojo', 'Fighting Dojo', 'train_station'),
    M('silph_co_1f', 'SilphCo1F', 'Silph Co. 1F', 'facility'),
    M('mr_psychics_house', 'MrPsychicsHouse', "Mr. Psychic's House", 'house'),
    M('saffron_magnet_train_station', 'SaffronMagnetTrainStation', 'Saffron Train Station', 'train_station'),
    M('saffron_poke_center', 'SaffronPokecenter1F', 'Saffron Pokémon Center', 'pokecenter'),
    M('saffron_mart', 'SaffronMart', 'Saffron Mart', 'mart'),
    M('copycats_house_1f', 'CopycatsHouse1F', "Copycat's House 1F", 'players_house'),
    M('copycats_house_2f', 'CopycatsHouse2F', "Copycat's House 2F", 'players_house'),

    // Route 16, Cycling Road & Route 18
    M('route_16', 'Route16', 'Route 16', 'kanto', 'cd'),
    M('route_16_gate', 'Route16Gate', 'Route 16 Gate', 'gate'),
    M('route_16_fuchsia_speech_house', 'Route16FuchsiaSpeechHouse', 'Route 16 House', 'house'),
    M('route_17', 'Route17', 'Cycling Road (Route 17)', 'kanto', 'fu'),
    M('route_17_route_18_gate', 'Route17Route18Gate', 'Cycling Road Gate', 'gate'),
    M('route_18', 'Route18', 'Route 18', 'kanto', 'fu'),

    // Fuchsia City & Landmarks
    M('fuchsia_city', 'FuchsiaCity', 'Fuchsia City', 'kanto', 'fu'),
    M('fuchsia_gym', 'FuchsiaGym', 'Fuchsia Gym', 'lab'),
    M('fuchsia_poke_center', 'FuchsiaPokecenter1F', 'Fuchsia Pokémon Center', 'pokecenter'),
    M('fuchsia_mart', 'FuchsiaMart', 'Fuchsia Mart', 'mart'),
    M('safari_zone_main_office', 'SafariZoneMainOffice', 'Safari Zone Office', 'game_corner'),
    M('safari_zone_wardens_home', 'SafariZoneWardensHome', "Warden's Home", 'house'),
    M('route_19_fuchsia_gate', 'Route19FuchsiaGate', 'Route 19 Gate', 'gate'),
    M('route_15_fuchsia_gate', 'Route15FuchsiaGate', 'Route 15 Gate', 'gate'),

    // Eastern Coast Routes (Routes 12-15)
    M('route_12', 'Route12', 'Route 12', 'kanto', 've'),
    M('route_12_super_rod_house', 'Route12SuperRodHouse', 'Super Rod House', 'house'),
    M('route_13', 'Route13', 'Route 13', 'kanto', 'fu'),
    M('route_14', 'Route14', 'Route 14', 'kanto', 'fu'),
    M('route_15', 'Route15', 'Route 15', 'kanto', 'fu'),

    // Southern Sea Routes & Islands (Routes 19-21, Seafoam, Cinnabar)
    M('route_19', 'Route19', 'Route 19', 'kanto', 'fu'),
    M('route_20', 'Route20', 'Route 20', 'kanto', 'cn'),
    M('seafoam_gym', 'SeafoamGym', 'Seafoam Gym', 'cave'),
    M('cinnabar_island', 'CinnabarIsland', 'Cinnabar Island', 'kanto', 'cn'),
    M('cinnabar_poke_center', 'CinnabarPokecenter1F', 'Cinnabar Pokémon Center', 'pokecenter'),
    M('route_21', 'Route21', 'Route 21', 'kanto', 'pa'),
  ],
};
