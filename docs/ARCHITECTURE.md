# Architecture technique

## Objectifs

- fonctionner immédiatement sans service cloud ;
- conserver toutes les données sur le poste ;
- rendre chaque calcul explicable ;
- ne dépendre d’aucun framework ou paquet tiers ;
- permettre une évolution vers une API hébergée, une authentification et des connecteurs d’entreprise.

## Composants

### Interface PWA

`public/index.html`, `public/styles.css` et `public/app.js` forment une application monopage sans dépendance externe. Le service worker met en cache uniquement l’interface. Les routes API restent toujours lues sur le serveur local pour éviter d’afficher des données périmées.

### Serveur

`server.js` utilise le module HTTP natif de Node.js. Il sert les fichiers publics, expose l’API JSON et produit les exports.

Mesures de base :

- limite des corps JSON à 1 Mo ;
- vérification des chemins de fichiers ;
- `nosniff`, politique de référent et isolation d’origine ;
- écoute sur `127.0.0.1` par défaut ;
- aucune télémétrie ;
- aucun secret dans le code.

### Moteur

`src/engine.js` contient des fonctions pures :

- calcul par initiative ;
- agrégation du portefeuille ;
- score d’opportunité des départements ;
- stratégie déterministe ;
- agrégation de la chaîne de valeur.

Le moteur est testé indépendamment de l’interface et de la base.

### Base SQLite

`src/database.js` utilise `node:sqlite`. Le schéma se trouve dans `src/schema.sql`.

Tables principales :

| Table | Rôle |
|---|---|
| `organizations` | Profil stratégique de l’entreprise. |
| `departments` | Échelle, coût, intensité, adoption et maturité des domaines. |
| `initiatives` | Coûts, mécanisme, valeur, frictions et décision. |
| `measurements` | Baselines, observations, cibles, unité, source et vérification. |
| `evidence` | Preuves, qualité, type de source et statut vérifié. |
| `research_sources` | Observations de contexte explicitement enregistrées. |
| `strategy_snapshots` | Historique des stratégies générées. |
| `audit_log` | Journal des mutations structurantes. |

La base réelle est ignorée par Git. Au premier démarrage, un jeu fictif est créé pour démontrer l’ensemble du produit.

## API

| Méthode | Route | Rôle |
|---|---|---|
| `GET` | `/api/health` | État du service local. |
| `GET` | `/api/state` | État complet, portefeuille, stratégie et flux calculés. |
| `POST` | `/api/profile` | Mettre à jour le profil entreprise. |
| `POST` | `/api/initiatives` | Créer une initiative. |
| `PATCH` | `/api/initiatives/:id` | Mettre à jour une initiative. |
| `POST` | `/api/initiatives/:id/measurements` | Ajouter une observation. |
| `POST` | `/api/initiatives/:id/evidence` | Ajouter une preuve. |
| `POST` | `/api/strategy/generate` | Enregistrer un instantané stratégique. |
| `GET` | `/api/export?format=json` | Export complet. |
| `GET` | `/api/export?format=csv` | Export tabulaire du portefeuille. |

## Évolutions prévues

L’architecture peut accueillir sans changer le modèle métier :

- authentification et séparation multi-entreprises ;
- connecteurs finance, RH, analytics et delivery ;
- collecte automatique de métriques signées ;
- groupes de comparaison et séries temporelles ;
- moteur de recherche d’entreprise avec sources autorisées ;
- workflow de validation finance / métier / gouvernance ;
- API compatible avec un data warehouse.

Ces extensions ne sont pas simulées dans la version actuelle.
