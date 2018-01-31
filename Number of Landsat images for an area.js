//Step 1: import the landsat 8 archive

//Step 2: Select an area of interest and call in aoi.

//Step 3: use the code below to show the count.

// filter images on bounds
l8 = l8.filterBounds(aoi).filterDate("2016-01-01","2016-12-31");
 
// display image count
Map.addLayer(l8.count(), {min:0, max:70},"number of images");