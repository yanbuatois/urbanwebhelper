const {OAuth} = require('oauth');
const http = require('http');
const url = require('url');
const querystring = require('querystring');
const {EventEmitter} = require('events');

/**
 * Informations du token
 * @typedef {Object} Token
 * @property {string} token Token public
 * @property {string} secret Token secret
 */

/**
 * Classe qui représente la connexion à l'API UR
 * @type {module.UrbanOAuth}
 * @extends OAuth
 */
module.exports = class UrbanOAuth extends OAuth {

    /**
     * Constructeur de la classe
     * @param {string} key Clé d'API
     * @param {string} secret Secret d'API
     */
    constructor(key, secret) {
        super('https://www.urban-rivals.com/api/auth/request_token.php','https://www.urban-rivals.com/api/auth/access_token.php',key,secret,'1.0',null,'HMAC-SHA1');

        /**
         * URL de requête
         * @type {string}
         */
        this.apiUrl = 'https://www.urban-rivals.com/api/';

        /**
         * URL d'autorisation
         * @type {string}
         */
        this.authorizeUrl = 'https://www.urban-rivals.com/api/auth/authorize.php';

        /**
         * Tokens
         * @type {Token}
         */
        this.token = {};

        /**
         * Event Emitter pour détecter l'autorisation
         * @type {EventEmitter}
         */
        this.eventEmitter = new EventEmitter();

        // /**
        //  * Serveur web
        //  * @type {Server}
        //  */
        // this.webServer = http.createServer((req, res) => {
        //     const params = querystring.parse(url.parse(req.url).query);
        //     res.writeHead(200, {"Content-Type": "text/html"});
        //     if('oauth_token' in params) {
        //         res.write(`<html><head><meta charset="utf-8" /><title>Connecté</title></head><body><h1>Connexion réussie !</h1><p>Vous vous êtes correctement connecté au site Urban Rivals. Vous pouvez fermer cet onglet et revenir sur le logiciel.</p></body></html>`);
        //         this.eventEmitter.emit("authorized", params['oauth_token']);
        //     }
        //     else {
        //         res.write("<h1>Une erreur est survenue et aucun token n'a été envoyé. Prière de relancer l'application.</h1>")
        //     }
        //
        //     res.end();
        // });
    }

    /**
     * Send an oauth query
     * @param {string} call Method to call
     * @param {Object} [params={}] Params to sens to the api
     * @return {Promise<Object>} return a promise corresponding to the query
     */
    query(call, params = {}) {
        const query = [{
            "call": call,
            "params": params,
        }];

        const jsonEncodedQuery = JSON.stringify(query);

        return new Promise((resolve, reject) => {
            this.post(this.apiUrl,this.token.token, this.token.secret, {"request": jsonEncodedQuery}, 'application/x-www-form-urlencoded', (err, response, result) => {
                if(err) {
                    reject(err);
                }
                else {
                    resolve(JSON.parse(response)[call]);
                }
            });
        });
    }

    /**
     * Permet de récupérer le token de requête
     * @return {Promise<Token>}
     */
    getRequestToken() {
        return new Promise((resolve, reject) => {
            this.getOAuthRequestToken((err, token, token_secret) => {
                if (err) {
                    reject(err);
                }
                else {

                    const tokenObject = {
                        token: token,
                        secret: token_secret
                    };

                    resolve(tokenObject);
                }
            });
        });
    }

    /**
     * Permet de récupérer le token d'accès depuis celui de requête
     * @param {Token} requestToken Token de requête à transformer
     * @param {string} userToken Verifier obtenu par l'utilisateur
     * @return {Promise<Token>}
     */
    getAccessToken(requestToken, userToken) {
        return new Promise((resolve, reject) => {
            this.getOAuthAccessToken(requestToken.token, requestToken.secret, userToken, (err, accessToken, accessSecret, results) => {

                if(err)
                    reject(err);
                else {
                    this.token = {
                        token: accessToken,
                        secret: accessSecret
                    };

                    resolve(this.token);
                }
            })
        });
    }

    /**
     * Permet de sauvegarder le token
     * @return {Promise<string>}
     * @private
     */
    _saveToken() {
            return new Promise((resolve, reject) => {
                if(this._serializer !== null) {
                    this._serializer.serialize(this.token)
                        .then((fichier) => {
                            resolve(fichier);
                        })
                        .catch(err => {
                            reject(err);
                        });
                }
                else {
                    reject(new Error("serializer is null."));
                }
            });
    }

    /**
     * Permet de charger le token
     * @return {Promise<Token>}
     * @private
     */
    _loadToken() {
            return new Promise((resolve, reject) => {
                if(this._serializer !== null) {
                    this._serializer.deserialize()
                        .then((token) => {
                            resolve(token);
                        })
                        .catch(err => {
                            reject(err);
                        })
                }
                else {
                    reject(new Errror("serializer is null."));
                }
            });
    }

    /**
     * Permet de charger le token depuis le fichier
     * @return {Promise<boolean>} Renvoie vrai si le token a pu être récupéré et utilisé.
     */
    loadToken() {
        return new Promise((resolve, reject) => {
            if(this._serializer === null) {
                resolve(false);
            }
            else {
                this._serializer.access(fs.constants.F_OK)
                    .then(() => {
                        this._serializer.access(fs.constants.R_OK)
                            .then(() => {
                                this._loadToken()
                                    .then(token => {
                                        if (token.hasOwnProperty('type') && token.hasOwnProperty('token') && token.hasOwnProperty('secret')) {
                                            this.token = token;
                                            this.query("general.getPlayer")
                                                .then(() => {
                                                    resolve(true);
                                                })
                                                .catch((err) => {
                                                    resolve(false);
                                                })
                                        }
                                        else {
                                            reject(new Error("Le token sauvegardé est incomplet."));
                                        }
                                    })
                                    .catch(err => {
                                        reject(err);
                                    })
                            })
                            .catch(err => {
                                reject(err);
                            })
                    })
                    .catch(err => {
                        resolve(false);
                    })
            }
        });
    }

    /**
     * Permet de sauvegarder le token dans un fichier
     * @return {Promise<string>} Chemin du fichier
     */
    saveToken() {
        return new Promise((resolve, reject) => {
            this._saveToken()
                .then((fichier) => {
                    resolve(fichier);
                })
                .catch((err) => {
                    resolve(err)
                });
        });
    }

    testDejaConnecte(cookie) {
        return new Promise((resolve, reject) => {
           if(cookie.hasOwnProperty("token")) {
               const token = cookie.token;
               if(token.hasOwnProperty('token') && token.hasOwnProperty('private') && token.hasOwnProperty('status')) {
                   if(token.status === 'request' || token.status === 'authorized' || token.status === 'access') {

                   }
                   else {
                       reject(new Error("Le cookie contient des informations erronnées."));
                   }
               }
               else {
                   reject(new Error("Le cookie ne contient pas toutes les infos."))
               }
           }
           else {
               reject(new Error("Aucun token en cookie"))
           }
        });
    }

};

//                             if (token.hasOwnProperty('type') && token.hasOwnProperty('token') && token.hasOwnProperty('secret')) {