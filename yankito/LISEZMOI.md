# 🥊 Yankito — Boxe & Muscu

Application web installable sur l'iPhone : générateur de séances + carnet d'entraînement.
Aucun compte, aucun serveur : les données restent sur ton téléphone.

## Les fichiers (à quoi sert chacun)

| Fichier | Rôle |
|---|---|
| `index.html` | Le squelette de la page (en-tête, zone de contenu, barre d'onglets) |
| `style.css` | L'apparence : couleurs, tailles, arrondis, mise en page mobile |
| `data.js` | La « base de données » : ton matériel et tous les exercices |
| `app.js` | Le cerveau : générateur de séances, carnet, sauvegarde, affichage |
| `manifest.json` | La carte d'identité de l'appli (nom, icône, couleurs) pour l'installation |
| `sw.js` | Le « service worker » : permet d'ouvrir l'appli sans internet |
| `icons/` | Les icônes de l'écran d'accueil |

## Comment marche le générateur

1. Tu choisis le **jour** : l'appli sait que tu boxes lundi, mercredi et vendredi.
   - La **veille de boxe**, elle retire les exercices épuisants pour les jambes et une série par exercice.
   - Un **jour de boxe**, elle te conseille une séance courte de gainage.
2. Tu choisis l'**objectif** et la **durée** : elle prend une « recette » (par exemple pour la force :
   activation explosive → 3 supersets → circuit gainage) et ajoute des blocs tant qu'il reste du temps.
3. Pour chaque exercice, elle prend le **bon poids dans TON matériel** (le plus lourd pour la force,
   un plus léger pour la vitesse).
4. S'il reste du temps à la fin, elle ajoute un **finisher** : des rounds au punching-ball ou du fractionné.
5. Le bouton ↻ à côté d'un exercice le remplace par un autre du même type.

## Ajouter un exercice

Ouvre `data.js`, copie une ligne de la liste `EXOS`, change l'`id` (unique), le `nom`, le matériel (`eq`), etc.

## Mettre à jour l'appli sur le téléphone

Après une modification, change `VERSION` dans `sw.js` (par exemple `yankito-v2`), puis ferme et rouvre l'appli.

## Prochaines étapes prévues

- [x] Étape 1 : générateur + carnet + installation
- [ ] Étape 2 : mode séance (cocher les séries, chrono de repos, poids et répétitions notés)
- [ ] Étape 3 : mode rounds avec signal sonore
- [ ] Étape 4 : planning automatique de la semaine
- [ ] Étape 5 : progrès (graphiques, records, série de semaines)
- [ ] Étape 6 : page « Mon matériel » modifiable
