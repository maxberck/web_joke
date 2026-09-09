import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const root=resolve(import.meta.dirname,"../..");
const dir=resolve(root,"src/data/questions");
const STAT_KEYS=["intelligence","creativity","emotionalControl","empathy","social","communication","ambition","discipline","professionalism","financialSense","risk","luck","energy","humor","chaos"];
const read=async n=>JSON.parse(await readFile(resolve(dir,`${n}.json`),"utf8"));
const write=(n,v)=>writeFile(resolve(dir,`${n}.json`),`${JSON.stringify(v,null,2)}\n`);
const themes={
work:[
["scope_creep","a small task turns into a huge project","une petite tâche devient un énorme projet","una tarea pequeña se convierte en un proyecto enorme"],
["camera_on","everyone suddenly has their camera on","tout le monde a soudain sa caméra allumée","de repente todos tienen la cámara encendida"],
["double_booking","two important meetings land at the same time","deux réunions importantes tombent au même moment","dos reuniones importantes caen a la misma hora"],
["mystery_spreadsheet","you receive a giant spreadsheet with no explanation","tu reçois un énorme tableur sans explication","recibes una hoja de cálculo enorme sin explicación"],
["last_minute_demo","you must give a demo with ten minutes of warning","tu dois faire une démo avec dix minutes de préavis","debes hacer una demo con diez minutos de aviso"],
["new_tool_migration","your team changes tools again overnight","ton équipe change encore d'outil pendant la nuit","tu equipo vuelve a cambiar de herramienta durante la noche"],
["urgent_client_ping","a client writes urgent with zero context","un client écrit urgent sans aucun contexte","un cliente escribe urgente sin ningún contexto"],
["calendar_tetris","your calendar has five meetings and no gaps","ton calendrier a cinq réunions sans aucun trou","tu calendario tiene cinco reuniones sin ningún hueco"],
["review_feedback","the only feedback is make it better","le seul feedback est fais mieux","el único comentario es hazlo mejor"],
["office_temperature","the office is too hot and too cold at once","le bureau est trop chaud et trop froid à la fois","la oficina está demasiado caliente y demasiado fría a la vez"]],
social:[
["surprise_guest","a friend arrives with an unexpected extra guest","un ami arrive avec une personne en plus imprévue","un amigo llega con un invitado extra inesperado"],
["group_photo","one quick group photo becomes thirty poses","une petite photo de groupe devient trente poses","una foto rápida de grupo se convierte en treinta poses"],
["friend_late","your friend is forty minutes late and says almost there","ton ami a quarante minutes de retard et dit j'arrive","tu amigo llega cuarenta minutos tarde y dice ya casi"],
["shared_playlist","someone adds a wildly inappropriate song","quelqu'un ajoute une chanson complètement inadaptée","alguien añade una canción totalmente inapropiada"],
["elevator_small_talk","you get trapped in awkward elevator small talk","tu te retrouves coincé dans un small talk gênant d'ascenseur","te quedas atrapado en una charla incómoda de ascensor"],
["party_game","a party game suddenly puts you on stage","un jeu de soirée te met soudain sur scène","un juego de fiesta te pone de repente en escena"],
["message_seen","you left an important message on seen for two days","tu as laissé un message important en vu pendant deux jours","dejaste un mensaje importante en visto durante dos días"],
["borrowed_item","a friend returns your item in suspicious condition","un ami te rend ton objet dans un état suspect","un amigo devuelve tu objeto en un estado sospechoso"],
["trip_planning","your group plans a trip and agrees on nothing","ton groupe organise un voyage et personne n'est d'accord","tu grupo organiza un viaje y nadie se pone de acuerdo"],
["inside_joke","everyone laughs at an inside joke you missed","tout le monde rit à une private joke que tu as ratée","todos se ríen de una broma interna que no entendiste"]],
life:[
["grocery_budget","your grocery total is much higher than expected","le total de tes courses est bien plus élevé que prévu","el total de tu compra es mucho más alto de lo esperado"],
["flat_tire","you find a flat tire exactly when you must leave","tu découvres un pneu crevé au moment exact de partir","descubres una rueda pinchada justo cuando debes salir"],
["laundry_mountain","the laundry pile reaches geological proportions","la pile de linge atteint des proportions géologiques","la montaña de ropa alcanza proporciones geológicas"],
["lost_keys","your keys vanish five minutes before departure","tes clés disparaissent cinq minutes avant de partir","tus llaves desaparecen cinco minutos antes de salir"],
["weather_flip","the weather completely changes after you leave home","la météo change complètement après ton départ","el tiempo cambia por completo después de salir de casa"],
["room_rearrange","at 9 PM you decide the whole room needs a new layout","à 21 h tu décides de réorganiser toute la pièce","a las 21:00 decides reorganizar toda la habitación"],
["new_recipe","your new recipe looks nothing like the picture halfway through","ta nouvelle recette ne ressemble plus du tout à la photo","tu nueva receta no se parece en nada a la foto"],
["sleep_schedule","your sleep schedule quietly shifts by three hours","ton rythme de sommeil se décale discrètement de trois heures","tu horario de sueño se desplaza silenciosamente tres horas"],
["package_delay","the package you want is delayed again","le colis que tu attends est encore retardé","el paquete que esperas vuelve a retrasarse"],
["weekly_planning","Sunday evening arrives and next week is unplanned","dimanche soir arrive et ta semaine n'est pas planifiée","llega el domingo por la noche y tu semana no está planificada"]],
personality:[
["public_mistake","you make a small mistake in front of many people","tu fais une petite erreur devant beaucoup de monde","cometes un pequeño error delante de mucha gente"],
["rule_exception","a rule makes no sense in this specific situation","une règle n'a aucun sens dans cette situation précise","una regla no tiene sentido en esta situación concreta"],
["unpopular_opinion","everyone agrees on something you strongly reject","tout le monde approuve quelque chose que tu rejettes fortement","todos apoyan algo con lo que estás muy en desacuerdo"],
["sudden_competition","a casual activity suddenly becomes competitive","une activité tranquille devient soudain compétitive","una actividad casual se vuelve competitiva de repente"],
["secret_task","you are trusted with a task nobody else should know","on te confie une tâche que personne d'autre ne doit connaître","te confían una tarea que nadie más debe conocer"],
["empty_room","you enter a room where you know nobody","tu entres dans une pièce où tu ne connais personne","entras en una sala donde no conoces a nadie"],
["ambiguous_praise","a compliment might secretly be an insult","un compliment pourrait secrètement être une insulte","un cumplido podría ser secretamente un insulto"],
["moral_shortcut","you can win faster by bending a harmless rule","tu peux gagner plus vite en tordant une règle inoffensive","puedes ganar más rápido saltándote una regla inofensiva"],
["new_identity","you meet people who know absolutely nothing about you","tu rencontres des gens qui ne savent absolument rien de toi","conoces gente que no sabe absolutamente nada de ti"],
["tiny_victory","you win something completely trivial","tu gagnes quelque chose de complètement insignifiant","ganas algo completamente trivial"]],
general:[
["power_outage","the power suddenly goes out for an unknown time","le courant se coupe soudain pour une durée inconnue","la electricidad se corta de repente por un tiempo desconocido"],
["mystery_box","a sealed mystery box appears with your name on it","une boîte mystérieuse fermée apparaît avec ton nom","aparece una caja misteriosa cerrada con tu nombre"],
["free_ticket","you receive a free ticket to an unknown event","tu reçois une place gratuite pour un événement inconnu","recibes una entrada gratis para un evento desconocido"],
["wrong_turn","a wrong turn takes you somewhere new","un mauvais virage t'emmène dans un endroit inconnu","un giro equivocado te lleva a un lugar nuevo"],
["unplanned_challenge","someone challenges you to do something new","quelqu'un te met au défi de faire quelque chose de nouveau","alguien te reta a hacer algo nuevo"],
["random_skill","you can instantly learn one oddly specific skill","tu peux apprendre instantanément une compétence très spécifique","puedes aprender al instante una habilidad muy específica"],
["one_hour_free","one completely free hour appears in your day","une heure totalement libre apparaît dans ta journée","aparece una hora totalmente libre en tu día"],
["strange_notification","your phone shows a notification from an unknown app","ton téléphone affiche une notification d'une appli inconnue","tu móvil muestra una notificación de una app desconocida"],
["lucky_break","something goes unexpectedly right for once","pour une fois quelque chose se passe étonnamment bien","por una vez algo sale inesperadamente bien"],
["plan_collapses","a plan prepared all week collapses in five seconds","un plan préparé toute la semaine s'effondre en cinq secondes","un plan preparado toda la semana se derrumba en cinco segundos"]]};
const answers=[
["plan",{en:"Make a plan and start with the most important step.",fr:"Faire un plan et commencer par l'étape la plus importante.",es:"Hacer un plan y empezar por el paso más importante."},{discipline:7,professionalism:4,emotionalControl:3,chaos:-3}],
["ask",{en:"Ask someone competent before making it worse.",fr:"Demander à quelqu'un de compétent avant d'aggraver la situation.",es:"Preguntar a alguien competente antes de empeorarlo."},{communication:6,empathy:3,intelligence:3}],
["improvise",{en:"Improvise confidently and adapt as you go.",fr:"Improviser avec confiance et s'adapter en avançant.",es:"Improvisar con confianza y adaptarse sobre la marcha."},{creativity:7,risk:5,energy:4,discipline:-3}],
["joke",{en:"Make a joke first, then solve the real problem.",fr:"Faire d'abord une blague puis régler le vrai problème.",es:"Hacer primero una broma y luego resolver el problema real."},{humor:8,social:4,chaos:3,professionalism:-2}],
["research",{en:"Research everything until it makes sense.",fr:"Faire des recherches jusqu'à ce que tout devienne clair.",es:"Investigar hasta que todo tenga sentido."},{intelligence:8,discipline:3,energy:-2}],
["wait",{en:"Wait a few minutes and see if reality fixes itself.",fr:"Attendre quelques minutes pour voir si la réalité se répare seule.",es:"Esperar unos minutos para ver si la realidad se arregla sola."},{emotionalControl:4,discipline:-5,chaos:3}],
["automate",{en:"Automate the repetitive part.",fr:"Automatiser la partie répétitive.",es:"Automatizar la parte repetitiva."},{intelligence:6,creativity:5,discipline:4,professionalism:2}],
["shortcut",{en:"Take the fastest risky shortcut.",fr:"Prendre le raccourci risqué le plus rapide.",es:"Tomar el atajo arriesgado más rápido."},{risk:9,energy:5,chaos:5,discipline:-5}],
["help",{en:"Help the person most affected first.",fr:"Aider d'abord la personne la plus touchée.",es:"Ayudar primero a la persona más afectada."},{empathy:8,social:5,communication:3,ambition:-2}],
["backup",{en:"Prepare a backup plan for the backup plan.",fr:"Préparer un plan B pour le plan B.",es:"Preparar un plan B para el plan B."},{discipline:7,intelligence:4,risk:-5,emotionalControl:4}]];
for(const [theme,events] of Object.entries(themes)){
 const current=await read(theme); const ids=new Set(current.map(q=>q.id));
 for(let i=0;i<events.length&&current.length<30;i++){
  const [key,en,fr,es]=events[i], id=`q_${theme}_${key}`; if(ids.has(id)) continue;
  current.push({id,category:theme,selectionWeight:1,text:{en:`Situation: ${en}. What do you do?`,fr:`Situation : ${fr}. Tu fais quoi ?`,es:`Situación: ${es}. ¿Qué haces?`},answers:answers.map(([k,text,e],j)=>{const stat=STAT_KEYS[(i*4+j*3+theme.length)%STAT_KEYS.length];return{id:`${id}_${k}`,text,effects:{...e,[stat]:(e[stat]??0)+(j%2===0?2:-2)},selectionWeight:1};})}); ids.add(id);
 }
 if(current.length!==30) throw new Error(`${theme}: ${current.length} au lieu de 30`); await write(theme,current);
}
console.log("Questions V2 OK: 150 questions / 1500 réponses");
