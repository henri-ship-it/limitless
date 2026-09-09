-- Elite, the year long programme, as a tier of its own.

/*
 * Not a flavour of Pro. An Elite member is on a different programme with a
 * different journal and a different clock: twelve chapters over a year rather
 * than sixteen weeks, and no deloads. Filing them under Pro would have put them
 * in the Pro WhatsApp group, the Wednesday drop-in and the sixteen week
 * chapter release, none of which is theirs.
 *
 * Elevate is the same programme under another name, so it is the same value
 * here rather than a second one that would have to be kept in step forever.
 */
alter type member_tier add value if not exists 'elite';
