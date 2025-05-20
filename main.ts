// Level setup
tiles.setCurrentTilemap(tilemap`level1`)

// Camera setup
namespace userconfig {
    export const ARCADE_SCREEN_WIDTH = 39 * 16
    export const ARCADE_SCREEN_HEIGHT = 29 * 16
}

namespace SpriteKind {
    export const Fireboy = SpriteKind.create()
    export const Watergirl = SpriteKind.create()

    export const Liquid = SpriteKind.create()
    export const Diamond = SpriteKind.create()

    export const Platform = SpriteKind.create()
    export const Lever = SpriteKind.create()
    export const Button = SpriteKind.create()
}

namespace player {
    function spriteMovement(
        sprite: Sprite,
        left: browserEvents.KeyButton,
        right: browserEvents.KeyButton,
        up: browserEvents.KeyButton,
        down: browserEvents.KeyButton
    ) {
        right.addEventListener(browserEvents.KeyEvent.Pressed, () => {
            sprite.vx = 100
        })
        right.addEventListener(browserEvents.KeyEvent.Repeat, () => {
            if (!left.isPressed()) {
                sprite.vx = 100
            }
        })
        right.addEventListener(browserEvents.KeyEvent.Released, () => {
            if (!left.isPressed()) {
                sprite.vx = 0
            }
        })
        left.addEventListener(browserEvents.KeyEvent.Pressed, () => {
            sprite.vx = -100
        })
        left.addEventListener(browserEvents.KeyEvent.Repeat, () => {
            if (!right.isPressed()) {
                sprite.vx = -100
            }
        })
        left.addEventListener(browserEvents.KeyEvent.Released, () => {
            if (!right.isPressed()) {
                sprite.vx = 0
            }
        })
        up.onEvent(browserEvents.KeyEvent.Pressed, () => {
            if (sprite.isHittingTile(CollisionDirection.Bottom)) {
                sprite.vy -= 185
            }
        })
        down.addEventListener(browserEvents.KeyEvent.Pressed, () => {
            // Toggle lever switch
            mover.instances.forEach(instance => {
                if (instance.activationType === 'lever') {
                    const leverToggle = instance.levers.some(lever =>
                        (lever.overlapsWith(fireboy) && sprite.kind() === SpriteKind.Fireboy)
                        || (lever.overlapsWith(watergirl) && sprite.kind() === SpriteKind.Watergirl)
                    )

                    if (leverToggle) {
                        instance.setActive(!instance.active)
                    }
                }
            })
        })
    }

    export function createFireboy (location: tiles.Location): Sprite {
        const fireboy = sprites.create(assets.image`fireboy`, SpriteKind.Player)
        fireboy.setKind(SpriteKind.Fireboy)
        fireboy.ay = 300

        tiles.placeOnTile(fireboy, location)
        spriteMovement(fireboy, browserEvents.ArrowLeft, browserEvents.ArrowRight, browserEvents.ArrowUp, browserEvents.ArrowDown)

        return fireboy
    }

    export function createWatergirl (location: tiles.Location): Sprite {
        const watergirl = sprites.create(assets.image`watergirl`, SpriteKind.Player)
        watergirl.setKind(SpriteKind.Watergirl)
        watergirl.ay = 300
        
        tiles.placeOnTile(watergirl, location)
        spriteMovement(watergirl, browserEvents.A, browserEvents.D, browserEvents.W, browserEvents.S)

        return watergirl
    } 
}

namespace liquid {
    // Internal sprite data
    type LiquidData = {
        killsFireboy?: boolean,
        killsWatergirl?: boolean
    }

    export function create (location: tiles.Location, liquidData: LiquidData, hideCollider = true) {
        const liquidSprite = sprites.create(assets.image`liquid`, SpriteKind.Liquid)
        liquidSprite.setFlag(SpriteFlag.Invisible, hideCollider)
        liquidSprite.data = {
            killsFireboy: liquidData.killsFireboy || false,
            killsWatergirl: liquidData.killsWatergirl || false
        } as LiquidData

        tiles.placeOnTile(liquidSprite, location)

        return liquidSprite
    }

    function playerCollision(playerSprite: Sprite, liquidSprite: Sprite) {
        const liquidData: LiquidData = liquidSprite.data

        if (
            (liquidData.killsFireboy && playerSprite.kind() === SpriteKind.Fireboy)
            || (liquidData.killsWatergirl && playerSprite.kind() === SpriteKind.Watergirl)
        ) {
            game.gameOver(false)
        }
    }

    sprites.onOverlap(SpriteKind.Fireboy, SpriteKind.Liquid, playerCollision)
    sprites.onOverlap(SpriteKind.Watergirl, SpriteKind.Liquid, playerCollision)
}

namespace diamond {
    export type DiamondType = 'fireboy' | 'watergirl'

    // Internal sprite data
    type DiamondData = {
        type: DiamondType,
        collected: boolean
    }

    // Sprite image variants
    type DiamondImagesType = {[K in DiamondType]: Image}
    const diamondImages: DiamondImagesType = {
        fireboy: assets.image`fireboy_diamond`,
        watergirl: assets.image`watergirl_diamond`
    }

    export function create (location: tiles.Location, type: DiamondType) {
        const diamondSprite = sprites.create(diamondImages[type], SpriteKind.Diamond)
        diamondSprite.data = {
            type: type,
            collected: false
        } as DiamondData

        tiles.placeOnTile(diamondSprite, location)
        animation.runMovementAnimation(diamondSprite, 'c 0s -7 0 7 0 0', 1500, true) // slightly modified bobbing in place anim

        return diamondSprite
    }

    function playerCollision(playerSprite: Sprite, diamondSprite: Sprite) {
        const diamondData: DiamondData = diamondSprite.data

        if (
            (diamondData.type === 'fireboy' && playerSprite.kind() === SpriteKind.Fireboy)
            || (diamondData.type === 'watergirl' && playerSprite.kind() === SpriteKind.Watergirl)
        ) {
            diamondData.collected = true

            diamondSprite.setFlag(SpriteFlag.Invisible, true)
        }
    }

    sprites.onOverlap(SpriteKind.Fireboy, SpriteKind.Diamond, playerCollision)
    sprites.onOverlap(SpriteKind.Watergirl, SpriteKind.Diamond, playerCollision)
}

namespace mover {    
    export const instances: Mover[] = []

    export class Mover {
        constructor (
            public readonly id: string,
            public readonly activationType: 'lever' | 'button',
            public readonly movementSpeed: number,
            protected readonly activeColor: color,
            protected readonly inactiveColor: color
        ) {
            // Add to created platforms
            instances.push(this)
        }

        // Class properties
        public active = false
        public platforms: Sprite[] = [] 
        public levers: Sprite[] = [] 
        public buttons: Sprite[] = []

        /** Generates the specific image to apply to sprite */
        getImage (type: 'platform' | 'lever' | 'button'): Image {
            let img: Image
            
            // Get base image for sprite
            switch (type) {
                case 'platform':
                    img = assets.image`platform`
                    break
                case 'lever':
                    img = this.active ? assets.image`lever_active` : assets.image`lever`
                    break
                case 'button':
                    img = assets.image`button`
                    break
            }

            // Replace conditional colour (inactive/active)
            img.replace(8, this.active ? this.activeColor : this.inactiveColor)

            // Replace active colour (always active)
            img.replace(7, this.activeColor)

            return img
        }

        /** Gets the tilemap positions of the walls when stationary */
        getWalls (): tiles.Location[][] {
            return this.platforms.map(platform => {
                const platformLocation = platform.tilemapLocation()

                return [
                    tiles.getTileLocation(platformLocation.col - 2, platformLocation.row),
                    tiles.getTileLocation(platformLocation.col - 1, platformLocation.row),
                    platformLocation,
                    tiles.getTileLocation(platformLocation.col + 1, platformLocation.row)
                ]
            })
        }

        setActive (state: boolean) {
            this.active = state

            // Update sprite images
            this.platforms.forEach(platform => platform.setImage(this.getImage('platform')))
            this.levers.forEach(lever => lever.setImage(this.getImage('lever')))
            this.buttons.forEach(button => button.setImage(this.getImage('button')))

            // Set platform velocity & ghost
            this.platforms.forEach(platform => {
                platform.vy = this.movementSpeed * (state ? 1 : -1)
                platform.setFlag(SpriteFlag.Ghost, false)
            })

            // Set platform walls
            this.getWalls().forEach(platformWalls => {
                platformWalls.forEach(wall => tiles.setWallAt(wall, false))
            })
        }

        createPlatform (location: tiles.Location) {
            const platformSprite = sprites.create(this.getImage('platform'), SpriteKind.Platform)
            
            tiles.placeOnTile(platformSprite, location)

            // Retain original platform location
            platformSprite.data = platformSprite.top

            this.platforms.push(platformSprite)

            return platformSprite
        }

        createLever(location: tiles.Location) {
            if (this.activationType !== 'lever') throw 'Unable to create lever as activation type is incompatible'

            const leverSprite = sprites.create(this.getImage('lever'), SpriteKind.Lever)

            tiles.placeOnTile(leverSprite, location)

            this.levers.push(leverSprite)

            return leverSprite
        }

        createButton(location: tiles.Location) {
            if (this.activationType !== 'button') throw 'Unable to create lever as activation type is incompatible'

            const buttonSprite = sprites.create(this.getImage('button'), SpriteKind.Button)

            tiles.placeOnTile(buttonSprite, location)

            this.buttons.push(buttonSprite)

            return buttonSprite
        }
    } 
}

game.onUpdate(() => {
    // Moving platforms
    mover.instances.forEach(instance => {
        // Button (momentary)
        if (instance.activationType === 'button') {
            const buttonOverlap = instance.buttons.some(button => button.overlapsWith(fireboy) || button.overlapsWith(watergirl))

            if (buttonOverlap) {
                instance.setActive(true)
            }
            else {
                instance.setActive(false)
            }
        }

        instance.platforms.forEach(platform => {
            // Stop platforms at their boundary (either top or bottom)
            const hitBoundary = instance.movementSpeed > 0 ? (platform.top < platform.data) : platform.top > platform.data

            if (!instance.active && hitBoundary) {
                // Set platform velocity & ghost
                platform.vy = 0
                platform.setFlag(SpriteFlag.Ghost, true)

                // Set platform walls
                instance.getWalls().forEach(platformWalls => {
                    platformWalls.forEach(wall => tiles.setWallAt(wall, true))
                })

                // Stop moving players
                const playerSprites = [fireboy, watergirl]

                playerSprites.forEach(playerSprite => {
                    playerSprite.ay = 300
                })
            }

            // Move player alongside platform
            if (!hitBoundary) {
                const playerSprites = [fireboy, watergirl]
    
                playerSprites.forEach(playerSprite => {
                    if (platform.overlapsWith(playerSprite)) {
                        playerSprite.ay = 0
                        playerSprite.y = platform.y - 30
                        playerSprite.vy = platform.vy
                        playerSprite.vx = platform.vx
                    }
                })
            }
        })

    })
})

sprites.onOverlap(SpriteKind.Player, SpriteKind.Platform, (playerSprite, platformSprite) => {
    game.gameOver(false)
    console.log(`${playerSprite.bottom} >= ${platformSprite.top}`)
    if (playerSprite.bottom >= platformSprite.top) playerSprite.y = platformSprite.top
})

// * Debug
browserEvents.MouseLeft.addEventListener(browserEvents.MouseButtonEvent.Pressed, (x, y) => fireboy.setPosition(x, y))
browserEvents.MouseRight.addEventListener(browserEvents.MouseButtonEvent.Pressed, (x, y) => watergirl.setPosition(x, y))

// Level setup
liquid.create(tiles.getTileLocation(20, 27), { killsWatergirl: true })
liquid.create(tiles.getTileLocation(28, 27), { killsFireboy: true })
liquid.create(tiles.getTileLocation(26, 21), { killsFireboy: true, killsWatergirl: true })

diamond.create(tiles.getTileLocation(20, 26), 'fireboy')
diamond.create(tiles.getTileLocation(28, 26), 'watergirl')
diamond.create(tiles.getTileLocation(7, 13), 'fireboy')
diamond.create(tiles.getTileLocation(23, 14), 'watergirl')
diamond.create(tiles.getTileLocation(2, 5), 'watergirl')
diamond.create(tiles.getTileLocation(11, 2), 'fireboy')
diamond.create(tiles.getTileLocation(23, 4), 'watergirl')

const yellowMover = new mover.Mover('yellow', 'lever', 20,  11, 12)
yellowMover.createPlatform(tiles.getTileLocation(3, 15))
yellowMover.createLever(tiles.getTileLocation(7, 19))

const purpleMover = new mover.Mover('purple', 'button', 20, 13, 14)
purpleMover.createPlatform(tiles.getTileLocation(36, 12))
purpleMover.createButton(tiles.getTileLocation(10, 14))
purpleMover.createButton(tiles.getTileLocation(30, 10))

const fireboy = player.createFireboy(tiles.getTileLocation(2, 26))
const watergirl = player.createWatergirl(tiles.getTileLocation(2, 22))

/* scene.onOverlapTile() */

// Music
music.stopAllSounds()
music.setVolume(0)
music.play(music.createSong(assets.song`levelTheme`), music.PlaybackMode.LoopingInBackground)

controller.B.onEvent(ControllerButtonEvent.Pressed, () => {
    if (music.volume() > 0) {
        music.setVolume(0)
        music.stopAllSounds()
    }
    else {
        music.setVolume(200)
        music.play(music.createSong(assets.song`levelTheme`), music.PlaybackMode.LoopingInBackground)
    }
})