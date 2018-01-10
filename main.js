const { Harvester } = require("./role.harvester");

const harvester = new Harvester({ minPop: 5, maxPop: 10 });

const upgrader = new Harvester({ minPop: 5, maxPop: 10, role: "upgrader" });

module.exports.loop = function() {
  upgrader.create("Spawn1");
  harvester.create("Spawn1");
  Object.keys(Game.creeps).forEach(name => {
    const creep = Game.creeps[name];
    initActions(creep);
  });
};

const initializeHarvesters = creep => {
  if (creep.memory.role === "harvester") {
    harvester.harvest(creep, Game.spawns.Spawn1, RESOURCE_ENERGY);
  }
  return creep;
};

const initializeUpgraders = creep => {
  if (creep.memory.role === "upgrader") {
    upgrader.harvest(creep, creep.room.controller, RESOURCE_ENERGY);
  }
  return creep;
};

const initActions = _.compose(initializeHarvesters, initializeUpgraders);
