const {remote} = require('electron')
const {h, Component} = require('preact')
const TitleBar = require('./TitleBar')
const TrackInfo = require('./TrackInfo')
const LyricsBox = require('./LyricsBox')

const spotify = require('../../modules/spotify')
const lyrics = require('../../modules/lyrics')

let id = 0

class App extends Component {
    constructor() {
        super()

        this.state = {
            autoscroll: true,
            alwaysOnTop: false
        }

        spotify.on('song-update', ({track, playing_position}) => {
            let songId = ++id

            this.setState({
                id: songId,
                loading: true,
                title: track.track_resource.name,
                artists: [track.artist_resource.name],
                album: track.album_resource.name,
                art: null,
                lyrics: null,
                url: null,
                position: playing_position,
                total: track.length
            })

            let query = [this.state.title, ...this.state.artists].join(' ')

            lyrics.get(query, (err, result) => {
                if (err) return this.setState({loading: false})

                result.loading = false

                if (this.state.id == songId)
                    this.setState(result)
            })
        })

        spotify.on('song-progress', ({track, playing_position}) => {
            this.setState({
                position: playing_position,
                total: track.length
            })
        })

        window.addEventListener('load', () => spotify.listen())
    }

    componentDidMount() {
        this.setState({
            autoscroll: localStorage.autoscroll == 'true',
            alwaysOnTop: localStorage.alwaysOnTop == 'true'
        })
    }

    componentDidUpdate({}, {alwaysOnTop, autoscroll}) {
        if (this.state.alwaysOnTop != alwaysOnTop) {
            let win = remote.getCurrentWindow()
            win.setAlwaysOnTop(this.state.alwaysOnTop)
            localStorage.alwaysOnTop = this.state.alwaysOnTop
        }

        if (this.state.autoscroll != autoscroll) {
            localStorage.autoscroll = this.state.autoscroll
        }
    }

    render({}, {loading, title, artists, album, art, lyrics, url, position, total, autoscroll}) {
        return h('div', {id: 'root'},
            h(TitleBar),
            h(TrackInfo, {loading, title, artists, album, art}),
            h('main', {},
                h(LyricsBox, {loading, lyrics, url, position, total, autoscroll}),
                h('div', {class: 'fade-in'}),
                h('div', {class: 'fade-out'})
            )
        )
    }
}

module.exports = App
