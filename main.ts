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

    export const Block = SpriteKind.create()
    export const BlockBoundary = SpriteKind.create()
    export const BlockDest = SpriteKind.create()

    export const Platform = SpriteKind.create()
    export const Lever = SpriteKind.create()
    export const Button = SpriteKind.create()

    export const Door = SpriteKind.create()
    export const DoorSensor = SpriteKind.create()

    export const WatergirlGuideText = SpriteKind.create()
    export const FireboyGuideText = SpriteKind.create()
}

namespace timer {
    const frameSprite = sprites.create(assets.image`timer_frame`)
    frameSprite.setScale(1.675)
    frameSprite.setPosition(screen.width / 2, 28)
    frameSprite.setFlag(SpriteFlag.Invisible, true)

    const timerSpriteOutline = fancyText.create('00:00', null, 3, fancyText.gothic_large)
    const timerSprite = fancyText.create('00:00', null, 10, fancyText.gothic_large)

    timerSprite.setPosition(screen.width / 2, 20)
    timerSprite.setFlag(SpriteFlag.Invisible, true)
    
    timerSpriteOutline.setPosition(timerSprite.x + 2, timerSprite.y + 2)
    // timerSpriteOutline.x += 2
    // timerSpriteOutline.y += 2
    timerSpriteOutline.setFlag(SpriteFlag.Invisible, true)

    let startedTimer = false
    let timerOffset = 0

    game.onUpdateInterval(1000, () => {
        if (!player.movementEnabled || !player.allSpritesMoved) return

        if (!startedTimer) {
            startedTimer = true
            timerOffset = game.runtime()

            frameSprite.setFlag(SpriteFlag.Invisible, false)
            timerSprite.setFlag(SpriteFlag.Invisible, false)
            timerSpriteOutline.setFlag(SpriteFlag.Invisible, false)
        }

        const secs = (game.runtime() - timerOffset) / 1000

        const timerSecs = Math.floor(secs % 60)
        const timerMins = Math.floor(secs / 60)

        const timerText = `${timerMins.toString().length < 2 ? '0' : ''}${timerMins.toString()}:${timerSecs.toString().length < 2 ? '0' : ''}${timerSecs.toString()}`

        timerSprite.setText(timerText)
        timerSpriteOutline.setText(timerText)
    })
}

namespace player {
    export let movementEnabled = false

    function spriteMovement(
        sprite: Sprite,
        left: browserEvents.KeyButton,
        right: browserEvents.KeyButton,
        up: browserEvents.KeyButton,
        down: browserEvents.KeyButton
    ) {
        right.addEventListener(browserEvents.KeyEvent.Pressed, () => {
            if (movementEnabled) {
                sprite.vx = 110

                startedMoving(sprite)
            }
        })
        right.addEventListener(browserEvents.KeyEvent.Repeat, () => {
            if (movementEnabled) {
                if (!left.isPressed()) {
                    sprite.vx = 110
                }
            }
        })
        right.addEventListener(browserEvents.KeyEvent.Released, () => {
            if (movementEnabled) {
                if (!left.isPressed()) {
                    sprite.vx = 0
                }
            }
        })
        left.addEventListener(browserEvents.KeyEvent.Pressed, () => {
            if (movementEnabled) {
                sprite.vx = -110

                startedMoving(sprite)
            }
        })
        left.addEventListener(browserEvents.KeyEvent.Repeat, () => {
            if (movementEnabled) {
                if (!right.isPressed()) {
                    sprite.vx = -110
                }
            }
        })
        left.addEventListener(browserEvents.KeyEvent.Released, () => {
            if (movementEnabled) {
                if (!right.isPressed()) {
                    sprite.vx = 0
                }
            }
        })
        up.onEvent(browserEvents.KeyEvent.Pressed, () => {
            if (movementEnabled) {
                if (sprite.isHittingTile(CollisionDirection.Bottom)) {
                    sprite.vy -= 185
                }

                startedMoving(sprite)
            }
        })
        down.addEventListener(browserEvents.KeyEvent.Pressed, () => {
            if (movementEnabled) {
                // Toggle lever switch
                mover.instances.forEach(instance => {
                    instance.levers.forEach(lever => {
                        if (
                            (lever.overlapsWith(fireboy) && sprite.kind() === SpriteKind.Fireboy)
                            || (lever.overlapsWith(watergirl) && sprite.kind() === SpriteKind.Watergirl)
                        ) {
                            // Update lever state
                            lever.data = {
                                active: !lever.data.active
                            } as mover.LeverData
                        }
    
                        instance.triggerUpdate()
                    })
                })
            }
        })
    }

    let spritesMoved: { [key: number]: boolean } = {}
    export let allSpritesMoved = false

    function startedMoving(sprite: Sprite) {
        if (allSpritesMoved) return

        spritesMoved[sprite.kind()] = true

        // Remove guide text
        if (sprite.kind() === SpriteKind.Watergirl) {
            sprites.allOfKind(SpriteKind.WatergirlGuideText)
                .forEach((sprite, index) => {
                    if (index === 0) {
                        sprite.destroy(effects.warmRadial, 175)
                    }
                    else {
                        setTimeout(() => sprite.destroy(), 175)
                    }
                })
        }
        else if (sprite.kind() === SpriteKind.Fireboy) {
            sprites.allOfKind(SpriteKind.FireboyGuideText)
                .forEach((sprite, index) => {
                    if (index === 0) {
                        sprite.destroy(effects.warmRadial, 175)
                    }
                    else {
                        setTimeout(() => sprite.destroy(), 175)
                    }
                })
        }

        // Check if both sprites have moved so far
        if (Object.keys(spritesMoved).length >= 2) {
            allSpritesMoved = true

            Zoom.zoomToOffset(1, 0, screen.height, 1375)
        }
    }

    export function createFireboy (location: tiles.Location): Sprite {
        const fireboy = sprites.create(assets.image`fireboy`, SpriteKind.Player)
        fireboy.setKind(SpriteKind.Fireboy)
        fireboy.ay = 300

        tiles.placeOnTile(fireboy, location)
        spriteMovement(fireboy, browserEvents.ArrowLeft, browserEvents.ArrowRight, browserEvents.ArrowUp, browserEvents.ArrowDown)

        // Guide text
        const fireboyGoldGuideText = fancyText.create('TO MOVE FireBoy', null, 10, fancyText.geometric_serif_11)
        fireboyGoldGuideText.setLineHeight(20)
        fireboyGoldGuideText.setPosition(130, screen.height - 50)
        fireboyGoldGuideText.setKind(SpriteKind.FireboyGuideText)
        
        const fireboyBlueGuideText = fancyText.create('Left,Up,Right,Down', null, 8, fancyText.geometric_serif_11)
        fireboyBlueGuideText.setLineHeight(20)
        fireboyBlueGuideText.setPosition(130, screen.height - 30)
        fireboyBlueGuideText.setKind(SpriteKind.FireboyGuideText)

        return fireboy
    }

    export function createWatergirl (location: tiles.Location): Sprite {
        const watergirl = sprites.create(assets.image`watergirl`, SpriteKind.Player)
        watergirl.setKind(SpriteKind.Watergirl)
        watergirl.ay = 300
        
        tiles.placeOnTile(watergirl, location)
        spriteMovement(watergirl, browserEvents.A, browserEvents.D, browserEvents.W, browserEvents.S)

        // Guide text
        const watergirlGoldGuideText = fancyText.create('USE A,W,D,S TO', null, 10, fancyText.geometric_serif_11)
        watergirlGoldGuideText.setLineHeight(20)
        watergirlGoldGuideText.setPosition(130, screen.height - 113)
        watergirlGoldGuideText.setKind(SpriteKind.WatergirlGuideText)

        const watergirlGoldGuideText2 = fancyText.create('MOVE WaterGirl...', null, 10, fancyText.geometric_serif_11)
        watergirlGoldGuideText2.setLineHeight(20)
        watergirlGoldGuideText2.setPosition(130, screen.height - 93)
        watergirlGoldGuideText2.setKind(SpriteKind.WatergirlGuideText)
        
        const watergirlBlueGuideText = fancyText.create('A,W,D,S', null, 8, fancyText.geometric_serif_11)
        watergirlBlueGuideText.setLineHeight(20)
        watergirlBlueGuideText.setPosition(134, screen.height - 113)
        watergirlBlueGuideText.setKind(SpriteKind.WatergirlGuideText)

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

namespace block {
    export function create (location: tiles.Location, destinations: tiles.Location[], boundaries: tiles.Location[], hideCollider = true) {
        const blockSprite = sprites.create(assets.image`block`, SpriteKind.Block)
        blockSprite.ay = 1000
        
        tiles.placeOnTile(blockSprite, location)
        
        // Create block boundaries & destinations
        boundaries.forEach(boundary => createBoundary(boundary, hideCollider))
        destinations.forEach(dest => createDestination(dest, hideCollider))

        return blockSprite
    }

    function createBoundary (location: tiles.Location, hideCollider = true) {
        const boundarySprite = sprites.create(assets.image`block_boundary`, SpriteKind.BlockBoundary)
        boundarySprite.setFlag(SpriteFlag.Invisible, hideCollider)
        
        tiles.placeOnTile(boundarySprite, location)
        
        return boundarySprite
    }
    
    function createDestination (location: tiles.Location, hideCollider = true) {
        const destSprite = sprites.create(assets.image`block_boundary`, SpriteKind.BlockDest)
        destSprite.setFlag(SpriteFlag.Invisible, hideCollider)

        tiles.placeOnTile(destSprite, location)

        return destSprite
    }

    function playerCollision(playerSprite: Sprite, blockSprite: Sprite) {
        const blockX = blockSprite.x
        const blockY = blockSprite.y

        // Push block
        if (playerSprite.right <= (blockSprite.left + 17)) {
            blockSprite.setPosition(blockX + 5, blockY)
        }
        else if (playerSprite.left <= (blockSprite.right - 17)) {
            blockSprite.setPosition(blockX - 5, blockY)
        }

        // Overlaps with boundary
        if (sprites.allOfKind(SpriteKind.BlockBoundary).some(sprite => sprite.overlapsWith(blockSprite))) {
            blockSprite.setPosition(blockX, blockY)
        }

        // Overlaps with destination
        else if (sprites.allOfKind(SpriteKind.BlockDest).some(sprite => sprite.overlapsWith(blockSprite))) {
            blockSprite.setPosition(blockX, blockY)
            blockSprite.setFlag(SpriteFlag.GhostThroughSprites, true)

            blockSprite.ay = 0
            blockSprite.vy = 0
            
            const blockLocation = blockSprite.tilemapLocation()

            const blockWalls = [
                blockLocation,
                tiles.getTileLocation(blockLocation.col - 1, blockLocation.row),
                tiles.getTileLocation(blockLocation.col, blockLocation.row - 1),
                tiles.getTileLocation(blockLocation.col - 1, blockLocation.row - 1)
            ]
            blockWalls.forEach(wall => tiles.setWallAt(wall, true))
        }
    }

    sprites.onOverlap(SpriteKind.Fireboy, SpriteKind.Block, playerCollision)
    sprites.onOverlap(SpriteKind.Watergirl, SpriteKind.Block, playerCollision)
}

namespace mover {    
    export type LeverData = {
        active: boolean
    }

    export const instances: Mover[] = []

    export class Mover {
        constructor (
            public readonly id: string,
            public readonly movementSpeed: number,
            protected readonly activeColor: color,
            protected readonly inactiveColor: color
        ) {
            // Add to created instances
            instances.push(this)
        }

        // Class properties
        public active = false
        public platforms: Sprite[] = [] 
        public levers: Sprite[] = [] 
        public buttons: Sprite[] = []

        /** Generates the specific image to apply to sprite */
        getImage (type: 'platform' | 'lever' | 'button', active?: boolean): Image {
            let imageActive = (active !== undefined) ? active : this.active
            
            let img: Image
            
            // Get base image for sprite
            switch (type) {
                case 'platform':
                    img = assets.image`platform`
                    break
                case 'lever':
                    img = imageActive ? assets.image`lever_active` : assets.image`lever`
                    break
                case 'button':
                    img = assets.image`button`
                    break
            }
            
            // Replace conditional colour (inactive/active)
            img.replace(8, imageActive ? this.activeColor : this.inactiveColor)
            
            // Replace active colour (always active)
            img.replace(7, this.activeColor)
            
            return img
        }

        /** Sets the tilemap positions of the stationary platform walls */
        setWalls (enabled: boolean) {
            const walls = this.platforms.map(platform => {
                const platformLocation = platform.tilemapLocation()

                return [
                    tiles.getTileLocation(platformLocation.col - 2, platformLocation.row),
                    tiles.getTileLocation(platformLocation.col - 1, platformLocation.row),
                    platformLocation,
                    tiles.getTileLocation(platformLocation.col + 1, platformLocation.row)
                ]
            })
            
            walls.forEach(platformWalls => {
                platformWalls.forEach(wall => tiles.setWallAt(wall, enabled))
            })
        }

        triggerUpdate () {
            // Triggers
            const buttonOverlap = this.buttons.some(button => button.overlapsWith(fireboy) || button.overlapsWith(watergirl))

            if (buttonOverlap || this.levers.some(lever => lever.data.active === true)) {
                this.setActive(true)
            }
            else {
                this.setActive(false)
            }
        }

        setActive (state: boolean) {
            this.active = state

            // Update sprite images
            this.platforms.forEach(platform => platform.setImage(this.getImage('platform')))
            this.levers.forEach(lever => lever.setImage(this.getImage('lever', lever.data.active)))
            this.buttons.forEach(button => button.setImage(this.getImage('button')))

            // Set platform velocity & ghost
            this.platforms.forEach(platform => {
                platform.vy = this.movementSpeed * (state ? 1 : -1)
                platform.setFlag(SpriteFlag.Ghost, false)
            })

            this.setWalls(false)
        }

        createPlatform (location: tiles.Location) {
            const platformSprite = sprites.create(this.getImage('platform'), SpriteKind.Platform)
            platformSprite.setFlag(SpriteFlag.Ghost, true)
            
            tiles.placeOnTile(platformSprite, location)

            // Retain original platform location
            platformSprite.data = platformSprite.top

            this.platforms.push(platformSprite)

            return platformSprite
        }

        createLever(location: tiles.Location) {
            const leverSprite = sprites.create(this.getImage('lever'), SpriteKind.Lever)
            leverSprite.data = {
                active: false
            } as LeverData

            tiles.placeOnTile(leverSprite, location)

            this.levers.push(leverSprite)

            return leverSprite
        }

        createButton(location: tiles.Location) {
            const buttonSprite = sprites.create(this.getImage('button'), SpriteKind.Button)

            tiles.placeOnTile(buttonSprite, location)

            this.buttons.push(buttonSprite)

            return buttonSprite
        }
    } 
}

namespace door {
    export type DoorType = 'fireboy' | 'watergirl'
    export type DoorData = {
        type: DoorType
    }

    export const instances: Door[] = []

    export class Door {
        constructor(
            public readonly location: tiles.Location,
            public readonly type: DoorType
        ) {
            // Add to created instances
            instances.push(this)

            this.createDoor(location, type)
        }

        // Class properties
        public doorSprite: Sprite
        public sensorSprite: Sprite

        public opened = false
        public animating = false

        createDoor (location: tiles.Location, type: DoorType) {
            const doorSprite = sprites.create(image.create(48, 48), SpriteKind.Door)
            doorSprite.data = {
                type: type
            } as DoorData
            
            switch (type) {
                case 'fireboy':
                    doorSprite.setImage(assets.image`fireboy_door`)
                    break
                case 'watergirl':
                    doorSprite.setImage(assets.image`watergirl_door`)
                    break
            }
            
            tiles.placeOnTile(doorSprite, location)
            
            // Create player sensor
            this.createSensor(tiles.getTileLocation(location.col, location.row + 1), type)
    
            this.doorSprite = doorSprite

            return this.doorSprite
        }
    
        createSensor (location: tiles.Location, type: DoorType) {
            const sensorSprite = sprites.create(assets.image`door_sensor`, SpriteKind.DoorSensor)
            sensorSprite.setFlag(SpriteFlag.Invisible, true)
    
            sensorSprite.data = {
                type: type
            } as DoorData
    
            tiles.placeOnTile(sensorSprite, location)
            
            this.sensorSprite = sensorSprite

            return this.sensorSprite
        }

        overlapStatus () {
            return playerSprites.some(playerSprite => this.sensorSprite.overlapsWith(playerSprite))
        }

        handleAnim (overlap: boolean) {
            // Continue ongoing animation
            if (overlap === this.opened || this.animating) return

            let frames: Image[]

            switch (this.type) {
                case 'fireboy':
                    frames = animSeq.fireboy_door.slice()
                    break
                
                case 'watergirl':
                    frames = animSeq.watergirl_door.slice()
                    break
            }

            if (!overlap) frames.reverse()
            
            this.opened = overlap
            this.animating = true

            animation.stopAnimation(animation.AnimationTypes.ImageAnimation, this.doorSprite)
            animation.runImageAnimation(this.doorSprite, frames, 55)

            control.runInParallel(() => {
                pause(55 * frames.length)
                this.animating = false
            })
        }
    }
}

game.onUpdate(() => {
    // Moving platforms
    mover.instances.forEach(instance => {
        instance.triggerUpdate()

        instance.platforms.forEach(platform => {
            // Stop platforms at their boundary (either top or bottom)
            const hitBoundary = instance.movementSpeed > 0 ? (platform.top < platform.data) : platform.top > platform.data

            if (!instance.active && hitBoundary) {
                // Set platform velocity & ghost
                platform.vy = 0
                platform.setFlag(SpriteFlag.Ghost, true)

                // Set walls in place of platform
                instance.setWalls(true)
            }

            // Move player alongside platform
            if (!hitBoundary) {
                playerSprites.forEach(playerSprite => {
                    if (platform.overlapsWith(playerSprite)) {
                        playerSprite.y = platform.y - 30
                        playerSprite.vy = platform.vy
                    }
                })
            }
        })
    })

    // Doors
    door.instances.forEach(instance => {
        const activatedDoor = playerSprites.some(playerSprite => {
            if (instance.sensorSprite.overlapsWith(playerSprite)) {
                if (
                    (instance.type === 'fireboy' && playerSprite.kind() === SpriteKind.Fireboy)
                    || (instance.type === 'watergirl' && playerSprite.kind() === SpriteKind.Watergirl)
                ) {
                    return true
                }
                
                return false
            }
            
            return false
        })

        instance.handleAnim(activatedDoor)
    })

    // Level completion
    if (door.instances.every(instance => instance.opened && !instance.animating && instance.overlapStatus())) {
        player.movementEnabled = false

        const fireboyDoor = door.instances.find(instance => instance.type === 'fireboy').sensorSprite
        const watergirlDoor = door.instances.find(instance => instance.type === 'watergirl').sensorSprite

        tiles.placeOnTile(fireboy, tiles.getTileLocation(fireboyDoor.tilemapLocation().col, fireboyDoor.tilemapLocation().row - 1))
        tiles.placeOnTile(watergirl, tiles.getTileLocation(watergirlDoor.tilemapLocation().col, fireboyDoor.tilemapLocation().row - 1))

        playerSprites.forEach(playerSprite => {
            playerSprite.ay = 0
            playerSprite.setVelocity(0, 0)
            
            control.runInParallel(() => {
                for (let i = 0; i < 10; i++) {
                    playerSprite.changeScale(-0.1)
                    playerSprite.y += 5
                    pause(200)
                }
            })
        })

        control.runInParallel(() => {
            pauseUntil(() => door.instances.every(instance => !instance.opened && !instance.animating))
            game.gameOver(true)
        })
    }

    // Slopes
    playerSprites.forEach(playerSprite => {
        if (playerSprite.tileKindAt(TileDirection.Bottom, assets.tile`down_slope1`)) {
            playerSprite.x -= 16
            playerSprite.y -= 16
        }
        else if (playerSprite.tileKindAt(TileDirection.Bottom, assets.tile`down_slope2`)) {
            playerSprite.x -= 16
            playerSprite.y -= 16
        }
        else if (playerSprite.tileKindAt(TileDirection.Bottom, assets.tile`up_slope`)) {
            playerSprite.x += 16
            playerSprite.y -= 16
        }
    })
})

// * Debug
browserEvents.MouseLeft.addEventListener(browserEvents.MouseButtonEvent.Pressed, (x, y) => fireboy.setPosition(x, y))
browserEvents.MouseRight.addEventListener(browserEvents.MouseButtonEvent.Pressed, (x, y) => watergirl.setPosition(x, y))

// Level setup
tiles.setCurrentTilemap(tilemap`level1`)

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

block.create(
    tiles.getTileLocation(23, 9),
    [tiles.getTileLocation(5, 9)],
    [tiles.getTileLocation(30, 8), tiles.getTileLocation(20, 10)]
)

const yellowMover = new mover.Mover('yellow', 20,  11, 12)
yellowMover.createPlatform(tiles.getTileLocation(3, 15))
yellowMover.createLever(tiles.getTileLocation(7, 19))

const purpleMover = new mover.Mover('purple', 20, 13, 14)
purpleMover.createPlatform(tiles.getTileLocation(36, 12))
purpleMover.createButton(tiles.getTileLocation(10, 14))
purpleMover.createButton(tiles.getTileLocation(30, 10))

new door.Door(tiles.getTileLocation(32, 4), 'fireboy')
new door.Door(tiles.getTileLocation(36, 4), 'watergirl')

const fireboy = player.createFireboy(tiles.getTileLocation(2, 26))
const watergirl = player.createWatergirl(tiles.getTileLocation(2, 22))
const playerSprites = [watergirl, fireboy]

// Music
control.runInParallel(() => {   
    music.stopAllSounds()
    music.setVolume(0)
    pause(600)

    // Fade in
    for (let i = 40; i <= 200; i += 40) {
        music.stopAllSounds()
        music.setVolume(i)
        music.play(music.createSong(assets.song`levelTheme`), music.PlaybackMode.LoopingInBackground)
        pause(1000)
    }
})

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

// Zoom into level
Zoom.zoomToOffset(0.9, screen.width / 2, screen.height / 2)
pause(750)
Zoom.zoomToOffset(1, screen.width / 2, screen.height / 2, 750)
if (!controller.A.isPressed()) {
    pause(500)
    Zoom.zoomToOffset(3, 0, screen.height, 2750)
}
player.movementEnabled = true