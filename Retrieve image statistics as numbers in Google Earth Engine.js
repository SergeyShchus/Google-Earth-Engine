//code for obtaining EVI index from two Landsat8 images and then calculating the difference between both.

var img_t0 = ee.Image('LANDSAT/LC8_L1T_TOA_FMASK/LC82330892017001LGN00');
var img_t1 = ee.Image('LANDSAT/LC8_L1T_TOA_FMASK/LC82330892017081LGN00');

function EVI(image) {
  var step1 = image.expression(
    '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))', {
      'NIR': image.select('B5'),
      'RED': image.select('B4'),
      'BLUE': image.select('B2')
      });
  var step2 = step1.updateMask(image.select(['fmask']).eq(0));  // mask everything different than 'clear'
  return step2
}

var n0 = EVI(img_t0);
var n1 = EVI(img_t1);

var diff = n0.subtract(n1);

// Mean and standard deviation reducers.
var meanReducer = ee.Reducer.mean();
var sigmaReducer = ee.Reducer.stdDev();

// Use the reducer to get the mean and SD of the image.
var mean = ee.Number(diff.reduceRegion({
  reducer: meanReducer,
  bestEffort: true,
}).get('constant'));

var sigma = ee.Number(diff.reduceRegion({
  reducer: sigmaReducer,
  bestEffort: true,
}).get('constant'));


print(mean, sigma, mean.add(sigma.multiply(2)));