// Level setup
tiles.setCurrentTilemap(tilemap`level1`)

// Camera setup
namespace userconfig {
    export const ARCADE_SCREEN_WIDTH = 39 * 16
    export const ARCADE_SCREEN_HEIGHT = 29 * 16
}



music.stopAllSounds()
music.play(music.createSong(assets.song`levelTheme`), music.PlaybackMode.LoopingInBackground)