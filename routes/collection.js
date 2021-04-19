const express = require('express');
const router = express.Router();
const fs = require('fs');
const icu = require('full-icu');
const _ = require('underscore');

router.get('/', async function(req, res, next) {
    req.urApi.query('collections.getSummary')
        .then(async function(result) {
            try {
                let totalTailleCollec = 0;
                result.items.forEach((item) => {
                    totalTailleCollec += item.nbOwnedTotal;
                });

                let nbPages = Math.ceil(totalTailleCollec / 52);

                let analyse, fullcollection, page, infoCollec;
                page = 0;
                fullcollection = [];

                let promesses = [];
                promesses[0] = req.urApi.query('collections.getClanSummary', {
                    ownedOnly: true,
                });
                for (let page = 0; page < nbPages; ++page) {
                    promesses[1 + page] = req.urApi.query('collections.getCollectionPage', {
                        page,
                        nbPerPage: 52,
                        sortBy: "clan",
                    });
                }

                const results = await Promise.all(promesses);

                results.forEach((unResultat, index) => {
                    if (index === 0) {
                        cartes = unResultat.items;
                    } else {
                        fullcollection = fullcollection.concat(unResultat.items);
                    }
                });

                // const cartes = (await req.urApi.query('characters.getCharacters')).items;
                let valeurs = {};

                // cartes.forEach(async (item) => {
                // for(let i = 0; i < cartes.length; ++i) {
                await Promise.all(cartes.map(async(carte) => {
                    // const item = cartes[i];
                    const item = carte;
                    const niveaux = {
                        zeroxp: 0,
                        full: 0,
                    };
                    fullcollection.forEach((collectionitem) => {
                        if (collectionitem.id === item.id) {
                            if (collectionitem.level === 1 && collectionitem.xp === 0) {
                                niveaux.zeroxp++;
                            } else {
                                niveaux.full++;
                            }
                        }
                    });


                    try {
                        const listeValeurs = {
                            val0xp: 0,
                            valfull: 0,
                        };

                        if (carte.is_tradable && (niveaux.zeroxp || niveaux.full)) {
                            const vfull = (await req.urApi.query('market.getCharactersPricesCurrent', {
                                charactersIDs: item.id
                            }));

                            const nb = vfull.items[0].min;

                            listeValeurs.valfull = nb * niveaux.full;
                            listeValeurs.val0xp = nb * 1.1 * niveaux.zeroxp;
                        }

                        const nbCartes = niveaux.zeroxp + niveaux.full;
                        const valeur = listeValeurs.val0xp + listeValeurs.valfull;

                        valeurs[item.name] = {
                            nbCartes: nbCartes,
                            valeur: Math.floor(valeur),
                            valeurTexte: Math.floor(valeur).toLocaleString("fr-FR"),
                        };

                    } catch (e) {
                        console.error(e);
                        res.render('errors/error', { error: e });
                    }
                }));

                // console.log(valeurs);

                // console.log(cartes);
                // console.log(result.items);

                res.render('collection', {
                    default: req.default,
                    summary: result.items,
                    valeurs,
                    totalSummary: cartes,
                });
            } catch (e) {
                console.error(e);
                res.render('errors/error', { error: e });
            }
        })
        .catch(err => {
            console.error(err);
            res.render('errors/error', { error: err });
        })
});

router.get('/doubles/:montant?', async(req, res, next) => {
    try {
        const min = (req.params.montant) ? req.params.montant : 0;
        const summary = (await req.urApi.query("collections.getSummary")).items;
        // console.log(summary);
        // summary.forEach((element) => {
        //   if(element.id === 1760)
        //     console.log(element);
        // })
        // const totalCartes = summary.reduce((memo, {nbOwnedDistinct, nbOwnedTotal}) => memo + (nbOwnedTotal-nbOwnedDistinct), 0);
        const totalCartes = summary.reduce((memo, { nbOwnedTotal }) => memo + nbOwnedTotal, 0);
        const nbPages = Math.ceil(totalCartes / 52);
        const queries = [];
        console.log(totalCartes);
        console.log(nbPages);
        for (let i = 0; i < nbPages; ++i) {
            queries[i] = req.urApi.query("collections.getCollectionPage", {
                page: i,
                nbPerPage: 52,
                // groupBy: "double",
            });
        }

        const pages = (await (Promise.all(queries))).map((item) => item.items);
        const pagesPlates = _.flatten(pages);
        const doublesPairs = _.pairs(_.pick(_.countBy(pagesPlates, ({ id }) => id), (value) => value >= 2));
        // console.log(doublesPairs);
        const doubles = doublesPairs.map((elt) => ({ id: elt[0], nb: elt[1] }));
        // const ids = ;
        const prix = _.flatten((await Promise.all(doubles.map(({ id }) => req.urApi.query("market.getCharactersPricesCurrent", {
            charactersIDs: id,
        })))).map((reponse) => reponse.items));

        const persos = (await req.urApi.query("characters.getCharacters")).items;
        // console.log(prix);
        const valeurs = doubles.map(({ id, nb }) => ({ id: parseInt(id), prix: nb * (prix.find(elt => (parseInt(id) === elt.id)).min), name: (persos.find(elt => (parseInt(id) === elt.id)).name) }));
        const valeursTri = valeurs.sort((a, b) => b.prix - a.prix);
        const valeursTriPallier = valeurs.filter(({ prix }) => prix >= min);


        // console.log((await req.urApi.query("characters.getCharacters")).items);
        // console.log(summary);
        // console.log(pagesPlates);
        // console.log(prix);
        // console.log(prix);
        // console.log(doubles);
        res.render('listedoubles', { doubles: valeursTriPallier, default: req.default });
    } catch (error) {
        console.error(error);
        res.render('errors/error', { error });
    }

});

router.get('/listesemi', async(req, res, next) => {
    try {
        const semis = await recupSemiEvo(req.urApi);
        // let listeclans = semis.map(({clan_name, clan_id}) => ({clan_name, clan_id}));
        // listeclans = _.uniq(listeclans);
        const listeclans = (await req.urApi.query("characters.getClans")).items;
        // console.log(listeclans);
        res.render('listesemi', { listeclans, semis, default: req.default, })
    } catch (error) {
        console.log(error);
        res.render('errors/error', { error });
    }
});

router.get('/annee', async(req, res, next) => {
    const cartes = await req.urApi.query('characters.getCharacters', { maxLevels: true });
    const filtrees = cartes.items.filter((value) => {
        const date = new Date(Number(value.release_date) * 1000);
        // date.setTime(value.release_date);
        console.log(date.getFullYear());
        return date.getFullYear() === 2018;
        // return console.log(value);
    });

    console.log(filtrees.length);
});

router.get('/faiblediff', async(req, res, next) => {
    try {
        const listeclans = (await req.urApi.query("characters.getClans")).items;
        const semis = (await recupFaibleDiff(req.urApi));

        res.render('listesemi', { listeclans, semis, default: req.default });
    } catch (error) {
        console.log(error);
        res.render('errors/error', { error });
    }
});

router.get('/fulldeck', async (req, res, next) => {
    try {
        const listePersos = (await req.urApi.query('collections.getSummary')).items;

        const nbCartes = listePersos.reduce(((accumulator, currentValue) => accumulator + currentValue.nbOwnedDistinct),0 );

        const nbPages = Math.ceil(nbCartes / 52);

        const promesses = [];
        for (let i = 0; i < nbPages; ++i) {
            promesses.push(req.urApi.query('collections.getCollectionPage', {
                page: i,
                nbPerPage: 52,
                groupBy: 'best',
            }));
        }

        const pages = (await Promise.all(promesses)).map(elt => elt.items);
        const collec = _.flatten(pages);

        const listeIDs = collec.map(elt => elt.id_player_character);

        await req.urApi.query('collections.setSelectionAsDeck', {
            characterInCollectionIDs: listeIDs,
        });

        res.redirect('/');
    } catch (error) {
        console.log(error);
        res.render('errors/error', { error });
    }
});

router.get('/rarities', async (req, res, next) => {
    const {urApi} = req;
    try {
        const { items } = await urApi.query('characters.getCharacters', { maxLevels: true });

        // console.log(items);
        const clans = {};
        const clansGroups = _.groupBy(items, ({ clan_name }) => clan_name);

        for (const clansKey in clansGroups) {
            const raritiesGroup = _.groupBy(clansGroups[clansKey], ({ rarity }) => rarity);

            const raritiesNb = {};
            for (const key in raritiesGroup) {
                raritiesNb[key] = raritiesGroup[key].length;
            }

            clans[clansKey] = raritiesNb;
        }

        console.log(clans);
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.render('errors/error', { error });
    }
});

router.get('/listePouvoirsUniques', async(req, res, next) => {
    const urApi = req.urApi;
    try {
        const { items } = await urApi.query("characters.getCharacters", { sortby: 'clan', maxLevels: true });
        const pouvoirsComptes = _.countBy(items, (char) => char.ability);
        const pouvoirsUniques = _.keys(_.pick(pouvoirsComptes, (value) => value === 1));
        const persosPouvoirsUniques = _.filter(items, (item) => pouvoirsUniques.includes(item.ability));
        // console.log(persosPouvoirsUniques);
        const listeclans = (await urApi.query("characters.getClans")).items;

        res.render('listesemi', { listeclans, semis: persosPouvoirsUniques, default: req.default });
    } catch (error) {
        console.error(error);
        res.render('errors/error', { error });
    }
});

router.get('/missionsYear', async (req, res, next) => {
    const {urApi} = req;
    try {
        const perYear = await createCardsByYear(urApi, true);
        res.render('missionsyear', {perYear, default: req.default });
    } catch (error) {
        console.error(error);
        res.render('errors/error', { error });
    }
});

/**
 *
 * @param urApi {module.UrbanOAuth}
 * @return {Promise<Array<Object>>}
 */
async function recupSemiEvo(urApi) {
    const { items } = await urApi.query("characters.getCharacters", { sortby: 'clan' /*, maxLevels: true*/ });
    // console.log(items);
    const semiPersos = items.filter(perso => ((perso.level_max > perso.ability_unlock_level && perso.ability_id !== 0) || (perso.level_min === 1 && perso.power >= 6)));
    // console.log(semiPersos);



    const semiNiveauxResultats = await Promise.all(semiPersos.map(({ id, level_max }) => urApi.query("characters.getCharacterLevels", { characterID: id, levelMax: level_max - 1 })));
    const semiNiveauxCartes = semiNiveauxResultats.map(({ items }) => items);
    const test = semiNiveauxCartes.filter(entree => entree.id === 140);
    // console.log(test);

    const semiNiveauxMerged = [].concat.apply([], semiNiveauxCartes);

    const semiNiveauxSeuls = semiNiveauxMerged.filter(({ level, ability_unlock_level, level_max, power, ability_id }) => (((level_max > ability_unlock_level) && (level >= ability_unlock_level) && (ability_id !== 0)) || (level === 1 && power >= 6)));

    return semiNiveauxSeuls;
}

/**
 *
 * @param urApi {module.UrbanOAuth}
 * @return {Promise<Array<Object>>}
 */
async function recupFaibleDiff(urApi) {
    const { items } = await urApi.query("characters.getCharacters", { sortby: 'clan' });
    const infosCartesFD = await Promise.all(items.map(({ id }) => urApi.query("characters.getCharacterLevels", { characterID: id })));
    const listeFiltree = (infosCartesFD.map(({ items }) => {
        let precedent = [];
        let precedentScore = 0;
        const resultat = [];
        for (const element of items) {
            const score = totalScorePerso(element);
            // if(element.id === 418) {
            //   // console.log(element);
            //   console.log(precedentScore);
            //   console.log(score);
            // }
            if (precedent !== []) {
                if (score <= precedentScore + 1) {
                    //          console.log('ajout');
                    resultat.push(precedent);
                }
            }
            precedentScore = score;
            precedent = element;
        }

        return resultat;
    })).filter((elt) => (elt !== []));
    const listeFiltreeMerged = [].concat.apply([], listeFiltree);

    return listeFiltreeMerged;
}

/**
 *
 * @param perso
 * @return {number}
 */
const totalScorePerso = (perso) => perso.damage + perso.power + (perso.ability_id !== 0 ? 1 : 0);

async function createCardsByYear(urApi, onlyMissing = false) {
    const characters = (await urApi.query('collections.getClanSummary', {
        clanID: 0,
    })).items;

    const filteredCharacters = onlyMissing ? characters.filter((elt) => !elt.totalOwnedCharacters) : characters;
    const dateCharacters = filteredCharacters.map(elt => {
        elt.release_date = new Date(Number(elt.release_date) * 1000);
        return elt;
    });

    const byDay = _.groupBy(dateCharacters, (elt) => elt.release_date.getFullYear());

    return byDay;
}

module.exports = router;
