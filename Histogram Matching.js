// https://code.earthengine.google.com/0dd13bac8afbae60d424b65e11f69232
//https://medium.com/google-earth/histogram-matching-c7153c85066d


//Histogram Matching to color match a highres SkySat image to a Landsat 8
// composite from the same time period.

// Find  images that are within DAYS either way from image.date() and which
// intersect its footprint. The results will be mosaic'd, sorted by CLOUD_COVER
// to hopefully handle any cloudy spots. A join is the easiest way.
function findClosest(image, days) {
  // Compute the timespan for N days (in milliseconds).
  var range = ee.Number(days).multiply(1000 * 60 * 60 * 24)
  var filter = ee.Filter.and(
    ee.Filter.maxDifference(range, 'system:time_start', null, 'system:time_start'),
    ee.Filter.intersects('.geo', null, '.geo'))
  var closest = ee.Join.saveAll('matches', 'measure')
    .apply(ee.ImageCollection([image]), landsat, filter)
  return ee.ImageCollection(ee.List(closest.first().get('matches')))
    .sort('CLOUD_COVER').mosaic()
}

// Create a lookup table to make sourceHist match targetHist.
var lookup = function(sourceHist, targetHist) {
  // Split the histograms by column and normalize the counts.
  var sourceValues = sourceHist.slice(1, 0, 1).project([0])
  var sourceCounts = sourceHist.slice(1, 1, 2).project([0])
  sourceCounts = sourceCounts.divide(sourceCounts.get([-1]))

  var targetValues = targetHist.slice(1, 0, 1).project([0])
  var targetCounts = targetHist.slice(1, 1, 2).project([0])
  targetCounts = targetCounts.divide(targetCounts.get([-1]))

  // Find first position in target where targetCount >= srcCount[i], for each i.
  var lookup = sourceCounts.toList().map(function(n) {
    var index = targetCounts.gte(n).argmax()
    return targetValues.get(index)
  })
  return {x: sourceValues.toList(), y: lookup}
}

// Make the histogram of sourceImg match targetImg.
var histogramMatch = function(sourceImg, targetImg) {
  var geom = sourceImg.geometry()
  var args = {
    reducer: ee.Reducer.autoHistogram({maxBuckets: 256, cumulative: true}), 
    geometry: geom,
    scale: 30, // Need to specify a scale, but it doesn't matter what it is because bestEffort is true.
    maxPixels: 65536 * 4 - 1,
    bestEffort: true
  }
  
  // Only use pixels in target that have a value in source
  // (inside the footprint and unmasked).
  var source = sourceImg.reduceRegion(args)
  var target = targetImg.updateMask(sourceImg.mask()).reduceRegion(args)

  return ee.Image.cat(
    sourceImg.select(['R'])
      .interpolate(lookup(source.getArray('R'), target.getArray('R'))),
    sourceImg.select(['G'])
      .interpolate(lookup(source.getArray('G'), target.getArray('G'))),
    sourceImg.select(['B'])
      .interpolate(lookup(source.getArray('B'), target.getArray('B')))
  )
}

var highres = ee.Image('SKYSAT/GEN-A/PUBLIC/ORTHO/RGB/s01_20161020T214047Z')
  .clip(geometry)


// Get the landsat collection, cloud masked and scaled to surface reflectance.
var landsat = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
  .filterBounds(Map.getBounds(true))
  .map(function(image) {
    var qa = image.select('pixel_qa')
    return image.updateMask(
        qa.bitwiseAnd(1 << 3).eq(0).and(qa.bitwiseAnd(1 << 5).eq(0)))
        .divide(10000)
        .select(['B4', 'B3', 'B2'], ['R', 'G', 'B'])
        .copyProperties(image, ['system:time_start'])
  })

var reference = findClosest(highres, 32)
var result = histogramMatch(highres, reference)

var visParamsRefl = {min: 0, max: 0.25}
var visParamsDn = {min: 0, max: 255}
Map.addLayer(reference, visParamsRefl, 'Reference')
Map.addLayer(highres, visParamsDn, 'highres')
Map.addLayer(result, visParamsRefl, 'Matched')

//
// Make the images for the article.
//
var blended1 = reference.visualize(visParamsRefl)
  .blend(result.visualize(visParamsRefl))

var blended2 = reference.visualize(visParamsRefl)
  .blend(highres.visualize(visParamsDn))

var thumbParams = {dimensions: 800}
print(blended1.clip(geometry).getThumbURL(thumbParams))
print(blended2.clip(geometry).getThumbURL(thumbParams))
print(blended1.clip(geometry2).getThumbURL(thumbParams))
print(reference.visualize(visParamsRefl)
  .clip(geometry2).getThumbURL(thumbParams))
print(blended2.clip(geometry2).getThumbURL(thumbParams))