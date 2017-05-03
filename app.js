'use strict'

const request = require('request')
const DomParser = require('dom-parser')
const parser = new DomParser()
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const ProgressBar = require('progress')

const webpage = 'http://musicforprogramming.net'
const url = 'https://datashat.net/music_for_programming_'
const extension = '.mp3'

request(webpage, (err, response, html) => {
  if (!err && response.statusCode == 200) {
    getItemsList(html)
  } else {
    handleError(err)
  }
})

const getItemsList = html => {
  console.log("Getting tracks id's...")

  let parsedHTML = parser.parseFromString(html),
      tracks = parsedHTML.getElementById('episodes'),
      tracksArr = tracks.getElementsByTagName('a'), complitedUrl,
      urlArr = [];

  tracksArr.push(tracks.getElementsByClassName('selected')[0])

  tracksArr.forEach( (item, i) => {
    let trackName = item.innerHTML,
        trackNumber = i+1, trackNameForUrl;

    trackName = trackName.substring(trackName.indexOf(':')+2);
    trackNameForUrl = trackName.split(' ').join('_').split('+').join('and')

    complitedUrl = url + trackNumber + '-' + trackNameForUrl.toLowerCase() + extension;
    urlArr.push(complitedUrl)
  })
  console.log('Downloading ' + urlArr.length + ' tracks...')
  downloadTracks(urlArr)
}

const handleError = err => {
  console.log("Whooops ! Looks like you're having an error: ", err)
}

const downloadTrack = track => {
  let name = track.match(/\d+-[a-z_]+\.mp3/g)
  name = name ? name[0] : track.split('-')[1]

  return new Promise( (resolve, reject) => {
    let msg, bar

    const handleFileExists = (a, b) => {
      console.log(name + ' exists, skipping download...')
      resolve();
    }

    const handleFileDoesntExist = () => {
      request(track)
        .on('response', res => {
          msg = 'Downloading ' + name + '... [:bar] :percent :etas'
          bar = new ProgressBar(msg, {
            incomplete: ' ',
            width: 25,
            renderThrottle: 500,
            total: parseInt(res.headers['content-length'], 10)
          })
        })
        .on('data', chunk => {
          bar.tick(chunk.length)
        })
        .on('end', resolve)
        .pipe(fs.createWriteStream(name))
    }

    fs.statAsync(name)
      .then(handleFileExists, handleFileDoesntExist)
  })
}

const downloadTracks = tracks => {
  return Promise.reduce(tracks, (total, track) => {
    return downloadTrack(track).then( () => {
      return total + 1
    })
  }, 0)
}
