'use strict';

var async = require('async');
var Model = require('../models/tms.js');
var meta = require('./meta.js');

/**
* Query TMS model. Implements all protocols supported by /meta endpoint
*
* @param {Object} payload - Payload contains query paramters and their values
* @param {recordsCallback} cb - The callback that returns the records
*/
module.exports.query = function (payload, page, limit, cb) {
  // bounding box search | looks for bbox in payload

  var skip = limit * (page - 1);

  // Execute the search and return the result via callback
  Model.count(payload, function (err, count) {
    if (err) {
      return cb(err, null, null);
    }
    Model.find(payload, null, { skip: skip, limit: limit }).exec(function (err, records) {
      cb(err, records, count);
    });
  });
};

module.exports.addUpdate = function (payload, cb) {

  var images = [];

  async.each(payload.images, function (image, callback) {
    meta.addUpdateTms(image.uuid, payload.uri, function (err, meta) {
      images.push(meta);
      return callback(err);
    });
  }, function (err) {
    if (err) {
      return cb(err);
    }

    var options = { upsert: true, new: true };
    var query = { uri: payload.uri };
    payload.images = images;
    Model.findOneAndUpdate(query, payload, options, function (err, record) {
      if (err) {
        return cb(err);
      }

      cb(err, record);
    });

  });
};
