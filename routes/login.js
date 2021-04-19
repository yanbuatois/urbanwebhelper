const express = require('express');
const router = express.Router();
const UROAuth = require('../classes/oauthurban');
const config = require('../config');
const url = require('url');

router.get('/login', (req, res, next) => {
  const oa = new UROAuth(config.key, config.secret);

  oa.getRequestToken()
    .then((token) => {
      req.session.oauth_token = token;

      const callbackUrl = {
        protocol: req.protocol,
        host: req.get('host'),
        pathname: 'authorized',
      };

      const authorizeUrl = url.parse("https://www.urban-rivals.com/api/auth/authorize.php");
      authorizeUrl.query = {
        'oauth_token': token.token,
        'oauth_callback': url.format(callbackUrl)
      };

      res.redirect(url.format(authorizeUrl));
    })
    .catch((err) => {
      res.render('errors/apierror', {error : err});
    });
})
  .get('/authorized', (req, res, next) => {
    if(req.query.hasOwnProperty('oauth_token') && req.session.oauth_token) {
      const oa = new UROAuth(config.key, config.secret);

      oa.getAccessToken(req.session.oauth_token, req.query.oauth_token)
        .then((token) => {
          req.session.oauth_token = null;
          req.session.access_token = token;
          if(req.session.originalPath) {
            let redir = req.session.originalPath;
            req.session.originalPath = undefined;
            res.redirect(redir);
          }
        })
        .catch((err) => {
          res.render('errors/apierror', {error: err});
        })
    }
    else {
      res.redirect('/');
    }
  });

module.exports = router;