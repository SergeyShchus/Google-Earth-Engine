//step 1: Import the image collection.

//step 2: Draw a geometry.

//Step 3: use the code below:

var collection = l8.filterBounds(geometry)
 
var list = collection.toList(500);
var l = list.length();
 
print(ee.Image(list.get(l.subtract(1))).get("DATE_ACQUIRED"))
 
Map.addLayer(ee.Image(list.get(l.subtract(1))),{bands: ['B4', 'B3', 'B2'], max: 0.3},"mymap")
