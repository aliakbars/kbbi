#!/usr/bin/env node
var url = require('url');
var chalk = require('chalk');
var inquirer = require('inquirer');
var axios = require('axios');
var cheerio = require('cheerio');
var NodeCache = require("file-system-cache").default;

var baseUrl = 'https://kbbi.kemdikbud.go.id';
var arti = [];
var kataBerimbuhan = [];
var gabunganKata = [];
var myCache = NodeCache();
var entri_words = '';
var is_cache = false;

process.stdout.write('\033c');
console.log(chalk.bold('Selamat datang di KBBI Daring!'));
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
            if ($('h2').length) {
                $('h2').each(function (i, elm) {
                    var lemma = $(elm).clone().children().remove().end().text();
                    process.stdout.write(chalk.green(lemma) + '\n');

                    var non_standard = $(elm).find('small').text();
                    if (non_standard != '') {
                        process.stdout.write(chalk.gray(non_standard) + '\n');
                    }

                    $(elm).next().each(function (i, elm) {
                        $(elm).find('li').each(function (i, elm) {
                            $(elm).find('span').each(function (i, elm) {
                                if ($(elm).text().trim() != '') {
                                    process.stdout.write(chalk.red.italic($(elm).text()) + ' ');
                                }
                            });
                            
                            var definisi = $(elm).clone().children().remove().end().text();
                            process.stdout.write(definisi);

                            var link = $(elm).find('a').text();
                            if (link != '') {
                                process.stdout.write(chalk.blue(link));
                            }

                            process.stdout.write('\n');
                        });
                    });
                });
            } else {
                process.stdout.write(chalk.red('Entri tidak ditemukan.'));
            }
            console.log();
            ask();
        });
}

// ask();
module.exports = ask;
