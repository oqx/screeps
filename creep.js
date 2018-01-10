const { ERR_MAX_POP_REACHED } = require("./CONSTANTS");

exports.Creep = class {
  constructor(
    props = {
      minPop: 5,
      maxPop: 10,
      role: "harvester",
      body: [WORK, CARRY, MOVE, MOVE]
    }
  ) {
    this.minPop = props.minPop;
    this.maxPop = props.maxPop;
    this.role = props.role;
    this.body = props.body;

    this._spawnCreep = this._spawnCreep.bind(this);
    this._checkPopBeforeSpawning = this._checkPopBeforeSpawning.bind(this);
    this.getPop = this.getPop.bind(this);
  }

  create(spawnName) {
    const params = {
      status: this._getPreSpawnStatus(spawnName),
      spawnName: spawnName,
      population: this.getPop()
    };

    const spawnCreep = _.compose(
      this._spawnCreep,
      this._handleInsufficientEnergy,
      this._handleSpawnInProgress,
      this._checkPopBeforeSpawning
    );

    spawnCreep(params);
  }

  _getPreSpawnStatus(spawnName) {
    return Game.spawns[spawnName].spawnCreep(
      [WORK, CARRY, MOVE],
      `${spawnName}-${Game.time}`,
      {
        dryRun: true
      }
    );
  }

  _spawnCreep(params) {
    if (
      Game.spawns[params.spawnName].spawning === null &&
      params.status === OK
    ) {
      Game.spawns[params.spawnName].spawnCreep(
        this.body,
        `${params.spawnName}-${Game.time}`,
        {
          memory: {
            role: this.role,
            working: false
          }
        }
      );
    }
  }

  _checkPopBeforeSpawning(params) {
    if (params.population >= this.maxPop) {
      return Object.assign({}, params, { status: ERR_MAX_POP_REACHED });
    }
    return params;
  }

  _handleInsufficientEnergy(params) {
    if (params.status === ERR_NOT_ENOUGH_ENERGY) {
      return params;
    }
    return params;
  }

  _handleSpawnInProgress(params) {
    if (Game.spawns[params.spawnName].spawning || params.status === ERR_BUSY) {
      return params;
    }
    return params;
  }

  work(creep, storage, resourceType) {
    const params = {
      creep: creep,
      creepState: {
        hasEnergy: creep.carry.energy > 0,
        isAtCarryCapacity: creep.carry.energy === creep.carryCapacity,
        workStatus: OK
      },
      storage: storage,
      resourceType: resourceType,
      transferStatus: OK,
      source: null
    };

    const beginWorking = _.compose(
      this._handleRangeErrorWorkStatus,
      this._getCreepWorkStatus,
      this._getSourceClosestToCreep,
      this._handleIfCreepIsInRange,
      this._getCreepsTransferStatus,
      this._handleIfCreepIsStagnantWithLoad,
      this._handleIfCreepHasNoEnergy
    );

    beginWorking(params);
  }

  _handleIfCreepIsStagnantWithLoad(params) {
    const { creep, creepState } = params;
    if (!creep.memory.working && creepState.isAtCarryCapacity) {
      creep.memory.working = true;
      return Object.assign({}, params);
    }
    return params;
  }

  _handleIfCreepHasNoEnergy(params) {
    const { creep, creepState } = params;
    if (creep.memory.working && !creepState.hasEnergy) {
      creep.memory.working = false;
      return Object.assign({}, params);
    }
    return params;
  }

  _getCreepsTransferStatus(params) {
    const { creep, storage, resourceType } = params;
    if (creep.memory.working) {
      const transferStatus = creep.transfer(storage, resourceType);
      return Object.assign({}, params, {
        transferStatus: transferStatus
      });
    }
    return params;
  }

  _handleIfCreepIsInRange(params) {
    const { transferStatus, creep, storage } = params;
    if (creep.memory.working && transferStatus === ERR_NOT_IN_RANGE) {
      creep.moveTo(storage);
      return params;
    }
    return params;
  }

  _getSourceClosestToCreep(params) {
    const { creep, creepState } = params;
    if (!creep.memory.working && !creepState.isAtCarryCapacity) {
      return Object.assign({}, params, {
        source: creep.pos.findClosestByPath(FIND_SOURCES)
      });
    }
    return params;
  }

  _getCreepWorkStatus(params) {
    const { creep, creepState, source } = params;
    if (!creep.memory.working && !creepState.isAtCarryCapacity) {
      return Object.assign({}, params, {
        creepState: { workStatus: creep.work(source) }
      });
    }
    return params;
  }

  _handleRangeErrorWorkStatus(params) {
    const { creep, creepState, source } = params;
    if (
      !creep.memory.working &&
      !creepState.isAtCarryCapacity &&
      creepState.workStatus === ERR_NOT_IN_RANGE
    ) {
      creep.moveTo(source, { visualizePathStyle: { stroke: "#ffaa00" } });
    }
  }

  getPop() {
    let results,
      key,
      total = 0;
    for (key in Game.creeps) {
      Game.creeps[key].memory.role === this.role ? (total += 1) : null;
    }
    return total;
  }
};
