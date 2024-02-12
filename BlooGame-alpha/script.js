

const levels = [
  {
    id: 1,
    name: 'First floor city',
    settings: {
      lighting: 'Dim',
      atmosphere: 'Eerie',
    },
    regions: [{ id: 1, name: 'tower', mobs: [] }],
    mission: 'Survive in the Tower!',
    clearingRequirement: 'None!',
  },
  {
    id: 2,
    name: 'Enchanted Forest',
    settings: {
      atmosphere: 'Mystical',
    },
    regions: [
      { id: 1, name: 'tower', mobs: [] },
      {
        id: 2,
        name: 'dark entrance',
        mobs: [{ name: 'slime', lvl: 2, exp: 3, dmg: 3, hp: 10 ,max_hp:10, money:3 }],
      },
      {
        id: 3,
        name: 'forgotten cave',
        mobs: [{ name: 'demonic_slime', lvl: 8, exp: 13, dmg: 10, hp: 35,max_hp:35, money:11  }],
      },
    ],
    mission: 'Fight monsters',
    clearingRequirement: 'Get to tutorial level 30',
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
    this.textContent = new TextBasedContent();
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
    if (this.level == 30){
      myGame.stop();
    }

    
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
    this.experience.setCurrentRegion(this.navigation.getCurrentRegion());
  }

  ChangeRegion(desiredRegion) {
    this.navigation.navigateRegions(desiredRegion);
    this.experience.setCurrentRegion(this.navigation.getCurrentRegion());
  }

  pve(mobName, attackCount) {
    this.experience.pve(mobName, attackCount);
  }
}

class Experience {
  constructor(player, xp_bar_fill, lvlElement, navigation) {
    this.player = player;
    this.xp_bar_fill = xp_bar_fill;
    this.lvlElement = lvlElement;
    this.navigation = navigation; 
    this.currentRegion = this.navigation.getCurrentRegion();
    this.updateUI();
    this.textContent = new TextBasedContent();
  }

  setCurrentRegion(region) {
    this.currentRegion = region;
    this.updateUI();
  }

  calculateXpGain(mob) {
    const baseXp = mob.exp;
    const levelDifference = mob.lvl - this.player.level;
    const adjustedXp = Math.max(0, baseXp + levelDifference);
    return adjustedXp;
  }

  pve(mobName, attackCount) {
    const attackedMob = this.findMob(mobName);
    if (attackedMob) {
      for (let i = 0; i < attackCount; i++) {
        this.attack(mobName, attackedMob);
        this.updateUI();
      }
      console.log(`${mobName} attacked in ${this.currentRegion.name}.`);
      this.textContent.createMessage('?????', 'speaker', 'WorldVoice', `[${mobName} attacked in ${this.currentRegion.name}]`);
      this.updateUI();
    } else {
      console.log(`${mobName} not found in ${this.currentRegion.name}.`);
      this.textContent.createMessage('?????', 'speaker', 'WorldVoice', `[${mobName} not found in ${this.currentRegion.name}]`);
    }
  }

  attack(mobName, mob) {
    mob.hp -= this.player.dmg;
    if (mob.hp <= 0) {
      this.player.xp += this.calculateXpGain(mob);
      this.player.money += mob.money;
      if (this.player.xp >= this.player.maxXp) {
        this.player.levelUp();
      }
      mob.hp = 0;
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
    const currentRegion = this.navigation.getCurrentRegion();
    const mobs = currentRegion.mobs || [];
    return mobs.find((mob) => mob.name === mobName);
  }
}

class MapNavigation {
  constructor(player) {
    this.player = player;
    this.levels = [];
    this.currentLevel = null;
    this.currentRegion = 'tower';
    this.textContent = new TextBasedContent();

    levels.forEach((level) => {
      level.regions.forEach((region) => {
        if (!region.mobs) {
          region.mobs = [];
        }
      });
    });
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
      this.textContent.createMessage('?????', 'speaker', 'WorldVoice', `[Entered region: ${this.currentRegion.name}]`);
    } else {
      console.log('Invalid region name.');
      this.textContent.createMessage('?????', 'speaker', 'WorldVoice', '[There is no region like that]');
      
    }
  }

navigateLevels(levelId) {
  if(this.currentRegion =='tower'){
    const level = this.findLevelById(levelId);

    if (level) {
      this.currentLevel = level;
      console.log(`Entered level: ${this.currentLevel.name}`);
      this.displayCurrentMap();
    } else {
      console.log('Invalid level ID.');
      this.textContent.createMessage('?????', 'speaker', 'WorldVoice', '[There is no floor like that]');
    }
  }else{
    this.textContent.createMessage('?????', 'speaker', 'WorldVoice', '[You need to be in the region: (tower) in order to transmit to anotcher level]');
  }
}

  displayCurrentMap() {
    this.textContent.createMessage('?????', 'speaker', 'WorldVoice', `[You are in floor ${this.currentLevel.id}]`);
    this.textContent.createMessage('?????', 'speaker', 'WorldVoice', `[This room has regions:  ${this.currentLevel.regions.map(region => region.name).join(' , ')}]`);
  }

  findRegionByName(regionName) {
    const foundRegion = this.levels.reduce((foundRegion, level) => {
      const region = level.regions.find((region) => region.name === regionName);
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

    this.player = new Player();
    this.commands = new Commands(this.player);
    this.inputField = document.getElementById('player_text_input');
    this.playerInputValue = '';
    this.textContent = new TextBasedContent();
    this.map = new MapNavigation(this.player);

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
    this.gameStarted = true;
    this.textContent.createMessage('?????', 'speaker', 'WorldVoice', '[Your game has started!]');
    this.textContent.createMessage('?????', 'speaker', 'WorldVoice', '[Use the cheat sheet on left to transfer to 2nd floor and go fight slimes in its regions!]');
  }
  stop(){
    this.gameStarted = false;
    this.textContent.createMessage('?????', 'speaker', 'WorldVoice', '[Your game has ended!]');

  }
  PlayerChose() {
    if(this.gameStarted){
      let inputField = document.getElementById('player_text_input');
      let string = inputField.value.trim().toLowerCase();
      console.log('Input:', string);
      let matchLevel = string.match(/transmit to floor (\d+)/);
      let matchRegion = string.match(/\bgo to region\b(.+)/);
      let matchAttack = string.match(/attack\s+([\w_]+)(?:\s+x(\d+))?/);
      if (matchLevel) {
        let destination = parseInt(matchLevel[1], 10);
        console.log('Level ID:', destination);
        this.commands.ChangeLevel(destination);
      } else if (matchRegion) {
        let destination = matchRegion[1].trim();
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
    }else{
      this.textContent.createMessage('World', 'speaker', 'WorldVoice', '[Your game is not started!]');
    }
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