namespace GamePlayers {
    // Players setup
    const watergirl = sprites.create(assets.image`watergirl`, SpriteKind.Player)
    watergirl.setScale(3)
    tiles.placeOnTile(watergirl, tiles.getTileLocation(2, 22))
    controller.player1.moveSprite(watergirl, 100, 0)

    const fireboy = sprites.create(assets.image`fireboy`, SpriteKind.Player)
    fireboy.setScale(3)
    tiles.placeOnTile(fireboy, tiles.getTileLocation(2, 26))
    controller.player2.moveSprite(fireboy, 100, 0)
}