// Level setup
tiles.setCurrentTilemap(tilemap`level1`)

// Camera setup
namespace userconfig {
    export const ARCADE_SCREEN_WIDTH = 39 * 16
    export const ARCADE_SCREEN_HEIGHT = 29 * 16
}

namespace SpriteKind {
    export const Watergirl = SpriteKind.create()
    export const Fireboy = SpriteKind.create()
}

namespace GamePlayers {
    // Watergirl
    const watergirl = sprites.create(assets.image`watergirl`, SpriteKind.Player)
    watergirl.setKind(SpriteKind.Watergirl)
    watergirl.ay = 500
    watergirl.setScale(3)
    
    tiles.placeOnTile(watergirl, tiles.getTileLocation(2, 22))

    controller.player1.moveSprite(watergirl, 125, 0)
    controller.A.onEvent(ControllerButtonEvent.Pressed, () => {
        watergirl.vy -= 300
    })
    
    // Fireboy
    const fireboy = sprites.create(assets.image`fireboy`, SpriteKind.Player)
    fireboy.setKind(SpriteKind.Fireboy)
    fireboy.setScale(3)

    tiles.placeOnTile(fireboy, tiles.getTileLocation(2, 26))

    controller.player2.moveSprite(fireboy, 100, 0)
}

// Music
// music.stopAllSounds()
// music.play(music.createSong(assets.song`levelTheme`), music.PlaybackMode.LoopingInBackground)