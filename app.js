'use strict';

const request = require('request');
const readline = require('readline');
const DomParser = require('dom-parser');
const parser = new DomParser();
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const ProgressBar = require('progress');

const webpage = 'http://musicforprogramming.net';
const url = 'https://datashat.net/music_for_programming_';
const extension = '.mp3';

const promptFunc = (html, episodes) => {
  let episodesArr = episodes.split(',');
  const episodesFilter = episode => {
    if (episode > 48 || episode < 1) {
      return false;
    } else {
      return true;
    }
  }
  episodesArr = episodesArr.filter(episodesFilter);
  getItemsList(html, episodesArr)
}

const getItemsList = (html, ptracks) => {
  console.log("Getting episodes id's...");

  let parsedHTML = parser.parseFromString(html),
    tracks = parsedHTML.getElementById('episodes'),
    tracksArr = tracks.getElementsByTagName('a'),
    complitedUrl,
    urlArr = [];

  tracksArr.push(tracks.getElementsByClassName('selected')[0]);

  tracksArr.forEach((item, i) => {
    let trackName = item.innerHTML,
      trackNumber = i + 1,
      trackNameForUrl;

    trackName = trackName.substring(trackName.indexOf(':') + 2);
    trackNameForUrl = trackName.split(' ').join('_').split('+').join('and');

    complitedUrl = url + trackNumber + '-' + trackNameForUrl.toLowerCase() + extension;

    if (ptracks != undefined) {
      for (var i = 0; i < ptracks.length; i++) {
        if (trackNumber == ptracks[i]) {
          urlArr.push(complitedUrl);
        }
      }
    } else {
      urlArr.push(complitedUrl);
    }
  });
  console.log('Downloading ' + urlArr.length + ' episodes...');
  downloadTracks(urlArr);
};

const handleError = err => {
  console.log("Whooops ! Looks like you're having an error: ", err);
};

const downloadTrack = track => {
  let name = track.match(/\d+-[a-z_]+\.mp3/g);
  name = name
    ? name[0]
    : track.split('-')[1];

  return new Promise((resolve, reject) => {
    let msg,
      bar;

    const handleFileExists = (a, b) => {
      console.log(name + ' exists, skipping download...');
      resolve();
    }

    const handleFileDoesntExist = () => {
      request(track).on('response', res => {
        let len = parseInt(res.headers['content-length'], 10);
        msg = 'Downloading ' + name + '... [:bar] :percent :etas';
        bar = new ProgressBar(msg, {
          incomplete: ' ',
          width: 25,
          renderThrottle: 500,
          total: len
        })
      }).on('data', chunk => {
        bar.tick(chunk.length)
      }).on('end', resolve).pipe(fs.createWriteStream(`./music/${name}`));
    };

    fs.statAsync(`./music/${name}`).then(handleFileExists).catch(handleFileDoesntExist);
  });
};

const downloadTracks = tracks => {
  return Promise.reduce(tracks, (total, track) => {
    return downloadTrack(track).then(() => {
      return total + 1;
    });
  }, 0);
};

request(webpage, (err, response, html) => {
  if (!err && response.statusCode === 200) {
    if (!fs.existsSync('music')) {
      fs.mkdirSync('music');
    }
    const rl = readline.createInterface({input: process.stdin, output: process.stdout});

    rl.question('Would you like to download all episodes? (y/n) ', (answer) => {
      if (answer === 'y') {
        getItemsList(html);
        rl.close();
      } else if (answer === 'n') {
        rl.question('Type number(s) of episode(s) to download and separate them with comma(example: 3,5,18) ', (episodes) => {
          promptFunc(html, episodes);
          rl.close();
        });
      } else {
        console.log('Please, choose only y or n variant.');
        rl.close();
      }
    });
  } else {
    handleError(err);
  }
});
