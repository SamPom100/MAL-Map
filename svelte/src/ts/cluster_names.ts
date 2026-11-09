export const CLUSTER_NAMES: { [hueKey: string]: string } = {
    "0.00": "Mind Games & Strategy",
    "11.25": "School Comedy & Slice of Life",
    "22.50": "Over-the-Top Action & Sci-Fi",
    "33.75": "Ecchi Comedy & Fantasy Harem",
    "45.00": "Isekai Fantasy & Adventure",
    "56.25": "Survival Horror & Dark Thrillers",
    "67.50": "Dark Fantasy & Gritty Action",
    "78.75": "Epic Action & Dark Shonen",
    "90.00": "Historical Drama & Mystery",
    "101.25": "Supernatural School & Shoujo",
    "112.50": "Wholesome Comedy & Music",
    "123.75": "Mecha & Dystopian Sci-Fi",
    "135.00": "High School Romance & Rom-Com",
    "146.25": "Dark Fantasy & Exploration",
    "157.50": "Psychological Thrillers & Time Travel",
    "168.75": "Drama & Bittersweet Romance",
    "180.00": "Monster Isekai & Reincarnation",
    "191.25": "Supernatural Horror & Mystery",
    "202.50": "Magic Academy & Battle Harem",
    "213.75": "Folklore Romance & Supernatural",
    "225.00": "Classic Shonen & Urban Action",
    "236.25": "Tactical Sci-Fi & Cyberpunk",
    "247.50": "Modern Rom-Com & Drama",
    "258.75": "Sports & School Drama",
    "270.00": "Supernatural Comedy & Monster Girls",
    "281.25": "Grand Adventure Shonen",
    "292.50": "VRMMO & Gaming Worlds",
    "303.75": "Classic Sci-Fi & Retro Action",
    "315.00": "Urban Supernatural & Avant-Garde",
    "326.25": "Whimsical Fantasy & Exploration",
    "337.50": "Modern Superpower Shonen",
    "348.75": "Supernatural Comedy & Parody",
};

export function getClusterName(hue: number): string {
    const key = (Math.round(hue * 100) / 100).toFixed(2);
    if (CLUSTER_NAMES[key]) {
        return CLUSTER_NAMES[key];
    }
    // Find closest hue key
    let closestKey = "0.00";
    let minDiff = 360;
    for (const k of Object.keys(CLUSTER_NAMES)) {
        const diff = Math.abs(parseFloat(k) - hue);
        if (diff < minDiff) {
            minDiff = diff;
            closestKey = k;
        }
    }
    return CLUSTER_NAMES[closestKey] || "Anime Cluster";
}
