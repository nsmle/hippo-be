'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Users seed commands.
     * 
     * default password is : "password123"
    */
    
    await queryInterface.bulkInsert('Users', [{
      name: 'John',
      username: 'john',
      email: 'john@gmail.com',
      phone: '6280808080808',
      password: "$2a$08$OF2H5bAQ5mZtXDACIz7Oruk8aC563aAyirz1EzdsFH8dN2cTcAslO",
      admin: true,
      createdAt: new Date(),
      updatedAt: new Date()
     }], {});
     
    await queryInterface.bulkInsert('Users', [{
      name: 'Doe',
      username: 'doew',
      email: 'doe@gmail.com',
      phone: '6281818181818',
      password: "$2a$08$H4TUWnY5rk2zLq8jRQ4bO.dcL/gjaq9FiR32QD9t9rHZDyEZVQ19e",
      admin: false,
      createdAt: new Date(),
      updatedAt: new Date()
     }], {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * commands to revert Users seed.
     */
     
     await queryInterface.bulkDelete('Users', null, {});
  }
};
