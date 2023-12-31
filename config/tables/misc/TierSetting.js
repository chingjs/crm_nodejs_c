const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../sequelize");

const { INTEGER, STRING, DATE, UUID, UUIDV4 , FLOAT} = DataTypes;

class TierSetting extends Model{};

TierSetting.init({
    id: {
        type: INTEGER,
        autoIncrement: true,
        primaryKey: true,
        unique: true
    },
    tier: {
        type: STRING,
        allowNull: false,
        comment: "tier"
    },
    // birthday : {
    //     type: FLOAT,
    //     allowNull: true,
    // },
    // refer: {
    //     type: FLOAT,
    //     allowNull: false,
    // },
    welcome: {
        type: FLOAT,
        allowNull: false,
    },
    multiplier: {
        type: FLOAT,
        allowNull: false,
    },
    highTierPoints: {
        type: FLOAT,
        allowNull: false,
    },
    lowTierPoints: {
        type: FLOAT,
        allowNull: false,
    },
    nextTier: {
        type: STRING,
        allowNull: false,
        comment: "what is next tier?"
    },
    beforeTier: {
        type: STRING,
        allowNull: false,
        comment: "what is before tier?"
    }
}, {
    sequelize,
    timestamps: true,
    createdAt: true,
    updatedAt: true,
    comment: "tierSetting",
    tableName: "tierSetting",
    modelName: "tierSetting"
})

module.exports = TierSetting