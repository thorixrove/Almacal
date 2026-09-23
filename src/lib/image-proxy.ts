const IMG_PROXY = "https://almacal-img-proxy.vercel.app"

export function proxyImage(url: string) {
    return url.replace("https://ik.imagekit.io", IMG_PROXY)
}