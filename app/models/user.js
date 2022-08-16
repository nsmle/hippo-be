'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  User.init({
    name: DataTypes.STRING,
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    password: DataTypes.STRING,
    photo: DataTypes.STRING,
    admin: DataTypes.BOOLEAN,
    apikey: DataTypes.STRING,
    legacy: DataTypes.BOOLEAN,
    state: DataTypes.JSONB,
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};