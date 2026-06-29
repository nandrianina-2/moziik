const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType, LevelFormat
} = require('docx');
const fs = require('fs');

const brd = { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" };
const bords = { top: brd, bottom: brd, left: brd, right: brd };
const hBrd = { style: BorderStyle.SINGLE, size: 1, color: "1A5276" };
const hBords = { top: hBrd, bottom: hBrd, left: hBrd, right: hBrd };

const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 }, children: [new TextRun({ text: t, bold: true, size: 34, font: "Arial", color: "1A5276" })] });
const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 140 }, children: [new TextRun({ text: t, bold: true, size: 28, font: "Arial", color: "2471A3" })] });
const h3 = (t) => new Paragraph({ spacing: { before: 200, after: 100 }, children: [new TextRun({ text: t, bold: true, underline: {}, size: 24, font: "Arial", color: "1F618D" })] });
const p = (t) => new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 60, after: 80 }, children: [new TextRun({ text: t, size: 22, font: "Arial" })] });
const sp = () => new Paragraph({ children: [new TextRun("")], spacing: { before: 60, after: 60 } });
const bul = (t) => new Paragraph({ numbering: { reference: "bul", level: 0 }, spacing: { before: 50, after: 50 }, children: [new TextRun({ text: t, size: 22, font: "Arial" })] });
const num = (t) => new Paragraph({ numbering: { reference: "num", level: 0 }, spacing: { before: 70, after: 70 }, children: [new TextRun({ text: t, size: 22, font: "Arial" })] });

function tableRow(cols, widths, isHeader) {
  return new TableRow({
    children: cols.map((txt, i) => new TableCell({
      borders: isHeader ? hBords : bords,
      width: { size: widths[i], type: WidthType.DXA },
      shading: isHeader ? { fill: "1A5276", type: ShadingType.CLEAR } : { fill: i % 2 === 0 ? "EBF5FB" : "FFFFFF", type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: txt, size: 20, font: "Arial", bold: isHeader, color: isHeader ? "FFFFFF" : "000000" })] })]
    }))
  });
}

const doc = new Document({
  numbering: {
    config: [
      { reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "num", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 34, bold: true, font: "Arial" }, paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 28, bold: true, font: "Arial" }, paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1300, bottom: 1440, left: 1300 }
      }
    },
    children: [

      // PAGE DE TITRE
      sp(), sp(),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 100 }, children: [new TextRun({ text: "PROJET AGRONOME", size: 24, font: "Arial", color: "7F8C8D", bold: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 200 }, children: [new TextRun({ text: "FABRICATION DU LAIT CONCENTRÉ SUCRÉ", size: 44, font: "Arial", bold: true, color: "1A5276" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 100 }, children: [new TextRun({ text: "Guide Pratique Complet \u2014 De la Collecte à la Mise en Conserve", size: 24, font: "Arial", color: "2471A3", italics: true })] }),
      sp(), sp(),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "____________________________________________", color: "1A5276", size: 24 })] }),
      sp(),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 60 }, children: [new TextRun({ text: "Rédigé par : [Votre Nom]", size: 22, font: "Arial", color: "555555" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 }, children: [new TextRun({ text: "Institution : [Nom de l\u2019établissement]", size: 22, font: "Arial", color: "555555" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 }, children: [new TextRun({ text: "Date : Mai 2026", size: 22, font: "Arial", color: "555555" })] }),
      sp(), sp(),

      new Paragraph({ children: [new TextRun({ break: 1 })] }),

      // INTRODUCTION
      h1("I. INTRODUCTION"),
      p("Le lait concentré sucré (LCS) est un produit laitier obtenu par évaporation partielle de l\u2019eau du lait entier ou écrémé, suivie de l\u2019addition de sucre (saccharose). Ce procédé permet une conservation longue durée sans réfrigération, grâce à la forte pression osmotique créée par le sucre."),
      p("Ce guide pratique s\u2019adresse aux agronomes, techniciens et entrepreneurs du secteur agroalimentaire souhaitant produire du lait concentré sucré à l\u2019échelle semi-industrielle ou artisanale de façon rigoureuse et hygiénique."),
      sp(),
      h3("Objectifs du produit fini :"),
      bul("Extrait sec total : 70 à 74 %"),
      bul("Teneur en saccharose : 42 à 45 %"),
      bul("Teneur en matières grasses : minimum 8 %"),
      bul("Durée de conservation : 12 à 24 mois (boîte fermée, température ambiante)"),
      sp(),

      // MATIÈRES PREMIÈRES
      h1("II. MATIÈRES PREMIÈRES ET PRODUITS NÉCESSAIRES"),
      sp(),
      h2("2.1. Matière première principale \u2014 Le lait"),
      p("Utiliser exclusivement du lait frais entier de vache, de bonne qualité microbiologique. Le lait cru doit être collecté dans des conditions hygiéniques strictes et traité dans les 2 heures après la traite."),
      sp(),
      h3("Critères de qualité du lait entrant :"),

      new Table({
        width: { size: 9306, type: WidthType.DXA },
        columnWidths: [3102, 3102, 3102],
        rows: [
          tableRow(["Paramètre", "Valeur acceptable", "Valeur idéale"], [3102, 3102, 3102], true),
          tableRow(["Densité (à 20°C)", "1,028 \u2013 1,034", "1,030 \u2013 1,032"], [3102, 3102, 3102], false),
          tableRow(["Acidité (°Dornic)", "14 \u2013 18 °D", "15 \u2013 16 °D"], [3102, 3102, 3102], false),
          tableRow(["Matières grasses", ">= 3,5 %", "3,6 \u2013 4,0 %"], [3102, 3102, 3102], false),
          tableRow(["Protéines", ">= 3,2 %", "3,3 \u2013 3,5 %"], [3102, 3102, 3102], false),
          tableRow(["Charge microbienne", "< 200 000 UFC/mL", "< 100 000 UFC/mL"], [3102, 3102, 3102], false),
          tableRow(["Test alcool (68°)", "Négatif", "Négatif"], [3102, 3102, 3102], false),
        ]
      }),
      sp(),

      h2("2.2. Sucre"),
      p("Utiliser du saccharose pur (sucre blanc cristallisé), de qualité alimentaire, exempt d\u2019impuretés. Le sucre doit être sec, sans grumeaux et stocké à l\u2019abri de l\u2019humidité."),
      bul("Quantité indicative : 150 à 160 kg de saccharose pour 100 L de lait entier"),
      bul("Qualité exigée : saccharose >= 99,7 % de pureté (norme alimentaire)"),
      sp(),

      h2("2.3. Autres intrants optionnels"),
      bul("Bicarbonate de sodium (NaHCO\u2083) : pour neutraliser l\u2019acidité du lait si nécessaire (max. 0,2 g/L)"),
      bul("Carraghénane ou amidon : stabilisant optionnel pour éviter la cristallisation du lactose"),
      bul("Eau distillée ou eau potable : pour nettoyage et rinçage des équipements"),
      sp(),

      // MATÉRIELS
      h1("III. MATÉRIELS ET ÉQUIPEMENTS NÉCESSAIRES"),
      sp(),
      h2("3.1. Équipements de production"),

      new Table({
        width: { size: 9306, type: WidthType.DXA },
        columnWidths: [3400, 2800, 3106],
        rows: [
          tableRow(["Équipement", "Capacité / Specs", "Rôle"], [3400, 2800, 3106], true),
          tableRow(["Cuve de réception du lait (inox)", "200 à 500 L", "Stockage et contrôle initial du lait"], [3400, 2800, 3106], false),
          tableRow(["Pasteurisateur (plaques ou cuve)", "100 \u2013 300 L/h", "Traitement thermique du lait"], [3400, 2800, 3106], false),
          tableRow(["Évaporateur sous vide", "100 \u2013 500 L", "Concentration du lait par évaporation"], [3400, 2800, 3106], false),
          tableRow(["Cuve de sucrage (avec agitateur)", "200 \u2013 500 L", "Dissolution et incorporation du sucre"], [3400, 2800, 3106], false),
          tableRow(["Refroidisseur / bac à eau froide", "Variable", "Refroidissement rapide après concentration"], [3400, 2800, 3106], false),
          tableRow(["Conditionneuse / soutireuse", "Semi-auto ou manuelle", "Remplissage des boîtes ou sachets"], [3400, 2800, 3106], false),
          tableRow(["Thermoscelleuse / sertisseuse", "Selon contenant", "Fermeture hermétique des emballages"], [3400, 2800, 3106], false),
        ]
      }),
      sp(),

      h2("3.2. Instruments de contrôle et de mesure"),

      new Table({
        width: { size: 9306, type: WidthType.DXA },
        columnWidths: [3600, 5706],
        rows: [
          tableRow(["Instrument", "Utilisation"], [3600, 5706], true),
          tableRow(["Lactodensimètre", "Mesure de la densité du lait"], [3600, 5706], false),
          tableRow(["Acidimètre de Dornic (burette)", "Mesure de l\u2019acidité titrable du lait"], [3600, 5706], false),
          tableRow(["Thermomètre inox (0 \u2013 150°C)", "Contrôle des températures de traitement"], [3600, 5706], false),
          tableRow(["Réfractomètre (0 \u2013 90° Brix)", "Mesure de l\u2019extrait sec du produit concentré"], [3600, 5706], false),
          tableRow(["Balance de précision (0,1 g)", "Pesée des intrants et du sucre"], [3600, 5706], false),
          tableRow(["pH-mètre ou papier pH", "Vérification du pH du lait et du produit"], [3600, 5706], false),
          tableRow(["Manomètre (pour évaporateur)", "Contrôle de la pression sous vide"], [3600, 5706], false),
          tableRow(["Viscosimètre (optionnel)", "Contrôle de la viscosité finale"], [3600, 5706], false),
        ]
      }),
      sp(),

      h2("3.3. Matériel de nettoyage et d\u2019hygiène"),
      bul("Brosses et raclettes en plastique alimentaire"),
      bul("Seaux et bassines en inox ou plastique alimentaire"),
      bul("Produits de nettoyage : soude caustique (NaOH 1-2 %), acide nitrique ou phosphorique (1 %)"),
      bul("Produit désinfectant : hypochlorite de sodium (eau de Javel alimentaire, 100 \u2013 200 ppm de chlore)"),
      bul("Tuyaux flexibles en silicone alimentaire pour les transferts"),
      bul("Blouses, tabliers, gants, charlotte, masque, bottes (EPI du personnel)"),
      sp(),

      h2("3.4. Emballages et conditionnement"),
      bul("Boîtes métalliques sertissables (type conserve, 200 g, 400 g ou 1 kg)"),
      bul("Sachets en aluminium thermoscellable (pour conditionnement souple)"),
      bul("Étiquettes conformes aux normes alimentaires (composition, DLC, lot, etc.)"),
      sp(),

      // PROCESSUS DE FABRICATION
      h1("IV. PROCESSUS COMPLET DE FABRICATION"),
      sp(),
      p("La fabrication du lait concentré sucré se déroule en 9 étapes séquentielles et rigoureusement respectées. Chaque étape conditionne la qualité du produit fini."),
      sp(),

      h2("ÉTAPE 1 \u2014 Réception et contrôle du lait cru"),
      p("À la réception du lait, effectuer systématiquement les tests suivants avant toute transformation :"),
      num("Test de densité : utiliser un lactodensimètre. Plage acceptable : 1,028 à 1,034 à 20°C."),
      num("Test d\u2019acidité Dornic : prélever 10 mL de lait + 2 gouttes de phénolphtaléine, titrer avec NaOH N/9. Résultat normal : 14 à 18 °D."),
      num("Test alcool : mélanger à parts égales lait + alcool à 68°. Absence de floculation = lait acceptable."),
      num("Observation organoleptique : couleur blanc crème, odeur neutre, aucun dépôt anormal."),
      p("Si l\u2019acidité dépasse 18 °D, neutraliser avec du bicarbonate de sodium (NaHCO\u2083) à raison de 0,1 à 0,2 g par litre de lait, puis revérifier."),
      sp(),

      h2("ÉTAPE 2 \u2014 Filtration du lait"),
      p("Filtrer le lait à travers un filtre en inox (maille 0,5 mm) ou un filtre en tissu alimentaire (coton propre stérilisé) afin d\u2019éliminer les impuretés physiques : pailles, poils, insectes, caillots."),
      p("Répéter l\u2019opération deux fois si le lait est fortement chargé. Jeter le filtre après usage ou le stériliser immédiatement."),
      sp(),

      h2("ÉTAPE 3 \u2014 Standardisation de la matière grasse (optionnel)"),
      p("Si le lait entrant présente une teneur en matière grasse supérieure à 4 %, l\u2019écrémage partiel peut être réalisé à l\u2019aide d\u2019une écrémeuse centrifuge. L\u2019objectif est d\u2019amener la teneur à 3,5 % pour uniformiser le produit fini à 8 % de MG après concentration."),
      p("Dans un contexte artisanal, cette étape peut être ignorée si le lait est homogène et sa richesse en MG connue."),
      sp(),

      h2("ÉTAPE 4 \u2014 Préchauffage et pasteurisation"),
      p("La pasteurisation détruit les germes pathogènes et désactive une partie des enzymes qui dégraderaient le produit."),
      bul("Méthode HTST (Haute Température / Courte Durée) : chauffer le lait à 85 \u2013 90°C pendant 15 à 30 secondes."),
      bul("Méthode LTLT (Basse Température / Longue Durée) : chauffer à 63 \u2013 65°C pendant 30 minutes (adapté aux petites unités)."),
      p("Surveiller en permanence avec le thermomètre. Ne pas dépasser 95°C pour éviter le brunissement (réaction de Maillard) et la coagulation des protéines."),
      sp(),

      h2("ÉTAPE 5 \u2014 Addition du sucre"),
      p("Le sucre peut être incorporé de deux façons :"),
      bul("Méthode 1 (avant concentration) : dissoudre le sucre directement dans le lait chaud (70 \u2013 75°C) sous agitation constante avant d\u2019entrer dans l\u2019évaporateur. Avantage : meilleure dissolution."),
      bul("Méthode 2 (sirop stérile) : préparer un sirop de sucre concentré (70 % Brix) avec de l\u2019eau potable, le filtrer, le pasteuriser à 105°C, puis l\u2019injecter dans le lait concentré chaud en fin de concentration. Avantage : meilleur contrôle de la concentration finale."),
      p("Dose : 150 à 160 g de saccharose pour 100 g de lait entier. La concentration en sucre dans le produit fini doit atteindre 42 à 45 % pour assurer la conservation."),
      sp(),

      h2("ÉTAPE 6 \u2014 Concentration par évaporation"),
      p("C\u2019est l\u2019étape technique centrale de la fabrication. L\u2019objectif est d\u2019éliminer environ 60 % de l\u2019eau contenue dans le lait afin d\u2019atteindre un extrait sec total de 70 à 74 %."),
      sp(),
      h3("6.1. Évaporation sous vide (méthode recommandée)"),
      p("L\u2019évaporateur sous vide permet de concentrer le lait à basse température (45 à 55°C) sous dépression (vide de 600 à 700 mmHg). Cela préserve la couleur blanche, les arômes et les vitamines thermosensibles."),
      num("Remplir l\u2019évaporateur avec le lait sucré chaud."),
      num("Créer le vide jusqu\u2019à 650 mmHg à l\u2019aide de la pompe à vide."),
      num("Maintenir la température à 50 \u2013 55°C en chauffant doucement."),
      num("Surveiller le degré Brix toutes les 20 minutes avec le réfractomètre."),
      num("Arrêter l\u2019évaporation quand le Brix atteint 70 \u2013 74°."),
      sp(),
      h3("6.2. Évaporation à feu doux (méthode artisanale)"),
      p("En l\u2019absence d\u2019évaporateur sous vide, il est possible de concentrer le lait dans une grande marmite à fond épais sur feu doux (80 \u2013 85°C), en remuant constamment pour éviter l\u2019attache et le brunissement."),
      p("Attention : cette méthode est moins précise, donne un produit légèrement caramélisé et est difficile à contrôler. Elle convient pour de petites quantités (< 20 L) et exige une surveillance permanente."),
      sp(),

      h2("ÉTAPE 7 \u2014 Refroidissement et cristallisation contrôlée"),
      p("Après concentration, refroidir le produit rapidement de 55°C à 30°C en 30 à 40 minutes, sous agitation lente et continue."),
      p("Ce refroidissement contrôlé favorise la formation de très petits cristaux de lactose (< 10 microns), invisibles et imperceptibles en bouche. Si le refroidissement est trop lent, de gros cristaux se forment et donnent une texture sableuse inacceptable."),
      bul("Agitation recommandée : 30 à 40 tours/minute"),
      bul("Température cible de fin de refroidissement : 18 à 20°C avant mise en boîte"),
      sp(),

      h2("ÉTAPE 8 \u2014 Contrôle qualité du produit fini"),
      p("Avant le conditionnement, réaliser les contrôles suivants sur le produit concentré :"),

      new Table({
        width: { size: 9306, type: WidthType.DXA },
        columnWidths: [2800, 2800, 3706],
        rows: [
          tableRow(["Paramètre", "Valeur cible", "Méthode de contrôle"], [2800, 2800, 3706], true),
          tableRow(["Extrait sec total (Brix)", "70 \u2013 74 °Brix", "Réfractomètre"], [2800, 2800, 3706], false),
          tableRow(["Teneur en saccharose", "42 \u2013 45 %", "Calcul / réfractométrie"], [2800, 2800, 3706], false),
          tableRow(["Matières grasses", ">= 8 %", "Méthode Gerber"], [2800, 2800, 3706], false),
          tableRow(["Couleur", "Blanc crème uniforme", "Visuel"], [2800, 2800, 3706], false),
          tableRow(["Odeur / goût", "Lacté, sucré, sans acidité", "Organoleptique"], [2800, 2800, 3706], false),
          tableRow(["pH", "6,3 \u2013 6,6", "pH-mètre"], [2800, 2800, 3706], false),
          tableRow(["Viscosité", "Épais, coulant lentement", "Visuel / viscosimètre"], [2800, 2800, 3706], false),
        ]
      }),
      sp(),

      h2("ÉTAPE 9 \u2014 Conditionnement et stockage"),
      p("Le conditionnement doit être réalisé rapidement après le refroidissement pour limiter les risques de contamination."),
      num("Rincer et stériliser les boîtes ou sachets avant remplissage (eau chaude à 90°C ou vapeur)."),
      num("Remplir les contenants en laissant un espace de tête de 5 à 8 mm."),
      num("Fermer hermétiquement immédiatement après remplissage (sertissage ou thermoscellage)."),
      num("Étiqueter chaque unité : nom du produit, composition, poids net, date de fabrication, DLC, numéro de lot."),
      num("Stocker dans un endroit sec, frais (< 25°C), à l\u2019abri de la lumière et de l\u2019humidité."),
      sp(),

      // HYGIÈNE
      h1("V. HYGIÈNE ET BONNES PRATIQUES DE FABRICATION (BPF)"),
      sp(),
      h2("5.1. Nettoyage et désinfection des équipements"),
      p("Respecter le protocole NED (Nettoyage \u2014 Égouttage \u2014 Désinfection) après chaque cycle de production :"),
      num("Rinçage à l\u2019eau froide pour éliminer les résidus grossiers."),
      num("Nettoyage à la soude (NaOH 1-2 %, 70°C, 20 min) pour éliminer les dépôts de matières grasses et protéiques."),
      num("Rinçage abondant à l\u2019eau propre."),
      num("Désinfection à l\u2019hypochlorite de sodium (100 \u2013 200 ppm Cl actif, 15 min de contact)."),
      num("Rinçage final à l\u2019eau potable."),
      sp(),
      h2("5.2. Hygiène du personnel"),
      bul("Se laver les mains avec du savon désinfectant avant et pendant la production."),
      bul("Porter blouse propre, charlotte, masque, gants et bottes lors de toute manipulation."),
      bul("Interdire de manger, boire, ou fumer dans la salle de production."),
      bul("Toute personne malade (infection cutanée, rhume, diarrhée) doit être écartée de la production."),
      sp(),

      // RENDEMENTS
      h1("VI. RENDEMENTS ET FORMULATION PRATIQUE"),
      sp(),
      h2("6.1. Calcul du rendement"),
      p("Pour produire 1 kg de lait concentré sucré, il faut approximativement :"),
      bul("2,5 à 3 L de lait entier frais"),
      bul("380 à 420 g de saccharose"),
      sp(),
      p("Exemple concret : Pour produire 100 kg de LCS :"),
      bul("Lait frais requis : 250 à 280 litres"),
      bul("Sucre requis : 38 à 42 kg"),
      bul("Pertes à l\u2019évaporation (eau éliminée) : environ 150 à 160 L"),
      sp(),

      h2("6.2. Tableau de formulation (base 100 L de lait)"),

      new Table({
        width: { size: 9306, type: WidthType.DXA },
        columnWidths: [3500, 2000, 2000, 1806],
        rows: [
          tableRow(["Ingrédient", "Quantité", "% dans produit fini", "Remarques"], [3500, 2000, 2000, 1806], true),
          tableRow(["Lait entier frais", "100 L (103 kg)", "\u2014", "Base de départ"], [3500, 2000, 2000, 1806], false),
          tableRow(["Saccharose", "43 \u2013 45 kg", "42 \u2013 45 %", "Sucre blanc cristallisé"], [3500, 2000, 2000, 1806], false),
          tableRow(["Eau éliminée (évaporation)", "~62 L", "\u2014", "Vapeur évacuée"], [3500, 2000, 2000, 1806], false),
          tableRow(["Produit fini obtenu", "~41 \u2013 43 kg", "100 %", "LCS conditionné"], [3500, 2000, 2000, 1806], false),
        ]
      }),
      sp(),

      // PROBLÈMES COURANTS
      h1("VII. PROBLÈMES COURANTS ET SOLUTIONS"),
      sp(),

      new Table({
        width: { size: 9306, type: WidthType.DXA },
        columnWidths: [2800, 3200, 3306],
        rows: [
          tableRow(["Problème observé", "Cause probable", "Solution corrective"], [2800, 3200, 3306], true),
          tableRow(["Couleur brunâtre", "Surchauffe / réaction de Maillard", "Réduire la température, ne pas dépasser 90°C"], [2800, 3200, 3306], false),
          tableRow(["Texture sableuse", "Gros cristaux de lactose", "Accélérer le refroidissement et augmenter l\u2019agitation"], [2800, 3200, 3306], false),
          tableRow(["Produit trop liquide", "Concentration insuffisante", "Prolonger l\u2019évaporation jusqu\u2019à 70+ Brix"], [2800, 3200, 3306], false),
          tableRow(["Goût aigre / acidité", "Acidité initiale du lait trop élevée", "Neutraliser avec NaHCO\u2083 avant traitement"], [2800, 3200, 3306], false),
          tableRow(["Floculation / caillage", "Lait de mauvaise qualité ou surchauffe", "Rejeter le lait, respecter T° de pasteurisation"], [2800, 3200, 3306], false),
          tableRow(["Moisissures en surface", "Fermeture non hermétique ou contamination", "Vérifier le sertissage, renforcer la désinfection"], [2800, 3200, 3306], false),
          tableRow(["Séparation (huile/eau)", "Lait non homogénéisé ou agitation insuffisante", "Homogénéiser le lait, maintenir agitation au refroidissement"], [2800, 3200, 3306], false),
        ]
      }),
      sp(),

      // COÛTS ET RENTABILITÉ
      h1("VIII. ESTIMATION DES COÛTS DE PRODUCTION"),
      sp(),
      p("Estimation indicative pour une production de 100 kg de lait concentré sucré (adaptez aux prix locaux) :"),

      new Table({
        width: { size: 9306, type: WidthType.DXA },
        columnWidths: [3700, 1800, 1800, 2006],
        rows: [
          tableRow(["Poste de coût", "Quantité", "Prix unitaire (Ar)", "Total estimatif (Ar)"], [3700, 1800, 1800, 2006], true),
          tableRow(["Lait frais (L)", "260 L", "À définir", "\u2014"], [3700, 1800, 1800, 2006], false),
          tableRow(["Saccharose (kg)", "42 kg", "À définir", "\u2014"], [3700, 1800, 1800, 2006], false),
          tableRow(["Énergie (gaz / électricité)", "Forfait", "À définir", "\u2014"], [3700, 1800, 1800, 2006], false),
          tableRow(["Emballages (boîtes + étiquettes)", "100 unités", "À définir", "\u2014"], [3700, 1800, 1800, 2006], false),
          tableRow(["Main-d\u2019œuvre", "Forfait / journée", "À définir", "\u2014"], [3700, 1800, 1800, 2006], false),
          tableRow(["TOTAL COÛTS VARIABLES", "\u2014", "\u2014", "À calculer"], [3700, 1800, 1800, 2006], true),
        ]
      }),
      sp(),
      p("Note : compléter ce tableau avec les prix réels du marché local (Madagascar / zone de production). Le coût de revient permet de fixer un prix de vente rentable."),
      sp(),

      // CONCLUSION
      h1("IX. CONCLUSION"),
      p("La fabrication du lait concentré sucré est un procédé techniquement accessible mais qui demande rigueur et précision à chaque étape : qualité du lait de départ, contrôle des températures, gestion de la concentration, refroidissement rapide et conditionnement hermétique."),
      p("En appliquant scrupuleusement ce protocole, il est possible de produire un lait concentré sucré de qualité marchande, compétitif, avec une durée de conservation de 12 à 24 mois, adapté aux marchés locaux et à l\u2019export régional."),
      p("Ce procédé constitue une opportunité de valorisation du lait local et de création de valeur ajoutée dans la filière laitière, avec un potentiel économique significatif pour les zones de production laitière."),
      sp(), sp(),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u2014 Fin du document \u2014", size: 22, font: "Arial", color: "999999", italics: true })] }),
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/mnt/user-data/outputs/Fabrication_Lait_Concentre_Sucre.docx", buf);
  console.log("OK");
});