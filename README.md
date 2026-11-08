# Sudoku

Des grilles de sudoku générées à la volée, toujours à solution unique, en cinq niveaux. Notes au crayon, annulation, indices, erreurs à montrer ou non, et la partie en cours gardée d'une ouverture à l'autre.

*English version: [README.en.md](README.en.md)*

## Le but

Remplir la grille de 9 × 9 pour que chaque ligne, chaque colonne et chaque carré de 3 × 3 contienne une fois les chiffres de 1 à 9.

## Les niveaux

| Niveau | Chiffres donnés au départ |
|---|---|
| Facile | 40 |
| Moyen | 32 |
| Difficile | 27 |
| Expert | 23 |
| Diabolique | 21 |

Chaque grille est créée au moment où tu la demandes, et le plugin vérifie qu'elle n'a qu'une seule solution.

## Jouer

- Clique une case, puis un chiffre sur le pavé (ou au clavier). Sous chaque chiffre du pavé, le nombre d'exemplaires qui restent à placer ; ✓ quand ils sont tous posés.
- La ligne, la colonne et le carré de la case choisie sont surlignés, ainsi que les cases qui portent le même chiffre.
- Retaper le même chiffre l'enlève.
- **Notes** : en mode notes, les chiffres s'écrivent en petit comme candidats. Un chiffre juste posé disparaît tout seul des notes de sa ligne, de sa colonne et de son carré.
- **Effacer** vide la case, **Annuler** revient en arrière (jusqu'à 300 coups).
- **Indice** remplit la case choisie avec le bon chiffre (ou une case au hasard si elle est déjà juste).
- **Montrer les erreurs** colore en rouge les chiffres faux.

## Clavier

- **1 à 9** : remplir ; **Maj + chiffre** (ou **N** pour basculer le mode notes) : noter.
- **Flèches** : changer de case.
- **Retour arrière** ou **Suppr** : effacer.
- **Ctrl + Z** : annuler.

## Temps et records

Le chrono tourne pendant que le plugin est affiché. Le haut indique le nombre d'erreurs, d'indices utilisés et le meilleur temps du niveau. Une grille finie plus vite que ton record donne un nouveau record ; le nombre de grilles finies est compté par niveau.

## Données et synchronisation

Meilleurs temps, grilles finies et partie en cours sont enregistrés par NeoDex, sauvegardés et synchronisés entre tes PC si la synchro est activée. Au premier lancement, le plugin reprend ce que tu avais déjà dans NeoDex.

## Installer

Dans NeoDex : **NeoStore → À découvrir → Sudoku → Installer**.

Développer un plugin : voir le [SDK NeoDex](https://github.com/NDesumeur/neodex-sdk).
