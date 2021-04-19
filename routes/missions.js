const express = require('express');
const router = express.Router();

/* GET missions page. */
router.get('/missions', function(req, res, next) {
  req.urApi.query('missions.getCategories').then((resultat) => {
    let missionsCategories = resultat.items;
    console.log(missionsCategories);
    missionsCategories.forEach((categorie) => {
      categorie.icon_url = categorie.icon_url.replace(/mission_categories/, 'icons');
      categorie.icon_url = categorie.icon_url.replace(/\.jpg$/, '.png');
      categorie.icon_url = categorie.icon_url.replace(/evo/, 'evolution');
      categorie.icon_url = categorie.icon_url.replace(/allstars/, 'allstar');
      categorie.icon_url = categorie.icon_url.replace(/legendaire/, 'ld');
      categorie.icon_url = categorie.icon_url.replace(/lajunta/, 'junta');
      categorie.icon_url = categorie.icon_url.replace(/degat/, 'degats');
      categorie.icon_url = categorie.icon_url.replace(/pillz/, 'pillz_plus');
      categorie.icon_url = categorie.icon_url.replace(/viemoins/, 'poison');
      categorie.icon_url = categorie.icon_url.replace(/vieplus/, 'vie_plus');
      categorie.icon_url = categorie.icon_url.replace(/tourney/, 'tournois');
    })
    res.render('missions', {
      default: req.default,
      missionsCategories: missionsCategories,
    });
  })
    .catch((err) => {
      res.render('errors/apierror', {error: err});
    })
})
  .get('/ajax/cmissions', (req, res, next) => {
    if(req.query.hasOwnProperty('categorie')) {
      req.urApi.query('missions.getMissionsInCategory', {categoryID:req.query.categorie}).then((resultat) => {
        res.json(resultat.items);
      })
        .catch(err => {
          res.status(502).send(err);
        })
    }
    else {
      res.status(404).send('None category specified')
    }
  });

module.exports = router;
