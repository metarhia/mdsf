'use strict';

api.test = {};

api.test.speed = function speedTest(caption, count, fn) {
  console.log(caption);
  var startTime = new Date().getTime();
  for (var i = 0; i < count; i++) fn();
  var endTime = new Date().getTime(),
      processingTime = endTime - startTime;
  console.log('Processing time: ' + processingTime + '\n');
};
