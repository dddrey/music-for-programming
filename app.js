'use strict'

const request = require('request')
const DomParser = require('dom-parser')
const parser = new DomParser()

const webpage = 'http://musicforprogramming.net'

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

    const url = 'https://datashat.net/music_for_programming_'
    const extension = '.mp3'

    complitedUrl = url + trackNumber + '-' + trackNameForUrl.toLowerCase() + extension;
    console.log(complitedUrl)
  })
}

const handleError = err => {
  console.log("Whooops ! Looks like you're having an error: ", err)
}
