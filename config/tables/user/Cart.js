const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../sequelize");

const { UUID, INTEGER, STRING, BOOLEAN } = DataTypes;

class Cart extends Model {}

Cart.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            unique: true
        },
        name: {
            type: STRING,
            allowNull: true,
        },
        qty: {
            type: INTEGER,
        },
        checked: {
            type: BOOLEAN,
            defaultValue: true,
        }
    },
    {
        sequelize,
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        comment: "To store cart item",
        tableName: "cart",
        modelName: "cart"
    }
);

// userId

module.exports = Cart;
