/* =====================================================================
 * curriculum.js — CURRICULUM MAP (data only, no logic)
 *
 * Source of truth, in this order:
 *   PE  = Plan d'études, École fondamentale (MENJE), Mathématiques – Cycle 4,
 *         pp. 115–131 (compétences générales + C4 : Espace et formes,
 *         Nombres et opérations, Grandeurs et mesures, Résolution de
 *         problèmes d'arithmétique, with their "Contenus recommandés").
 *   NC  = Niveaux de compétence, cycles 1–4 (MENJE), pp. 25–32, niveaux 7–10
 *         (the cycle-4 band; "socle cycle 4" = niveau 10).
 *   MT  = MathemaTIC Curriculum, "Grades 5 & 6" (= cycle 4.1 / 4.2).
 *
 * Every objective keeps the PDF's own French wording ("fr"). The app shows
 * this official wording in the teacher dashboard in every UI language;
 * translated headings for domains/competences live in lang/*.js.
 *
 * Exercise templates reference these IDs (template.objectives). The
 * coverage table (tools/coverage.js, docs/COVERAGE.md) is generated from
 * those references, so it cannot drift from the code.
 * ===================================================================== */
(function (root) {
  'use strict';

  const CURRICULUM = {
    meta: {
      cycle: 'Cycle 4.1 (5e année, enseignement fondamental, Luxembourg)',
      sources: {
        PE: "Plan d'études – École fondamentale, Mathématiques C4, pp. 115–131",
        NC: 'Niveaux de compétence – Enseignement fondamental cycles 1–4, pp. 25–32',
        MT: 'MathemaTIC Curriculum (MENJE/Vretta), Grades 5 & 6'
      }
    },

    /* ---------- Compétences mathématiques générales (PE p. 115) -------- */
    general: [
      { id: 'GC.1', fr: 'Résoudre des problèmes', ex: [
        'Explorer, reconnaître et utiliser des faits et structures mathématiques et les transférer dans des situations similaires',
        'Utiliser ses savoirs et savoir-faire mathématiques lors de la résolution de problèmes mathématiques',
        'Reconnaître des règles et des relations mathématiques',
        'Développer et utiliser des stratégies de résolution',
        'Examiner des solutions'] },
      { id: 'GC.2', fr: 'Argumenter', ex: [
        "Discuter et vérifier l'exactitude des solutions et explications mathématiques",
        'Reconnaître des relations mathématiques et formuler des hypothèses',
        'Savoir formuler, développer et justifier des explications mathématiques',
        "Être prêt à adopter d'autres points de vue après les avoir jugés et vérifiés"] },
      { id: 'GC.3', fr: 'Communiquer', ex: [
        "Décrire sa propre démarche de résolution d'un problème, comprendre d'autres solutions et discuter ensemble les démarches utilisées",
        'Connaître et savoir utiliser oralement des symboles et termes mathématiques',
        'Résoudre ensemble des problèmes en concluant et en respectant des accords communs'] },
      { id: 'GC.4', fr: 'Modéliser', ex: [
        'Interpréter des situations de la vie courante ou proches de la vie en en dégageant les informations essentielles et en les exprimant dans un modèle',
        'Encoder des situations-problèmes ou des situations de la vie courante en utilisant des symboles et des termes mathématiques',
        'Recoder et interpréter des solutions mathématiques en les transposant dans une situation de vie',
        "Formuler des problèmes mathématiques à partir d'illustrations, de représentations graphiques et d'équations"] },
      { id: 'GC.5', fr: 'Représenter', ex: [
        'Développer, choisir et utiliser des représentations graphiques appropriées pour la résolution de problèmes mathématiques',
        "Comparer et juger différentes représentations graphiques d'un problème mathématique"] }
    ],

    /* ---------- Domaines de contenu, cycle 4 (PE pp. 128–131) ---------- */
    domains: [
      {
        id: 'EF', fr: 'C4 : Espace et formes', page: 'PE p. 128–129',
        competences: [
          { id: 'EF.1', fr: "S'orienter dans le plan et l'espace",
            nc: { 7: "L'élève sait naviguer sur des grilles grâce aux coordonnées qui lui sont données.",
                  8: "L'élève dessine des plans simples sans aide et y indique l'emplacement d'objets.",
                  9: "L'élève tient compte de l'échelle en dessinant un plan, même s'il s'agit d'un plan plus complexe.",
                  10: "L'élève repère sa position sur une carte et la communique à l'aide d'un système de coordonnées." },
            objectives: [
              { id: 'EF.1.1', fr: "Se repérer et communiquer sa position dans le plan cartésien à l'aide d'un système d'axes orthonormé et de coordonnées" },
              { id: 'EF.1.2', fr: 'Lire et dessiner des plans et des cartes simples' },
              { id: 'EF.1.3', fr: "Reconnaître, décrire et utiliser des relations spatiales à l'aide de cartes, plans, vues, maquettes…" },
              { id: 'EF.1.4', fr: 'Dessiner des tracés' }
            ] },
          { id: 'EF.2', fr: "Analyser et représenter des figures géométriques dans le plan et l'espace",
            nc: { 7: "L'élève fabrique et analyse des modèles de solides et il représente des modèles tridimensionnels sur un plan bidimensionnel.",
                  8: "L'élève décrit le triangle isocèle et rectangle, le carré, le rectangle, selon le nombre de côtés, le nombre d'angles droits, les côtés de même mesure, le parallélisme des côtés et les symétries internes.",
                  9: "L'élève identifie et produit des angles droits, aigus et obtus.",
                  10: "L'élève interprète la représentation en perspective d'un solide ou d'un assemblage de solides (p. ex. nombre de faces visibles ou invisibles)." },
            objectives: [
              { id: 'EF.2.1', fr: 'Fabriquer des patrons à partir de solides réguliers' },
              { id: 'EF.2.2', fr: 'Faire correspondre des solides réguliers avec les patrons respectifs et inversement' },
              { id: 'EF.2.3', fr: 'Classifier des solides selon leurs propriétés' },
              { id: 'EF.2.4', fr: 'Reconnaître, décrire et classifier des triangles et des quadrilatères selon leurs propriétés' },
              { id: 'EF.2.5', fr: 'Représenter des surfaces et des solides' },
              { id: 'EF.2.6', fr: 'Faire correspondre les représentations à deux et à trois dimensions de formes géométriques' },
              { id: 'EF.2.7', fr: 'Découvrir et observer des solides (cube, parallélépipède, pyramide, cylindre, cône, boule) et les décrire' },
              { id: 'EF.2.8', fr: 'Construire et étudier des modèles de solides (composer, décomposer, assembler, découper, plier…)' },
              { id: 'EF.2.9', fr: 'Mesurer, tracer, nommer et comparer des angles' },
              { id: 'EF.2.10', fr: "Faire des constructions géométriques avec une équerre et/ou un compas" },
              { id: 'EF.2.11', fr: "Développer les habiletés du dessin à la main libre en utilisant des patrons, l'équerre et le compas" },
              { id: 'EF.2.12', fr: "Utiliser l'équerre et le compas pour la construction de figures géométriques à partir d'indications de mesure et la mesure de segments" }
            ] },
          { id: 'EF.3', fr: 'Reconnaître et créer des motifs et des structures géométriques',
            nc: { 7: "L'élève reconnaît tous les axes de symétrie dans des figures régulières et réalise lui-même des modèles symétriques.",
                  8: "L'élève identifie et décrit les lois et les relations (symétrie axiale, translation) qui existent dans des motifs et des structures géométriques.",
                  9: "L'élève transforme des motifs et des structures géométriques de manière systématique et selon des règles déterminées en utilisant l'équerre et/ou le compas.",
                  10: "L'élève évalue les conséquences des modifications apportées à des motifs et des structures (forme, taille, disposition des éléments), il les adapte ou les optimise en fonction des consignes données." },
            objectives: [
              { id: 'EF.3.1', fr: "Identifier, décrire et représenter les régularités d'une frise ou d'un pavage" },
              { id: 'EF.3.2', fr: 'Identifier les lois et les relations qui existent dans des frises et des pavages' },
              { id: 'EF.3.3', fr: "Poursuivre la construction d'une frise ou d'un pavage" },
              { id: 'EF.3.4', fr: 'Modifier, adapter et créer une frise ou un pavage' },
              { id: 'EF.3.5', fr: 'Créer des motifs et des structures géométriques avec des surfaces et des solides' }
            ] },
          { id: 'EF.4', fr: 'Combiner des connaissances géométriques et arithmétiques afin de résoudre des problèmes mathématiques',
            nc: { 7: "L'élève produit des figures d'une aire ou d'un périmètre déterminé.",
                  8: "L'élève calcule en situation le périmètre et l'aire d'un carré et d'un rectangle, à condition que les longueurs soient exprimées en cm et en nombres naturels.",
                  9: "L'élève calcule en situation l'aire d'un triangle et d'un parallélogramme, ainsi que le volume et la surface d'un cube et d'un parallélépipède.",
                  10: "L'élève calcule par décomposition l'aire de surfaces complexes ainsi que la surface et le volume de solides complexes." },
            objectives: [
              { id: 'EF.4.1', fr: 'Reconnaître les rapports entre aires et longueurs auprès de triangles et de quadrilatères' },
              { id: 'EF.4.2', fr: "Calculer le périmètre et l'aire d'un carré et d'un rectangle" },
              { id: 'EF.4.3', fr: "Calculer l'aire d'un triangle et d'un parallélogramme" },
              { id: 'EF.4.4', fr: "Calculer le volume et la surface d'un cube et d'un parallélépipède" },
              { id: 'EF.4.5', fr: "Visualiser les formules pour le calcul du périmètre, de l'aire et du volume" }
            ] }
        ],
        contents: [
          { id: 'EF.C1', fr: 'Espace : repérage sur un axe, repérage dans le plan cartésien' },
          { id: 'EF.C2', fr: 'Solides : connaissance de leurs propriétés (faces, sommets ou arêtes) - comparaison : cube, parallélépipède, boule, pyramide, prisme, cylindre, cône - développement' },
          { id: 'EF.C3', fr: 'Surfaces : triangle rectangle, triangle isocèle, triangle scalène, triangle équilatéral' },
          { id: 'EF.C4', fr: 'Lignes (droites et segments)' },
          { id: 'EF.C5', fr: 'Parallélisme, perpendicularité' },
          { id: 'EF.C6', fr: 'Angles droits, plats, aigus, obtus' },
          { id: 'EF.C7', fr: 'Étude du cercle (rayon, diamètre)' },
          { id: 'EF.C8', fr: 'Symétrie axiale et centrale, translation' },
          { id: 'EF.C9', fr: 'Distance' },
          { id: 'EF.C10', fr: 'Périmètre' },
          { id: 'EF.C11', fr: "Aire du carré, du rectangle et du parallélogramme, aire du triangle" },
          { id: 'EF.C12', fr: 'Volume du cube, du parallélépipède' },
          { id: 'EF.C13', fr: 'km<->m, m<->dm, dm<->cm, cm<->mm' },
          { id: 'EF.C14', fr: 'm2<->dm2, dm2<->cm2, cm2<->mm2' },
          { id: 'EF.C15', fr: 'm3<->dm3, dm3<->cm3, cm3<->mm3' }
        ]
      },
      {
        id: 'NO', fr: 'C4 : Nombres et opérations', page: 'PE p. 129–130',
        competences: [
          { id: 'NO.1', fr: "S'orienter dans l'espace numérique",
            nc: { 7: "L'élève repère, classe et compare les nombres naturels supérieurs à 1.000.000 ainsi que les nombres décimaux simples.",
                  8: "L'élève lit et écrit des fractions simples et des nombres décimaux avec au maximum 2 décimales.",
                  9: "L'élève reconnaît un nombre sous diverses écritures et établit quelques égalités (p. ex. 1/2 = 0,5 = 5/10…) et il convertit les fractions courantes en nombres décimaux et inversement.",
                  10: "L'élève compare, ordonne, encadre et intercale des fractions et des nombres décimaux et il extrait le nombre de dixièmes, de centièmes et de millièmes d'un nombre décimal." },
            objectives: [
              { id: 'NO.1.1', fr: 'Construire la notion de nombre rationnel positif' },
              { id: 'NO.1.2', fr: 'Comparer, ordonner, encadrer, intercaler des fractions et des nombres décimaux' },
              { id: 'NO.1.3', fr: 'Établir des fractions équivalentes' },
              { id: 'NO.1.4', fr: 'Réduire des fractions' },
              { id: 'NO.1.5', fr: "Passer du mot-nombre (oral ou écrit) d'une fraction ou d'un nombre ayant au plus 3 décimales à son écriture chiffrée et inversement" },
              { id: 'NO.1.6', fr: 'Représenter et lire des nombres sur une droite numérique' },
              { id: 'NO.1.7', fr: "Extraire le nombre de dixièmes, centièmes et de millièmes d'un nombre" },
              { id: 'NO.1.8', fr: 'Reconnaître un nombre sous diverses écritures et établir quelques égalités (1/2 = 0,5 = 5 dixièmes = 5/10…)' },
              { id: 'NO.1.9', fr: "Exploration de l'infiniment grand et de l'infiniment petit" }
            ] },
          { id: 'NO.2', fr: 'Savoir effectuer des opérations arithmétiques',
            nc: { 7: "L'élève effectue des opérations d'addition, de soustraction, de multiplication et de division comportant au maximum 8 chiffres significatifs de manière appropriée à la situation, soit mentalement, en notant les résultats intermédiaires ou par écrit.",
                  8: "L'élève effectue et verbalise des opérations arithmétiques avec des nombres décimaux comportant au maximum 2 décimales et 8 chiffres significatifs.",
                  9: "L'élève réduit des fractions et il établit des fractions équivalentes afin d'effectuer des opérations d'addition et de soustraction.",
                  10: "L'élève résout des équations comportant un nombre inconnu et au maximum 6 chiffres significatifs et une opération." },
            objectives: [
              { id: 'NO.2.1', fr: 'Utiliser les algorithmes du calcul écrit pour les nombres naturels' },
              { id: 'NO.2.2', fr: 'Effectuer et verbaliser des opérations arithmétiques dans le domaine des nombres fractionnés' },
              { id: 'NO.2.3', fr: "Estimer l'ordre de grandeur d'un résultat" },
              { id: 'NO.2.4', fr: "Vérifier le résultat trouvé soit par écrit, soit à l'aide de la calculatrice" },
              { id: 'NO.2.5', fr: 'Résoudre des équations comportant un nombre inconnu' },
              { id: 'NO.2.6', fr: 'Calculer des expressions mathématiques' }
            ] },
          { id: 'NO.3', fr: 'Reconnaître des structures et des règles arithmétiques',
            nc: { 7: "L'élève utilise de manière appropriée à la situation les propriétés de la multiplication et de la division pour effectuer des calculs de manière efficace.",
                  8: "L'élève exécute, sans aide, des exercices de recherche simples (nombres premiers, nombre de diviseurs d'un nombre) et il utilise le système de numération.",
                  9: "L'élève reconnaît les lois arithmétiques de base (associativité, commutativité, distributivité) et il les utilise de manière appropriée à la situation pour effectuer des calculs de manière efficace.",
                  10: "L'élève utilise les opérations de réciprocité des quatre opérations de base pour résoudre des équations et continuer des suites de nombres complexes." },
            objectives: [
              { id: 'NO.3.1', fr: 'Étudier la divisibilité des nombres naturels' },
              { id: 'NO.3.2', fr: 'Utiliser des algorithmes pour effectuer des calculs de façon efficace avec des nombres écrits sous forme décimale' },
              { id: 'NO.3.3', fr: "Utiliser des propriétés de l'addition et de la multiplication (commutativité, associativité, distributivité) et décomposer les nombres pour effectuer des calculs de manière efficace" }
            ] },
          { id: 'NO.4', fr: 'Représenter et communiquer correctement les nombres et opérations',
            nc: { 7: "L'élève crée sans aide et présente des diagrammes (circulaires, à bâtonnets) à partir d'une série de données.",
                  8: "L'élève collecte une série de données numériques et il en calcule la moyenne arithmétique.",
                  9: "L'élève collecte, trie et organise des données numériques à partir d'une situation de la vie quotidienne, il en fait des tableaux et des diagrammes et il les présente.",
                  10: "L'élève lit et interprète des données représentées par des nombres fractionnaires (pourcent, nombres décimaux, fractions simples)." },
            objectives: [
              { id: 'NO.4.1', fr: 'Comprendre et utiliser le tableau de numération élargi' },
              { id: 'NO.4.2', fr: 'Reconnaître et résoudre des situations de linéarité (suites proportionnelles)' },
              { id: 'NO.4.3', fr: 'Lire des représentations graphiques de situations de la vie courante' },
              { id: 'NO.4.4', fr: 'Lire et établir des tableaux de correspondance' }
            ] }
        ],
        contents: [
          { id: 'NO.C1', fr: "Nombres décimaux jusqu'à l'ordre des millièmes" },
          { id: 'NO.C2', fr: 'Fractions : lecture, écriture - numérateur, dénominateur' },
          { id: 'NO.C3', fr: 'Fractions : pourcentage' },
          { id: 'NO.C4', fr: 'Fractions : addition, soustraction et multiplication' },
          { id: 'NO.C5', fr: 'Critères de divisibilité' },
          { id: 'NO.C6', fr: "Division euclidienne : diviser un nombre à 4 chiffres par un nombre de 2 chiffres, exprimer le reste sous la forme d'un nombre en écriture décimale sans dépasser la position des centièmes" },
          { id: 'NO.C7', fr: 'Dividende, diviseur, quotient, reste' },
          { id: 'NO.C8', fr: 'Somme, différence, produit' },
          { id: 'NO.C9', fr: 'Algorithme' },
          { id: 'NO.C10', fr: 'Commutativité, associativité, distributivité' },
          { id: 'NO.C11', fr: "Approximation du résultat d'une opération" },
          { id: 'NO.C12', fr: 'Tableaux de correspondance' },
          { id: 'NO.C13', fr: 'Graphiques' }
        ]
      },
      {
        id: 'GM', fr: 'C4 : Grandeurs et mesures', page: 'PE p. 130',
        competences: [
          { id: 'GM.1', fr: "Disposer d'une représentation mentale des grandeurs",
            nc: { 7: "L'élève effectue des conversions de grandeurs pour les unités standard connues (p. ex. m en cm, ml en l) et il compare des sommes d'argent, des longueurs, des durées et des poids.",
                  8: "L'élève associe à des objets les grandeurs et les unités qui peuvent être utilisées pour les mesurer (p. ex. superficie de la salle de classe – m2).",
                  9: "L'élève lit et interprète des grandeurs décimales et il utilise les unités de mesure m2, cm2 ainsi que m3, dm3 et cm3 en les associant à des représentations spécifiques (p. ex. 0,25 dm3 verre d'eau).",
                  10: "L'élève compare des grandeurs décimales de même nature exprimées par des unités de mesure différentes (p. ex. 8,25 dm3 et 8500 cm3)." },
            objectives: [
              { id: 'GM.1.1', fr: 'Reconnaître des grandeurs fractionnées dans des situations de la vie courante et les mettre en relation avec les unités conventionnelles' },
              { id: 'GM.1.2', fr: "Comprendre et savoir utiliser les unités conventionnelles typiques de longueurs, de montants d'argent, de temps, de capacités et de masse en relation avec des grandeurs fractionnées" }
            ] },
          { id: 'GM.2', fr: 'Utiliser des grandeurs dans des situations de la vie courante',
            nc: { 7: "L'élève classe et compare, également au quotidien, des unités de mesure moins courantes (p. ex. hm, hl, livre, quintal) au sein d'un même type de grandeur, même dans des situations plus complexes.",
                  8: "L'élève effectue toutes les opérations de calcul et de conversion courantes, y compris la conversion des mesures de superficie et de volume.",
                  9: "L'élève utilise les unités conventionnelles typiques de longueurs, de montants d'argent, de temps, de capacités et de masse en relation avec des grandeurs fractionnées.",
                  10: "L'élève établit et décrit en situation les correspondances entre grandeurs de nature différente." },
            objectives: [
              { id: 'GM.2.1', fr: 'Estimer, mesurer, comparer et calculer en utilisant des unités conventionnelles appropriées (argent, longueurs, durées, capacités et masses)' },
              { id: 'GM.2.2', fr: "Convertir les mesures d'argent, de longueur et de temps" },
              { id: 'GM.2.3', fr: 'Choisir et utiliser les instruments de mesure appropriés' },
              { id: 'GM.2.4', fr: 'Spécifier les grandeurs fractionnées courantes' },
              { id: 'GM.2.5', fr: 'Communiquer oralement, lire et écrire des indications de grandeur' },
              { id: 'GM.2.6', fr: 'Rassembler, traiter, interpréter et représenter des données de façon appropriée' },
              { id: 'GM.2.7', fr: 'Identifier des grandeurs dans des textes, des images, des schémas, des graphiques et des tableaux' },
              { id: 'GM.2.8', fr: 'Enregistrer et décrire les correspondances entre grandeurs (corrélation, proportionnalité)' }
            ] }
        ],
        contents: [
          { id: 'GM.C1', fr: 'Estimation et mesurage : longueur (km, hm, m, dm, cm, mm)' },
          { id: 'GM.C2', fr: 'Estimation et mesurage : argent (EUR, cent)' },
          { id: 'GM.C3', fr: 'Estimation et mesurage : masse (g, kg, t)' },
          { id: 'GM.C4', fr: 'Estimation et mesurage : capacité (ml, cl, dl, hl, l)' },
          { id: 'GM.C5', fr: 'Estimation et mesurage : temps (seconde, minute, heure, jour, cycle quotidien, cycle hebdomadaire, cycle annuel)' },
          { id: 'GM.C6', fr: 'Estimation et mesurage : angles (degré)' },
          { id: 'GM.C7', fr: 'Relations entre les unités de mesure' },
          { id: 'GM.C8', fr: 'Utilisation des instruments de mesure courants' },
          { id: 'GM.C9', fr: 'Traitement de données' }
        ]
      },
      {
        id: 'RP', fr: "C4 : Résolution de problèmes d'arithmétique", page: 'PE p. 131',
        competences: [
          { id: 'RP.1', fr: "Analyser l'énoncé d'un problème mathématique et planifier une démarche de résolution",
            nc: { 7: "L'élève établit dans un plan une démarche de résolution individuelle pour des problèmes d'arithmétique plus complexes, comportant au moins 3 données numériques.",
                  8: "L'élève identifie dans l'énoncé d'un problème d'arithmétique faisant appel à des stratégies connues les informations pertinentes et les étapes à franchir et il les représente adéquatement, soit par un schéma, un tableau, une carte sémantique ou un diagramme sagittal.",
                  9: "L'élève planifie, explique et communique la démarche de résolution d'un problème d'arithmétique comportant plusieurs informations inconnues à l'aide d'une équation.",
                  10: "L'élève analyse de manière autonome des situations inconnues, il se procure les informations nécessaires à la résolution et il propose une démarche de résolution adaptée à la situation." },
            objectives: [
              { id: 'RP.1.1', fr: 'Selon le contexte, représenter et expliquer la situation-problème ou le problème mathématique par une démarche active et opératoire, par un schéma ou une carte sémantique ou oralement' },
              { id: 'RP.1.2', fr: 'Faire le tri et l’organisation des données et des nombres essentiels pour la résolution du problème' },
              { id: 'RP.1.3', fr: 'Noter le but à atteindre ou la tâche à réaliser' },
              { id: 'RP.1.4', fr: 'Définir dans un plan de travail une démarche de résolution en indiquant les différentes étapes' }
            ] },
          { id: 'RP.2', fr: "Résoudre un problème d'arithmétique",
            nc: { 7: "L'élève résout des problèmes d'arithmétique plus complexes, comportant au moins 3 données numériques et non préparés en classe, en développant et en choisissant des procédés et des stratégies individuelles.",
                  8: "L'élève résout par écrit et de façon autonome un problème faisant appel à un maximum de deux grandeurs et quatre données numériques, en utilisant des stratégies connues et préparées en classe.",
                  9: "L'élève résout par écrit un problème faisant appel à un maximum de deux grandeurs et au moins quatre données numériques, en effectuant les conversions nécessaires et en faisant appel à des stratégies individuelles ou connues.",
                  10: "L'élève propose par écrit, en les justifiant, des solutions pour des problèmes ouverts, faisant appel à une série de données, le cas échéant en établissant des liens de proportionnalité entre les données." },
            objectives: [
              { id: 'RP.2.1', fr: 'Résoudre de manière autonome et par écrit des problèmes faisant appel à au moins deux grandeurs et quatre données numériques' },
              { id: 'RP.2.2', fr: 'Proposer des solutions pour des problèmes ouverts faisant appel à une ou plusieurs séries de données' },
              { id: 'RP.2.3', fr: 'Faire appel à ses connaissances et à des stratégies connues pour la résolution du problème' },
              { id: 'RP.2.4', fr: 'Reconnaître et utiliser les relations qui existent entre les informations connues, en déduire des informations nouvelles et les transférer dans des situations comparables' },
              { id: 'RP.2.5', fr: 'Développer et choisir des stratégies individuelles de résolution' },
              { id: 'RP.2.6', fr: 'Établir des liens de proportionnalité entre les données' }
            ] },
          { id: 'RP.3', fr: 'Interpréter et évaluer les informations et les résultats',
            nc: { 7: "L'élève compare sa propre démarche aux démarches de résolution d'autres élèves et y réfléchit en commun avec eux.",
                  8: "L'élève justifie son approche et le raisonnement l'ayant mené à la solution et il confirme ou infirme les justifications des autres élèves.",
                  9: "L'élève décide de la pertinence des informations tirées d'une série de données d'une certaine ampleur ; il formule et vérifie des hypothèses en relation avec des séries de données.",
                  10: "L'élève reconnaît et explicite les relations qui existent entre les différentes démarches de résolution d'un problème, il les utilise et il les reporte sur des cas similaires." },
            objectives: [
              { id: 'RP.3.1', fr: "Explorer d'autres stratégies de résolution, les comparer avec ses propres stratégies et réfléchir ensemble afin de trouver une démarche de résolution appropriée" },
              { id: 'RP.3.2', fr: "Déduire les informations essentielles à partir de textes, de graphiques et de tableaux et en discuter avec les autres" },
              { id: 'RP.3.3', fr: 'Formuler et vérifier des hypothèses' },
              { id: 'RP.3.4', fr: "Vérifier et justifier le résultat d'un problème comportant plusieurs étapes de résolution" }
            ] }
        ],
        contents: [
          { id: 'RP.C1', fr: 'Les compétences à développer se construisent à l’aide de problèmes géométriques, numériques et de mesurage, conformément aux domaines de compétences énumérés ci-dessus pour le cycle 4.' }
        ]
      }
    ],

    /* ---------- MathemaTIC, Grades 5 & 6 (fine-grained objectives) -----
     * pe: the Plan d'études objective(s) the item falls under. Items with
     * scope:'4.2' go beyond what is reasonable for cycle 4.1 and are only
     * trained at level 4 (Challenge) or flagged in the coverage table.   */
    mathematic: [
      // Number Sense and Numeration — Quantity Relationships
      { id: 'MT.1', en: 'Understanding the parts of a fraction - numerator and denominator', pe: ['NO.1.1', 'NO.C2'] },
      { id: 'MT.2', en: 'Locating and visualizing fractions on the number line', pe: ['NO.1.6'] },
      { id: 'MT.3', en: 'Determining a fraction given its location on the number line', pe: ['NO.1.6'] },
      { id: 'MT.4', en: 'Creating a visual representation of a fraction by colouring elements of a set', pe: ['NO.1.1'] },
      { id: 'MT.5', en: "Representing and interpreting a fraction as a part of figure's area", pe: ['NO.1.1'] },
      { id: 'MT.6', en: 'Finding common multiples of 2 numbers', pe: ['NO.3.1'] },
      { id: 'MT.7', en: 'Determining the lowest common multiple of 2 numbers', pe: ['NO.3.1'] },
      { id: 'MT.8', en: 'Creating and identifying equivalent fractions', pe: ['NO.1.3'] },
      { id: 'MT.9', en: 'Determining missing numerator or denominator to make equivalent fractions', pe: ['NO.1.3'] },
      { id: 'MT.10', en: 'Comparing fractions by using equivalent fractions to place fractions on the number line', pe: ['NO.1.2', 'NO.1.6'] },
      { id: 'MT.11', en: 'Ordering fractions from smallest to largest and from largest to smallest', pe: ['NO.1.2'] },
      { id: 'MT.12', en: 'Identifying a fraction that lies between two fractions', pe: ['NO.1.2'] },
      { id: 'MT.13', en: 'Determining the area that represents a given percentage of a total area', pe: ['NO.C3'] },
      { id: 'MT.14', en: 'Identifying odd and even numbers', pe: ['NO.3.1'] },
      { id: 'MT.15', en: 'Rounding up to 7-digit numbers to the nearest tens, hundreds, thousands or ten thousands', pe: ['NO.2.3', 'NO.C11'] },
      { id: 'MT.16', en: 'Applying place value to solve numerical puzzles', pe: ['NO.4.1'] },
      // Operational Sense
      { id: 'MT.17', en: 'Using a variety of strategies (such as decomposing numbers, applying commutativity or associativity) to complete addition and subtraction exercises up to 3 digits', pe: ['NO.3.3'] },
      { id: 'MT.18', en: 'Estimating results of addition/subtraction expressions with up to 4 digit numbers', pe: ['NO.2.3'] },
      { id: 'MT.19', en: 'Using multiplication to count objects arranged into an array of arrays', pe: ['NO.3.3'] },
      { id: 'MT.20', en: 'Decomposing a number into two factors in different ways', pe: ['NO.3.1'] },
      { id: 'MT.21', en: 'Applying divisibility criteria for 2, 5, 10, 4, and 3 to determine if numbers up to 6 digits are divisible by given numbers', pe: ['NO.3.1', 'NO.C5'] },
      { id: 'MT.22', en: 'Using a variety of strategies (such as decomposing numbers, applying commutativity, associativity, or distributivity) to complete multiplication exercises', pe: ['NO.3.3'] },
      { id: 'MT.23', en: 'Identifying the relationship between similar products and quotients, and using this to facilitate computation', pe: ['NO.3.2', 'NO.3.3'] },
      { id: 'MT.24', en: 'Adding and subtracting fractions with like and unlike denominators', pe: ['NO.2.2', 'NO.C4'] },
      { id: 'MT.25', en: 'Multiplying fractions', pe: ['NO.2.2', 'NO.C4'] },
      { id: 'MT.26', en: 'Applying multiplication of fractions to solve numerical puzzles', pe: ['NO.2.2'] },
      { id: 'MT.27', en: 'Solving problems involving division with remainder', pe: ['NO.C6', 'NO.C7'] },
      // Proportional Relationships
      { id: 'MT.28', en: 'Using fractions to describe a proportional relationship involving manipulatives (gears)', pe: ['NO.4.2'] },
      { id: 'MT.29', en: 'Recreating a geometric puzzle by proportionally increasing or decreasing the size of each shape', pe: ['EF.4.1', 'NO.4.2'] },
      { id: 'MT.30', en: 'Dividing an area into 100 equal squares to represent percentages', pe: ['NO.C3'] },
      { id: 'MT.31', en: 'Writing a fraction with denominator of 100 or a multiple of 100 as a percentage', pe: ['NO.C3', 'NO.1.8'] },
      { id: 'MT.32', en: 'Determining the area that is represented by a percentage of the total area', pe: ['NO.C3'] },
      // Measurement
      { id: 'MT.33', en: 'Understanding perimeter as the total distance around a figure, and not including any distances in the interior of a figure', pe: ['EF.C10'] },
      { id: 'MT.34', en: 'Calculating the perimeter of rectangles, parallelograms, triangles, right-angled polygons, and irregular polygons using rulers or grid squares', pe: ['EF.4.2', 'EF.C10'] },
      { id: 'MT.35', en: 'Understanding area as the total surface occupied by a figure', pe: ['EF.4.2'] },
      { id: 'MT.36', en: 'Discovering the formula for the area of a rectangle by filling the shape with grid squares, and linking this with multiplication and the measurements of length and width', pe: ['EF.4.5'] },
      { id: 'MT.37', en: 'Calculating the area of rectangles, squares, parallelograms, triangles, and right-angled polygons using formulas and rulers, or counting grid squares', pe: ['EF.4.2', 'EF.4.3'] },
      { id: 'MT.38', en: 'Estimating the area and perimeter of an irregular figure', pe: ['EF.4.2', 'GM.2.1'] },
      { id: 'MT.39', en: 'Constructing rectangles with a given perimeter or area', pe: ['EF.4.2', 'EF.2.12'] },
      { id: 'MT.40', en: 'Investigating how different formulas for the perimeter of rectangles and squares are equivalent', pe: ['EF.4.5'] },
      { id: 'MT.41', en: 'Discovering the formula for the area of a parallelogram by cutting different examples into pieces and rearranging them to form a rectangle', pe: ['EF.4.5', 'EF.4.3'] },
      { id: 'MT.42', en: 'Discovering the formula for the area of a triangle by duplicating and rotating the shape to form a parallelogram', pe: ['EF.4.5', 'EF.4.3'] },
      { id: 'MT.43', en: 'Comparing the areas of rectangles, triangles, and parallelograms', pe: ['EF.4.1'] },
      { id: 'MT.44', en: 'Comparing the areas of figures constructed from tangram pieces', pe: ['EF.4.1'] },
      { id: 'MT.45', en: 'Creating shapes of equal area on a grid', pe: ['EF.4.1'] },
      { id: 'MT.46', en: 'Converting metric units of length, area, and volume', pe: ['EF.C13', 'EF.C14', 'EF.C15'] },
      { id: 'MT.47', en: 'Ordering measurements of length, area, and volume', pe: ['GM.2.1'] },
      { id: 'MT.48', en: 'Using knowledge of perimeter to solve problems involving the shortest distance between 2 points on a figure along its perimeter', pe: ['EF.C9', 'EF.C10'] },
      // Geometry and Spatial Sense
      { id: 'MT.49', en: 'Sorting 3D solids into curved surfaces, pyramids, prisms, and others', pe: ['EF.2.3'] },
      { id: 'MT.50', en: 'Counting the faces, edges, and vertices on 3D solids', pe: ['EF.2.7', 'EF.C2'] },
      { id: 'MT.51', en: 'Identifying different types of angles (acute, obtuse, right, and straight)', pe: ['EF.C6'] },
      { id: 'MT.52', en: 'Using protractors to measure angles', pe: ['EF.2.9', 'GM.C6'] },
      { id: 'MT.53', en: 'Calculating the volume of a 3D solid constructed out of cube blocks by counting blocks', pe: ['EF.4.4'] },
      { id: 'MT.54', en: 'Calculating the surface area of a 3D solid constructed out of cube blocks by counting the visible block faces', pe: ['EF.4.4'] },
      { id: 'MT.55', en: 'Creating 2D nets for 3D solids', pe: ['EF.2.1'] },
      { id: 'MT.56', en: 'Matching 2D nets to 3D solids', pe: ['EF.2.2'] },
      { id: 'MT.57', en: "Exploring Euler's characteristic (F+V−E=2) with a variety of solids", pe: ['EF.2.3'] },
      { id: 'MT.58', en: 'Adding cube blocks to 3D solids constructed out of cube blocks to form cubes or rectangular prisms', pe: ['EF.2.8'] },
      { id: 'MT.59', en: 'Creating angles by adding and subtracting other angles', pe: ['EF.2.9'] },
      { id: 'MT.60', en: 'Visualizing different 2D views of 3D solids', pe: ['EF.1.3', 'EF.2.6'] },
      { id: 'MT.61', en: 'Identifying x- and y-coordinates of an ordered pair, and linking them to locations on the Cartesian plane', pe: ['EF.1.1'] },
      { id: 'MT.62', en: 'Plotting points on the Cartesian plane given coordinates', pe: ['EF.1.1'] },
      { id: 'MT.63', en: 'Creating familiar geometric shapes by plotting points on a Cartesian plane', pe: ['EF.1.1', 'EF.2.4'] },
      { id: 'MT.64', en: 'Translating 2D shapes, with and without a grid', pe: ['EF.C8'] },
      { id: 'MT.65', en: 'Performing axial reflections, with and without a grid', pe: ['EF.C8'] },
      { id: 'MT.66', en: 'Performing radial reflections, with and without a grid', pe: ['EF.C8'] },
      { id: 'MT.67', en: 'Performing rotations without a grid', pe: ['EF.3.2'], scope: '4.2' },
      { id: 'MT.68', en: 'Choosing or placing the point that is symmetric to a given point across a vertical, horizontal, or diagonal axis', pe: ['EF.C8'] },
      { id: 'MT.69', en: 'Identifying and applying rotations and reflections needed to continue a pattern made from tiles', pe: ['EF.3.2', 'EF.3.3'] },
      { id: 'MT.70', en: 'Applying knowledge of parallel and perpendicular lines to identify locations on a map', pe: ['EF.C5', 'EF.1.2'] },
      // Patterning and Algebra
      { id: 'MT.71', en: 'Understanding a numerical expression as a sequence of operations', pe: ['NO.2.6'] },
      { id: 'MT.72', en: 'Simplifying a sequence of operations to an equivalent sequence', pe: ['NO.2.6', 'NO.3.3'] },
      { id: 'MT.73', en: 'Reversing a sequence of operations to find the initial number, given a result', pe: ['NO.2.5'] },
      { id: 'MT.74', en: 'Finding the missing operation in a sequence of operations to reach the desired result, given an initial number', pe: ['NO.2.6'] },
      { id: 'MT.75', en: 'Following a computation program involving addition, multiplication, and division', pe: ['NO.2.6'] },
      { id: 'MT.76', en: 'Understanding a geometric linear growing pattern and determining characteristics of different stages of the pattern by building the shape and extrapolating the pattern', pe: ['EF.3.1', 'NO.4.2'] },
      { id: 'MT.77', en: 'Generating a strategy for finding higher terms in a geometric linear growing pattern', pe: ['EF.3.2'] },
      { id: 'MT.78', en: 'Identifying the next term in a numerical sequence (using one of the 4 operations)', pe: ['NO.3.3'] },
      { id: 'MT.79', en: 'Exploring and using the commutative property of addition and multiplication to facilitate computations', pe: ['NO.3.3', 'NO.C10'] },
      { id: 'MT.80', en: 'Exploring and using the associative property of addition and multiplication to facilitate computations', pe: ['NO.3.3', 'NO.C10'] },
      { id: 'MT.81', en: 'Exploring and using the distributive property of multiplication over addition and subtraction to facilitate computations', pe: ['NO.3.3', 'NO.C10'] },
      { id: 'MT.82', en: 'Finding the value of a complex algebraic expression given values for all variables, and determining the value for one variable needed to obtain a desired result', pe: ['NO.2.5', 'NO.2.6'] },
      { id: 'MT.83', en: 'Follow a schematic to identify key parts in a sequence of numbers and interpret the results', pe: ['NO.3.3'] },
      { id: 'MT.84', en: 'Solving algebraic equations with 1 or 2 variables through trial-and-error', pe: ['NO.2.5'] },
      // Data Management and Probability
      { id: 'MT.85', en: 'Creating a bar graph, line graph, or pie chart to represent data', pe: ['GM.2.6', 'NO.C13'] },
      { id: 'MT.86', en: 'Generating data and creating a line graph to display the data', pe: ['GM.2.6'] },
      { id: 'MT.87', en: 'Visualizing proportions in a pie chart, adjusting the number of quantities to create certain proportions', pe: ['NO.4.3'] },
      { id: 'MT.88', en: 'Identifying key information from text', pe: ['RP.1.2'] },
      { id: 'MT.89', en: 'Inputting data correctly into tables with given row and column labels', pe: ['NO.4.4'] },
      { id: 'MT.90', en: 'Generating points on a scatterplot graph to find where two linear equations intersect', pe: ['NO.4.3'], scope: '4.2' },
      { id: 'MT.91', en: 'Interpreting data from a bar graph, line graph, or pie chart', pe: ['NO.4.3'] },
      { id: 'MT.92', en: 'Generating data and entering it into a table to draw conclusions on the data', pe: ['GM.2.6', 'NO.4.4'] }
    ]
  };

  /* Helpers ------------------------------------------------------------ */
  function allObjectives() {
    const out = [];
    CURRICULUM.general.forEach(g => out.push({ id: g.id, fr: g.fr, domain: 'GC', kind: 'general' }));
    CURRICULUM.domains.forEach(d => {
      d.competences.forEach(c => c.objectives.forEach(o =>
        out.push({ id: o.id, fr: o.fr, domain: d.id, competence: c.id, kind: 'objective' })));
      d.contents.forEach(o => out.push({ id: o.id, fr: o.fr, domain: d.id, kind: 'content' }));
    });
    return out;
  }
  function byId(id) { return allObjectives().find(o => o.id === id); }

  CURRICULUM.allObjectives = allObjectives;
  CURRICULUM.byId = byId;
  root.CURRICULUM = CURRICULUM; (root.MQ = root.MQ || {}).CURRICULUM = CURRICULUM;
  if (typeof module !== 'undefined') module.exports = CURRICULUM;
})(typeof window !== 'undefined' ? window : globalThis);
