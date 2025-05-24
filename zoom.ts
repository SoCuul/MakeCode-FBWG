// Thanks to https://github.com/kiwiphoenix364/pxt-zoom for base implementation

namespace Zoom {
    export let startSize = 1
    export let currentSize = 1

    let x = 0
    let y = 0
    let memsize1 = 0
    
    export function zoomToOffset(size: number, anchorX: number, anchorY: number, ms = 25) {
        if (ms < 25) ms = 25
        
        memsize1 = size - startSize
        
        for (let i = 0; i < (ms / 25); i++) {
            startSize += memsize1 / (ms / 25)
            x = anchorX - startSize * anchorX
            y = anchorY - startSize * anchorY
            
            pause(25)
        }

        currentSize = size
    }

    export function zoomOutFromOffset(startSize: number, anchorX: number, anchorY: number, duration: number) {
        startSize = startSize
        zoomToOffset(1, anchorX, anchorY, duration)
    }

    // Write zoomed image to screen buffer
    scene.createRenderable(1, (image: Image) => {
        let screenClone = image.clone()

        image.fillRect(0, 0, screen.width, screen.height, 0)

        helpers.imageBlit(
            image, x, y, screen.width * startSize, screen.height * startSize,
            screenClone, 0, 0, screen.width, screen.height,
            true,
            false
        )
    })
}