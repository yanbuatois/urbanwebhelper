"use strict";

const express = require('express');

const router = express.Router();
/* GET home page. */

router.get('/', function (req, res, next) {
  // console.log(req.default.player);
  res.render('index', {
    default: req.default
  });
});
module.exports = router;
//# sourceMappingURL=index.js.map