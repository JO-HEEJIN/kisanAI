/**
 * Crop traits used to plan rotations. Approximate values from FAO crop guides
 * (FAO-56 water needs, FAO Ecocrop temperature/pH ranges); good enough to compare options,
 * not to replace local extension advice.
 *
 * family     plant family; same family back to back shares pests, diseases and nutrient use
 * temp       [min, max] season mean temperature (°C) the crop grows well in
 * frost      survives frost (coldest night below 0 °C)
 * heatC      hottest-day temperature above which flowering/yield suffers
 * waterMm    water the crop uses in one season
 * drought    1 = sensitive, 2 = medium, 3 = tolerant
 * ph         [min, max] soil pH
 * badSoil    soil textures to avoid
 * nitrogen   +1 adds nitrogen (legume), 0 neutral, -1 heavy feeder
 * deepRoots  breaks up compacted layers and reaches deeper water
 * residue    leaves a lot of straw/stubble that feeds soil organic matter
 * cover      grown mainly to protect and build the soil, not to sell
 * value      rough market value: 0 none, 1 low, 2 medium, 3 high
 */
const CROPS = {
    rice:      { family: 'grass',   temp: [20, 35], frost: false, heatC: 38, waterMm: 1000, drought: 1, ph: [5.0, 7.5], badSoil: ['sandy'], nitrogen: -1, deepRoots: false, residue: true,  cover: false, value: 2 },
    wheat:     { family: 'grass',   temp: [-2, 24], frost: true,  heatC: 34, waterMm: 450,  drought: 2, ph: [6.0, 8.0], badSoil: [],        nitrogen: -1, deepRoots: false, residue: true,  cover: false, value: 2 },
    maize:     { family: 'grass',   temp: [18, 32], frost: false, heatC: 38, waterMm: 550,  drought: 1, ph: [5.5, 7.5], badSoil: [],        nitrogen: -1, deepRoots: false, residue: true,  cover: false, value: 2 },
    sorghum:   { family: 'grass',   temp: [20, 35], frost: false, heatC: 42, waterMm: 450,  drought: 3, ph: [5.5, 8.5], badSoil: [],        nitrogen: 0,  deepRoots: true,  residue: true,  cover: false, value: 1 },
    millet:    { family: 'grass',   temp: [22, 36], frost: false, heatC: 44, waterMm: 350,  drought: 3, ph: [5.0, 8.0], badSoil: [],        nitrogen: 0,  deepRoots: true,  residue: true,  cover: false, value: 1 },
    barley:    { family: 'grass',   temp: [3, 24],  frost: true,  heatC: 34, waterMm: 400,  drought: 3, ph: [6.0, 8.5], badSoil: [],        nitrogen: 0,  deepRoots: false, residue: true,  cover: false, value: 1 },
    chickpea:  { family: 'legume',  temp: [12, 26], frost: false, heatC: 35, waterMm: 300,  drought: 3, ph: [6.0, 8.5], badSoil: [],        nitrogen: 1,  deepRoots: true,  residue: false, cover: false, value: 2 },
    lentil:    { family: 'legume',  temp: [8, 24],  frost: true,  heatC: 34, waterMm: 300,  drought: 2, ph: [6.0, 8.0], badSoil: [],        nitrogen: 1,  deepRoots: false, residue: false, cover: false, value: 2 },
    pigeonpea: { family: 'legume',  temp: [20, 35], frost: false, heatC: 40, waterMm: 500,  drought: 3, ph: [5.0, 8.0], badSoil: [],        nitrogen: 1,  deepRoots: true,  residue: true,  cover: false, value: 2 },
    soybean:   { family: 'legume',  temp: [18, 32], frost: false, heatC: 38, waterMm: 500,  drought: 2, ph: [6.0, 7.5], badSoil: [],        nitrogen: 1,  deepRoots: false, residue: false, cover: false, value: 2 },
    groundnut: { family: 'legume',  temp: [20, 32], frost: false, heatC: 40, waterMm: 500,  drought: 2, ph: [5.5, 7.0], badSoil: ['clay'],  nitrogen: 1,  deepRoots: false, residue: false, cover: false, value: 3 },
    mungbean:  { family: 'legume',  temp: [22, 35], frost: false, heatC: 40, waterMm: 300,  drought: 2, ph: [6.2, 7.5], badSoil: [],        nitrogen: 1,  deepRoots: false, residue: false, cover: false, value: 2 },
    cowpea:    { family: 'legume',  temp: [20, 35], frost: false, heatC: 42, waterMm: 350,  drought: 3, ph: [5.5, 7.5], badSoil: [],        nitrogen: 1,  deepRoots: true,  residue: false, cover: false, value: 1 },
    mustard:   { family: 'brassica', temp: [8, 25], frost: true,  heatC: 32, waterMm: 350,  drought: 2, ph: [5.5, 8.0], badSoil: [],        nitrogen: 0,  deepRoots: true,  residue: false, cover: false, value: 2 },
    cotton:    { family: 'mallow',  temp: [21, 35], frost: false, heatC: 42, waterMm: 700,  drought: 2, ph: [5.8, 8.0], badSoil: [],        nitrogen: -1, deepRoots: true,  residue: false, cover: false, value: 3 },
    potato:    { family: 'nightshade', temp: [12, 22], frost: false, heatC: 30, waterMm: 500, drought: 1, ph: [4.8, 6.5], badSoil: ['clay'], nitrogen: -1, deepRoots: false, residue: false, cover: false, value: 3 },
    sunnhemp:  { family: 'legume',  temp: [20, 35], frost: false, heatC: 42, waterMm: 300,  drought: 2, ph: [5.0, 8.0], badSoil: [],        nitrogen: 1,  deepRoots: true,  residue: true,  cover: true,  value: 0 },
    berseem:   { family: 'legume',  temp: [8, 25],  frost: true,  heatC: 32, waterMm: 400,  drought: 1, ph: [6.5, 8.0], badSoil: ['sandy'], nitrogen: 1,  deepRoots: false, residue: false, cover: true,  value: 1 },
    oats:      { family: 'grass',   temp: [5, 25],  frost: true,  heatC: 32, waterMm: 350,  drought: 2, ph: [5.0, 7.5], badSoil: [],        nitrogen: 0,  deepRoots: false, residue: true,  cover: true,  value: 1 },
    rye:       { family: 'grass',   temp: [-10, 18], frost: true, heatC: 30, waterMm: 250,  drought: 2, ph: [5.0, 7.5], badSoil: [],        nitrogen: 0,  deepRoots: true,  residue: true,  cover: true,  value: 0 }
};

module.exports = { CROPS };
