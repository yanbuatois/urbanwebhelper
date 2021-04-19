const express = require('express');
const _ = require('underscore');
const imgur = require('imgur');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  // console.log(req.default.player);
  res.render('index', { default: req.default });
});

router.get('/trivial', async (req, res, next) => {
  try {
    const { urApi } = req;
    const tauxIllu = Number(req.body.illustration || 33);
    const tauxBio = Number(req.body.bio || 33);
    const tauxPouvoir = Number(req.body.pouvoir || 33);

    const choix = Math.random() * Math.floor(tauxIllu + tauxBio + tauxPouvoir);

    const { items: charas } = await urApi.query("characters.getCharacters", { sortby: 'clan', maxLevels: true });
    let type, question, reponse;
    if (choix < tauxIllu) {
      // Illu
      type = 'illustration';
      const { id, level_max } = charas[Math.floor(Math.random()*charas.length)];
      const level = (await urApi.query('characters.getCharacterLevels', {
        characterID: id,
        levelMax: -1,
        imageSize: 'large',
      })).items;
      const randLevel = level[Math.floor(Math.random()*level.length)];
      const previousUrl = randLevel.characterHDBigPictURL;
      const newUrl = (await imgur.uploadUrl(previousUrl)).data.link;
      question = `Quel personnage a l'illustration suivante ?<br/><blockquote>[img]${newUrl}[/img]</blockquote><br/><img src="${newUrl}" alt="Illustration" />`;
      reponse = randLevel.name;
    } else if (choix < tauxIllu + tauxBio) {
      type = 'biography';
      // Bio
      const randomChara = charas[Math.floor(Math.random()*charas.length)];
      question = `Quel personnage a la description suivante ?<br/><blockquote>${randomChara.description}</blockquote>`;
      reponse = randomChara.name;
    } else {
      type = 'pouvoir';
      const { items } = await urApi.query("characters.getCharacters", { maxLevels: true });
      const pouvoirsComptes = _.countBy(items, (char) => char.ability);
      const pouvoirsUniques = _.keys(_.pick(pouvoirsComptes, (value) => value === 1));
      const persosPouvoirsUniques = _.filter(items, (item) => pouvoirsUniques.includes(item.ability));
      const randomChara = persosPouvoirsUniques[Math.floor(Math.random()*persosPouvoirsUniques.length)];
      question = `Quel personnage a le pouvoir suivant ?<br/><blockquote>${randomChara.ability}</blockquote>`;
      reponse = randomChara.name;
      // Pouvoir unique
    }

    res.render('trivial', {
      type,
      question,
      reponse,
    });
  } catch (error) {
    console.error(error);
    res.render('errors/error', { error });
  }
});

module.exports = router;
