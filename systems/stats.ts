
import { Player, WeaponType } from '../types';
import { SCALING_FACTORS } from '../constants';

export const getEffectiveStats = (player: Player) => {
    const stats = {
        strength: player.strength,
        agility: player.agility,
        vitality: player.vitality,
        perception: player.perception,
        intelligence: player.intelligence
    };

    // Iterate over ALL equipped items
    Object.values(player.equipment).forEach(item => {
        if (item) {
            // Add Base Stat (from Armor/Accessories)
            if (item.baseStat) {
                stats[item.baseStat.type] += item.baseStat.value;
            }
            // Add Affixes
            item.affixes.forEach(affix => {
                stats[affix.type] += affix.value;
            });
        }
    });
    return stats;
};

export const calculateWeaponStats = (player: Player) => {
    const weapon = player.equipment.MAIN_HAND;
    if (!weapon) return { damage: 5, range: 50, attackSpeed: 1.0, bonusArc: 0, aoeRadius: 0 };

    const effectiveStats = getEffectiveStats(player);

    let totalDamage = weapon.baseDamage * weapon.power;

    const strFactor = SCALING_FACTORS[weapon.scaling.strength || '-'];
    const agiFactor = SCALING_FACTORS[weapon.scaling.agility || '-'];
    const intFactor = SCALING_FACTORS[weapon.scaling.intelligence || '-'];

    totalDamage += (effectiveStats.strength * strFactor);
    totalDamage += (effectiveStats.agility * agiFactor);
    totalDamage += (effectiveStats.intelligence * intFactor);

    let range = weapon.baseRange;
    let bonusArc = 0;
    let aoeRadius = 0;

    if (weapon.type === WeaponType.SWORD) {
        range += (effectiveStats.strength * strFactor * 2);
        bonusArc = effectiveStats.strength * strFactor * 0.01;
    } else if (weapon.type === WeaponType.BOW) {
        range += (effectiveStats.agility * agiFactor * 10);
    } else if (weapon.type === WeaponType.STAFF) {
        aoeRadius = 60 + (effectiveStats.intelligence * intFactor * 4);
    }

    const spdMod = 1 + (effectiveStats.perception * 0.01);
    const attackSpeed = weapon.baseAttackSpeed * spdMod;

    return { damage: totalDamage, range, attackSpeed, bonusArc, aoeRadius };
};

// Re-calculate Player Stats (MaxHP, Damage, Speed) based on Stats
export const recalculatePlayerStats = (player: Player) => {
    const effectiveStats = getEffectiveStats(player);
    
    // 1 Vitality = 5 HP. Base HP = 75 (Since initial 5 Vit gives 100 HP)
    const newMaxHp = 75 + (effectiveStats.vitality * 5);
    // const hpRatio = player.hp / player.maxHp; // Unused in original
    
    player.maxHp = newMaxHp;
    // Optional: Keep same percentage of HP or just clamp. Let's clamp to max.
    player.hp = Math.min(player.hp, player.maxHp);
    
    const combatStats = calculateWeaponStats(player);
    player.damage = combatStats.damage;
    player.attackSpeed = combatStats.attackSpeed;
    
    return player;
};
