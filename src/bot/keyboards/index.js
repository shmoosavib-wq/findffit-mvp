const { Markup } = require('telegraf');

module.exports = {
  mainMenu: Markup.keyboard([
    ['🔍 جستجوی جدید', '📊 وضعیت'],
  ]).resize(),
};
