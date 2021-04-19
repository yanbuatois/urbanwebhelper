const express = require('express');
const router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.redirect('/');
});

// router.get('/clearpresets', (req, res, next) => {
//   // J'envoie la requête d'API pour avoir la liste des presets
//   req.urApi.query("collections.getPresets")
//     .then(({items}) => {
//       // Lorsque je la reçois, je fais une requête pour supprimer chaque preset.
//       const promesses = items.map(({id}) => req.urApi.query("collections.deleteSavedPreset", {presetID: id}));
//       // J'attends que les promesses se soient toutes exécutées.
//       Promise.all(promesses)
//         .then((infos) => {
//           res.redirect('/user/');
//         })
//         .catch((err) => {
//           console.log(err);
//           res.render('errors/error', {error: err});
//         });
//     })
//     .catch((err) => {
//       console.log(err);
//       res.render('errors/error', {error: err});
//     });
// })

router.get('/clearpresets', async (req, res, next) => {
  try {
    // J'envoie la requête d'API pour avoir la liste des presets
    const { items } = await req.urApi.query("collections.getPresets");
    // Lorsque je la reçois, je fais une requête pour supprimer chaque preset.
    // J'attends que les promesses se soient toutes exécutées.
    await Promise.all(items.map(({ id }) => req.urApi.query("collections.deleteSavedPreset", { presetID: id })));
    res.redirect('/user/');
  } catch (err) {
    console.log(err);
    res.render('errors/error', { error: err });
  }
});

module.exports = router;
