var M = {
  bbox: [485000, 75000, 834000, 296000],
  data: {}, dataSeries: [],
  proj: proj4("+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs"),
};

// Définition de la carte en SVG avec le cadre notamment
function main(){
  M.map = L.map('mapdiv').setView([46.9, 7.9], 8);
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
}


function drawMap(error, data){
  if (error) throw error;

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
      .attr('fill', 'red')
      .attr('fill-opacity', 0.5)
      .attr('d', geopath);
      // Si on ne doit pas projeter les coordonnées dans le
      // navigateur, il faut simplement remplacer la dernière
      // ligne ci-dessus par celle ci-dessous:
      //.attr('d', proj.pathFromGeojson);

    features
      .attr('stroke-width', 0.3 / proj.scale);

  });

  M.communesOverlay.addTo(M.map);
}