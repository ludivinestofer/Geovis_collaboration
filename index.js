var M = {
  bbox: [485000, 75000, 834000, 296000],
  data: {}, dataSeries: [],
};

// Ouverture de la carte avec Leaflet
M.map = L.map("mapdiv",{center:[46.8, 8.3],zoom:8});
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(M.map);

// Il faut créer une sorte de boucle (queue) qui permet de charger les données ainsi que les shapefiles
d3.queue()
  .defer(
    d3.json,
    "https://cdn.rawgit.com/christiankaiser/d3-topojson-choropleth/ee12f6a108eddaa9cd119866b2e9cd52bb450cbc/data/vec200-topo.json"
  )
  .defer(
    d3.tsv,
    "https://cdn.rawgit.com/christiankaiser/d3-topojson-choropleth/ee12f6a108eddaa9cd119866b2e9cd52bb450cbc/data/pop-fem-2034-2015.tsv",
    function(d){
      M.data[d.id] = d;
      M.dataSeries.push(parseFloat(d.p_fem_singl_2034))
    }
  )
  .await(drawMap);



function drawMap(error, data){
  if (error) throw error;

  // The TopoJSON contains raw coordinates in CRS CH1903/LV03.
  // As this is already a projected CRS, we can use an SVG transform
  // to fit the map into the SVG view frame.
  // In a first step, we compute the transform parameters.

  M.communesOverlay = L.d3SvgOverlay(function(sel, proj){
    var features = sel.selectAll('path')
    .data(topojson.feature(data, data.objects.communes).features) // Ajout des communes

    features
      .enter()
      .append('path')
      .attr('stroke','white')
      .attr('fill', 'red')
      .attr('fill-opacity', 0.5)
      .attr('d', proj.pathFromGeojson);

  });

  M.communesOverlay.addTo(M.map)

}



//   // Mise en classe de la carte avec Jenks.
//   M.brew = new classyBrew();
//   M.brew.setSeries(M.dataSeries);
//   M.brew.setNumClasses(6);
//   M.brew.setColorCode('PuBu');
//   M.breaks = M.brew.classify('jenks');
//
// // Sélection des classes et des couleurs
//   M.color = d3.scaleThreshold()
//     .domain(M.breaks.slice(1,6))
//     .range(M.brew.getColors());
//
//   // Transformation des features en geoJSON et en SVG
//   M.map
//     .append('g').attr('class', 'communes')
//     sel.selectAll('path')
//     .data(topojson.feature(data, data.objects.communes).features) // Utilisation et conversion du TopoJSON
//     .enter()
//     .append('path')
//     .attr('fill', function(d){
//       return M.data[d.properties.id] ?
//         M.color(M.data[d.properties.id].p_fem_singl_2034) :
//         '#fff'; // Code couleur pour les données manquantes.
//     })
//     .attr('d', M.path);
//
//   // Limites des cantons tracées en blanc. Attention le stroke-width est en mètres !!
//   M.map
//     .append('g').attr('class', 'cantons')
//     .selectAll('path')
//     .data(topojson.feature(data, data.objects.cantons).features)
//     .enter()
//     .append('path')
//     .attr('stroke', '#fff').attr('stroke-width', '200')
//     .attr('fill', 'none').attr('d', M.path);
//
//   // La couche des lacs est en dernier afin qu'ils apparaissent dessus.
//   M.map
//     .append('g').attr('class', 'lacs')
//     .selectAll('path')
//     .data(topojson.feature(data, data.objects.lacs).features)
//     .enter().append('path')
//     .attr('fill', '#777').attr('d', M.path);
// }
//
// // Utilise la fonction D3 avec un JSON
// d3.json('vec200-cantons-topo.json', function(data){
//   vec200_topojson = data;
//   cantonsOverlay.addTo(M.map);// Ajout à la carte Leaflet
// });
