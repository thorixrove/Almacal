
function authHeader() {
    const privateKey = process.env.IMAGEKIT_SECRET_KEY
    if (!privateKey) throw new Error("Add IMAGEKIT_SECRET_KEY to your .env file")
        return `Basic ${btoa(`${privateKey}:`)}`
}

export async function uploadToImageKit(base64: string, fileName: string) {
    const form = new FormData()
    form.append("file", base64)
    form.append("fileName", fileName)
    form.append("folder", "/meals")

    const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
        method: "POST",
        headers: { Authorization: authHeader()},
        body: form,
    })

    if (!response.ok) {
        throw new Error(`ImageKit upload failed (${response.status}): ${await response.text()}`)
    }

    const { url } = (await response.json()) as { url: string}
    return url
}

const PAGE = 1000
const BATCH = 100

export async function deleteUserImages(userId: string) {
    const fileIds: string[] = []

    for(let skip = 0; ; skip += PAGE) {
        const query = new URLSearchParams({
            searchQuery: `name : "meal-${userId}"`,
            limit: String(PAGE),
            skip: String(skip)
        })

        const response = await fetch('https://api.imagekit.io/v1/files?${query}', {
            headers: { Authorization: authHeader() },
        })

        if (!response.ok) {
            throw new Error(`ImageKit list failed (${response.status}): ${await response.text()}`)
        }

        const body = await response.json()
        const page: { fileId: string}[] = Array.isArray(body) ? body : (body?.assets ?? [])

        fileIds.push(...page.map((file) => file.fileId))
        if (page.length < PAGE) break
    }

    for (let i = 0; i < fileIds.length; i += BATCH) {
        const response = await fetch("https://api.imagekit.io/v1/files/batch/deleteByFileIds", {
            method: "POST",
            headers: { Authorization: authHeader(), "Content-Type": "application/json"},
            body: JSON.stringify({ fileIds: fileIds.slice(i, i + BATCH) }),
        })

        if (!response.ok) {
            throw new Error(`ImageKit delete failed (${response.status}): ${await response.text()}`)
        }
    }

    return fileIds.length
}