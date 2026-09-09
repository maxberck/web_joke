import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const dataDir = resolve(root, "src/data");
const groups = ["careers", "classes", "powers", "weaknesses", "abilities", "workStyles", "animals"];
const locales = ["en", "fr", "es"];
const read = async (name) => JSON.parse(await readFile(resolve(dataDir, `${name}.json`), "utf8"));
const write = (name, value) => writeFile(resolve(dataDir, `${name}.json`), `${JSON.stringify(value, null, 2)}\n`, "utf8");
const L = (en, fr, es) => ({ en, fr, es });

const traitLabels = {
  intelligence: L("sharp pattern recognition", "une lecture rapide des problèmes", "una lectura rápida de los problemas"),
  creativity: L("creative problem solving", "une vraie créativité pratique", "una creatividad práctica"),
  emotionalControl: L("calm under pressure", "du calme sous pression", "calma bajo presión"),
  empathy: L("a strong read on people", "une bonne lecture des autres", "una buena lectura de los demás"),
  social: L("social instinct", "un bon instinct social", "buen instinto social"),
  communication: L("clear communication", "une communication claire", "comunicación clara"),
  ambition: L("forward momentum", "une forte envie d'avancer", "muchas ganas de avanzar"),
  discipline: L("consistent follow-through", "une vraie constance", "una constancia real"),
  professionalism: L("reliable execution", "une exécution fiable", "una ejecución fiable"),
  financialSense: L("practical judgment with resources", "un bon sens des ressources", "buen criterio con los recursos"),
  risk: L("comfort with calculated risk", "une certaine aisance avec le risque", "comodidad con el riesgo calculado"),
  luck: L("timing that somehow works", "un timing qui tombe souvent juste", "un timing que suele salir bien"),
  energy: L("sustained energy", "une énergie qui tient dans la durée", "energía que aguanta"),
  humor: L("humor at exactly the right moment", "de l'humour au bon moment", "humor en el momento justo"),
  chaos: L("an ability to function inside chaos", "une capacité à fonctionner dans le chaos", "capacidad para funcionar dentro del caos"),
};

const domains = {
  data: ["Data", "des données", "los datos", { intelligence: 86, discipline: 72, communication: 64 }],
  security: ["Security", "de la sécurité", "la seguridad", { intelligence: 82, discipline: 78, risk: 70, emotionalControl: 72 }],
  automation: ["Automation", "de l'automatisation", "la automatización", { intelligence: 82, creativity: 76, discipline: 68 }],
  research: ["Research", "de la recherche", "la investigación", { intelligence: 88, discipline: 72, creativity: 64 }],
  operations: ["Operations", "des opérations", "las operaciones", { discipline: 80, professionalism: 78, communication: 68 }],
  product: ["Product", "du produit", "producto", { creativity: 72, communication: 76, ambition: 70, empathy: 62 }],
  community: ["Community", "de la communauté", "comunidad", { social: 82, empathy: 80, communication: 78 }],
  experience: ["Experience", "de l'expérience utilisateur", "experiencia", { empathy: 74, creativity: 76, communication: 72 }],
  systems: ["Systems", "des systèmes", "sistemas", { intelligence: 86, discipline: 76, professionalism: 72 }],
  content: ["Content", "du contenu", "contenido", { creativity: 84, communication: 80, humor: 64 }],
  logistics: ["Logistics", "de la logistique", "logística", { discipline: 84, professionalism: 76, emotionalControl: 68 }],
  sustainability: ["Sustainability", "de la durabilité", "sostenibilidad", { empathy: 70, intelligence: 74, professionalism: 72 }],
  quality: ["Quality", "de la qualité", "calidad", { discipline: 86, professionalism: 84, intelligence: 72 }],
  finance: ["Finance", "de la finance", "finanzas", { financialSense: 90, intelligence: 78, discipline: 76 }],
  education: ["Education", "de l'éducation", "educación", { empathy: 82, communication: 84, intelligence: 72 }],
  health: ["Health", "de la santé", "salud", { empathy: 84, professionalism: 86, emotionalControl: 74 }],
  media: ["Media", "des médias", "medios", { creativity: 80, communication: 82, social: 68 }],
  events: ["Events", "de l'événementiel", "eventos", { energy: 82, communication: 80, emotionalControl: 72 }],
  accessibility: ["Accessibility", "de l'accessibilité", "accesibilidad", { empathy: 88, communication: 78, professionalism: 76 }],
  innovation: ["Innovation", "de l'innovation", "innovación", { creativity: 90, intelligence: 80, risk: 66 }],
};
const roles = {
  analyst: ["Analyst", "Analyste", "Analista", { intelligence: 84, discipline: 72, communication: 66 }],
  coordinator: ["Coordinator", "Coordinateur", "Coordinador", { communication: 82, discipline: 76, social: 68 }],
  specialist: ["Specialist", "Spécialiste", "Especialista", { intelligence: 80, professionalism: 82, discipline: 70 }],
  consultant: ["Consultant", "Consultant", "Consultor", { communication: 84, intelligence: 76, social: 70 }],
  designer: ["Designer", "Concepteur", "Diseñador", { creativity: 88, empathy: 68, communication: 66 }],
  manager: ["Manager", "Responsable", "Gerente", { ambition: 78, communication: 80, professionalism: 76 }],
  researcher: ["Researcher", "Chercheur", "Investigador", { intelligence: 90, discipline: 74, creativity: 72 }],
  strategist: ["Strategist", "Stratège", "Estratega", { intelligence: 84, ambition: 78, risk: 62 }],
  technician: ["Technician", "Technicien", "Técnico", { discipline: 82, intelligence: 74, professionalism: 78 }],
  advisor: ["Advisor", "Conseiller", "Asesor", { empathy: 76, communication: 84, intelligence: 72 }],
  producer: ["Producer", "Producteur", "Productor", { energy: 78, discipline: 74, communication: 72 }],
  facilitator: ["Facilitator", "Facilitateur", "Facilitador", { empathy: 82, social: 80, communication: 86 }],
};

const traits = {
  chaotic: ["Chaotic", "chaotique", "caótico", { chaos: 88, creativity: 74, risk: 68, discipline: 30 }],
  methodical: ["Methodical", "méthodique", "metódico", { discipline: 90, professionalism: 80, chaos: 22, emotionalControl: 72 }],
  relentless: ["Relentless", "tenace", "implacable", { ambition: 88, energy: 82, discipline: 78 }],
  diplomatic: ["Diplomatic", "diplomate", "diplomático", { communication: 88, empathy: 82, emotionalControl: 78 }],
  curious: ["Curious", "curieux", "curioso", { intelligence: 78, creativity: 84, risk: 62 }],
  stoic: ["Stoic", "stoïque", "estoico", { emotionalControl: 92, discipline: 72, social: 38 }],
  social: ["Social", "sociable", "social", { social: 90, communication: 84, empathy: 74 }],
  improvised: ["Improvised", "improvisé", "improvisado", { creativity: 88, chaos: 76, risk: 72, discipline: 34 }],
  strategic: ["Strategic", "stratégique", "estratégico", { intelligence: 86, ambition: 76, discipline: 74 }],
  patient: ["Patient", "patient", "paciente", { emotionalControl: 86, discipline: 76, empathy: 68 }],
  restless: ["Restless", "agité", "inquieto", { energy: 90, chaos: 70, discipline: 38 }],
  precise: ["Precise", "précis", "preciso", { discipline: 88, intelligence: 78, professionalism: 82 }],
  bold: ["Bold", "audacieux", "audaz", { risk: 88, ambition: 82, emotionalControl: 68 }],
  quiet: ["Quiet", "discret", "silencioso", { emotionalControl: 82, social: 34, intelligence: 72 }],
  adaptive: ["Adaptive", "adaptatif", "adaptable", { creativity: 78, emotionalControl: 76, intelligence: 74 }],
  skeptical: ["Skeptical", "sceptique", "escéptico", { intelligence: 82, risk: 38, emotionalControl: 72 }],
  optimistic: ["Optimistic", "optimiste", "optimista", { energy: 82, social: 72, luck: 70 }],
  pragmatic: ["Pragmatic", "pragmatique", "pragmático", { intelligence: 76, discipline: 78, emotionalControl: 74 }],
};
const classRoles = {
  tactician: ["Tactician", "Tacticien", "Táctico", { intelligence: 84, discipline: 78, risk: 62 }],
  explorer: ["Explorer", "Explorateur", "Explorador", { creativity: 82, risk: 78, energy: 72 }],
  fixer: ["Fixer", "Dépanneur", "Solucionador", { intelligence: 80, creativity: 76, emotionalControl: 70 }],
  analyst: ["Analyst", "Analyste", "Analista", { intelligence: 88, discipline: 76, communication: 62 }],
  catalyst: ["Catalyst", "Catalyseur", "Catalizador", { energy: 84, social: 76, ambition: 78 }],
  guardian: ["Guardian", "Gardien", "Guardián", { empathy: 82, emotionalControl: 80, discipline: 72 }],
  broker: ["Broker", "Intermédiaire", "Mediador", { communication: 86, social: 82, financialSense: 68 }],
  builder: ["Builder", "Bâtisseur", "Constructor", { discipline: 84, creativity: 74, professionalism: 76 }],
  scout: ["Scout", "Éclaireur", "Explorador de terrain", { risk: 74, intelligence: 72, energy: 78 }],
  operator: ["Operator", "Opérateur", "Operador", { professionalism: 82, emotionalControl: 76, discipline: 74 }],
};
const mechanics = {
  burst: ["Burst", "Rafale", "Ráfaga", { energy: 86, creativity: 72, risk: 66 }],
  shield: ["Shield", "Bouclier", "Escudo", { emotionalControl: 88, empathy: 72, discipline: 68 }],
  radar: ["Radar", "Radar", "Radar", { intelligence: 82, empathy: 76, communication: 66 }],
  override: ["Override", "Mode Forçage", "Anulación", { risk: 82, ambition: 78, emotionalControl: 64 }],
  echo: ["Echo", "Écho", "Eco", { communication: 84, social: 72, empathy: 68 }],
  pulse: ["Pulse", "Impulsion", "Pulso", { energy: 82, social: 70, creativity: 68 }],
  anchor: ["Anchor", "Ancre", "Ancla", { emotionalControl: 90, discipline: 76, empathy: 70 }],
  lens: ["Lens", "Lentille", "Lente", { intelligence: 86, creativity: 76, discipline: 68 }],
  boost: ["Boost", "Accélérateur", "Impulso", { energy: 90, ambition: 78, luck: 66 }],
  field: ["Field", "Champ", "Campo", { social: 76, empathy: 72, emotionalControl: 70 }],
};

const triggers = {
  notification: ["notifications", "les notifications", "las notificaciones", { emotionalControl: 28, discipline: 34, energy: 38 }],
  deadline: ["deadlines", "les deadlines", "los plazos", { emotionalControl: 30, discipline: 42, energy: 40 }],
  ambiguity: ["ambiguity", "l'ambiguïté", "la ambigüedad", { intelligence: 42, emotionalControl: 34, communication: 38 }],
  silence: ["awkward silence", "les silences gênants", "los silencios incómodos", { social: 32, emotionalControl: 36, communication: 38 }],
  comparison: ["comparison", "la comparaison", "la comparación", { emotionalControl: 30, ambition: 38, empathy: 40 }],
  queue: ["waiting in line", "les files d'attente", "las colas", { emotionalControl: 26, energy: 34, discipline: 38 }],
  choice: ["too many choices", "trop de choix", "demasiadas opciones", { discipline: 30, intelligence: 40, emotionalControl: 34 }],
  interruption: ["interruptions", "les interruptions", "las interrupciones", { discipline: 28, emotionalControl: 34, professionalism: 42 }],
  fatigue: ["fatigue", "la fatigue", "la fatiga", { energy: 22, discipline: 34, emotionalControl: 38 }],
  conflict: ["conflict", "les conflits", "los conflictos", { empathy: 34, communication: 36, emotionalControl: 30 }],
  waiting: ["waiting", "l'attente", "la espera", { emotionalControl: 26, energy: 36, discipline: 40 }],
  uncertainty: ["uncertainty", "l'incertitude", "la incertidumbre", { emotionalControl: 28, risk: 32, intelligence: 42 }],
  noise: ["noise", "le bruit", "el ruido", { emotionalControl: 32, energy: 36, social: 40 }],
  mess: ["mess", "le désordre", "el desorden", { discipline: 28, emotionalControl: 36, professionalism: 40 }],
  pressure: ["pressure", "la pression", "la presión", { emotionalControl: 24, energy: 38, discipline: 42 }],
  repetition: ["repetition", "la répétition", "la repetición", { energy: 28, creativity: 36, discipline: 42 }],
  criticism: ["criticism", "la critique", "la crítica", { emotionalControl: 30, empathy: 38, ambition: 42 }],
  delay: ["delays", "les retards", "los retrasos", { emotionalControl: 26, discipline: 36, energy: 38 }],
};
const reactions = {
  spiral: ["Doom Spiral", "Spirale", "Espiral", { emotionalControl: 20, chaos: 76, discipline: 26 }],
  panic: ["Panic", "Panique", "Pánico", { emotionalControl: 18, chaos: 72, energy: 46 }],
  freeze: ["Freeze", "Blocage", "Bloqueo", { energy: 24, emotionalControl: 28, communication: 34 }],
  overthink: ["Overthinking", "Surréflexion", "Sobrepensamiento", { intelligence: 48, emotionalControl: 24, risk: 28 }],
  avoidance: ["Avoidance", "Évitement", "Evitación", { discipline: 22, communication: 30, ambition: 32 }],
  rage: ["Rage", "Colère", "Rabia", { emotionalControl: 16, chaos: 78, empathy: 28 }],
  shutdown: ["Shutdown", "Extinction", "Apagado", { energy: 18, social: 28, communication: 30 }],
  distraction: ["Distraction", "Distraction", "Distracción", { discipline: 20, chaos: 72, intelligence: 38 }],
  impulse: ["Impulse", "Impulsion", "Impulso", { risk: 74, discipline: 22, financialSense: 32 }],
  procrastination: ["Procrastination", "Procrastination", "Procrastinación", { discipline: 18, energy: 30, ambition: 34 }],
};

const activities = {
  reading: ["Reading", "Lecture", "Lectura", { intelligence: 82, discipline: 66, communication: 58 }],
  planning: ["Planning", "Planification", "Planificación", { discipline: 86, intelligence: 74, emotionalControl: 68 }],
  explaining: ["Explaining", "Explication", "Explicación", { communication: 88, empathy: 72, intelligence: 70 }],
  repairing: ["Repairing", "Réparation", "Reparación", { intelligence: 76, creativity: 78, discipline: 68 }],
  negotiating: ["Negotiating", "Négociation", "Negociación", { communication: 88, social: 78, emotionalControl: 72 }],
  learning: ["Learning", "Apprentissage", "Aprendizaje", { intelligence: 86, creativity: 72, discipline: 66 }],
  organizing: ["Organizing", "Organisation", "Organización", { discipline: 90, professionalism: 78, intelligence: 68 }],
  adapting: ["Adapting", "Adaptation", "Adaptación", { creativity: 82, emotionalControl: 78, risk: 62 }],
  observing: ["Observing", "Observation", "Observación", { intelligence: 82, empathy: 74, emotionalControl: 70 }],
  prioritizing: ["Prioritizing", "Priorisation", "Priorización", { discipline: 88, intelligence: 78, professionalism: 72 }],
  debugging: ["Debugging", "Débogage", "Depuración", { intelligence: 88, creativity: 78, emotionalControl: 66 }],
  teaching: ["Teaching", "Enseignement", "Enseñanza", { communication: 88, empathy: 84, intelligence: 72 }],
  listening: ["Listening", "Écoute", "Escucha", { empathy: 90, communication: 76, emotionalControl: 74 }],
  estimating: ["Estimating", "Estimation", "Estimación", { intelligence: 80, financialSense: 70, discipline: 72 }],
  coordinating: ["Coordinating", "Coordination", "Coordinación", { communication: 84, discipline: 80, social: 72 }],
  simplifying: ["Simplifying", "Simplification", "Simplificación", { intelligence: 84, communication: 80, creativity: 72 }],
  inventing: ["Inventing", "Invention", "Invención", { creativity: 92, intelligence: 78, risk: 68 }],
  recovering: ["Recovering", "Récupération", "Recuperación", { emotionalControl: 84, energy: 76, discipline: 68 }],
};
const qualities = {
  instinct: ["Instinct", "Instinct", "Instinto", { luck: 76, emotionalControl: 72, risk: 60 }],
  precision: ["Precision", "Précision", "Precisión", { discipline: 88, intelligence: 78, professionalism: 76 }],
  speed: ["Speed", "Vitesse", "Velocidad", { energy: 88, intelligence: 72, emotionalControl: 64 }],
  patience: ["Patience", "Patience", "Paciencia", { emotionalControl: 90, discipline: 76, empathy: 68 }],
  improvisation: ["Improvisation", "Improvisation", "Improvisación", { creativity: 90, chaos: 72, risk: 70 }],
  clarity: ["Clarity", "Clarté", "Claridad", { communication: 90, intelligence: 78, professionalism: 72 }],
  endurance: ["Endurance", "Endurance", "Resistencia", { energy: 88, discipline: 80, emotionalControl: 72 }],
  timing: ["Timing", "Timing", "Timing", { luck: 82, emotionalControl: 72, social: 66 }],
  intuition: ["Intuition", "Intuition", "Intuición", { empathy: 80, creativity: 76, intelligence: 68 }],
  discipline: ["Discipline", "Discipline", "Disciplina", { discipline: 94, professionalism: 78, emotionalControl: 74 }],
};

const modes = {
  sprint: ["Sprint", "Sprint", "Sprint", { energy: 90, discipline: 64, chaos: 54 }],
  steady: ["Steady", "Régulier", "Constante", { discipline: 84, emotionalControl: 78, energy: 66 }],
  deep_focus: ["Deep Focus", "Concentration profonde", "Concentración profunda", { discipline: 90, intelligence: 80, social: 30 }],
  social: ["Social", "Social", "Social", { social: 88, communication: 84, empathy: 74 }],
  night_owl: ["Night Owl", "Nocturne", "Noctámbulo", { creativity: 82, energy: 54, chaos: 62 }],
  early_bird: ["Early Bird", "Lève-tôt", "Madrugador", { discipline: 82, energy: 78, emotionalControl: 70 }],
  batch: ["Batch", "Par lots", "Por lotes", { discipline: 82, professionalism: 74, intelligence: 68 }],
  reactive: ["Reactive", "Réactif", "Reactivo", { energy: 82, emotionalControl: 68, chaos: 64 }],
  ritual: ["Ritual", "Rituel", "Ritual", { discipline: 90, emotionalControl: 78, chaos: 24 }],
  async: ["Async", "Asynchrone", "Asíncrono", { discipline: 76, communication: 70, social: 42 }],
  deadline: ["Deadline", "Deadline", "Plazo", { energy: 86, chaos: 70, discipline: 48 }],
  flow: ["Flow", "Flow", "Flujo", { creativity: 84, energy: 76, emotionalControl: 72 }],
  meeting_light: ["Meeting-Light", "Peu de réunions", "Pocas reuniones", { discipline: 76, social: 34, intelligence: 72 }],
  structured: ["Structured", "Structuré", "Estructurado", { discipline: 92, professionalism: 82, chaos: 20 }],
  experimental: ["Experimental", "Expérimental", "Experimental", { creativity: 90, risk: 78, chaos: 62 }],
  quiet: ["Quiet", "Calme", "Tranquilo", { emotionalControl: 86, social: 28, discipline: 72 }],
  mobile: ["Mobile", "Mobile", "Móvil", { adaptability: 0, energy: 74, discipline: 64, risk: 60 }],
  modular: ["Modular", "Modulaire", "Modular", { discipline: 78, intelligence: 76, creativity: 72 }],
};
delete modes.mobile[3].adaptability;
const workRoles = {
  planner: ["Planner", "Planificateur", "Planificador", { discipline: 88, intelligence: 72, emotionalControl: 68 }],
  improviser: ["Improviser", "Improvisateur", "Improvisador", { creativity: 88, chaos: 72, risk: 68 }],
  collaborator: ["Collaborator", "Collaborateur", "Colaborador", { social: 84, empathy: 80, communication: 82 }],
  soloist: ["Soloist", "Soliste", "Solista", { intelligence: 74, social: 30, discipline: 72 }],
  optimizer: ["Optimizer", "Optimiseur", "Optimizador", { intelligence: 84, discipline: 80, financialSense: 70 }],
  finisher: ["Finisher", "Finisseur", "Finalizador", { discipline: 90, energy: 78, professionalism: 80 }],
  explorer: ["Explorer", "Explorateur", "Explorador", { creativity: 84, risk: 76, energy: 72 }],
  coordinator: ["Coordinator", "Coordinateur", "Coordinador", { communication: 84, discipline: 80, social: 72 }],
  maker: ["Maker", "Créateur", "Creador", { creativity: 88, discipline: 68, intelligence: 72 }],
  reviewer: ["Reviewer", "Relecteur", "Revisor", { discipline: 84, intelligence: 78, professionalism: 82 }],
};

const habitats = {
  arctic: ["Arctic", "de l'Arctique", "del Ártico", { emotionalControl: 82, discipline: 72, energy: 58 }],
  desert: ["Desert", "du désert", "del desierto", { emotionalControl: 80, energy: 72, risk: 66 }],
  forest: ["Forest", "de la forêt", "del bosque", { empathy: 68, intelligence: 72, creativity: 70 }],
  mountain: ["Mountain", "de montagne", "de montaña", { risk: 74, energy: 82, discipline: 72 }],
  river: ["River", "de rivière", "de río", { adaptability: 0, emotionalControl: 76, creativity: 72, energy: 68 }],
  coastal: ["Coastal", "du littoral", "de la costa", { social: 68, emotionalControl: 76, energy: 72 }],
  storm: ["Storm", "de tempête", "de tormenta", { chaos: 82, emotionalControl: 72, risk: 74 }],
  midnight: ["Midnight", "de minuit", "de medianoche", { intelligence: 74, creativity: 78, social: 34 }],
  golden: ["Golden", "doré", "dorado", { luck: 82, social: 72, ambition: 68 }],
  silver: ["Silver", "argenté", "plateado", { intelligence: 76, emotionalControl: 78, professionalism: 68 }],
  red: ["Red", "rouge", "rojo", { energy: 80, risk: 72, ambition: 70 }],
  blue: ["Blue", "bleu", "azul", { emotionalControl: 84, empathy: 72, intelligence: 68 }],
  cloud: ["Cloud", "des nuages", "de las nubes", { creativity: 84, chaos: 58, luck: 72 }],
  urban: ["Urban", "urbain", "urbano", { social: 78, intelligence: 72, adaptability: 0, emotionalControl: 68 }],
  wild: ["Wild", "sauvage", "salvaje", { risk: 82, energy: 80, chaos: 72 }],
  quiet: ["Quiet", "silencieux", "tranquilo", { emotionalControl: 88, social: 30, discipline: 72 }],
};
for (const key of ["river", "urban"]) delete habitats[key][3].adaptability;
const species = {
  fox: ["Fox", "Renard", "Zorro", { intelligence: 80, creativity: 76, risk: 68 }],
  wolf: ["Wolf", "Loup", "Lobo", { social: 76, discipline: 72, energy: 78 }],
  owl: ["Owl", "Hibou", "Búho", { intelligence: 86, emotionalControl: 78, social: 32 }],
  otter: ["Otter", "Loutre", "Nutria", { social: 82, energy: 80, humor: 76 }],
  falcon: ["Falcon", "Faucon", "Halcón", { intelligence: 76, risk: 78, energy: 82 }],
  lynx: ["Lynx", "Lynx", "Lince", { intelligence: 78, social: 30, emotionalControl: 80 }],
  bear: ["Bear", "Ours", "Oso", { energy: 76, emotionalControl: 72, risk: 62 }],
  rabbit: ["Rabbit", "Lapin", "Conejo", { energy: 86, emotionalControl: 58, risk: 50 }],
  raven: ["Raven", "Corbeau", "Cuervo", { intelligence: 84, creativity: 80, humor: 64 }],
  gecko: ["Gecko", "Gecko", "Geco", { adaptability: 0, emotionalControl: 76, luck: 72, creativity: 68 }],
  dolphin: ["Dolphin", "Dauphin", "Delfín", { social: 86, intelligence: 82, empathy: 78 }],
  turtle: ["Turtle", "Tortue", "Tortuga", { discipline: 82, emotionalControl: 88, risk: 24 }],
  badger: ["Badger", "Blaireau", "Tejón", { discipline: 80, ambition: 76, risk: 68 }],
  heron: ["Heron", "Héron", "Garza", { emotionalControl: 86, intelligence: 74, discipline: 72 }],
};
delete species.gecko[3].adaptability;

function mergeProfiles(...profiles) {
  const sums = new Map();
  const counts = new Map();
  for (const profile of profiles) {
    for (const [key, value] of Object.entries(profile ?? {})) {
      if (!Number.isFinite(value)) continue;
      sums.set(key, (sums.get(key) ?? 0) + value);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return Object.fromEntries(
    [...sums.entries()]
      .map(([key, sum]) => [key, Math.round(sum / counts.get(key))])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6),
  );
}

function topTraitKeys(profile, weakness = false) {
  const entries = Object.entries(profile ?? {}).filter(([, value]) => Number.isFinite(value));
  entries.sort((a, b) => weakness ? a[1] - b[1] : b[1] - a[1]);
  return entries.slice(0, 2).map(([key]) => key);
}

function traitsText(profile, locale, weakness = false) {
  const [a, b] = topTraitKeys(profile, weakness);
  return [traitLabels[a]?.[locale], traitLabels[b]?.[locale]].filter(Boolean).join(locale === "fr" ? " et " : locale === "es" ? " y " : " and ");
}

function pairFromId(id, prefix, left, right) {
  const body = id.slice(prefix.length + 1);
  const keys = Object.keys(left).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (!body.startsWith(`${key}_`)) continue;
    const second = body.slice(key.length + 1);
    if (right[second]) return [key, second];
  }
  throw new Error(`Impossible de décoder ${id}`);
}

function robustDescription(value) {
  return locales.every((locale) => typeof value?.[locale] === "string" && value[locale].trim().length >= 55 && value[locale].trim().split(/\s+/).length >= 9);
}

function legacyDescription(entry, group) {
  const label = entry.name ?? entry.text;
  const profile = entry.lowProfile ?? entry.idealProfile;
  const trait = {
    en: traitsText(profile, "en", group === "weaknesses"),
    fr: traitsText(profile, "fr", group === "weaknesses"),
    es: traitsText(profile, "es", group === "weaknesses"),
  };
  const core = entry.text ?? label;
  const templates = {
    careers: L(
      `${label.en} is a role that rewards ${trait.en}. In practice, it means turning messy requests into useful work without losing sight of the people who depend on the result.`,
      `${label.fr} est un métier qui récompense ${trait.fr}. Au quotidien, il faut transformer des demandes parfois floues en travail utile sans perdre de vue les personnes qui dépendent du résultat.`,
      `${label.es} es una profesión que premia ${trait.es}. En la práctica, consiste en convertir peticiones confusas en trabajo útil sin perder de vista a quienes dependen del resultado.`,
    ),
    classes: L(
      `${label.en} describes the way you naturally approach problems. The profile leans on ${trait.en}, especially when the situation is unclear and somebody still has to make the next move.`,
      `${label.fr} décrit ta manière naturelle d'aborder les problèmes. Le profil repose sur ${trait.fr}, surtout quand la situation est floue et que quelqu'un doit quand même décider de la suite.`,
      `${label.es} describe tu manera natural de afrontar problemas. El perfil se apoya en ${trait.es}, sobre todo cuando la situación es confusa y alguien tiene que decidir el siguiente paso.`,
    ),
    powers: L(
      `${core.en} That power becomes genuinely useful because it combines ${trait.en}, turning a very ordinary situation into an advantage that other people somehow never notice in time.`,
      `${core.fr} Ce pouvoir devient vraiment utile grâce à ${trait.fr}, en transformant une situation très ordinaire en avantage que les autres ne voient généralement qu'un peu trop tard.`,
      `${core.es} Ese poder se vuelve realmente útil gracias a ${trait.es}, convirtiendo una situación muy normal en una ventaja que los demás suelen detectar demasiado tarde.`,
    ),
    weaknesses: L(
      `${core.en} It is a small trigger with an unfair amount of power, especially when ${trait.en} are already under pressure and the rest of the day refuses to cooperate.`,
      `${core.fr} C'est un petit déclencheur avec beaucoup trop de pouvoir, surtout quand ${trait.fr} sont déjà sous pression et que le reste de la journée refuse de coopérer.`,
      `${core.es} Es un pequeño detonante con demasiado poder, especialmente cuando ${trait.es} ya están bajo presión y el resto del día se niega a colaborar.`,
    ),
    abilities: L(
      `${core.en} The talent looks oddly specific until it saves several minutes, prevents a minor disaster, and reveals how much ${trait.en} are doing behind the scenes.`,
      `${core.fr} Le talent paraît très spécifique jusqu'au moment où il fait gagner plusieurs minutes, évite une petite catastrophe et montre à quel point ${trait.fr} travaillent en arrière-plan.`,
      `${core.es} El talento parece demasiado específico hasta que ahorra varios minutos, evita un pequeño desastre y demuestra cuánto aportan ${trait.es} entre bastidores.`,
    ),
    workStyles: L(
      `${core.en} It is a work style built around ${trait.en}. From the outside it may look unusual, but there is enough internal logic to keep projects moving when the week gets messy.`,
      `${core.fr} C'est un style de travail construit autour de ${trait.fr}. De l'extérieur il peut sembler étrange, mais sa logique interne suffit à faire avancer les projets quand la semaine se complique.`,
      `${core.es} Es un estilo de trabajo construido alrededor de ${trait.es}. Desde fuera puede parecer raro, pero tiene suficiente lógica interna para mantener los proyectos en marcha cuando la semana se complica.`,
    ),
    animals: L(
      `${label.en} matches a profile built around ${trait.en}. In human form, that means noticing the useful detail early, adapting quickly, and keeping a surprisingly specific survival strategy ready for awkward situations.`,
      `${label.fr} correspond à un profil construit autour de ${trait.fr}. En version humaine, cela revient à repérer tôt le détail utile, s'adapter vite et garder une stratégie de survie étonnamment précise pour les situations gênantes.`,
      `${label.es} encaja con un perfil construido alrededor de ${trait.es}. En versión humana, significa detectar pronto el detalle útil, adaptarse rápido y tener una estrategia de supervivencia sorprendentemente concreta para situaciones incómodas.`,
    ),
  };
  return templates[group];
}

function enrichedCareer(entry) {
  const [domainKey, roleKey] = pairFromId(entry.id, "career", domains, roles);
  const d = domains[domainKey], r = roles[roleKey];
  const profile = mergeProfiles(d[3], r[3]);
  const name = L(`${d[0]} ${r[0]}`, `${r[1]} ${d[1]}`, `${r[2]} de ${d[2]}`);
  return {
    ...entry,
    name,
    description: L(
      `${name.en} turns ${d[0].toLowerCase()} problems into decisions people can actually use. The role mixes ${traitsText(profile, "en")} with enough patience to keep the work useful when the brief changes halfway through.`,
      `${name.fr} transforme les problèmes liés à ${d[1]} en décisions réellement utilisables. Le rôle combine ${traitsText(profile, "fr")} avec assez de patience pour rester utile même quand le brief change en plein milieu.`,
      `${name.es} convierte los problemas de ${d[2]} en decisiones que la gente puede usar de verdad. El puesto combina ${traitsText(profile, "es")} con suficiente paciencia para seguir siendo útil cuando el encargo cambia a mitad de camino.`,
    ),
    idealProfile: profile,
  };
}

function enrichedClass(entry) {
  const [traitKey, roleKey] = pairFromId(entry.id, "class", traits, classRoles);
  const t = traits[traitKey], r = classRoles[roleKey];
  const profile = mergeProfiles(t[3], r[3]);
  const name = L(`${t[0]} ${r[0]}`, `${r[1]} ${t[1]}`, `${r[2]} ${t[2]}`);
  return {
    ...entry,
    name,
    description: L(
      `${name.en} handles messy situations by combining a ${t[0].toLowerCase()} instinct with the habits of a ${r[0].toLowerCase()}. It relies on ${traitsText(profile, "en")}, especially when everyone else is still deciding what the actual problem is.`,
      `${name.fr} gère les situations compliquées en combinant un instinct ${t[1]} avec les réflexes d'un ${r[1].toLowerCase()}. Le profil s'appuie sur ${traitsText(profile, "fr")}, surtout quand les autres cherchent encore à comprendre le vrai problème.`,
      `${name.es} afronta situaciones complicadas combinando un instinto ${t[2]} con los hábitos de un ${r[2].toLowerCase()}. El perfil se apoya en ${traitsText(profile, "es")}, especialmente cuando los demás todavía intentan entender cuál es el problema real.`,
    ),
    idealProfile: profile,
  };
}

function enrichedPower(entry) {
  const [traitKey, mechanicKey] = pairFromId(entry.id, "power", traits, mechanics);
  const t = traits[traitKey], m = mechanics[mechanicKey];
  const profile = mergeProfiles(t[3], m[3]);
  const name = L(`${m[0]} of ${t[0]} Focus`, `${m[1]} de concentration ${t[1]}`, `${m[2]} de enfoque ${t[2]}`);
  return {
    ...entry,
    name,
    description: L(
      `${name.en} activates when a normal situation starts going sideways. It turns a ${m[0].toLowerCase()} response into a repeatable advantage, powered mostly by ${traitsText(profile, "en")} instead of blind luck.`,
      `${name.fr} s'active dès qu'une situation normale commence à partir de travers. Il transforme une réponse de type ${m[1].toLowerCase()} en avantage reproductible, surtout grâce à ${traitsText(profile, "fr")} plutôt qu'à la chance pure.`,
      `${name.es} se activa cuando una situación normal empieza a torcerse. Convierte una respuesta de tipo ${m[2].toLowerCase()} en una ventaja repetible, impulsada sobre todo por ${traitsText(profile, "es")} y no por pura suerte.`,
    ),
    idealProfile: profile,
  };
}

function enrichedWeakness(entry) {
  const [triggerKey, reactionKey] = pairFromId(entry.id, "weakness", triggers, reactions);
  const t = triggers[triggerKey], r = reactions[reactionKey];
  const profile = mergeProfiles(t[3], r[3]);
  const name = L(`${t[0][0].toUpperCase()}${t[0].slice(1)} ${r[0]}`, `${r[1]} face à ${t[1]}`, `${r[2]} ante ${t[2]}`);
  return {
    ...entry,
    name,
    description: L(
      `${name.en} is the kind of tiny trigger that can hijack far more attention than it deserves. When ${t[0]} meet a ${r[0].toLowerCase()} response, ${traitsText(profile, "en", true)} are usually the first parts of the system to wobble.`,
      `${name.fr} est le genre de petit déclencheur capable de voler beaucoup trop d'attention. Quand ${t[1]} provoquent une réaction de type ${r[1].toLowerCase()}, ${traitsText(profile, "fr", true)} sont généralement les premières parties du système à vaciller.`,
      `${name.es} es el tipo de pequeño detonante capaz de robar demasiada atención. Cuando ${t[2]} provocan una reacción de ${r[2].toLowerCase()}, ${traitsText(profile, "es", true)} suelen ser las primeras partes del sistema en tambalearse.`,
    ),
    lowProfile: profile,
  };
}

function enrichedAbility(entry) {
  const [activityKey, qualityKey] = pairFromId(entry.id, "ability", activities, qualities);
  const a = activities[activityKey], q = qualities[qualityKey];
  const profile = mergeProfiles(a[3], q[3]);
  const name = L(`${a[0]} With ${q[0]}`, `${a[0]} avec ${q[1].toLowerCase()}`, `${a[2]} con ${q[2].toLowerCase()}`);
  return {
    ...entry,
    name,
    description: L(
      `${name.en} turns an ordinary ${a[0].toLowerCase()} task into something suspiciously efficient. The trick is a mix of ${q[0].toLowerCase()} and ${traitsText(profile, "en")}, so the result feels repeatable rather than accidentally lucky.`,
      `${name.fr} transforme une tâche ordinaire de ${a[1].toLowerCase()} en quelque chose d'étrangement efficace. Le secret mélange ${q[1].toLowerCase()} et ${traitsText(profile, "fr")}, ce qui rend le résultat reproductible plutôt que simplement chanceux.`,
      `${name.es} convierte una tarea normal de ${a[2].toLowerCase()} en algo sospechosamente eficiente. El truco mezcla ${q[2].toLowerCase()} con ${traitsText(profile, "es")}, haciendo que el resultado sea repetible y no simple suerte.`,
    ),
    idealProfile: profile,
  };
}

function enrichedWorkStyle(entry) {
  const [modeKey, roleKey] = pairFromId(entry.id, "workstyle", modes, workRoles);
  const m = modes[modeKey], r = workRoles[roleKey];
  const profile = mergeProfiles(m[3], r[3]);
  const name = L(`${m[0]} ${r[0]} Mode`, `Mode ${r[1].toLowerCase()} ${m[1].toLowerCase()}`, `Modo ${r[2].toLowerCase()} ${m[2].toLowerCase()}`);
  return {
    ...entry,
    name,
    description: L(
      `${name.en} describes how you actually get things done when nobody is watching. It blends a ${m[0].toLowerCase()} rhythm with the instincts of a ${r[0].toLowerCase()}, relying on ${traitsText(profile, "en")} to survive the week.`,
      `${name.fr} décrit la façon dont tu avances vraiment quand personne ne regarde. Il mélange un rythme ${m[1].toLowerCase()} avec les réflexes d'un ${r[1].toLowerCase()}, en s'appuyant sur ${traitsText(profile, "fr")} pour survivre à la semaine.`,
      `${name.es} describe cómo consigues avanzar de verdad cuando nadie mira. Mezcla un ritmo ${m[2].toLowerCase()} con los instintos de un ${r[2].toLowerCase()}, apoyándose en ${traitsText(profile, "es")} para sobrevivir a la semana.`,
    ),
    idealProfile: profile,
  };
}

function enrichedAnimal(entry) {
  const [habitatKey, speciesKey] = pairFromId(entry.id, "animal", habitats, species);
  const h = habitats[habitatKey], s = species[speciesKey];
  const profile = mergeProfiles(h[3], s[3]);
  const name = L(`${h[0]} ${s[0]}`, `${s[1]} ${h[1]}`, `${s[2]} ${h[2]}`);
  return {
    ...entry,
    name,
    description: L(
      `${name.en} combines the survival habits of a ${s[0].toLowerCase()} with the temperament of a ${h[0].toLowerCase()} environment. In human form, that looks like ${traitsText(profile, "en")}, plus a very specific instinct for escaping awkward situations.`,
      `${name.fr} combine les réflexes de survie d'un ${s[1].toLowerCase()} avec le tempérament d'un environnement ${h[1]}. En version humaine, cela donne ${traitsText(profile, "fr")}, avec un instinct très précis pour sortir des situations gênantes.`,
      `${name.es} combina los hábitos de supervivencia de un ${s[2].toLowerCase()} con el temperamento de un entorno ${h[2]}. En versión humana, eso se traduce en ${traitsText(profile, "es")}, además de un instinto muy concreto para escapar de situaciones incómodas.`,
    ),
    idealProfile: profile,
  };
}

const enrichers = {
  careers: enrichedCareer,
  classes: enrichedClass,
  powers: enrichedPower,
  weaknesses: enrichedWeakness,
  abilities: enrichedAbility,
  workStyles: enrichedWorkStyle,
  animals: enrichedAnimal,
};

for (const group of groups) {
  const entries = await read(group);
  const enriched = entries.map((entry) => {
    if (entry.tags?.includes("expanded_v2")) return enrichers[group](entry);
    if (robustDescription(entry.description)) return entry;
    return { ...entry, description: legacyDescription(entry, group) };
  });
  await write(group, enriched);
  console.log(`${group}: ${enriched.length} entrées enrichies`);
}
