import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const dataDir = resolve(root, "src/data");
const questionDir = resolve(dataDir, "questions");
const STAT_KEYS = [
  "intelligence", "creativity", "emotionalControl", "empathy", "social",
  "communication", "ambition", "discipline", "professionalism", "financialSense",
  "risk", "luck", "energy", "humor", "chaos",
];

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const writeJson = async (path, value) => writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
const loadData = (name) => readJson(resolve(dataDir, `${name}.json`));
const loadQuestions = (name) => readJson(resolve(questionDir, `${name}.json`));

function stableHash(text) {
  let hash = 2166136261;
  for (const char of text) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function makeProfile(id, weakness = false) {
  const seed = stableHash(id);
  const profile = {};
  const count = 5 + (seed % 2);
  let cursor = seed % STAT_KEYS.length;
  const step = 4 + (seed % 7);
  for (let index = 0; Object.keys(profile).length < count; index += 1) {
    cursor = (cursor + step + index) % STAT_KEYS.length;
    const stat = STAT_KEYS[cursor];
    if (Object.hasOwn(profile, stat)) continue;
    const raw = (seed >>> ((index % 4) * 5)) + index * 23;
    profile[stat] = weakness ? 8 + (raw % 67) : 24 + (raw % 71);
  }
  return profile;
}

function slug(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

const ANSWER_ARCHETYPES = [
  {
    key: "checklist",
    text: {
      en: "I make a checklist and deal with it one step at a time.",
      fr: "Je fais une checklist et je règle ça étape par étape.",
      es: "Hago una lista y lo resuelvo paso a paso.",
    },
    effects: { discipline: 7, professionalism: 4, emotionalControl: 3, chaos: -3 },
  },
  {
    key: "ask_expert",
    text: {
      en: "I ask the most competent person nearby before making it worse.",
      fr: "Je demande à la personne la plus compétente avant d'aggraver le truc.",
      es: "Pregunto a la persona más competente antes de empeorarlo.",
    },
    effects: { communication: 6, empathy: 3, intelligence: 3, ambition: -1 },
  },
  {
    key: "improvise",
    text: {
      en: "I improvise confidently and hope confidence counts as a plan.",
      fr: "J'improvise avec aplomb en espérant que la confiance compte comme un plan.",
      es: "Improviso con confianza y espero que la confianza cuente como plan.",
    },
    effects: { creativity: 7, risk: 5, energy: 4, discipline: -4 },
  },
  {
    key: "joke",
    text: {
      en: "I turn it into a joke first, then maybe solve the actual problem.",
      fr: "J'en fais d'abord une blague, puis éventuellement je règle le vrai problème.",
      es: "Primero lo convierto en broma y luego quizá resuelva el problema real.",
    },
    effects: { humor: 8, social: 4, chaos: 3, professionalism: -2 },
  },
  {
    key: "research",
    text: {
      en: "I research it so thoroughly that the original problem starts looking simple.",
      fr: "Je fais tellement de recherches que le problème de départ finit par sembler simple.",
      es: "Investigo tanto que el problema original termina pareciendo sencillo.",
    },
    effects: { intelligence: 8, discipline: 3, energy: -2, emotionalControl: -1 },
  },
  {
    key: "ignore",
    text: {
      en: "I ignore it for five minutes to see whether reality fixes itself.",
      fr: "Je l'ignore cinq minutes pour voir si la réalité se répare toute seule.",
      es: "Lo ignoro cinco minutos para ver si la realidad se arregla sola.",
    },
    effects: { emotionalControl: 4, discipline: -6, chaos: 4, energy: -2 },
  },
  {
    key: "automate",
    text: {
      en: "I automate the repetitive part even if setting it up takes longer.",
      fr: "J'automatise la partie répétitive même si la mise en place prend plus longtemps.",
      es: "Automatizo la parte repetitiva aunque prepararlo tarde más.",
    },
    effects: { intelligence: 6, creativity: 5, discipline: 4, professionalism: 2 },
  },
  {
    key: "shortcut",
    text: {
      en: "I take the fastest risky shortcut and accept that future me may hate me.",
      fr: "Je prends le raccourci risqué le plus rapide et j'accepte que mon futur moi me déteste.",
      es: "Tomo el atajo arriesgado más rápido y acepto que mi yo futuro quizá me odie.",
    },
    effects: { risk: 9, energy: 5, chaos: 5, discipline: -5 },
  },
  {
    key: "help_first",
    text: {
      en: "I help whoever is most affected first, then worry about my part.",
      fr: "J'aide d'abord la personne la plus touchée, puis je m'occupe de ma partie.",
      es: "Primero ayudo a quien más lo sufre y luego me ocupo de mi parte.",
    },
    effects: { empathy: 8, social: 5, communication: 3, ambition: -2 },
  },
  {
    key: "backup",
    text: {
      en: "I build a backup plan, and then a backup plan for the backup plan.",
      fr: "Je prépare un plan B, puis un plan B pour le plan B.",
      es: "Preparo un plan B y luego otro plan B para el plan B.",
    },
    effects: { discipline: 7, intelligence: 4, risk: -5, emotionalControl: 4 },
  },
];

const QUESTION_SCENARIOS = {
  work: [
    ["scope_creep", "A small task suddenly becomes a huge project. What do you do?", "Une petite tâche devient soudain un énorme projet. Tu fais quoi ?", "Una tarea pequeña se convierte de repente en un proyecto enorme. ¿Qué haces?"],
    ["camera_on", "A video call starts and everyone unexpectedly has their camera on. Your move?", "Un appel vidéo commence et tout le monde a soudain sa caméra allumée. Tu fais quoi ?", "Empieza una videollamada y de repente todos tienen la cámara encendida. ¿Qué haces?"],
    ["double_booking", "Two important meetings are booked at exactly the same time. You...", "Deux réunions importantes sont prévues exactement au même moment. Tu...", "Dos reuniones importantes están programadas exactamente a la misma hora. Tú..."],
    ["mystery_spreadsheet", "Someone sends you a giant spreadsheet with no explanation. You...", "Quelqu'un t'envoie un énorme tableur sans aucune explication. Tu...", "Alguien te envía una hoja de cálculo enorme sin explicación. Tú..."],
    ["last_minute_demo", "You are asked to give a demo with ten minutes of warning. You...", "On te demande de faire une démo avec dix minutes de préavis. Tu...", "Te piden hacer una demo con diez minutos de aviso. Tú..."],
    ["new_tool_migration", "Your team changes tools again and everything moved overnight. You...", "Ton équipe change encore d'outil et tout a bougé pendant la nuit. Tu...", "Tu equipo vuelve a cambiar de herramienta y todo se movió durante la noche. Tú..."],
    ["urgent_client_ping", "A client writes 'urgent' but gives absolutely no context. You...", "Un client écrit « urgent » sans donner le moindre contexte. Tu...", "Un cliente escribe 'urgente' sin dar absolutamente ningún contexto. Tú..."],
    ["calendar_tetris", "Your calendar has five meetings and zero gaps. You...", "Ton calendrier a cinq réunions et aucun trou. Tu...", "Tu calendario tiene cinco reuniones y ningún hueco. Tú..."],
    ["review_feedback", "You receive feedback that simply says 'make it better'. You...", "Tu reçois un feedback qui dit simplement « fais mieux ». Tu...", "Recibes un comentario que solo dice 'hazlo mejor'. Tú..."],
    ["office_temperature", "The office is somehow both too hot and too cold depending on the corner. You...", "Le bureau est à la fois trop chaud et trop froid selon le coin. Tu...", "La oficina está a la vez demasiado caliente y demasiado fría según la esquina. Tú..."],
  ],
  social: [
    ["surprise_guest", "A friend arrives with an unexpected extra guest. You...", "Un ami arrive avec une personne en plus que personne n'avait prévue. Tu...", "Un amigo llega con un invitado extra inesperado. Tú..."],
    ["group_photo", "Someone says 'one quick group photo' and thirty poses later you're still there. You...", "Quelqu'un dit « une petite photo de groupe » et trente poses plus tard tu es toujours là. Tu...", "Alguien dice 'una foto rápida de grupo' y treinta poses después sigues ahí. Tú..."],
    ["friend_late", "Your friend is forty minutes late and just texts 'almost there'. You...", "Ton ami a quarante minutes de retard et écrit juste « j'arrive ». Tu...", "Tu amigo llega cuarenta minutos tarde y solo escribe 'ya casi'. Tú..."],
    ["shared_playlist", "Someone adds a wildly inappropriate song to the shared playlist. You...", "Quelqu'un ajoute une chanson complètement inadaptée à la playlist commune. Tu...", "Alguien añade una canción totalmente inapropiada a la lista compartida. Tú..."],
    ["elevator_small_talk", "You get trapped in elevator small talk with someone you barely know. You...", "Tu te retrouves coincé dans du small talk d'ascenseur avec quelqu'un que tu connais à peine. Tu...", "Te quedas atrapado en charla de ascensor con alguien que apenas conoces. Tú..."],
    ["party_game", "A party game suddenly requires you to perform in front of everyone. You...", "Un jeu de soirée exige soudain que tu fasses quelque chose devant tout le monde. Tu...", "Un juego de fiesta exige de repente que actúes delante de todos. Tú..."],
    ["message_seen", "You realize you left an important message on seen for two days. You...", "Tu réalises que tu as laissé un message important en vu pendant deux jours. Tu...", "Te das cuenta de que dejaste un mensaje importante en visto durante dos días. Tú..."],
    ["borrowed_item", "A friend returns something they borrowed in suspicious condition. You...", "Un ami te rend un objet emprunté dans un état suspect. Tu...", "Un amigo devuelve algo prestado en un estado sospechoso. Tú..."],
    ["trip_planning", "Your group tries to plan a trip and nobody agrees on anything. You...", "Ton groupe essaie d'organiser un voyage et personne n'est d'accord sur rien. Tu...", "Tu grupo intenta organizar un viaje y nadie se pone de acuerdo en nada. Tú..."],
    ["inside_joke", "Everyone laughs at an inside joke you completely missed. You...", "Tout le monde rit à une private joke que tu as complètement ratée. Tu...", "Todos se ríen de una broma interna que tú no entendiste. Tú..."],
  ],
  life: [
    ["grocery_budget", "Your grocery total is way higher than expected. You...", "Le total de tes courses est beaucoup plus élevé que prévu. Tu...", "El total de tu compra es mucho más alto de lo esperado. Tú..."],
    ["flat_tire", "You discover a flat tire exactly when you need to leave. You...", "Tu découvres un pneu crevé exactement au moment de partir. Tu...", "Descubres una rueda pinchada justo cuando tienes que salir. Tú..."],
    ["laundry_mountain", "The laundry pile has achieved geological significance. You...", "La pile de linge a atteint une importance géologique. Tu...", "La montaña de ropa ya tiene importancia geológica. Tú..."],
    ["lost_keys", "Your keys have vanished five minutes before you need them. You...", "Tes clés ont disparu cinq minutes avant que tu en aies besoin. Tu...", "Tus llaves desaparecen cinco minutos antes de necesitarlas. Tú..."],
    ["weather_flip", "The weather completely changes after you already left home. You...", "La météo change complètement alors que tu as déjà quitté la maison. Tu...", "El tiempo cambia por completo después de que ya saliste de casa. Tú..."],
    ["room_rearrange", "You decide at 9 PM that your entire room needs a new layout. You...", "À 21 h, tu décides que toute ta pièce doit être réorganisée. Tu...", "A las 21:00 decides que toda tu habitación necesita otra distribución. Tú..."],
    ["new_recipe", "You try a new recipe and halfway through it looks nothing like the picture. You...", "Tu testes une nouvelle recette et à mi-chemin ça ne ressemble absolument pas à la photo. Tu...", "Pruebas una receta nueva y a mitad no se parece en nada a la foto. Tú..."],
    ["sleep_schedule", "Your sleep schedule has quietly shifted by three hours. You...", "Ton rythme de sommeil s'est discrètement décalé de trois heures. Tu...", "Tu horario de sueño se ha desplazado silenciosamente tres horas. Tú..."],
    ["package_delay", "A package you were waiting for gets delayed again. You...", "Un colis que tu attendais est encore retardé. Tu...", "Un paquete que esperabas vuelve a retrasarse. Tú..."],
    ["weekly_planning", "Sunday evening arrives and next week is completely unplanned. You...", "Dimanche soir arrive et ta semaine prochaine n'est absolument pas planifiée. Tu...", "Llega el domingo por la noche y la próxima semana está totalmente sin planificar. Tú..."],
  ],
  personality: [
    ["public_mistake", "You make a small mistake in front of a lot of people. You...", "Tu fais une petite erreur devant beaucoup de monde. Tu...", "Cometes un pequeño error delante de mucha gente. Tú..."],
    ["rule_exception", "A rule clearly makes no sense in this one situation. You...", "Une règle n'a clairement aucun sens dans cette situation précise. Tu...", "Una regla claramente no tiene sentido en esta situación concreta. Tú..."],
    ["unpopular_opinion", "Everyone in the room agrees on something you strongly disagree with. You...", "Tout le monde est d'accord sur quelque chose avec lequel tu es totalement en désaccord. Tu...", "Todos en la sala están de acuerdo con algo con lo que tú discrepas mucho. Tú..."],
    ["sudden_competition", "A casual activity unexpectedly becomes competitive. You...", "Une activité tranquille devient soudain compétitive. Tu...", "Una actividad casual se vuelve competitiva de repente. Tú..."],
    ["secret_task", "You're trusted with a task nobody else is supposed to know about. You...", "On te confie une tâche dont personne d'autre ne doit être au courant. Tu...", "Te confían una tarea que nadie más debe conocer. Tú..."],
    ["empty_room", "You enter a room where you know absolutely nobody. You...", "Tu entres dans une pièce où tu ne connais absolument personne. Tu...", "Entras en una sala donde no conoces absolutamente a nadie. Tú..."],
    ["ambiguous_praise", "Someone gives you a compliment that might also be an insult. You...", "Quelqu'un te fait un compliment qui pourrait aussi être une insulte. Tu...", "Alguien te hace un cumplido que también podría ser un insulto. Tú..."],
    ["moral_shortcut", "You can get what you want faster by bending a harmless rule. You...", "Tu peux obtenir ce que tu veux plus vite en tordant une règle apparemment inoffensive. Tu...", "Puedes conseguir lo que quieres más rápido saltándote una regla aparentemente inofensiva. Tú..."],
    ["new_identity", "You get a chance to introduce yourself to people who know nothing about you. You...", "Tu peux te présenter à des gens qui ne savent absolument rien de toi. Tu...", "Tienes la oportunidad de presentarte ante gente que no sabe nada de ti. Tú..."],
    ["tiny_victory", "You win something completely trivial but technically you still won. You...", "Tu gagnes quelque chose de totalement insignifiant, mais techniquement tu as gagné. Tu...", "Ganas algo totalmente trivial, pero técnicamente has ganado. Tú..."],
  ],
  general: [
    ["power_outage", "The power suddenly goes out for an unknown amount of time. You...", "Le courant se coupe soudain pour une durée inconnue. Tu...", "La electricidad se corta de repente por un tiempo desconocido. Tú..."],
    ["mystery_box", "A sealed mystery box appears with your name on it. You...", "Une boîte mystérieuse fermée apparaît avec ton nom dessus. Tu...", "Aparece una caja misteriosa cerrada con tu nombre. Tú..."],
    ["free_ticket", "You unexpectedly get a free ticket to an event you know nothing about. You...", "Tu reçois gratuitement une place pour un événement dont tu ne sais rien. Tu...", "Recibes gratis una entrada para un evento del que no sabes nada. Tú..."],
    ["wrong_turn", "A wrong turn takes you somewhere you've never been before. You...", "Un mauvais virage t'emmène dans un endroit où tu n'es jamais allé. Tu...", "Un giro equivocado te lleva a un lugar donde nunca has estado. Tú..."],
    ["unplanned_challenge", "Someone challenges you to do something you've never tried. You...", "Quelqu'un te met au défi de faire quelque chose que tu n'as jamais essayé. Tu...", "Alguien te reta a hacer algo que nunca has probado. Tú..."],
    ["random_skill", "You can instantly learn one oddly specific skill for a day. You...", "Tu peux apprendre instantanément une compétence très spécifique pendant une journée. Tu...", "Puedes aprender al instante una habilidad muy específica durante un día. Tú..."],
    ["one_hour_free", "One completely free hour appears in the middle of your day. You...", "Une heure totalement libre apparaît au milieu de ta journée. Tu...", "Aparece una hora completamente libre en medio de tu día. Tú..."],
    ["strange_notification", "Your phone shows a notification from an app you don't remember installing. You...", "Ton téléphone affiche une notification d'une appli que tu ne te souviens pas avoir installée. Tu...", "Tu móvil muestra una notificación de una app que no recuerdas haber instalado. Tú..."],
    ["lucky_break", "Something goes unexpectedly right for once. You...", "Pour une fois, quelque chose se passe étonnamment bien. Tu...", "Por una vez, algo sale inesperadamente bien. Tú..."],
    ["plan_collapses", "A plan you've been preparing all week collapses in five seconds. You...", "Un plan que tu préparais depuis toute la semaine s'effondre en cinq secondes. Tu...", "Un plan que llevabas preparando toda la semana se derrumba en cinco segundos. Tú..."],
  ],
};

function makeQuestion(theme, scenario, questionIndex) {
  const [key, en, fr, es] = scenario;
  const id = `q_${theme}_${key}`;
  return {
    id,
    category: theme,
    selectionWeight: 1,
    text: { en, fr, es },
    answers: ANSWER_ARCHETYPES.map((archetype, answerIndex) => {
      const extraStat = STAT_KEYS[(questionIndex * 3 + answerIndex * 5 + theme.length) % STAT_KEYS.length];
      const effects = { ...archetype.effects };
      effects[extraStat] = (effects[extraStat] ?? 0) + ((answerIndex % 2 === 0) ? 2 : -2);
      return {
        id: `${id}_${archetype.key}`,
        text: archetype.text,
        effects,
        selectionWeight: 1,
      };
    }),
  };
}

const CAREER_NAMES = [
  ["Data Librarian", "Bibliothécaire de données", "Bibliotecario de datos"],
  ["Incident Coordinator", "Coordinateur d'incidents", "Coordinador de incidentes"],
  ["User Researcher", "Chercheur UX", "Investigador de usuarios"],
  ["Automation Consultant", "Consultant en automatisation", "Consultor de automatización"],
  ["Community Moderator", "Modérateur de communauté", "Moderador de comunidad"],
  ["Logistics Planner", "Planificateur logistique", "Planificador logístico"],
  ["Quality Assurance Tester", "Testeur qualité", "Tester de calidad"],
  ["Cybersecurity Analyst", "Analyste cybersécurité", "Analista de ciberseguridad"],
  ["Product Manager", "Chef de produit", "Gerente de producto"],
  ["Urban Gardener", "Jardinier urbain", "Jardinero urbano"],
  ["Museum Guide", "Guide de musée", "Guía de museo"],
  ["Audio Editor", "Monteur audio", "Editor de audio"],
  ["Content Strategist", "Stratège de contenu", "Estratega de contenido"],
  ["Drone Operator", "Opérateur de drone", "Operador de dron"],
  ["Repair Technician", "Technicien de réparation", "Técnico de reparación"],
  ["Event Producer", "Producteur d'événements", "Productor de eventos"],
  ["Customer Success Lead", "Responsable réussite client", "Responsable de éxito del cliente"],
  ["Operations Analyst", "Analyste des opérations", "Analista de operaciones"],
  ["Sustainability Advisor", "Conseiller en durabilité", "Asesor de sostenibilidad"],
  ["Archivist", "Archiviste", "Archivero"],
  ["Technical Writer", "Rédacteur technique", "Redactor técnico"],
  ["Game Designer", "Game designer", "Diseñador de videojuegos"],
  ["Paramedic", "Ambulancier", "Paramédico"],
  ["Mediator", "Médiateur", "Mediador"],
  ["Sound Engineer", "Ingénieur du son", "Ingeniero de sonido"],
  ["Data Analyst", "Analyste de données", "Analista de datos"],
  ["Research Assistant", "Assistant de recherche", "Asistente de investigación"],
  ["Travel Planner", "Organisateur de voyages", "Planificador de viajes"],
  ["Workshop Facilitator", "Animateur d'atelier", "Facilitador de talleres"],
  ["Inventory Manager", "Gestionnaire de stock", "Gestor de inventario"],
  ["Accessibility Specialist", "Spécialiste accessibilité", "Especialista en accesibilidad"],
  ["Crisis Communicator", "Communicant de crise", "Comunicador de crisis"],
  ["Prototype Builder", "Constructeur de prototypes", "Constructor de prototipos"],
  ["Knowledge Manager", "Gestionnaire des connaissances", "Gestor del conocimiento"],
  ["Field Researcher", "Chercheur de terrain", "Investigador de campo"],
  ["Process Designer", "Concepteur de processus", "Diseñador de procesos"],
  ["Professional Context Finder", "Chercheur professionnel de contexte", "Buscador profesional de contexto"],
  ["Meeting Exit Strategist", "Stratège de sortie de réunion", "Estratega de salida de reuniones"],
  ["Notification Archaeologist", "Archéologue de notifications", "Arqueólogo de notificaciones"],
  ["Deadline Translator", "Traducteur de deadlines", "Traductor de plazos"],
  ["Browser Tab Curator", "Conservateur d'onglets", "Curador de pestañas"],
  ["Professional Plan Rescuer", "Sauveteur professionnel de plans", "Rescatador profesional de planes"],
  ["Coffee Queue Analyst", "Analyste de file à café", "Analista de cola de café"],
  ["Group Chat Diplomat", "Diplomate de groupe de discussion", "Diplomático de chat grupal"],
  ["Cable Untangling Specialist", "Spécialiste du démêlage de câbles", "Especialista en desenredar cables"],
  ["Last-Minute Slide Doctor", "Médecin des slides de dernière minute", "Doctor de diapositivas de última hora"],
  ["Professional Backup Planner", "Planificateur professionnel de plans B", "Planificador profesional de planes B"],
  ["Inbox Wildlife Ranger", "Garde forestier de boîte mail", "Guardabosques del buzón"],
  ["Calendar Conflict Negotiator", "Négociateur de conflits d'agenda", "Negociador de conflictos de calendario"],
  ["Certified Vibe Auditor", "Auditeur d'ambiance certifié", "Auditor de ambiente certificado"],
];

const CLASS_ADJECTIVES = [
  ["chaotic", "Chaotic", "Chaotique", "Caótico"],
  ["methodical", "Methodical", "Méthodique", "Metódico"],
  ["relentless", "Relentless", "Tenace", "Implacable"],
  ["diplomatic", "Diplomatic", "Diplomate", "Diplomático"],
  ["curious", "Curious", "Curieux", "Curioso"],
  ["stoic", "Stoic", "Stoïque", "Estoico"],
  ["social", "Social", "Social", "Social"],
  ["improvised", "Improvised", "Improvisé", "Improvisado"],
  ["strategic", "Strategic", "Stratégique", "Estratégico"],
];
const CLASS_ROLES = [
  ["tactician", "Tactician", "Tacticien", "Táctico"],
  ["explorer", "Explorer", "Explorateur", "Explorador"],
  ["fixer", "Fixer", "Dépanneur", "Solucionador"],
  ["analyst", "Analyst", "Analyste", "Analista"],
  ["catalyst", "Catalyst", "Catalyseur", "Catalizador"],
];

const POWER_DOMAINS = [
  ["focus", "Focus", "Concentration", "Concentración"],
  ["timing", "Timing", "Timing", "Timing"],
  ["memory", "Memory", "Mémoire", "Memoria"],
  ["communication", "Communication", "Communication", "Comunicación"],
  ["luck", "Luck", "Chance", "Suerte"],
  ["energy", "Energy", "Énergie", "Energía"],
  ["creativity", "Creativity", "Créativité", "Creatividad"],
  ["calm", "Calm", "Calme", "Calma"],
  ["navigation", "Navigation", "Navigation", "Navegación"],
];
const POWER_FORMS = [
  ["burst", "Burst", "Rafale", "Ráfaga"],
  ["shield", "Shield", "Bouclier", "Escudo"],
  ["radar", "Radar", "Radar", "Radar"],
  ["override", "Override", "Forçage", "Anulación"],
  ["echo", "Echo", "Écho", "Eco"],
];

const WEAKNESS_TRIGGERS = [
  ["notification", "Notification", "Notification", "Notificación"],
  ["deadline", "Deadline", "Deadline", "Plazo"],
  ["ambiguity", "Ambiguity", "Ambiguïté", "Ambigüedad"],
  ["silence", "Silence", "Silence", "Silencio"],
  ["comparison", "Comparison", "Comparaison", "Comparación"],
  ["queue", "Queue", "File d'attente", "Cola"],
  ["choice", "Too Many Choices", "Trop de choix", "Demasiadas opciones"],
  ["interruption", "Interruption", "Interruption", "Interrupción"],
  ["fatigue", "Fatigue", "Fatigue", "Fatiga"],
];
const WEAKNESS_FORMS = [
  ["spiral", "Spiral", "Spirale", "Espiral"],
  ["panic", "Panic", "Panique", "Pánico"],
  ["freeze", "Freeze", "Blocage", "Bloqueo"],
  ["overthink", "Overthinking", "Surréflexion", "Sobrepensamiento"],
  ["avoidance", "Avoidance", "Évitement", "Evitación"],
];

const ABILITY_DOMAINS = [
  ["reading", "Reading", "Lecture", "Lectura"],
  ["planning", "Planning", "Planification", "Planificación"],
  ["explaining", "Explaining", "Explication", "Explicación"],
  ["repairing", "Repairing", "Réparation", "Reparación"],
  ["negotiating", "Negotiating", "Négociation", "Negociación"],
  ["learning", "Learning", "Apprentissage", "Aprendizaje"],
  ["organizing", "Organizing", "Organisation", "Organización"],
  ["adapting", "Adapting", "Adaptation", "Adaptación"],
  ["observing", "Observing", "Observation", "Observación"],
];
const ABILITY_FORMS = [
  ["instinct", "Instinct", "Instinct", "Instinto"],
  ["precision", "Precision", "Précision", "Precisión"],
  ["speed", "Speed", "Vitesse", "Velocidad"],
  ["patience", "Patience", "Patience", "Paciencia"],
  ["improvisation", "Improvisation", "Improvisation", "Improvisación"],
];

const STYLE_RHYTHMS = [
  ["sprint", "Sprint", "Sprint", "Sprint"],
  ["steady", "Steady", "Régulier", "Constante"],
  ["deep_focus", "Deep Focus", "Concentration profonde", "Concentración profunda"],
  ["social", "Social", "Social", "Social"],
  ["night_owl", "Night Owl", "Oiseau de nuit", "Noctámbulo"],
  ["early_bird", "Early Bird", "Lève-tôt", "Madrugador"],
  ["batch", "Batch", "Par lots", "Por lotes"],
  ["reactive", "Reactive", "Réactif", "Reactivo"],
  ["ritual", "Ritual", "Rituel", "Ritual"],
];
const STYLE_MODES = [
  ["planner", "Planner", "Planificateur", "Planificador"],
  ["improviser", "Improviser", "Improvisateur", "Improvisador"],
  ["collaborator", "Collaborator", "Collaborateur", "Colaborador"],
  ["soloist", "Soloist", "Soliste", "Solista"],
  ["optimizer", "Optimizer", "Optimiseur", "Optimizador"],
];

const ANIMALS = [
  ["otter", "Otter", "Loutre", "Nutria"], ["raven", "Raven", "Corbeau", "Cuervo"],
  ["capybara", "Capybara", "Capybara", "Capibara"], ["meerkat", "Meerkat", "Suricate", "Suricata"],
  ["red_panda", "Red Panda", "Panda roux", "Panda rojo"], ["alpaca", "Alpaca", "Alpaga", "Alpaca"],
  ["badger", "Badger", "Blaireau", "Tejón"], ["falcon", "Falcon", "Faucon", "Halcón"],
  ["gecko", "Gecko", "Gecko", "Geco"], ["hedgehog", "Hedgehog", "Hérisson", "Erizo"],
  ["orca", "Orca", "Orque", "Orca"], ["lemur", "Lemur", "Lémurien", "Lémur"],
  ["manta_ray", "Manta Ray", "Raie manta", "Mantarraya"], ["beaver", "Beaver", "Castor", "Castor"],
  ["lynx", "Lynx", "Lynx", "Lince"], ["octopus", "Octopus", "Poulpe", "Pulpo"],
  ["wombat", "Wombat", "Wombat", "Wombat"], ["heron", "Heron", "Héron", "Garza"],
  ["bison", "Bison", "Bison", "Bisonte"], ["chameleon", "Chameleon", "Caméléon", "Camaleón"],
  ["seal", "Seal", "Phoque", "Foca"], ["fox", "Fox", "Renard", "Zorro"],
  ["mole", "Mole", "Taupe", "Topo"], ["pelican", "Pelican", "Pélican", "Pelícano"],
  ["yak", "Yak", "Yak", "Yak"], ["ferret", "Ferret", "Furet", "Hurón"],
  ["ibex", "Ibex", "Bouquetin", "Íbice"], ["kingfisher", "Kingfisher", "Martin-pêcheur", "Martín pescador"],
  ["sloth", "Sloth", "Paresseux", "Perezoso"], ["mongoose", "Mongoose", "Mangouste", "Mangosta"],
  ["porcupine", "Porcupine", "Porc-épic", "Puercoespín"], ["salamander", "Salamander", "Salamandre", "Salamandra"],
  ["moose", "Moose", "Élan", "Alce"], ["puffin", "Puffin", "Macareux", "Frailecillo"],
  ["anteater", "Anteater", "Fourmilier", "Oso hormiguero"], ["crane", "Crane", "Grue", "Grulla"],
  ["armadillo", "Armadillo", "Tatou", "Armadillo"], ["dolphin", "Dolphin", "Dauphin", "Delfín"],
  ["snow_leopard", "Snow Leopard", "Panthère des neiges", "Leopardo de las nieves"], ["parrot", "Parrot", "Perroquet", "Loro"],
  ["tortoise", "Tortoise", "Tortue terrestre", "Tortuga terrestre"], ["wolf", "Wolf", "Loup", "Lobo"],
  ["koala", "Koala", "Koala", "Koala"], ["eagle", "Eagle", "Aigle", "Águila"],
  ["platypus", "Platypus", "Ornithorynque", "Ornitorrinco"],
];

function makeCombinations(prefix, leftItems, rightItems, profileKey = "idealProfile") {
  const result = [];
  for (const left of leftItems) {
    for (const right of rightItems) {
      const id = `${prefix}_${left[0]}_${right[0]}`;
      result.push({
        id,
        name: {
          en: `${left[1]} · ${right[1]}`,
          fr: `${left[2]} · ${right[2]}`,
          es: `${left[3]} · ${right[3]}`,
        },
        [profileKey]: makeProfile(id, profileKey === "lowProfile"),
        tags: ["expanded", left[0], right[0]],
      });
    }
  }
  return result;
}

function appendGenerated(current, generated, target, label) {
  const ids = new Set(current.map((entry) => entry.id));
  const additions = generated.filter((entry) => !ids.has(entry.id));
  const needed = target - current.length;
  if (needed < 0) throw new Error(`${label}: ${current.length} dépasse la cible ${target}`);
  if (needed > additions.length) throw new Error(`${label}: seulement ${additions.length} nouvelles entrées pour ${needed} nécessaires`);
  const result = [...current, ...additions.slice(0, needed)];
  if (new Set(result.map((entry) => entry.id)).size !== result.length) throw new Error(`${label}: ID dupliqué`);
  if (result.length !== target) throw new Error(`${label}: ${result.length} au lieu de ${target}`);
  return result;
}

for (const [theme, scenarios] of Object.entries(QUESTION_SCENARIOS)) {
  const current = await loadQuestions(theme);
  const generated = scenarios.map((scenario, index) => makeQuestion(theme, scenario, index));
  const result = appendGenerated(current, generated, 30, `questions/${theme}`);
  await writeJson(resolve(questionDir, `${theme}.json`), result);
}

const careers = await loadData("careers");
const generatedCareers = CAREER_NAMES.map(([en, fr, es], index) => {
  const id = `career_${slug(en)}`;
  const seed = stableHash(id);
  const min = 22_000 + (seed % 48_000);
  const max = min + 35_000 + ((seed >>> 7) % 125_000);
  return {
    id,
    name: { en, fr, es },
    idealProfile: makeProfile(id),
    worthPotential: { min, max },
    tags: [index < 36 ? "expanded_real" : "expanded_humorous"],
  };
});
await writeJson(resolve(dataDir, "careers.json"), appendGenerated(careers, generatedCareers, 100, "careers"));

const simpleGroups = [
  ["classes", 75, makeCombinations("class", CLASS_ADJECTIVES, CLASS_ROLES)],
  ["powers", 75, makeCombinations("power", POWER_DOMAINS, POWER_FORMS)],
  ["weaknesses", 75, makeCombinations("weakness", WEAKNESS_TRIGGERS, WEAKNESS_FORMS, "lowProfile")],
  ["abilities", 75, makeCombinations("ability", ABILITY_DOMAINS, ABILITY_FORMS)],
  ["workStyles", 75, makeCombinations("workstyle", STYLE_RHYTHMS, STYLE_MODES)],
];
for (const [group, target, generated] of simpleGroups) {
  const current = await loadData(group);
  await writeJson(resolve(dataDir, `${group}.json`), appendGenerated(current, generated, target, group));
}

const animals = await loadData("animals");
const generatedAnimals = ANIMALS.map(([key, en, fr, es]) => {
  const id = `animal_${key}`;
  return {
    id,
    name: { en, fr, es },
    description: {
      en: `${en}: observant, adaptable, and unexpectedly committed when it matters.`,
      fr: `${fr} : observateur, adaptable et étonnamment déterminé quand ça compte.`,
      es: `${es}: observador, adaptable y sorprendentemente decidido cuando importa.`,
    },
    idealProfile: makeProfile(id),
    tags: ["expanded", "animal"],
  };
});
await writeJson(resolve(dataDir, "animals.json"), appendGenerated(animals, generatedAnimals, 75, "animals"));

const synergies = await loadData("synergyRules");
const statPairs = [];
for (let left = 0; left < STAT_KEYS.length; left += 1) {
  for (let right = left + 1; right < STAT_KEYS.length; right += 1) {
    statPairs.push([STAT_KEYS[left], STAT_KEYS[right]]);
  }
}
const generatedSynergies = statPairs.slice(0, 55).map(([first, second], index) => ({
  id: `synergy_${first}_${second}_balance`,
  conditions: [
    { stat: first, op: index % 3 === 0 ? ">=" : ">", value: 52 + (index % 23) },
    { stat: second, op: index % 4 === 0 ? "<=" : ">=", value: index % 4 === 0 ? 58 - (index % 15) : 45 + ((index * 3) % 27) },
  ],
  weight: Number((0.8 + (index % 7) * 0.1).toFixed(2)),
  rarityScore: 1 + (index % 8),
  tags: ["expanded", "stat_pair"],
}));
await writeJson(resolve(dataDir, "synergyRules.json"), appendGenerated(synergies, generatedSynergies, 100, "synergyRules"));

const finalCounts = {
  questions: (await Promise.all(Object.keys(QUESTION_SCENARIOS).map(loadQuestions))).flat().length,
  careers: (await loadData("careers")).length,
  classes: (await loadData("classes")).length,
  powers: (await loadData("powers")).length,
  weaknesses: (await loadData("weaknesses")).length,
  abilities: (await loadData("abilities")).length,
  workStyles: (await loadData("workStyles")).length,
  animals: (await loadData("animals")).length,
  synergies: (await loadData("synergyRules")).length,
};
console.log(`Expansion canonique OK: ${Object.entries(finalCounts).map(([key, value]) => `${key}=${value}`).join(", ")}`);
