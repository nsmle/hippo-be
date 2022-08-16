'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        min: 4,
        max: 30,
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        min: 4,
        max: 12,
        validate: {
            is: /^[a-z0-9_-]{4,12}$/i
        }
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      photo: {
        type: Sequelize.STRING
      },
      admin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      apikey: {
        type: Sequelize.STRING,
        unique: true,
        min: 30,
        max: 64
      },
      legacy: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      state: {
        type: Sequelize.JSONB,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};