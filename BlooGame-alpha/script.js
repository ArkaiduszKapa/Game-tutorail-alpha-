const levels = [
  {
    id: 1,
    name: 'First floor city',
    settings: {
      lighting: 'Dim',
      atmosphere: 'Eerie',
    },
    regions: [
      { id: 1, name: 'tower', mobs: [] },
      { 
        id: 2, 
        name: 'dark entrance', 
        mobs: [
          { name: 'slime', lvl: 2, exp: 3, dmg: 5, hp: 10 },
          { name: 'demonic_slime', lvl: 5, exp: 12, dmg: 10, hp: 20 },
        ],
      },
      { 
        id: 3, 
        name: 'forgotten hallway',
        mobs: [
          { name: 'slime', lvl: 2, exp: 3, dmg: 5, hp: 10 },
          { name: 'demonic_slime', lvl: 5, exp: 12, dmg: 10, hp: 20 },
        ],
      },
    ],
    mission: 'Find the lost artifact',
    clearingRequirement: 'Defeat all mobs',
  },
  {
    id: 2,
    name: 'Enchanted Forest',
    settings: {
      lighting: 'Glowing',
      atmosphere: 'Mystical',
    },
    regions: [
      { id: 1, name: 'tower', mobs: [] },
      { 
        id: 2, 
        name: 'dark entrance', 
        mobs: [
          { name: 'slime', lvl: 2, exp: 3, dmg: 5, hp: 10 },
          { name: 'demonic_slime', lvl: 5, exp: 12, dmg: 10, hp: 20 },
        ],
      },
      { 
        id: 3, 
        name: 'forgotten hallway',
        mobs: [
          { name: 'slime', lvl: 2, exp: 3, dmg: 5, hp: 10 },
          { name: 'demonic_slime', lvl: 5, exp: 12, dmg: 10, hp: 20 },
        ],
      },
    ],
    mission: 'Protect the mystical artifact',
    clearingRequirement: 'Defeat all mobs',
  },

];

class Player {
  constructor(name, level, hp, maxHp, hunger, maxHunger, xp, maxXp, dmg, money) {
    this.name = name;
    this.level = level || 1;
    this.hp = hp || this.calculateMaxHp();
    this.maxHp = maxHp || this.calculateMaxHp();
    this.hunger = hunger || this.maxHunger;
    this.maxHunger = maxHunger || 100;
    this.xp = xp || 0;
    this.maxXp = maxXp || this.calculateMaxXp();
    this.dmg = dmg || 2;
    this.money = money || 0;
  }

  calculateMaxHp() {
    return 100 + 5 * this.level + 30 * Math.pow(1.1, this.level);
  }

  calculateMaxXp() {
    return Math.floor(100 * Math.pow(1.2, this.level) + 20 * this.level);
  }

  levelUp() {
    this.level += 1;
    this.maxHp = this.calculateMaxHp();
    this.hp = this.maxHp;
    this.maxXp = this.calculateMaxXp();
    this.xp = 0;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.levelDown();
    }
  }

  levelDown() {
    this.level -= 1;
    this.maxHp = this.calculateMaxHp();
    this.hp = this.maxHp;
    this.maxXp = this.calculateMaxXp();
    this.xp = 0;
  }

  attack(mob) {
    mob.hp -= this.dmg;
    if (mob.hp <= 0) {
      this.xp += mob.exp;
      if (this.xp >= this.maxXp) {
        this.levelUp();
      }
      mob.hp = 0;
    }
  }

  updateStats() {
    this.maxHp = this.calculateMaxHp();
    this.maxXp = this.calculateMaxXp();
  }
}

class Commands {
  constructor(player, xp_bar_fill, lvlElement) {
    this.navigation = new MapNavigation();
    this.navigation.createMap(levels);
    this.experience = new Experience(player, xp_bar_fill, lvlElement, this.navigation);
    this.player = player;
  }

  ChangeLevel(desiredLevel) {
      this.navigation.navigateLevels(desiredLevel);
  }

  ChangeRegion(desiredRegion) {
      const region = this.navigation.findRegionByName(desiredRegion);
      if (region) {
        this.actionInProgress = true;
        this.navigation.navigateRegions(desiredRegion);
        this.experience.setCurrentRegion(region);
        this.navigation.displayCurrentMap();
        this.actionInProgress = false;
      } else {
        console.log('Invalid region name.');
      }
    }

  pve(mobName, attackCount) {
      const currentRegion = this.navigation.getCurrentRegion();
      if (currentRegion) {
        this.actionInProgress = true;
        this.experience.setCurrentRegion(currentRegion);
        const attackedMob = this.experience.findMob(mobName);

        if (attackedMob) {
          for (let i = 0; i < attackCount; i++) {
            console.log(`Attacked ${mobName} in ${currentRegion.name}! Mob details:`, attackedMob);

            const xpGain = this.experience.calculateXpGain(attackedMob);
            this.player.xp += xpGain;

            if (this.player.xp >= this.player.calculateMaxXp()) {
              this.player.levelUp();
            }

            this.experience.updateUI();
          }
        } else {
          console.log(`${mobName} not found in ${currentRegion.name}.`);
        }
        this.actionInProgress = false;
      } else {
        console.log('No current region.');
      }
  }
}

class Experience {
  constructor(player, xp_bar_fill, lvlElement, navigation) {
    this.player = player;
    this.currentRegion = null;
    this.xp_bar_fill = xp_bar_fill;
    this.lvlElement = lvlElement;
    this.navigation = navigation; 
    this.updateUI();
  }

  setCurrentRegion(region) {
    this.currentRegion = region;
    this.updateUI();
  }

  levelUp() {
    this.player.xp = 0;
    this.player.level += 1;
    this.updateUI();
  }

  calculateXpGain(mob) {
    const baseXp = mob.exp;
    const levelDifference = mob.lvl - this.player.level;
    const adjustedXp = Math.max(0, baseXp - levelDifference * 5);
    return adjustedXp;
  }

  pve(mobName, attackCount) {
    const attackedMob = this.findMob(mobName);
    if (attackedMob) {
      for (let i = 0; i < attackCount; i++) {
        if (this.player.xp >= this.player.calculateMaxXp()) {
          this.player.levelUp();
        } else {
          const xpGain = this.calculateXpGain(attackedMob);
          this.player.xp += xpGain;
        }
      }
      this.updateUI();
    } else {
      console.log(`${mobName} not found in ${this.currentRegion.name}.`);
    }
  }

  updateUI() {
    if (this.xp_bar_fill) {
      this.xp_bar_fill.style.width = (this.player.xp / this.player.calculateMaxXp()) * 100 + "%";
    }
    if (this.lvlElement) {
      this.lvlElement.innerHTML = this.player.level + " lvl";
    }
  }

  findMob(mobName) {
    const mobs = this.currentRegion.mobs;
    return mobs.find(mob => mob.name === mobName);
  }
}

class MapNavigation {
  constructor() {
    this.levels = [];
    this.currentLevel = null;
    this.currentRegion = null;
  }

  createMap(levels) {
    this.levels = levels;
    console.log('Map created!');
  }

  navigateRegions(regionName) {
    const region = this.findRegionByName(regionName);
    if (region) {
      this.currentRegion = region;
      console.log(`Entered region: ${this.currentRegion.name}`);
      this.displayCurrentMap();
    } else {
      console.log('Invalid region name.');
    }
  }

  navigateLevels(levelId) {
    const level = this.findLevelById(levelId);

    if (level) {
      this.currentLevel = level;
      console.log(`Entered level: ${this.currentLevel.name}`);
      this.displayCurrentMap();
    } else {
      console.log('Invalid level ID.');
    }
  }

  displayCurrentMap() {
    console.log(`You are in Room ${this.currentLevel.id}.`);
    console.log(`This room has doors leading to regions: ${this.currentLevel.regions.map(region => region.name).join(', ')}`);
  }

  findRegionByName(regionName) {
    const foundRegion = this.levels.reduce((foundRegion, level) => {
      const region = level.regions.find(region => region.name === regionName);
      return foundRegion || region;
    }, null);
    return foundRegion || null;
  }

  findLevelById(levelId) {
    return this.levels.find(level => level.id === levelId);
  }

  getCurrentRegion() {
    return this.currentRegion;
  }

  getCurrentLevel() {
    return this.currentLevel;
  }
}

class TextBasedContent {
  constructor() {
    this.messagesContainer = document.getElementById('messages');
  }

  playerMessage(playerInputValue) {
    if (playerInputValue.trim() !== '') {
      const playerInput_element = document.createElement('span');
      playerInput_element.className = 'player_text';
      playerInput_element.textContent = playerInputValue;
      let playerN = document.createElement('span');
      playerN.textContent = 'Me' + ' : ';
      playerN.id = 'PlayerID';
      let print = document.createElement('span');
      print.appendChild(playerN);
      print.appendChild(playerInput_element);
      this.messagesContainer.appendChild(print);
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  createMessage(name, name_id, content_class, content) {
    let speaker = document.createElement('span');
    speaker.textContent = name + ' : ';
    speaker.id = name_id;

    let worldVoice = document.createElement('span');
    worldVoice.className = content_class;
    worldVoice.textContent = content;

    let print = document.createElement('p');
    print.appendChild(speaker);
    print.appendChild(worldVoice);
    this.messagesContainer.appendChild(print);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }
}

class Game {
  constructor() {

    this.player = new Player('Kolczak', 1);
    this.commands = new Commands(this.player);
    this.inputField = document.getElementById('player_text_input');
    this.playerInputValue = '';
    this.textContent = new TextBasedContent();
    this.map = new MapNavigation();

    this.inputField.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        this.playerInputValue = this.inputField.value;
        this.textContent.playerMessage(this.playerInputValue);
        this.PlayerChose();
        this.inputField.value = '';
      }
    });

    this.updatePlayerStats();
  }

  start(){
    this.textContent.createMessage('World', 'speaker', 'WorldVoice', 'Your game has started!');
  }

  PlayerChose() {
    let inputField = document.getElementById('player_text_input');
    let string = inputField.value.trim().toLowerCase();
    console.log('Input:', string);
    let matchLevel = string.match(/transmit to floor (\d+)/);
    let matchRegion = string.match(/\bgo to the region\b(.+)/);
    let matchAttack = string.match(/attack\s+([\w_]+)(?:\s+x(\d+))?/);
    if (matchLevel) {
      let destination = parseInt(matchLevel[1], 10);
      console.log('Level ID:', destination);
      this.commands.ChangeLevel(destination);
    } else if (matchRegion) {
      let destination = matchRegion[1].trim();
      console.log("adasdasd " + destination);
      this.commands.ChangeRegion(destination);
    } else if (matchAttack) {
      const mobName = matchAttack[1];
      const attackCount = matchAttack[2] ? parseInt(matchAttack[2], 10) : 1;
      this.commands.pve(mobName, attackCount);
    } else if (string.includes('use item')) {
      console.log('Player wants to use an item!');
    } else {
      console.log('Unrecognized command:', string);
    }
    this.updatePlayerStats();
  }

  updatePlayerStats() {
    var xp_bar_fill = document.getElementById("xp_bar_fill");
    xp_bar_fill.style.width = (this.player.xp / this.player.calculateMaxXp() * 100) + "%";

    var health_bar_fill = document.getElementById("health_bar_fill");
    health_bar_fill.style.width = (this.player.hp / this.player.maxHp * 100) + "%";

    var hunger_bar_fill = document.getElementById("hunger_bar_fill");
    hunger_bar_fill.style.width = (this.player.hunger / this.player.maxHunger * 100) + "%";

    var lvl = document.getElementById("lvl");
    lvl.innerHTML = this.player.level;

    var money = document.getElementById("money");
    money.innerHTML = this.player.money;
  }
}

const myGame = new Game();
myGame.start();
