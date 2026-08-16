import type {
    Camera,
    Point
} from "../types/canvas.types"

export const screenToWorld = (point: Point, camera: Camera): Point => {
    return{
        x: point.x / camera.zoom + camera.x,
        y: point.y / camera.zoom + camera.y
    }
}

export const worldToScreen = (point: Point, camera: Camera): Point => {
    return{
        x: (point.x - camera.x) * camera.zoom,
        y: (point.y - camera.y) * camera.zoom
    }
}