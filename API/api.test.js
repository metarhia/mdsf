'use strict';

api.test = {};

api.test.speed = function speedTest(caption, count, fn) {
  console.log(caption);
  let startTime = new Date().getTime();
  for (let i = 0; i < count; i++) fn();
  let endTime = new Date().getTime(),
      processingTime = endTime - startTime;
  console.log('Processing time: ' + processingTime + '\n');
};
