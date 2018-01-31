//Vectorize a watermask to create a shapefile of a lake.


//Import the JRC Yearly Water Classification History v1.0 (1984-2015), create a box and geometry for the area to focus on and use the script below:

var jrc = ee.ImageCollection('JRC/GSW1_0/MonthlyHistory')


// filter for date
var mymap = jrc.filterBounds(geometry).filterDate(ee.Date.fromYMD(2013,1,1),ee.Date.fromYMD(2015,12,31)).sum();

Map.addLayer(jrc);

// set viz 
var viz = {min:0, max:1, palette:['0060fc']};

// all pixels greater than 40
var myMask = mymap.gt(40)
// mask the pixels
mymap = mymap.updateMask(myMask)

// create clipped water layer with 0 and 1
var water = mymap.where(mymap.gt(0),1).clip(box)

Map.addLayer(water,viz,"water mask")

// make vector layer
var vector = water.reduceToVectors({geometry: Map.getBounds(true), scale: Map.getScale() * 0.5 })

// add the vector layer
Map.addLayer(vector, {}, 'vector map')

// create point layer
var points = ee.Geometry.MultiPoint(vector.geometry().coordinates().flatten())

// add the points
Map.addLayer(ee.Image().paint(points), {palette:['ffffff']}, 'points')