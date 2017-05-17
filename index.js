var M = {
  bbox: [485000, 75000, 834000, 296000],
  data: {}, dataSeries: [],
  proj: proj4("+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs"),
};

// Définition de la carte en SVG avec le cadre notamment
function main(){
  M.map = L.map('mapdiv').setView([46.9, 7.9], 8);
  // L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  //   attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  // }).addTo(M.map);

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
}


function drawMap(error, data){
  if (error) throw error;

  // À ce stade, nous avons les données:
  // le TopoJSON dans la variable data,
  // le fichier TSV dans M.data respectivement juste la série de valeurs
  // dans M.dataSeries.

  // Mise en classe de la carte avec Jenks.
  // Nous commençons par créer la mise en classe. On ne doit pas refaire
  // la mise en classe à chaque fois qu'on dessine la carte, alors
  // on peut la calculer avant de créer la couche d3.
  M.brew = new classyBrew();
  M.brew.setSeries(M.dataSeries);
  M.brew.setNumClasses(6);
  M.brew.setColorCode('PuBu');
  M.breaks = M.brew.classify('jenks');

  // Définir la fonction qui permet de traduire les valeurs
  // de la variable à cartographier en codes couleurs.
  // Ceci peut également se faire avant de dessiner la carte,
  // puisque ça ne change pas plus tard.
  M.color = d3.scaleThreshold()
    .domain(M.breaks.slice(1,6))
    .range(M.brew.getColors());

  // Créer la couche d3. On y passe la fonction qui permet de
  // dessiner la couche (donc les instructions pour d3)
  M.communesOverlay = L.d3SvgOverlay(function(sel, proj){

    // Ci-dessous le code qui permet de faire une projection
    // de CH1903 à WGS84 directement dans le navigateur.
    // Ce n'est pas optimal, car un peu lent, mais ça fonctionne.
    var projectPoint = function(x,y){
      var pt_wgs84 = M.proj.inverse([x,y]);
      var pt = M.map.latLngToLayerPoint(new L.LatLng(pt_wgs84[1], pt_wgs84[0]));
      this.stream.point(pt.x, pt.y);
    };
    var geopath = proj.pathFromGeojson
      .projection(d3.geoTransform({point: projectPoint}));
    // Fin du code de projection.

    var features = sel.selectAll('path')
      .data(topojson.feature(data, data.objects.communes).features);

    features
      .enter()
      .append('path')
      .attr('stroke','white')
      .attr('stroke-width', 0)
      .attr('fill', function(d){
        return M.data[d.properties.id] ?
          M.color(M.data[d.properties.id].p_fem_singl_2034) :
          '#fff'; // Code couleur pour les données manquantes. 
      })
      .attr('fill-opacity', 1)
      .attr('d', geopath);
      // Si on ne doit pas projeter les coordonnées dans le
      // navigateur, il faut simplement remplacer la dernière
      // ligne ci-dessus par celle ci-dessous:
      //.attr('d', proj.pathFromGeojson);

    // Ici on définit l'épaisseur des contours en fonction de l'échelle.
    // Pour les petites échelles, on ne fait pas de contour, et pour les
    // grandes échelles, un contour de 0.3 points.
    features
      .attr('stroke-width', (proj.scale <= 1 ? 0 : (0.3 / proj.scale)));

  });

  // Ajouter la couche d3 à la carte Leaflet
  M.communesOverlay.addTo(M.map);
}



//   // Limites des cantons tracées en blanc. Attention le stroke-width est en mètres !!
//   M.map
//     .append('g').attr('class', 'cantons')
//     .selectAll('path')
//     .data(topojson.feature(data, data.objects.cantons).features)
//     .enter()
//     .append('path')
//     .attr('stroke', '#fff').attr('stroke-width', '200')
//     .attr('fill', 'none').attr('d', M.path);

//   // La couche des lacs est en dernier afin qu'ils apparaissent dessus.
//   M.map
//     .append('g').attr('class', 'lacs')
//     .selectAll('path')
//     .data(topojson.feature(data, data.objects.lacs).features)
//     .enter().append('path')
//     .attr('fill', '#777').attr('d', M.path);

