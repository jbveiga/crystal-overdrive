const M = (id, asm, name, tileset, roof) => ({ id, asm, name, tileset, roof });
module.exports = {
  title: 'PHASE 14: CENTRAL & EASTERN KANTO - VERMILION, CELADON, LAVENDER, DIGLETTS CAVE, ROCK TUNNEL, ROUTES 5-11',
  tilesets: ['mansion'],
  existing: {
    CeruleanCity: 'cerulean_city',
    Route2: 'route_2',
    OlivineCity: 'olivine_city',
  },
  regenerate: [],
  patchConnections: [
    { map: 'cerulean_city', dir: 'SOUTH', conn: { mapId: 'route_5', offset: 10 } },
    { map: 'cerulean_city', dir: 'EAST', conn: { mapId: 'route_9', offset: 18 } },
  ],
  maps: [
    // Route 5 & Underground Path
    M('route_5', 'Route5', 'Route 5', 'kanto', 'sa'),
    M('route_5_underground_entrance', 'Route5UndergroundPathEntrance', 'Route 5 Underground', 'gate'),
    M('route_5_saffron_gate', 'Route5SaffronGate', 'Route 5 Saffron Gate', 'gate'),
    M('route_5_cleanse_tag_house', 'Route5CleanseTagHouse', 'Cleanse Tag House', 'house'),
    M('underground_path', 'UndergroundPath', 'Underground Path', 'underground'),

    // Route 6 & Vermilion City
    M('route_6', 'Route6', 'Route 6', 'kanto', 've'),
    M('route_6_underground_entrance', 'Route6UndergroundPathEntrance', 'Route 6 Underground', 'gate'),
    M('route_6_saffron_gate', 'Route6SaffronGate', 'Route 6 Saffron Gate', 'gate'),
    M('vermilion_city', 'VermilionCity', 'Vermilion City', 'kanto', 've'),
    M('vermilion_gym', 'VermilionGym', 'Vermilion Gym', 'game_corner'),
    M('vermilion_poke_center', 'VermilionPokecenter1F', 'Vermilion Pokémon Center', 'pokecenter'),
    M('vermilion_mart', 'VermilionMart', 'Vermilion Mart', 'mart'),
    M('vermilion_fishing_house', 'VermilionFishingSpeechHouse', 'Fishing House', 'house'),
    M('vermilion_magnet_train_house', 'VermilionMagnetTrainSpeechHouse', 'Magnet Train House', 'house'),
    M('vermilion_digletts_house', 'VermilionDiglettsCaveSpeechHouse', "Diglett's House", 'house'),
    M('vermilion_port_passage', 'VermilionPortPassage', 'Port Passage', 'underground'),
    M('vermilion_port', 'VermilionPort', 'Vermilion Port', 'port'),

    // Fast Ship S.S. Aqua & Olivine Port Connection
    M('fast_ship_1f', 'FastShip1F', 'S.S. Aqua 1F', 'lighthouse'),
    M('fast_ship_cabins_nnw_nne_ne', 'FastShipCabins_NNW_NNE_NE', 'S.S. Aqua Cabins North', 'lighthouse'),
    M('fast_ship_cabins_sw_ssw_nw', 'FastShipCabins_SW_SSW_NW', 'S.S. Aqua Cabins West', 'lighthouse'),
    M('fast_ship_cabins_se_sse_captains_cabin', 'FastShipCabins_SE_SSE_CaptainsCabin', "Captain's Cabin", 'lighthouse'),
    M('fast_ship_b1f', 'FastShipB1F', 'S.S. Aqua B1F', 'lighthouse'),
    M('olivine_port_passage', 'OlivinePortPassage', 'Olivine Port Passage', 'underground'),
    M('olivine_port', 'OlivinePort', 'Olivine Port', 'port'),

    // Route 11 & Diglett's Cave
    M('route_11', 'Route11', 'Route 11', 'kanto', 've'),
    M('digletts_cave', 'DiglettsCave', "Diglett's Cave", 'cave'),

    // Route 9, Route 10 & Rock Tunnel
    M('route_9', 'Route9', 'Route 9', 'kanto', 'ce'),
    M('route_10_north', 'Route10North', 'Route 10 North', 'kanto', 'ce'),
    M('route_10_south', 'Route10South', 'Route 10 South', 'kanto', 'la'),
    M('route_10_poke_center', 'Route10Pokecenter1F', 'Route 10 Pokémon Center', 'pokecenter'),
    M('rock_tunnel_1f', 'RockTunnel1F', 'Rock Tunnel 1F', 'cave'),
    M('rock_tunnel_b1f', 'RockTunnelB1F', 'Rock Tunnel B1F', 'cave'),

    // Lavender Town & Soul House
    M('lavender_town', 'LavenderTown', 'Lavender Town', 'kanto', 'la'),
    M('lavender_poke_center', 'LavenderPokecenter1F', 'Lavender Pokémon Center', 'pokecenter'),
    M('lavender_mart', 'LavenderMart', 'Lavender Mart', 'mart'),
    M('lavender_speech_house', 'LavenderSpeechHouse', 'Lavender Speech House', 'house'),
    M('lavender_name_rater', 'LavenderNameRater', 'Name Rater House', 'house'),
    M('soul_house', 'SoulHouse', 'Soul House', 'house'),

    // Routes 8 & 7
    M('route_8', 'Route8', 'Route 8', 'kanto', 'la'),
    M('route_8_saffron_gate', 'Route8SaffronGate', 'Route 8 Saffron Gate', 'gate'),
    M('route_7', 'Route7', 'Route 7', 'kanto', 'cd'),
    M('route_7_saffron_gate', 'Route7SaffronGate', 'Route 7 Saffron Gate', 'gate'),

    // Celadon City & Landmarks
    M('celadon_city', 'CeladonCity', 'Celadon City', 'kanto', 'cd'),
    M('celadon_gym', 'CeladonGym', 'Celadon Gym', 'train_station'),
    M('celadon_poke_center', 'CeladonPokecenter1F', 'Celadon Pokémon Center', 'pokecenter'),
    M('celadon_dept_store_1f', 'CeladonDeptStore1F', 'Celadon Dept Store 1F', 'mart'),
    M('celadon_dept_store_2f', 'CeladonDeptStore2F', 'Celadon Dept Store 2F', 'mart'),
    M('celadon_dept_store_3f', 'CeladonDeptStore3F', 'Celadon Dept Store 3F', 'mart'),
    M('celadon_dept_store_4f', 'CeladonDeptStore4F', 'Celadon Dept Store 4F', 'mart'),
    M('celadon_dept_store_5f', 'CeladonDeptStore5F', 'Celadon Dept Store 5F', 'mart'),
    M('celadon_dept_store_6f', 'CeladonDeptStore6F', 'Celadon Dept Store 6F', 'mart'),
    M('celadon_dept_store_elevator', 'CeladonDeptStoreElevator', 'Celadon Elevator', 'mart'),
    M('celadon_mansion_1f', 'CeladonMansion1F', 'Celadon Mansion 1F', 'mansion'),
    M('celadon_mansion_2f', 'CeladonMansion2F', 'Celadon Mansion 2F', 'mansion'),
    M('celadon_mansion_3f', 'CeladonMansion3F', 'Celadon Mansion 3F', 'mansion'),
    M('celadon_mansion_roof', 'CeladonMansionRoof', 'Celadon Mansion Roof', 'mansion'),
    M('celadon_mansion_roof_house', 'CeladonMansionRoofHouse', 'Mansion Penthouse', 'house'),
    M('celadon_game_corner', 'CeladonGameCorner', 'Celadon Game Corner', 'game_corner'),
    M('celadon_game_corner_prize_room', 'CeladonGameCornerPrizeRoom', 'Game Corner Prize Room', 'game_corner'),
    M('celadon_cafe', 'CeladonCafe', 'Celadon Café', 'game_corner'),
  ],
};
