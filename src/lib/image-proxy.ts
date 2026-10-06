const IMG_PROXY = "https://almacal-img-proxy.vercel.app"

export function proxyImage(url: string): string
export function proxyImage(url: null | undefined): null
export function proxyImage(url: string | null | undefined) {
    if (!url) return null
    return url.replace("https://ik.imagekit.io", IMG_PROXY)
}