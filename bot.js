const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, AuditLogEvent } = require('discord.js');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// ============================================================
//  CONFIGURATION
// ============================================================

const CONFIG = {
  ADMIN_IDS: [
    '980099925071241227',
    '557275102358667277',
    '1475499606304358463',
    '1469795368580677717',
    '1465721989762256920',
    '535857300552810526',
  ],

  TIKTOK_USERNAME: 'crousgainz',
  LIVE_CHANNEL_ID: '1473454771305185361',
  LIVE_CHECK_INTERVAL: 2 * 60 * 1000,
  PREFIX: '!',

  MOMMY_ASMR_USER_IDS: ['1469795368580677717', '535857300552810526', '1475499606304358463'],
  MOMMY_ASMR_FILE_URL: 'https://image2url.com/r2/default/audio/1775167126789-12d55369-adb5-4c88-8e88-58eb4a3d6d07.mp3',

  REACTION_ROLE: {
    MESSAGE_ID: '1488290011425149022',
    CHANNEL_ID: '1488289976540991770',
    ROLE_ID:    '1487674672865611806',  // ancien rÃ´le (sera remplacÃ© par VERIF_PENDING si vÃ©rif activÃ©e)
    EMOJI:      '\u2705',
  },

  JAIL_ACCESS_ROLE_ID:    '1487674672865611806',
  JAIL_PRISON_CHANNEL_ID: '1504536794572521573',
  JAIL_DURATION_MS:       5 * 60 * 1000,
  JAIL_PROTECTED_ROLE_IDS: [],

  // â”€â”€ RATING SYSTÃˆME â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  RATING_ROLE_ID: '1490645216192102421',

  // â”€â”€ JSONBIN CONFIG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  JSONBIN_MASTER_KEY: process.env.JSONBIN_MASTER_KEY || '$2a$10$AwINYOxVh1uCEQVco3Da1uJf/hMkwcibwHt7r5CVoUsEbC36wGr8u',
  JSONBIN_BIN_ID:     process.env.JSONBIN_BIN_ID     || '',

  // â”€â”€ VÃ‰RIFICATION MANUELLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Configure via !verif-setup ou directement ici :
  // VERIF_PENDING_ROLE_ID : rÃ´le donnÃ© aprÃ¨s rÃ©action (accÃ¨s channel vÃ©rif uniquement)
  // VERIF_APPROVED_ROLE_ID : rÃ´le final aprÃ¨s approbation admin (accÃ¨s complet serveur)
  // VERIF_CHANNEL_ID : channel oÃ¹ le membre attend sa vÃ©rification
  // VERIF_LOG_CHANNEL_ID : channel privÃ© admin oÃ¹ arrivent les demandes de vÃ©rif
  VERIF_PENDING_ROLE_ID:  process.env.VERIF_PENDING_ROLE_ID  || '',
  VERIF_APPROVED_ROLE_ID: process.env.VERIF_APPROVED_ROLE_ID || '',
  VERIF_CHANNEL_ID:       process.env.VERIF_CHANNEL_ID       || '',
  VERIF_LOG_CHANNEL_ID:   process.env.VERIF_LOG_CHANNEL_ID   || '',

  // ── SNOOP LOG (messages supprimés) ───────────────────────────────────────
  SNOOP_SOURCE_GUILD_ID: '1469787479325278373',   // serveur surveillé
  SNOOP_LOG_CHANNEL_ID:  '1181558038147125319',   // salon de destination des logs
};

// ============================================================
//  CHEMINS DES FICHIERS DE DONNÃ‰ES LOCAUX
// ============================================================

const DATA_DIR = path.join(__dirname, 'data');
const FILES = {
  study:         path.join(DATA_DIR, 'study.json'),
  copes:         path.join(DATA_DIR, 'copes.json'),
  rules:         path.join(DATA_DIR, 'rules.json'),
  liveStatus:    path.join(DATA_DIR, 'live_status.json'),
  reactionRoles: path.join(DATA_DIR, 'reaction_roles.json'),
  ticketConfig:  path.join(DATA_DIR, 'ticket_config.json'),
  tickets:       path.join(DATA_DIR, 'tickets.json'),
  warns:         path.join(DATA_DIR, 'warns.json'),
  jails:         path.join(DATA_DIR, 'jails.json'),
  sanctionLog:   path.join(DATA_DIR, 'sanction_log.json'),
  npcList:       path.join(DATA_DIR, 'npc_list.json'),
  tfList:        path.join(DATA_DIR, 'tf_list.json'),
  tournaments:   path.join(DATA_DIR, 'tournaments.json'),
  jsonbinId:     path.join(DATA_DIR, 'jsonbin_id.json'),
  verifConfig:   path.join(DATA_DIR, 'verif_config.json'),    // config vÃ©rification
  blacklist:     path.join(DATA_DIR, 'blacklist.json'),        // liste noire
  pendingVerifs: path.join(DATA_DIR, 'pending_verifs.json'),   // demandes en attente
  badwords:      path.join(DATA_DIR, 'badwords.json'),         // mots interdits
  welcomeConf:   path.join(DATA_DIR, 'welcome_config.json'),   // message de bienvenue
  zyzzHonors:    path.join(DATA_DIR, 'zyzz_honors.json'),      // titres Zyzz
};

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ============================================================
//  HELPERS JSON LOCAUX
// ============================================================

function loadJSON(file, defaultVal) {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) { console.error(`Erreur lecture ${file}:`, e.message); }
  return defaultVal;
}

function saveJSON(file, data) {
  try { fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8'); }
  catch (e) { console.error(`Erreur ecriture ${file}:`, e.message); }
}

// ============================================================
//  JSONBIN â€” BASE DE DONNÃ‰ES EN LIGNE
// ============================================================

let _binId = CONFIG.JSONBIN_BIN_ID || loadJSON(FILES.jsonbinId, {}).id || '';

const JSONBIN_HEADERS = () => ({
  'Content-Type':  'application/json',
  'X-Master-Key':  CONFIG.JSONBIN_MASTER_KEY,
  'X-Bin-Versioning': 'false',
});

const DEFAULT_GYMGIRLS = { girls: [], activeVotes: {} };

async function jsonbinGet() {
  if (!_binId) return { ...DEFAULT_GYMGIRLS };
  try {
    const res = await axios.get(`https://api.jsonbin.io/v3/b/${_binId}/latest`, {
      headers: JSONBIN_HEADERS(),
      timeout: 10000,
    });
    return res.data.record || { ...DEFAULT_GYMGIRLS };
  } catch (err) {
    console.error('[JSONBIN] Erreur GET :', err.message);
    return { ...DEFAULT_GYMGIRLS };
  }
}

async function jsonbinSet(data) {
  if (!CONFIG.JSONBIN_MASTER_KEY) {
    console.warn('[JSONBIN] Pas de Master Key configurÃ©e â€” donnÃ©es non sauvegardÃ©es en ligne.');
    return;
  }
  if (!_binId) {
    try {
      const res = await axios.post('https://api.jsonbin.io/v3/b', data, {
        headers: { ...JSONBIN_HEADERS(), 'X-Bin-Name': 'gymgirls-rating', 'X-Bin-Private': 'true' },
        timeout: 10000,
      });
      _binId = res.data.metadata.id;
      saveJSON(FILES.jsonbinId, { id: _binId });
      console.log(`[JSONBIN] Bin crÃ©Ã© automatiquement : ${_binId}`);
    } catch (err) {
      console.error('[JSONBIN] Erreur crÃ©ation bin :', err.message);
    }
    return;
  }
  try {
    await axios.put(`https://api.jsonbin.io/v3/b/${_binId}`, data, {
      headers: JSONBIN_HEADERS(),
      timeout: 10000,
    });
  } catch (err) {
    console.error('[JSONBIN] Erreur PUT :', err.message);
  }
}

let _gymgirlsCache = null;
let _cacheTs       = 0;
const CACHE_TTL    = 30 * 1000;

async function getGymgirls() {
  if (_gymgirlsCache && Date.now() - _cacheTs < CACHE_TTL) return _gymgirlsCache;
  _gymgirlsCache = await jsonbinGet();
  _cacheTs       = Date.now();
  return _gymgirlsCache;
}

async function saveGymgirls(data) {
  _gymgirlsCache = data;
  _cacheTs       = Date.now();
  await jsonbinSet(data);
}

// ============================================================
//  DONNÃ‰ES LOCALES
// ============================================================

let studyData = loadJSON(FILES.study, {
  title: 'Aucune etude definie',
  url: '',
  description: 'Utilisez !def-etude pour definir une etude.',
  setBy: '',
  setAt: '',
});

let copesData = loadJSON(FILES.copes, {
  cope: ['Exemple Cope -- Inutile'],
  interesting: ['Exemple Interessant -- Peut etre utile'],
});

let rulesData = loadJSON(FILES.rules, {
  1: "Pas de demande de source : Il est interdit de demander, vendre ou partager des sources de steroides, peptides ou autres substances dopantes.",
  2: "Aucune discrimination : Les propos racistes, homophobes, sexistes ou discriminatoires sont strictement interdits sauf sur les iqlet.",
  3: "Respect obligatoire : Tout le monde doit etre respecte. Les insultes, provocations, harcelement ou comportements toxiques ne sont pas toleres sauf si la personne est sous systeme fluide.",
  4: "Pas de spam : Le spam, flood, messages repetes, ou abus de majuscules sont interdits.",
  5: "Publicite interdite : Pas de promotion de chaines, serveurs, produits ou services sans l'autorisation du staff.",
  6: "Contenu inapproprie : Les contenus NSFW, choquants ou illegaux sont interdits.",
  7: "Restez dans les bons salons : Merci d'utiliser les salons appropries pour chaque sujet.",
  8: "Respect du staff : Les decisions du staff doivent etre respectees.",
});

let liveStatus        = loadJSON(FILES.liveStatus,    { isLive: false, lastNotified: null });
let reactionRolesData = loadJSON(FILES.reactionRoles, {});
let ticketsData       = loadJSON(FILES.tickets,        {});
let warnsData         = loadJSON(FILES.warns,          {});
let jailsData         = loadJSON(FILES.jails,          {});
let sanctionLogData   = loadJSON(FILES.sanctionLog,    { channelId: null });
let npcList           = loadJSON(FILES.npcList,        {});
let tfList            = loadJSON(FILES.tfList,         {});
let tournamentsData   = loadJSON(FILES.tournaments,    {});

// â”€â”€ VÃ‰RIFICATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let verifConfig   = loadJSON(FILES.verifConfig, {
  pendingRoleId:  CONFIG.VERIF_PENDING_ROLE_ID  || '',
  approvedRoleId: CONFIG.VERIF_APPROVED_ROLE_ID || '',
  verifChannelId: CONFIG.VERIF_CHANNEL_ID       || '',
  logChannelId:   CONFIG.VERIF_LOG_CHANNEL_ID   || '',
  enabled:        false,
});
let blacklistData   = loadJSON(FILES.blacklist,     {});   // { userId: { reason, by, at } }
let pendingVerifs   = loadJSON(FILES.pendingVerifs, {});   // { userId: { logMessageId, ... } }
let badwordsData    = loadJSON(FILES.badwords,      { words: [] });
let welcomeConfig   = loadJSON(FILES.welcomeConf,   { channelId: null, message: null });
let zyzzHonors      = loadJSON(FILES.zyzzHonors,    {});   // { userId: { by, at } }

function saveVerifConfig()   { saveJSON(FILES.verifConfig,   verifConfig);   }
function saveBlacklist()     { saveJSON(FILES.blacklist,     blacklistData); }
function savePendingVerifs() { saveJSON(FILES.pendingVerifs, pendingVerifs); }
function saveBadwords()      { saveJSON(FILES.badwords,      badwordsData);  }
function saveWelcomeConf()   { saveJSON(FILES.welcomeConf,   welcomeConfig); }
function saveZyzzHonors()    { saveJSON(FILES.zyzzHonors,    zyzzHonors);    }

let ticketConfig = loadJSON(FILES.ticketConfig, {
  viewRoleId:  null,
  staffRoleId: null,
});

function saveReactionRoles() { saveJSON(FILES.reactionRoles, reactionRolesData); }
function saveTicketConfig()   { saveJSON(FILES.ticketConfig,  ticketConfig); }
function saveTickets()        { saveJSON(FILES.tickets,       ticketsData); }
function saveWarns()          { saveJSON(FILES.warns,         warnsData); }
function saveJails()          { saveJSON(FILES.jails,         jailsData); }
function saveSanctionLog()    { saveJSON(FILES.sanctionLog,   sanctionLogData); }
function saveNpcList()        { saveJSON(FILES.npcList,       npcList); }
function saveTfList()         { saveJSON(FILES.tfList,        tfList); }
function saveTournaments()    { saveJSON(FILES.tournaments,   tournamentsData); }

// â”€â”€ LIKE AUTO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ID du membre dont TOUS les messages sont likÃ©s automatiquement
const LIKE_TARGET_USER_ID = '980099925071241227';
let likeEnabled = false;   // activÃ©/dÃ©sactivÃ© via !like-enable / !like-disable

// â”€â”€ SONDAGES EN COURS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// { messageId: { question, options: [{label, votes}], voters: Set } }
const activeSondages = {};

// ============================================================
//  CLIENT DISCORD
// ============================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

function isAdmin(userId)   { return CONFIG.ADMIN_IDS.includes(userId); }
function hasRatingRole(member) {
  return member.roles.cache.has(CONFIG.RATING_ROLE_ID) || isAdmin(member.id);
}
function embed(color = '#5865F2') { return new EmbedBuilder().setColor(color).setTimestamp(); }

// ============================================================
//  SANCTION LOG HELPER
// ============================================================

async function logSanction(guild, fields, title, color = '#FF4444') {
  if (!sanctionLogData.channelId) return;
  try {
    const logChannel = await guild.channels.fetch(sanctionLogData.channelId).catch(() => null);
    if (!logChannel) return;
    const e = embed(color).setTitle(`\uD83D\uDD10 ${title}`).addFields(fields).setFooter({ text: 'Sanction Log' });
    await logChannel.send({ embeds: [e] });
  } catch (err) {
    console.error('[SANCTION LOG] Erreur envoi log :', err.message);
  }
}

// ============================================================
//  VÃ‰RIFICATION â€” HELPER PRINCIPAL
// ============================================================

/**
 * Calcule l'Ã¢ge d'un compte en jours
 */
function accountAgeDays(userId) {
  const createdAt = Number(BigInt(userId) >> 22n) + 1420070400000;
  return Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24));
}

/**
 * Formate une durÃ©e en "X ans Y mois Z jours" pour l'affichage
 */
function formatAge(days) {
  if (days < 1)   return '< 1 jour ðŸš¨';
  if (days < 7)   return `${days} jours ðŸš¨`;
  if (days < 30)  return `${days} jours âš ï¸`;
  if (days < 365) return `${Math.floor(days / 30)} mois ${days % 30} jours`;
  const years  = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  return `${years} an${years > 1 ? 's' : ''} ${months > 0 ? months + ' mois' : ''}`;
}

/**
 * Envoie le message de vÃ©rification dans le channel log admin
 */
async function sendVerifRequest(guild, member) {
  if (!verifConfig.enabled || !verifConfig.logChannelId) return;

  const logChannel = guild.channels.cache.get(verifConfig.logChannelId);
  if (!logChannel) {
    console.error('[VERIF] Channel log introuvable :', verifConfig.logChannelId);
    return;
  }

  const ageDays    = accountAgeDays(member.id);
  const ageStr     = formatAge(ageDays);
  const isSuspect  = ageDays < 7;
  const joinedAt   = member.joinedAt
    ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:F>`
    : 'Inconnue';
  const createdAt  = new Date(Number(BigInt(member.id) >> 22n) + 1420070400000);
  const createdStr = `<t:${Math.floor(createdAt.getTime() / 1000)}:F>`;
  const avatarUrl  = member.user.displayAvatarURL({ size: 256 });
  const hasAvatar  = !!member.user.avatar;

  // Fetch infos supplÃ©mentaires (MFA/A2F visible uniquement sur guild owner)
  // Pour les membres normaux, on peut voir si la guild requiert MFA
  const mfaRequired = guild.mfaLevel === 1;

  // Couleur selon suspicion
  const embedColor = isSuspect ? '#FF0000' : ageDays < 30 ? '#FFA500' : '#00C851';

  const flags = [];
  if (isSuspect) flags.push('ðŸš¨ **COMPTE RÃ‰CENT** (< 7 jours)');
  if (!hasAvatar) flags.push('âš ï¸ Pas d\'avatar (compte par dÃ©faut)');
  if (mfaRequired) flags.push('â„¹ï¸ Le serveur requiert la A2F');

  const flagsStr = flags.length > 0 ? flags.join('\n') : 'âœ… Aucun signal suspect';

  const verifEmbed = new EmbedBuilder()
    .setColor(embedColor)
    .setTitle(`${isSuspect ? 'ðŸš¨' : 'ðŸ”'} Demande de vÃ©rification`)
    .setThumbnail(avatarUrl)
    .addFields(
      {
        name: 'ðŸ‘¤ IdentitÃ©',
        value: [
          `**Pseudo** : ${member.user.tag}`,
          `**Surnom** : ${member.nickname || '*aucun*'}`,
          `**ID** : \`${member.id}\``,
          `**Mention** : <@${member.id}>`,
        ].join('\n'),
        inline: false,
      },
      {
        name: 'ðŸ“… Dates',
        value: [
          `**Compte crÃ©Ã© le** : ${createdStr}`,
          `**Ã‚ge du compte** : ${ageStr}`,
          `**A rejoint le** : ${joinedAt}`,
        ].join('\n'),
        inline: false,
      },
      {
        name: 'ðŸ›¡ï¸ Signaux de sÃ©curitÃ©',
        value: flagsStr,
        inline: false,
      },
      {
        name: 'ðŸŽ­ Avatar',
        value: hasAvatar ? `[Voir l'avatar](${avatarUrl})` : 'âŒ Avatar par dÃ©faut Discord',
        inline: true,
      },
      {
        name: 'ðŸ¤– Bot ?',
        value: member.user.bot ? 'âœ… Oui (BOT)' : 'âŒ Non',
        inline: true,
      },
    )
    .setFooter({ text: `Demande reÃ§ue Â· ID ${member.id}` })
    .setTimestamp();

  // Boutons admin
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`verif_approve_${member.id}`)
      .setLabel('âœ…  Approuver')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`verif_refuse_${member.id}`)
      .setLabel('âŒ  Refuser (kick)')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`verif_blacklist_${member.id}`)
      .setLabel('ðŸš«  Blacklist + Kick')
      .setStyle(ButtonStyle.Danger),
  );

  try {
    const logMsg = await logChannel.send({
      content: `${isSuspect ? '@here ' : ''}\`[VERIF]\` Nouveau membre en attente de vÃ©rification`,
      embeds: [verifEmbed],
      components: [row],
    });

    // Sauvegarder la demande en attente
    pendingVerifs[member.id] = {
      logMessageId: logMsg.id,
      logChannelId: verifConfig.logChannelId,
      userId:       member.id,
      tag:          member.user.tag,
      requestedAt:  new Date().toISOString(),
    };
    savePendingVerifs();

    console.log(`[VERIF] Demande envoyÃ©e pour ${member.user.tag} (${member.id})`);
  } catch (err) {
    console.error('[VERIF] Erreur envoi demande :', err.message);
  }
}

/**
 * DÃ©sactive les boutons d'un message de vÃ©rification
 */
async function disableVerifButtons(guild, userId, status) {
  const pending = pendingVerifs[userId];
  if (!pending) return;

  try {
    const ch  = guild.channels.cache.get(pending.logChannelId);
    if (!ch) return;
    const msg = await ch.messages.fetch(pending.logMessageId).catch(() => null);
    if (!msg) return;

    const statusColors  = { approved: ButtonStyle.Success, refused: ButtonStyle.Secondary, blacklisted: ButtonStyle.Secondary };
    const statusLabels  = { approved: 'âœ… ApprouvÃ©', refused: 'âŒ RefusÃ©', blacklisted: 'ðŸš« BlacklistÃ©' };

    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`verif_done_${userId}`)
        .setLabel(statusLabels[status] || 'TraitÃ©')
        .setStyle(statusColors[status] || ButtonStyle.Secondary)
        .setDisabled(true),
    );
    await msg.edit({ components: [disabledRow] }).catch(() => {});
  } catch (err) {
    console.error('[VERIF] Erreur dÃ©sactivation boutons :', err.message);
  }
}

// ============================================================
//  HELPER â€” Met Ã  jour l'embed du message RR
// ============================================================

async function updateRREmbed(targetMessage, rrEntry) {
  if (rrEntry.existingMessage) return;
  const rolesList = Object.entries(rrEntry.roles)
    .map(([emoji, roleId]) => `${emoji} -- <@&${roleId}>`)
    .join('\n') || '*Aucun role configure.*';
  const updatedEmbed = embed('#7289DA')
    .setTitle(`\uD83C\uDFAD ${rrEntry.titre}`)
    .setDescription(rrEntry.description)
    .addFields({ name: '\uD83D\uDCCB Roles disponibles', value: rolesList, inline: false })
    .setFooter({ text: 'Reagis pour obtenir un role - Retire ta reaction pour le perdre' });
  await targetMessage.edit({ embeds: [updatedEmbed] });
}

// ============================================================
//  JAIL HELPERS
// ============================================================

async function jailMember(member, reason) {
  const guild = member.guild;
  const rolesToRemove = member.roles.cache.filter(role =>
    role.id !== guild.id &&
    !CONFIG.JAIL_PROTECTED_ROLE_IDS.includes(role.id) &&
    role.managed === false
  );
  const removedRoleIds = rolesToRemove.map(r => r.id);
  if (removedRoleIds.length > 0) await member.roles.remove(rolesToRemove, reason);

  const channelPromises = guild.channels.cache
    .filter(ch =>
      ch.id !== CONFIG.JAIL_PRISON_CHANNEL_ID &&
      (ch.isTextBased() || ch.isVoiceBased()) &&
      ch.permissionOverwrites != null
    )
    .map(ch => ch.permissionOverwrites.edit(member.id, {
      ViewChannel: false, SendMessages: false, Connect: false,
    }, { reason }).catch(err => console.warn(`[JAIL] Impossible de modifier #${ch.name} : ${err.message}`)));
  await Promise.all(channelPromises);

  const prisonChannel = guild.channels.cache.get(CONFIG.JAIL_PRISON_CHANNEL_ID);
  if (prisonChannel) {
    await prisonChannel.permissionOverwrites.edit(member.id, {
      ViewChannel: true, SendMessages: true, ReadMessageHistory: true,
    }, { reason }).catch(err => console.warn(`[JAIL] Impossible de modifier le salon prison : ${err.message}`));
  }

  console.log(`[JAIL] ${member.user.tag} verrouille -- ${removedRoleIds.length} roles retires.`);
  return removedRoleIds;
}

async function unjailMember(member, savedRoleIds, reason) {
  const guild = member.guild;
  const channelPromises = [...guild.channels.cache.values()]
    .filter(ch => (ch.isTextBased() || ch.isVoiceBased()) && ch.permissionOverwrites != null)
    .map(ch => ch.permissionOverwrites.delete(member.id, reason).catch(() => {}));
  await Promise.all(channelPromises);

  const rolesToAdd = savedRoleIds
    .map(id => guild.roles.cache.get(id))
    .filter(Boolean)
    .filter(role => !member.roles.cache.has(role.id));
  if (rolesToAdd.length > 0) await member.roles.add(rolesToAdd, reason);

  console.log(`[JAIL] ${member.user.tag} libere -- ${rolesToAdd.length} role(s) restaure(s).`);
}

// ============================================================
//  TOURNOI â€” HELPERS
// ============================================================

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRound(participants) {
  const shuffled = shuffle(participants);
  const pairs = [];
  for (let i = 0; i + 1 < shuffled.length; i += 2) pairs.push([shuffled[i], shuffled[i + 1]]);
  if (shuffled.length % 2 !== 0) pairs.push([shuffled[shuffled.length - 1], null]);
  return pairs;
}

async function sendVersus(channel, tournamentId, matchIndex, p1, p2) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`tournament_${tournamentId}_${matchIndex}_A`).setLabel('\uD83C\uDFC6 Joueur A').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`tournament_${tournamentId}_${matchIndex}_B`).setLabel('\uD83C\uDFC6 Joueur B').setStyle(ButtonStyle.Danger),
  );

  const versusEmbed = embed('#FFD700')
    .setTitle('\u2694\uFE0F VS -- Match ' + (matchIndex + 1))
    .setDescription('Qui a le meilleur physique ?')
    .addFields(
      { name: '\uD83C\uDD70\uFE0F ' + p1.username, value: `Soumis par <@${p1.userId}>`, inline: true },
      { name: '\u26A1 VS', value: '\u200b', inline: true },
      { name: '\uD83C\uDD71\uFE0F ' + p2.username, value: `Soumis par <@${p2.userId}>`, inline: true },
    )
    .setFooter({ text: `Tournoi #${tournamentId} -- Crous choisit le gagnant` });

  await channel.send({ content: `**Match ${matchIndex + 1}** -- \uD83C\uDD70\uFE0F **${p1.username}** vs \uD83C\uDD71\uFE0F **${p2.username}**` });
  await channel.send({ content: `\uD83C\uDD70\uFE0F **${p1.username}**`, files: [p1.imageUrl] }).catch(async () =>
    channel.send({ content: `\uD83C\uDD70\uFE0F **${p1.username}** -- (image : ${p1.imageUrl})` })
  );
  await channel.send({ content: `\uD83C\uDD71\uFE0F **${p2.username}**`, files: [p2.imageUrl] }).catch(async () =>
    channel.send({ content: `\uD83C\uDD71\uFE0F **${p2.username}** -- (image : ${p2.imageUrl})` })
  );

  const voteMsg = await channel.send({ embeds: [versusEmbed], components: [row] });
  return voteMsg.id;
}

// ============================================================
//  COMMANDES
// ============================================================

const commands = {

  // â”€â”€ AIDE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!aide': async (message) => {
    const viewRoleDisplay  = ticketConfig.viewRoleId  ? `<@&${ticketConfig.viewRoleId}>`  : '`non dÃ©fini`';
    const staffRoleDisplay = ticketConfig.staffRoleId ? `<@&${ticketConfig.staffRoleId}>` : '`non dÃ©fini`';
    const logChDisplay     = sanctionLogData.channelId ? `<#${sanctionLogData.channelId}>` : '`non dÃ©fini`';
    const guildIcon        = message.guild.iconURL({ size: 64 }) ?? undefined;

    // â”€â”€ PAGE 1 : GÃ©nÃ©ral & Fun â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const p1 = new EmbedBuilder()
      .setColor('#FF6B9D')
      .setAuthor({ name: 'âš¡ CrousBot â€” Centre de commandes', iconURL: guildIcon })
      .setTitle('ðŸ“– Commandes gÃ©nÃ©rales & Fun')
      .setDescription(
        '> PrÃ©fixe : **`!`**  Â·  ðŸ”’ = admin uniquement  Â·  ðŸŽ­ = rÃ´le requis\n' +
        '> â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€'
      )
      .addFields(
        { name: 'ðŸ”¬ Ã‰tudes & SupplÃ©ments', value: [
            '`!pubmed` Â· Affiche la derniÃ¨re Ã©tude enregistrÃ©e',
            '`!def-etude <titre> | <url> | <desc>` ðŸ”’ Â· DÃ©finit une Ã©tude',
            '`!cope` Â· Liste complÃ¨te des complÃ©ments classifiÃ©s',
            '`!cope-du-jour` Â· Cope alÃ©atoire + rÃ©futation scientifique',
            '`!add-cope <nom>` / `!remove-cope <nom>` ðŸ”’',
            '`!add-interesting <nom>` / `!remove-interesting <nom>` ðŸ”’',
            '`!set-cope-bulk <cope|interesting> | item1, item2` ðŸ”’',
          ].join('\n'), inline: false },
        { name: 'ðŸ“œ RÃ¨gles', value: [
            '`!regles` Â· Affiche toutes les rÃ¨gles',
            '`!regle<N>` Â· Affiche la rÃ¨gle N (ex: `!regle2`)',
            '`!set-regle <N> | <texte>` ðŸ”’ Â· Modifie une rÃ¨gle',
          ].join('\n'), inline: false },
        { name: 'ðŸŽ­ Fun & Troll', value: [
            '`!iqtest [@user]` Â· Test de QI certifiÃ© fluide',
            '`!fluide @user` ðŸ”’ Â· Place sous systÃ¨me fluide 24h',
            '`!tf @user` ðŸ”’ Â· Renomme trollement 10 min',
            '`!npc @user` ðŸ”’ Â· DÃ©clare NPC pour 10 min',
            '`!resetpseudo @user` ðŸ”’ Â· RÃ©initialise le surnom',
            '`!zyzz @user` ðŸ”’ Â· Accorde / retire le titre "Fils de Zyzz"',
            '`!sondage <question> | <opt1> | <opt2> | [opt3] | [opt4]` Â· Vote public',
          ].join('\n'), inline: false },
        { name: 'ðŸ“¡ TikTok Live', value:
            '`!live` Â· VÃ©rifie manuellement si @crousgainz est en live',
          inline: false },
        { name: 'ðŸ”§ Utilitaires', value: [
            '`!stats [@user]` Â· Fiche complÃ¨te d\'un membre',
            '`!clear <N>` ðŸ”’ Â· Supprime N messages (max 100)',
            '`!say <#channel> | <titre> | <desc> | [couleur] | [image] | [footer]` ðŸ”’',
          ].join('\n'), inline: false },
      )
      .setFooter({ text: '!aide2 â†’ Rating ELO Â· !aide3 â†’ Tournoi Â· !aide4 â†’ ModÃ©ration Â· !aide5 â†’ Tickets, RR & VÃ©rif' })
      .setTimestamp();

    // â”€â”€ PAGE 2 : Rating Gymgirl â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const p2 = new EmbedBuilder()
      .setColor('#FFD700')
      .setAuthor({ name: 'âš¡ CrousBot â€” Centre de commandes', iconURL: guildIcon })
      .setTitle('ðŸ† Rating Gymgirl â€” SystÃ¨me ELO')
      .setDescription(
        '> PrÃ©fixe : **`!`**  Â·  ðŸ”’ = admin  Â·  ðŸŽ­ = rÃ´le Rating requis\n' +
        '> â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€'
      )
      .addFields(
        { name: 'ðŸŽ­ Commandes publiques (rÃ´le Rating)', value: [
            '`!rate` Â· Lance un duel ELO entre 2 gymgirls',
            '`!rate-top` Â· Classement ELO â€” Top 10',
          ].join('\n'), inline: false },
        { name: 'ðŸ”’ Gestion admin', value: [
            '`!rate-list` Â· Liste complÃ¨te avec scores et IDs',
            '`!rate-add <nom> | <url_image>` Â· Ajouter une gymgirl (ELO 1000)',
            '`!rate-remove <nom>` Â· Retirer une gymgirl',
            '`!rate-reset <nom>` Â· RÃ©initialiser l\'ELO Ã  1000',
            '`!give-rating @user` Â· Donner / retirer le rÃ´le Rating',
          ].join('\n'), inline: false },
        { name: 'âš™ï¸ Fonctionnement', value: [
            'â€¢ Chaque duel met Ã  jour les scores ELO en temps rÃ©el **(K=32)**',
            'â€¢ Les votes durent **5 minutes** puis expirent automatiquement',
            'â€¢ Plusieurs membres peuvent voter sur le mÃªme duel',
            'â€¢ 1 seul vote par utilisateur (changement autorisÃ©)',
            'â€¢ Base de donnÃ©es stockÃ©e sur **JSONBin.io** â€” persistante cross-restart',
          ].join('\n'), inline: false },
      )
      .setFooter({ text: '!aide â†’ GÃ©nÃ©ral Â· !aide3 â†’ Tournoi Â· !aide4 â†’ ModÃ©ration Â· !aide5 â†’ Tickets & VÃ©rif' })
      .setTimestamp();

    // â”€â”€ PAGE 3 : Tournoi â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const p3 = new EmbedBuilder()
      .setColor('#F39C12')
      .setAuthor({ name: 'âš¡ CrousBot â€” Centre de commandes', iconURL: guildIcon })
      .setTitle('âš”ï¸ Tournoi Physique â€” Ã‰limination directe')
      .setDescription(
        '> PrÃ©fixe : **`!`**  Â·  ðŸ”’ = admin uniquement\n' +
        '> â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€'
      )
      .addFields(
        { name: 'ðŸ”’ Commandes', value: [
            '`!tournoi-start <#channel-photos>` Â· Lance un tournoi depuis un salon photos',
            '`!tournoi-status` Â· Ã‰tat du tournoi (round, matchs, qualifiÃ©s)',
            '`!tournoi-cancel` Â· Annule le tournoi en cours',
          ].join('\n'), inline: false },
        { name: 'âš™ï¸ Fonctionnement', value: [
            '**1.** Scan du salon photos (jusqu\'Ã  1000 messages)',
            '**2.** 1 seule photo retenue par personne (premiÃ¨re trouvÃ©e)',
            '**3.** Matchs gÃ©nÃ©rÃ©s alÃ©atoirement par paires',
            '**4.** Vote via boutons **ðŸ† Joueur A / ðŸ† Joueur B**',
            '**5.** Le gagnant avance â€” Ã©limination directe',
            '**6.** Nombre impair â†’ bye automatique (passage sans match)',
          ].join('\n'), inline: false },
      )
      .setFooter({ text: '!aide â†’ GÃ©nÃ©ral Â· !aide2 â†’ Rating Â· !aide4 â†’ ModÃ©ration Â· !aide5 â†’ Tickets & VÃ©rif' })
      .setTimestamp();

    // â”€â”€ PAGE 4 : ModÃ©ration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const p4 = new EmbedBuilder()
      .setColor('#E74C3C')
      .setAuthor({ name: 'âš¡ CrousBot â€” Centre de commandes', iconURL: guildIcon })
      .setTitle('ðŸ”¨ ModÃ©ration â€” Commandes admin ðŸ”’')
      .setDescription(
        '> Toutes les commandes ci-dessous sont rÃ©servÃ©es aux admins ðŸ”’\n' +
        '> â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€'
      )
      .addFields(
        { name: 'âš ï¸ Warns', value: [
            '`!warn @user [raison]` Â· Avertit â€” jail auto au **3Ã¨me** warn',
            '`!warns @user` Â· Historique des warns d\'un membre',
            '`!clearwarns @user` Â· Supprime tous les warns',
          ].join('\n'), inline: false },
        { name: 'ðŸ”’ Jail & Mute', value: [
            '`!jail @user` Â· Emprisonne 5 min (retire TOUS les rÃ´les)',
            '`!unjail @user` Â· LibÃ¨re avant la fin de la peine',
            '`!expiredjails` Â· Jails actifs avec temps restant',
            '`!mute @user <minutes> [raison]` Â· Timeout Discord (1â€“40320 min)',
          ].join('\n'), inline: false },
        { name: 'â›” Sanctions lourdes', value: [
            '`!ban @user [raison]` Â· Bannit dÃ©finitivement + supprime 7j de messages',
            '`!source` Â· Auto-mute 10 min (rÃ¨gle 1 â€” sourceur dÃ©tectÃ©)',
            '`!mk677` Â· Auto-mute 10 min (rÃ¨gle 1 â€” mk677 mentionnÃ©)',
          ].join('\n'), inline: false },
        { name: 'ðŸ›¡ï¸ Anti-Badwords', value: [
            '`!badwords-add <mot>` Â· Ajoute un mot interdit (suppression + warn auto)',
            '`!badwords-remove <mot>` Â· Retire un mot de la liste',
            '`!badwords-list` Â· Affiche tous les mots interdits',
          ].join('\n'), inline: false },
        { name: 'ðŸ“‹ Logs & Divers', value: [
            '`!sanction-log <#channel>` Â· DÃ©finit le salon de logs',
            `> Salon actuel : ${logChDisplay}`,
            '`!like-enable` / `!like-disable` Â· Like auto sur cible configurÃ©e',
            '`!annonce-dm @role | <message>` Â· DM de masse avec confirmation',
            '  > Variables : `{user}` `{server}`',
            '`!welcome-set <#channel> | <message>` Â· Message de bienvenue auto',
            '  > Variables : `{user}` `{server}` `{count}`',
          ].join('\n'), inline: false },
      )
      .setFooter({ text: '!aide â†’ GÃ©nÃ©ral Â· !aide2 â†’ Rating Â· !aide3 â†’ Tournoi Â· !aide5 â†’ Tickets & VÃ©rif' })
      .setTimestamp();

    // â”€â”€ PAGE 5 : Tickets, Reaction Roles & VÃ©rification â”€â”€â”€â”€â”€â”€
    const p5 = new EmbedBuilder()
      .setColor('#2ECC71')
      .setAuthor({ name: 'âš¡ CrousBot â€” Centre de commandes', iconURL: guildIcon })
      .setTitle('ðŸŽ« Tickets Â· ðŸŽ­ Reaction Roles Â· âœ… VÃ©rification')
      .setDescription(
        '> PrÃ©fixe : **`!`**  Â·  ðŸ”’ = admin uniquement\n' +
        '> â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€'
      )
      .addFields(
        { name: 'ðŸŽ« Tickets', value: [
            '`!ticket <motif>` Â· Ouvre un ticket privÃ©',
            '`!fermer` Â· Ferme le ticket (depuis le salon ticket)',
            '`!ticket-setrole @role` ðŸ”’ Â· RÃ´le viewer (lecture seule)',
            '`!ticket-setstaff @role` ðŸ”’ Â· RÃ´le staff (Ã©criture)',
            '`!ticket-config` ðŸ”’ Â· Configuration actuelle',
            `> Viewer : ${viewRoleDisplay}  Â·  Staff : ${staffRoleDisplay}`,
          ].join('\n'), inline: false },
        { name: 'ðŸŽ­ Reaction Roles', value: [
            '`!rr-setup <#channel> | <titre> | <desc>` ðŸ”’ Â· CrÃ©e un message RR',
            '`!rr-attach <msgID> <#channel> | <titre> | <desc>` ðŸ”’ Â· Attache Ã  un existant',
            '`!rr-add <msgID> | <emoji> | <@role>` ðŸ”’ Â· Ajoute un emoji/rÃ´le',
            '`!rr-remove <msgID> | <emoji>` ðŸ”’ Â· Retire un emoji/rÃ´le',
            '`!rr-list` ðŸ”’ Â· Liste tous les messages RR configurÃ©s',
            '`!rr-delete <msgID>` ðŸ”’ Â· Supprime un message RR',
            '`!clearrole` ðŸ”’ Â· Retire le rÃ´le accÃ¨s Ã  **tous** les membres',
          ].join('\n'), inline: false },
        { name: 'âœ… VÃ©rification manuelle', value: [
            '`!verif-setup` ðŸ”’ Â· Assistant de configuration',
            '`!verif-config` ðŸ”’ Â· Affiche la configuration actuelle',
            '`!verif-enable` / `!verif-disable` ðŸ”’ Â· Active ou dÃ©sactive',
            '`!whitelist @user` ðŸ”’ Â· Approuve directement un membre',
            '`!blacklist @user [raison]` ðŸ”’ Â· Blacklist + kick',
            '`!unblacklist @user` ðŸ”’ Â· Retire de la blacklist',
            '`!blacklist-list` ðŸ”’ Â· Affiche toute la blacklist',
            '`!pending-list` ðŸ”’ Â· Liste les vÃ©rifications en attente',
          ].join('\n'), inline: false },
        { name: 'âš™ï¸ SÃ©curitÃ© automatique', value: [
            'â€¢ Comptes blacklistÃ©s â†’ rejetÃ©s automatiquement Ã  la rÃ©action',
            'â€¢ Comptes **< 7 jours** â†’ signalÃ©s en rouge ðŸš¨',
            'â€¢ Comptes **< 30 jours** â†’ signalÃ©s en orange âš ï¸',
            'â€¢ Sans avatar â†’ signalÃ© automatiquement',
          ].join('\n'), inline: false },
      )
      .setFooter({ text: '!aide â†’ GÃ©nÃ©ral Â· !aide2 â†’ Rating Â· !aide3 â†’ Tournoi Â· !aide4 â†’ ModÃ©ration' })
      .setTimestamp();

    await message.reply({ embeds: [p1] });
    await message.channel.send({ embeds: [p2] });
    await message.channel.send({ embeds: [p3] });
    await message.channel.send({ embeds: [p4] });
    await message.channel.send({ embeds: [p5] });
  },

  '!aide2': async (message) => { await commands['!aide'](message); },
  '!aide3': async (message) => { await commands['!aide'](message); },
  '!aide4': async (message) => { await commands['!aide'](message); },
  '!aide5': async (message) => { await commands['!aide'](message); },

  // â”€â”€ ZYZZ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!zyzz': async (message) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusÃ©e.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('Mentionne un utilisateur : `!zyzz @user`');

    if (zyzzHonors[target.id]) {
      const honor = zyzzHonors[target.id];
      delete zyzzHonors[target.id];
      saveZyzzHonors();
      try {
        if ((target.nickname || '').startsWith('âš¡ Fils de Zyzz')) {
          await target.setNickname(null, 'Retrait titre Zyzz').catch(() => {});
        }
      } catch {}
      return message.reply({ embeds: [new EmbedBuilder()
        .setColor('#95A5A6')
        .setTitle('â˜ ï¸ Titre retirÃ© â€” Fils de Zyzz')
        .setDescription(`<@${target.id}> n'est plus un **Fils de Zyzz**.\nLe soleil s'est couchÃ© sur son physique.`)
        .addFields(
          { name: 'Titre accordÃ© le', value: new Date(honor.at).toLocaleDateString('fr-FR'), inline: true },
          { name: 'RetirÃ© par',       value: `<@${message.author.id}>`,                      inline: true },
        )
        .setFooter({ text: 'We\'re all gonna make it... mais pas lui.' })
        .setTimestamp()] });
    }

    zyzzHonors[target.id] = { by: message.author.id, at: new Date().toISOString() };
    saveZyzzHonors();
    try {
      const base = target.nickname || target.user.username;
      await target.setNickname(`âš¡ Fils de Zyzz | ${base}`.slice(0, 32), `Titre Zyzz par ${message.author.tag}`).catch(() => {});
    } catch {}
    await message.reply({ embeds: [new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('âš¡ FILS DE ZYZZ â€” Titre accordÃ©')
      .setDescription(
        `<@${target.id}> est dÃ©sormais officiellement reconnu comme **Fils de Zyzz** par les dieux du physique.\n\n` +
        `*"We're all gonna make it, brah."*`
      )
      .addFields(
        { name: 'ðŸ… Titre',        value: 'âš¡ Fils de Zyzz',             inline: true },
        { name: 'ðŸ‘‘ AccordÃ© par',  value: `<@${message.author.id}>`,     inline: true },
      )
      .setThumbnail(target.user.displayAvatarURL({ size: 256 }))
      .setFooter({ text: 'HÃ©ritier de la lÃ©gende Â· Physique certifiÃ© divin' })
      .setTimestamp()] });
  },

  // â”€â”€ BADWORDS-ADD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!badwords-add': async (message, args) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusÃ©e.');
    const mot = args.join(' ').trim().toLowerCase();
    if (!mot) return message.reply('Format : `!badwords-add <mot>`');
    if (badwordsData.words.includes(mot)) return message.reply(`\`${mot}\` est dÃ©jÃ  dans la liste.`);
    badwordsData.words.push(mot);
    saveBadwords();
    await message.reply({ embeds: [new EmbedBuilder()
      .setColor('#FF4444')
      .setTitle('â›” Mot interdit ajoutÃ©')
      .setDescription(`Le mot \`${mot}\` est maintenant interdit. Tout message le contenant sera **supprimÃ©** et un warn sera ajoutÃ© automatiquement.`)
      .addFields(
        { name: 'Mot ajoutÃ©',      value: `\`${mot}\``,                            inline: true },
        { name: 'Total interdits', value: `${badwordsData.words.length} mot(s)`,   inline: true },
        { name: 'Par',             value: `<@${message.author.id}>`,               inline: true },
      )
      .setFooter({ text: '!badwords-list pour voir la liste complÃ¨te' })
      .setTimestamp()] });
  },

  // â”€â”€ BADWORDS-REMOVE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!badwords-remove': async (message, args) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusÃ©e.');
    const mot = args.join(' ').trim().toLowerCase();
    if (!mot) return message.reply('Format : `!badwords-remove <mot>`');
    const idx = badwordsData.words.indexOf(mot);
    if (idx === -1) return message.reply(`\`${mot}\` n'est pas dans la liste des mots interdits.`);
    badwordsData.words.splice(idx, 1);
    saveBadwords();
    await message.reply({ embeds: [new EmbedBuilder()
      .setColor('#00FF66')
      .setTitle('âœ… Mot retirÃ© de la liste')
      .addFields(
        { name: 'Mot retirÃ©', value: `\`${mot}\``,                            inline: true },
        { name: 'Restants',   value: `${badwordsData.words.length} mot(s)`,   inline: true },
      )
      .setTimestamp()] });
  },

  // â”€â”€ BADWORDS-LIST â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!badwords-list': async (message) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusÃ©e.');
    if (badwordsData.words.length === 0) {
      return message.reply({ embeds: [new EmbedBuilder()
        .setColor('#00FF66')
        .setTitle('âœ… Aucun mot interdit configurÃ©')
        .setDescription('Utilise `!badwords-add <mot>` pour en ajouter.')] });
    }
    const liste = badwordsData.words.map((w, i) => `\`${String(i + 1).padStart(2, '0')}\` ||${w}||`).join('\n');
    await message.reply({ embeds: [new EmbedBuilder()
      .setColor('#FF4444')
      .setTitle(`â›” Mots interdits â€” ${badwordsData.words.length} entrÃ©e(s)`)
      .setDescription(liste.slice(0, 4000))
      .setFooter({ text: 'Mots masquÃ©s (spoiler) â€” clique pour rÃ©vÃ©ler Â· !badwords-add / !badwords-remove' })
      .setTimestamp()] });
  },

  // â”€â”€ ANNONCE-DM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!annonce-dm': async (message, args) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusÃ©e.');
    const parts = args.join(' ').split('|').map(s => s.trim());
    if (parts.length < 2) return message.reply('Format : `!annonce-dm @role | <message>`\n> Variables : `{user}` `{server}`');
    const role = message.mentions.roles.first();
    if (!role) return message.reply('Mentionne un rÃ´le valide en premier paramÃ¨tre.');
    const texte = parts.slice(1).join('|').trim();
    if (!texte) return message.reply('Le message ne peut pas Ãªtre vide.');

    const confirmMsg = await message.reply({ embeds: [new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('âš ï¸ Confirmation requise')
      .setDescription(
        `Tu es sur le point d'envoyer un DM Ã  **tous les membres** avec le rÃ´le <@&${role.id}>.\n\n**AperÃ§u du message :**\n> ${texte.slice(0, 400)}`
      )
      .setFooter({ text: 'RÃ©agis âœ… pour confirmer ou âŒ pour annuler â€” 30 secondes' })] });

    await confirmMsg.react('âœ…').catch(() => {});
    await confirmMsg.react('âŒ').catch(() => {});

    const collected = await confirmMsg.awaitReactions({
      filter: (r, u) => ['âœ…', 'âŒ'].includes(r.emoji.name) && u.id === message.author.id,
      max: 1, time: 30000,
    }).catch(() => null);

    if (!collected || collected.size === 0 || collected.first().emoji.name === 'âŒ') {
      return confirmMsg.edit({ embeds: [new EmbedBuilder().setColor('#95A5A6').setTitle('âŒ Annonce DM annulÃ©e')] });
    }

    await confirmMsg.edit({ embeds: [new EmbedBuilder().setColor('#5865F2').setTitle('ðŸ“¨ Envoi des DMs en cours...')] });
    await message.guild.members.fetch().catch(() => {});
    const targets = message.guild.members.cache.filter(m => !m.user.bot && m.roles.cache.has(role.id));

    let sent = 0, failed = 0;
    for (const [, member] of targets) {
      const personalizedMsg = texte
        .replace(/{user}/g,   member.user.username)
        .replace(/{server}/g, message.guild.name);
      try {
        await member.send({ embeds: [new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle(`ðŸ“¢ Message de ${message.guild.name}`)
          .setDescription(personalizedMsg)
          .setThumbnail(message.guild.iconURL({ size: 256 }) ?? undefined)
          .setTimestamp()
          .setFooter({ text: `EnvoyÃ© par ${message.author.tag}` })] });
        sent++;
      } catch { failed++; }
      await new Promise(r => setTimeout(r, 500));
    }

    await confirmMsg.edit({ embeds: [new EmbedBuilder()
      .setColor(failed > 0 ? '#FFA500' : '#00FF66')
      .setTitle('ðŸ“¨ Annonce DM terminÃ©e')
      .setDescription(`DMs envoyÃ©s aux membres avec le rÃ´le <@&${role.id}>.`)
      .addFields(
        { name: 'âœ… EnvoyÃ©s', value: `${sent}`,        inline: true },
        { name: 'âŒ Ã‰checs',  value: `${failed}`,       inline: true },
        { name: 'Total',      value: `${targets.size}`, inline: true },
      )
      .setFooter({ text: 'Les DMs fermÃ©s comptent comme Ã©checs.' })
      .setTimestamp()] });

    await logSanction(message.guild, [
      { name: 'Admin',   value: `<@${message.author.id}>`, inline: true },
      { name: 'RÃ´le',    value: `<@&${role.id}>`,          inline: true },
      { name: 'EnvoyÃ©s', value: `${sent}/${targets.size}`, inline: true },
    ], 'Annonce DM de masse', '#5865F2');
  },

  // â”€â”€ WELCOME-SET â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!welcome-set': async (message, args) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusÃ©e.');
    const parts = args.join(' ').split('|').map(s => s.trim());

    if (!parts[0] || parts.length < 2) {
      return message.reply({ embeds: [new EmbedBuilder()
        .setColor(welcomeConfig.channelId ? '#00FF66' : '#FF4444')
        .setTitle('ðŸ”” Configuration â€” Bienvenue automatique')
        .setDescription(
          '**Format :** `!welcome-set <#channel> | <message>`\n' +
          '**Variables :** `{user}` â†’ mention Â· `{server}` â†’ nom du serveur Â· `{count}` â†’ nb membres\n' +
          '**DÃ©sactiver :** `!welcome-set disable`\n\n**Configuration actuelle :**'
        )
        .addFields(
          { name: 'ðŸ“¢ Salon',    value: welcomeConfig.channelId ? `<#${welcomeConfig.channelId}>` : '`Non configurÃ©`', inline: true },
          { name: 'ðŸ’¬ Message', value: welcomeConfig.message ? welcomeConfig.message.slice(0, 500) : '`Non configurÃ©`', inline: false },
        )
        .setTimestamp()] });
    }

    if (parts[0].toLowerCase() === 'disable') {
      welcomeConfig.channelId = null; welcomeConfig.message = null; saveWelcomeConf();
      return message.reply({ embeds: [new EmbedBuilder().setColor('#95A5A6').setTitle('ðŸ”• Message de bienvenue dÃ©sactivÃ©')] });
    }

    const channel = message.mentions.channels.first();
    if (!channel) return message.reply('Mentionne un salon valide en premier paramÃ¨tre.');
    const texte = parts.slice(1).join('|').trim();
    if (!texte) return message.reply('Le message ne peut pas Ãªtre vide.');

    welcomeConfig.channelId = channel.id; welcomeConfig.message = texte; saveWelcomeConf();

    const preview = texte
      .replace(/{user}/g,   `<@${message.author.id}>`)
      .replace(/{server}/g, message.guild.name)
      .replace(/{count}/g,  message.guild.memberCount);

    await message.reply({ embeds: [new EmbedBuilder()
      .setColor('#00FF66')
      .setTitle('ðŸ”” Message de bienvenue configurÃ© âœ…')
      .addFields(
        { name: 'ðŸ“¢ Salon',    value: `${channel}`,            inline: true },
        { name: 'ðŸ‘¤ AperÃ§u', value: preview.slice(0, 500),     inline: false },
      )
      .setFooter({ text: 'Ce message sera envoyÃ© automatiquement Ã  chaque nouveau membre.' })
      .setTimestamp()] });
  },

  // â”€â”€ CLEAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!clear': async (message, args) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusee.');
    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount < 1 || amount > 100) return message.reply('Specifie un nombre entre 1 et 100. Ex : `!clear 10`');
    try {
      await message.delete().catch(() => {});
      const deleted = await message.channel.bulkDelete(amount, true);
      const confirm = await message.channel.send({
        embeds: [embed('#00FF66').setTitle('Messages supprimes')
          .setDescription(`**${deleted.size}** message(s) supprime(s) par <@${message.author.id}>.`)
          .setFooter({ text: 'Ce message disparait dans 5 secondes.' })],
      });
      setTimeout(() => confirm.delete().catch(() => {}), 5000);
    } catch (err) {
      const errMsg = await message.channel.send(`Erreur : ${err.message}`).catch(() => null);
      if (errMsg) setTimeout(() => errMsg.delete().catch(() => {}), 6000);
    }
  },

  // â”€â”€ SAY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!say': async (message, args) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusee.');
    try { await message.delete(); } catch {}
    const parts = args.join(' ').split('|').map(s => s.trim());
    if (parts.length < 3) {
      const errMsg = await message.channel.send('Format : `!say <#channel> | <titre> | <description> | [couleur] | [image_url] | [footer]`');
      setTimeout(() => errMsg.delete().catch(() => {}), 8000);
      return;
    }
    const targetChannel = message.mentions.channels.first();
    if (!targetChannel) {
      const errMsg = await message.channel.send('Mentionne un salon valide en premier parametre.');
      setTimeout(() => errMsg.delete().catch(() => {}), 5000);
      return;
    }
    const titre       = parts[1] || 'Annonce';
    const description = parts[2] || '';
    const couleur     = parts[3] || '#5865F2';
    const imageUrl    = parts[4] || null;
    const footer      = parts[5] || null;
    const validColor  = /^#[0-9A-Fa-f]{6}$/.test(couleur) ? couleur : '#5865F2';
    const sayEmbed    = new EmbedBuilder().setColor(validColor).setTitle(titre).setDescription(description).setTimestamp();
    if (imageUrl) { try { sayEmbed.setImage(imageUrl); } catch {} }
    if (footer)   { sayEmbed.setFooter({ text: footer }); }
    try {
      await targetChannel.send({ embeds: [sayEmbed] });
    } catch (err) {
      const errMsg = await message.channel.send(`Impossible d'envoyer dans ce salon : ${err.message}`);
      setTimeout(() => errMsg.delete().catch(() => {}), 5000);
    }
  },

  // â”€â”€ WARNS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!warn': async (message, args) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusee.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('Mentionne un utilisateur : `!warn @user [raison]`');
    if (isAdmin(target.id)) return message.reply('Tu ne peux pas warn un admin.');

    const reason = args.slice(1).join(' ') || 'Aucune raison fournie';
    if (!warnsData[target.id]) warnsData[target.id] = [];
    warnsData[target.id].push({ reason, by: message.author.id, at: new Date().toISOString() });
    saveWarns();

    const warnCount = warnsData[target.id].length;
    const warnEmbed = embed('#FFA500')
      .setTitle(`Avertissement -- Warn ${warnCount}/3`)
      .setDescription(`<@${target.id}> a recu un avertissement.`)
      .addFields(
        { name: 'Raison', value: reason,                    inline: false },
        { name: 'Par',    value: `<@${message.author.id}>`, inline: true  },
        { name: 'Total',  value: `${warnCount} warn(s)`,    inline: true  },
      )
      .setFooter({ text: warnCount >= 3 ? '3 warns atteints -- Jail automatique declenche !' : `${3 - warnCount} warn(s) avant jail automatique` });
    await message.reply({ embeds: [warnEmbed] });

    await logSanction(message.guild, [
      { name: 'Membre', value: `<@${target.id}>`,          inline: true },
      { name: 'Par',    value: `<@${message.author.id}>`,  inline: true },
      { name: 'Raison', value: reason,                     inline: false },
      { name: 'Total',  value: `${warnCount}/3`,           inline: true },
    ], `Warn #${warnCount} -- ${target.user.tag}`, '#FFA500');

    if (warnCount >= 3) {
      const prisonChannel = message.guild.channels.cache.get(CONFIG.JAIL_PRISON_CHANNEL_ID);
      const dureeMin = Math.round(CONFIG.JAIL_DURATION_MS / 60000);
      try {
        const removedRoleIds = await jailMember(target, 'Auto-jail (3 warns)');
        jailsData[target.id] = { until: Date.now() + CONFIG.JAIL_DURATION_MS, savedRoleIds: removedRoleIds, hadRole: removedRoleIds.includes(CONFIG.JAIL_ACCESS_ROLE_ID), guildId: message.guild.id };
        saveJails();

        await message.channel.send({ embeds: [embed('#FF4444').setTitle('Jail automatique -- 3 warns atteints')
          .setDescription(`<@${target.id}> emprisonne pour **${dureeMin} minutes**. **${removedRoleIds.length}** role(s) retire(s).`)
          .setFooter({ text: 'Reflechis a tes actes.' })] });

        if (prisonChannel) {
          await prisonChannel.send({ content: `<@${target.id}>`, embeds: [embed('#FF4444').setTitle('Jail automatique')
            .setDescription(`Tu as accumule 3 warns. Tu es emprisonne pour **${dureeMin} min**.\nTu n'as acces qu'a ce salon. Tes roles seront restaures a la liberation.`)] });
        }

        await logSanction(message.guild, [
          { name: 'Membre',        value: `<@${target.id}>`,         inline: true },
          { name: 'Duree',         value: `${dureeMin} min`,          inline: true },
          { name: 'Roles retires', value: `${removedRoleIds.length}`, inline: true },
          { name: 'Motif',         value: 'Auto-jail (3 warns)',      inline: false },
        ], `Jail auto -- ${target.user.tag}`, '#FF4444');

        setTimeout(async () => {
          try {
            const member = await message.guild.members.fetch(target.id).catch(() => null);
            if (!member) { delete jailsData[target.id]; saveJails(); return; }
            const saved = jailsData[target.id];
            if (saved) await unjailMember(member, saved.savedRoleIds || [], 'Liberation automatique apres jail');
            delete jailsData[target.id]; saveJails();
            if (prisonChannel) {
              await prisonChannel.send({ embeds: [embed('#00FF66').setTitle('Libere !').setDescription(`<@${target.id}> a ete libere automatiquement. Ses roles ont ete restaures.`)] });
            }
          } catch (err) { console.error('[AUTO-JAIL] Erreur liberation :', err.message); }
        }, CONFIG.JAIL_DURATION_MS);
      } catch (err) { console.error('[WARN AUTO-JAIL] Erreur :', err.message); }
    }
  },

  '!warns': async (message) => {
    const target = message.mentions.members.first();
    if (!target) return message.reply('Mentionne un utilisateur : `!warns @user`');
    const list = warnsData[target.id];
    if (!list || list.length === 0) return message.reply(`<@${target.id}> n'a aucun warn.`);
    const fields = list.map((w, i) => ({
      name: `Warn #${i + 1} -- ${new Date(w.at).toLocaleDateString('fr-FR')}`,
      value: `${w.reason}\n<@${w.by}>`,
      inline: false,
    }));
    await message.reply({ embeds: [embed('#FFA500').setTitle(`Warns de ${target.displayName} -- ${list.length}/3`).addFields(fields)] });
  },

  '!clearwarns': async (message) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusee.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('Mentionne un utilisateur : `!clearwarns @user`');
    const before = warnsData[target.id]?.length || 0;
    delete warnsData[target.id]; saveWarns();
    await message.reply(`**${before}** warn(s) supprime(s) pour <@${target.id}>.`);
    await logSanction(message.guild, [
      { name: 'Membre',    value: `<@${target.id}>`,          inline: true },
      { name: 'Par',       value: `<@${message.author.id}>`,  inline: true },
      { name: 'Supprimes', value: `${before} warn(s)`,        inline: true },
    ], `Warns effaces -- ${target.user.tag}`, '#00FF66');
  },

  // â”€â”€ EXPIREDJAILS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!expiredjails': async (message) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusee.');
    const active = Object.entries(jailsData);
    if (active.length === 0) return message.reply('Aucun jail actif en ce moment.');
    const now    = Date.now();
    const fields = active.map(([userId, data]) => {
      const remaining   = data.until - now;
      const displayTime = remaining > 0 ? `${Math.ceil(remaining / 1000 / 60)} min restante(s)` : 'Liberation en attente...';
      const rolesCount  = data.savedRoleIds?.length ?? (data.hadRole ? 1 : 0);
      return { name: `<@${userId}>`, value: `${displayTime}\nFin : ${new Date(data.until).toLocaleTimeString('fr-FR')}\n${rolesCount} role(s) sauvegarde(s)`, inline: true };
    });
    await message.reply({ embeds: [embed('#FF4444').setTitle(`Jails actifs -- ${active.length} membre(s)`).addFields(fields)] });
  },

  // â”€â”€ SANCTION LOG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!sanction-log': async (message) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusee.');
    const channel = message.mentions.channels.first();
    if (!channel) return message.reply('Mentionne un salon : `!sanction-log <#channel>`');
    sanctionLogData.channelId = channel.id; saveSanctionLog();
    await message.reply(`Salon de logs des sanctions defini : ${channel}`);
  },

  // â”€â”€ JAIL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!jail': async (message) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusee.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('Mentionne un utilisateur : `!jail @user`');
    if (isAdmin(target.id)) return message.reply('Tu ne peux pas emprisonner un admin.');

    const prisonChannel = message.guild.channels.cache.get(CONFIG.JAIL_PRISON_CHANNEL_ID);
    const prisonMention = prisonChannel ? `<#${CONFIG.JAIL_PRISON_CHANNEL_ID}>` : '#prison';
    const dureeMin      = Math.round(CONFIG.JAIL_DURATION_MS / 60000);

    try {
      const removedRoleIds = await jailMember(target, `Jail par ${message.author.tag}`);
      jailsData[target.id] = { until: Date.now() + CONFIG.JAIL_DURATION_MS, savedRoleIds: removedRoleIds, hadRole: removedRoleIds.includes(CONFIG.JAIL_ACCESS_ROLE_ID), guildId: message.guild.id };
      saveJails();

      await message.reply({ embeds: [embed('#FF4444').setTitle('Emprisonne !')
        .setDescription(`<@${target.id}> envoye en prison par <@${message.author.id}>.\n**${removedRoleIds.length}** role(s) retire(s) -- restaures dans **${dureeMin} min**.\n\nSeul ${prisonMention} reste accessible.`)
        .addFields(
          { name: 'Par',           value: `<@${message.author.id}>`, inline: true },
          { name: 'Duree',         value: `${dureeMin} min`,          inline: true },
          { name: 'Roles retires', value: `${removedRoleIds.length}`, inline: true },
        ).setFooter({ text: 'Reflechis a tes actes.' })] });

      if (prisonChannel) {
        await prisonChannel.send({ content: `<@${target.id}>`, embeds: [embed('#FF4444').setTitle('Tu es en prison')
          .setDescription(`Tu as ete emprisonne par <@${message.author.id}>.\nTu n'as acces qu'a ce salon pendant **${dureeMin} minute${dureeMin > 1 ? 's' : ''}**.\nTous tes roles seront restaures a la liberation.`)] });
      }

      await logSanction(message.guild, [
        { name: 'Membre',        value: `<@${target.id}>`,          inline: true },
        { name: 'Par',           value: `<@${message.author.id}>`,  inline: true },
        { name: 'Duree',         value: `${dureeMin} min`,           inline: true },
        { name: 'Roles retires', value: `${removedRoleIds.length}`, inline: true },
      ], `Jail -- ${target.user.tag}`, '#FF4444');

      setTimeout(async () => {
        try {
          const member = await message.guild.members.fetch(target.id).catch(() => null);
          if (!member) { delete jailsData[target.id]; saveJails(); return; }
          const saved = jailsData[target.id];
          if (saved) await unjailMember(member, saved.savedRoleIds || [], 'Liberation automatique apres jail');
          delete jailsData[target.id]; saveJails();
          if (prisonChannel) {
            await prisonChannel.send({ embeds: [embed('#00FF66').setTitle('Libere !').setDescription(`<@${target.id}> a purge sa peine. Tous ses roles ont ete restaures.`)] });
          }
        } catch (err) { console.error('[JAIL] Erreur liberation :', err.message); }
      }, CONFIG.JAIL_DURATION_MS);
    } catch (err) { await message.reply(`Erreur : ${err.message}`); }
  },

  // â”€â”€ TOURNOI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!tournoi-start': async (message, args) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusee.');
    const photoChannel = message.mentions.channels.first();
    if (!photoChannel) return message.reply('Mentionne le salon photos : `!tournoi-start <#channel-photos>`');

    const activeTournament = Object.values(tournamentsData).find(t => t.status === 'active');
    if (activeTournament) return message.reply(`Un tournoi est deja en cours (ID: \`${activeTournament.id}\`). Utilise \`!tournoi-cancel\` pour l'annuler.`);

    await message.reply('Recuperation des photos en cours...');

    let allMessages = []; let lastId = null; let fetchMore = true;
    while (fetchMore) {
      const options = { limit: 100 };
      if (lastId) options.before = lastId;
      const batch = await photoChannel.messages.fetch(options).catch(() => null);
      if (!batch || batch.size === 0) break;
      allMessages.push(...batch.values());
      lastId = batch.last().id;
      fetchMore = batch.size === 100;
      if (allMessages.length >= 1000) break;
    }

    const imageExtensions = /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;
    const participants = []; const seenUsers = new Set();
    for (const msg of allMessages) {
      if (msg.author.bot) continue;
      const imageAttachment = msg.attachments.find(att => att.contentType?.startsWith('image/') || imageExtensions.test(att.url));
      if (imageAttachment && !seenUsers.has(msg.author.id)) {
        seenUsers.add(msg.author.id);
        participants.push({ userId: msg.author.id, username: msg.member?.displayName || msg.author.username, imageUrl: imageAttachment.url, messageId: msg.id });
      }
    }

    if (participants.length < 2) return message.reply('Pas assez de participants (minimum 2).');

    const tournamentId = Date.now().toString(36);
    const firstRoundPairs = buildRound(participants);
    tournamentsData[tournamentId] = {
      id: tournamentId, status: 'active', hostChannelId: message.channel.id, photoChannelId: photoChannel.id,
      participants, currentRound: 1, currentMatchIndex: 0, currentPairs: firstRoundPairs,
      roundWinners: [], allRoundWinners: [], history: [], startedBy: message.author.id,
      startedAt: new Date().toISOString(), currentVoteMessageId: null,
    };
    saveTournaments();

    await message.channel.send({ embeds: [embed('#FFD700').setTitle('Tournoi Physique -- Debut !')
      .setDescription(`Le tournoi demarre avec **${participants.length} participant(s)** !\n\nPhotos recuperees depuis ${photoChannel}\nSeule **1 photo par personne** est retenue.`)
      .addFields(
        { name: 'Participants',       value: participants.map(p => `<@${p.userId}>`).join(', ').slice(0, 1024), inline: false },
        { name: 'Matchs au 1er tour', value: `${firstRoundPairs.filter(p => p[1] !== null).length} match(s)`,   inline: true  },
        { name: 'Format',             value: 'Elimination directe',                                               inline: true  },
      ).setFooter({ text: `Tournoi #${tournamentId} -- Lance par ${message.author.tag}` })] });
    await advanceTournament(tournamentId, message.channel);
  },

  '!tournoi-status': async (message) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusee.');
    const activeTournament = Object.values(tournamentsData).find(t => t.status === 'active');
    if (!activeTournament) return message.reply('Aucun tournoi en cours.');
    const t = activeTournament;
    await message.reply({ embeds: [embed('#FFD700').setTitle(`Tournoi #${t.id} -- Round ${t.currentRound}`).addFields(
      { name: 'Progression',                         value: `Match ${t.currentMatchIndex}/${t.currentPairs.filter(p => p[1] !== null).length}`, inline: true },
      { name: 'Participants',                        value: `${t.participants.length}`,                                                          inline: true },
      { name: `Qualifies (R${t.currentRound})`,     value: `${t.roundWinners.length}`,                                                          inline: true },
      { name: 'Lance par',                           value: `<@${t.startedBy}>`,                                                                 inline: true },
      { name: 'Demarre le',                          value: new Date(t.startedAt).toLocaleString('fr-FR'),                                       inline: true },
    )] });
  },

  '!tournoi-cancel': async (message) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusee.');
    const activeTournament = Object.values(tournamentsData).find(t => t.status === 'active');
    if (!activeTournament) return message.reply('Aucun tournoi en cours.');
    activeTournament.status = 'cancelled'; saveTournaments();
    await message.reply({ embeds: [embed('#FF4444').setTitle('Tournoi annule').setDescription(`Le tournoi #${activeTournament.id} a ete annule par <@${message.author.id}>.`)] });
  },

  // â”€â”€ NPC â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!npc': async (message) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusee.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('Mentionne un utilisateur : `!npc @user`');
    if (isAdmin(target.id)) return message.reply('Tu ne peux pas npc-ifier un admin.');

    const NPC_DURATION_MS = 10 * 60 * 1000;
    const dureeMin = Math.round(NPC_DURATION_MS / 60000);
    const originalNick = target.nickname || target.user.username;
    const npcNames = ['NPC #4782', 'NPC #0001', 'NPC Villageois', 'NPC Background', 'NPC Sans Cerveau', 'NPC Scriptless', 'NPC Fluide', 'NPC Cope Dealer'];
    const newNick = npcNames[Math.floor(Math.random() * npcNames.length)];

    try {
      await target.setNickname(newNick, `NPC par ${message.author.tag}`);
      npcList[target.id] = { originalNick, until: Date.now() + NPC_DURATION_MS, guildId: message.guild.id }; saveNpcList();
      await message.reply({ embeds: [embed('#95A5A6').setTitle('Statut NPC active')
        .setDescription(`<@${target.id}> est desormais un **NPC** pour les **${dureeMin} prochaines minutes**.`)
        .addFields(
          { name: 'Nouveau pseudo', value: newNick,                    inline: true },
          { name: 'Par',            value: `<@${message.author.id}>`,  inline: true },
          { name: 'Duree',          value: `${dureeMin} min`,           inline: true },
        ).setFooter({ text: 'NPC Mode -- Retour a la conscience dans quelques minutes.' })] });
      await logSanction(message.guild, [
        { name: 'Membre', value: `<@${target.id}>`,         inline: true },
        { name: 'Par',    value: `<@${message.author.id}>`, inline: true },
        { name: 'Duree',  value: `${dureeMin} min`,          inline: true },
      ], `NPC -- ${target.user.tag}`, '#95A5A6');
      setTimeout(async () => {
        try {
          const member = await message.guild.members.fetch(target.id).catch(() => null);
          if (!member) { delete npcList[target.id]; saveNpcList(); return; }
          const saved = npcList[target.id];
          await member.setNickname(saved?.originalNick === target.user.username ? null : saved?.originalNick, 'Fin du statut NPC');
          delete npcList[target.id]; saveNpcList();
        } catch (err) { console.error('[NPC] Erreur restauration pseudo :', err.message); }
      }, NPC_DURATION_MS);
    } catch (err) { await message.reply(`Erreur : ${err.message}`); }
  },

  // â”€â”€ RESETPSEUDO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!resetpseudo': async (message) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusee.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('Mentionne un utilisateur : `!resetpseudo @user`');
    try {
      const oldNick = target.nickname || '*aucun surnom*';
      await target.setNickname(null, `Reset pseudo par ${message.author.tag}`);
      if (npcList[target.id]) { delete npcList[target.id]; saveNpcList(); }
      if (tfList[target.id])  { delete tfList[target.id];  saveTfList();  }
      await message.reply({ embeds: [embed('#00FF66').setTitle('Pseudo reinitialise').addFields(
        { name: 'Membre',        value: `<@${target.id}>`,         inline: true },
        { name: 'Ancien pseudo', value: oldNick,                    inline: true },
        { name: 'Par',           value: `<@${message.author.id}>`, inline: true },
      )] });
    } catch (err) { await message.reply(`Erreur : ${err.message}`); }
  },

  // â”€â”€ TF â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!tf': async (message) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusee.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('Mentionne un utilisateur : `!tf @user`');
    if (isAdmin(target.id)) return message.reply('Tu ne peux pas transformer un admin.');

    const TF_DURATION_MS = 10 * 60 * 1000;
    const dureeMin = Math.round(TF_DURATION_MS / 60000);
    const originalNick = target.nickname || target.user.username;
    const tfNames = ['Le Copeur Certifie', 'M. Fluide 2024', 'Natty Suspect #1', 'Le Roi du Fenugrec', 'Monsieur Maingain', 'Le Bulk Eternel', 'Prince du Cope', 'IQ Test Echoue', 'Fonte Imaginaire', 'Background NPC', 'Zyzz Rate', 'Le Sourceur', 'Hgh Anonymous', 'Mr. Overdose Creatine', 'Amateur de MK677'];
    const newNick = tfNames[Math.floor(Math.random() * tfNames.length)];

    try {
      await target.setNickname(newNick, `TF par ${message.author.tag}`);
      tfList[target.id] = { originalNick, until: Date.now() + TF_DURATION_MS, guildId: message.guild.id }; saveTfList();
      await message.reply({ embeds: [embed('#9B59B6').setTitle('Transformation activee')
        .setDescription(`<@${target.id}> a ete transforme pour **${dureeMin} minutes**.`)
        .addFields(
          { name: 'Ancien pseudo',  value: originalNick,              inline: true },
          { name: 'Nouveau pseudo', value: newNick,                   inline: true },
          { name: 'Par',            value: `<@${message.author.id}>`, inline: true },
          { name: 'Duree',          value: `${dureeMin} min`,          inline: true },
        ).setFooter({ text: 'TF Mode -- Identite temporairement confisquee.' })] });
      await logSanction(message.guild, [
        { name: 'Membre',         value: `<@${target.id}>`,         inline: true },
        { name: 'Nouveau pseudo', value: newNick,                   inline: true },
        { name: 'Par',            value: `<@${message.author.id}>`, inline: true },
      ], `TF -- ${target.user.tag}`, '#9B59B6');
      setTimeout(async () => {
        try {
          const member = await message.guild.members.fetch(target.id).catch(() => null);
          if (!member) { delete tfList[target.id]; saveTfList(); return; }
          const saved = tfList[target.id];
          await member.setNickname(saved?.originalNick === target.user.username ? null : saved?.originalNick, 'Fin du TF');
          delete tfList[target.id]; saveTfList();
        } catch (err) { console.error('[TF] Erreur restauration pseudo :', err.message); }
      }, TF_DURATION_MS);
    } catch (err) { await message.reply(`Erreur : ${err.message}`); }
  },

  // â”€â”€ TICKETS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!ticket-setrole': async (message) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusee.');
    const role = message.mentions.roles.first();
    if (!role) return message.reply('Mentionne un role. Exemple : `!ticket-setrole @Membres`');
    ticketConfig.viewRoleId = role.id; saveTicketConfig();
    await message.reply(`Role viewer des tickets defini : <@&${role.id}>`);
  },

  '!ticket-setstaff': async (message) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusee.');
    const role = message.mentions.roles.first();
    if (!role) return message.reply('Mentionne un role. Exemple : `!ticket-setstaff @Staff`');
    ticketConfig.staffRoleId = role.id; saveTicketConfig();
    await message.reply(`Role staff des tickets defini : <@&${role.id}>`);
  },

  '!ticket-config': async (message) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusee.');
    await message.reply({ embeds: [embed('#00FF66').setTitle('Configuration des tickets').addFields(
      { name: 'Role viewer', value: ticketConfig.viewRoleId  ? `<@&${ticketConfig.viewRoleId}>`  : 'Non defini', inline: false },
      { name: 'Role staff',  value: ticketConfig.staffRoleId ? `<@&${ticketConfig.staffRoleId}>` : 'Non defini', inline: false },
    )] });
  },

  '!ticket': async (message, args) => {
    try { await message.delete(); } catch {}
    const motif = args.join(' ').trim();
    if (!motif) {
      const errMsg = await message.channel.send('Format : `!ticket <motif>`').catch(() => null);
      if (errMsg) setTimeout(() => errMsg.delete().catch(() => {}), 6000);
      return;
    }
    const guild = message.guild;
    const ticketNumber = Math.floor(1000 + Math.random() * 9000);
    const overwrites = [{ id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] }];
    if (ticketConfig.viewRoleId) {
      const viewRole = guild.roles.cache.get(ticketConfig.viewRoleId);
      if (viewRole) overwrites.push({ id: viewRole.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory], deny: [PermissionsBitField.Flags.SendMessages] });
    }
    if (ticketConfig.staffRoleId) {
      const staffRole = guild.roles.cache.get(ticketConfig.staffRoleId);
      if (staffRole) overwrites.push({ id: staffRole.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] });
    }
    overwrites.push({ id: message.author.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] });
    for (const adminId of CONFIG.ADMIN_IDS) {
      try {
        const adminMember = await guild.members.fetch(adminId);
        if (adminMember) overwrites.push({ id: adminMember.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] });
      } catch { console.warn(`[TICKET] Admin ${adminId} introuvable, ignore.`); }
    }
    try {
      const channel = await guild.channels.create({ name: `ticket-${ticketNumber}`, type: 0, permissionOverwrites: overwrites, reason: `Ticket #${ticketNumber} ouvert par ${message.author.tag}` });
      ticketsData[channel.id] = { openerId: message.author.id, openerTag: message.author.tag, ticketNumber, motif, openedAt: new Date().toISOString() }; saveTickets();
      const staffMention = ticketConfig.staffRoleId ? `<@&${ticketConfig.staffRoleId}>` : '';
      await channel.send({ content: `<@${message.author.id}>${staffMention ? ` ${staffMention}` : ''}`,
        embeds: [embed('#00FF66').setTitle(`Ticket #${ticketNumber}`)
          .setDescription('Le staff va traiter ta demande sous 24h.\n\n> Pour fermer ce ticket, utilise `!fermer`')
          .addFields({ name: 'Ouvert par', value: `<@${message.author.id}>`, inline: true }, { name: 'Motif', value: motif, inline: false })
          .setFooter({ text: `Ticket #${ticketNumber}` })] });
      const confirmMsg = await message.channel.send(`Ton ticket a ete cree : ${channel}`).catch(() => null);
      if (confirmMsg) setTimeout(() => confirmMsg.delete().catch(() => {}), 6000);
    } catch (error) {
      const errMsg = await message.channel.send(`Impossible de creer le ticket : ${error.message}`).catch(() => null);
      if (errMsg) setTimeout(() => errMsg.delete().catch(() => {}), 6000);
    }
  },

  '!fermer': async (message) => {
    try { await message.delete(); } catch {}
    const ticketInfo = ticketsData[message.channel.id];
    if (!ticketInfo) {
      const errMsg = await message.channel.send('Cette commande ne peut etre utilisee que dans un salon ticket.').catch(() => null);
      if (errMsg) setTimeout(() => errMsg.delete().catch(() => {}), 5000);
      return;
    }
    const canClose = isAdmin(message.author.id) || message.author.id === ticketInfo.openerId;
    if (!canClose) {
      const errMsg = await message.channel.send('Seul le staff ou la personne qui a ouvert ce ticket peut le fermer.').catch(() => null);
      if (errMsg) setTimeout(() => errMsg.delete().catch(() => {}), 5000);
      return;
    }
    await message.channel.send({ embeds: [embed('#FF4444').setTitle('Ticket ferme')
      .setDescription(`Ce ticket a ete ferme par <@${message.author.id}>.\n\nLe salon sera supprime dans **5 secondes**.`)
      .addFields({ name: 'Ouvert par', value: `<@${ticketInfo.openerId}>`, inline: true }, { name: 'Motif', value: ticketInfo.motif, inline: false })
      .setFooter({ text: `Ticket #${ticketInfo.ticketNumber}` })] }).catch(() => {});
    delete ticketsData[message.channel.id]; saveTickets();
    setTimeout(async () => { try { await message.channel.delete(`Ticket ferme par ${message.author.tag}`); } catch (err) { console.error('[FERMER] Erreur suppression salon :', err.message); } }, 5000);
  },

  // â”€â”€ REACTION ROLES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!rr-setup': async (message, args) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusee.');
    const parts = args.join(' ').split('|').map(s => s.trim());
    if (parts.length < 2) return message.reply('Format : `!rr-setup <#channel> | <titre> | <description (optionnelle)>`');
    const targetChannel = message.mentions.channels.first();
    if (!targetChannel) return message.reply('Mentionne un channel valide.');
    const titre       = parts[1];
    const description = parts[2] || 'Reagis avec les emojis ci-dessous pour obtenir tes roles !';
    const sent = await targetChannel.send({ embeds: [embed('#7289DA').setTitle(titre).setDescription(description)
      .addFields({ name: 'Roles disponibles', value: '*Aucun role configure pour l\'instant.*', inline: false })
      .setFooter({ text: 'Reagis pour obtenir un role - Retire ta reaction pour le perdre' })] });
    reactionRolesData[sent.id] = { channelId: targetChannel.id, titre, description, roles: {}, existingMessage: false }; saveReactionRoles();
    await message.reply(`Message de reaction role cree dans ${targetChannel} !\nID : \`${sent.id}\``);
  },

  '!rr-attach': async (message, args) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusee.');
    const parts = args.join(' ').split('|').map(s => s.trim());
    if (parts.length < 2) return message.reply('Format : `!rr-attach <messageID> <#channel> | <titre> | <description optionnelle>`');
    const firstPartTokens = parts[0].split(/\s+/);
    if (firstPartTokens.length < 2) return message.reply('Tu dois fournir le **messageID** ET mentionner le **#channel**.');
    const messageId     = firstPartTokens[0];
    const targetChannel = message.mentions.channels.first();
    if (!targetChannel) return message.reply('Mentionne le salon ou se trouve le message.');
    const titre       = parts[1] || 'Reaction Roles';
    const description = parts[2] || 'Reagis pour obtenir un role !';
    let targetMessage;
    try { targetMessage = await targetChannel.messages.fetch(messageId); }
    catch { return message.reply(`Message introuvable avec l'ID \`${messageId}\` dans ${targetChannel}.`); }
    if (reactionRolesData[messageId]) return message.reply('Ce message est deja enregistre comme reaction role.');
    reactionRolesData[messageId] = { channelId: targetChannel.id, titre, description, roles: {}, existingMessage: true }; saveReactionRoles();
    await message.reply(`Message \`${messageId}\` enregistre comme reaction role dans ${targetChannel} !`);
  },

  '!rr-add': async (message, args) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusee.');
    const parts = args.join(' ').split('|').map(s => s.trim());
    if (parts.length < 3) return message.reply('Format : `!rr-add <messageID> | <emoji> | <@role>`');
    const messageId = parts[0]; const emoji = parts[1];
    const role = message.mentions.roles.first();
    if (!role) return message.reply('Mentionne un role valide.');
    if (!reactionRolesData[messageId]) return message.reply(`Message introuvable avec l'ID \`${messageId}\`.`);
    const rrEntry = reactionRolesData[messageId];
    if (rrEntry.roles[emoji]) return message.reply(`L'emoji ${emoji} est deja utilise.`);
    try {
      const targetChannel = await client.channels.fetch(rrEntry.channelId);
      const targetMessage = await targetChannel.messages.fetch(messageId);
      await targetMessage.react(emoji);
      rrEntry.roles[emoji] = role.id; saveReactionRoles();
      if (!rrEntry.existingMessage) await updateRREmbed(targetMessage, rrEntry);
      await message.reply(`${emoji} -> <@&${role.id}> ajoute !`);
    } catch (err) { await message.reply(`Erreur : ${err.message}`); }
  },

  '!rr-remove': async (message, args) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusee.');
    const parts = args.join(' ').split('|').map(s => s.trim());
    if (parts.length < 2) return message.reply('Format : `!rr-remove <messageID> | <emoji>`');
    const [messageId, emoji] = parts;
    if (!reactionRolesData[messageId]) return message.reply(`Message introuvable avec l'ID \`${messageId}\`.`);
    if (!reactionRolesData[messageId].roles[emoji]) return message.reply(`L'emoji ${emoji} n'est pas configure.`);
    try {
      const targetChannel = await client.channels.fetch(reactionRolesData[messageId].channelId);
      const targetMessage = await targetChannel.messages.fetch(messageId);
      const reaction = targetMessage.reactions.cache.find(r => r.emoji.name === emoji);
      if (reaction) await reaction.remove();
      delete reactionRolesData[messageId].roles[emoji]; saveReactionRoles();
      if (!reactionRolesData[messageId].existingMessage) await updateRREmbed(targetMessage, reactionRolesData[messageId]);
      await message.reply(`Emoji ${emoji} retire.`);
    } catch (err) { await message.reply(`Erreur : ${err.message}`); }
  },

  '!rr-list': async (message) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusee.');
    const entries = Object.entries(reactionRolesData);
    if (entries.length === 0) return message.reply('Aucun message de reaction role configure.');
    const fields = entries.map(([msgId, data]) => ({
      name: `${data.existingMessage ? 'Existant' : 'Nouveau'} "${data.titre}" -- \`${msgId}\``,
      value: [`Salon : <#${data.channelId}>`, Object.entries(data.roles).map(([e, r]) => `${e} -> <@&${r}>`).join('\n') || '*Aucun role*'].join('\n'),
      inline: false,
    }));
    await message.reply({ embeds: [embed('#7289DA').setTitle('Reaction Roles configures').addFields(fields)] });
  },

  '!rr-delete': async (message, args) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusee.');
    const messageId = args[0];
    if (!messageId) return message.reply('Format : `!rr-delete <messageID>`');
    if (!reactionRolesData[messageId]) return message.reply(`Message introuvable avec l'ID \`${messageId}\`.`);
    const rrEntry = reactionRolesData[messageId];
    try {
      const targetChannel = await client.channels.fetch(rrEntry.channelId);
      const targetMessage = await targetChannel.messages.fetch(messageId);
      if (rrEntry.existingMessage) {
        for (const emoji of Object.keys(rrEntry.roles)) {
          try { const reaction = targetMessage.reactions.cache.find(r => r.emoji.name === emoji); if (reaction) await reaction.users.remove(client.user.id); } catch {}
        }
      } else { await targetMessage.delete(); }
    } catch { console.warn('[RR-DELETE] Message introuvable ou deja supprime.'); }
    delete reactionRolesData[messageId]; saveReactionRoles();
    await message.reply(rrEntry.existingMessage ? `Config RR retiree du message \`${messageId}\` (message original conserve).` : `Message RR \`${messageId}\` supprime.`);
  },

  // â”€â”€ ETUDES / PUBMED â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!pubmed': async (message) => {
    const fields = [{ name: 'Titre', value: studyData.title || 'Non defini', inline: false }];
    if (studyData.url)   fields.push({ name: 'Lien',        value: studyData.url,           inline: false });
    if (studyData.setBy) fields.push({ name: 'Definie par', value: `<@${studyData.setBy}>`, inline: true  });
    if (studyData.setAt) fields.push({ name: 'Date',        value: studyData.setAt,         inline: true  });
    await message.reply({ embeds: [embed('#00B5D8').setTitle('Derniere etude partagee').setDescription(studyData.description || 'Aucune description.').addFields(fields)] });
  },

  '!def-etude': async (message, args) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusee.');
    const parts = args.join(' ').split('|').map(s => s.trim());
    if (parts.length < 2) return message.reply('Format : `!def-etude <titre> | <url> | <description>`');
    studyData = { title: parts[0] || 'Sans titre', url: parts[1] || '', description: parts[2] || '', setBy: message.author.id, setAt: new Date().toLocaleDateString('fr-FR') };
    saveJSON(FILES.study, studyData);
    await message.reply(`Etude mise a jour : **${studyData.title}**`);
  },

  // â”€â”€ COPE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!cope': async (message) => {
    const copeList        = copesData.cope.length        > 0 ? copesData.cope.map((c, i)        => `${i + 1}. ${c}`).join('\n') : '*Aucun complement.*';
    const interestingList = copesData.interesting.length > 0 ? copesData.interesting.map((c, i) => `${i + 1}. ${c}`).join('\n') : '*Aucun complement.*';
    await message.reply({ embeds: [embed('#FF6B6B').setTitle('Liste des complements').addFields(
      { name: 'COPE (Inutiles)', value: copeList.slice(0, 1024),        inline: false },
      { name: 'Interessants',    value: interestingList.slice(0, 1024), inline: false },
    ).setFooter({ text: `${copesData.cope.length} cope(s) | ${copesData.interesting.length} interessant(s)` })] });
  },

  '!add-cope':        async (message, args) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusee.');
    const name = args.join(' ').trim(); if (!name) return message.reply('Format : `!add-cope <nom>`');
    if (copesData.cope.includes(name)) return message.reply('Deja dans la liste Cope.');
    copesData.cope.push(name); saveJSON(FILES.copes, copesData); await message.reply(`**${name}** ajoute a la liste Cope.`);
  },
  '!add-interesting': async (message, args) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusee.');
    const name = args.join(' ').trim(); if (!name) return message.reply('Format : `!add-interesting <nom>`');
    if (copesData.interesting.includes(name)) return message.reply('Deja dans la liste Interessants.');
    copesData.interesting.push(name); saveJSON(FILES.copes, copesData); await message.reply(`**${name}** ajoute a la liste Interessants.`);
  },
  '!remove-cope':     async (message, args) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusee.');
    const name = args.join(' ').trim(); const idx = copesData.cope.indexOf(name);
    if (idx === -1) return message.reply(`**${name}** introuvable dans Cope.`);
    copesData.cope.splice(idx, 1); saveJSON(FILES.copes, copesData); await message.reply(`**${name}** retire de la liste Cope.`);
  },
  '!remove-interesting': async (message, args) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusee.');
    const name = args.join(' ').trim(); const idx = copesData.interesting.indexOf(name);
    if (idx === -1) return message.reply(`**${name}** introuvable dans Interessants.`);
    copesData.interesting.splice(idx, 1); saveJSON(FILES.copes, copesData); await message.reply(`**${name}** retire de la liste Interessants.`);
  },

  // â”€â”€ REGLES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!regles': async (message) => {
    const rulesList = Object.entries(rulesData).sort(([a], [b]) => Number(a) - Number(b)).map(([n, text]) => `**${n}.** ${text}`).join('\n');
    await message.reply({ embeds: [embed('#FAD961').setTitle('Regles du serveur').setDescription(rulesList || '*Aucune regle definie.*')] });
  },
  '!set-regle': async (message, args) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusee.');
    const parts = args.join(' ').split('|').map(s => s.trim());
    if (parts.length < 2 || isNaN(Number(parts[0]))) return message.reply('Format : `!set-regle <numero> | <texte>`');
    rulesData[parts[0]] = parts[1]; saveJSON(FILES.rules, rulesData); await message.reply(`Regle **${parts[0]}** mise a jour.`);
  },

  // â”€â”€ MODERATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!source': async (message) => {
    if (isAdmin(message.author.id)) return;
    try {
      await message.member.timeout(10 * 60 * 1000, 'Utilisation de !source -- CF : regle 1.');
      await message.reply({ embeds: [embed('#FFA500').setTitle('Mute automatique').setDescription(`<@${message.author.id}> a ete mute pendant 10 minutes.\n\n**CF : regle 1.**`)] });
    } catch (err) { await message.reply(`Impossible de muter : ${err.message}`); }
  },
  '!mk677': async (message) => {
    if (isAdmin(message.author.id)) return;
    try {
      await message.member.timeout(10 * 60 * 1000, 'Utilisation de !mk677 -- CF : regle 1.');
      await message.reply({ embeds: [embed('#FF4444').setTitle('Mute automatique (mk677)').setDescription(`<@${message.author.id}> a ete mute pendant 10 minutes.\n\n**CF : regle 1.**`)] });
    } catch (err) { await message.reply(`Impossible de muter : ${err.message}`); }
  },
  '!ban': async (message, args) => {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return message.reply('Tu n\'as pas la permission de bannir des membres.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('Mentionne un utilisateur a bannir : `!ban @user [raison]`');
    if (target.id === '535857300552810526') return message.reply('âŒ Cet utilisateur ne peut pas Ãªtre banni.');
    if (!target.bannable) return message.reply('Je ne peux pas bannir cet utilisateur.');
    const reason = args.slice(1).join(' ') || 'Aucune raison fournie';
    try {
      await target.ban({ reason: `${message.author.tag}: ${reason}`, deleteMessageSeconds: 604800 });
      await message.reply({ embeds: [embed('#FF4444').setTitle('Utilisateur banni').addFields(
        { name: 'Utilisateur', value: target.user.tag,    inline: true },
        { name: 'Par',         value: message.author.tag, inline: true },
        { name: 'Raison',      value: reason,             inline: false },
      )] });
      await logSanction(message.guild, [
        { name: 'Membre', value: target.user.tag,           inline: true },
        { name: 'Par',    value: `<@${message.author.id}>`, inline: true },
        { name: 'Raison', value: reason,                    inline: false },
      ], `Ban -- ${target.user.tag}`, '#FF0000');
    } catch (err) { await message.reply(`Erreur lors du ban : ${err.message}`); }
  },

  // â”€â”€ FLUIDE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!fluide': async (message) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusee.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('Mentionne un utilisateur : `!fluide @user`');
    const motifs = ['comportement inexplicable detecte', 'neurones dysfonctionnels confirmes', 'coherence logique introuvable', 'ratio subi sans broncher', 'a defendu un cope en public', 'a demande une source', 'a mentionne le MK-677 volontairement', 'analyse biometrique : QI fluide detecte', 'a pris du fenugrec en pensant que ca servait a quelque chose', 'a confondu creatine et steroides pour la 3eme fois'];
    const motif = motifs[Math.floor(Math.random() * motifs.length)];
    await message.reply({ embeds: [embed('#9B59B6').setTitle('Systeme Fluide Active')
      .setDescription(`<@${target.id}> est officiellement passe sous **systeme fluide** pour les prochaines **24h**.\n\nConformement a la regle 3, les insultes et ratios a son encontre sont desormais **autorises et encourages**.`)
      .addFields(
        { name: 'Motif detecte', value: motif,                                  inline: false },
        { name: 'Statut',        value: 'FLUIDE -- Protection sociale retiree',  inline: true  },
        { name: 'Duree estimee', value: '24h (ou jusqu\'a guerison)',           inline: true  },
      ).setFooter({ text: `Decision prise par ${message.author.displayName} -- Systeme Fluide` })] });
  },

  // â”€â”€ IQTEST â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!iqtest': async (message) => {
    const target = message.mentions.members.first() || message.member;
    const base = isAdmin(message.author.id) ? 110 : 90;
    const iq   = Math.floor(base + (Math.random() * 80) - 40);
    let verdict, color;
    if      (iq >= 145) { verdict = 'Genie absolu. Probablement un mensonge.';                  color = '#7289DA'; }
    else if (iq >= 120) { verdict = 'Intelligent. Tu poses quand meme des questions idiotes.';   color = '#00B5D8'; }
    else if (iq >= 100) { verdict = 'Dans la moyenne. C\'est pas glorieux.';                    color = '#FAD961'; }
    else if (iq >= 80)  { verdict = 'En dessous de la moyenne. Ca explique beaucoup.';          color = '#FFA500'; }
    else if (iq >= 60)  { verdict = 'Cliniquement preoccupant. Consulte.';                      color = '#FF4444'; }
    else                { verdict = 'Roche. Tu es une roche.';                                  color = '#FF0000'; }
    await message.reply({ embeds: [embed(color).setTitle(`Resultat IQ -- ${target.displayName}`).addFields(
      { name: 'Score officiel', value: `**${iq} points**`,                               inline: true  },
      { name: 'Percentile',     value: `Top ${Math.max(1, 100 - Math.floor(iq / 2))}%`, inline: true  },
      { name: 'Verdict',        value: verdict,                                           inline: false },
    ).setFooter({ text: 'Certifie par l\'Institut International du Cerveau Fluide' })] });
  },

  // â”€â”€ COPE DU JOUR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!cope-du-jour': async (message) => {
    if (copesData.cope.length === 0) return message.reply('Aucun cope dans la liste. Utilise `!add-cope` pour en ajouter.');
    const random = copesData.cope[Math.floor(Math.random() * copesData.cope.length)];
    const refutations = ['Aucune etude peer-reviewed ne supporte cette affirmation.', 'Des scientifiques ont tente de reproduire ces resultats. Ils pleurent encore.', 'Efficacite prouvee sur 3 personnes dont 2 qui voulaient recuperer leur argent.', 'Le seul effet documente : appauvrissement du portefeuille.', 'Meta-analyse de 0 etudes conclut a l\'absence totale d\'effet.', 'Recommande par des influenceurs fitness. C\'est tout ce qu\'on dira.', 'La FDA, l\'EFSA et ton medecin generaliste ont ri en choeur.', 'Fonctionne tres bien sur des souris. Toi, tu n\'es pas une souris.', 'Approuve par des gens qui vendent aussi des colliers magnetiques.', 'L\'etude citee : un blog wordpress de 2011 sans sources.'];
    const refutation = refutations[Math.floor(Math.random() * refutations.length)];
    await message.reply({ embeds: [embed('#FF6B6B').setTitle('Cope du jour').addFields(
      { name: 'Produit du jour',   value: `**${random}**`, inline: false },
      { name: 'Avis scientifique', value: refutation,      inline: false },
    ).setFooter({ text: 'Base sur des donnees solides. Tres solides. Betonnees.' })] });
  },

  // â”€â”€ MOMMY ASMR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!mommy-asmr': async (message) => {
    if (!CONFIG.MOMMY_ASMR_USER_IDS.includes(message.author.id)) return message.reply('Permission refusee.');
    try {
      await message.channel.send({ content: 'Mommy ASMR en approche...', files: [CONFIG.MOMMY_ASMR_FILE_URL] });
    } catch (err) { await message.reply(`Echec envoi ASMR : ${err.message}`); }
  },

  // ============================================================
  //  VÃ‰RIFICATION MANUELLE â€” COMMANDES ADMIN
  // ============================================================

  /**
   * !verif-setup
   * Guide l'admin pour configurer le systÃ¨me de vÃ©rification
   */
  '!verif-setup': async (message, args) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusÃ©e.');

    const parts = args.join(' ').split('|').map(s => s.trim());

    // Mode affichage si pas d'args
    if (parts.length < 4 || !parts[0]) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#00C851')
          .setTitle('âš™ï¸ Configuration VÃ©rification â€” Assistant')
          .setDescription(
            'Pour configurer le systÃ¨me, utilise :\n' +
            '```\n!verif-setup @role-pending | @role-approuvÃ© | #channel-verif | #channel-log-admin\n```\n\n' +
            '**Explications :**\n' +
            'â€¢ `@role-pending` â€” RÃ´le donnÃ© aprÃ¨s rÃ©action (accÃ¨s limitÃ©)\n' +
            'â€¢ `@role-approuvÃ©` â€” RÃ´le donnÃ© aprÃ¨s approbation admin (accÃ¨s complet)\n' +
            'â€¢ `#channel-verif` â€” Salon oÃ¹ le membre attend sa vÃ©rif\n' +
            'â€¢ `#channel-log-admin` â€” Salon privÃ© admin oÃ¹ arrivent les demandes\n\n' +
            '**Config actuelle :**\n' +
            `â€¢ RÃ´le pending : ${verifConfig.pendingRoleId  ? `<@&${verifConfig.pendingRoleId}>`  : '`non dÃ©fini`'}\n` +
            `â€¢ RÃ´le approuvÃ© : ${verifConfig.approvedRoleId ? `<@&${verifConfig.approvedRoleId}>` : '`non dÃ©fini`'}\n` +
            `â€¢ Channel vÃ©rif : ${verifConfig.verifChannelId ? `<#${verifConfig.verifChannelId}>` : '`non dÃ©fini`'}\n` +
            `â€¢ Channel log : ${verifConfig.logChannelId    ? `<#${verifConfig.logChannelId}>`   : '`non dÃ©fini`'}\n` +
            `â€¢ Statut : ${verifConfig.enabled ? 'âœ… **ACTIVÃ‰**' : 'âŒ **DÃ‰SACTIVÃ‰**'}`
          )
          .setFooter({ text: 'AprÃ¨s configuration, utilise !verif-enable pour activer' })],
      });
    }

    // Extraction des roles et channels depuis les mentions
    const roles    = message.mentions.roles;
    const channels = message.mentions.channels;

    if (roles.size < 2) return message.reply('Tu dois mentionner **2 rÃ´les** : `@role-pending` et `@role-approuvÃ©`.');
    if (channels.size < 2) return message.reply('Tu dois mentionner **2 channels** : `#channel-verif` et `#channel-log-admin`.');

    const rolesArr    = [...roles.values()];
    const channelsArr = [...channels.values()];

    verifConfig.pendingRoleId  = rolesArr[0].id;
    verifConfig.approvedRoleId = rolesArr[1].id;
    verifConfig.verifChannelId = channelsArr[0].id;
    verifConfig.logChannelId   = channelsArr[1].id;
    saveVerifConfig();

    await message.reply({
      embeds: [new EmbedBuilder()
        .setColor('#00C851')
        .setTitle('âœ… VÃ©rification configurÃ©e')
        .addFields(
          { name: 'RÃ´le pending',   value: `<@&${verifConfig.pendingRoleId}>`,  inline: true },
          { name: 'RÃ´le approuvÃ©',  value: `<@&${verifConfig.approvedRoleId}>`, inline: true },
          { name: '\u200b',         value: '\u200b',                             inline: true },
          { name: 'Channel vÃ©rif',  value: `<#${verifConfig.verifChannelId}>`,  inline: true },
          { name: 'Channel log',    value: `<#${verifConfig.logChannelId}>`,    inline: true },
          { name: '\u200b',         value: '\u200b',                             inline: true },
        )
        .setDescription(
          'âš ï¸ **Pense aussi Ã  :**\n' +
          `1. Mettre Ã  jour \`CONFIG.REACTION_ROLE.ROLE_ID\` avec l'ID du rÃ´le pending : \`${verifConfig.pendingRoleId}\`\n` +
          '2. Utiliser `!verif-enable` pour activer le systÃ¨me\n' +
          '3. Configurer les permissions du channel vÃ©rif pour que seul le rÃ´le pending puisse le voir'
        )
        .setFooter({ text: 'SystÃ¨me prÃªt Â· Utilise !verif-enable pour activer' })],
    });
  },

  '!verif-config': async (message) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusÃ©e.');
    const pendingCount = Object.keys(pendingVerifs).length;
    const blCount      = Object.keys(blacklistData).length;
    await message.reply({
      embeds: [new EmbedBuilder()
        .setColor(verifConfig.enabled ? '#00C851' : '#FF4444')
        .setTitle(`ðŸ” Config VÃ©rification â€” ${verifConfig.enabled ? 'âœ… ACTIVÃ‰' : 'âŒ DÃ‰SACTIVÃ‰'}`)
        .addFields(
          { name: 'RÃ´le pending',         value: verifConfig.pendingRoleId  ? `<@&${verifConfig.pendingRoleId}>`  : '`non dÃ©fini`', inline: true },
          { name: 'RÃ´le approuvÃ©',        value: verifConfig.approvedRoleId ? `<@&${verifConfig.approvedRoleId}>` : '`non dÃ©fini`', inline: true },
          { name: '\u200b',               value: '\u200b', inline: true },
          { name: 'Channel vÃ©rif',        value: verifConfig.verifChannelId ? `<#${verifConfig.verifChannelId}>` : '`non dÃ©fini`', inline: true },
          { name: 'Channel log admin',    value: verifConfig.logChannelId   ? `<#${verifConfig.logChannelId}>`   : '`non dÃ©fini`', inline: true },
          { name: '\u200b',               value: '\u200b', inline: true },
          { name: 'â³ En attente',        value: `${pendingCount} membre(s)`, inline: true },
          { name: 'ðŸš« BlacklistÃ©s',       value: `${blCount} entrÃ©e(s)`,      inline: true },
        )
        .setFooter({ text: '!verif-enable / !verif-disable Â· !verif-setup pour reconfigurer' })],
    });
  },

  '!verif-enable': async (message) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusÃ©e.');
    if (!verifConfig.pendingRoleId || !verifConfig.approvedRoleId || !verifConfig.logChannelId) {
      return message.reply('âŒ Configure d\'abord le systÃ¨me avec `!verif-setup` avant de l\'activer.');
    }
    verifConfig.enabled = true; saveVerifConfig();
    await message.reply('âœ… SystÃ¨me de vÃ©rification **activÃ©**. Les nouvelles rÃ©actions dÃ©clencheront le flux de vÃ©rification manuelle.');
  },

  '!verif-disable': async (message) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusÃ©e.');
    verifConfig.enabled = false; saveVerifConfig();
    await message.reply('âŒ SystÃ¨me de vÃ©rification **dÃ©sactivÃ©**. Le comportement par dÃ©faut (rÃ´le direct) est restaurÃ©.');
  },

  // â”€â”€ WHITELIST / BLACKLIST â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!whitelist': async (message) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusÃ©e.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('Mentionne un utilisateur : `!whitelist @user`');

    if (!verifConfig.approvedRoleId) return message.reply('RÃ´le approuvÃ© non configurÃ©. Utilise `!verif-setup`.');

    const approvedRole = message.guild.roles.cache.get(verifConfig.approvedRoleId);
    if (!approvedRole) return message.reply(`RÃ´le approuvÃ© introuvable (ID: \`${verifConfig.approvedRoleId}\`).`);

    try {
      // Ajouter le rÃ´le approuvÃ©
      await target.roles.add(approvedRole, `Approbation manuelle par ${message.author.tag}`);

      // Retirer le rÃ´le pending si prÃ©sent
      if (verifConfig.pendingRoleId && target.roles.cache.has(verifConfig.pendingRoleId)) {
        const pendingRole = message.guild.roles.cache.get(verifConfig.pendingRoleId);
        if (pendingRole) await target.roles.remove(pendingRole, 'VÃ©rification approuvÃ©e').catch(() => {});
      }

      // DÃ©sactiver les boutons du message de log
      await disableVerifButtons(message.guild, target.id, 'approved');
      delete pendingVerifs[target.id]; savePendingVerifs();

      await message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#00C851')
          .setTitle('âœ… Membre approuvÃ©')
          .setDescription(`<@${target.id}> a Ã©tÃ© approuvÃ© manuellement et a maintenant accÃ¨s au serveur.`)
          .addFields(
            { name: 'RÃ´le attribuÃ©', value: `<@&${verifConfig.approvedRoleId}>`, inline: true },
            { name: 'Par',           value: `<@${message.author.id}>`,           inline: true },
          )],
      });

      // Notifier le membre dans le channel vÃ©rif si configurÃ©
      if (verifConfig.verifChannelId) {
        const verifCh = message.guild.channels.cache.get(verifConfig.verifChannelId);
        if (verifCh) {
          await verifCh.send({
            content: `<@${target.id}>`,
            embeds: [new EmbedBuilder()
              .setColor('#00C851')
              .setTitle('âœ… VÃ©rification approuvÃ©e !')
              .setDescription('Tu as Ã©tÃ© vÃ©rifiÃ© et tu as maintenant accÃ¨s au serveur. Bienvenue ! ðŸŽ‰')],
          }).catch(() => {});
        }
      }
    } catch (err) { await message.reply(`Erreur : ${err.message}`); }
  },

  '!blacklist': async (message, args) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusÃ©e.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('Mentionne un utilisateur : `!blacklist @user [raison]`');
    if (isAdmin(target.id)) return message.reply('Impossible de blacklister un admin.');

    const reason = args.slice(1).join(' ') || 'Aucune raison fournie';

    blacklistData[target.id] = {
      tag:    target.user.tag,
      reason,
      by:     message.author.id,
      at:     new Date().toISOString(),
    };
    saveBlacklist();

    // DÃ©sactiver les boutons de log si en attente
    await disableVerifButtons(message.guild, target.id, 'blacklisted');
    delete pendingVerifs[target.id]; savePendingVerifs();

    try {
      await target.kick(`Blacklist par ${message.author.tag} : ${reason}`);
    } catch (err) {
      console.warn('[BLACKLIST] Impossible de kick :', err.message);
    }

    await message.reply({
      embeds: [new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('ðŸš« Membre blacklistÃ© & kickÃ©')
        .addFields(
          { name: 'Membre', value: `${target.user.tag} (${target.id})`, inline: false },
          { name: 'Raison', value: reason,                               inline: false },
          { name: 'Par',    value: `<@${message.author.id}>`,           inline: true },
        )
        .setFooter({ text: 'Il sera bloquÃ© automatiquement s\'il tente de rejoindre Ã  nouveau' })],
    });
    await logSanction(message.guild, [
      { name: 'Membre', value: target.user.tag,           inline: true },
      { name: 'Par',    value: `<@${message.author.id}>`, inline: true },
      { name: 'Raison', value: reason,                    inline: false },
    ], `Blacklist â€” ${target.user.tag}`, '#FF0000');
  },

  '!unblacklist': async (message) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusÃ©e.');
    const target = message.mentions.users.first();
    if (!target) return message.reply('Mentionne un utilisateur : `!unblacklist @user`');

    if (!blacklistData[target.id]) return message.reply(`<@${target.id}> n'est pas dans la blacklist.`);

    const entry = blacklistData[target.id];
    delete blacklistData[target.id]; saveBlacklist();

    await message.reply({
      embeds: [new EmbedBuilder()
        .setColor('#00C851')
        .setTitle('âœ… Blacklist levÃ©e')
        .addFields(
          { name: 'Membre',            value: entry.tag || target.tag, inline: true },
          { name: 'Par',               value: `<@${message.author.id}>`, inline: true },
          { name: 'Raison initiale',   value: entry.reason,              inline: false },
          { name: 'BlacklistÃ© le',     value: new Date(entry.at).toLocaleString('fr-FR'), inline: false },
        )
        .setFooter({ text: 'Il pourra rejoindre Ã  nouveau et sera soumis Ã  la vÃ©rification normale' })],
    });
  },

  '!blacklist-list': async (message) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusÃ©e.');
    const entries = Object.entries(blacklistData);
    if (entries.length === 0) return message.reply('La blacklist est vide. âœ…');

    const fields = entries.slice(0, 25).map(([userId, data]) => ({
      name: `${data.tag || userId} Â· \`${userId}\``,
      value: `Raison : ${data.reason}\nPar <@${data.by}> le ${new Date(data.at).toLocaleDateString('fr-FR')}`,
      inline: false,
    }));

    await message.reply({
      embeds: [new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle(`ðŸš« Blacklist â€” ${entries.length} entrÃ©e(s)`)
        .addFields(fields)
        .setFooter({ text: entries.length > 25 ? `Affiche 25/${entries.length} entrÃ©es` : `${entries.length} entrÃ©e(s) au total` })],
    });
  },

  '!pending-list': async (message) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusÃ©e.');
    const entries = Object.entries(pendingVerifs);
    if (entries.length === 0) return message.reply('Aucune vÃ©rification en attente. âœ…');

    const fields = entries.slice(0, 25).map(([userId, data]) => ({
      name: `${data.tag} Â· \`${userId}\``,
      value: `Demande reÃ§ue le ${new Date(data.requestedAt).toLocaleString('fr-FR')}\n[Voir le message](https://discord.com/channels/${message.guild.id}/${data.logChannelId}/${data.logMessageId})`,
      inline: false,
    }));

    await message.reply({
      embeds: [new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle(`â³ VÃ©rifications en attente â€” ${entries.length}`)
        .addFields(fields)
        .setFooter({ text: 'Utilise les boutons dans le channel log pour traiter chaque demande' })],
    });
  },

  // ============================================================
  //  RATING GYMGIRL â€” SYSTÃˆME ELO
  // ============================================================

  '!rate': async (message) => {
    if (!hasRatingRole(message.member)) {
      return message.reply('Tu n\'as pas le rÃ´le requis pour utiliser le rating. Demande Ã  un admin avec `!give-rating @toi`.');
    }

    const db = await getGymgirls();
    const girls = db.girls || [];

    if (girls.length < 2) {
      return message.reply('Pas assez de gymgirls dans la base (minimum 2). Un admin peut en ajouter avec `!rate-add <nom> | <url>`.');
    }

    if (db.activeVotes && db.activeVotes[message.channel.id]) {
      return message.reply('Un vote est dÃ©jÃ  en cours dans ce salon. Attends la fin ou que le timer expire (5 min).');
    }

    const shuffled = [...girls].sort(() => Math.random() - 0.5);
    const girlA    = shuffled[0];
    const girlB    = shuffled[1];
    const voteId   = Date.now().toString(36);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`rate_${voteId}_A`)
        .setLabel('â¬…ï¸  Elle')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`rate_${voteId}_skip`)
        .setLabel('â­ï¸  Skip')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`rate_${voteId}_B`)
        .setLabel('Elle  âž¡ï¸')
        .setStyle(ButtonStyle.Danger),
    );

    const headerEmbed = new EmbedBuilder()
      .setColor('#FF6B9D')
      .setTitle('âš¡ Qui a le meilleur physique ?')
      .setDescription(
        `**${girlA.name}** \`ELO ${girlA.elo}\`  vs  **${girlB.name}** \`ELO ${girlB.elo}\`\n\n` +
        `Clique sur un bouton pour voter â€” le rÃ©sultat met Ã  jour le classement ELO en temps rÃ©el.\n` +
        `Plusieurs membres peuvent voter sur le mÃªme duel.`
      )
      .setFooter({ text: `Vote lancÃ© par ${message.author.displayName} Â· Expire dans 5 min` })
      .setTimestamp();

    await message.channel.send({ embeds: [headerEmbed] });

    await message.channel.send({ content: `â¬…ï¸  **${girlA.name}**`, files: [girlA.imageUrl] })
      .catch(() => message.channel.send({ content: `â¬…ï¸  **${girlA.name}** â€” ${girlA.imageUrl}` }));

    await message.channel.send({ content: `âž¡ï¸  **${girlB.name}**`, files: [girlB.imageUrl] })
      .catch(() => message.channel.send({ content: `âž¡ï¸  **${girlB.name}** â€” ${girlB.imageUrl}` }));

    const voteMsg = await message.channel.send({ components: [row] });

    if (!db.activeVotes) db.activeVotes = {};
    db.activeVotes[message.channel.id] = {
      voteId,
      channelId:   message.channel.id,
      messageId:   voteMsg.id,
      girlAId:     girlA.id,
      girlBId:     girlB.id,
      votedUsers:  [],
      createdAt:   Date.now(),
    };
    await saveGymgirls(db);

    setTimeout(async () => {
      try {
        const fresh = await getGymgirls();
        if (!fresh.activeVotes?.[message.channel.id] || fresh.activeVotes[message.channel.id].voteId !== voteId) return;
        delete fresh.activeVotes[message.channel.id];
        await saveGymgirls(fresh);

        const msg = await message.channel.messages.fetch(voteMsg.id).catch(() => null);
        if (msg) {
          const expiredRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('rate_expired_A').setLabel('â¬…ï¸ Elle').setStyle(ButtonStyle.Secondary).setDisabled(true),
            new ButtonBuilder().setCustomId('rate_expired_skip').setLabel('â­ï¸ Skip').setStyle(ButtonStyle.Secondary).setDisabled(true),
            new ButtonBuilder().setCustomId('rate_expired_B').setLabel('Elle âž¡ï¸').setStyle(ButtonStyle.Secondary).setDisabled(true),
          );
          await msg.edit({ components: [expiredRow] }).catch(() => {});
        }

        await message.channel.send({
          embeds: [new EmbedBuilder().setColor('#888888').setTitle('â±ï¸ Vote expirÃ©')
            .setDescription(`Le duel **${girlA.name}** vs **${girlB.name}** a expirÃ© sans vainqueur.`)],
        }).catch(() => {});
      } catch (err) { console.error('[RATE] Erreur expiration :', err.message); }
    }, 5 * 60 * 1000);
  },

  '!rate-top': async (message) => {
    if (!hasRatingRole(message.member)) return message.reply('Tu n\'as pas le rÃ´le requis.');
    const db     = await getGymgirls();
    const girls  = db.girls || [];
    if (girls.length === 0) return message.reply('Aucune gymgirl dans la base de donnÃ©es.');

    const sorted  = [...girls].sort((a, b) => b.elo - a.elo);
    const medals  = ['ðŸ¥‡', 'ðŸ¥ˆ', 'ðŸ¥‰'];
    const fields  = sorted.slice(0, 10).map((g, i) => {
      const total   = g.wins + g.losses;
      const winrate = total > 0 ? Math.round(g.wins / total * 100) : 0;
      return {
        name:   `${medals[i] || `#${i + 1}`}  ${g.name}`,
        value:  `ELO **${g.elo}** Â· ${g.wins}V / ${g.losses}D Â· Win rate ${winrate}%`,
        inline: false,
      };
    });

    await message.reply({
      embeds: [new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('ðŸ† Classement Gymgirl â€” Top 10')
        .addFields(fields)
        .setFooter({ text: `${girls.length} athlÃ¨te(s) dans la base Â· SystÃ¨me ELO (K=32)` })
        .setTimestamp()],
    });
  },

  '!rate-list': async (message) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusÃ©e.');
    const db    = await getGymgirls();
    const girls = db.girls || [];
    if (girls.length === 0) return message.reply('Aucune gymgirl dans la base.');
    const sorted = [...girls].sort((a, b) => b.elo - a.elo);
    const list   = sorted.map((g, i) => `\`${String(i + 1).padStart(2, '0')}\` **${g.name}** Â· ELO ${g.elo} Â· ${g.wins}V/${g.losses}D Â· ID \`${g.id}\``).join('\n');
    await message.reply({
      embeds: [new EmbedBuilder()
        .setColor('#7289DA')
        .setTitle(`ðŸ“‹ Liste complÃ¨te â€” ${girls.length} gymgirl(s)`)
        .setDescription(list.slice(0, 4096))
        .setFooter({ text: 'Base de donnÃ©es : JSONBin.io Â· !rate-add / !rate-remove pour gÃ©rer' })],
    });
  },

  '!rate-add': async (message, args) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusÃ©e.');
    const parts = args.join(' ').split('|').map(s => s.trim());
    if (parts.length < 2) return message.reply('Format : `!rate-add <nom> | <url_image>`');
    const [name, imageUrl] = parts;
    if (!imageUrl.startsWith('http')) return message.reply('L\'URL doit commencer par `http`.');

    const db    = await getGymgirls();
    const girls = db.girls || [];

    if (girls.find(g => g.name.toLowerCase() === name.toLowerCase())) {
      return message.reply(`**${name}** est dÃ©jÃ  dans la base.`);
    }

    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    girls.push({ id, name, imageUrl, elo: 1000, wins: 0, losses: 0 });
    db.girls = girls;
    await saveGymgirls(db);

    await message.reply({
      embeds: [new EmbedBuilder()
        .setColor('#00FF66')
        .setTitle('Gymgirl ajoutÃ©e âœ…')
        .addFields(
          { name: 'Nom',      value: name,          inline: true },
          { name: 'ELO init', value: '1000',         inline: true },
          { name: 'ID',       value: `\`${id}\``,    inline: true },
        )
        .setThumbnail(imageUrl)
        .setFooter({ text: 'SauvegardÃ© sur JSONBin.io' })],
    });
  },

  '!rate-remove': async (message, args) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusÃ©e.');
    const name = args.join(' ').trim();
    if (!name) return message.reply('Format : `!rate-remove <nom>`');

    const db    = await getGymgirls();
    const girls = db.girls || [];
    const idx   = girls.findIndex(g => g.name.toLowerCase() === name.toLowerCase());
    if (idx === -1) return message.reply(`**${name}** introuvable dans la base.`);

    const [removed] = girls.splice(idx, 1);
    db.girls = girls;
    await saveGymgirls(db);
    await message.reply(`**${removed.name}** retirÃ©e. ELO final : **${removed.elo}** (${removed.wins}V / ${removed.losses}D).`);
  },

  '!rate-reset': async (message, args) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusÃ©e.');
    const name = args.join(' ').trim();
    if (!name) return message.reply('Format : `!rate-reset <nom>`');

    const db    = await getGymgirls();
    const girl  = (db.girls || []).find(g => g.name.toLowerCase() === name.toLowerCase());
    if (!girl) return message.reply(`**${name}** introuvable.`);

    girl.elo = 1000; girl.wins = 0; girl.losses = 0;
    await saveGymgirls(db);
    await message.reply(`ELO de **${girl.name}** rÃ©initialisÃ© Ã  1000.`);
  },

  // â”€â”€ GIVE-RATING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!give-rating': async (message) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusÃ©e.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('Mentionne un utilisateur : `!give-rating @user`');

    const role = message.guild.roles.cache.get(CONFIG.RATING_ROLE_ID);
    if (!role) return message.reply(`RÃ´le introuvable (ID : \`${CONFIG.RATING_ROLE_ID}\`). VÃ©rifie la config.`);

    if (target.roles.cache.has(CONFIG.RATING_ROLE_ID)) {
      await target.roles.remove(role, `Rating role retirÃ© par ${message.author.tag}`);
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#FF4444')
          .setTitle('RÃ´le Rating retirÃ©')
          .setDescription(`<@${target.id}> n'a plus accÃ¨s au systÃ¨me de rating.`)
          .addFields({ name: 'Par', value: `<@${message.author.id}>`, inline: true })],
      });
    }

    await target.roles.add(role, `Rating role donnÃ© par ${message.author.tag}`);
    await message.reply({
      embeds: [new EmbedBuilder()
        .setColor('#00FF66')
        .setTitle('RÃ´le Rating attribuÃ© âœ…')
        .setDescription(`<@${target.id}> a dÃ©sormais accÃ¨s au systÃ¨me de rating gymgirl.`)
        .addFields(
          { name: 'RÃ´le',  value: `<@&${CONFIG.RATING_ROLE_ID}>`,  inline: true },
          { name: 'Par',   value: `<@${message.author.id}>`,        inline: true },
        )
        .setFooter({ text: 'Il peut maintenant utiliser !rate et !rate-top' })],
    });
  },

  // â”€â”€ LIVE (vÃ©rification manuelle TikTok) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!live': async (message) => {
    const statusMsg = await message.reply({ embeds: [embed('#FF0050').setTitle('VÃ©rification TikTok en cours...').setDescription(`Interrogation de TikTok pour **@${CONFIG.TIKTOK_USERNAME}**...`)] });
    try {
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Mode': 'navigate',
      };
      const response = await axios.get(`https://www.tiktok.com/@${CONFIG.TIKTOK_USERNAME}/live`, { headers, timeout: 15000, maxRedirects: 5 });
      const html = response.data;
      const patterns = [
        /"statusStr"\s*:\s*"LIVE_STATUS_STREAMING"/.test(html),
        /"isLiveStreaming"\s*:\s*true/.test(html),
        /"liveRoomInfo"/.test(html) && /"status"\s*:\s*2/.test(html),
        /roomid[^"]*"[^"]{5,}/.test(html) && !/redirectUrl/.test(html),
        /"liveUrl"/.test(html) && !/"liveUrl"\s*:\s*""/.test(html),
      ];
      const positiveSignals = patterns.filter(Boolean).length;
      const isLive = positiveSignals >= 2;
      const color = isLive ? '#FF0050' : '#95A5A6';
      const statusText = isLive ? 'ðŸ”´ EN LIVE ACTUELLEMENT' : 'âš« Pas en live';
      const e = embed(color)
        .setTitle(`TikTok Live â€” @${CONFIG.TIKTOK_USERNAME}`)
        .setDescription(`**Statut :** ${statusText}`)
        .addFields(
          { name: 'Signaux dÃ©tectÃ©s', value: `${positiveSignals}/5`, inline: true },
          { name: 'Lien', value: `https://www.tiktok.com/@${CONFIG.TIKTOK_USERNAME}/live`, inline: false },
        )
        .setThumbnail(`https://unavatar.io/tiktok/${CONFIG.TIKTOK_USERNAME}`)
        .setFooter({ text: `VÃ©rifiÃ© manuellement par ${message.author.tag}` });
      await statusMsg.edit({ embeds: [e] });
    } catch (err) {
      await statusMsg.edit({ embeds: [embed('#FF4444').setTitle('Erreur de vÃ©rification').setDescription(`Impossible de contacter TikTok : \`${err.message}\``)] });
    }
  },

  // â”€â”€ STATS @user â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!stats': async (message) => {
    const target = message.mentions.members.first() || message.member;
    const userId = target.id;
    const warns = warnsData[userId]?.length || 0;
    const isJailed = !!jailsData[userId];
    const isNpc = !!npcList[userId];
    const isTf = !!tfList[userId];
    const isBlacklisted = !!blacklistData[userId];
    const ageDays = Math.floor((Date.now() - (Number(BigInt(userId) >> 22n) + 1420070400000)) / 86400000);
    const joinedTs = target.joinedAt ? `<t:${Math.floor(target.joinedAt.getTime() / 1000)}:D>` : 'Inconnu';
    const createdTs = `<t:${Math.floor((Number(BigInt(userId) >> 22n) + 1420070400000) / 1000)}:D>`;
    const roles = target.roles.cache.filter(r => r.id !== message.guild.id).map(r => `<@&${r.id}>`).join(', ') || '*Aucun*';

    const statusFlags = [];
    if (isJailed)      statusFlags.push('ðŸ”’ En jail');
    if (isNpc)         statusFlags.push('ðŸ¤– NPC actif');
    if (isTf)          statusFlags.push('ðŸ“› TF actif');
    if (isBlacklisted) statusFlags.push('ðŸš« BlacklistÃ©');
    if (isAdmin(userId)) statusFlags.push('âš¡ Admin');
    if (statusFlags.length === 0) statusFlags.push('âœ… Normal');

    const color = isJailed ? '#FF4444' : warns >= 2 ? '#FFA500' : '#5865F2';
    await message.reply({ embeds: [embed(color)
      .setTitle(`Profil â€” ${target.displayName}`)
      .setThumbnail(target.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: 'ðŸ‘¤ IdentitÃ©',       value: `${target.user.tag}\nID : \`${userId}\``,             inline: true  },
        { name: 'ðŸ“… ArrivÃ©e',        value: `Serveur : ${joinedTs}\nCompte : ${createdTs}`,        inline: true  },
        { name: 'âš ï¸ Warns',          value: `**${warns}/3**`,                                      inline: true  },
        { name: 'ðŸš¨ Statut actuel',  value: statusFlags.join('\n'),                                inline: true  },
        { name: `ðŸŽ­ RÃ´les (${target.roles.cache.size - 1})`, value: roles.slice(0, 1024),          inline: false },
      )
      .setFooter({ text: `Compte vieux de ${ageDays} jours` })
    ] });
  },

  // â”€â”€ SONDAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!sondage': async (message, args) => {
    const parts = args.join(' ').split('|').map(s => s.trim()).filter(Boolean);
    if (parts.length < 3) return message.reply('Format : `!sondage <question> | <option1> | <option2> | [option3] | [option4]`\nMinimum 2 options, maximum 4.');
    const [question, ...options] = parts;
    if (options.length > 4) return message.reply('Maximum 4 options.');

    const emojis = ['1ï¸âƒ£', '2ï¸âƒ£', '3ï¸âƒ£', '4ï¸âƒ£'];
    const votes = options.map(() => 0);
    const voters = {};

    const buildEmbed = (voteData) => {
      const total = voteData.reduce((a, b) => a + b, 0);
      const fields = options.map((opt, i) => {
        const pct = total > 0 ? Math.round(voteData[i] / total * 100) : 0;
        const bar = 'â–ˆ'.repeat(Math.floor(pct / 10)) + 'â–‘'.repeat(10 - Math.floor(pct / 10));
        return { name: `${emojis[i]} ${opt}`, value: `${bar} **${pct}%** (${voteData[i]} vote${voteData[i] !== 1 ? 's' : ''})`, inline: false };
      });
      return embed('#5865F2')
        .setTitle(`ðŸ“Š ${question}`)
        .addFields(fields)
        .setFooter({ text: `${total} vote${total !== 1 ? 's' : ''} Â· Sondage lancÃ© par ${message.author.tag}` });
    };

    const row = new ActionRowBuilder().addComponents(
      options.map((opt, i) =>
        new ButtonBuilder()
          .setCustomId(`sondage_${i}`)
          .setLabel(`${emojis[i]} ${opt.slice(0, 50)}`)
          .setStyle(ButtonStyle.Primary)
      )
    );

    try { await message.delete(); } catch {}
    const sondageMsg = await message.channel.send({ embeds: [buildEmbed(votes)], components: [row] });
    activeSondages[sondageMsg.id] = { question, options, votes, voters, buildEmbed, authorTag: message.author.tag };
  },

  // â”€â”€ UNJAIL @user â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!unjail': async (message) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusÃ©e.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('Mentionne un utilisateur : `!unjail @user`');

    const jailData = jailsData[target.id];
    if (!jailData) return message.reply(`<@${target.id}> n'est pas en jail actuellement.`);

    try {
      const savedRoleIds = jailData.savedRoleIds || [];
      await unjailMember(target, savedRoleIds, `Liberation manuelle par ${message.author.tag}`);
      delete jailsData[target.id]; saveJails();

      const prisonChannel = message.guild.channels.cache.get(CONFIG.JAIL_PRISON_CHANNEL_ID);
      if (prisonChannel) {
        await prisonChannel.send({ embeds: [embed('#00FF66').setTitle('LibÃ©rÃ© !').setDescription(`<@${target.id}> a Ã©tÃ© libÃ©rÃ© manuellement par <@${message.author.id}>. Ses rÃ´les ont Ã©tÃ© restaurÃ©s.`)] });
      }
      await message.reply({ embeds: [embed('#00FF66')
        .setTitle('Jail levÃ©')
        .setDescription(`<@${target.id}> a Ã©tÃ© libÃ©rÃ© avant la fin de sa peine.`)
        .addFields(
          { name: 'LibÃ©rÃ© par',    value: `<@${message.author.id}>`,   inline: true },
          { name: 'RÃ´les rendus',  value: `${savedRoleIds.length}`,    inline: true },
        )
      ] });
      await logSanction(message.guild, [
        { name: 'Membre',    value: `<@${target.id}>`,          inline: true },
        { name: 'Par',       value: `<@${message.author.id}>`,  inline: true },
        { name: 'Motif',     value: 'Liberation manuelle',      inline: false },
      ], `Unjail â€” ${target.user.tag}`, '#00FF66');
    } catch (err) {
      await message.reply(`Erreur lors de la libÃ©ration : ${err.message}`);
    }
  },

  // â”€â”€ SET-COPE-BULK â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!set-cope-bulk': async (message, args) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusÃ©e.');
    // Format : !set-cope-bulk cope | item1, item2, item3
    //      ou  !set-cope-bulk interesting | item1, item2
    const joined = args.join(' ');
    const pipeIdx = joined.indexOf('|');
    if (pipeIdx === -1) return message.reply('Format : `!set-cope-bulk <cope|interesting> | item1, item2, item3`');

    const type  = joined.slice(0, pipeIdx).trim().toLowerCase();
    const items = joined.slice(pipeIdx + 1).split(',').map(s => s.trim()).filter(Boolean);

    if (!['cope', 'interesting'].includes(type)) return message.reply('Type invalide. Utilise `cope` ou `interesting`.');
    if (items.length === 0) return message.reply('Aucun Ã©lÃ©ment fourni aprÃ¨s le `|`.');

    const list = copesData[type];
    let added = 0; const skipped = [];
    for (const item of items) {
      if (list.includes(item)) { skipped.push(item); continue; }
      list.push(item); added++;
    }
    saveJSON(FILES.copes, copesData);

    await message.reply({ embeds: [embed('#00FF66')
      .setTitle(`Import en masse â€” ${type === 'cope' ? 'COPE' : 'IntÃ©ressants'}`)
      .addFields(
        { name: 'âœ… AjoutÃ©s',  value: `${added} Ã©lÃ©ment(s)`,                                      inline: true },
        { name: 'â­ï¸ IgnorÃ©s', value: `${skipped.length} (dÃ©jÃ  prÃ©sents)`,                         inline: true },
        { name: 'Total liste', value: `${list.length} Ã©lÃ©ment(s)`,                                 inline: true },
        { name: 'Ã‰lÃ©ments ajoutÃ©s', value: items.filter(i => !skipped.includes(i)).map(i => `â€¢ ${i}`).join('\n').slice(0, 1024) || '*Aucun*', inline: false },
      )
    ] });
  },

  // â”€â”€ MUTE @user <durÃ©e en minutes> â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!mute': async (message, args) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusÃ©e.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('Format : `!mute @user <durÃ©e en minutes> [raison]`');
    if (isAdmin(target.id)) return message.reply('Tu ne peux pas muter un admin.');

    const durationMin = parseInt(args[1]);
    if (isNaN(durationMin) || durationMin < 1 || durationMin > 40320) {
      return message.reply('DurÃ©e invalide. Indique un nombre de minutes entre 1 et 40320 (28 jours max).');
    }
    const reason = args.slice(2).join(' ') || 'Aucune raison fournie';
    const durationMs = durationMin * 60 * 1000;

    try {
      await target.timeout(durationMs, `${message.author.tag} : ${reason}`);
      await message.reply({ embeds: [embed('#FFA500')
        .setTitle('Membre mutÃ©')
        .setDescription(`<@${target.id}> a Ã©tÃ© mis en timeout.`)
        .addFields(
          { name: 'DurÃ©e',  value: `${durationMin} minute${durationMin > 1 ? 's' : ''}`, inline: true },
          { name: 'Par',    value: `<@${message.author.id}>`,                             inline: true },
          { name: 'Raison', value: reason,                                                inline: false },
        )
        .setFooter({ text: `LevÃ©e automatique dans ${durationMin} min` })
      ] });
      await logSanction(message.guild, [
        { name: 'Membre', value: `<@${target.id}>`,          inline: true },
        { name: 'Par',    value: `<@${message.author.id}>`,  inline: true },
        { name: 'DurÃ©e',  value: `${durationMin} min`,        inline: true },
        { name: 'Raison', value: reason,                      inline: false },
      ], `Mute â€” ${target.user.tag}`, '#FFA500');
    } catch (err) {
      await message.reply(`Impossible de muter : ${err.message}`);
    }
  },

  // â”€â”€ LIKE-ENABLE / LIKE-DISABLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!like-enable': async (message) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusÃ©e.');
    likeEnabled = true;
    await message.reply({ embeds: [embed('#FFD700')
      .setTitle('Like auto â€” ActivÃ© âœ…')
      .setDescription(`Le bot va maintenant liker **automatiquement** tous les messages de <@${LIKE_TARGET_USER_ID}>.`)
      .setFooter({ text: `ActivÃ© par ${message.author.tag} Â· !like-disable pour arrÃªter` })
    ] });
  },

  '!like-disable': async (message) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusÃ©e.');
    likeEnabled = false;
    await message.reply({ embeds: [embed('#95A5A6')
      .setTitle('Like auto â€” DÃ©sactivÃ© â›”')
      .setDescription(`Le bot ne like plus les messages de <@${LIKE_TARGET_USER_ID}>.`)
      .setFooter({ text: `DÃ©sactivÃ© par ${message.author.tag}` })
    ] });
  },

  // â”€â”€ CLEARROLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '!clearrole': async (message) => {
    if (!isAdmin(message.author.id)) return message.reply('Permission refusÃ©e.');
    const TARGET_ROLE_ID = '1487674672865611806';
    const guild = message.guild;
    const role = guild.roles.cache.get(TARGET_ROLE_ID);
    if (!role) return message.reply(`RÃ´le introuvable (ID : \`${TARGET_ROLE_ID}\`).`);
    const statusMsg = await message.reply(`ðŸ”„ RÃ©cupÃ©ration des membres avec le rÃ´le **${role.name}**...`);
    try {
      await guild.members.fetch();
      const membersWithRole = guild.members.cache.filter(m => m.roles.cache.has(TARGET_ROLE_ID));
      if (membersWithRole.size === 0) {
        return statusMsg.edit(`âœ… Aucun membre ne possÃ¨de le rÃ´le **${role.name}**.`);
      }
      await statusMsg.edit(`ðŸ”„ Suppression du rÃ´le **${role.name}** sur **${membersWithRole.size}** membre(s)...`);
      let success = 0;
      let failed  = 0;
      for (const [, member] of membersWithRole) {
        try {
          await member.roles.remove(role, `!clearrole exÃ©cutÃ© par ${message.author.tag}`);
          success++;
        } catch {
          failed++;
        }
      }
      await statusMsg.edit({
        embeds: [new EmbedBuilder()
          .setColor(failed > 0 ? '#FFA500' : '#00FF66')
          .setTitle('âœ… Clearrole terminÃ©')
          .addFields(
            { name: 'RÃ´le ciblÃ©',   value: `<@&${TARGET_ROLE_ID}>`,        inline: true },
            { name: 'âœ… SuccÃ¨s',     value: `${success} membre(s)`,          inline: true },
            { name: 'âŒ Ã‰checs',     value: `${failed} membre(s)`,           inline: true },
            { name: 'ExÃ©cutÃ© par',  value: `<@${message.author.id}>`,       inline: true },
          )
          .setFooter({ text: 'Le rÃ´le a Ã©tÃ© retirÃ© de tous les membres accessibles' })
          .setTimestamp()],
      });
      await logSanction(guild, [
        { name: 'RÃ´le',         value: `<@&${TARGET_ROLE_ID}>`,       inline: true },
        { name: 'Par',          value: `<@${message.author.id}>`,     inline: true },
        { name: 'RetirÃ©s',      value: `${success}`,                  inline: true },
        { name: 'Ã‰checs',       value: `${failed}`,                   inline: true },
      ], 'Clearrole', '#FFA500');
    } catch (err) {
      await statusMsg.edit(`âŒ Erreur : ${err.message}`);
    }
  },
};

// ============================================================
//  TOURNOI â€” LOGIQUE D'AVANCEMENT
// ============================================================

async function advanceTournament(tournamentId, channel) {
  const t = tournamentsData[tournamentId];
  if (!t || t.status !== 'active') return;
  const pairs = t.currentPairs;

  while (t.currentMatchIndex < pairs.length) {
    const [p1, p2] = pairs[t.currentMatchIndex];
    if (p2 === null) {
      t.roundWinners.push(p1);
      t.history.push({ round: t.currentRound, match: t.currentMatchIndex + 1, winner: p1, loser: null, bye: true });
      t.currentMatchIndex++; saveTournaments(); continue;
    }
    const voteMsgId = await sendVersus(channel, tournamentId, t.currentMatchIndex, p1, p2);
    t.currentVoteMessageId = voteMsgId; saveTournaments(); return;
  }

  const winners = t.roundWinners;

  if (winners.length === 1) {
    t.status = 'finished'; t.winner = winners[0]; saveTournaments();
    await channel.send({ content: '@everyone', embeds: [embed('#FFD700').setTitle('VICTOIRE FINALE !')
      .setDescription(`**${winners[0].username}** remporte le tournoi physique !\n\nFelicitations a <@${winners[0].userId}> !`)
      .addFields(
        { name: 'Gagnant',      value: `<@${winners[0].userId}>`, inline: true },
        { name: 'Participants', value: `${t.participants.length}`, inline: true },
        { name: 'Rounds',       value: `${t.currentRound}`,       inline: true },
      ).setFooter({ text: `Tournoi #${tournamentId} -- Termine` })] });
    return;
  }

  t.currentRound++;
  t.allRoundWinners.push(...t.roundWinners);
  t.currentPairs      = buildRound(winners);
  t.currentMatchIndex = 0;
  t.roundWinners      = [];
  saveTournaments();

  await channel.send({ embeds: [embed('#FFD700').setTitle(`Round ${t.currentRound} -- Debut !`)
    .setDescription(`**${winners.length} joueurs** s'affrontent pour le round ${t.currentRound} !`)
    .addFields({ name: 'Qualifies', value: winners.map(w => `<@${w.userId}>`).join(', ').slice(0, 1024), inline: false })] });
  await advanceTournament(tournamentId, channel);
}

// ============================================================
//  HANDLER â€” Interactions (boutons)
// ============================================================

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  const customId = interaction.customId;

  // â”€â”€ Boutons de SONDAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (customId.startsWith('sondage_')) {
    const optionIndex = parseInt(customId.split('_')[1]);
    const sondage = activeSondages[interaction.message.id];

    if (!sondage) {
      return interaction.reply({ content: 'Ce sondage n\'est plus actif ou a expirÃ©.', ephemeral: true });
    }

    const userId = interaction.user.id;
    const previousVote = sondage.voters[userId];

    if (previousVote !== undefined) {
      // Changer de vote
      sondage.votes[previousVote]--;
    }
    sondage.votes[optionIndex]++;
    sondage.voters[userId] = optionIndex;

    const newEmbed = sondage.buildEmbed(sondage.votes);
    await interaction.update({ embeds: [newEmbed] });
    return;
  }

  // â”€â”€ Boutons de VÃ‰RIFICATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (customId.startsWith('verif_')) {
    // Seuls les admins peuvent interagir
    if (!isAdmin(interaction.user.id)) {
      return interaction.reply({ content: 'âŒ Seuls les admins peuvent traiter les vÃ©rifications.', ephemeral: true });
    }

    const parts  = customId.split('_');
    const action = parts[1]; // approve | refuse | blacklist | done
    const userId = parts[2];

    // Bouton "TraitÃ©" (dÃ©jÃ  dÃ©sactivÃ©)
    if (action === 'done') {
      return interaction.reply({ content: 'Cette demande a dÃ©jÃ  Ã©tÃ© traitÃ©e.', ephemeral: true });
    }

    // RÃ©cupÃ©rer le membre
    const member = await interaction.guild.members.fetch(userId).catch(() => null);
    if (!member) {
      // Membre parti â€” nettoyer quand mÃªme
      delete pendingVerifs[userId]; savePendingVerifs();
      await disableVerifButtons(interaction.guild, userId, 'refused');
      return interaction.reply({ content: 'âŒ Le membre a quittÃ© le serveur. Demande nettoyÃ©e.', ephemeral: true });
    }

    // â”€â”€ APPROUVER â”€â”€
    if (action === 'approve') {
      if (!verifConfig.approvedRoleId) {
        return interaction.reply({ content: 'âŒ RÃ´le approuvÃ© non configurÃ©.', ephemeral: true });
      }
      const approvedRole = interaction.guild.roles.cache.get(verifConfig.approvedRoleId);
      if (!approvedRole) {
        return interaction.reply({ content: `âŒ RÃ´le approuvÃ© introuvable (ID: ${verifConfig.approvedRoleId}).`, ephemeral: true });
      }

      try {
        await member.roles.add(approvedRole, `ApprouvÃ© par ${interaction.user.tag}`);

        // Retirer le rÃ´le pending
        if (verifConfig.pendingRoleId && member.roles.cache.has(verifConfig.pendingRoleId)) {
          const pendingRole = interaction.guild.roles.cache.get(verifConfig.pendingRoleId);
          if (pendingRole) await member.roles.remove(pendingRole).catch(() => {});
        }

        await disableVerifButtons(interaction.guild, userId, 'approved');
        delete pendingVerifs[userId]; savePendingVerifs();

        // Notifier le membre
        if (verifConfig.verifChannelId) {
          const verifCh = interaction.guild.channels.cache.get(verifConfig.verifChannelId);
          if (verifCh) {
            await verifCh.send({
              content: `<@${userId}>`,
              embeds: [new EmbedBuilder()
                .setColor('#00C851')
                .setTitle('âœ… VÃ©rification approuvÃ©e !')
                .setDescription('Tu as Ã©tÃ© vÃ©rifiÃ© et tu as maintenant accÃ¨s complet au serveur. Bienvenue ! ðŸŽ‰')],
            }).catch(() => {});
          }
        }

        await interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor('#00C851')
            .setTitle('âœ… ApprouvÃ©')
            .setDescription(`<@${userId}> a Ã©tÃ© approuvÃ© par <@${interaction.user.id}>.`)
            .addFields({ name: 'RÃ´le attribuÃ©', value: `<@&${verifConfig.approvedRoleId}>`, inline: true })],
          ephemeral: true,
        });

        // Mise Ã  jour de l'embed original pour indiquer le statut
        await interaction.message.edit({
          embeds: [interaction.message.embeds[0].toJSON()
            ? new EmbedBuilder(interaction.message.embeds[0].toJSON())
                .setColor('#00C851')
                .setTitle(`âœ… APPROUVÃ‰ â€” ${interaction.message.embeds[0].title?.replace(/^[^\s]+\s/, '') || 'Demande de vÃ©rification'}`)
                .setFooter({ text: `ApprouvÃ© par ${interaction.user.tag} Â· ${new Date().toLocaleString('fr-FR')}` })
            : interaction.message.embeds[0]],
        }).catch(() => {});

      } catch (err) {
        return interaction.reply({ content: `Erreur : ${err.message}`, ephemeral: true });
      }
      return;
    }

    // â”€â”€ REFUSER (kick) â”€â”€
    if (action === 'refuse') {
      try {
        // Notifier avant kick
        if (verifConfig.verifChannelId) {
          const verifCh = interaction.guild.channels.cache.get(verifConfig.verifChannelId);
          if (verifCh) {
            await verifCh.send({
              content: `<@${userId}>`,
              embeds: [new EmbedBuilder()
                .setColor('#FF4444')
                .setTitle('âŒ VÃ©rification refusÃ©e')
                .setDescription('Ta demande d\'accÃ¨s a Ã©tÃ© refusÃ©e par le staff. Tu vas Ãªtre retirÃ© du serveur.')],
            }).catch(() => {});
          }
        }

        await new Promise(r => setTimeout(r, 2000)); // laisser le temps de lire
        await member.kick(`Refus de vÃ©rification par ${interaction.user.tag}`).catch(() => {});

        await disableVerifButtons(interaction.guild, userId, 'refused');
        delete pendingVerifs[userId]; savePendingVerifs();

        await interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor('#FF4444')
            .setTitle('âŒ RefusÃ© & kickÃ©')
            .setDescription(`<@${userId}> a Ã©tÃ© refusÃ© et kickÃ© par <@${interaction.user.id}>.`)],
          ephemeral: true,
        });

        // Mise Ã  jour embed
        await interaction.message.edit({
          embeds: [interaction.message.embeds[0].toJSON()
            ? new EmbedBuilder(interaction.message.embeds[0].toJSON())
                .setColor('#FF4444')
                .setTitle(`âŒ REFUSÃ‰ â€” ${interaction.message.embeds[0].title?.replace(/^[^\s]+\s/, '') || 'Demande de vÃ©rification'}`)
                .setFooter({ text: `RefusÃ© par ${interaction.user.tag} Â· ${new Date().toLocaleString('fr-FR')}` })
            : interaction.message.embeds[0]],
        }).catch(() => {});

      } catch (err) {
        return interaction.reply({ content: `Erreur : ${err.message}`, ephemeral: true });
      }
      return;
    }

    // â”€â”€ BLACKLIST + KICK â”€â”€
    if (action === 'blacklist') {
      try {
        blacklistData[userId] = {
          tag:    member.user.tag,
          reason: `Blacklist via vÃ©rification par ${interaction.user.tag}`,
          by:     interaction.user.id,
          at:     new Date().toISOString(),
        };
        saveBlacklist();

        await member.kick(`Blacklist lors vÃ©rification par ${interaction.user.tag}`).catch(() => {});

        await disableVerifButtons(interaction.guild, userId, 'blacklisted');
        delete pendingVerifs[userId]; savePendingVerifs();

        await interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor('#8B0000')
            .setTitle('ðŸš« BlacklistÃ© & kickÃ©')
            .setDescription(`<@${userId}> a Ã©tÃ© blacklistÃ© et kickÃ© par <@${interaction.user.id}>.\nIl sera automatiquement bloquÃ© s'il tente de rejoindre.`)],
          ephemeral: true,
        });

        // Mise Ã  jour embed
        await interaction.message.edit({
          embeds: [interaction.message.embeds[0].toJSON()
            ? new EmbedBuilder(interaction.message.embeds[0].toJSON())
                .setColor('#8B0000')
                .setTitle(`ðŸš« BLACKLISTÃ‰ â€” ${interaction.message.embeds[0].title?.replace(/^[^\s]+\s/, '') || 'Demande de vÃ©rification'}`)
                .setFooter({ text: `BlacklistÃ© par ${interaction.user.tag} Â· ${new Date().toLocaleString('fr-FR')}` })
            : interaction.message.embeds[0]],
        }).catch(() => {});

        await logSanction(interaction.guild, [
          { name: 'Membre', value: member.user.tag,           inline: true },
          { name: 'Par',    value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Motif',  value: 'Blacklist lors vÃ©rification', inline: false },
        ], `Blacklist VÃ©rif â€” ${member.user.tag}`, '#8B0000');

      } catch (err) {
        return interaction.reply({ content: `Erreur : ${err.message}`, ephemeral: true });
      }
      return;
    }
  }

  // â”€â”€ Boutons de RATING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (customId.startsWith('rate_')) {
    const parts  = customId.split('_');
    const voteId = parts[1];
    const choice = parts[2];

    if (voteId === 'expired') {
      return interaction.reply({ content: 'Ce vote a expirÃ©.', ephemeral: true });
    }

    const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
    if (!member || !hasRatingRole(member)) {
      return interaction.reply({ content: 'Tu n\'as pas le rÃ´le requis pour voter.', ephemeral: true });
    }

    const db     = await getGymgirls();
    const active = db.activeVotes?.[interaction.channel.id];

    if (!active || active.voteId !== voteId) {
      return interaction.reply({ content: 'Ce vote n\'est plus actif ou a expirÃ©.', ephemeral: true });
    }
    if (active.votedUsers.includes(interaction.user.id)) {
      return interaction.reply({ content: 'Tu as dÃ©jÃ  votÃ© sur ce duel.', ephemeral: true });
    }

    if (choice === 'skip') {
      active.votedUsers.push(interaction.user.id);
      await saveGymgirls(db);
      return interaction.reply({ content: 'â­ï¸ Skip enregistrÃ©.', ephemeral: true });
    }

    const girlA   = (db.girls || []).find(g => g.id === active.girlAId);
    const girlB   = (db.girls || []).find(g => g.id === active.girlBId);
    if (!girlA || !girlB) return interaction.reply({ content: 'Erreur : donnÃ©es corrompues.', ephemeral: true });

    const winner = choice === 'A' ? girlA : girlB;
    const loser  = choice === 'A' ? girlB : girlA;

    const K         = 32;
    const expectedW = 1 / (1 + Math.pow(10, (loser.elo - winner.elo) / 400));
    const gainW     = Math.round(K * (1 - expectedW));
    const gainL     = Math.round(K * (0 - (1 - expectedW)));

    const prevWinnerElo = winner.elo;
    const prevLoserElo  = loser.elo;

    winner.elo  = Math.max(100, winner.elo + gainW);
    loser.elo   = Math.max(100, loser.elo + gainL);
    winner.wins++;
    loser.losses++;

    active.votedUsers.push(interaction.user.id);
    await saveGymgirls(db);

    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor('#00FF66')
        .setTitle('Vote enregistrÃ© âœ…')
        .setDescription(
          `Tu as votÃ© pour **${winner.name}**.\n\n` +
          `**${winner.name}** \`${prevWinnerElo}\` â†’ \`${winner.elo}\` **(+${gainW})**\n` +
          `**${loser.name}** \`${prevLoserElo}\` â†’ \`${loser.elo}\` **(${gainL})**`
        )
        .setFooter({ text: `K=32 Â· Votes sur ce duel : ${active.votedUsers.length}` })],
      ephemeral: true,
    });

    return;
  }

  // â”€â”€ Boutons de TOURNOI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (!customId.startsWith('tournament_')) return;

  if (!isAdmin(interaction.user.id)) {
    return interaction.reply({ content: 'Seul Crous peut voter.', ephemeral: true });
  }

  const parts        = customId.split('_');
  const choice       = parts[parts.length - 1];
  const matchIndex   = parseInt(parts[parts.length - 2]);
  const tournamentId = parts.slice(1, parts.length - 2).join('_');

  const t = tournamentsData[tournamentId];
  if (!t || t.status !== 'active') return interaction.reply({ content: 'Ce tournoi n\'est plus actif.', ephemeral: true });
  if (matchIndex !== t.currentMatchIndex) return interaction.reply({ content: 'Ce vote est obsolete.', ephemeral: true });

  const [p1, p2] = t.currentPairs[matchIndex];
  const winner   = choice === 'A' ? p1 : p2;
  const loser    = choice === 'A' ? p2 : p1;

  t.roundWinners.push(winner);
  t.history.push({ round: t.currentRound, match: matchIndex + 1, winner, loser, bye: false });
  t.currentMatchIndex++; saveTournaments();

  const disabledRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('done_A').setLabel(choice === 'A' ? 'Joueur A (Gagnant)' : 'Joueur A').setStyle(choice === 'A' ? ButtonStyle.Success : ButtonStyle.Secondary).setDisabled(true),
    new ButtonBuilder().setCustomId('done_B').setLabel(choice === 'B' ? 'Joueur B (Gagnant)' : 'Joueur B').setStyle(choice === 'B' ? ButtonStyle.Success : ButtonStyle.Secondary).setDisabled(true),
  );

  await interaction.update({ components: [disabledRow] }).catch(() => {});
  await interaction.channel.send({ embeds: [embed('#00FF66').setTitle(`Match ${matchIndex + 1} -- Resultat`).addFields(
    { name: 'Gagnant', value: `<@${winner.userId}> (${winner.username})`, inline: true },
    { name: 'Elimine', value: `<@${loser.userId}> (${loser.username})`,   inline: true },
  )] });

  await advanceTournament(tournamentId, interaction.channel);
});

// ============================================================
//  HANDLER MESSAGES
// ============================================================

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // â”€â”€ LIKE AUTO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (likeEnabled && message.author.id === LIKE_TARGET_USER_ID) {
    try { await message.react('â¤ï¸'); } catch (err) { console.warn('[LIKE AUTO] Impossible de rÃ©agir :', err.message); }
  }

  // â”€â”€ ANTI-BADWORDS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (!isAdmin(message.author.id) && badwordsData.words.length > 0) {
    const content = message.content.toLowerCase();
    const found = badwordsData.words.find(w => content.includes(w.toLowerCase()));
    if (found) {
      await message.delete().catch(() => {});
      if (!warnsData[message.author.id]) warnsData[message.author.id] = [];
      warnsData[message.author.id].push({ reason: 'Mot interdit dÃ©tectÃ© (auto)', by: client.user.id, at: new Date().toISOString() });
      saveWarns();
      const bwMsg = await message.channel.send({
        embeds: [embed('#FF4444').setTitle('â›” Message supprimÃ© â€” Mot interdit')
          .setDescription(`<@${message.author.id}>, ton message contient un mot interdit et a Ã©tÃ© supprimÃ©. Un warn automatique a Ã©tÃ© ajoutÃ©.`)
          .addFields({ name: 'Warns', value: `${warnsData[message.author.id].length}/3`, inline: true })
          .setFooter({ text: 'Anti-BadWords automatique' })]
      }).catch(() => null);
      if (bwMsg) setTimeout(() => bwMsg.delete().catch(() => {}), 8000);
      return;
    }
  }

  if (!message.content.startsWith(CONFIG.PREFIX)) return;

  const [rawCmd, ...args] = message.content.trim().split(/\s+/);
  const cmd = rawCmd.toLowerCase();

  if (commands[cmd]) {
    try { await commands[cmd](message, args); }
    catch (e) { console.error(`Erreur commande ${cmd}:`, e); message.reply('Une erreur est survenue.'); }
    return;
  }

  const ruleMatch = cmd.match(/^!regle(\d+)$/);
  if (ruleMatch) {
    const num = ruleMatch[1];
    if (rulesData[num]) {
      await message.reply({ embeds: [embed('#FAD961').setTitle(`Regle ${num}`).setDescription(rulesData[num])] });
    } else {
      await message.reply(`La regle **${num}** n'existe pas. Utilise \`!regles\` pour voir toutes les regles.`);
    }
  }
});

// ============================================================
//  REACTION ROLES (dont vÃ©rification manuelle)
// ============================================================

client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial)         { try { await reaction.fetch();         } catch { return; } }
  if (reaction.message.partial) { try { await reaction.message.fetch(); } catch { return; } }

  const msgId     = reaction.message.id;
  const emojiName = reaction.emoji.name;
  const { MESSAGE_ID, CHANNEL_ID, ROLE_ID, EMOJI } = CONFIG.REACTION_ROLE;

  // â”€â”€ Message de vÃ©rification principal â”€â”€
  if (msgId === MESSAGE_ID && reaction.message.channel.id === CHANNEL_ID && emojiName === EMOJI) {
    const guild  = reaction.message.guild;
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;

    // VÃ©rifier si blacklistÃ©
    if (blacklistData[user.id]) {
      console.log(`[VERIF] ${user.tag} est blacklistÃ© â€” rejet automatique`);
      try { await reaction.users.remove(user.id); } catch {}
      try {
        await user.send({
          embeds: [new EmbedBuilder()
            .setColor('#8B0000')
            .setTitle('ðŸš« AccÃ¨s refusÃ©')
            .setDescription('Tu es sur la liste noire de ce serveur et ne peux pas rejoindre.')],
        });
      } catch {}
      // Kick discret
      await member.kick('BlacklistÃ© â€” tentative de rejoindre le serveur').catch(() => {});
      return;
    }

    // Mode vÃ©rification manuelle activÃ©
    if (verifConfig.enabled && verifConfig.pendingRoleId) {
      const pendingRole = guild.roles.cache.get(verifConfig.pendingRoleId);
      if (!pendingRole) {
        console.error('[VERIF] RÃ´le pending introuvable :', verifConfig.pendingRoleId);
        return;
      }

      // DÃ©jÃ  en attente ?
      if (pendingVerifs[user.id]) {
        console.log(`[VERIF] ${user.tag} a dÃ©jÃ  une demande en attente`);
        return;
      }

      // DÃ©jÃ  approuvÃ© ?
      if (verifConfig.approvedRoleId && member.roles.cache.has(verifConfig.approvedRoleId)) {
        console.log(`[VERIF] ${user.tag} est dÃ©jÃ  approuvÃ©`);
        return;
      }

      try {
        await member.roles.add(pendingRole, 'En attente de vÃ©rification manuelle');
        console.log(`[VERIF] RÃ´le pending attribuÃ© Ã  ${user.tag}`);

        // Message dans le channel de vÃ©rif
        if (verifConfig.verifChannelId) {
          const verifCh = guild.channels.cache.get(verifConfig.verifChannelId);
          if (verifCh) {
            await verifCh.send({
              content: `<@${user.id}>`,
              embeds: [new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('â³ VÃ©rification en cours')
                .setDescription(
                  'Bienvenue ! Tu es actuellement en attente de vÃ©rification par le staff.\n\n' +
                  '> Un admin va examiner ton profil et te donner accÃ¨s au serveur.\n' +
                  '> Merci de patienter â€” cela peut prendre quelques heures.\n\n' +
                  'En cas de problÃ¨me, contacte un admin directement.'
                )
                .setFooter({ text: 'Ne quitte pas le serveur, tu perdrais ton statut de vÃ©rification' })],
            }).catch(() => {});
          }
        }

        // Envoyer la demande aux admins
        await sendVerifRequest(guild, member);

      } catch (err) {
        console.error('[VERIF] Erreur attribution rÃ´le pending :', err.message);
      }
      return;
    }

    // Mode classique (pas de vÃ©rification manuelle)
    try {
      const role = guild.roles.cache.get(ROLE_ID);
      if (!role) return console.error('[REACTION ROLE] Role introuvable :', ROLE_ID);
      await member.roles.add(role);
      try { await user.send('Tu as bien recu l\'acces au serveur ! Bienvenue !'); } catch {}
    } catch (err) { console.error('[REACTION ROLE] Erreur :', err.message); }
    return;
  }

  // â”€â”€ Multi-RR classique â”€â”€
  if (reactionRolesData[msgId]) {
    const roleId = reactionRolesData[msgId].roles[emojiName];
    if (!roleId) return;
    try {
      const member = await reaction.message.guild.members.fetch(user.id);
      const role   = reaction.message.guild.roles.cache.get(roleId);
      if (!role) return;
      await member.roles.add(role);
    } catch (err) { console.error('[MULTI-RR] Erreur ajout role :', err.message); }
  }
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial)         { try { await reaction.fetch();         } catch { return; } }
  if (reaction.message.partial) { try { await reaction.message.fetch(); } catch { return; } }

  const msgId     = reaction.message.id;
  const emojiName = reaction.emoji.name;
  const { MESSAGE_ID, CHANNEL_ID, ROLE_ID, EMOJI } = CONFIG.REACTION_ROLE;

  if (msgId === MESSAGE_ID && reaction.message.channel.id === CHANNEL_ID && emojiName === EMOJI) {
    try {
      const member = await reaction.message.guild.members.fetch(user.id);
      const role   = reaction.message.guild.roles.cache.get(ROLE_ID);
      if (!role) return;
      await member.roles.remove(role);
    } catch (err) { console.error('[REACTION ROLE] Erreur :', err.message); }
    return;
  }

  if (reactionRolesData[msgId]) {
    const roleId = reactionRolesData[msgId].roles[emojiName];
    if (!roleId) return;
    try {
      const member = await reaction.message.guild.members.fetch(user.id);
      const role   = reaction.message.guild.roles.cache.get(roleId);
      if (!role) return;
      await member.roles.remove(role);
    } catch (err) { console.error('[MULTI-RR] Erreur retrait role :', err.message); }
  }
});

// ============================================================
//  GUILDMEMBERADD â€” VÃ©rification blacklist Ã  l'arrivÃ©e
// ============================================================

client.on('guildMemberAdd', async (member) => {
  // Si le membre est blacklistÃ©, on le kick immÃ©diatement
  if (blacklistData[member.id]) {
    console.log(`[VERIF] Membre blacklistÃ© dÃ©tectÃ© Ã  l'arrivÃ©e : ${member.user.tag}`);
    try {
      await member.send({
        embeds: [new EmbedBuilder()
          .setColor('#8B0000')
          .setTitle('ðŸš« AccÃ¨s refusÃ©')
          .setDescription('Tu es sur la liste noire de ce serveur.')],
      }).catch(() => {});
      await member.kick('BlacklistÃ© â€” entrÃ©e bloquÃ©e automatiquement');
    } catch (err) {
      console.error('[VERIF] Erreur kick blacklist :', err.message);
    }

    // Notifier dans le log
    if (verifConfig.logChannelId) {
      const logCh = member.guild.channels.cache.get(verifConfig.logChannelId);
      if (logCh) {
        await logCh.send({
          embeds: [new EmbedBuilder()
            .setColor('#8B0000')
            .setTitle('ðŸš« Tentative d\'accÃ¨s â€” BlacklistÃ©')
            .setDescription(`<@${member.id}> (${member.user.tag}) a tentÃ© de rejoindre mais est blacklistÃ©.`)
            .addFields(
              { name: 'ID', value: member.id, inline: true },
              { name: 'BlacklistÃ© le', value: new Date(blacklistData[member.id].at).toLocaleString('fr-FR'), inline: true },
              { name: 'Raison', value: blacklistData[member.id].reason, inline: false },
            )
            .setTimestamp()],
        }).catch(() => {});
      }
    }
    return; // Ne pas envoyer le message de bienvenue Ã  un blacklistÃ©
  }

  // â”€â”€ MESSAGE DE BIENVENUE AUTOMATIQUE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (welcomeConfig.channelId && welcomeConfig.message) {
    const welcomeCh = member.guild.channels.cache.get(welcomeConfig.channelId);
    if (welcomeCh) {
      const msg = welcomeConfig.message
        .replace(/{user}/g,   `<@${member.id}>`)
        .replace(/{server}/g, member.guild.name)
        .replace(/{count}/g,  member.guild.memberCount);
      await welcomeCh.send({
        embeds: [new EmbedBuilder()
          .setColor('#FFD700')
          .setTitle('âš¡ Nouveau membre !')
          .setDescription(msg)
          .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
          .setTimestamp()
          .setFooter({ text: `Membre #${member.guild.memberCount} Â· ${member.guild.name}` })]
      }).catch(() => {});
    }
  }
});

// ============================================================
//  TIKTOK LIVE CHECKER
// ============================================================

let liveDetectionStreak    = 0;
const LIVE_DETECTION_THRESHOLD = 2;

async function checkTikTokLive() {
  try {
    const headers = {
      'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control':   'no-cache',
      'Pragma':          'no-cache',
      'Sec-Fetch-Mode':  'navigate',
    };
    const response = await axios.get(`https://www.tiktok.com/@${CONFIG.TIKTOK_USERNAME}/live`, { headers, timeout: 15000, maxRedirects: 5 });
    const html     = response.data;
    const patterns = [
      /"statusStr"\s*:\s*"LIVE_STATUS_STREAMING"/.test(html),
      /"isLiveStreaming"\s*:\s*true/.test(html),
      /"liveRoomInfo"/.test(html) && /"status"\s*:\s*2/.test(html),
      /roomid[^"]*"[^"]{5,}/.test(html) && !/redirectUrl/.test(html),
      /"liveUrl"/.test(html) && !/"liveUrl"\s*:\s*""/.test(html),
    ];
    const positiveSignals  = patterns.filter(Boolean).length;
    const isCurrentlyLive  = positiveSignals >= 2;

    console.log(`[LIVE CHECK] @${CONFIG.TIKTOK_USERNAME} -- ${positiveSignals}/5 signaux -- Streak: ${liveDetectionStreak}`);

    const channel = client.channels.cache.get(CONFIG.LIVE_CHANNEL_ID);
    if (!channel) { console.error(`[LIVE] Channel ${CONFIG.LIVE_CHANNEL_ID} introuvable.`); return; }

    if (isCurrentlyLive) {
      liveDetectionStreak++;
      if (liveDetectionStreak >= LIVE_DETECTION_THRESHOLD && !liveStatus.isLive) {
        liveStatus.isLive = true; liveStatus.lastNotified = new Date().toISOString(); saveJSON(FILES.liveStatus, liveStatus);
        await channel.send({ content: `@everyone **@${CONFIG.TIKTOK_USERNAME}** est en live sur TikTok !`,
          embeds: [embed('#FF0050').setTitle('LIVE EN COURS !')
            .setDescription(`**@${CONFIG.TIKTOK_USERNAME}** est actuellement en **live** sur TikTok !\n\nClique sur le lien ci-dessous pour rejoindre le live.`)
            .addFields(
              { name: 'Lien direct', value: `https://www.tiktok.com/@${CONFIG.TIKTOK_USERNAME}/live`, inline: false },
              { name: 'Detecte a',   value: `<t:${Math.floor(Date.now() / 1000)}:T>`,                 inline: true  },
            ).setThumbnail(`https://unavatar.io/tiktok/${CONFIG.TIKTOK_USERNAME}`)
            .setFooter({ text: `TikTok Live Detector - @${CONFIG.TIKTOK_USERNAME}` })] });
      }
    } else {
      if (liveDetectionStreak > 0) { liveDetectionStreak = 0; }
      if (liveStatus.isLive) { liveStatus.isLive = false; saveJSON(FILES.liveStatus, liveStatus); }
    }
  } catch (err) {
    if (err.response?.status === 429) { console.warn('[LIVE] Rate limit TikTok.'); }
    else if (err.response?.status === 404) { console.warn(`[LIVE] Page TikTok introuvable.`); }
    else { console.error('[LIVE] Erreur :', err.message); }
  }
}

// ============================================================
//  RESTAURATION DES TIMERS AU DÃ‰MARRAGE
// ============================================================

async function restoreTimers() {
  const now = Date.now();

  for (const [userId, data] of Object.entries(jailsData)) {
    const remaining    = data.until - now;
    const savedRoleIds = data.savedRoleIds || (data.hadRole ? [CONFIG.JAIL_ACCESS_ROLE_ID] : []);
    if (remaining <= 0) {
      try {
        const guild  = await client.guilds.fetch(data.guildId).catch(() => null);
        if (!guild) { delete jailsData[userId]; continue; }
        const member = await guild.members.fetch(userId).catch(() => null);
        if (member) await unjailMember(member, savedRoleIds, 'Liberation automatique (rattrapage demarrage)');
      } catch (err) { console.error('[RESTORE JAIL] Erreur :', err.message); }
      delete jailsData[userId];
    } else {
      setTimeout(async () => {
        try {
          const guild  = await client.guilds.fetch(data.guildId).catch(() => null);
          if (!guild) { delete jailsData[userId]; saveJails(); return; }
          const member = await guild.members.fetch(userId).catch(() => null);
          const saved  = jailsData[userId];
          if (member && saved) await unjailMember(member, saved.savedRoleIds || [], 'Liberation automatique apres jail');
          delete jailsData[userId]; saveJails();
          const prisonCh = guild.channels.cache.get(CONFIG.JAIL_PRISON_CHANNEL_ID);
          if (prisonCh) await prisonCh.send({ embeds: [embed('#00FF66').setTitle('Libere !').setDescription(`<@${userId}> a purge sa peine.`)] }).catch(() => {});
        } catch (err) { console.error('[RESTORE JAIL] Erreur liberation :', err.message); }
      }, remaining);
    }
  }
  saveJails();

  for (const [userId, data] of Object.entries(npcList)) {
    const remaining = data.until - now;
    if (remaining <= 0) {
      try {
        const guild  = await client.guilds.fetch(data.guildId).catch(() => null);
        const member = guild ? await guild.members.fetch(userId).catch(() => null) : null;
        if (member) await member.setNickname(data.originalNick === member.user.username ? null : data.originalNick, 'Fin NPC (rattrapage demarrage)');
      } catch {} delete npcList[userId];
    } else {
      setTimeout(async () => {
        try {
          const guild  = await client.guilds.fetch(data.guildId).catch(() => null);
          const member = guild ? await guild.members.fetch(userId).catch(() => null) : null;
          if (member) await member.setNickname(data.originalNick === member.user.username ? null : data.originalNick, 'Fin du statut NPC');
          delete npcList[userId]; saveNpcList();
        } catch {}
      }, remaining);
    }
  }
  saveNpcList();

  for (const [userId, data] of Object.entries(tfList)) {
    const remaining = data.until - now;
    if (remaining <= 0) {
      try {
        const guild  = await client.guilds.fetch(data.guildId).catch(() => null);
        const member = guild ? await guild.members.fetch(userId).catch(() => null) : null;
        if (member) await member.setNickname(data.originalNick === member.user.username ? null : data.originalNick, 'Fin TF (rattrapage demarrage)');
      } catch {} delete tfList[userId];
    } else {
      setTimeout(async () => {
        try {
          const guild  = await client.guilds.fetch(data.guildId).catch(() => null);
          const member = guild ? await guild.members.fetch(userId).catch(() => null) : null;
          if (member) await member.setNickname(data.originalNick === member.user.username ? null : data.originalNick, 'Fin du TF');
          delete tfList[userId]; saveTfList();
        } catch {}
      }, remaining);
    }
  }
  saveTfList();

  // Nettoyer les votes actifs expirÃ©s dans JSONBin au redÃ©marrage
  try {
    const db = await getGymgirls();
    let changed = false;
    for (const [channelId, vote] of Object.entries(db.activeVotes || {})) {
      if (Date.now() - vote.createdAt > 5 * 60 * 1000) {
        delete db.activeVotes[channelId]; changed = true;
      }
    }
    if (changed) await saveGymgirls(db);
  } catch (err) { console.error('[RESTORE] Erreur nettoyage votes :', err.message); }

  console.log('[RESTORE] Timers restaures avec succes.');
}

// ============================================================
//  LOG DES MESSAGES SUPPRIMÉS (SNOOP)
// ============================================================

client.on('messageDelete', async (message) => {
  try {
    // Ignorer si pas dans le serveur source
    if (!message.guild || message.guild.id !== CONFIG.SNOOP_SOURCE_GUILD_ID) return;
    // Ignorer les messages de bots
    if (message.author?.bot) return;
    // Ignorer les messages totalement vides (non mis en cache)
    if (!message.content && message.attachments.size === 0 && message.embeds.length === 0 && !message.author) return;

    // Récupérer le salon de log (peut être dans un autre serveur)
    const logChannel = await client.channels.fetch(CONFIG.SNOOP_LOG_CHANNEL_ID).catch(() => null);
    if (!logChannel) {
      console.error('[SNOOP] Channel de log introuvable :', CONFIG.SNOOP_LOG_CHANNEL_ID);
      return;
    }

    // Tenter de trouver qui a supprimé le message via l'audit log
    let deletedBy = null;
    try {
      const auditLogs = await message.guild.fetchAuditLogs({
        type: AuditLogEvent.MessageDelete,
        limit: 5,
      });
      const entry = auditLogs.entries.find(e => {
        const isRecent  = Date.now() - e.createdTimestamp < 5000;
        const isTarget  = e.target?.id === message.author?.id;
        const isChan    = e.extra?.channel?.id === message.channel?.id;
        return isRecent && isTarget && isChan;
      });
      if (entry) deletedBy = entry.executor;
    } catch (_) { /* audit log non accessible */ }

    const author  = message.author;
    const channel = message.channel;
    const content = message.content || '*[Pas de texte]*';

    const logEmbed = new EmbedBuilder()
      .setColor('#FF3333')
      .setTitle('🗑️ Message supprimé')
      .setThumbnail(author ? author.displayAvatarURL({ dynamic: true, size: 256 }) : null)
      .addFields(
        {
          name: '✍️ Auteur du message',
          value: author
            ? `${author.tag} (<@${author.id}>) \`${author.id}\``
            : '*Inconnu (message non mis en cache)*',
          inline: false,
        },
        {
          name: '🗑️ Supprimé par',
          value: deletedBy
            ? `${deletedBy.tag} (<@${deletedBy.id}>) \`${deletedBy.id}\``
            : author
              ? `*Probablement l'auteur lui-même* (<@${author.id}>)`
              : '*Inconnu*',
          inline: false,
        },
        {
          name: '📌 Salon',
          value: `<#${channel.id}> \`#${channel.name}\``,
          inline: true,
        },
        {
          name: '🏠 Serveur',
          value: message.guild.name,
          inline: true,
        },
        {
          name: '📝 Contenu',
          value: content.length > 1024 ? content.slice(0, 1021) + '...' : content,
          inline: false,
        },
      )
      .setFooter({ text: `Message ID : ${message.id}` })
      .setTimestamp();

    // Ajouter les pièces jointes si présentes
    if (message.attachments.size > 0) {
      const attachList = message.attachments.map(a => `[${a.name}](${a.url})`).join('\n');
      logEmbed.addFields({
        name: `📎 Pièces jointes (${message.attachments.size})`,
        value: attachList.length > 1024 ? attachList.slice(0, 1021) + '...' : attachList,
        inline: false,
      });
    }

    await logChannel.send({ embeds: [logEmbed] });
  } catch (err) {
    console.error('[SNOOP] Erreur messageDelete :', err.message);
  }
});

// ============================================================
//  DÉMARRAGE
// ============================================================

client.once('ready', async () => {
  console.log(`Bot connecte en tant que ${client.user.tag}`);
  console.log(`Admins: ${CONFIG.ADMIN_IDS.join(', ')}`);
  console.log(`Surveillance TikTok: @${CONFIG.TIKTOK_USERNAME}`);
  console.log(`Channel live: ${CONFIG.LIVE_CHANNEL_ID}`);
  console.log(`Rating role: ${CONFIG.RATING_ROLE_ID}`);
  console.log(`JSONBin ID: ${_binId || 'sera cree au premier !rate-add'}`);
  console.log(`Multi-RR charges: ${Object.keys(reactionRolesData).length} message(s)`);
  console.log(`Ticket viewer role: ${ticketConfig.viewRoleId  || 'non defini'}`);
  console.log(`Ticket staff role:  ${ticketConfig.staffRoleId || 'non defini'}`);
  console.log(`Tickets actifs: ${Object.keys(ticketsData).length}`);
  console.log(`Jail prison channel: ${CONFIG.JAIL_PRISON_CHANNEL_ID}`);
  console.log(`Sanction log channel: ${sanctionLogData.channelId || 'non defini'}`);
  console.log(`Warns charges: ${Object.keys(warnsData).length} membre(s)`);
  console.log(`Jails actifs: ${Object.keys(jailsData).length}`);
  console.log(`[VERIF] SystÃ¨me: ${verifConfig.enabled ? 'ACTIVÃ‰' : 'DÃ‰SACTIVÃ‰'}`);
  console.log(`[VERIF] Blacklist: ${Object.keys(blacklistData).length} entrÃ©e(s)`);
  console.log(`[VERIF] En attente: ${Object.keys(pendingVerifs).length} demande(s)`);

  await restoreTimers();
  checkTikTokLive();
  setInterval(checkTikTokLive, CONFIG.LIVE_CHECK_INTERVAL);
});

client.on('error', (err) => console.error('[Discord] Erreur client:', err));

// Ajouter GuildMembers intent pour guildMemberAdd
// Note : assurez-vous d'avoir activÃ© "Server Members Intent" dans le portail dev Discord

const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) { console.error('DISCORD_TOKEN manquant !'); process.exit(1); }

client.login(TOKEN);
