#!/usr/bin/env node
var url = require('url');
var chalk = require('chalk');
var inquirer = require('inquirer');
var axios = require('axios');
var cheerio = require('cheerio');
var NodeCache = require("file-system-cache").default;

var baseUrl = 'http://kbbi4.portalbahasa.com';
var arti = [];
var kataBerimbuhan = [];
var gabunganKata = [];
var myCache = NodeCache();
var entri_words = '';
var is_cache = false;

process.stdout.write('\033c');
console.log(chalk.bold('Selamat datang di KBBI IV Daring!'));
console.log(chalk.italic('Ctrl-D (EOF) jika Anda telah selesai.\n'));

var questions = [
    {
        type: 'input',
        name: 'entri',
        message : 'Kata yang ingin Anda cari:'
    }
];

var ask = function() {
    inquirer.prompt(questions)
        .then(function (answers) {
            entri_words = escape(answers.entri);
            var entri_response = myCache.getSync(entri_words);
            if (!entri_response){
                is_cache = false;
                return axios.get(baseUrl + '/entri/' + entri_words);
            } else {
                is_cache = true;
                return entri_response;
            }
        })
        .then(function (response) {
            if (!is_cache) myCache.setSync(entri_words, {data:response.data});
            var $ = cheerio.load(response.data);
            if ($('.syllable').length) {
                $('.syllable').each(function (i, elm) {
                    console.log(chalk.green($(elm).text()));
                    $(elm).parent().next().children().each(function (i, elm) {
                        $(elm).find('a.attribute').each(function (i, elm) {
                            process.stdout.write(chalk.red($(elm).text() + ' '));
                        });

                        process.stdout.write($(elm).clone()
                            .find('a.attribute').remove().end()
                            .find('.latin').remove().end()
                            .text().trim());

                        if ($(elm).find('.latin').length != 0) {
                            process.stdout.write(' ' + chalk.green.italic($(elm).find('.latin').text()));
                        }

                        process.stdout.write('\n');
                    });
                });
            } else {
                console.log(chalk.red('Entri tidak ditemukan.'));
            }
            console.log();
            ask();
        });
}

// ask();
module.exports = ask;